

'use client';

import { notFound, useRouter, useSearchParams } from 'next/navigation';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, runTransaction } from 'firebase/firestore';
import type { Vendor, Listing, Review } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Link2, Phone, Star, Tag, Truck, Loader2, MessageSquare, MapPin, ShieldCheck, FileText, Info, Mail } from 'lucide-react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const reviewSchema = z.object({
  rating: z.coerce.number().min(1, "Rating is required.").max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters.").max(1000, "Comment cannot exceed 1000 characters."),
});


export default function VendorProfilePage({
  params,
}: {
  params: { vendorId: string };
}) {
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useUser();
  const [isRedirecting, setIsRedirecting] = useState<string | null>(null);
  const [currentRating, setCurrentRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Display toast based on checkout status
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      toast({
        title: 'Purchase Successful!',
        description: "Thank you for supporting a local business.",
      });
    }
    if (searchParams.get('checkout') === 'cancel') {
        toast({
            variant: 'destructive',
            title: 'Purchase Canceled',
            description: 'Your order was not completed. You have not been charged.',
        });
    }
  }, [searchParams, toast]);


  // Fetch Vendor Details
  const vendorRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'vendors', params.vendorId) : null),
    [firestore, params.vendorId]
  );
  const { data: vendor, isLoading: isVendorLoading } = useDoc<Vendor>(vendorRef);

  // Fetch Vendor Listings
  const listingsQuery = useMemoFirebase(
    () =>
      firestore && vendor?.paymentsEnabled
        ? collection(firestore, 'vendors', params.vendorId, 'listings')
        : null,
    [firestore, params.vendorId, vendor?.paymentsEnabled]
  );
  const { data: listings, isLoading: areListingsLoading } =
    useCollection<Listing>(listingsQuery);

  // Fetch Vendor Reviews
  const reviewsQuery = useMemoFirebase(
    () =>
      firestore
        ? collection(firestore, 'vendors', params.vendorId, 'reviews')
        : null,
    [firestore, params.vendorId]
  );
  const { data: reviews, isLoading: areReviewsLoading } =
    useCollection<Review>(reviewsQuery);


  const handlePurchase = async (listing: Listing) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Please log in to purchase an item.' });
        return;
    }
    if (!vendor || !vendor.stripeAccountId || !vendor.paymentsEnabled) {
      toast({
        variant: 'destructive',
        title: 'Vendor Not Ready for Payments',
        description: 'This vendor has not connected their payment account or is awaiting approval.',
      });
      return;
    }

    setIsRedirecting(listing.id);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing: {
            listingName: listing.listingName,
            description: listing.description,
            price: listing.price,
          },
          vendorStripeAccountId: vendor.stripeAccountId,
          vendorId: vendor.id,
          listingId: listing.id,
          userId: user.uid,
        }),
      });

      const { url, error } = await response.json();

      if (error) throw new Error(error);
      if (url) router.push(url);

    } catch (e: any) {
      console.error('Purchase Error:', e);
      toast({
        variant: 'destructive',
        title: 'Checkout Failed',
        description: e.message || 'Could not initiate checkout. Please try again.',
      });
      setIsRedirecting(null);
    }
  };
  
  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const handleReviewSubmit = async (values: z.infer<typeof reviewSchema>) => {
    if (!user || !vendorRef || !firestore) {
      toast({ variant: "destructive", title: "You must be logged in to leave a review." });
      return;
    }
    setIsSubmittingReview(true);
    
    const reviewsRef = collection(vendorRef, 'reviews');

    try {
      await runTransaction(firestore, async (transaction) => {
        const vendorDoc = await transaction.get(vendorRef);
        if (!vendorDoc.exists()) {
          throw "Vendor document does not exist!";
        }

        const newReviewRef = doc(reviewsRef);
        transaction.set(newReviewRef, {
          residentId: user.uid,
          residentName: user.displayName || 'Anonymous',
          rating: values.rating,
          comment: values.comment,
          timestamp: new Date().toISOString(),
        });
        
        const currentReviewCount = vendorDoc.data().reviewCount || 0;
        const currentAverageRating = vendorDoc.data().averageRating || 0;

        const newReviewCount = currentReviewCount + 1;
        const newAverageRating = ((currentAverageRating * currentReviewCount) + values.rating) / newReviewCount;

        transaction.update(vendorRef, { 
          reviewCount: newReviewCount,
          averageRating: newAverageRating
        });
      });

      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback.",
      });
      reviewForm.reset();
      setCurrentRating(0);

    } catch (e) {
      console.error("Review submission error: ", e);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was a problem submitting your review.",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        toast({
            title: "Logged In",
            description: "Welcome! You can now leave a review.",
        });
    } catch (error) {
        console.error("Google login error", error);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not log you in with Google. Please try again.",
        });
    }
  };


  if (isVendorLoading) {
    return (
      <div className="container mx-auto px-4 pb-16">
        <PageHeader title="" description="" />
        <Skeleton className="h-12 w-1/2 mt-12" />
        <Skeleton className="h-8 w-2/3 mt-4" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <Card><CardHeader><Skeleton className="h-48 w-full" /></CardHeader><CardContent><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-48 w-full" /></CardHeader><CardContent><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-48 w-full" /></CardHeader><CardContent><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardContent></Card>
        </div>
      </div>
    );
  }

  if (!vendor) {
    notFound();
  }

  const vendorImage = PlaceHolderImages.find((p) => p.id === 'feature-vendors');
  const userAvatar = PlaceHolderImages.find((p) => p.id === 'user-avatar-1');

  return (
    <div>
      <PageHeader
        title={vendor.businessName}
        description={`Your trusted local business.`}
      />
      
      <div className="container mx-auto px-4 pb-16">

        <Card className="mb-12 overflow-hidden flex flex-col md:flex-row bg-card/60">
            <div className="relative w-full md:w-1/3 h-64 md:h-auto">
                {vendorImage && <Image src={vendorImage.imageUrl} alt={vendor.businessName} fill className="object-cover" data-ai-hint={vendorImage.imageHint} />}
            </div>
            <div className="flex-1 p-6">
                <div className="flex items-center gap-4">
                  <CardTitle className="font-headline text-2xl">{vendor.businessName}</CardTitle>
                  {vendor.abnVerified && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                      <ShieldCheck className="mr-1.5 h-4 w-4" />
                      ABN Verified
                    </Badge>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-3 text-muted-foreground">
                    {vendor.website && (
                         <p className="flex items-center gap-2">
                            <Link2 className="h-4 w-4"/>
                            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">Visit Website</a>
                        </p>
                    )}
                    {vendor.phone && (
                        <p className="flex items-center gap-2">
                           <Phone className="h-4 w-4"/>
                           <span>{vendor.phone}</span>
                        </p>
                    )}
                    {vendor.address && (
                        <p className="flex items-center gap-2">
                           <MapPin className="h-4 w-4"/>
                           <span>{vendor.address}</span>
                        </p>
                    )}
                     {vendor.supportEmail && (
                        <p className="flex items-center gap-2">
                           <Mail className="h-4 w-4"/>
                           <a href={`mailto:${vendor.supportEmail}`} className="hover:text-primary underline">{vendor.supportEmail}</a>
                        </p>
                    )}
                    <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                         <span>
                          {vendor.averageRating ? `${vendor.averageRating.toFixed(1)} stars` : 'No reviews yet'}
                          {vendor.reviewCount ? ` (${vendor.reviewCount} reviews)` : ''}
                        </span>
                    </div>
                     {vendor.refundPolicyUrl && (
                        <p className="flex items-center gap-2">
                            <FileText className="h-4 w-4"/>
                            <a href={vendor.refundPolicyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">Refund Policy</a>
                        </p>
                    )}
                </div>
                 {vendor.fulfilmentTerms && (
                    <Alert className="mt-6">
                        <Info className="h-4 w-4" />
                        <AlertTitle className="font-semibold">Fulfillment & Delivery Terms</AlertTitle>
                        <AlertDescription>
                            {vendor.fulfilmentTerms}
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </Card>

        {vendor.paymentsEnabled && (
            <>
                <h2 className="text-2xl font-bold font-headline mb-6">Our Offerings</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {areListingsLoading && Array.from({ length: 3 }).map((_, i) => (
                     <Card key={i}><CardHeader className="p-0"><Skeleton className="h-48 w-full rounded-t-lg" /></CardHeader><CardContent className="pt-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardContent></Card>
                  ))}

                  {listings?.map((listing) => {
                    const isRedirectingToListing = isRedirecting === listing.id;
                    return (
                      <Card key={listing.id}>
                        {listing.imageUrl &&
                            <CardHeader className="p-0">
                                <div className="relative h-48 w-full">
                                    <Image src={listing.imageUrl} alt={listing.listingName} fill className="object-cover rounded-t-lg" />
                                </div>
                            </CardHeader>
                        }
                        <CardContent className="p-4">
                          <h3 className="font-bold font-headline text-lg">{listing.listingName}</h3>
                          <p className="text-muted-foreground text-sm mt-1 flex-grow">{listing.description}</p>
                          
                          <div className="mt-4 space-y-2 text-sm">
                             <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-primary"/>
                                <Badge variant="outline">{listing.category}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-primary"/>
                                <span>{listing.deliveryMethod}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <p className="text-lg font-bold text-primary">${listing.price.toFixed(2)}</p>
                            <Button onClick={() => handlePurchase(listing)} disabled={!vendor.paymentsEnabled || isRedirectingToListing}>
                               {isRedirectingToListing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               {isRedirectingToListing ? 'Redirecting...' : 'Buy Now'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}

                  {!areListingsLoading && listings?.length === 0 && (
                    <p className="text-muted-foreground md:col-span-3">This vendor has not added any listings yet.</p>
                  )}
                </div>
                <Separator className="my-12" />
            </>
        )}

        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                 <h2 className="text-2xl font-bold font-headline mb-2">Customer Reviews</h2>
                 <p className="text-muted-foreground">See what others are saying about {vendor.businessName}.</p>
            </div>
            <div className="md:col-span-2 space-y-8">
                {user ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-headline">Leave a Review</CardTitle>
                      <CardDescription>Share your experience to help others in the community.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Form {...reviewForm}>
                        <form onSubmit={reviewForm.handleSubmit(handleReviewSubmit)} className="space-y-4">
                          <FormField
                            control={reviewForm.control}
                            name="rating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Rating</FormLabel>
                                 <FormControl>
                                  <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`cursor-pointer h-6 w-6 ${currentRating >= star ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/50'}`}
                                        onClick={() => {
                                          setCurrentRating(star);
                                          field.onChange(star);
                                        }}
                                      />
                                    ))}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={reviewForm.control}
                            name="comment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Your Comment</FormLabel>
                                <FormControl>
                                  <Textarea rows={4} placeholder="Tell us about your experience..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" disabled={isSubmittingReview}>
                             {isSubmittingReview && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Review
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                ) : (
                    <Card className="text-center p-6 bg-secondary/30">
                        <CardTitle>Want to leave a review?</CardTitle>
                        <CardDescription className="mt-2">Please sign in to share your feedback.</CardDescription>
                         <Button className="mt-4" onClick={handleGoogleLogin}>
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 174 55.9L387 110.1C344.9 73.1 298.8 56 248 56c-94.2 0-170.9 76.7-170.9 170.9s76.7 170.9 170.9 170.9c98.2 0 159.9-67.7 165-148.6H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                            </svg>
                            Sign in with Google
                        </Button>
                    </Card>
                )}
                {areReviewsLoading && <Skeleton className="h-32 w-full" />}
                {reviews?.map(review => {
                  const avatar = PlaceHolderImages.find(p => p.id === 'user-avatar-2');
                  return (
                    <Card key={review.id} className="bg-card/80">
                        <CardHeader className="flex-row items-start gap-4 space-y-0">
                           <Avatar>
                              {avatar && <AvatarImage src={avatar.imageUrl} alt={review.residentName} data-ai-hint={avatar.imageHint}/>}
                              <AvatarFallback>{review.residentName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                              <div className="flex items-center justify-between">
                                  <p className="font-semibold">{review.residentName}</p>
                                   <div className="flex items-center gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                                      ))}
                                    </div>
                              </div>
                              <p className="text-xs text-muted-foreground">{new Date(review.timestamp).toLocaleDateString()}</p>
                          </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{review.comment}</p>
                        </CardContent>
                    </Card>
                  )
                })}

                 {!areReviewsLoading && reviews?.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-4 font-semibold">No reviews yet</h3>
                      <p className="text-muted-foreground text-sm mt-1">
                      Be the first to share your experience.
                      </p>
                  </div>
                 )}
            </div>
        </div>

      </div>
    </div>
  );
}
