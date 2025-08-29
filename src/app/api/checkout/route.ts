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
import { cn } from '@/lib/utils';

const freeFeatures = [
  "Up to 10 Participants",
  "End-to-End Encrypted Chat",
  "File Sharing",
  "Community Support",
];

const proFeatures = [
  "Unlimited Participants",
  "Priority Email Support",
  "Team Management Dashboard",
  "Custom Integrations",
];

const enterpriseFeatures = [
  "Everything in Pro, plus:",
  "Dedicated Onboarding",
  "24/7 Priority Support",
  "Audit Logs & Compliance",
  "On-premise Deployment Option",
];


export default function PricingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<'pro' | 'enterprise' | null>(null);
  const [user, setUser] = useState<User | null>(auth.currentUser);

  useState(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  });

  const handleCheckout = async (plan: 'pro' | 'enterprise') => {
    if (!user) {
      router.push('/auth?redirect=/pricing');
      return;
    }
    
    if (plan === 'enterprise') {
        router.push('/contact');
        return;
    }
    
    setLoading(plan);
    
    try {
      // This is a placeholder for Stripe integration
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: "Redirecting to checkout...",
        description: "This is a demo and will not process a real payment.",
      });
      setLoading(null);
      // In a real app, you would fetch a checkout URL from your backend
      // const response = await fetch('/api/checkout', { ... });
      // const { url } = await response.json();
      // router.push(url);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Could not start checkout process."
      });
      setLoading(null);
    }
  };
  
  const handleGetStarted = () => {
    router.push('/auth');
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
              Choose the plan that's right for your team. No hidden fees.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 justify-center items-start gap-8">
            <Card className="w-full max-w-md mx-auto lg:max-w-none shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-3xl">Free</CardTitle>
                <CardDescription>Perfect for personal use and small teams.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-5xl font-bold">
                  $0
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  {freeFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" variant="outline" onClick={handleGetStarted}>
                   Get Started
                </Button>
              </CardFooter>
            </Card>

            <Card className="w-full max-w-md mx-auto lg:max-w-none shadow-2xl border-primary border-2 relative overflow-hidden">
               <Badge variant="secondary" className="absolute top-4 right-4 bg-primary text-primary-foreground">Best Value</Badge>
              <CardHeader>
                <CardTitle className="font-headline text-3xl">Pro</CardTitle>
                <CardDescription>For growing teams that need more power and support.</CardDescription>
              </ACardHeader>
              <CardContent className="space-y-6">
                <div className="text-5xl font-bold">
                  $25 <span className="text-lg font-medium text-muted-foreground">/ user / month</span>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  {proFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={() => handleCheckout('pro')} disabled={loading === 'pro'}>
                   {loading === 'pro' ? <Loader2 className="animate-spin" /> : 'Choose Pro'}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="w-full max-w-md mx-auto lg:max-w-none shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-3xl">Enterprise</CardTitle>
                <CardDescription>For large organizations with specific needs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="text-5xl font-bold">
                  Custom
                </div>
                 <ul className="space-y-3 text-muted-foreground">
                  {enterpriseFeatures.map((feature, index) => (
                    <li key={feature} className="flex items-center gap-3">
                      <Check className={cn("h-5 w-5 text-primary", index === 0 && "opacity-0")} />
                      <span className={cn(index === 0 && "font-bold text-foreground")}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={() => handleCheckout('enterprise')} disabled={loading === 'enterprise'}>
                   {loading === 'enterprise' ? <Loader2 className="animate-spin" /> : 'Contact Sales'}
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