
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LogIn } from 'lucide-react';

const formSchema = z.object({
  name: z.string().trim().min(2, { message: 'Your name must be at least 2 characters.' }),
  roomId: z.string().trim().min(1, { message: 'Room ID is required.' }),
});

export function JoinRoomForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        form.setValue('name', currentUser.displayName || currentUser.email?.split('@')[0] || '');
      }
    });
    return () => unsubscribe();
  }, [auth]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      roomId: '',
    },
  });

  useEffect(() => {
    const joinRoomId = searchParams.get('joinRoomId');
    if (joinRoomId) {
      form.setValue('roomId', joinRoomId);
    }
  }, [searchParams, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        router.push(`/auth?joinRoomId=${values.roomId}`);
        return;
    }
    router.push(`/room/${values.roomId}?name=${encodeURIComponent(values.name)}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="roomId"
          render={({ field }) => (
            <FormItem>
               <FormLabel>Room ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter Room ID to join" {...field} className="text-center h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
               <FormLabel>Your Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name to join" {...field} className="text-center h-12 text-base" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" variant="secondary" className="w-full text-base" size="lg">
          <LogIn className="mr-2 h-5 w-5" />
          Join Meeting
        </Button>
      </form>
    </Form>
  );
}
