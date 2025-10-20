
'use client';

import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Vendor } from '@/lib/types';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ListPlus } from 'lucide-react';

export default function VendorProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

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


  if (isUserLoading || isVendorLoading) {
    return (
       <div className="container mx-auto px-4 pb-16">
        <PageHeader
          title="Your Dashboard"
          description="Manage your profile and listings."
        />
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-24 w-full" />
            </CardContent>
        </Card>
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
                <CardContent className="space-y-4">
                   <div>
                        <h3 className="font-semibold">Your Listings</h3>
                        <p className="text-muted-foreground text-sm mt-2">You have no listings yet. Add one to get started.</p>
                   </div>
                    <Button asChild>
                        <Link href="/vendors/onboard/listing">
                            <ListPlus className="mr-2 h-4 w-4" />
                            Create New Listing
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
