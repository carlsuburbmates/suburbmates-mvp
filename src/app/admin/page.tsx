
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
import type { Vendor, Dispute, LogEntry } from '@/lib/types';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { toggleVendorPayments } from './actions';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, Loader2, Server, Mail, GanttChartSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

function VendorManagementTab({ isAdmin }: { isAdmin: boolean }) {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [updatingVendorId, setUpdatingVendorId] = useState<string | null>(null);

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

  return (
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
  );
}

function DisputesTab() {
  const firestore = useFirestore();
  const disputesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'disputes'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: disputes, isLoading } = useCollection<Dispute>(disputesQuery);

  return (
     <Card>
      <CardHeader>
        <CardTitle>Platform Disputes</CardTitle>
        <CardDescription>
          A log of all payment disputes across the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
          {isLoading && <Skeleton className="h-48 w-full" />}
          {!isLoading && disputes && disputes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor ID</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell>{format(new Date(dispute.createdAt), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="font-mono text-xs">{dispute.vendorId}</TableCell>
                  <TableCell>{dispute.reason}</TableCell>
                  <TableCell>
                      <Badge variant={dispute.status === 'warning_needs_response' ? 'destructive' : 'secondary'}>
                          {dispute.status}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-right">${(dispute.amount / 100).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          !isLoading && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <GanttChartSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No disputes found</h3>
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}

function WebhookLogsTab() {
  const firestore = useFirestore();
  const logsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'logs/webhooks/events'), orderBy('timestamp', 'desc'), limit(50)) : null),
    [firestore]
  );
  const { data: logs, isLoading } = useCollection<LogEntry>(logsQuery);

  return (
     <Card>
      <CardHeader>
        <CardTitle>Stripe Webhook Logs</CardTitle>
        <CardDescription>
          Shows the 50 most recent incoming events from Stripe for auditing and debugging.
        </CardDescription>
      </CardHeader>
      <CardContent>
          {isLoading && <Skeleton className="h-48 w-full" />}
          {!isLoading && logs && logs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Event ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                  <TableCell className="font-medium">{(log.payload as any)?.type}</TableCell>
                  <TableCell>
                      <Badge variant={log.status === 'failed' ? 'destructive' : 'secondary'}>
                          {log.status}
                      </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{log.eventId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          !isLoading && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Server className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No webhook events logged yet</h3>
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}

function EmailLogsTab() {
  const firestore = useFirestore();
  const logsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'logs/emails/sends'), orderBy('timestamp', 'desc'), limit(50)) : null),
    [firestore]
  );
  const { data: logs, isLoading } = useCollection<LogEntry>(logsQuery);

  return (
     <Card>
      <CardHeader>
        <CardTitle>Transactional Email Logs</CardTitle>
        <CardDescription>
          Shows the 50 most recent transactional emails sent via Resend.
        </CardDescription>
      </CardHeader>
      <CardContent>
          {isLoading && <Skeleton className="h-48 w-full" />}
          {!isLoading && logs && logs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                  <TableCell>{(log.payload as any)?.to}</TableCell>
                  <TableCell className="font-medium">{(log.payload as any)?.subject}</TableCell>
                  <TableCell>
                      <Badge variant={log.status === 'failed' ? 'destructive' : 'secondary'}>
                          {log.status}
                      </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          !isLoading && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No emails sent yet</h3>
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}


export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
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
        description="Manage vendors, disputes, and platform settings."
      />
      <div className="container mx-auto px-4 pb-16">
        <Tabs defaultValue="vendors">
            <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-4 md:w-auto">
                <TabsTrigger value="vendors">Vendor Management</TabsTrigger>
                <TabsTrigger value="disputes">Disputes</TabsTrigger>
                <TabsTrigger value="webhooks">Webhook Logs</TabsTrigger>
                <TabsTrigger value="emails">Email Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="vendors">
                <VendorManagementTab isAdmin={isAdmin} />
            </TabsContent>
            <TabsContent value="disputes">
                <DisputesTab />
            </TabsContent>
             <TabsContent value="webhooks">
                <WebhookLogsTab />
            </TabsContent>
            <TabsContent value="emails">
                <EmailLogsTab />
            </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

    