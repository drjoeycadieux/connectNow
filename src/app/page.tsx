

'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Users, ShieldCheck, Zap, MessageSquare, HardDrive, Server, FileCheck2, Headset, Info, X, AlertTriangle, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from '@/lib/utils';
import { UserProfile } from '@/components/connect-now/UserProfile';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';


function OutageBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <Alert variant="destructive" className="rounded-none border-x-0 border-t-0 relative pr-10 bg-red-600 text-white border-red-700">
      <AlertTriangle className="h-4 w-4 text-white" />
      <AlertTitle className="font-bold">Platform Temporarily Unavailable</AlertTitle>
      <AlertDescription>
        We are currently experiencing technical difficulties and are working to resolve the issue. Thank you for your patience.
      </AlertDescription>
       <button
          onClick={() => setIsVisible(false)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-white/70 hover:text-white"
          aria-label="Dismiss banner"
        >
          <X className="h-5 w-5" />
        </button>
    </Alert>
  );
}


function BetaBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <Alert className="bg-yellow-500/10 text-yellow-foreground border-yellow-500/50 rounded-none border-x-0 border-t-0 relative pr-10">
      <Info className="h-4 w-4 !text-yellow-500" />
      <AlertTitle className="font-bold !text-yellow-400">Prototype Notice</AlertTitle>
      <AlertDescription className="!text-yellow-300/90">
        This application is currently a prototype. Features may not work reliably at all times.
      </AlertDescription>
       <button
          onClick={() => setIsVisible(false)}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-yellow-400 hover:text-yellow-200"
          aria-label="Dismiss banner"
        >
          <X className="h-5 w-5" />
        </button>
    </Alert>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <OutageBanner />
      <BetaBanner />
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
      <header className="sticky top-0 z-50 flex items-center justify-between h-20 px-4 md:px-8 bg-background/80 backdrop-blur-sm border-b">
        <h1 className="font-headline text-3xl font-bold text-primary">
          <Link href="/">Connect Now</Link>
        </h1>
        <nav className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
          <UserProfile />
        </nav>
        <div className="md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                    <nav className="flex flex-col gap-6 pt-12">
                        <SheetClose asChild>
                           <Link href="/contact" className="text-lg font-medium hover:underline">Contact Support</Link>
                        </SheetClose>
                        <Separator />
                        <UserProfile />
                    </nav>
                </SheetContent>
            </Sheet>
        </div>
      </header>

      <main className="flex-1 relative">
        <section className="container mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12 px-4 py-20 md:py-32 lg:py-40">
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tight animate-fade-in-up">
              The Secure Collaboration Platform for IT Professionals.
            </h2>
            <p className="max-w-xl text-lg md:text-xl text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Reliable, end-to-end encrypted communication designed for technical support, system administration, and incident response.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Button size="lg" asChild>
                <Link href="/auth">Get Started</Link>
              </Button>
            </div>
          </div>
          <div className="relative animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
             <Image 
                src="https://picsum.photos/800/600"
                alt="IT professional providing remote support"
                width={800}
                height={600}
                className="rounded-xl shadow-2xl"
                data-ai-hint="IT support team"
              />
          </div>
        </section>

        <section id="features" className="py-16 md:py-24 bg-secondary/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="font-headline text-4xl md:text-5xl font-bold">Built for Technical Excellence</h3>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                Connect Now provides the essential tools for secure and efficient IT operations and support.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center p-6 bg-card/50 border-0 shadow-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 text-primary p-4 rounded-full">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">End-to-End Encrypted</h4>
                <p className="text-muted-foreground">All sessions are secured with E2EE, ensuring sensitive data and conversations remain private.</p>
              </Card>
              <Card className="text-center p-6 bg-card/50 border-0 shadow-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 text-primary p-4 rounded-full">
                    <HardDrive className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">Reliable Infrastructure</h4>
                <p className="text-muted-foreground">Crisp, low-latency communication that keeps up with real-time technical walkthroughs.</p>
              </Card>
              <Card className="text-center p-6 bg-card/50 border-0 shadow-lg">
                <div className="flex justify-center mb-4">
                   <div className="bg-primary/10 text-primary p-4 rounded-full">
                    <Users className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">Team Huddles</h4>
                <p className="text-muted-foreground">Spin up incident response calls or daily stand-ups with your entire IT team in seconds.</p>
              </Card>
              <Card className="text-center p-6 bg-card/50 border-0 shadow-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 text-primary p-4 rounded-full">
                    <MessageSquare className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">Technical Chat</h4>
                <p className="text-muted-foreground">Share log snippets, commands, and links securely through the integrated chat.</p>
              </Card>
               <Card className="text-center p-6 bg-card/50 border-0 shadow-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 text-primary p-4 rounded-full">
                    <Zap className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">Zero-Friction Access</h4>
                <p className="text-muted-foreground">No downloads or installs for end-users. Just a simple link to join a support session.</p>
              </Card>
               <Card className="text-center p-6 bg-card/50 border-0 shadow-lg">
                 <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 text-primary p-4 rounded-full">
                    <Server className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">Dedicated Infrastructure</h4>
                <p className="text-muted-foreground">Option for on-premise or private cloud deployment, ensuring data sovereignty and control.</p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t bg-secondary/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="font-semibold text-lg mb-2">Connect Now</p>
          <div className="flex justify-center gap-4 mb-2">
            <Link href="/legal" className="text-sm hover:underline">Legal Information</Link>
            <Link href="/terms" className="text-sm hover:underline">Terms of Use</Link>
            <Link href="/contact" className="text-sm hover:underline">Contact Support</Link>
          </div>
          <p>Secure Communication for IT Professionals</p>
          <p>&copy; {new Date().getFullYear()} Connect Now. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
