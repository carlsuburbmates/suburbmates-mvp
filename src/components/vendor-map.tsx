
'use client';

import { APIProvider, Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import type { Vendor } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import Link from 'next/link';

type VendorMapProps = {
    vendors: Vendor[];
};

export function VendorMap({ vendors }: VendorMapProps) {
    const [apiKey, setApiKey] = useState<string | undefined>(undefined);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

    useEffect(() => {
        setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
    }, []);

    const defaultCenter = { lat: -37.775, lng: 144.99 };

    if (apiKey === undefined) {
        return (
            <div className="flex items-center justify-center h-full bg-muted">
                <p>Loading map...</p>
            </div>
        );
    }
    
    if (!apiKey) {
        return (
            <div className="flex items-center justify-center h-full bg-muted">
                <p className="text-destructive-foreground bg-destructive p-4 rounded-md">
                    Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file and restart the server.
                </p>
            </div>
        );
    }
    
    return (
        <APIProvider apiKey={apiKey} key={apiKey}>
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
                             {selectedVendor.paymentsEnabled && <p className="text-xs font-bold text-primary mt-1">Marketplace Vendor</p>}
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
