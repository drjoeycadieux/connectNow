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
  getDoc,
  writeBatch,
  getDocs,
  deleteField,
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
  
    if (roomId) {
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      if (roomDoc.exists()) {
        const participants = roomDoc.data().participants || [];
        if (participants.length === 1 && participants[0] === userId) {
          // If I am the last one, delete the whole room
          const messageDocs = await getDocs(collection(roomRef, 'messages'));
          const batch = writeBatch(db);
          messageDocs.forEach(d => batch.delete(d.ref));
          batch.delete(roomRef);
          await batch.commit();
        } else {
          // Otherwise, just remove myself
          await setDoc(roomRef, {
            participants: participants.filter((pId: string) => pId !== userId),
            [`offers.${userId}`]: deleteField(),
            [`answers.${userId}`]: deleteField(),
          }, { merge: true });
        }
      }
    }
    
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

  // Main WebRTC Logic
  useEffect(() => {
    if (!localStream || !roomId) return;

    const roomRef = doc(db, 'rooms', roomId);

    const init = async () => {
      const roomDoc = await getDoc(roomRef);
      if (!roomDoc.exists()) {
        await setDoc(roomRef, { participants: [userId], offers: {}, answers: {} });
      } else {
        const data = roomDoc.data();
        await setDoc(roomRef, { participants: [...(data.participants || []), userId] }, { merge: true });
      }
    };
    init();
    
    const createPeerConnection = (remoteUserId: string): RTCPeerConnection => {
        if (pcs.current.has(remoteUserId)) {
            return pcs.current.get(remoteUserId)!;
        }

        const pc = new RTCPeerConnection(servers);
        pcs.current.set(remoteUserId, pc);

        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });

        pc.ontrack = (event) => {
            setRemoteStreams(prev => new Map(prev).set(remoteUserId, event.streams[0]));
        };

        const iceCandidatesCollection = collection(roomRef, 'iceCandidates', userId, 'candidates');
        const remoteIceCandidatesCollection = collection(roomRef, 'iceCandidates', remoteUserId, 'candidates');
        
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                addDoc(remoteIceCandidatesCollection, event.candidate.toJSON());
            }
        };

        onSnapshot(iceCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                    await deleteDoc(change.doc.ref);
                }
            });
        });

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed' || pc.connectionState === 'failed') {
            pc.close();
            pcs.current.delete(remoteUserId);
            setRemoteStreams(prev => {
              const newStreams = new Map(prev);
              newStreams.delete(remoteUserId);
              return newStreams;
            });
          }
        };

        return pc;
    };

    const unsubscribe = onSnapshot(roomRef, async (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        const remoteParticipants = (data.participants || []).filter((pId: string) => pId !== userId);

        // Call new participants
        for (const remoteUserId of remoteParticipants) {
          if (!pcs.current.has(remoteUserId)) {
            const pc = createPeerConnection(remoteUserId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            await setDoc(roomRef, { offers: { [userId]: { type: offer.type, sdp: offer.sdp, to: remoteUserId } } }, { merge: true });
          }
        }

        // Handle offers for me
        const myOffers = Object.entries(data.offers || {}).filter(([, offer]: any) => offer.to === userId);
        for (const [offererId, offer]: [string, any] of myOffers) {
          const pc = createPeerConnection(offererId);
          if (pc.signalingState === 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await setDoc(roomRef, { 
              answers: { [userId]: { type: answer.type, sdp: answer.sdp, to: offererId } },
              offers: { [offererId]: deleteField() }
            }, { merge: true });
          }
        }

        // Handle answers for me
        const myAnswers = Object.entries(data.answers || {}).filter(([, answer]: any) => answer.to === userId);
        for (const [answererId, answer]: [string, any] of myAnswers) {
            const pc = pcs.current.get(answererId);
            if (pc && pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                await setDoc(roomRef, { answers: { [answererId]: deleteField() } }, { merge: true });
            }
        }
    });

    return () => {
        unsubscribe();
    };
  }, [localStream, roomId, userId]);

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
          // Check if we are still in screen sharing mode before toggling.
          // The user might have already stopped it manually.
          if (pcs.current.size > 0) { // a bit of a hack to check if we are still in a call
            const currentVideoTrack = localStream.getVideoTracks()[0];
            if (currentVideoTrack.getSettings().displaySurface) {
               toggleScreenSharing();
            }
          }
        };
      } catch(err) {
        console.error("Screen share failed: ", err);
        toast({ title: 'Screen Share Failed', description: 'Could not start screen sharing.', variant: 'destructive' });
      }
    }
  }, [isScreenSharing, localStream, toast, toggleScreenSharing]);
  
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
