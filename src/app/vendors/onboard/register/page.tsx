
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
import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { validateAbn } from '@/ai/flows/validate-abn';
import type { Vendor } from '@/lib/types';


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
  address: z.string().min(5, 'Please enter a valid business address.'),
  phone: z.string().optional(),
  website: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  consent: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions to continue.',
  }),
});

export default function VendorRegistrationPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if the user already has a vendor profile
  const vendorRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'vendors', user.uid) : null),
    [firestore, user]
  );
  const { data: vendor, isLoading: isVendorLoading } = useDoc<Vendor>(vendorRef);

  useEffect(() => {
    // If user is not logged in, redirect to login page first.
    if (!isUserLoading && !user) {
        router.replace('/vendors/onboard');
    }
    // If user already has a vendor profile, redirect to dashboard.
    if (!isVendorLoading && vendor) {
        router.replace('/dashboard/vendor');
    }
  }, [user, isUserLoading, vendor, isVendorLoading, router]);

  const form = useForm<z.infer<typeof vendorRegistrationSchema>>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      businessName: '',
      abn: '',
      address: '',
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

    try {
        const validationResult = await validateAbn({ abn: values.abn, businessName: values.businessName });
        if (!validationResult.isValid) {
            toast({ variant: 'destructive', title: 'ABN Validation Failed', description: validationResult.message });
            return;
        }

        toast({ title: 'ABN Validated!', description: validationResult.message });
        
        const vendorDocRef = doc(firestore, 'vendors', user.uid);
        const vendorData = {
            id: user.uid,
            email: user.email,
            businessName: values.businessName,
            abn: values.abn,
            address: values.address,
            phone: values.phone || '',
            website: values.website || '',
            paymentsEnabled: false, // Always starts as false
        };

        setDocumentNonBlocking(vendorDocRef, vendorData, { merge: true });

        toast({
            title: 'Business Details Saved!',
            description: 'Your business is now listed in the directory.',
        });
        
        router.push('/dashboard/vendor');

    } catch (error: any) {
      console.error('Onboarding Error:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Could not save business details. Please try again.',
      });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  if (isUserLoading || isVendorLoading || vendor || !user) {
    return (
      <div className="container mx-auto px-4 pb-16 flex justify-center pt-24">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Register Your Business"
        description="Join the directory to be discovered by the local community."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Step 1: Business Details
            </CardTitle>
            <CardDescription>
              Provide your business information for verification. This will list you in the public directory.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Business Address</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., 123 High St, Northcote VIC 3070" {...field} />
                            </FormControl>
                            <FormDescription>
                            Your business must be located in the Darebin council area.
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
                                .
                            </FormDescription>
                            <FormMessage />
                            </div>
                        </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Validating & Saving...' : 'List My Business'}
                    </Button>
                    </form>
                </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
