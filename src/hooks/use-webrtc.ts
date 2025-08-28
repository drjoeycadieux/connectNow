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
  setDoc,
  deleteField,
  updateDoc,
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
  
  const cleanup = useCallback(async () => {
    if (!roomId) return;
  
    // Stop local media tracks
    localStream?.getTracks().forEach(track => track.stop());
  
    // Close all peer connections
    pcs.current.forEach(pc => pc.close());
    pcs.current.clear();

    setLocalStream(null);
    setRemoteStreams(new Map());

    // Remove user from Firestore
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      [`participants.${userId}`]: deleteField()
    }).catch(e => console.error("Error removing participant from room:", e));

    // Cleanup ICE candidates
    const iceCandidatesSnapshot = await getDocs(collection(roomRef, 'iceCandidates'));
    const batch = writeBatch(db);
    iceCandidatesSnapshot.forEach(doc => {
      if (doc.id.startsWith(userId) || doc.id.endsWith(`_from_${userId}`)) {
        batch.delete(doc.ref);
      }
    });
    await batch.commit().catch(e => console.error("Error cleaning up ICE candidates:", e));
  
  }, [roomId, localStream, userId]);


  // Initialize user media
  useEffect(() => {
    if (!roomId || !localUserName) return;
    
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        originalVideoTrack.current = stream.getVideoTracks()[0];
        setLocalStream(stream);
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

    // Setup cleanup on component unmount or page close
    const handleBeforeUnload = () => {
        if(roomId && userId) {
            const roomRef = doc(db, 'rooms', roomId);
            updateDoc(roomRef, {
                [`participants.${userId}`]: deleteField()
            });
        }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      cleanup();
      unsubscribeChat();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, localUserName, userId, toast, router, cleanup]);


  // Main WebRTC connection logic
  useEffect(() => {
    if (!roomId || !localStream) return;

    const roomRef = doc(db, 'rooms', roomId);

    // 1. Announce presence and listen for other participants
    const unsubscribe = onSnapshot(roomRef, async (roomSnap) => {
      if (!roomSnap.exists()) {
        await setDoc(roomRef, { participants: {} });
        return;
      }
      
      const data = roomSnap.data();
      const participants = data.participants || {};
      
      // Update our own presence
      if (!participants[userId]) {
        updateDoc(roomRef, {
          [`participants.${userId}`]: { name: localUserName, joinedAt: serverTimestamp() }
        });
      }

      const remoteUserIds = Object.keys(participants).filter(id => id !== userId);

      // 2. For each remote user, create a peer connection
      for (const remoteUserId of remoteUserIds) {
        if (!pcs.current.has(remoteUserId)) {
          const pc = new RTCPeerConnection(servers);
          pcs.current.set(remoteUserId, pc);

          // Add local tracks to the connection
          localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

          // Handle incoming remote stream
          pc.ontrack = (event) => {
            setRemoteStreams(prev => new Map(prev).set(remoteUserId, event.streams[0]));
          };

          // Handle ICE candidates
          pc.onicecandidate = async (event) => {
            if (event.candidate) {
              const candidateDoc = doc(roomRef, 'iceCandidates', `${userId}_to_${remoteUserId}`);
              await addDoc(collection(candidateDoc, 'candidates'), event.candidate.toJSON());
            }
          };

          // Listen for ICE candidates from the remote peer
          const iceCandidatesRef = collection(roomRef, 'iceCandidates', `${remoteUserId}_to_${userId}`, 'candidates');
          onSnapshot(iceCandidatesRef, (snapshot) => {
            snapshot.docChanges().forEach(change => {
              if (change.type === 'added') {
                pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
              }
            });
          });
        }
      }

      // 3. Handle offers and answers
      const pc = pcs.current.get(remoteUserIds[0]); // Simplified for now
      if (pc) {
        // Caller creates offer
        if (Object.keys(participants).indexOf(userId) < Object.keys(participants).indexOf(remoteUserIds[0])) {
            if (pc.signalingState === 'stable') {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                await updateDoc(roomRef, { [`offers.${userId}`]: { offer, to: remoteUserIds[0] } });
            }
        }

        // Listen for offers
        if (data.offers && data.offers[remoteUserIds[0]]?.to === userId) {
            if (pc.signalingState === 'have-remote-offer' || (pc.signalingState === 'stable' && !pc.currentRemoteDescription)) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offers[remoteUserIds[0]].offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await updateDoc(roomRef, { [`answers.${userId}`]: { answer, to: remoteUserIds[0] } });
            }
        }
        
        // Listen for answers
        if (data.answers && data.answers[remoteUserIds[0]]?.to === userId) {
            if (pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answers[remoteUserIds[0]].answer));
            }
        }
      }

      // Cleanup disconnected users
      pcs.current.forEach((pc, id) => {
        if (!remoteUserIds.includes(id)) {
          pc.close();
          pcs.current.delete(id);
          setRemoteStreams(prev => {
            const newStreams = new Map(prev);
            newStreams.delete(id);
            return newStreams;
          });
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
        pcs.current.forEach(connection => {
            const sender = connection.getSenders().find(s => s.track?.kind === 'video');
            sender?.replaceTrack(originalVideoTrack.current);
        });
        setIsScreenSharing(false);
        setIsCameraOff(false); // Assume camera comes back on
      }
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = stream.getVideoTracks()[0];
        
        if (originalVideoTrack.current) {
          localStream.removeTrack(originalVideoTrack.current);
        }
        originalVideoTrack.current = localStream.getVideoTracks()[0] || null;
        localStream.addTrack(screenTrack);

        pcs.current.forEach(connection => {
          const sender = connection.getSenders().find(s => s.track?.kind === 'video');
          sender?.replaceTrack(screenTrack);
        });
        setIsScreenSharing(true);

        screenTrack.onended = () => {
          // User clicked "Stop sharing" in browser UI
          if(originalVideoTrack.current){
            localStream.removeTrack(screenTrack);
            localStream.addTrack(originalVideoTrack.current);
            pcs.current.forEach(connection => {
              const sender = connection.getSenders().find(s => s.track?.kind === 'video');
              sender?.replaceTrack(originalVideoTrack.current);
            });
            setIsScreenSharing(false);
            setIsCameraOff(false);
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
