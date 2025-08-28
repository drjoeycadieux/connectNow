'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatMessage } from '@/types';
import { Send } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  localUserId: string;
}

export function ChatPanel({ messages, onSendMessage, localUserId }: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <header className="border-b p-4">
        <h2 className="font-headline text-lg font-semibold">In-call messages</h2>
      </header>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${msg.userId === localUserId ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 ${
                  msg.userId === localUserId ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                }`}
              >
                <p className="text-sm font-bold">{msg.userId === localUserId ? 'You' : msg.name}</p>
                <p className="text-sm">{msg.message}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {msg.timestamp ? format(msg.timestamp.toDate(), 'p') : ''}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
          />
          <Button type="submit" size="icon" aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
