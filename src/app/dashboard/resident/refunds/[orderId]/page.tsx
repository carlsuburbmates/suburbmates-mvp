
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Send } from 'lucide-react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { doc, collection, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Order, Vendor } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { sendNewRefundRequestNotification } from '@/lib/email';


const refundRequestSchema = z.object({
  reason: z
    .string()
    .min(20, 'Please provide a detailed reason of at least 20 characters.')
    .max(1000, 'Your reason cannot exceed 1000 characters.'),
});

export default function RefundRequestPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { orderId } = params;
  const vendorId = searchParams.get('vendorId');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const orderRef = useMemoFirebase(
    () =>
      firestore && vendorId && orderId
        ? doc(firestore, `vendors/${vendorId}/orders`, orderId as string)
        : null,
    [firestore, vendorId, orderId]
  );
  
  const { data: order, isLoading } = useDoc<Order>(orderRef);

  const form = useForm<z.infer<typeof refundRequestSchema>>({
    resolver: zodResolver(refundRequestSchema),
    defaultValues: {
      reason: '',
    },
  });
  
  async function onSubmit(values: z.infer<typeof refundRequestSchema>) {
    if (!user || !firestore || !vendorId || !orderId || !order) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not submit request. Invalid session.',
      });
      return;
    }
    
    setIsSubmitting(true);

    try {
        const refundRequestData = {
            orderId: orderId as string,
            buyerId: user.uid,
            vendorId: vendorId as string,
            reason: values.reason,
            state: 'OPEN' as const,
        };

        const refundRequestsRef = collection(firestore, `vendors/${vendorId}/refund_requests`);
        const newRequestRef = await addDocumentNonBlocking(refundRequestsRef, refundRequestData);

        // Fetch vendor to send notification
        const vendorRef = doc(firestore, 'vendors', vendorId as string);
        const vendorSnap = await getDoc(vendorRef);
        if (vendorSnap.exists()) {
            const vendor = vendorSnap.data() as Vendor;
            await sendNewRefundRequestNotification(vendor, order, {id: newRequestRef.id, ...refundRequestData});
        }
        
        toast({
          title: 'Refund Request Submitted',
          description: 'The vendor has been notified. You will receive an update via email.',
        });
        
        router.push('/dashboard/resident');

    } catch (error) {
        console.error("Error submitting refund request:", error);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "Could not submit your request. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
        <div className="flex justify-center">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-8">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!order) {
     return (
        <div className="text-center">
            <h2 className="text-xl font-semibold">Order Not Found</h2>
            <p className="text-muted-foreground mt-2">We couldn't find the order you're trying to request a refund for.</p>
            <Button onClick={() => router.push('/dashboard/resident')} className="mt-4">Return to My Orders</Button>
        </div>
    );
  }

  return (
    <div className="flex justify-center">
    <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-lg shadow-2xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          Request a Refund
        </CardTitle>
        <CardDescription>
          Request a refund for your order of <span className="font-semibold text-foreground">{order.listingName}</span> from <Link href={`/vendors/${order.vendorId}`} className="underline font-semibold text-foreground">the vendor</Link>. Please describe the issue in detail.
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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Refund</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., The item was not as described, it was damaged upon arrival, etc."
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your feedback is important. The vendor will be notified of your request.
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
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full sm:w-auto"
                onClick={() => router.push('/dashboard/resident')}
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
  );
}
