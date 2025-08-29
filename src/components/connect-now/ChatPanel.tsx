
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatMessage } from '@/types';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { formatDistanceToNow } from 'date-fns';


interface ChatPanelProps {
  messages: ChatMessage[];
  localUserId: string;
  onSendMessage: (message: string) => void;
}

export function ChatPanel({ messages, localUserId, onSendMessage }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b p-4">
        <h2 className="text-xl font-bold">In-Call Chat</h2>
      </header>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => {
            const isLocal = msg.userId === localUserId;
            return (
              <div
                key={msg.id}
                className={cn('flex items-start gap-3', isLocal && 'flex-row-reverse')}
              >
                <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(msg.name)}</AvatarFallback>
                </Avatar>
                <div className={cn(
                    "flex flex-col rounded-lg p-3 max-w-[75%]",
                     isLocal ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                   <div className="flex items-baseline gap-2">
                     <p className="text-xs font-bold">{isLocal ? 'You' : msg.name}</p>
                     <p className={cn("text-xs", isLocal ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                        {msg.timestamp ? formatDistanceToNow(msg.timestamp.toDate(), { addSuffix: true }) : 'sending...'}
                     </p>
                   </div>
                   <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="relative">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="pr-12"
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
