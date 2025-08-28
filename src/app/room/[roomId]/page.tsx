
'use client';

import { useEffect, useState, useMemo, Fragment } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useWebRTC } from '@/hooks/use-webrtc';
import { CallControls } from '@/components/connect-now/CallControls';
import { ChatPanel } from '@/components/connect-now/ChatPanel';
import { ParticipantVideo } from '@/components/connect-now/ParticipantVideo';
import { ScreenShareWarningDialog } from '@/components/connect-now/ScreenShareWarningDialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, MessageSquare, Users, Copy, ChevronLeft, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import React from 'react';

function VideoGridLayout({ children }: { children: React.ReactNode }) {
    const count = React.Children.count(children);
    
    const layoutClasses = useMemo(() => {
        switch (count) {
            case 1:
                return 'grid-cols-1 grid-rows-1';
            case 2:
                return 'grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1';
            case 3:
                return 'grid-cols-1 md:grid-cols-3 grid-rows-3 md:grid-rows-1';
            case 4:
                return 'grid-cols-2 grid-rows-2';
            case 5:
            case 6:
                return 'grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2';
            default:
                return 'grid-cols-2 md:grid-cols-4 grid-rows-auto';
        }
    }, [count]);

    return (
        <div className={cn("grid w-full h-full gap-4 p-4", layoutClasses)}>
            {children}
        </div>
    );
}


export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId = typeof params.roomId === 'string' ? params.roomId : '';
  const initialName = searchParams.get('name') || '';
  const meetingTopic = searchParams.get('topic') || `Meeting ID: ${roomId}`;

  const [localUserName, setLocalUserName] = useState(initialName);
  const [nameSubmitted, setNameSubmitted] = useState(!!initialName);
  const [showWarning, setShowWarning] = useState(false);
  const [hasMediaPermissions, setHasMediaPermissions] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { toast } = useToast();
  
  const {
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
  } = useWebRTC(nameSubmitted ? roomId : null, localUserName);

  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      const audioTracks = localStream.getAudioTracks();
      const hasVideo = videoTracks.length > 0 && videoTracks.every(t => t.readyState === 'live');
      const hasAudio = audioTracks.length > 0 && audioTracks.every(t => t.readyState === 'live');
      setHasMediaPermissions(hasVideo && hasAudio);
    } else if (nameSubmitted) {
      setHasMediaPermissions(false);
    }
  }, [localStream, nameSubmitted]);


  const handleToggleScreenShare = () => {
    if (!isScreenSharing) {
      setShowWarning(true);
    } else {
      toggleScreenSharing();
    }
  };

  const confirmScreenShare = () => {
    toggleScreenSharing();
    setShowWarning(false);
  };
  
  const remoteStreamEntries = Array.from(remoteStreams.entries());
  
  const localParticipant = (
     <ParticipantVideo key={userId} stream={localStream} name={`${localUserName} (You)`} isLocal isCameraOff={isCameraOff || !hasMediaPermissions} isMuted={isMuted || !hasMediaPermissions} isScreen={isScreenSharing} />
  );

  const remoteParticipants = remoteStreamEntries.map(([id, stream]) => {
      const isScreen = stream.getVideoTracks().some(t => t.getSettings().displaySurface);
      const participantName = stream.peerName || `User-${id.substring(0,4)}`;
      return (
        <ParticipantVideo
          key={id}
          stream={stream}
          name={participantName}
          isScreen={isScreen}
        />
      );
  });
  
  const screenSharingParticipant = isScreenSharing ? localParticipant : remoteParticipants.find(p => p.props.isScreen);
  const otherParticipants = (isScreenSharing ? [] : [localParticipant]).concat(remoteParticipants.filter(p => !p.props.isScreen));


  if (!nameSubmitted) {
     router.push(`/?joinRoomId=${roomId}`);
     return (
       <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-muted-foreground bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Redirecting to join...</p>
      </div>
     );
  }
  
  if (!localStream && nameSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-muted-foreground bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Joining room...</p>
        <p className="text-sm">Please allow camera and microphone access to continue.</p>
         <Button variant="outline" className="mt-4" onClick={() => router.push('/')}>
            Back to Home
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
       <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
        <ScreenShareWarningDialog
          open={showWarning}
          onOpenChange={setShowWarning}
          onConfirm={confirmScreenShare}
        />
        
        <header className="flex items-center justify-between border-b p-4 shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href="/"><ChevronLeft/></Link>
            </Button>
            <h1 className="font-headline text-xl font-bold text-primary truncate" title={meetingTopic}>{meetingTopic}</h1>
          </div>
          <div className="flex items-center gap-3">
             <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => {
                  if (roomId) {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Meeting Link Copied!",
                      description: "You can now share it with others to join.",
                    });
                  }
                }}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy meeting link</p>
              </TooltipContent>
            </Tooltip>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span className="font-bold">{remoteStreams.size + 1}</span>
            </div>
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
           <div className="flex flex-1 flex-col relative">
              <div className="flex-1 overflow-auto bg-background/50">
                  { !hasMediaPermissions && (
                     <div className="absolute inset-0 flex items-center justify-center p-4 z-20">
                         <Alert variant="destructive" className="max-w-md">
                           <Info className="h-4 w-4"/>
                           <AlertTitle>Media Permissions Error</AlertTitle>
                           <AlertDescription>
                             Could not access your camera and microphone. Please check your browser's permissions. You can still participate in chat, but others will not see or hear you.
                           </AlertDescription>
                         </Alert>
                     </div>
                  )}

                  {screenSharingParticipant ? (
                    <div className="w-full h-full flex flex-col lg:flex-row gap-4 p-4">
                        <div className="flex-1 h-full w-full">{screenSharingParticipant}</div>
                        <div className="w-full lg:w-64 h-auto lg:h-full flex flex-row lg:flex-col gap-4 overflow-auto">
                            {otherParticipants.map((p) => <div key={p.key} className="w-full aspect-video">{p}</div>)}
                        </div>
                    </div>
                  ) : (
                    <VideoGridLayout>
                      {localParticipant}
                      {remoteParticipants}
                    </VideoGridLayout>
                  )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 flex justify-center">
                 <div className="p-2 bg-card/80 backdrop-blur-sm rounded-xl border">
                    <CallControls
                        isMuted={isMuted}
                        isCameraOff={isCameraOff}
                        isScreenSharing={isScreenSharing}
                        onToggleMute={toggleMute}
                        onToggleCamera={toggleCamera}
                        onToggleScreenShare={handleToggleScreenShare}
                        onHangUp={hangUp}
                        disableMediaControls={!hasMediaPermissions}
                        onToggleChat={() => setIsChatOpen(!isChatOpen)}
                        isChatOpen={isChatOpen}
                    />
                 </div>
              </div>
           </div>

           {isMobile ? (
            <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
              <SheetContent side="right" className="w-[85%] p-0">
                <ChatPanel messages={chatMessages} onSendMessage={sendMessage} localUserId={userId} />
              </SheetContent>
            </Sheet>
           ) : (
            <aside className={cn("w-[350px] border-l flex-col", isChatOpen ? 'flex' : 'hidden')}>
              <ChatPanel messages={chatMessages} onSendMessage={sendMessage} localUserId={userId} />
            </aside>
           )}
        </main>
      </div>
    </TooltipProvider>
  );
}
