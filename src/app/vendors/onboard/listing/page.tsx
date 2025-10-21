
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ListPlus, DollarSign, FileImage, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { collection } from 'firebase/firestore';
import React, { useState } from 'react';


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
import { useFirestore, useUser } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { uploadImage } from '@/ai/flows/upload-image';

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
  image: z
    .any()
    .refine((files) => files?.length > 0, 'Image is required.')
    .refine((files) => files?.[0]?.size <= 5000000, `Max file size is 5MB.`)
    .refine(
      (files) => ['image/jpeg', 'image/png', 'image/webp'].includes(files?.[0]?.type),
      'Only .jpg, .png, and .webp formats are supported.'
    ),
  deliveryMethod: z.enum(['Pickup Only', 'Local Delivery Available'], {
    required_error: 'You need to select a delivery method.',
  }),
});

// Helper function to convert file to data URI
const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });


export default function VendorListingPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const imageRef = form.register('image');

  async function onSubmit(values: z.infer<typeof listingFormSchema>) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to create a listing.',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    let imageUrl = 'https://picsum.photos/seed/1/400/300'; // Default placeholder

    try {
        const file = values.image[0];
        const fileDataUri = await fileToDataUri(file);

        const uploadResult = await uploadImage({
            fileDataUri,
            filePath: `listings/${user.uid}/${Date.now()}_${file.name}`,
        });

        imageUrl = uploadResult.publicUrl;

        const listingsCollectionRef = collection(
          firestore,
          `vendors/${user.uid}/listings`
        );

        const newListing = {
          vendorId: user.uid,
          listingName: values.listingName,
          category: values.category,
          price: values.price,
          description: values.description,
          deliveryMethod: values.deliveryMethod,
          imageUrl,
        };

        addDocumentNonBlocking(listingsCollectionRef, newListing);

        toast({
          title: 'Listing Created!',
          description:
            'Your new product or service has been added to the marketplace.',
        });
        
        form.reset();

    } catch (error) {
        console.error("Error creating listing:", error);
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "Could not upload image or create listing. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Create a Listing"
        description="Add a new product or service to your vendor profile."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Your New Listing
            </CardTitle>
            <CardDescription>
              Describe the product or service you want to offer to the
              community. You can add more listings later from your profile.
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
                          defaultValue={field.value}
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
                          defaultValue={field.value}
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
                      <FormLabel>Upload Image</FormLabel>
                      <FormControl>
                         <Input type="file" {...imageRef} />
                      </FormControl>
                      <FormDescription>
                        Upload a clear image of your product or service. Max 5MB.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ListPlus className="mr-2 h-4 w-4" />
                    )}
                    {isSubmitting ? 'Creating...' : 'Create Listing'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={() => router.push('/dashboard/vendor')}
                    disabled={isSubmitting}
                  >
                    Finish & View Dashboard
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
