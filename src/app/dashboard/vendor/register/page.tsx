
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CreditCard, CheckCircle2, Phone, Link2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';

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
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { validateAbn } from '@/ai/flows/validate-abn';

const vendorRegistrationSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters.'),
  abn: z
    .string()
    .regex(
      /^\d{2} \d{3} \d{3} \d{3}$/,
      'Please enter a valid ABN format (e.g., 12 345 678 901).'
    ),
  phone: z.string().optional(),
  website: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  consent: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions to continue.',
  }),
});

export default function VendorRegistrationPage() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAbnLoading, setIsAbnLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const form = useForm<z.infer<typeof vendorRegistrationSchema>>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      businessName: '',
      abn: '',
      phone: '',
      website: '',
      consent: false,
    },
  });

  async function handleVendorRegistration(values: z.infer<typeof vendorRegistrationSchema>) {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to register as a vendor.' });
        return;
    }
    setIsSubmitting(true);
    setIsAbnLoading(true);

    try {
        const validationResult = await validateAbn({ abn: values.abn, businessName: values.businessName });
        if (!validationResult.isValid) {
            toast({ variant: 'destructive', title: 'ABN Validation Failed', description: validationResult.message });
            return;
        }

        toast({ title: 'ABN Validated!', description: validationResult.message });
        
        const vendorRef = doc(firestore, 'vendors', user.uid);
        const vendorData = {
            id: user.uid,
            email: user.email,
            businessName: values.businessName,
            abn: values.abn,
            phone: values.phone || '',
            website: values.website || '',
            paymentsEnabled: false,
        };

        setDocumentNonBlocking(vendorRef, vendorData, { merge: true });

        toast({
            title: 'Business Details Saved',
            description: 'Your business details have been successfully validated.',
        });
        setStep(2);
    } catch (error: any) {
      console.error('Onboarding Error:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Could not save business details. Please try again.',
      });
    } finally {
        setIsAbnLoading(false);
        setIsSubmitting(false);
    }
  }


  async function handleStripeConnect() {
     if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Could not identify the user. Please try signing up again.',
      });
      setStep(1);
      return;
    }

    try {
      toast({
        title: 'Redirecting to Stripe...',
        description: 'Please wait while we prepare your secure connection.',
      });

      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/vendors/onboard/listing`,
          refreshUrl: `${window.location.origin}/dashboard/vendor/register`,
          userId: user.uid,
        }),
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      if (url) {
        router.push(url);
      }
    } catch (e: any) {
      console.error('Stripe Connect Error:', e);
      toast({
        variant: 'destructive',
        title: 'Could not connect to Stripe',
        description: e.message || 'An unknown error occurred. Please try again.',
      });
    }
  }

  return (
    <>
      <PageHeader
        title="Become a Vendor"
        description="Join our marketplace by registering your business."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              {step === 1 ? "Step 1: Business Details" : "Step 2: Connect for Payments"}
            </CardTitle>
            <CardDescription>
              {step === 1 ? "Provide your business information for verification." : "Securely connect your Stripe account to receive payments."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
                <Form {...form}>
                    <form
                    onSubmit={form.handleSubmit(handleVendorRegistration)}
                    className="space-y-8"
                    >
                    <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl>
                            <Input
                                placeholder="e.g., Green Thumb Gardening"
                                {...field}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="abn"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Australian Business Number (ABN)</FormLabel>
                            <FormControl>
                            <Input placeholder="12 345 678 901" {...field} />
                            </FormControl>
                            <FormDescription>
                            We validate your ABN to ensure all vendors are
                            legitimate businesses.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Contact Phone (Optional)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="0412 345 678" {...field} className="pl-8"/>
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="website"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Website (Optional)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="https://your-business.com.au" {...field} className="pl-8"/>
                                </div>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    
                    <FormField
                        control={form.control}
                        name="consent"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                            <FormLabel>Agree to Terms and Conditions</FormLabel>
                            <FormDescription>
                                By checking this box, you agree to our{' '}
                                <Link
                                href="/terms"
                                className="underline hover:text-primary"
                                >
                                Terms of Service
                                </Link>{' '}
                                and acknowledge our{' '}
                                <Link
                                href="/privacy"
                                className="underline hover:text-primary"
                                >
                                Privacy Policy
                                </Link>
                                , including purpose-specific data usage for vendor
                                verification.
                            </FormDescription>
                            <FormMessage />
                            </div>
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full md:w-auto" disabled={isAbnLoading || isSubmitting}>
                            {(isAbnLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isAbnLoading ? 'Validating ABN...' : 'Validate and Continue'}
                    </Button>
                    </form>
                </Form>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="text-center bg-secondary p-8 rounded-lg">
                  <h3 className="font-headline text-xl font-bold">
                    Connect your Stripe account
                  </h3>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    We partner with Stripe for secure payment processing. You
                    will be redirected to Stripe to connect your account
                    securely. We do not handle your financial information
                    directly.
                  </p>
                  <Button
                    className="mt-6"
                    size="lg"
                    onClick={handleStripeConnect}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Connect with Stripe & Create Listing
                  </Button>
                </div>
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
