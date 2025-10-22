
'use client';

import Image from "next/image";
import Link from "next/link";
import { Star, ShieldCheck } from "lucide-react";
import { collection, query, where } from "firebase/firestore";

import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import type { Vendor } from "@/lib/types";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { VendorMap } from "@/components/vendor-map";
import { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";


export default function VendorsPage() {
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState('list');
  const [showMarketplaceOnly, setShowMarketplaceOnly] = useState(false);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Fetch all vendors, filtering will be done on the client
    return query(collection(firestore, 'vendors'));
  }, [firestore]);

  const { data: allVendors, isLoading } = useCollection<Vendor>(vendorsQuery);

  const vendors = useMemo(() => {
    if (!allVendors) return [];
    const vendorsWithLocations = allVendors.map((vendor, index) => ({
      ...vendor,
      latitude: vendor.latitude || -37.775 + (Math.random() - 0.5) * 0.02,
      longitude: vendor.longitude || 144.99 + (Math.random() - 0.5) * 0.02,
    })).filter(v => v.latitude && v.longitude);
    
    if (showMarketplaceOnly) {
      return vendorsWithLocations.filter(v => v.paymentsEnabled);
    }
    return vendorsWithLocations;
  }, [allVendors, showMarketplaceOnly]);


  return (
    <div>
      <PageHeader
        title="Darebin Business Directory"
        description="Find trusted local professionals and businesses in your community."
      />
      <div className="container mx-auto px-4 pb-16">
        <div className="flex justify-center mb-6">
            <div className="p-1 bg-muted rounded-lg flex items-center">
              <Button onClick={() => setActiveTab('list')} variant={activeTab === 'list' ? 'default' : 'ghost'} className="w-32">List View</Button>
              <Button onClick={() => setActiveTab('map')} variant={activeTab === 'map' ? 'default' : 'ghost'} className="w-32">Map View</Button>
            </div>
        </div>

       {activeTab === 'map' && (
          <Card className="h-[600px] w-full relative">
            <VendorMap vendors={vendors || []}/>
            <div className="absolute top-4 left-4 bg-background p-3 rounded-lg shadow-lg border">
                <div className="flex items-center space-x-2">
                    <Switch
                        id="marketplace-filter-map"
                        checked={showMarketplaceOnly}
                        onCheckedChange={setShowMarketplaceOnly}
                    />
                    <Label htmlFor="marketplace-filter-map">Show Marketplace Vendors Only</Label>
                </div>
            </div>
          </Card>
       )}

       {activeTab === 'list' && (
          <div className="grid lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Filter Businesses</CardTitle>
                  <CardDescription>
                    Refine your search to find the perfect match.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="marketplace-filter-list"
                            checked={showMarketplaceOnly}
                            onCheckedChange={setShowMarketplaceOnly}
                        />
                        <Label htmlFor="marketplace-filter-list">Show Marketplace Vendors</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="gardening">Gardening</SelectItem>
                        <SelectItem value="cafe">Cafe</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="bakery">Bakery</SelectItem>
                        <SelectItem value="services">Professional Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="rating-4" disabled/>
                        <Label htmlFor="rating-4" className="font-normal text-muted-foreground">
                          4 stars & up
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="rating-3" disabled/>
                        <Label htmlFor="rating-3" className="font-normal text-muted-foreground">
                          3 stars & up
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            <main className="lg:col-span-3 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="p-0">
                      <Skeleton className="h-48 w-full rounded-t-lg" />
                    </CardHeader>
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}

              {vendors?.map((vendor) => {
                const vendorImage = PlaceHolderImages.find(p => p.id === 'vendor-cafe');
                return (
                <Card key={vendor.id} className="flex flex-col">
                  <CardHeader className="p-0">
                    <div className="relative h-48 w-full">
                      {vendorImage && (
                        <Image
                          src={vendorImage.imageUrl}
                          alt={vendor.businessName}
                          fill
                          className="object-cover rounded-t-lg"
                          data-ai-hint={vendorImage.imageHint}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      )}
                       {vendor.abnVerified && (
                        <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          ABN Verified
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-grow flex flex-col">
                      <h3 className="font-bold font-headline text-lg">{vendor.businessName}</h3>
                      <div className="text-sm text-muted-foreground mt-2 flex-grow">
                          {vendor.website && <p><Link href={vendor.website} target="_blank" className="hover:text-primary underline">Website</Link></p>}
                          {vendor.phone && <p>{vendor.phone}</p>}
                      </div>
                      <div className="flex items-center justify-between mt-4 text-sm">
                          <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              <span className="font-bold">{vendor.averageRating ? vendor.averageRating.toFixed(1) : 'N/A'}</span>
                              <span className="text-muted-foreground">({vendor.reviewCount || 0} reviews)</span>
                          </div>
                          <Button variant="secondary" size="sm" asChild>
                              <Link href={`/vendors/${vendor.id}`}>View Profile</Link>
                          </Button>
                      </div>
                  </CardContent>
                </Card>
              )})}
              
              {!isLoading && vendors?.length === 0 && (
                  <Card className="md:col-span-2 xl:col-span-3 text-center p-8">
                    <CardTitle>No Businesses Found</CardTitle>
                    <CardDescription>
                      Check back soon or become the first business in the directory!
                    </CardDescription>
                    <Button asChild className="mt-4">
                      <Link href="/dashboard/vendor/register">Register Your Business</Link>
                    </Button>
                  </Card>
                )}
            </main>
          </div>
       )}
      </div>
    </div>
  );
}
