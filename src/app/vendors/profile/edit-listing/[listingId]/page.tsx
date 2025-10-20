
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ListPlus, DollarSign, FileImage, Save } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Listing } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const listingFormSchema = z.object({
  listingName: z
    .string()
    .min(3, 'Listing name must be at least 3 characters.'),
  category: z.string().min(1, 'Please select a category.'),
  price: z.coerce.number().positive('Price must be a positive number.'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters.')
    .max(500, 'Description cannot exceed 500 characters.'),
  deliveryMethod: z.enum(['Pickup Only', 'Local Delivery Available'], {
    required_error: 'You need to select a delivery method.',
  }),
});

export default function EditListingPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const { listingId } = params;

  const listingRef = useMemoFirebase(
    () =>
      firestore && user && listingId
        ? doc(firestore, `vendors/${user.uid}/listings`, listingId as string)
        : null,
    [firestore, user, listingId]
  );
  
  const { data: listing, isLoading } = useDoc<Listing>(listingRef);

  const form = useForm<z.infer<typeof listingFormSchema>>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      listingName: '',
      category: '',
      price: 0,
      description: '',
      deliveryMethod: 'Pickup Only',
    },
  });

  useEffect(() => {
    if (listing) {
      form.reset(listing);
    }
  }, [listing, form]);

  async function onSubmit(values: z.infer<typeof listingFormSchema>) {
    if (!user || !listingRef) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in and the listing must exist to update it.',
      });
      return;
    }
    
    updateDocumentNonBlocking(listingRef, values);

    toast({
      title: 'Listing Updated!',
      description: 'Your changes have been saved successfully.',
    });
    
    router.push('/vendors/profile');
  }

  if (isLoading) {
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
    );
  }

  if (!listing) {
     return (
        <>
            <PageHeader
                title="Listing Not Found"
                description="We couldn't find the listing you're trying to edit."
            />
             <div className="container mx-auto px-4 pb-16 text-center">
                <Button onClick={() => router.push('/vendors/profile')}>Return to Dashboard</Button>
            </div>
        </>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Listing"
        description="Update the details of your product or service."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Editing: {listing.listingName}
            </CardTitle>
            <CardDescription>
              Make your changes below and click save.
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

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button type="submit" className="w-full sm:w-auto">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => router.push('/vendors/profile')}
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
  );
}
