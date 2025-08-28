'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { User, ScreenShare } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
    <Card className="relative h-full w-full overflow-hidden bg-card/50 aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`h-full w-full object-cover ${isLocal ? 'transform -scale-x-100' : ''} ${isCameraOff || !stream ? 'hidden' : 'block'}`}
      />
      {(isCameraOff || !stream) && (
        <div className="flex h-full w-full items-center justify-center bg-secondary/30">
          <Avatar className="h-24 w-24">
            <AvatarFallback>
              <FallbackIcon className="h-12 w-12 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className="absolute bottom-2 left-2 z-10 flex items-center rounded-md bg-black/50 px-2 py-1 text-sm text-white backdrop-blur-sm">
        {name}
      </div>
      {isMuted && !isLocal && (
          <div className="absolute top-2 right-2 z-10 rounded-full bg-destructive p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic-off text-white"><path d="M12 8V4a4 4 0 0 0-8 0v4"/><path d="M8 12.5a5 5 0 0 0 7.55.55"/><path d="M8 18v-2.5"/><path d="M16 12.5a5 5 0 0 1-5.064 4.936"/><path d="m2 2 20 20"/><path d="M12 18v-2.5"/></svg>
          </div>
      )}
    </Card>
  );
}
