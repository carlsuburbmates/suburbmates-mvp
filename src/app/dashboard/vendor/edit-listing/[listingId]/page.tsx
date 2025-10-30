'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DollarSign, Save, Loader2, ListPlus } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { doc, collection } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { useToast } from '@/hooks/use-toast'
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase'
import {
  updateDocumentNonBlocking,
  addDocumentNonBlocking,
} from '@/firebase/non-blocking-updates'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { Listing } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { uploadImage } from '@/ai/flows/upload-image'

const listingFormSchema = z.object({
  listingName: z.string().min(3, 'Listing name must be at least 3 characters.'),
  category: z.string().min(1, 'Please select a category.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters.')
    .max(500, 'Description cannot exceed 500 characters.'),
  image: z.any().optional(),
  deliveryMethod: z.enum(['Pickup Only', 'Local Delivery Available'], {
    required_error: 'You need to select a delivery method.',
  }),
})

// Helper function to convert file to data URI
const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export default function EditListingPage() {
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()
  const router = useRouter()
  const params = useParams()
  const { listingId } = params
  const isEditing = listingId !== 'new'

  const [isSubmitting, setIsSubmitting] = useState(false)

  const listingRef = useMemoFirebase(
    () =>
      firestore && user && isEditing
        ? doc(firestore, `vendors/${user.uid}/listings`, listingId as string)
        : null,
    [firestore, user, listingId, isEditing]
  )

  const { data: listing, isLoading } = useDoc<Listing>(listingRef)

  const form = useForm<z.infer<typeof listingFormSchema>>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      listingName: '',
      category: '',
      price: 0,
      description: '',
      deliveryMethod: 'Pickup Only',
    },
  })

  const imageRef = form.register('image')

  useEffect(() => {
    if (isEditing && listing) {
      form.reset({
        listingName: listing.listingName,
        category: listing.category,
        price: listing.price,
        description: listing.description,
        deliveryMethod: listing.deliveryMethod,
      })
    }
  }, [listing, form, isEditing])

  async function onSubmit(values: z.infer<typeof listingFormSchema>) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to manage listings.',
      })
      return
    }

    setIsSubmitting(true)
    let imageUrl = isEditing
      ? listing?.imageUrl
      : 'https://picsum.photos/seed/1/400/300' // Default placeholder

    try {
      if (values.image && values.image.length > 0) {
        const file = values.image[0]
        const fileDataUri = await fileToDataUri(file)

        const uploadResult = await uploadImage({
          fileDataUri,
          filePath: `listings/${user.uid}/${Date.now()}_${file.name}`,
        })
        imageUrl = uploadResult.publicUrl
      } else if (!isEditing) {
        // Image is required for new listings
        toast({
          variant: 'destructive',
          title: 'Image Required',
          description: 'Please upload an image for your new listing.',
        })
        setIsSubmitting(false)
        return
      }

      const listingData = {
        vendorId: user.uid,
        listingName: values.listingName,
        category: values.category,
        price: values.price,
        description: values.description,
        deliveryMethod: values.deliveryMethod,
        imageUrl,
      }

      if (isEditing && listingRef) {
        updateDocumentNonBlocking(listingRef, listingData)
        toast({
          title: 'Listing Updated!',
          description: 'Your changes have been saved successfully.',
        })
      } else {
        const listingsCollectionRef = collection(
          firestore,
          `vendors/${user.uid}/listings`
        )
        addDocumentNonBlocking(listingsCollectionRef, listingData)
        toast({
          title: 'Listing Created!',
          description:
            'Your new product or service has been added to the marketplace.',
        })
      }

      router.push('/dashboard/vendor')
    } catch (error) {
      console.error('Error managing listing:', error)
      toast({
        variant: 'destructive',
        title: isEditing ? 'Update Failed' : 'Creation Failed',
        description: 'Could not save your listing. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading && isEditing) {
    return (
      <>
        <PageHeader
          title="Edit Listing"
          description="Update the details of your product or service."
        />
        <div className="container mx-auto px-4 pb-16 flex justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-8">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!listing && isEditing) {
    return (
      <>
        <PageHeader
          title="Listing Not Found"
          description="We couldn't find the listing you're trying to edit."
        />
        <div className="container mx-auto px-4 pb-16 text-center">
          <Button onClick={() => router.push('/dashboard/vendor')}>
            Return to Dashboard
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={isEditing ? 'Edit Listing' : 'Create a Listing'}
        description={
          isEditing
            ? 'Update the details of your product or service.'
            : 'Add a new product or service to your vendor profile.'
        }
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              {isEditing
                ? `Editing: ${listing?.listingName}`
                : 'Your New Listing'}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? 'Make your changes below and click save.'
                : 'Describe the product or service you want to offer to the community.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <FormField
                  control={form.control}
                  name="listingName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Organic Sourdough Loaf"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The name of your product or service.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="0.00"
                              className="pl-8"
                              step="0.01"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your item or service in detail..."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Delivery Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Pickup Only" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Pickup Only
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Local Delivery Available" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Local Delivery Available
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Upload Image {isEditing && '(Optional)'}
                      </FormLabel>
                      <FormControl>
                        <Input type="file" {...imageRef} />
                      </FormControl>
                      <FormDescription>
                        {isEditing
                          ? 'Upload a new image to replace the existing one.'
                          : 'Upload a clear image of your product or service.'}{' '}
                        Max 5MB.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isEditing ? (
                      <Save className="mr-2 h-4 w-4" />
                    ) : (
                      <ListPlus className="mr-2 h-4 w-4" />
                    )}
                    {isSubmitting
                      ? 'Saving...'
                      : isEditing
                        ? 'Save Changes'
                        : 'Create Listing'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => router.push('/dashboard/vendor')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
