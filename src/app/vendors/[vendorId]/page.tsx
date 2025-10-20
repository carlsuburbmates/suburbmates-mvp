
'use client';

import { notFound } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import type { Vendor, Listing } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2, Phone, Star, Tag, Truck } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function VendorProfilePage({
  params,
}: {
  params: { vendorId: string };
}) {
  const firestore = useFirestore();

  // Fetch Vendor Details
  const vendorRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'vendors', params.vendorId) : null),
    [firestore, params.vendorId]
  );
  const { data: vendor, isLoading: isVendorLoading } = useDoc<Vendor>(vendorRef);

  // Fetch Vendor Listings
  const listingsQuery = useMemoFirebase(
    () =>
      firestore
        ? collection(firestore, 'vendors', params.vendorId, 'listings')
        : null,
    [firestore, params.vendorId]
  );
  const { data: listings, isLoading: areListingsLoading } =
    useCollection<Listing>(listingsQuery);

  if (isVendorLoading) {
    return (
      <div className="container mx-auto px-4 pb-16">
        <Skeleton className="h-12 w-1/2 mt-12" />
        <Skeleton className="h-8 w-2/3 mt-4" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <Card><CardHeader><Skeleton className="h-48 w-full" /></CardHeader><CardContent><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-48 w-full" /></CardHeader><CardContent><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-48 w-full" /></CardHeader><CardContent><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!vendor) {
    notFound();
  }

  const vendorImage = PlaceHolderImages.find((p) => p.id === 'feature-vendors');

  return (
    <div>
      <PageHeader
        title={vendor.businessName}
        description={`Your trusted local ${vendor.abn ? 'ABN-verified' : ''} business.`}
      />
      
      <div className="container mx-auto px-4 pb-16">

        <Card className="mb-12 overflow-hidden flex flex-col md:flex-row bg-card/60">
            <div className="relative w-full md:w-1/3 h-64 md:h-auto">
                {vendorImage && <Image src={vendorImage.imageUrl} alt={vendor.businessName} fill className="object-cover" data-ai-hint={vendorImage.imageHint} />}
            </div>
            <div className="flex-1 p-6">
                <CardTitle className="font-headline text-2xl">{vendor.businessName}</CardTitle>
                <div className="mt-4 flex flex-col gap-3 text-muted-foreground">
                    {vendor.website && (
                         <p className="flex items-center gap-2">
                            <Link2 className="h-4 w-4"/>
                            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">Visit Website</a>
                        </p>
                    )}
                    {vendor.phone && (
                        <p className="flex items-center gap-2">
                           <Phone className="h-4 w-4"/>
                           <span>{vendor.phone}</span>
                        </p>
                    )}
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>N/A (No reviews yet)</span>
                    </div>
                </div>
            </div>
        </Card>


        <h2 className="text-2xl font-bold font-headline mb-6">Our Offerings</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areListingsLoading && Array.from({ length: 3 }).map((_, i) => (
             <Card key={i}><CardHeader><Skeleton className="h-40 w-full" /></CardHeader><CardContent className="pt-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardContent></Card>
          ))}

          {listings?.map((listing) => {
            const listingImage = PlaceHolderImages.find(p => p.id === 'vendor-bookshop');
            return (
              <Card key={listing.id}>
                {listingImage &&
                    <CardHeader className="p-0">
                        <div className="relative h-48 w-full">
                            <Image src={listingImage.imageUrl} alt={listing.listingName} fill className="object-cover rounded-t-lg" data-ai-hint={listingImage.imageHint} />
                        </div>
                    </CardHeader>
                }
                <CardContent className="p-4">
                  <h3 className="font-bold font-headline text-lg">{listing.listingName}</h3>
                  <p className="text-muted-foreground text-sm mt-1 flex-grow">{listing.description}</p>
                  
                  <div className="mt-4 space-y-2 text-sm">
                     <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary"/>
                        <Badge variant="outline">{listing.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-primary"/>
                        <span>{listing.deliveryMethod}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <p className="text-lg font-bold text-primary">${listing.price.toFixed(2)}</p>
                    <Button disabled>Add to Cart</Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {!areListingsLoading && listings?.length === 0 && (
            <p className="text-muted-foreground md:col-span-3">This vendor has not added any listings yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
