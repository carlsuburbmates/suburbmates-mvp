'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, ShieldCheck, Search, Loader2 } from 'lucide-react'
import { collection, query, where } from 'firebase/firestore'

import { PageHeader } from '@/components/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase'
import { Skeleton } from '@/components/ui/skeleton'
import type { Vendor } from '@/lib/types'
import { PlaceHolderImages } from '@/lib/placeholder-images'
import { VendorMap } from '@/components/vendor-map'
import { useState, useMemo, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { naturalLanguageSearch } from '@/ai/flows/natural-language-search'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { fadeInUp, listStagger, scaleIn } from '@/lib/animations'
import { VendorCard } from '@/components/vendor-card'

export default function VendorsPage() {
  const firestore = useFirestore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('list')
  const [showMarketplaceOnly, setShowMarketplaceOnly] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [minimumRating, setMinimumRating] = useState(0)

  // State for AI Search
  const [searchQuery, setSearchQuery] = useState('')
  const [isAiSearching, setIsAiSearching] = useState(false)
  const [aiKeywords, setAiKeywords] = useState<string[]>([])
  const [aiCategory, setAiCategory] = useState<string | undefined>(undefined)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null
    return query(collection(firestore, 'vendors'))
  }, [firestore])

  const { data: allVendors, isLoading } = useCollection<Vendor>(vendorsQuery)

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) {
      // Clear AI filters if search is cleared
      setAiCategory(undefined)
      setAiKeywords([])
      return
    }

    setIsAiSearching(true)
    try {
      const result = await naturalLanguageSearch({ query: searchQuery })

      // Give priority to AI-detected category
      if (result.category) {
        setAiCategory(result.category)
        setSelectedCategory(result.category)
      } else {
        setAiCategory(undefined)
      }

      setAiKeywords(result.keywords || [])

      toast({
        title: 'AI Search Applied',
        description: `Filtering for ${[result.category, ...(result.keywords || [])].filter(Boolean).join(', ')}`,
      })
    } catch (error) {
      console.error('AI search failed:', error)
      toast({
        variant: 'destructive',
        title: 'AI Search Error',
        description: 'Could not process your search query. Please try again.',
      })
    } finally {
      setIsAiSearching(false)
    }
  }

  const vendors = useMemo(() => {
    if (!allVendors) return []

    return allVendors
      .map((vendor, index) => ({
        ...vendor,
        latitude:
          vendor.latitude ||
          (isClient ? -37.775 + (Math.random() - 0.5) * 0.02 : -37.775),
        longitude:
          vendor.longitude ||
          (isClient ? 144.99 + (Math.random() - 0.5) * 0.02 : 144.99),
      }))
      .filter((v) => v.latitude && v.longitude)
      .filter((v) => (showMarketplaceOnly ? v.paymentsEnabled : true))
      .filter((v) =>
        selectedCategory === 'all' ? true : v.category === selectedCategory
      )
      .filter((v) => (v.averageRating || 0) >= minimumRating)
      .filter((v) => {
        // AI Keyword Filtering
        if (aiKeywords.length === 0) return true
        const vendorText =
          `${v.businessName} ${v.description} ${v.category}`.toLowerCase()
        return aiKeywords.every((keyword) =>
          vendorText.includes(keyword.toLowerCase())
        )
      })
  }, [
    allVendors,
    showMarketplaceOnly,
    selectedCategory,
    minimumRating,
    aiKeywords,
    isClient,
  ])

  const handleRatingChange = (
    rating: number,
    checked: boolean | 'indeterminate'
  ) => {
    if (checked) {
      setMinimumRating(rating)
    } else if (minimumRating === rating) {
      setMinimumRating(0)
    }
  }

  return (
    <div>
      <PageHeader
        title="Business Directory"
        description="Find trusted local professionals and businesses in your community."
      />
      <div className="container mx-auto px-4 pb-16">
        <div className="flex justify-center mb-6">
          <div className="p-1 bg-muted rounded-lg flex items-center">
            <Button
              onClick={() => setActiveTab('list')}
              variant={activeTab === 'list' ? 'default' : 'ghost'}
              className="w-32"
            >
              List View
            </Button>
            <Button
              onClick={() => setActiveTab('map')}
              variant={activeTab === 'map' ? 'default' : 'ghost'}
              className="w-32"
            >
              Map View
            </Button>
          </div>
        </div>

        {activeTab === 'map' && (
          <motion.div initial="hidden" animate="show" variants={scaleIn}>
            <Card className="h-[600px] w-full relative">
              <VendorMap vendors={vendors || []} />
              <div className="absolute top-4 left-4 bg-background p-3 rounded-lg shadow-lg border">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="marketplace-filter-map"
                    checked={showMarketplaceOnly}
                    onCheckedChange={setShowMarketplaceOnly}
                  />
                  <Label htmlFor="marketplace-filter-map">
                    Show Marketplace Vendors Only
                  </Label>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'list' && (
          <div className="grid lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
              <Card className="sticky top-24 rounded-lg border bg-card/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Filter Businesses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleAiSearch} className="space-y-2">
                    <Label htmlFor="ai-search">AI-Powered Search</Label>
                    <div className="flex gap-2">
                      <Input
                        id="ai-search"
                        placeholder="e.g., cafe with outdoor seating"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={isAiSearching}
                      >
                        {isAiSearching ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Search />
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      Use natural language to find what you need.
                    </CardDescription>
                  </form>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="marketplace-filter-list"
                        checked={showMarketplaceOnly}
                        onCheckedChange={setShowMarketplaceOnly}
                      />
                      <Label htmlFor="marketplace-filter-list">
                        Show Marketplace Vendors
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
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
                        <SelectItem value="services">
                          Professional Services
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="rating-4"
                          checked={minimumRating === 4}
                          onCheckedChange={(checked) =>
                            handleRatingChange(4, checked)
                          }
                        />
                        <Label
                          htmlFor="rating-4"
                          className="font-normal text-muted-foreground"
                        >
                          4 stars & up
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="rating-3"
                          checked={minimumRating === 3}
                          onCheckedChange={(checked) =>
                            handleRatingChange(3, checked)
                          }
                        />
                        <Label
                          htmlFor="rating-3"
                          className="font-normal text-muted-foreground"
                        >
                          3 stars & up
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            <main className="lg:col-span-3 grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3">
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

              <motion.div
                initial="show"
                animate="show"
                variants={listStagger(0.08)}
                className="contents"
              >
                {vendors?.map((vendor) => {
                  const vendorImage = PlaceHolderImages.find(
                    (p) => p.id === 'vendor-cafe'
                  )
                  return (
                    <VendorCard
                      key={vendor.id}
                      vendor={vendor}
                      imageUrl={vendorImage?.imageUrl || '/placeholder.svg'}
                      imageAlt={vendor.businessName}
                    />
                  )
                })}
              </motion.div>

              {!isLoading && vendors?.length === 0 && (
                <Card className="col-span-2 md:col-span-2 xl:col-span-3 text-center p-8">
                  <CardTitle>No Businesses Found</CardTitle>
                  <CardDescription>
                    Try adjusting your filters or check back soon.
                  </CardDescription>
                </Card>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  )
}
