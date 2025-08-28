
'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { MicOff, ScreenShare, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ParticipantVideoProps {
  stream: MediaStream | null;
  name: string;
  isLocal?: boolean;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isScreen?: boolean;
}

export function ParticipantVideo({
  stream,
  name,
  isLocal = false,
  isMuted = false,
  isCameraOff = false,
  isScreen = false,
}: ParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const FallbackIcon = isScreen ? ScreenShare : User;

  return (
    <Card className="relative h-full w-full overflow-hidden bg-secondary aspect-video border-2 border-transparent focus-within:border-primary focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal || isMuted}
        className={cn(
          'h-full w-full object-contain',
          isLocal && !isScreen ? 'transform -scale-x-100' : '',
          isCameraOff || !stream ? 'hidden' : 'block'
        )}
      />
      {(isCameraOff || !stream) && (
        <div className="flex h-full w-full items-center justify-center bg-secondary/50 dark:bg-secondary/20">
          <Avatar className="h-24 w-24">
            <AvatarFallback className="bg-transparent">
              <FallbackIcon className="h-12 w-12 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2 rounded-md bg-black/50 px-2 py-1 text-sm text-white backdrop-blur-sm">
        {isMuted && <MicOff className="h-4 w-4" />}
        <span className="truncate">{name}</span>
      </div>
    </Card>
  );
}
