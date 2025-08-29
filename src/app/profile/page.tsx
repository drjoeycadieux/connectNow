
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, updateProfile, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, DocumentData } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName || '');
        
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setCustomDomain(data.customDomain || '');
        }
      } else {
        router.push('/auth');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    if (displayName.trim() === '') {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: 'Display name cannot be empty.',
        });
        return;
    }
    
    // Simple domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (customDomain && !domainRegex.test(customDomain)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Domain',
        description: 'Please enter a valid domain name.',
      });
      return;
    }

    setSaving(true);
    try {
      if (user.displayName !== displayName) {
         await updateProfile(auth.currentUser!, { displayName });
      }
      
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { 
          displayName,
          customDomain: customDomain || null,
      });

      toast({
        title: 'Success',
        description: 'Your profile has been updated.',
      });
      // The onAuthStateChanged listener will handle updating the user state
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const isYearlyPlan = userData?.plan === 'yearly';


  if (loading) {
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
            <main className="flex-1 flex items-center justify-center py-12">
                 <Card className="w-full max-w-2xl">
                    <CardHeader>
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                               <Skeleton className="h-4 w-1/4" />
                               <Skeleton className="h-10 w-full" />
                            </div>
                             <div className="space-y-2">
                               <Skeleton className="h-4 w-1/4" />
                               <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                             <div className="space-y-2">
                               <Skeleton className="h-6 w-1/3" />
                               <Skeleton className="h-4 w-2/3" />
                            </div>
                             <div className="space-y-2">
                               <Skeleton className="h-4 w-1/4" />
                               <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Skeleton className="h-10 w-32" />
                    </CardFooter>
                 </Card>
            </main>
        </div>
    )
  }

  if (!user) {
    return null; // Redirecting in useEffect
  }

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
      <main className="flex-1 flex items-center justify-center py-12">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>View and update your personal information and settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>
            </div>

            <Separator />
            
            <div className="space-y-4">
                 <CardHeader className="p-0">
                    <CardTitle className="text-xl">Custom Domain</CardTitle>
                    <CardDescription>
                        {isYearlyPlan ? 'Use your own domain for meeting links.' : 'Upgrade to the yearly plan to use a custom domain.'}
                    </CardDescription>
                </CardHeader>
                <div className="space-y-2">
                  <Label htmlFor="customDomain">Your Domain</Label>
                   <Input
                    id="customDomain"
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="e.g., meet.yourcompany.com"
                    disabled={!isYearlyPlan || saving}
                  />
                  {isYearlyPlan && customDomain && (
                      <p className="text-sm text-muted-foreground">
                          To complete setup, create a CNAME record in your DNS provider pointing <code className="bg-muted px-1 py-0.5 rounded">{customDomain}</code> to <code className="bg-muted px-1 py-0.5 rounded">connectnow.example.com</code>.
                      </p>
                  )}
                </div>
            </div>

          </CardContent>
          <CardFooter>
             <Button onClick={handleUpdateProfile} disabled={saving} className="w-full md:w-auto">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
