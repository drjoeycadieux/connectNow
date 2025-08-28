
'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, DocumentData, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';


interface ManagedUser extends DocumentData {
  id: string;
  displayName: string;
  email: string;
  plan?: 'monthly' | 'yearly';
  isTeamMember?: boolean;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check for team member status
        const userDoc = await getDocs(collection(db, 'users'));
        const userData = userDoc.docs.find(d => d.id === currentUser.uid)?.data();
        if (userData?.isTeamMember) {
           setIsTeamMember(true);
           fetchUsers();
        } else {
           toast({
               variant: "destructive",
               title: "Access Denied",
               description: "You do not have permission to view this page.",
           });
           router.push('/');
        }
      } else {
        router.push('/auth');
      }
    });

    const fetchUsers = async () => {
        setLoading(true);
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManagedUser));
        setUsers(usersList);
        setLoading(false);
    };

    return () => unsubscribe();
  }, [router, toast]);

  const handlePlanChange = async (userId: string, newPlan: 'monthly' | 'yearly' | 'none') => {
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        plan: newPlan === 'none' ? null : newPlan,
      });
      setUsers(users.map(u => u.id === userId ? { ...u, plan: newPlan === 'none' ? undefined : newPlan } : u));
      toast({
        title: "Success",
        description: "User's plan has been updated.",
      });
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    }
  };
  
   const toggleTeamStatus = async (userId: string, isCurrentlyTeamMember: boolean) => {
    try {
        const userDocRef = doc(db, 'users', userId);
        await setDoc(userDocRef, { isTeamMember: !isCurrentlyTeamMember }, { merge: true });
        setUsers(users.map(u => u.id === userId ? { ...u, isTeamMember: !isCurrentlyTeamMember } : u));
        toast({
            title: "Success",
            description: `User is ${!isCurrentlyTeamMember ? 'now' : 'no longer'} a team member.`,
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message,
        });
    }
  };


  if (!isTeamMember) {
     return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-muted-foreground bg-background">
            <p className="text-lg">Redirecting...</p>
        </div>
     );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 flex items-center justify-between h-20 px-4 md:px-8 bg-background/80 backdrop-blur-sm border-b">
        <h1 className="font-headline text-3xl font-bold text-primary">
          <Link href="/">Connect Now</Link>
        </h1>
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Admin View</span>
            <Button variant="secondary" asChild>
                <Link href="/">Back to Home</Link>
            </Button>
        </div>
      </header>
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>Manage users and their subscription plans.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Team Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="font-medium">{u.displayName}</div>
                          <div className="text-sm text-muted-foreground">{u.email}</div>
                        </TableCell>
                        <TableCell>
                           {u.plan ? <Badge variant={u.plan === 'yearly' ? 'default' : 'secondary'}>{u.plan}</Badge> : <Badge variant="outline">None</Badge>}
                        </TableCell>
                        <TableCell>
                            {u.isTeamMember ? <Badge>Team Member</Badge> : <Badge variant="outline">User</Badge>}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Select
                            value={u.plan || 'none'}
                            onValueChange={(value: 'monthly' | 'yearly' | 'none') => handlePlanChange(u.id, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Change Plan" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleTeamStatus(u.id, !!u.isTeamMember)}
                           >
                            {u.isTeamMember ? 'Remove from Team' : 'Add to Team'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
