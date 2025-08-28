
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export function CreateRoomForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const createRoom = () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create a new meeting room.',
        variant: 'destructive',
      });
      router.push('/auth');
      return;
    }
    const newRoomId = crypto.randomUUID().substring(0, 8);
    const userName = user.displayName || user.email?.split('@')[0] || 'User';
    router.push(`/room/${newRoomId}?name=${encodeURIComponent(userName)}`);
  };

  return (
    <Button size="lg" className="w-full text-base" onClick={createRoom}>
      <Video className="mr-2 h-5 w-5" />
      Create New Meeting
    </Button>
  );
}
