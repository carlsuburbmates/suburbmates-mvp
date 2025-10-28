import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ShieldCheck, Star } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/lib/animations";

export type Vendor = {
  id: string;
  businessName: string;
  description?: string;
  averageRating?: number;
  reviewCount?: number;
  abnVerified?: boolean;
};

interface VendorCardProps {
  vendor: Vendor;
  imageUrl: string;
  imageAlt?: string;
  onSwipeLeft?: (vendor: Vendor) => void;
  onSwipeRight?: (vendor: Vendor) => void;
}

export function VendorCard({
  vendor,
  imageUrl,
  imageAlt,
  onSwipeLeft,
  onSwipeRight,
}: VendorCardProps) {
  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number } }
  ) => {
    const dx = info.offset.x;
    const threshold = 120;
    if (dx > threshold && onSwipeRight) onSwipeRight(vendor);
    else if (dx < -threshold && onSwipeLeft) onSwipeLeft(vendor);
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileTap={{ scale: 0.98 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      className="w-full"
    >
      <Card className="flex flex-col">
        <CardHeader className="p-0">
          <div className="relative h-36 md:h-48 w-full">
            <Image
              src={imageUrl}
              alt={imageAlt || vendor.businessName}
              fill
              className="object-cover rounded-t-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {vendor.abnVerified && (
              <div className="absolute top-2 right-2 bg-success/90 text-white text-xs font-medium px-2.5 py-1.5 rounded-full flex items-center gap-1.5 drop-shadow-lg backdrop-blur-sm ring-1 ring-success/40">
                <ShieldCheck className="h-3.5 w-3.5" />
                ABN Verified
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 flex-grow flex flex-col">
          <h3 className="font-bold font-headline text-base md:text-lg">{vendor.businessName}</h3>
          <p className="text-sm text-muted-foreground flex-grow line-clamp-2">
            {vendor.description || ""}
          </p>
          <div className="flex items-center justify-between mt-4 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="font-bold">
                {vendor.averageRating ? vendor.averageRating.toFixed(1) : "N/A"}
              </span>
              <span className="text-muted-foreground">({vendor.reviewCount || 0})</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/vendors/${vendor.id}`}>View Profile</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}