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

  const hangUp = useCallback(async () => {
    if (!roomId) return;
  
    localStream?.getTracks().forEach(track => track.stop());
  
    pcs.current.forEach(pc => pc.close());
    pcs.current.clear();
  
    setLocalStream(null);
    setRemoteStreams(new Map());
  
    if (roomId) {
        const roomRef = doc(db, 'rooms', roomId);
        const roomDocSnap = await getDoc(roomRef);

        if (roomDocSnap.exists()) {
            const participants = roomDocSnap.data().participants || [];
            if (participants.length <= 1) {
                // If I am the last one, delete the whole room and subcollections
                const batch = writeBatch(db);
                
                const iceCandidatesRef = collection(roomRef, 'iceCandidates');
                const iceCandidatesSnap = await getDocs(iceCandidatesRef);
                iceCandidatesSnap.forEach(doc => batch.delete(doc.ref));

                const messagesRef = collection(roomRef, 'messages');
                const messagesSnap = await getDocs(messagesRef);
                messagesSnap.forEach(doc => batch.delete(doc.ref));

                batch.delete(roomRef);
                await batch.commit();
            } else {
                // Otherwise, just remove myself
                const updates: {[key:string]: any} = {
                    participants: participants.filter((pId: string) => pId !== userId),
                };
                updates[`offers.${userId}`] = deleteField();
                updates[`answers.${userId}`] = deleteField();
                await updateDoc(roomRef, updates);
            }
        }
    }
    
    router.push('/');
  }, [roomId, localStream, userId, router]);

  // Get user media
  useEffect(() => {
    if (!roomId || !localUserName) return;
    
    let isMounted = true;
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if(isMounted) {
            originalVideoTrack.current = stream.getVideoTracks()[0].clone();
            setLocalStream(stream);
        }
      } catch (error) {
        console.error('Error accessing media devices.', error);
        toast({
          title: 'Media Access Denied',
          description: 'Could not access camera and microphone. Please check permissions.',
          variant: 'destructive',
        });
        if(isMounted) router.push('/');
      }
    };

    startMedia();
    
    const chatQuery = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp'));
    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
      const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
      if (isMounted) setChatMessages(messages);
    });

    const handleBeforeUnload = () => {
      hangUp();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isMounted = false;
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
            await setDoc(roomRef, { participants: [], offers: {}, answers: {} });
        }
        // Add self to participants
        const participants = roomDoc.data()?.participants || [];
        if (!participants.includes(userId)) {
            await updateDoc(roomRef, { participants: [...participants, userId] });
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

        const localIceCandidatesCollection = collection(doc(collection(roomRef, 'iceCandidates'), userId), 'candidates');
        const remoteIceCandidatesCollection = collection(doc(collection(roomRef, 'iceCandidates'), remoteUserId), 'candidates');
        
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                addDoc(remoteIceCandidatesCollection, event.candidate.toJSON());
            }
        };

        const unsubscribeIce = onSnapshot(localIceCandidatesCollection, (snapshot) => {
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

    const unsubscribeRoom = onSnapshot(roomRef, async (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        const remoteParticipants = (data.participants || []).filter((pId: string) => pId !== userId);

        // Call new participants
        for (const remoteUserId of remoteParticipants) {
          if (!pcs.current.has(remoteUserId)) {
            const pc = createPeerConnection(remoteUserId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            const offerPayload = { [userId]: { type: offer.type, sdp: offer.sdp, to: remoteUserId } };
            await updateDoc(roomRef, { offers: { ...data.offers, ...offerPayload } });
          }
        }

        // Handle offers for me
        const offersForMe = Object.entries(data.offers || {}).filter(([, offer]: any) => offer.to === userId);
        for (const [offererId, offer]: [string, any] of offersForMe) {
          const pc = createPeerConnection(offererId);
          if (pc.signalingState === 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            const answerPayload = { [userId]: { type: answer.type, sdp: answer.sdp, to: offererId }};
            const offerUpdate = { ...data.offers };
            delete offerUpdate[offererId];

            await updateDoc(roomRef, { 
              answers: { ...data.answers, ...answerPayload },
              offers: offerUpdate,
            });
          }
        }

        // Handle answers for me
        const answersForMe = Object.entries(data.answers || {}).filter(([, answer]: any) => answer.to === userId);
        for (const [answererId, answer]: [string, any] of answersForMe) {
            const pc = pcs.current.get(answererId);
            if (pc && pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));

                const answerUpdate = { ...data.answers };
                delete answerUpdate[answererId];
                await updateDoc(roomRef, { answers: answerUpdate });
            }
        }
    });

    return () => {
        unsubscribeRoom();
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
  
    const stopScreenShare = () => {
      if (!localStream || !originalVideoTrack.current) return;
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack.getSettings().displaySurface) {
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
    };
  
    if (isScreenSharing) {
      stopScreenShare();
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
          stopScreenShare();
        };
      } catch(err) {
        console.error("Screen share failed: ", err);
        toast({ title: 'Screen Share Failed', description: 'Could not start screen sharing.', variant: 'destructive' });
        // If screen share fails, revert to the original camera track
        stopScreenShare();
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
