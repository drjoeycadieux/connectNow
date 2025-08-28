
'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, MicOff, PhoneOff, ScreenShare, ScreenShareOff, Video, VideoOff, MessageSquare, MessageSquareOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onHangUp: () => void;
  onToggleChat: () => void;
  disableMediaControls?: boolean;
}

export function CallControls({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isChatOpen,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onHangUp,
  onToggleChat,
  disableMediaControls = false,
}: CallControlsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-2 md:gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isMuted ? 'destructive' : 'secondary'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              disabled={disableMediaControls}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isMuted ? 'Unmute' : 'Mute'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isCameraOff ? 'destructive' : 'secondary'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={onToggleCamera}
              aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
              disabled={disableMediaControls}
            >
              {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isCameraOff ? 'Turn camera on' : 'Turn camera off'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isScreenSharing ? 'default' : 'secondary'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={onToggleScreenShare}
              aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
            >
              {isScreenSharing ? <ScreenShareOff className="h-6 w-6" /> : <ScreenShare className="h-6 w-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isScreenSharing ? 'Stop sharing screen' : 'Share screen'}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
           <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className={cn("h-12 w-12 rounded-full", isChatOpen && 'bg-primary/20 text-primary hover:bg-primary/30')}
              onClick={onToggleChat}
              aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
            >
              {isChatOpen ? <MessageSquareOff className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isChatOpen ? 'Close chat' : 'Open chat'}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full px-6 h-12"
              onClick={onHangUp}
              aria-label="Hang up"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Hang up</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
