
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const formSchema = z.object({
  name: z.string().trim().min(2, { message: 'Your name must be at least 2 characters.' }),
  topic: z.string().trim().optional(),
});

export function CreateRoomForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        form.setValue('name', currentUser.displayName || currentUser.email?.split('@')[0] || '');
      }
    });
    return () => unsubscribe();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      topic: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      router.push('/auth');
      return;
    }
    const roomId = crypto.randomUUID();
    const topicQuery = values.topic ? `&topic=${encodeURIComponent(values.topic)}` : '';
    router.push(`/room/${roomId}?name=${encodeURIComponent(values.name)}${topicQuery}`);
    setOpen(false);
  }

  const handleTriggerClick = () => {
    if (!user) {
      router.push('/auth');
    } else {
      setOpen(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full text-base" onClick={handleTriggerClick}>
          <Video className="mr-2 h-5 w-5" />
          Create New Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a New Meeting</DialogTitle>
          <DialogDescription>
            Enter your details below to start a new secure meeting room.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Topic (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Q3 Project Sync" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Create and Join</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
