
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
import type { Order, RefundRequest } from '@/lib/types';
import { ShoppingBag, FileQuestion, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type OrderWithRefundState = Order & { refundState?: RefundRequest['state'] };

export default function ResidentOrdersPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [orders, setOrders] = useState<OrderWithRefundState[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrdersAndRefunds() {
      if (!firestore || !user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const allOrders: OrderWithRefundState[] = [];
      const refundRequests = new Map<string, RefundRequest>();
      
      const vendorsSnapshot = await getDocs(collection(firestore, 'vendors'));

      // Fetch all refund requests first to build a map
      for (const vendorDoc of vendorsSnapshot.docs) {
        const refundsRef = collection(firestore, `vendors/${vendorDoc.id}/refund_requests`);
        const refundsQuery = query(refundsRef, where('buyerId', '==', user.uid));
        const refundsSnapshot = await getDocs(refundsQuery);
        refundsSnapshot.forEach(refundDoc => {
          const refund = { id: refundDoc.id, ...refundDoc.data() } as RefundRequest;
          refundRequests.set(refund.orderId, refund);
        });
      }

      // Fetch orders and attach refund state
      for (const vendorDoc of vendorsSnapshot.docs) {
        const ordersRef = collection(firestore, `vendors/${vendorDoc.id}/orders`);
        const q = query(ordersRef, where('buyerId', '==', user.uid));
        const ordersSnapshot = await getDocs(q);
        ordersSnapshot.forEach(orderDoc => {
          const order = { id: orderDoc.id, ...orderDoc.data() } as OrderWithRefundState;
          const refund = refundRequests.get(order.id);
          if (refund) {
            order.refundState = refund.state;
          }
          allOrders.push(order);
        });
      }
      
      allOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(allOrders);
      setIsLoading(false);
    }

    fetchOrdersAndRefunds();
  }, [firestore, user]);

  const getStatusBadge = (order: OrderWithRefundState) => {
    if (order.refundState) {
        switch (order.refundState) {
            case 'OPEN':
            case 'VENDOR_REVIEW':
            case 'STRIPE_PROCESSING':
                return <Badge variant="secondary"><Clock className="mr-1.5 h-3 w-3"/>Refund Pending</Badge>;
            case 'RESOLVED':
                return <Badge variant="default"><CheckCircle className="mr-1.5 h-3 w-3"/>Refunded</Badge>;
            case 'REJECTED':
                return <Badge variant="destructive"><XCircle className="mr-1.5 h-3 w-3"/>Refund Rejected</Badge>;
        }
    }
     return <Badge
        variant={
            order.status === 'Completed'
            ? 'default'
            : order.status === 'Pending'
            ? 'secondary'
            : 'destructive'
        }
        >
        {order.status}
    </Badge>;
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Your Purchase History</CardTitle>
        <CardDescription>
          A history of all your purchases from local vendors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!isLoading && orders && orders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <Link href={`/vendors/${order.vendorId}`} className='hover:underline'>{order.listingName}</Link>
                  </TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {getStatusBadge(order)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${order.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === 'Completed' && !order.refundState && (
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/resident/refunds/${order.id}?vendorId=${order.vendorId}`}>
                                <FileQuestion className="mr-2 h-4 w-4" />
                                Request Refund
                            </Link>
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          !isLoading && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">You haven't made any purchases yet</h3>
                <p className="text-muted-foreground text-sm mt-1">
                    When you buy something from a local vendor, it will appear here.
                </p>
                 <Button asChild className="mt-4">
                    <Link href="/vendors">Browse the Directory</Link>
                </Button>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

    