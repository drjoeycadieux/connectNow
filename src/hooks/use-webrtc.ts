
'use client';

import { auth, db } from '@/lib/firebase';
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
import { onAuthStateChanged, User } from 'firebase/auth';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Extend MediaStream to hold peerName
interface NamedMediaStream extends MediaStream {
    peerName?: string;
}

export const useWebRTC = (roomId: string | null, localUserName: string) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, NamedMediaStream>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState<User | null>(null);
  
  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map());
  const userId = useMemo(() => user?.uid || crypto.randomUUID(), [user]);
  const { toast } = useToast();
  const router = useRouter();
  const originalVideoTrack = useRef<MediaStreamTrack | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push(`/auth?joinRoomId=${roomId}`);
      }
    });
    return () => unsubscribe();
  }, [roomId, router]);


  const hangUp = useCallback(async () => {
    if (!roomId) {
        router.push('/');
        return;
    }
  
    localStream?.getTracks().forEach(track => track.stop());
  
    pcs.current.forEach(pc => pc.close());
    pcs.current.clear();
  
    setRemoteStreams(new Map());
  
    const roomRef = doc(db, 'rooms', roomId);
    const roomDocSnap = await getDoc(roomRef);

    if (roomDocSnap.exists()) {
        const participants = roomDocSnap.data().participants || {};
        const participantIds = Object.keys(participants);

        if (participantIds.length <= 1 && participantIds.includes(userId)) {
            // I am the last one, delete the whole room
            const batch = writeBatch(db);
            
            const iceCandidatesCollectionRef = collection(roomRef, 'iceCandidates');
            const iceCandidatesSnap = await getDocs(iceCandidatesCollectionRef);
            for (const userIceDoc of iceCandidatesSnap.docs) {
                 const candidatesSubCollectionRef = collection(userIceDoc.ref, 'candidates');
                 const candidatesSnap = await getDocs(candidatesSubCollectionRef);
                 candidatesSnap.forEach(subDoc => batch.delete(subDoc.ref));
                 batch.delete(userIceDoc.ref);
            }

            const messagesRef = collection(roomRef, 'messages');
            const messagesSnap = await getDocs(messagesRef);
            messagesSnap.forEach(doc => batch.delete(doc.ref));

            batch.delete(roomRef);
            await batch.commit();

        } else {
            // Just leave the room
            const updates: {[key:string]: any} = {};
            updates[`participants.${userId}`] = deleteField();
            updates[`offers.${userId}`] = deleteField();
            updates[`answers.${userId}`] = deleteField();
            await updateDoc(roomRef, updates);
        }
    }
    
    router.push('/');
  }, [roomId, localStream, userId, router]);

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
        if (track.getSettings().displaySurface) return; // Don't disable screen share track
        track.enabled = !track.enabled;
    });
    setIsCameraOff((prev) => !prev);
  }, [localStream]);

 const toggleScreenSharing = useCallback(async () => {
    if (!localStream) return;

    const stopSharing = () => {
        if (isScreenSharing && originalVideoTrack.current) {
            const screenTrack = localStream.getVideoTracks().find(t => t.getSettings().displaySurface);
            if (screenTrack) {
                screenTrack.stop();
                localStream.removeTrack(screenTrack);
            }
            
            localStream.addTrack(originalVideoTrack.current);
            pcs.current.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                sender?.replaceTrack(originalVideoTrack.current);
            });
            originalVideoTrack.current = null;
            setIsScreenSharing(false);
            setIsCameraOff(false); // Re-enable camera view
        }
    };

    if (isScreenSharing) {
        stopSharing();
    } else {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = displayStream.getVideoTracks()[0];
            
            const currentVideoTrack = localStream.getVideoTracks().find(t => !t.getSettings().displaySurface);
            if (currentVideoTrack) {
                originalVideoTrack.current = currentVideoTrack;
                localStream.removeTrack(currentVideoTrack);
            }

            localStream.addTrack(screenTrack);

            pcs.current.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                sender?.replaceTrack(screenTrack);
            });

            setIsScreenSharing(true);
            screenTrack.onended = stopSharing; // Stop sharing when user clicks the browser's "Stop sharing" button
        } catch (err) {
            console.error("Screen share failed: ", err);
            toast({ title: 'Screen Share Failed', description: 'Could not start screen sharing.', variant: 'destructive' });
        }
    }
}, [localStream, toast, isScreenSharing]);


  useEffect(() => {
    if (!roomId || !localUserName || !user) return;
    
    let isMounted = true;
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if(isMounted) {
            audioTrackRef.current = stream.getAudioTracks()[0];
            setLocalStream(stream);
        }
      } catch (error) {
        console.error('Error accessing media devices.', error);
        toast({
          title: 'Media Access Denied',
          description: 'Could not access camera and microphone. Joining without them.',
          variant: 'destructive',
        });
        if (isMounted) {
          const stream = new MediaStream();
          setLocalStream(stream);
        }
      }
    };

    startMedia();
    
    return () => {
      isMounted = false;
    };
  }, [roomId, localUserName, toast, user]);

   useEffect(() => {
    if (!roomId) return;
    const chatQuery = query(collection(db, 'rooms', roomId, 'messages'), orderBy('timestamp'));
    const unsubscribeChat = onSnapshot(chatQuery, (snapshot) => {
        const messages = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage));
        setChatMessages(messages);
    });
    return () => unsubscribeChat();
   }, [roomId]);


  // Main WebRTC Logic
  useEffect(() => {
    if (!localStream || !roomId || !user) return;

    const roomRef = doc(db, 'rooms', roomId);

    const init = async () => {
      const roomDoc = await getDoc(roomRef);
      if (!roomDoc.exists()) {
        await setDoc(roomRef, { participants: {}, offers: {}, answers: {} }, { merge: true });
      }
      await updateDoc(roomRef, { [`participants.${userId}`]: localUserName });
    };
    init();

    const createPeerConnection = (remoteUserId: string, remoteUserName: string): RTCPeerConnection => {
        if (pcs.current.has(remoteUserId)) {
            return pcs.current.get(remoteUserId)!;
        }

        const pc = new RTCPeerConnection(servers);
        pcs.current.set(remoteUserId, pc);

        if (localStream.getTracks().length > 0) {
          localStream.getTracks().forEach(track => {
            try {
              pc.addTrack(track, localStream);
            } catch(e) {
              console.warn("Could not add track", e)
            }
          });
        }

        pc.ontrack = (event) => {
            const stream = event.streams[0] as NamedMediaStream;
            stream.peerName = remoteUserName;
            setRemoteStreams(prev => new Map(prev).set(remoteUserId, stream));
        };

        const localIceCandidatesCollection = collection(roomRef, 'iceCandidates', userId, 'candidates');
        const remoteIceCandidatesCollection = collection(roomRef, 'iceCandidates', remoteUserId, 'candidates');
        
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                addDoc(remoteIceCandidatesCollection, event.candidate.toJSON());
            }
        };

        onSnapshot(localIceCandidatesCollection, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
                  } catch (e) {
                     console.warn("Failed to add ICE candidate for", remoteUserId, e);
                  }
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
        if (!data || !data.participants) return;

        const allParticipants = data.participants;
        const remoteParticipants = Object.keys(allParticipants).filter((pId: string) => pId !== userId);

        // Call new participants (I am the caller)
        for (const remoteUserId of remoteParticipants) {
          if (!pcs.current.has(remoteUserId) && userId < remoteUserId) { // Simple "caller" election
             const pc = createPeerConnection(remoteUserId, allParticipants[remoteUserId]);
             const offer = await pc.createOffer();
             await pc.setLocalDescription(offer);
             
             const offerPayload = { type: offer.type, sdp: offer.sdp, to: remoteUserId, from: userId };
             await updateDoc(roomRef, { [`offers.${userId}`]: offerPayload });
          }
        }
        
        // Handle offers meant for me (I am the callee)
        const offers = data.offers || {};
        for (const offererId in offers) {
            if (offers[offererId].to === userId) {
                const remoteUserName = allParticipants[offererId] || 'Unknown User';
                const pc = createPeerConnection(offererId, remoteUserName);
                if (pc.signalingState === 'stable') {
                    await pc.setRemoteDescription(new RTCSessionDescription(offers[offererId]));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    
                    const answerPayload = { type: answer.type, sdp: answer.sdp, to: offererId, from: userId };
                    
                    await updateDoc(roomRef, { 
                      [`answers.${userId}`]: answerPayload,
                      [`offers.${offererId}`]: deleteField()
                    });
                }
            }
        }

        // Handle answers meant for me (I was the caller)
        const answers = data.answers || {};
        for (const answererId in answers) {
            if (answers[answererId].to === userId) {
                const pc = pcs.current.get(answererId);
                if (pc && pc.signalingState === 'have-local-offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(answers[answererId]));
                    await updateDoc(roomRef, { [`answers.${answererId}`]: deleteField() });
                }
            }
        }
        
        // Cleanup disconnected participants
        const currentPcs = Array.from(pcs.current.keys());
        for (const pcId of currentPcs) {
            if (!remoteParticipants.includes(pcId)) {
                pcs.current.get(pcId)?.close();
                pcs.current.delete(pcId);
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(pcId);
                    return newMap;
                });
            }
        }

    });
    
    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
        hangUp();
        return null;
    };
    window.addEventListener('beforeunload', beforeUnloadHandler);
    
    return () => {
      unsubscribeRoom();
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      hangUp();
    };
  }, [localStream, roomId, userId, localUserName, hangUp, user]);
  
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !roomId) return;
    await addDoc(collection(db, 'rooms', roomId, 'messages'), {
      userId,
      name: localUserName,
      message,
      timestamp: serverTimestamp(),
    });
  }, [roomId, userId, localUserName]);

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
  };
};
