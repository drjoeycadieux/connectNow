
'use client';

import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  ScreenShare,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface CallControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isChatOpen: boolean;
  disableMediaControls: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onHangUp: () => void;
}

export function CallControls({
  isMuted,
  isCameraOff,
  isScreenSharing,
  isChatOpen,
  disableMediaControls,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onHangUp,
}: CallControlsProps) {
  const router = useRouter();

  const handleHangUp = () => {
    onHangUp();
    router.push('/');
  };

  const mediaControls = [
    {
      label: isMuted ? 'Unmute' : 'Mute',
      icon: isMuted ? MicOff : Mic,
      action: onToggleMute,
      variant: isMuted ? 'destructive' : 'secondary',
      disabled: disableMediaControls,
    },
    {
      label: isCameraOff ? 'Turn Camera On' : 'Turn Camera Off',
      icon: isCameraOff ? VideoOff : Video,
      action: onToggleCamera,
      variant: isCameraOff ? 'destructive' : 'secondary',
      disabled: disableMediaControls || isScreenSharing,
    },
    {
      label: isScreenSharing ? 'Stop Sharing' : 'Share Screen',
      icon: ScreenShare,
      action: onToggleScreenShare,
      variant: isScreenSharing ? 'default' : 'secondary',
      disabled: disableMediaControls,
    },
  ] as const;

  return (
    <div className="flex items-center justify-center gap-2">
      {mediaControls.map((control) => (
        <Tooltip key={control.label}>
          <TooltipTrigger asChild>
            <Button
              variant={control.variant}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={control.action}
              disabled={control.disabled}
              aria-label={control.label}
            >
              <control.icon className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{control.label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
       <div className="mx-2 h-8 w-px bg-border" />
       <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isChatOpen ? "default" : "secondary"}
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={onToggleChat}
              aria-label="Toggle Chat"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle Chat</p>
          </TooltipContent>
        </Tooltip>
      <Button
        variant="destructive"
        size="icon"
        className="ml-4 h-12 w-12 rounded-full"
        onClick={handleHangUp}
        aria-label="Hang Up"
      >
        <PhoneOff className="h-6 w-6" />
      </Button>
    </div>
  );
}
