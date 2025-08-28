
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="24px"
        height="24px"
        {...props}
      >
        <path
          fill="#FFC107"
          d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
        />
        <path
          fill="#FF3D00"
          d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
	C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
        />
        <path
          fill="#4CAF50"
          d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
        />
        <path
          fill="#1976D2"
          d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238
	C42.718,36.43,44,34,44,31C44,27.202,44,23.308,43.611,20.083z"
        />
      </svg>
    )
}

export default function AuthPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (action: 'signup' | 'login' | 'team_login') => {
    setLoading(true);
    try {
      let userCredential;
      if (action === 'signup') {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const displayName = user.email?.split('@')[0] || 'User';
        await updateProfile(user, { displayName });
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: displayName,
          createdAt: new Date(),
        });
      } else { // 'login' or 'team_login'
        userCredential = await signInWithEmailAndPassword(auth, email, password);
         if (action === 'team_login') {
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            if (!userDoc.exists() || !userDoc.data().isTeamMember) {
                 toast({
                    variant: 'destructive',
                    title: 'Access Denied',
                    description: 'This login is for team members only.',
                 });
                 await auth.signOut();
                 setLoading(false);
                 return;
            }
            router.push('/admin/dashboard');
            return;
        }
      }
      toast({ title: 'Success', description: `Successfully ${action === 'signup' ? 'signed up' : 'logged in'}.` });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };
  
   const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName,
          createdAt: new Date(),
          provider: 'google',
        });
      }

      toast({ title: 'Success', description: 'Successfully logged in with Google.' });
      router.push('/');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
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
       <main className="flex-1 flex items-center justify-center py-12">
        <Tabs defaultValue="login" className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="team">Team Sign-in</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Login</CardTitle>
                <CardDescription>Access your account to start or join meetings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                   <GoogleIcon className="mr-2 h-5 w-5"/>
                  Sign in with Google
                </Button>
                <div className="flex items-center gap-2">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button onClick={() => handleAuthAction('login')} disabled={loading} className="w-full">
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Sign Up</CardTitle>
                <CardDescription>Create an account to unlock all features.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={loading}>
                  <GoogleIcon className="mr-2 h-5 w-5"/>
                  Sign up with Google
                </Button>
                <div className="flex items-center gap-2">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <Separator className="flex-1" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button onClick={() => handleAuthAction('signup')} disabled={loading} className="w-full">
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
           <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team Sign-in</CardTitle>
                <CardDescription>For authorized support staff only.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-email">Team Email</Label>
                  <Input id="team-email" type="email" placeholder="support@connectnow.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-password">Password</Label>
                  <Input id="team-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button onClick={() => handleAuthAction('team_login')} disabled={loading} className="w-full">
                  {loading ? 'Signing in...' : 'Sign In as Team Member'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
