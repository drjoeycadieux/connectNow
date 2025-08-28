'use client';

import { db } from '@/lib/firebase';
import type { ChatMessage } from '@/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
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

export const useWebRTC = (roomId: string, localUserName: string) => {
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

  const cleanup = useCallback(async () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    pc.current.forEach((connection) => connection.close());
    pc.current.clear();
    setRemoteStreams(new Map());

    if (!roomId) return;

    const roomRef = doc(db, 'rooms', roomId);
    const participantsQuery = query(collection(roomRef, 'participants'));
    const participantsSnapshot = await getDocs(participantsQuery);

    const batch = writeBatch(db);
    participantsSnapshot.forEach((participantDoc) => {
      if (participantDoc.id.startsWith(userId)) {
        batch.delete(participantDoc.ref);
      }
    });
    await batch.commit();
  }, [localStream, roomId, userId]);

  useEffect(() => {
    if (!roomId) return;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        originalVideoTrack.current = stream.getVideoTracks()[0];
        setLocalStream(stream);

        const roomRef = doc(db, 'rooms', roomId);
        const participantRef = doc(roomRef, 'participants', `${userId}_${localUserName}`);
        await addDoc(collection(participantRef, 'dummy'), {}); // Firestore doesn't allow empty docs
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

    // Setup chat listener
    const chatQuery = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp'));
    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
      const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
      setChatMessages(messages);
    });
    
    window.addEventListener('beforeunload', cleanup);

    return () => {
      cleanup();
      unsubscribeChat();
      window.removeEventListener('beforeunload', cleanup);
    };
  }, [roomId, userId, localUserName, toast, router, cleanup]);

  useEffect(() => {
    if (!localStream || !roomId) return;

    const roomRef = doc(db, 'rooms', roomId);
    const participantsQuery = query(collection(roomRef, 'participants'));

    const unsubscribe = onSnapshot(participantsQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const [remoteUserId, remoteUserName] = change.doc.id.split('_');

        if (remoteUserId === userId) return;

        if (change.type === 'added') {
          if (pc.current.has(remoteUserId)) return;

          const connection = new RTCPeerConnection(servers);
          pc.current.set(remoteUserId, connection);

          localStream.getTracks().forEach((track) => connection.addTrack(track, localStream));

          connection.ontrack = (event) => {
            setRemoteStreams((prev) => new Map(prev).set(remoteUserId, event.streams[0]));
          };

          const offerCollection = collection(change.doc.ref, 'offers');
          const answerCollection = collection(doc(roomRef, 'participants', change.doc.id), 'answers');

          connection.onicecandidate = async (event) => {
            if (event.candidate) {
              const candidateCollection = collection(doc(roomRef, 'participants', change.doc.id), `iceCandidatesFrom_${userId}`);
              await addDoc(candidateCollection, event.candidate.toJSON());
            }
          };

          onSnapshot(collection(doc(roomRef, 'participants', `${userId}_${localUserName}`), `iceCandidatesFrom_${remoteUserId}`), (iceSnapshot) => {
            iceSnapshot.docChanges().forEach((iceChange) => {
              if (iceChange.type === 'added') {
                connection.addIceCandidate(new RTCIceCandidate(iceChange.doc.data()));
              }
            });
          });

          onSnapshot(query(collection(doc(roomRef, 'participants', `${userId}_${localUserName}`), 'offers')), async (offerSnapshot) => {
            offerSnapshot.docChanges().forEach(async (offerChange) => {
                if (offerChange.type === 'added' && offerChange.doc.id === remoteUserId) {
                    const offerDescription = new RTCSessionDescription(offerChange.doc.data());
                    await connection.setRemoteDescription(offerDescription);
                    const answerDescription = await connection.createAnswer();
                    await connection.setLocalDescription(answerDescription);

                    await addDoc(collection(doc(roomRef, 'participants', change.doc.id), 'answers'), {
                        ...answerDescription.toJSON(),
                        from: userId,
                    });
                }
            });
          });

          const offer = await connection.createOffer();
          await connection.setLocalDescription(offer);
          await addDoc(offerCollection, { ...offer.toJSON(), from: userId });
          
          onSnapshot(query(collection(doc(roomRef, 'participants', `${userId}_${localUserName}`), 'answers')), async (answerSnapshot) => {
            answerSnapshot.docChanges().forEach(async (answerChange) => {
                if(answerChange.type === 'added' && answerChange.doc.data().from === remoteUserId) {
                    const answerDescription = new RTCSessionDescription(answerChange.doc.data());
                    if (connection.signalingState !== 'stable') {
                        await connection.setRemoteDescription(answerDescription);
                    }
                }
            });
          });
        }

        if (change.type === 'removed') {
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
  }, [localStream, roomId, userId, localUserName]);

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
