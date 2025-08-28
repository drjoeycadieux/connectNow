import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { CreateRoomButton } from "@/components/connect-now/CreateRoomButton";
import { JoinRoomForm } from "@/components/connect-now/JoinRoomForm";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-background">
      <div 
        aria-hidden="true" 
        className="absolute inset-0 z-0 bg-gradient-to-br from-primary/10 via-background to-background"
      />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in-up border-0 bg-card/80 shadow-2xl backdrop-blur-lg">
          <CardHeader className="text-center">
            <h1 className="font-headline text-5xl font-bold text-primary">
              Connect Now
            </h1>
            <CardDescription className="pt-2 text-base text-muted-foreground">
              Real-time video conferencing made simple.
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
        <footer className="absolute bottom-6 text-center text-sm text-muted-foreground">
          Powered by Next.js and WebRTC
        </footer>
      </main>
    </div>
  );
}
