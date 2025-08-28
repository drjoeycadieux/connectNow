import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateRoomButton } from "@/components/connect-now/CreateRoomButton";
import { JoinRoomForm } from "@/components/connect-now/JoinRoomForm";
import { Separator } from "@/components/ui/separator";
import { Video, Users, ShieldCheck, Zap, MessageSquare, ScreenShare as ScreenShareIcon } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
      <header className="sticky top-0 z-50 flex items-center justify-between h-20 px-4 md:px-8 bg-background/80 backdrop-blur-sm border-b">
        <h1 className="font-headline text-3xl font-bold text-primary">
          Connect Now
        </h1>
        <Button variant="secondary" size="lg" asChild>
          <a href="#join">Get Started</a>
        </Button>
      </header>

      <main className="flex-1 relative">
        <section className="container mx-auto grid grid-cols-1 lg:grid-cols-2 items-center gap-12 px-4 py-20 md:py-32 lg:py-40">
          <div className="flex flex-col gap-6 text-center lg:text-left">
            <h2 className="font-headline text-5xl md:text-7xl font-bold tracking-tight animate-fade-in-up">
              Enterprise-Grade Video Conferencing.
            </h2>
            <p className="max-w-xl text-lg md:text-xl text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Secure, reliable, and powerful video meetings for modern teams. No downloads, no hassle. Just seamless collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <CreateRoomButton />
              <Button variant="outline" size="lg" asChild>
                <a href="#join">Join a Meeting</a>
              </Button>
            </div>
          </div>
          <div className="relative animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
             <Image 
                src="https://picsum.photos/800/600"
                alt="Team collaborating in a video meeting"
                width={800}
                height={600}
                className="rounded-xl shadow-2xl"
                data-ai-hint="team collaboration"
              />
          </div>
        </section>

        <section id="features" className="py-16 md:py-24 bg-secondary/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h3 className="font-headline text-4xl md:text-5xl font-bold">Everything You Need to Connect</h3>
              <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
                Connect Now provides a full suite of features designed for productive and secure online meetings.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="text-center p-6 bg-card/50 border-0 shadow-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 text-primary p-4 rounded-full">
                    <Video className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">HD Video & Audio</h4>
                <p className="text-muted-foreground">Crystal clear video and audio for professional-grade meetings.</p>
              </Card>
              <Card className="text-center p-6 bg-card/50 border-0 shadow-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 text-primary p-4 rounded-full">
                    <ScreenShareIcon className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">Screen Sharing</h4>
                <p className="text-muted-foreground">Share your screen, an application, or a browser tab with ease.</p>
              </Card>
              <Card className="text-center p-6 bg-card/50 border-0 shadow-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 text-primary p-4 rounded-full">
                    <MessageSquare className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">Instant Chat</h4>
                <p className="text-muted-foreground">Communicate with participants via real-time text messaging.</p>
              </Card>
              <Card className="text-center p-6 bg-card/50 border-0 shadow-lg">
                <div className="flex justify-center mb-4">
                   <div className="bg-primary/10 text-primary p-4 rounded-full">
                    <Users className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">Multi-Participant Calls</h4>
                <p className="text-muted-foreground">Connect with your entire team at once, seamlessly.</p>
              </Card>
              <Card className="text-center p-6 bg-card/50 border-0 shadow-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 text-primary p-4 rounded-full">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">Secure & Private</h4>
                <p className="text-muted-foreground">End-to-end encryption ensures your conversations are private.</p>
              </Card>
               <Card className="text-center p-6 bg-card/50 border-0 shadow-lg">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 text-primary p-4 rounded-full">
                    <Zap className="h-8 w-8" />
                  </div>
                </div>
                <h4 className="font-bold text-2xl mb-2">Instant Join</h4>
                <p className="text-muted-foreground">No accounts, no downloads. Just click and connect.</p>
              </Card>
            </div>
          </div>
        </section>

        <section id="join" className="py-16 md:py-24">
          <div className="container mx-auto px-4 flex justify-center">
            <Card className="w-full max-w-lg bg-card/80 shadow-2xl backdrop-blur-lg border-0">
              <CardHeader className="text-center">
                <CardTitle className="font-headline text-4xl">Get Started in Seconds</CardTitle>
                <CardDescription className="text-lg">
                  Start a new meeting or enter an existing Room ID to join.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 p-8">
                <CreateRoomButton />
                <div className="flex items-center gap-4">
                  <Separator className="flex-1" />
                  <span className="text-sm font-medium text-muted-foreground">OR</span>
                  <Separator className="flex-1" />
                </div>
                <JoinRoomForm />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t bg-secondary/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p className="font-semibold text-lg mb-2">Connect Now</p>
          <p>Powered by Next.js and WebRTC</p>
          <p>&copy; {new Date().getFullYear()} Connect Now. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
