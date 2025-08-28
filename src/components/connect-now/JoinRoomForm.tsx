'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LogIn } from 'lucide-react';

const formSchema = z.object({
  roomId: z.string().trim().min(1, { message: 'Room ID is required.' }),
});

export function JoinRoomForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomId: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    router.push(`/room/${values.roomId}`);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="roomId"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Enter Room ID to join" {...field} className="text-center h-12 text-base" />
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
