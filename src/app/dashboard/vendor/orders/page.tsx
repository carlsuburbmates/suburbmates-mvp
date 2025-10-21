
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
import { ShoppingBag } from 'lucide-react';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function VendorOrdersPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(
    () =>
      firestore && user
        ? collection(firestore, 'vendors', user.uid, 'orders')
        : null,
    [firestore, user]
  );
  const { data: orders, isLoading: areOrdersLoading } =
    useCollection<Order>(ordersQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Your Orders</CardTitle>
        <CardDescription>
          A history of all purchases made from your listings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {areOrdersLoading && (
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!areOrdersLoading && orders && orders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    {order.listingName}
                  </TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.date}</TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          !areOrdersLoading && (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">No orders yet</h3>
                <p className="text-muted-foreground text-sm mt-1">
                When a customer purchases one of your listings, it will appear here.
                </p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
