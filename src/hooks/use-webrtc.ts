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
  writeBatch,
  updateDoc,
  setDoc,
  getDoc,
  deleteDoc,
  getDocs,
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
    
    const chatQuery = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp'));
    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
      const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
      setChatMessages(messages);
    });

    const handleBeforeUnload = () => {
      hangUp();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      hangUp();
      unsubscribeChat();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, localUserName]);


  const createPeerConnection = useCallback((remoteUserId: string) => {
    if (!roomId) return null;

    const pc = new RTCPeerConnection(servers);
    const userRef = doc(db, 'rooms', roomId, 'users', userId);
    const remoteUserRef = doc(db, 'rooms', roomId, 'users', remoteUserId);

    // Add local stream tracks to the peer connection
    localStream?.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

    // Handle incoming remote tracks
    pc.ontrack = (event) => {
      setRemoteStreams(prev => new Map(prev).set(remoteUserId, event.streams[0]));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(collection(remoteUserRef, 'iceCandidates'), {
          ...event.candidate.toJSON(),
          from: userId,
        });
      }
    };
    
    // Listen for remote ICE candidates
    const iceCandidatesUnsubscribe = onSnapshot(
      query(collection(userRef, 'iceCandidates'), where => where('from', '==', remoteUserId)),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            await pc.addIceCandidate(candidate);
            await deleteDoc(change.doc.ref);
          }
        });
      }
    );

    // Clean up listeners when connection closes
    pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'closed' || pc.connectionState === 'failed') {
            iceCandidatesUnsubscribe();
        }
    };
    
    return pc;
  }, [localStream, roomId, userId]);

  // Main WebRTC Logic
  useEffect(() => {
    if (!localStream || !roomId) return;

    const userRef = doc(db, 'rooms', roomId, 'users', userId);
    setDoc(userRef, { name: localUserName, id: userId, joinedAt: serverTimestamp() });

    const usersCollectionRef = collection(db, 'rooms', roomId, 'users');

    const unsubscribeUsers = onSnapshot(usersCollectionRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const remoteUserId = change.doc.id;
        if (remoteUserId === userId) return;

        if (change.type === 'added') {
          // A new user has joined
          const pc = createPeerConnection(remoteUserId);
          if (pc) {
            pcs.current.set(remoteUserId, pc);
            // Create offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const remoteUserRef = doc(db, 'rooms', roomId, 'users', remoteUserId);
            await addDoc(collection(remoteUserRef, 'offers'), { offer, from: userId });
          }
        } else if (change.type === 'removed') {
          // A user has left
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

    // Signaling logic
    const offersCollectionRef = collection(userRef, 'offers');
    const answersCollectionRef = collection(userRef, 'answers');

    const unsubscribeOffers = onSnapshot(offersCollectionRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const { offer, from: remoteUserId } = change.doc.data();
          const pc = createPeerConnection(remoteUserId);
          if (pc) {
            pcs.current.set(remoteUserId, pc);
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            const remoteUserRef = doc(db, 'rooms', roomId, 'users', remoteUserId);
            await addDoc(collection(remoteUserRef, 'answers'), { answer, from: userId });
          }
          await deleteDoc(change.doc.ref);
        }
      });
    });

    const unsubscribeAnswers = onSnapshot(answersCollectionRef, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const { answer, from } = change.doc.data();
            const pc = pcs.current.get(from);
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
  }, [localStream, roomId, userId, localUserName, createPeerConnection]);

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
      const videoTrack = localStream.getVideoTracks()[0];
      if (originalVideoTrack.current) {
        videoTrack.stop();
        localStream.removeTrack(videoTrack);
        localStream.addTrack(originalVideoTrack.current);

        pcs.current.forEach(connection => {
            const sender = connection.getSenders().find(s => s.track?.kind === 'video');
            sender?.replaceTrack(originalVideoTrack.current);
        });
        originalVideoTrack.current = originalVideoTrack.current.clone();
        setIsScreenSharing(false);
      }
    } else {
      // Start screen sharing
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
          // This will trigger if the user stops sharing from the browser UI
          toggleScreenSharing(); 
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