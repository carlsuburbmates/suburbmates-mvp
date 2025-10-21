
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import type { Vendor } from '@/lib/types';
import { collection } from 'firebase/firestore';
import { toggleVendorPayments } from './actions';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [updatingVendorId, setUpdatingVendorId] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        user.getIdTokenResult().then(idTokenResult => {
          if (idTokenResult.claims.admin) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            router.replace('/'); // Redirect non-admins
          }
        });
      } else {
        router.replace('/vendors/onboard'); // Redirect unauthenticated users
      }
    }
  }, [user, isUserLoading, router]);

  const vendorsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'vendors') : null),
    [firestore]
  );
  const { data: vendors, isLoading: areVendorsLoading } = useCollection<Vendor>(vendorsQuery);

  const handleToggle = async (vendor: Vendor) => {
    if (!auth.currentUser) {
        toast({ variant: 'destructive', title: 'Authentication Error' });
        return;
    }
    setUpdatingVendorId(vendor.id);
    try {
        const idToken = await auth.currentUser.getIdToken();
        
        // This is a workaround to pass auth to the server action
        const tempFetch = global.fetch;
        global.fetch = (url, options) => {
            const newOptions = {
                ...options,
                headers: {
                    ...options?.headers,
                    'Authorization': `Bearer ${idToken}`
                }
            };
            return tempFetch(url, newOptions);
        }

        const result = await toggleVendorPayments(vendor.id, vendor.paymentsEnabled || false);
        
        global.fetch = tempFetch; // Restore original fetch

        if (result.success) {
            toast({
                title: 'Vendor Updated',
                description: `${vendor.businessName} payments are now ${result.newState ? 'enabled' : 'disabled'}.`
            });
        } else {
            throw new Error(result.error);
        }

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'Could not update vendor status.'
        });
    } finally {
        setUpdatingVendorId(null);
    }
  };


  if (isAdmin === null || isUserLoading) {
    return (
        <div className="container mx-auto px-4 py-8">
            <PageHeader title="Admin Dashboard" description="Verifying permissions..." />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  if (isAdmin === false) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <ShieldAlert className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">You do not have permission to view this page.</p>
             <Button onClick={() => router.push('/')} className="mt-4">Go to Homepage</Button>
        </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Manage vendors and platform settings."
      />
      <div className="container mx-auto px-4 pb-16">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Management</CardTitle>
            <CardDescription>
              Approve new vendors and manage their payment status. Payments should only be enabled for verified businesses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Stripe Account ID</TableHead>
                  <TableHead>Payments Enabled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areVendorsLoading && Array.from({length:3}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                        <TableCell><Skeleton className="h-5 w-40"/></TableCell>
                        <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                        <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                    </TableRow>
                ))}
                {vendors?.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.businessName}</TableCell>
                    <TableCell>{vendor.email}</TableCell>
                    <TableCell>
                        <Badge variant={vendor.stripeAccountId ? 'secondary' : 'outline'}>
                            {vendor.stripeAccountId || 'Not Connected'}
                        </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {updatingVendorId === vendor.id ? (
                           <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                           <Switch
                                checked={vendor.paymentsEnabled}
                                onCheckedChange={() => handleToggle(vendor)}
                                disabled={!vendor.stripeAccountId}
                                aria-label="Toggle payments"
                            />
                        )}
                        <Badge variant={vendor.paymentsEnabled ? 'default' : 'destructive'}>
                            {vendor.paymentsEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!areVendorsLoading && vendors?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No vendors have signed up yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
