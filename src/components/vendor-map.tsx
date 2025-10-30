'use client'

import dynamic from 'next/dynamic'
import { useState, useCallback, Suspense } from 'react'
import { Button } from './ui/button'
import Link from 'next/link'
import type { Vendor } from '@/lib/types'

// Lazy load the map components to improve initial load performance
const APIProvider = dynamic(() =>
  import('@vis.gl/react-google-maps').then((mod) => ({
    default: mod.APIProvider,
  }))
)
const Map = dynamic(() =>
  import('@vis.gl/react-google-maps').then((mod) => ({ default: mod.Map }))
)
const AdvancedMarker = dynamic(() =>
  import('@vis.gl/react-google-maps').then((mod) => ({
    default: mod.AdvancedMarker,
  }))
)
const InfoWindow = dynamic(() =>
  import('@vis.gl/react-google-maps').then((mod) => ({
    default: mod.InfoWindow,
  }))
)

type VendorMapProps = {
  vendors: Vendor[]
}

// Loading fallback component
function MapLoadingFallback() {
  return (
    <div
      className="flex items-center justify-center h-full bg-muted"
      role="status"
      aria-label="Loading interactive map"
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  )
}

// Error fallback component
function _MapErrorFallback() {
  return (
    <div
      className="flex items-center justify-center h-full bg-muted p-6"
      role="region"
      aria-label="Map unavailable"
    >
      <div className="text-center max-w-md">
        <div className="text-4xl mb-4">🗺️</div>
        <h3 className="font-semibold mb-2">Interactive Map Unavailable</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We&apos;re unable to load the interactive map at the moment. You can
          still browse vendors using the list view below.
        </p>
        <Button variant="outline" size="sm">
          Browse Vendors
        </Button>
      </div>
    </div>
  )
}

export function VendorMap({ vendors }: VendorMapProps) {
  const [apiKey] = useState<string | undefined>(
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  )
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)

  // Remove mapError state and setMapError usage since onError prop isn't available
  // Error handling will be managed at a higher level if needed

  const defaultCenter = { lat: -37.775, lng: 144.99 }

  // Memoize marker click handler
  const handleMarkerClick = useCallback((vendor: Vendor) => {
    setSelectedVendor(vendor)
  }, [])

  // Memoize info window close handler
  const handleInfoWindowClose = useCallback(() => {
    setSelectedVendor(null)
  }, [])

  if (apiKey === undefined) {
    return <MapLoadingFallback />
  }

  if (!apiKey) {
    return (
      <div
        className="flex items-center justify-center h-full bg-muted p-6"
        role="alert"
        aria-live="polite"
      >
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">🔑</div>
          <h3 className="font-semibold mb-2">Map Configuration Required</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Google Maps API key is missing. Please contact support to enable the
            interactive map feature.
          </p>
          <Button variant="outline" size="sm">
            Browse Vendors Instead
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div role="application" aria-label="Interactive vendor location map">
      <Suspense fallback={<MapLoadingFallback />}>
        <APIProvider apiKey={apiKey} key={apiKey}>
          <Map
            defaultCenter={defaultCenter}
            defaultZoom={13}
            mapId="suburbmates_map"
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            // Note: onError prop not available in this version of react-google-maps
            // Error handling is managed through try-catch in parent components
            aria-label="Map showing vendor locations"
          >
            {vendors.map(
              (vendor) =>
                vendor.latitude &&
                vendor.longitude && (
                  <AdvancedMarker
                    key={vendor.id}
                    position={{ lat: vendor.latitude, lng: vendor.longitude }}
                    onClick={() => handleMarkerClick(vendor)}
                    title={`${vendor.businessName} - Click to view details`}
                  />
                )
            )}

            {selectedVendor && (
              <InfoWindow
                position={{
                  lat: selectedVendor.latitude!,
                  lng: selectedVendor.longitude!,
                }}
                onCloseClick={handleInfoWindowClose}
                minWidth={200}
                aria-label={`Information about ${selectedVendor.businessName}`}
              >
                <div className="p-2">
                  <h3
                    className="font-bold font-headline text-lg"
                    id={`vendor-${selectedVendor.id}-name`}
                  >
                    {selectedVendor.businessName}
                  </h3>
                  <p
                    className="text-sm text-muted-foreground"
                    aria-describedby={`vendor-${selectedVendor.id}-name`}
                  >
                    ABN: {selectedVendor.abn}
                  </p>
                  {selectedVendor.paymentsEnabled && (
                    <p
                      className="text-xs font-bold text-primary mt-1"
                      role="status"
                    >
                      Marketplace Vendor
                    </p>
                  )}
                  <Button
                    asChild
                    variant="link"
                    className="p-0 h-auto mt-2"
                    aria-describedby={`vendor-${selectedVendor.id}-name`}
                  >
                    <Link href={`/vendors/${selectedVendor.id}`}>
                      View Profile
                    </Link>
                  </Button>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </Suspense>
    </div>
  )
}
