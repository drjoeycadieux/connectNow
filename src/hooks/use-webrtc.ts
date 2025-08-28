'use client';

import { db } from '@/lib/firebase';
import type { ChatMessage } from '@/types';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  where,
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
  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const userId = useMemo(() => crypto.randomUUID(), []);
  const { toast } = useToast();
  const router = useRouter();
  const originalVideoTrack = useRef<MediaStreamTrack | null>(null);

  const hangUp = useCallback(async () => {
    if (!roomId) return;
  
    localStream?.getTracks().forEach(track => track.stop());
  
    pcs.current.forEach(pc => pc.close());
    pcs.current.clear();

    setLocalStream(null);
    setRemoteStreams(new Map());

    const userRef = doc(db, 'rooms', roomId, 'users', userId);
    await deleteDoc(userRef).catch(e => console.error("Error removing user:", e));
  
    router.push('/');
  }, [roomId, localStream, userId, router]);

  // Get user media
  useEffect(() => {
    if (!roomId || !localUserName) return;
    
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        originalVideoTrack.current = stream.getVideoTracks()[0].clone();
        setLocalStream(stream);
      } catch (error) {
        console.error('Error accessing media devices.', error);
        toast({
          title: 'Media Access Denied',
          description: 'Could not access camera and microphone. Please check permissions.',
          variant: 'destructive',
        });
        router.push('/');
      }
    };

    startMedia();
    
    let unsubscribeChat: () => void;
    if (roomId) {
      const chatQuery = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp'));
      unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
        const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
        setChatMessages(messages);
      });
    }

    const handleBeforeUnload = () => {
      hangUp();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      hangUp();
      if (unsubscribeChat) unsubscribeChat();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, localUserName, hangUp, toast, router]);

  // Main WebRTC Logic
  useEffect(() => {
    if (!localStream || !roomId) return;

    const userRef = doc(db, 'rooms', roomId, 'users', userId);
    setDoc(userRef, { name: localUserName, id: userId, joinedAt: serverTimestamp() });

    const createPeerConnection = (remoteUserId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(servers);

      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });

      pc.ontrack = (event) => {
        setRemoteStreams(prev => new Map(prev).set(remoteUserId, event.streams[0]));
      };

      const iceCandidatesCollection = collection(userRef, 'iceCandidates');
      const remoteIceCandidatesCollection = collection(doc(db, 'rooms', roomId, 'users', remoteUserId), 'iceCandidates');

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(remoteIceCandidatesCollection, { ...event.candidate.toJSON(), from: userId });
        }
      };

      onSnapshot(query(iceCandidatesCollection, where('from', '==', remoteUserId)), (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
            await deleteDoc(change.doc.ref);
          }
        });
      });

      pcs.current.set(remoteUserId, pc);
      return pc;
    };

    const usersCollectionRef = collection(db, 'rooms', roomId, 'users');
    const unsubscribeUsers = onSnapshot(usersCollectionRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const remoteUserId = change.doc.id;
        if (remoteUserId === userId) return;

        if (change.type === 'added') {
          const pc = createPeerConnection(remoteUserId);
          const offerDescription = await pc.createOffer();
          await pc.setLocalDescription(offerDescription);

          const offer = {
            sdp: offerDescription.sdp,
            type: offerDescription.type,
          };
          const offerDocRef = doc(collection(doc(db, 'rooms', roomId, 'users', remoteUserId), 'offers'));
          await setDoc(offerDocRef, { offer, from: userId });
        } else if (change.type === 'removed') {
          pcs.current.get(remoteUserId)?.close();
          pcs.current.delete(remoteUserId);
          setRemoteStreams(prev => {
            const newStreams = new Map(prev);
            newStreams.delete(remoteUserId);
            return newStreams;
          });
        }
      });
    });

    const offersCollectionRef = collection(userRef, 'offers');
    const unsubscribeOffers = onSnapshot(offersCollectionRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const { offer, from: remoteUserId } = change.doc.data();
          const pc = createPeerConnection(remoteUserId);
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answerDescription = await pc.createAnswer();
          await pc.setLocalDescription(answerDescription);

          const answer = {
            type: answerDescription.type,
            sdp: answerDescription.sdp,
          };

          const answerDocRef = doc(collection(doc(db, 'rooms', roomId, 'users', remoteUserId), 'answers'));
          await setDoc(answerDocRef, { answer, from: userId });
          await deleteDoc(change.doc.ref);
        }
      });
    });

    const answersCollectionRef = collection(userRef, 'answers');
    const unsubscribeAnswers = onSnapshot(answersCollectionRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const { answer, from: remoteUserId } = change.doc.data();
          const pc = pcs.current.get(remoteUserId);
          if (pc && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
          await deleteDoc(change.doc.ref);
        }
      });
    });

    return () => {
      unsubscribeUsers();
      unsubscribeOffers();
      unsubscribeAnswers();
    };
  }, [localStream, roomId, userId, localUserName]);

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
    if (!localStream || !originalVideoTrack.current) return;

    if (isScreenSharing) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.stop();
      localStream.removeTrack(videoTrack);
      localStream.addTrack(originalVideoTrack.current);

      pcs.current.forEach(connection => {
        const sender = connection.getSenders().find(s => s.track?.kind === 'video');
        sender?.replaceTrack(originalVideoTrack.current);
      });
      originalVideoTrack.current = originalVideoTrack.current.clone();
      setIsScreenSharing(false);
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        const currentVideoTrack = localStream.getVideoTracks()[0];
        
        localStream.removeTrack(currentVideoTrack);
        localStream.addTrack(screenTrack);
        currentVideoTrack.stop();

        pcs.current.forEach(connection => {
          const sender = connection.getSenders().find(s => s.track?.kind === 'video');
          sender?.replaceTrack(screenTrack);
        });
        setIsScreenSharing(true);

        screenTrack.onended = () => {
          if (isScreenSharing) {
            toggleScreenSharing();
          }
        };
      } catch(err) {
        console.error("Screen share failed: ", err);
        toast({ title: 'Screen Share Failed', description: 'Could not start screen sharing.', variant: 'destructive' });
      }
    }
  }, [isScreenSharing, localStream, toast]);
  
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
