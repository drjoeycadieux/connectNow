'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWebRTC } from '@/hooks/use-webrtc';
import { CallControls } from '@/components/connect-now/CallControls';
import { ChatPanel } from '@/components/connect-now/ChatPanel';
import { ParticipantVideo } from '@/components/connect-now/ParticipantVideo';
import { ScreenShareWarningDialog } from '@/components/connect-now/ScreenShareWarningDialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, MessageSquare, Users, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mic, Video } from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const roomId = typeof params.roomId === 'string' ? params.roomId : '';
  const [localUserName, setLocalUserName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [hasMediaPermissions, setHasMediaPermissions] = useState(true);
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
    isSomeoneElseScreenSharing,
  } = useWebRTC(nameSubmitted ? roomId : null, localUserName);

  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (localStream) {
      const hasVideo = localStream.getVideoTracks().length > 0;
      const hasAudio = localStream.getAudioTracks().length > 0;
      setHasMediaPermissions(hasVideo && hasAudio);
    }
  }, [localStream]);


  const handleToggleScreenShare = () => {
    if (!isScreenSharing && !isSomeoneElseScreenSharing) {
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

  if (!nameSubmitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (localUserName.trim()) setNameSubmitted(true);
              }}
              className="flex flex-col gap-4"
            >
              <h2 className="font-headline text-2xl font-bold text-center">Enter your name</h2>
              <input
                type="text"
                value={localUserName}
                onChange={(e) => setLocalUserName(e.target.value)}
                placeholder="Your name"
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Button type="submit" disabled={!localUserName.trim()}>Join Call</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // This loader is shown while the WebRTC hook is initializing
  if (localStream === null && nameSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-muted-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg">Connecting to call...</p>
        <p className="text-sm">Please allow camera and microphone access.</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full flex-col bg-background">
        <ScreenShareWarningDialog
          open={showWarning}
          onOpenChange={setShowWarning}
          onConfirm={confirmScreenShare}
        />
        <header className="flex items-center justify-between border-b p-4">
          <h1 className="font-headline text-2xl font-bold text-primary">Connect Now</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span>{remoteStreams.size + 1}</span>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => {
                  if (roomId) {
                    navigator.clipboard.writeText(roomId);
                    toast({
                      title: "Room ID Copied!",
                      description: "You can now share it with others.",
                    });
                  }
                }}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Room ID
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{roomId}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        <main className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col">
            <div className="flex-1 overflow-auto p-4">
              { !hasMediaPermissions && (
                 <Alert variant="destructive" className="mb-4">
                   <AlertTitle>Media Permissions Error</AlertTitle>
                   <AlertDescription>
                     Could not access your camera and microphone. Please check your browser's permissions. You can still participate in chat.
                   </AlertDescription>
                 </Alert>
              )}
              <div className={`grid gap-4 ${isScreenSharing || isSomeoneElseScreenSharing ? '' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {isScreenSharing ? (
                     <ParticipantVideo stream={localStream} name="Your Screen" isLocal isScreen />
                  ) : (
                    <ParticipantVideo stream={localStream} name={`${localUserName} (You)`} isLocal isCameraOff={isCameraOff || !hasMediaPermissions} isMuted={isMuted || !hasMediaPermissions} />
                  )}
                  {remoteStreamEntries.map(([id, stream]) => {
                    const isScreen = stream.getVideoTracks().some(t => t.getSettings().displaySurface);
                     return (
                       <ParticipantVideo
                         key={id}
                         stream={stream}
                         name={`Participant ${id.substring(0, 4)}`}
                         isScreen={isScreen}
                       />
                     );
                  })}
              </div>
            </div>
            <div className="border-t bg-card/50 p-4">
              <CallControls
                isMuted={isMuted}
                isCameraOff={isCameraOff}
                isScreenSharing={isScreenSharing}
                onToggleMute={toggleMute}
                onToggleCamera={toggleCamera}
                onToggleScreenShare={handleToggleScreenShare}
                onHangUp={hangUp}
                disableMediaControls={!hasMediaPermissions}
              />
            </div>
          </div>

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" className="fixed bottom-24 right-4 z-20 rounded-full h-14 w-14 shadow-lg">
                  <MessageSquare />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] p-0">
                <ChatPanel messages={chatMessages} onSendMessage={sendMessage} localUserId={userId} />
              </SheetContent>
            </Sheet>
          ) : (
            <aside className="w-[350px] border-l">
              <ChatPanel messages={chatMessages} onSendMessage={sendMessage} localUserId={userId} />
            </aside>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}