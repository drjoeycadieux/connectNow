
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

function JoinRoomFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [roomId, setRoomId] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const joinRoomId = searchParams.get('joinRoomId');
    if (joinRoomId) {
      setRoomId(joinRoomId);
    }
  }, [searchParams]);

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a Meeting ID.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!user) {
        router.push(`/auth?joinRoomId=${roomId}`);
        return;
    }
    
    const userName = user.displayName || user.email?.split('@')[0] || 'User';
    router.push(`/room/${roomId.trim()}?name=${encodeURIComponent(userName)}`);
  };

  return (
    <Card className="w-full max-w-md">
        <form onSubmit={joinRoom}>
            <CardHeader>
                <CardTitle>Join a Meeting</CardTitle>
                <CardDescription>Enter the Meeting ID to join an existing call.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="room-id">Meeting ID</Label>
                    <Input
                        id="room-id"
                        placeholder="Enter Meeting ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        required
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" className="w-full" variant="secondary">
                    Join Meeting
                </Button>
            </CardFooter>
        </form>
    </Card>
  );
}

export function JoinRoomForm() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <JoinRoomFormInner />
        </Suspense>
    )
}
