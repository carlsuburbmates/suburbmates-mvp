
'use client';

import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Vendor, Listing } from '@/lib/types';
import { doc, collection, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ListPlus, Tag, Truck, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
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

export default function VendorProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [listingToDelete, setListingToDelete] = useState<Listing | null>(null);

  // Redirect if not logged in
  if (!isUserLoading && !user) {
    router.replace('/vendors/onboard');
    return null;
  }
  
  // Fetch Vendor Details
  const vendorRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'vendors', user.uid) : null),
    [firestore, user]
  );
  const { data: vendor, isLoading: isVendorLoading } = useDoc<Vendor>(vendorRef);

  // Fetch Vendor Listings
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


  if (isUserLoading || isVendorLoading) {
    return (
       <div className="container mx-auto px-4 pb-16">
        <PageHeader
          title="Your Dashboard"
          description="Manage your profile and listings."
        />
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
      </div>
    );
  }

  if (!vendor) {
    return (
       <div className="container mx-auto px-4 pb-16">
         <PageHeader
          title="Profile Not Found"
          description="We couldn't find your vendor profile. Please contact support."
        />
       </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Your Dashboard"
        description="Here you can manage your public profile and your listings."
      />
      <div className="container mx-auto px-4 pb-16">
        <div className="grid gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">{vendor.businessName}</CardTitle>
                    <CardDescription>{vendor.email}</CardDescription>
                </CardHeader>
                 <CardContent>
                   <Button asChild variant="outline">
                        <Link href={`/vendors/${user?.uid}`}>View Public Profile</Link>
                    </Button>
                </CardContent>
            </Card>

             <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="font-headline">Your Listings</CardTitle>
                        <CardDescription>Manage your products and services offered on the marketplace.</CardDescription>
                    </div>
                    <Button asChild>
                        <Link href="/vendors/onboard/listing">
                            <ListPlus className="mr-2 h-4 w-4" />
                            Create New Listing
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent>
                   <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {areListingsLoading && Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i}><CardHeader><Skeleton className="h-40 w-full" /></CardHeader><CardContent className="pt-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardContent></Card>
                        ))}

                        {listings?.map((listing) => (
                        <Card key={listing.id} className="flex flex-col">
                            <CardHeader>
                                <CardTitle className="font-headline text-lg">{listing.listingName}</CardTitle>
                                <p className="text-lg font-bold text-primary">${listing.price.toFixed(2)}</p>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-2 text-sm">
                                <p className="text-muted-foreground text-sm flex-grow line-clamp-3">{listing.description}</p>
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
                                    <Link href={`/vendors/profile/edit-listing/${listing.id}`}>
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
                                <Link href="/vendors/onboard/listing">
                                    <ListPlus className="mr-2 h-4 w-4" />
                                    Create a Listing
                                </Link>
                            </Button>
                        </div>
                   )}
                </CardContent>
            </Card>
        </div>
      </div>
      
       <AlertDialog open={!!listingToDelete} onOpenChange={(open) => !open && setListingToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the listing for "{listingToDelete?.listingName}" from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteListing}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
