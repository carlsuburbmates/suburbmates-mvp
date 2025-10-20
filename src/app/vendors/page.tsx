import Image from "next/image";
import Link from "next/link";
import { Star, MapPin } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { vendors } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
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

const mapImage = PlaceHolderImages.find((p) => p.id === "vendor-map");

export default function VendorsPage() {
  return (
    <div>
      <PageHeader
        title="Verified Vendor Marketplace"
        description="Find trusted local professionals and businesses in your community."
      />
      <div className="container mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Filter Vendors</CardTitle>
                <CardDescription>
                  Refine your search to find the perfect match.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="gardening">Gardening</SelectItem>
                      <SelectItem value="cafe">Cafe</SelectItem>
                      <SelectItem value="plumbing">Plumbing</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="rating-4" />
                      <Label htmlFor="rating-4" className="font-normal">
                        4 stars & up
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="rating-3" />
                      <Label htmlFor="rating-3" className="font-normal">
                        3 stars & up
                      </Label>
                    </div>
                  </div>
                </div>
                <Button className="w-full">Apply Filters</Button>
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3 grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {vendors.map((vendor) => {
              const vendorImage = PlaceHolderImages.find(p => p.id === vendor.imageId);
              return (
              <Card key={vendor.id} className="flex flex-col">
                <CardHeader className="p-0">
                  <div className="relative h-48 w-full">
                    {vendorImage && (
                       <Image
                        src={vendorImage.imageUrl}
                        alt={vendor.name}
                        fill
                        className="object-cover rounded-t-lg"
                        data-ai-hint={vendorImage.imageHint}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex-grow flex flex-col">
                    <h3 className="font-bold font-headline text-lg">{vendor.name}</h3>
                    <p className="text-sm text-muted-foreground">{vendor.category}</p>
                    <p className="text-sm text-muted-foreground mt-2 flex-grow">{vendor.description}</p>
                    <div className="flex items-center justify-between mt-4 text-sm">
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="font-bold">{vendor.rating}</span>
                            <span className="text-muted-foreground">({vendor.reviews} reviews)</span>
                        </div>
                         <Button variant="secondary" size="sm" asChild>
                            <Link href="#">View Profile</Link>
                        </Button>
                    </div>
                </CardContent>
              </Card>
            )})}
             <Card className="md:col-span-2 xl:col-span-3 flex flex-col md:flex-row items-center gap-6 p-6 bg-accent/30">
                <div className="relative w-full md:w-1/3 h-48 md:h-full rounded-lg overflow-hidden">
                    {mapImage && <Image src={mapImage.imageUrl} alt={mapImage.description} fill className="object-cover" data-ai-hint={mapImage.imageHint} />}
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="font-bold font-headline text-2xl">Discover on the Map</h3>
                    <p className="text-muted-foreground mt-2">Switch to a map view to see all local vendors near you. Find services right around the corner.</p>
                    <Button className="mt-4" disabled>
                        <MapPin className="w-4 h-4 mr-2" />
                        Map View Coming Soon
                    </Button>
                </div>
             </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
