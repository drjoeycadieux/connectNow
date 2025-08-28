
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export function CreateRoomForm() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleClick = () => {
    if (!user) {
      router.push('/auth');
    } else {
      router.push('/pricing');
    }
  };

  return (
    <Button size="lg" className="w-full text-base" onClick={handleClick}>
      <Video className="mr-2 h-5 w-5" />
      Create New Meeting
    </Button>
  );
}
