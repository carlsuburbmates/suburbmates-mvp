
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
import type { Dispute } from '@/lib/types';
import { ShieldAlert, ExternalLink, GanttChartSquare } from 'lucide-react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function VendorDisputesPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const disputesQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'disputes'), where('vendorId', '==', user.uid))
        : null,
    [firestore, user]
  );
  const { data: disputes, isLoading } =
    useCollection<Dispute>(disputesQuery);

  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" => {
    switch(status) {
        case 'warning_needs_response':
        case 'under_review':
            return 'destructive';
        case 'won':
            return 'default';
        case 'lost':
            return 'secondary';
        default:
            return 'secondary';
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-destructive" />
          Manage Payment Disputes
        </CardTitle>
        <CardDescription>
          A dispute is opened when a customer questions a payment with their bank. You must respond with evidence in your Stripe Dashboard to resolve them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Evidence Due By</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!isLoading && disputes && disputes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Evidence Due By</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((dispute) => (
                <TableRow key={dispute.id} className={dispute.status === 'warning_needs_response' ? 'bg-destructive/10' : ''}>
                  <TableCell className="font-mono text-xs">{dispute.orderId}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(dispute.status)}>
                      {dispute.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                   <TableCell className='capitalize'>{dispute.reason.replace(/_/g, ' ')}</TableCell>
                  <TableCell>{new Date(dispute.evidenceDueBy).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm">
                       <a href={`https://dashboard.stripe.com/disputes/${dispute.stripeDisputeId}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Respond in Stripe
                       </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          !isLoading && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <GanttChartSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No active disputes</h3>
                <p className="text-muted-foreground text-sm mt-1">
                Any payment disputes from customers will appear here.
                </p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
