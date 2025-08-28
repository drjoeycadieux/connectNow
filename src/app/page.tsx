import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateRoomForm } from "@/components/connect-now/CreateRoomForm";
import { JoinRoomForm } from "@/components/connect-now/JoinRoomForm";
import { Separator } from "@/components/ui/separator";
import { Video, Users, ShieldCheck, Zap, MessageSquare, ScreenShare as ScreenShareIcon, HardDrive, Server, FileCheck2, Headset } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";


function JoinRoomFormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-11 w-full" />
    </div>
  )
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
      <header className="sticky top-0 z-50 flex items-center justify-between h-20 px-4 md:px-8 bg-background/80 backdrop-blur-sm border-b">
        <h1 className="font-headline text-3xl font-bold text-primary">
          <Link href="/">Connect Now</Link>
        </h1>
        <Button variant="secondary" size="lg" asChild>
          <a href="#join">Get Started</a>
        </Button>
      </header>

      <main className="flex-1 relative">
        <section className="container mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12 px-4 py-20 md:py-32 lg:py-40">
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tight animate-fade-in-up">
              The Secure Collaboration Platform for IT Professionals.
            </h2>
            <p className="max-w-xl text-lg md:text-xl text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Reliable, end-to-end encrypted video conferencing designed for technical support, system administration, and incident response.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <CreateRoomForm />
              <Button variant="outline" size="lg" asChild>
                <a href="#join">Join a Session</a>
              </Button>
            </div>
          </div>
          <div className="relative animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
             <Image 
                src="https://picsum.photos/800/601"
                alt="IT professional providing remote support"
                width={800}
                height={601}
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
                    <ScreenShareIcon className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">Remote Desktop</h4>
                <p className="text-muted-foreground">Seamlessly view and troubleshoot remote systems with high-quality screen sharing.</p>
              </Card>
               <Card className="text-center p-6 bg-card/50 border-0 shadow-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 text-primary p-4 rounded-full">
                    <HardDrive className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">Low-Latency HD Video</h4>
                <p className="text-muted-foreground">Crisp, low-latency video and audio that keeps up with real-time technical walkthroughs.</p>
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
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="font-headline text-4xl md:text-5xl font-bold">Get Connected in Three Steps</h3>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                Initiate a secure session with unparalleled ease and speed.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary text-primary-foreground mb-6">
                  <span className="font-headline text-4xl font-bold">1</span>
                </div>
                <h4 className="font-bold text-2xl mb-2">Create a Room</h4>
                <p className="text-muted-foreground">Generate a unique, secure session room with a single click.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary text-primary-foreground mb-6">
                  <span className="font-headline text-4xl font-bold">2</span>
                </div>
                <h4 className="font-bold text-2xl mb-2">Share the ID</h4>
                <p className="text-muted-foreground">Securely send the Room ID to your colleague or the person you're supporting.</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary text-primary-foreground mb-6">
                  <span className="font-headline text-4xl font-bold">3</span>
                </div>
                <h4 className="font-bold text-2xl mb-2">Connect Instantly</h4>
                <p className="text-muted-foreground">They join instantly through their browser. No registration or installation needed.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="why-us" className="py-16 md:py-24 bg-secondary/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="font-headline text-4xl md:text-5xl font-bold">Why Connect Now?</h3>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                The enterprise-grade solution for secure and reliable IT communications.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-full">
                  <Server className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-1">Dedicated Infrastructure</h4>
                  <p className="text-muted-foreground">Option for on-premise or private cloud deployment, ensuring data sovereignty and control.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-full">
                  <FileCheck2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-1">Compliance-Ready</h4>
                  <p className="text-muted-foreground">Designed to meet strict regulatory requirements, including audit logs and data retention policies.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 text-primary p-3 rounded-full">
                  <Headset className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-1">24/7 Priority Support</h4>
                  <p className="text-muted-foreground">Get expert help whenever you need it with our dedicated enterprise support team.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="join" className="py-16 md:py-24">
          <div className="container mx-auto px-4 flex justify-center">
            <Card className="w-full max-w-lg bg-card/80 shadow-2xl backdrop-blur-lg border-0">
              <CardHeader className="text-center">
                <CardTitle className="font-headline text-4xl">Start a Secure Session</CardTitle>
                <CardDescription className="text-lg">
                  Create a new session or enter an existing Room ID to join.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 p-8">
                <CreateRoomForm />
                <div className="flex items-center gap-4">
                  <Separator className="flex-1" />
                  <span className="text-sm font-medium text-muted-foreground">OR</span>
                  <Separator className="flex-1" />
                </div>
                <Suspense fallback={<JoinRoomFormSkeleton/>}>
                  <JoinRoomForm />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t bg-secondary/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="font-semibold text-lg mb-2">Connect Now</p>
          <div className="flex justify-center gap-4 mb-2">
            <Link href="/legal" className="text-sm hover:underline">Legal Information</Link>
            <Link href="/terms" className="text-sm hover:underline">Terms of Use</Link>
          </div>
          <p>Secure WebRTC for IT Professionals</p>
          <p>&copy; {new Date().getFullYear()} Connect Now. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

    