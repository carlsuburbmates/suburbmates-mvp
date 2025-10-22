
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
import type { Order } from '@/lib/types';
import { ShoppingBag, FileQuestion } from 'lucide-react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ResidentOrdersPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!firestore || !user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const allOrders: Order[] = [];
      const vendorsSnapshot = await getDocs(collection(firestore, 'vendors'));

      for (const vendorDoc of vendorsSnapshot.docs) {
        const ordersRef = collection(firestore, `vendors/${vendorDoc.id}/orders`);
        const q = query(ordersRef, where('buyerId', '==', user.uid));
        const ordersSnapshot = await getDocs(q);
        ordersSnapshot.forEach(orderDoc => {
          allOrders.push({ id: orderDoc.id, ...orderDoc.data() } as Order);
        });
      }
      
      allOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(allOrders);
      setIsLoading(false);
    }

    fetchOrders();
  }, [firestore, user]);


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
                    <Badge
                      variant={
                        order.status === 'Completed'
                          ? 'default'
                          : order.status === 'Pending'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ${order.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {order.status === 'Completed' && (
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
