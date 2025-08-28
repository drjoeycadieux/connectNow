import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateRoomButton } from "@/components/connect-now/CreateRoomButton";
import { JoinRoomForm } from "@/components/connect-now/JoinRoomForm";
import { Separator } from "@/components/ui/separator";
import { Video, Users, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
      <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 md:px-6 bg-background/80 backdrop-blur-sm border-b">
        <h1 className="font-headline text-2xl font-bold text-primary">
          Connect Now
        </h1>
        <Button variant="secondary" asChild>
          <a href="#join">Get Started</a>
        </Button>
      </header>

      <main className="flex-1 relative">
        <section className="flex flex-col items-center justify-center text-center gap-6 px-4 py-20 md:py-32 lg:py-40">
          <h2 className="font-headline text-4xl md:text-6xl font-bold tracking-tight animate-fade-in-up">
            Seamless Video Meetings.
            <br />
            Instantly Connected.
          </h2>
          <p className="max-w-2xl text-lg md:text-xl text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Experience high-quality, real-time video conferencing with just one click. No sign-ups, no downloads, just pure connection.
          </p>
          <div className="flex gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <CreateRoomButton />
          </div>
        </section>

        <section id="features" className="py-16 md:py-24 bg-secondary/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="font-headline text-3xl md:text-4xl font-bold">Features</h3>
              <p className="text-muted-foreground mt-2">Everything you need for effective communication.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 rounded-lg">
                <Video className="h-12 w-12 text-primary mb-4" />
                <h4 className="font-bold text-xl mb-2">HD Video & Audio</h4>
                <p className="text-muted-foreground">Crystal clear video and audio for professional-grade meetings.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg">
                <Users className="h-12 w-12 text-primary mb-4" />
                <h4 className="font-bold text-xl mb-2">Multi-Participant Calls</h4>
                <p className="text-muted-foreground">Connect with multiple people at once, seamlessly.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg">
                <ShieldCheck className="h-12 w-12 text-primary mb-4" />
                <h4 className="font-bold text-xl mb-2">Secure & Private</h4>
                <p className="text-muted-foreground">End-to-end encryption ensures your conversations are private.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="join" className="py-16 md:py-24">
          <div className="container mx-auto px-4 flex justify-center">
            <Card className="w-full max-w-lg bg-card/80 shadow-2xl backdrop-blur-lg border-0">
              <CardHeader className="text-center">
                <CardTitle className="font-headline text-3xl">Join or Create a Meeting</CardTitle>
                <CardDescription>
                  Start a new meeting or enter an existing Room ID to join.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 p-6">
                <CreateRoomButton />
                <div className="flex items-center gap-4">
                  <Separator className="flex-1" />
                  <span className="text-xs font-medium text-muted-foreground">OR</span>
                  <Separator className="flex-1" />
                </div>
                <JoinRoomForm />
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="py-6 border-t bg-secondary/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Powered by Next.js and WebRTC</p>
          <p>&copy; {new Date().getFullYear()} Connect Now. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
