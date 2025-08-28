'use client';

import { db } from '@/lib/firebase';
import type { ChatMessage } from '@/types';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export const useWebRTC = (roomId: string | null, localUserName: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const pc = useRef<Map<string, RTCPeerConnection>>(new Map());
  const userId = useMemo(() => crypto.randomUUID(), []);
  const { toast } = useToast();
  const router = useRouter();
  const originalVideoTrack = useRef<MediaStreamTrack | null>(null);
  const cleanupPerformed = useRef(false);


  const cleanup = useCallback(async () => {
    if (cleanupPerformed.current) return;
    cleanupPerformed.current = true;

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    pc.current.forEach((connection) => connection.close());
    pc.current.clear();
    setRemoteStreams(new Map());

    if (!roomId) return;
    
    const participantDocId = `${userId}_${localUserName}`;
    const participantRef = doc(db, 'rooms', roomId, 'participants', participantDocId);

    try {
        const collections = ['offers', 'answers', 'presence'];
        for (const coll of collections) {
            const collRef = collection(participantRef, coll);
            const snapshot = await getDocs(collRef);
            const batch = writeBatch(db);
            snapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
        }
        await deleteDoc(participantRef);
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }, [localStream, roomId, userId, localUserName]);

  useEffect(() => {
    if (!roomId || !localUserName) return;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        originalVideoTrack.current = stream.getVideoTracks()[0];
        setLocalStream(stream);
        
        const participantDocRef = doc(db, 'rooms', roomId, 'participants', `${userId}_${localUserName}`);
        const presenceCollectionRef = collection(participantDocRef, 'presence');
        await addDoc(presenceCollectionRef, { joinedAt: serverTimestamp() });

      } catch (error) {
        console.error('Error accessing media devices.', error);
        toast({
          title: 'Media Error',
          description: 'Could not access camera and microphone. Please check permissions.',
          variant: 'destructive',
        });
        router.push('/');
      }
    };

    start();

    const chatQuery = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp'));
    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
      const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
      setChatMessages(messages);
    });
    
    const handleBeforeUnload = () => cleanup();
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cleanup();
      unsubscribeChat();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, userId, localUserName, toast, router, cleanup]);

  const createPeerConnection = useCallback((remoteUserId: string, remoteUserName: string) => {
    if (!roomId || !localStream || !localUserName || pc.current.has(remoteUserId)) return;
    
    const connection = new RTCPeerConnection(servers);
    pc.current.set(remoteUserId, connection);
    
    localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));

    connection.ontrack = (event) => {
        setRemoteStreams((prev) => new Map(prev).set(remoteUserId, event.streams[0]));
    };

    const localParticipantDocRef = doc(db, 'rooms', roomId, 'participants', `${userId}_${localUserName}`);
    const remoteParticipantDocRef = doc(db, 'rooms', roomId, 'participants', `${remoteUserId}_${remoteUserName}`);

    connection.onicecandidate = async (event) => {
        if (event.candidate) {
            const iceCandidatesCollection = collection(remoteParticipantDocRef, `iceCandidatesFrom_${userId}`);
            await addDoc(iceCandidatesCollection, event.candidate.toJSON());
        }
    };

    onSnapshot(collection(localParticipantDocRef, `iceCandidatesFrom_${remoteUserId}`), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                connection.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            }
        });
    });

    return connection;
  }, [roomId, localStream, userId, localUserName]);


  // Effect for handling new participants and initiating offers
  useEffect(() => {
    if (!roomId || !localStream || !localUserName) return;
    
    const participantsQuery = query(collection(db, 'rooms', roomId, 'participants'));

    const unsubscribe = onSnapshot(participantsQuery, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            const [remoteUserId, remoteUserName] = change.doc.id.split('_');
            if (remoteUserId === userId) return;

            if (change.type === 'added') {
                const connection = createPeerConnection(remoteUserId, remoteUserName);
                if (connection) {
                    const offerCollection = collection(doc(db, 'rooms', roomId, 'participants', change.doc.id), 'offers');
                    const offer = await connection.createOffer();
                    await connection.setLocalDescription(offer);
                    await addDoc(offerCollection, { ...offer.toJSON(), from: userId });
                }
            } else if (change.type === 'removed') {
                pc.current.get(remoteUserId)?.close();
                pc.current.delete(remoteUserId);
                setRemoteStreams((prev) => {
                    const newStreams = new Map(prev);
                    newStreams.delete(remoteUserId);
                    return newStreams;
                });
            }
        });
    });

    return unsubscribe;
  }, [roomId, localStream, userId, localUserName, createPeerConnection]);

  // Effect for listening to offers and creating answers
  useEffect(() => {
    if (!roomId || !localStream || !localUserName) return;

    const localParticipantDocRef = doc(db, 'rooms', roomId, 'participants', `${userId}_${localUserName}`);
    const offersQuery = query(collection(localParticipantDocRef, 'offers'));

    const unsubscribe = onSnapshot(offersQuery, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const offerData = change.doc.data();
                const remoteUserId = offerData.from;
                const remoteUserDoc = (await getDocs(query(collection(db, 'rooms', roomId, 'participants'))))
                                        .docs.find(d => d.id.startsWith(remoteUserId));
                if (!remoteUserDoc) return;
                const remoteUserName = remoteUserDoc.id.split('_')[1];

                const connection = createPeerConnection(remoteUserId, remoteUserName);
                if (connection && connection.signalingState === 'stable') {
                    await connection.setRemoteDescription(new RTCSessionDescription(offerData));
                    const answer = await connection.createAnswer();
                    await connection.setLocalDescription(answer);

                    const answerCollection = collection(doc(db, 'rooms', roomId, 'participants', remoteUserDoc.id), 'answers');
                    await addDoc(answerCollection, { ...answer.toJSON(), from: userId });
                }
            }
        });
    });
    return unsubscribe;
  }, [roomId, localStream, userId, localUserName, createPeerConnection]);

  // Effect for listening to answers
  useEffect(() => {
    if (!roomId || !localStream || !localUserName) return;
    
    const localParticipantDocRef = doc(db, 'rooms', roomId, 'participants', `${userId}_${localUserName}`);
    const answersQuery = query(collection(localParticipantDocRef, 'answers'));

    const unsubscribe = onSnapshot(answersQuery, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const answerData = change.doc.data();
                const remoteUserId = answerData.from;
                const connection = pc.current.get(remoteUserId);
                if (connection && connection.signalingState !== 'stable') {
                    await connection.setRemoteDescription(new RTCSessionDescription(answerData));
                }
            }
        });
    });
    return unsubscribe;
  }, [roomId, localStream, userId, localUserName]);


  const hangUp = useCallback(() => {
    cleanup();
    router.push('/');
  }, [cleanup, router]);

  const toggleMute = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsMuted((prev) => !prev);
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsCameraOff((prev) => !prev);
  }, [localStream]);

  const toggleScreenSharing = useCallback(async () => {
    if (!localStream) return;

    if (isScreenSharing) {
      // Stop screen sharing
      const screenTrack = localStream.getVideoTracks()[0];
      screenTrack.stop();

      if (originalVideoTrack.current) {
        localStream.removeTrack(screenTrack);
        localStream.addTrack(originalVideoTrack.current);
        pc.current.forEach(connection => {
            const sender = connection.getSenders().find(s => s.track?.kind === 'video');
            sender?.replaceTrack(originalVideoTrack.current);
        });
        setIsScreenSharing(false);
        setIsCameraOff(false); // Assume camera comes back on
      }
    } else {
      // Start screen sharing
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = stream.getVideoTracks()[0];
      originalVideoTrack.current = localStream.getVideoTracks()[0];
      
      localStream.removeTrack(originalVideoTrack.current);
      localStream.addTrack(screenTrack);

      pc.current.forEach(connection => {
        const sender = connection.getSenders().find(s => s.track?.kind === 'video');
        sender?.replaceTrack(screenTrack);
      });
      setIsScreenSharing(true);

      screenTrack.onended = () => {
        // User clicked "Stop sharing" in browser UI
        if(originalVideoTrack.current){
          localStream.removeTrack(screenTrack);
          localStream.addTrack(originalVideoTrack.current);
          pc.current.forEach(connection => {
            const sender = connection.getSenders().find(s => s.track?.kind === 'video');
            sender?.replaceTrack(originalVideoTrack.current);
          });
          setIsScreenSharing(false);
          setIsCameraOff(false);
        }
      };
    }
  }, [isScreenSharing, localStream]);
  
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !roomId) return;
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      userId,
      name: localUserName,
      message,
      timestamp: serverTimestamp(),
    });
  }, [roomId, userId, localUserName]);

  const isSomeoneElseScreenSharing = useMemo(() => 
    [...remoteStreams.values()].some(stream => 
      stream.getVideoTracks().some(track => track.getSettings().displaySurface)
    ), 
  [remoteStreams]);

  return {
    userId,
    localStream,
    remoteStreams,
    isMuted,
    isCameraOff,
    isScreenSharing,
    chatMessages,
    hangUp,
    toggleMute,
    toggleCamera,
    toggleScreenSharing,
    sendMessage,
    isSomeoneElseScreenSharing,
  };
};
