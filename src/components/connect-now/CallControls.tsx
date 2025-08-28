'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Mic, MicOff, PhoneOff, ScreenShare, ScreenShareOff, Video, VideoOff } from 'lucide-react';

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onHangUp: () => void;
}

export function CallControls({
  isMuted,
  isCameraOff,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onHangUp,
}: CallControlsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isMuted ? 'destructive' : 'secondary'}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={onToggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
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
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full"
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
