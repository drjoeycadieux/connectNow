
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from '@/hooks/use-toast';

const features = [
  "Unlimited Meetings",
  "Up to 10 Participants",
  "End-to-End Encryption",
  "High-Quality Video & Audio",
  "Screen Sharing",
  "Secure Chat",
  "Priority Email Support"
];

export default function PricingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null);
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useState(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  });

  const handleCheckout = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      router.push('/auth?redirect=/pricing');
      return;
    }
    
    setLoading(plan);
    
    // Placeholder for Stripe checkout logic
    console.log(`Initiating checkout for ${plan} plan for user ${user.uid}`);
    toast({
      title: "Coming Soon!",
      description: "Payment processing is currently under development. Please check back later."
    });
    
    // Simulate network request
    setTimeout(() => {
      setLoading(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between h-20 px-4 md:px-8 bg-background/80 backdrop-blur-sm border-b">
        <h1 className="font-headline text-3xl font-bold text-primary">
          <Link href="/">Connect Now</Link>
        </h1>
        <Button variant="secondary" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </header>
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-headline text-5xl md:text-6xl font-bold">Simple, transparent pricing</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">
              Choose the plan that's right for you. No hidden fees.
            </p>
          </div>
          <div className="flex flex-col lg:flex-row justify-center items-center gap-8">
            <Card className="w-full max-w-md shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-3xl">Monthly</CardTitle>
                <CardDescription>Perfect for getting started and short-term projects.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-5xl font-bold">
                  $19 <span className="text-lg font-medium text-muted-foreground">/ month</span>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={() => handleCheckout('monthly')} disabled={loading === 'monthly'}>
                   {loading === 'monthly' ? <Loader2 className="animate-spin" /> : 'Choose Monthly'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="w-full max-w-md shadow-2xl border-primary border-2 relative overflow-hidden">
               <Badge variant="secondary" className="absolute top-4 right-4 bg-primary text-primary-foreground">Best Value</Badge>
              <CardHeader>
                <CardTitle className="font-headline text-3xl">Yearly</CardTitle>
                <CardDescription>Save over 12% with our annual plan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-5xl font-bold">
                  $199 <span className="text-lg font-medium text-muted-foreground">/ year</span>
                </div>
                 <ul className="space-y-3 text-muted-foreground">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={() => handleCheckout('yearly')} disabled={loading === 'yearly'}>
                   {loading === 'yearly' ? <Loader2 className="animate-spin" /> : 'Choose Yearly'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
      <footer className="py-8 border-t bg-secondary/30">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
           <div className="flex justify-center gap-4 mb-2">
            <Link href="/legal" className="text-sm hover:underline">Legal Information</Link>
            <Link href="/terms" className="text-sm hover:underline">Terms of Use</Link>
            <Link href="/contact" className="text-sm hover:underline">Contact Support</Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Connect Now. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
