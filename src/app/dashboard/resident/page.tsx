
'use client';

import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Resident, Order } from '@/lib/types';
import { doc, collectionGroup, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ResidentDashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [areOrdersLoading, setAreOrdersLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/vendors/onboard');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!firestore || !user) return;
      setAreOrdersLoading(true);
      try {
        const ordersQuery = query(
          collectionGroup(firestore, 'orders'),
          where('customerId', '==', user.uid),
          orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(ordersQuery);
        const fetchedOrders: Order[] = [];
        querySnapshot.forEach((doc) => {
          const orderData = doc.data() as Order;
          const vendorId = doc.ref.parent.parent?.id; // Assumes orders collection is a subcollection of vendors
          fetchedOrders.push({ ...orderData, id: doc.id, vendorId });
        });
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching resident's orders:", error);
      } finally {
        setAreOrdersLoading(false);
      }
    };

    if (user) {
      fetchOrders();
    }
  }, [firestore, user]);


  if (isUserLoading) {
    return (
       <div className="space-y-8">
          <Card>
              <CardHeader>
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-4 w-1/3 mt-2" />
              </CardHeader>
          </Card>
           <Card>
              <CardHeader>
                  <Skeleton className="h-8 w-1/3 mb-4" />
              </CardHeader>
              <CardContent>
                  <Skeleton className="h-24 w-full" />
              </CardContent>
          </Card>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }

  return (
    <>
      <div className="grid gap-8">
          <Card>
              <CardHeader className="flex-row items-center justify-between">
                   <div>
                      <CardTitle className="font-headline">{user.displayName}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                  </div>
              </CardHeader>
          </Card>

           <Card>
              <CardHeader>
                <CardTitle className="font-headline">Your Order History</CardTitle>
                <CardDescription>
                A record of all your purchases from the vendor marketplace.
                </CardDescription>
            </CardHeader>
              <CardContent>
                {areOrdersLoading && (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Listing</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                )}
                {!areOrdersLoading && orders.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Listing</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                        <TableCell className="font-medium">
                            <Link href={`/vendors/${order.vendorId}`} className="hover:underline">
                                {order.listingName}
                            </Link>
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
                        When you purchase items from vendors, they will appear here.
                        </p>
                         <Button asChild className="mt-4" variant="secondary">
                            <Link href="/vendors">Browse Marketplace</Link>
                        </Button>
                    </div>
                )
                )}
              </CardContent>
          </Card>
      </div>
    </>
  );
}
