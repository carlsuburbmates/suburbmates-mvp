
'use client';

import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import type { Vendor } from '@/lib/types';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import Link from 'next/link';

type VendorMapProps = {
    vendors: Vendor[];
};

export function VendorMap({ vendors }: VendorMapProps) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

    // Default center for Northcote, VIC, Australia
    const defaultCenter = { lat: -37.775, lng: 144.99 };

    if (!apiKey) {
        return (
            <div className="flex items-center justify-center h-full bg-muted">
                <p className="text-destructive-foreground bg-destructive p-4 rounded-md">
                    Google Maps API key is missing. Please add it to your .env file.
                </p>
            </div>
        );
    }
    
    return (
        <APIProvider apiKey={apiKey}>
            <Map
                defaultCenter={defaultCenter}
                defaultZoom={13}
                mapId="suburbmates_map"
                gestureHandling={'greedy'}
                disableDefaultUI={true}
            >
                {vendors.map((vendor) => (
                    vendor.latitude && vendor.longitude && (
                        <AdvancedMarker
                            key={vendor.id}
                            position={{ lat: vendor.latitude, lng: vendor.longitude }}
                            onClick={() => setSelectedVendor(vendor)}
                        />
                    )
                ))}

                {selectedVendor && (
                    <InfoWindow
                        position={{ lat: selectedVendor.latitude!, lng: selectedVendor.longitude! }}
                        onCloseClick={() => setSelectedVendor(null)}
                        minWidth={200}
                    >
                        <div className='p-2'>
                            <h3 className="font-bold font-headline text-lg">{selectedVendor.businessName}</h3>
                            <p className="text-sm text-muted-foreground">{selectedVendor.abn}</p>
                            <Button asChild variant="link" className="p-0 h-auto mt-2">
                                <Link href={`/vendors/${selectedVendor.id}`}>View Profile</Link>
                            </Button>
                        </div>
                    </InfoWindow>
                )}
            </Map>
        </APIProvider>
    );
}
