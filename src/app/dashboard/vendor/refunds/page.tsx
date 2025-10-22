
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { RefundRequest, Order } from '@/lib/types';
import { FileQuestion, Check, X, Loader2 } from 'lucide-react';
import { useUser, useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { approveRefund, rejectRefund } from './actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function VendorRefundsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();

  const [processingId, setProcessingId] = useState<string | null>(null);

  const requestsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'vendors', user.uid, 'refund_requests'), orderBy('state', 'asc'))
        : null,
    [firestore, user]
  );
  const { data: requests, isLoading: areRequestsLoading } =
    useCollection<RefundRequest>(requestsQuery);

  const handleApprove = async (request: RefundRequest) => {
    if (!auth.currentUser) return;
    setProcessingId(request.id);
    try {
      const idToken = await auth.currentUser.getIdToken();
      const result = await approveRefund(request.id, user!.uid, idToken);
      if (result.success) {
        toast({
          title: 'Refund Approved',
          description: `The refund has been processed via Stripe.`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Approval Failed',
        description: error.message || 'Could not process the refund.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: RefundRequest) => {
    if (!auth.currentUser) return;
    setProcessingId(request.id);
     try {
      const idToken = await auth.currentUser.getIdToken();
      const result = await rejectRefund(request.id, user!.uid, "Vendor has rejected this request.", idToken);
       if (result.success) {
        toast({
          title: 'Refund Rejected',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: error.message || 'Could not reject the refund request.',
      });
    } finally {
      setProcessingId(null);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Manage Refund Requests</CardTitle>
        <CardDescription>
          Review and respond to refund requests from your customers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {areRequestsLoading && (
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!areRequestsLoading && requests && requests.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-mono text-xs">{request.orderId}</TableCell>
                  <TableCell>
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="link" className="p-0 h-auto">View Reason</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                            <DialogTitle>Reason for Refund</DialogTitle>
                            <DialogDescription className="pt-4">{request.reason}</DialogDescription>
                            </DialogHeader>
                        </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        request.state === 'OPEN'
                          ? 'destructive'
                          : request.state === 'RESOLVED'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {request.state}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {request.state === 'OPEN' && (
                        processingId === request.id ? (
                            <Button disabled size="sm">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </Button>
                        ) : (
                            <>
                               <Button variant="outline" size="sm" onClick={() => handleApprove(request)}>
                                    <Check className="mr-2 h-4 w-4" /> Approve
                               </Button>
                               <Button variant="destructive" size="sm" onClick={() => handleReject(request)}>
                                    <X className="mr-2 h-4 w-4" /> Reject
                               </Button>
                            </>
                        )
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          !areRequestsLoading && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No refund requests</h3>
                <p className="text-muted-foreground text-sm mt-1">
                Any requests from customers will appear here.
                </p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
