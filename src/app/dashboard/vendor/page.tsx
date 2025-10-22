
'use client';

import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Vendor, Listing } from '@/lib/types';
import { doc, collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ListPlus, Tag, Truck, Edit, Trash2, CreditCard, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function VendorDashboardPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);
  
  const vendorRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'vendors', user.uid) : null),
    [firestore, user]
  );
  const { data: vendor, isLoading: isVendorLoading } = useDoc<Vendor>(vendorRef);

  const listingsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? collection(firestore, 'vendors', user.uid, 'listings')
        : null,
    [firestore, user]
  );
  const { data: listings, isLoading: areListingsLoading } =
    useCollection<Listing>(listingsQuery);

  const handleDeleteListing = async () => {
    if (!listingToDelete || !user || !firestore) return;
    const listingRef = doc(firestore, `vendors/${user.uid}/listings`, listingToDelete.id);
    deleteDocumentNonBlocking(listingRef);
    
    toast({
      title: 'Listing Deleted',
      description: `"${listingToDelete.listingName}" has been removed.`,
    });
    setListingToDelete(null);
  };
  
  async function handleStripeConnect() {
     if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Could not identify the user.',
      });
      return;
    }

    try {
      toast({
        title: 'Redirecting to Stripe...',
        description: 'Please wait while we prepare your secure connection.',
      });

      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/dashboard/vendor`,
          refreshUrl: `${window.location.origin}/dashboard/vendor`,
          userId: user.uid,
        }),
      });

      const { url, error } = await response.json();
      if (error) throw new Error(error);
      if (url) router.push(url);

    } catch (e: any) {
      console.error('Stripe Connect Error:', e);
      toast({
        variant: 'destructive',
        title: 'Could not connect to Stripe',
        description: e.message || 'An unknown error occurred. Please try again.',
      });
    }
  }


  if (isUserLoading || isVendorLoading) {
    return (
       <div className="space-y-8">
          <Card><CardHeader><Skeleton className="h-24 w-full" /></CardHeader></Card>
          <Card><CardHeader><Skeleton className="h-8 w-1/3 mb-4" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
      </div>
    );
  }
  
  if (!user) {
    // This can happen briefly on first load or after logout
    return null;
  }
  
  // If user is logged in but has not created a vendor profile yet
  if (!vendor) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Welcome, {user.displayName || 'User'}</CardTitle>
                <CardDescription>Get discovered by the local community by listing your business in the directory.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild>
                    <Link href="/dashboard/vendor/register">
                        Register Your Business
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
  }


  return (
    <>
      <div className="grid gap-8">
          <Card>
              <CardHeader className="flex-row items-center justify-between">
                   <div>
                      <CardTitle className="font-headline">{vendor.businessName}</CardTitle>
                      <CardDescription>{vendor.email}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                       <Button asChild variant="outline">
                          <Link href="/vendors/profile/edit">
                             <Edit className="mr-2 h-4 w-4"/>
                             Edit Profile
                          </Link>
                      </Button>
                  </div>
              </CardHeader>
               <CardContent>
                 <Button asChild variant="secondary">
                      <Link href={`/vendors/${user?.uid}`}>View Public Directory Listing</Link>
                  </Button>
              </CardContent>
          </Card>
          
          {!vendor.paymentsEnabled && (
            <Card className="bg-amber-50 border-amber-200">
                <CardHeader>
                    <CardTitle className="font-headline text-amber-900">Enable Sales on the Marketplace</CardTitle>
                    <CardDescription className="text-amber-800">
                        To sell products and services, you need to connect a Stripe account. This allows you to receive secure payments directly.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!vendor.stripeAccountId ? (
                        <Button onClick={handleStripeConnect}>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Connect with Stripe to Enable Sales
                        </Button>
                    ) : (
                         <div className="flex items-center p-4 rounded-lg bg-blue-100 border border-blue-200 text-blue-900">
                            <AlertCircle className="h-6 w-6 mr-4" />
                            <div>
                                <h3 className="font-semibold">Approval Pending</h3>
                                <p className="text-sm">
                                    Your Stripe account is connected but pending final approval. An admin will enable payments for your account shortly.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
           )}


           {vendor.paymentsEnabled && (
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="font-headline">Your Listings</CardTitle>
                        <CardDescription>Manage your products and services offered on the marketplace.</CardDescription>
                    </div>
                    <Button asChild>
                        <Link href="/dashboard/vendor/edit-listing/new">
                            <ListPlus className="mr-2 h-4 w-4" />
                            Create New Listing
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                   <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                        {areListingsLoading && Array.from({ length: 2 }).map((_, i) => (
                            <Card key={i}>
                              <CardHeader className="p-0">
                                  <Skeleton className="h-40 w-full rounded-t-lg" />
                              </CardHeader>
                              <CardContent className="pt-4">
                                  <Skeleton className="h-6 w-3/4" />
                                  <Skeleton className="h-4 w-1/2 mt-2" />
                              </CardContent>
                            </Card>
                        ))}

                        {listings?.map((listing) => (
                        <Card key={listing.id} className="flex flex-col">
                            {listing.imageUrl && (
                                <CardHeader className="p-0">
                                    <div className="relative h-40 w-full">
                                    <Image
                                        src={listing.imageUrl}
                                        alt={listing.listingName}
                                        fill
                                        className="object-cover rounded-t-lg"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    </div>
                                </CardHeader>
                            )}
                            <CardContent className="pt-4 flex-grow">
                              <CardTitle className="font-headline text-lg">{listing.listingName}</CardTitle>
                              <p className="text-lg font-bold text-primary">${listing.price.toFixed(2)}</p>
                              <p className="text-muted-foreground text-sm flex-grow line-clamp-3 mt-2">{listing.description}</p>
                              <div className="flex items-center gap-2 pt-2">
                                  <Tag className="w-4 h-4 text-primary"/>
                                  <Badge variant="outline">{listing.category}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                  <Truck className="w-4 h-4 text-primary"/>
                                  <span>{listing.deliveryMethod}</span>
                              </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                 <Button variant="outline" size="sm" asChild>
                                    <Link href={`/dashboard/vendor/edit-listing/${listing.id}`}>
                                        <Edit className="mr-2 h-4 w-4"/>
                                        Edit
                                    </Link>
                                </Button>
                                 <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                     <Button variant="destructive" size="sm" onClick={() => setListingToDelete(listing)}>
                                       <Trash2 className="mr-2 h-4 w-4" />
                                       Delete
                                     </Button>
                                   </AlertDialogTrigger>
                                 </AlertDialog>
                            </CardFooter>
                        </Card>
                        ))}
                   </div>
                    {!areListingsLoading && listings?.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg">
                            <h3 className="font-semibold">You have no listings yet</h3>
                            <p className="text-muted-foreground text-sm mt-1">Create your first listing to get started.</p>
                             <Button asChild className="mt-4">
                                <Link href="/dashboard/vendor/edit-listing/new">
                                    <ListPlus className="mr-2 h-4 w-4" />
                                    Create a Listing
                                </Link>
                            </Button>
                        </div>
                   )}
                </CardContent>
            </Card>
           )}
      </div>

       {listingToDelete && (
        <AlertDialog open={!!listingToDelete} onOpenChange={() => setListingToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                listing for "{listingToDelete.listingName}" from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setListingToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteListing}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
    </>
  );
}

    