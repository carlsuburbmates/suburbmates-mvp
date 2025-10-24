
'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter }from 'next/navigation';
import { useAuth, useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import type { Vendor, Dispute, LogEntry, VerificationSummary } from '@/lib/types';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { toggleVendorPayments } from './actions';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, Loader2, Server, Mail, GanttChartSquare, Info, ExternalLink, Eye, Search, CheckCircle2, AlertTriangle, XCircle, Sparkles, MessageCircleQuestion } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const AiRecommendationBadge = ({ rec }: { rec: VerificationSummary['overallRecommendation'] }) => {
    switch (rec) {
        case 'AUTO_APPROVE':
            return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="mr-1.5 h-3 w-3" />Approve</Badge>;
        case 'NEEDS_REVIEW':
            return <Badge variant="secondary" className="bg-amber-500 hover:bg-amber-600"><AlertTriangle className="mr-1.5 h-3 w-3" />Review</Badge>;
        case 'AUTO_REJECT':
            return <Badge variant="destructive"><XCircle className="mr-1.5 h-3 w-3" />Reject</Badge>;
        default:
            return <Badge variant="outline">N/A</Badge>;
    }
};

function VendorManagementTab({ isAdmin }: { isAdmin: boolean }) {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [updatingVendorId, setUpdatingVendorId] = useState<string | null>(null);
  const [showPendingOnly, setShowPendingOnly] = useState(false);

  const vendorsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'vendors') : null),
    [firestore]
  );
  const { data: allVendors, isLoading: areVendorsLoading } = useCollection<Vendor>(vendorsQuery);
  
  const vendors = useMemo(() => {
    if (!allVendors) return [];
    let filteredVendors = allVendors;
    if (showPendingOnly) {
      filteredVendors = allVendors.filter(v => v.stripeAccountId && !v.paymentsEnabled);
    }
    
    // Sort to bring 'NEEDS_REVIEW' and 'AUTO_REJECT' to the top
    return filteredVendors.sort((a, b) => {
        const aRec = a.verificationSummary?.overallRecommendation;
        const bRec = b.verificationSummary?.overallRecommendation;
        const priority = { 'AUTO_REJECT': 3, 'NEEDS_REVIEW': 2, 'AUTO_APPROVE': 1 };
        return (priority[bRec as keyof typeof priority] || 0) - (priority[aRec as keyof typeof priority] || 0);
    });
  }, [allVendors, showPendingOnly]);


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
          Approve new vendors and manage their payment status. Vendors are sorted by AI recommendation priority.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
            <Switch
                id="pending-only"
                checked={showPendingOnly}
                onCheckedChange={setShowPendingOnly}
            />
            <Label htmlFor="pending-only">Show Pending Approval Only</Label>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>AI Recommendation</TableHead>
              <TableHead>Stripe Status</TableHead>
              <TableHead>Payments Enabled</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {areVendorsLoading && Array.from({length:3}).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32"/></TableCell>
                    <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                    <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                    <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                    <TableCell><Skeleton className="h-8 w-20"/></TableCell>
                </TableRow>
            ))}
            {vendors?.map((vendor) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">{vendor.businessName}</TableCell>
                <TableCell>
                  {vendor.verificationSummary ? (
                    <AiRecommendationBadge rec={vendor.verificationSummary.overallRecommendation} />
                  ) : (
                    <Badge variant="outline">N/A</Badge>
                  )}
                </TableCell>
                <TableCell>
                    <Badge variant={vendor.stripeAccountId ? 'secondary' : 'outline'}>
                        {vendor.stripeAccountId ? 'Connected' : 'Not Connected'}
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
                <TableCell>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">View Details</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{vendor.businessName}</DialogTitle>
                                <DialogDescription>
                                    Review vendor details and AI analysis before enabling payments.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 text-sm">
                                <div className="space-y-4">
                                     <h4 className="font-semibold text-base">Business Details</h4>
                                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                                        <span className="text-muted-foreground">ABN</span>
                                        <span className="font-mono">{vendor.abn} <Badge variant={vendor.abnVerified ? 'secondary' : 'destructive'}>{vendor.abnVerified ? 'Verified' : 'Not Verified'}</Badge></span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                                        <span className="text-muted-foreground">Address</span>
                                        <span>{vendor.address}</span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                                        <span className="text-muted-foreground">Phone</span>
                                        <span>{vendor.phone || 'N/A'}</span>
                                    </div>
                                    <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                                        <span className="text-muted-foreground">Website</span>
                                        <span>{vendor.website ? <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">{vendor.website}</a> : 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                                    <h4 className="font-semibold text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary"/>AI Analysis</h4>
                                    {vendor.verificationSummary ? (
                                        <>
                                            <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                                                <span className="text-muted-foreground">Recommendation</span>
                                                <div className='flex items-center gap-2'><AiRecommendationBadge rec={vendor.verificationSummary.overallRecommendation} /></div>
                                            </div>
                                            <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                                                <span className="text-muted-foreground">Reason</span>
                                                <span>{vendor.verificationSummary.recommendationReason}</span>
                                            </div>
                                             <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                                                <span className="text-muted-foreground">Desc. Quality</span>
                                                <span>{vendor.verificationSummary.descriptionQuality.score}/10</span>
                                            </div>
                                             <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                                                <span className="text-muted-foreground">Category Match</span>
                                                <span>{vendor.verificationSummary.categoryVerification.isMatch ? 'Yes' : `No (Suggests: ${vendor.verificationSummary.categoryVerification.suggestion})`}</span>
                                            </div>
                                            <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                                                <span className="text-muted-foreground">Safety Rating</span>
                                                 <Badge variant={vendor.verificationSummary.safetyAnalysis.rating === 'SAFE' ? 'secondary' : 'destructive'}>{vendor.verificationSummary.safetyAnalysis.rating}</Badge>
                                            </div>
                                        </>
                                    ) : (
                                        <p className='text-muted-foreground'>No AI analysis available.</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button asChild>
                                    <Link href={`/vendors/${vendor.id}`} target="_blank">View Public Profile</Link>
                                </Button>
                                {vendor.stripeAccountId && (
                                     <Button asChild variant="secondary">
                                        <a href={`https://dashboard.stripe.com/accounts/${vendor.stripeAccountId}`} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="mr-2 h-4 w-4"/>
                                            View in Stripe
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!areVendorsLoading && vendors?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              {showPendingOnly ? "No vendors are currently pending approval." : "No vendors have signed up yet."}
            </p>
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

  const getRiskVariant = (level: 'LOW' | 'MEDIUM' | 'HIGH' | undefined): "default" | "secondary" | "destructive" => {
    switch (level) {
        case 'HIGH': return 'destructive';
        case 'MEDIUM': return 'secondary';
        case 'LOW': return 'default';
        default: return 'outline' as any;
    }
  }

  return (
     <Card>
      <CardHeader>
        <CardTitle>Platform Disputes</CardTitle>
        <CardDescription>
          A log of all payment disputes across the platform, summarized by AI.
        </CardDescription>
      </CardHeader>
      <CardContent>
          {isLoading && <Skeleton className="h-48 w-full" />}
          {!isLoading && disputes && disputes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>AI Risk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell>{format(new Date(dispute.createdAt), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="font-mono text-xs">{dispute.vendorId}</TableCell>
                  <TableCell className='text-sm'>
                    {dispute.disputeSummary?.summary || dispute.reason}
                    {dispute.disputeSummary && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="link" size="sm" className="p-1 h-auto ml-1"><MessageCircleQuestion /></Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle className='flex items-center gap-2'><Sparkles className="h-4 w-4 text-primary"/>AI Dispute Analysis</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4 text-sm">
                                    <div>
                                        <h4 className="font-semibold">Recommended Action</h4>
                                        <p className="text-muted-foreground">{dispute.disputeSummary.recommendedAction}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Raw Stripe Reason</h4>
                                        <p className="text-muted-foreground font-mono text-xs">{dispute.reason}</p>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                  </TableCell>
                  <TableCell>
                      <Badge variant={getRiskVariant(dispute.disputeSummary?.riskLevel)}>
                          {dispute.disputeSummary?.riskLevel || 'N/A'}
                      </Badge>
                  </TableCell>
                  <TableCell>
                      <Badge variant={dispute.status === 'warning_needs_response' ? 'destructive' : 'secondary'}>
                          {dispute.status}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-right">${(dispute.amount / 100).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/>View</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Dispute Details</DialogTitle>
                                <DialogDescription>Stripe Dispute ID: {dispute.stripeDisputeId}</DialogDescription>
                            </DialogHeader>
                            <pre className="mt-2 w-full overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs">
                                {JSON.stringify(dispute, null, 2)}
                            </pre>
                            <div className="flex gap-2">
                                <Button asChild variant="secondary">
                                    <a href={`https://dashboard.stripe.com/disputes/${dispute.stripeDisputeId}`} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="mr-2 h-4 w-4"/>
                                        View in Stripe
                                    </a>
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                  </TableCell>
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
  const [searchTerm, setSearchTerm] = useState('');
  const logsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'logs/webhooks/events'), orderBy('timestamp', 'desc'), limit(50)) : null),
    [firestore]
  );
  const { data: logs, isLoading } = useCollection<LogEntry>(logsQuery);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    if (!searchTerm) return logs;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return logs.filter(log => {
      const eventType = (log.payload as any)?.type?.toLowerCase() || '';
      const eventId = log.eventId.toLowerCase();
      return eventType.includes(lowerCaseSearchTerm) || eventId.includes(lowerCaseSearchTerm);
    });
  }, [logs, searchTerm]);

  return (
     <Card>
      <CardHeader>
        <CardTitle>Stripe Webhook Logs</CardTitle>
        <CardDescription>
          Shows the 50 most recent incoming events from Stripe for auditing and debugging.
        </CardDescription>
      </CardHeader>
      <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by event type or ID..."
              className="pl-8 sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isLoading && <Skeleton className="h-48 w-full" />}
          {!isLoading && logs && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Event ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                      <TableCell className="font-medium">{(log.payload as any)?.type}</TableCell>
                      <TableCell>
                          <Badge variant={log.status === 'failed' ? 'destructive' : 'secondary'}>
                              {log.status}
                          </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.eventId}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/>View Payload</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Webhook Event Payload</DialogTitle>
                                    <DialogDescription>ID: {log.eventId}</DialogDescription>
                                </DialogHeader>
                                <pre className="mt-2 max-h-[60vh] w-full overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs">
                                    {JSON.stringify(log.payload, null, 2)}
                                </pre>
                            </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredLogs.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Server className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 font-semibold">No matching logs found</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Try a different search term or clear the search.
                    </p>
                </div>
              )}
            </>
          )}
          {!isLoading && !logs && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Server className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No webhook events logged yet</h3>
            </div>
          )}
      </CardContent>
    </Card>
  )
}

function EmailLogsTab() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const logsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'logs/emails/sends'), orderBy('timestamp', 'desc'), limit(50)) : null),
    [firestore]
  );
  const { data: logs, isLoading } = useCollection<LogEntry>(logsQuery);

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    if (!searchTerm) return logs;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return logs.filter(log => {
      const to = (log.payload as any)?.to?.toLowerCase() || '';
      const subject = (log.payload as any)?.subject?.toLowerCase() || '';
      return to.includes(lowerCaseSearchTerm) || subject.includes(lowerCaseSearchTerm);
    });
  }, [logs, searchTerm]);

  return (
     <Card>
      <CardHeader>
        <CardTitle>Transactional Email Logs</CardTitle>
        <CardDescription>
          Shows the 50 most recent transactional emails sent via Resend.
        </CardDescription>
      </CardHeader>
      <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by recipient or subject..."
              className="pl-8 sm:w-[300px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isLoading && <Skeleton className="h-48 w-full" />}
          {!isLoading && logs && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                      <TableCell>{(log.payload as any)?.to}</TableCell>
                      <TableCell className="font-medium">{(log.payload as any)?.subject}</TableCell>
                      <TableCell>
                          <Badge variant={log.status === 'failed' ? 'destructive' : 'secondary'}>
                              {log.status}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/>View Details</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Email Log Details</DialogTitle>
                                    <DialogDescription>Log ID: {log.id}</DialogDescription>
                                </DialogHeader>
                                <pre className="mt-2 w-full overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs">
                                    {JSON.stringify(log.payload, null, 2)}
                                </pre>
                            </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredLogs.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 font-semibold">No matching emails found</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Try a different search term or clear the search.
                    </p>
                </div>
              )}
            </>
          )}
          {!isLoading && !logs && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No emails sent yet</h3>
            </div>
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
        router.replace('/login'); // Redirect unauthenticated users
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
