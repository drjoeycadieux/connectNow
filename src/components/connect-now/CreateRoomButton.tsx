'use client';

import { useRouter } from 'next/navigation';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CreateRoomButton() {
  const router = useRouter();

  const createRoom = () => {
    const roomId = crypto.randomUUID();
    router.push(`/room/${roomId}`);
  };

  return (
    <Button onClick={createRoom} size="lg" className="w-full text-base">
      <Video className="mr-2 h-5 w-5" />
      Create New Meeting
    </Button>
  );
}
