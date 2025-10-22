
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CheckCircle2, Phone, Link2, Loader2 } from 'lucide-react';
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
  address: z.string().min(5, 'Please enter a valid business address.'),
  phone: z.string().optional(),
  website: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  consent: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms for your business details to be made public.',
  }),
});

export default function VendorRegistrationPage() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [isAbnLoading, setIsAbnLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // If user is not logged in, redirect them away.
  useEffect(() => {
    if (!isUserLoading && !user) {
        toast({
            variant: 'destructive',
            title: 'Authentication Required',
            description: 'Please sign in first to register your business.',
        });
        router.replace('/');
    }
  }, [user, isUserLoading, router, toast]);


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
    setIsSubmitting(true);
    setIsAbnLoading(true);

    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: "You must be logged in to register." });
        setIsSubmitting(false);
        return;
    }

    try {
        // Step 1: Validate ABN
        const validationResult = await validateAbn({ abn: values.abn, businessName: values.businessName });
        if (!validationResult.isValid) {
            toast({ variant: 'destructive', title: 'ABN Validation Failed', description: validationResult.message });
            setIsAbnLoading(false);
            setIsSubmitting(false);
            return;
        }
        toast({ title: 'ABN Validated!', description: validationResult.message });
        setIsAbnLoading(false);
        
        // Step 2: Create Vendor Document in Firestore
        const vendorRef = doc(firestore, 'vendors', user.uid);
        const vendorData = {
            id: user.uid,
            email: user.email,
            businessName: values.businessName,
            abn: values.abn,
            abnVerified: true, // Set the verified badge
            address: values.address,
            phone: values.phone || '',
            website: values.website || '',
            paymentsEnabled: false, // Default to false, awaiting admin approval
        };

        setDocumentNonBlocking(vendorRef, vendorData, { merge: true });

        toast({
            title: 'Business Account Created',
            description: 'Your business details have been validated and saved.',
        });
        
        // Redirect to dashboard to continue to Stripe onboarding
        router.push('/dashboard/vendor');

    } catch (error: any) {
      console.error('Onboarding Error:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Could not save business details. Please try again.',
      });
      setIsAbnLoading(false);
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Register Your Business"
        description="List your business in our directory to get discovered by the local community."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
                Your Business Details
            </CardTitle>
            <CardDescription>
              This information will be displayed publicly on your business profile page after verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
                <form
                onSubmit={form.handleSubmit(handleVendorRegistration)}
                className="space-y-8"
                >
                <div className='space-y-4 p-4 border rounded-lg'>
                    <h3 className='font-medium'>Public Business Details</h3>
                    <FormField control={form.control} name="businessName" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Business Name</FormLabel>
                            <FormControl><Input placeholder="e.g., Green Thumb Gardening" {...field}/></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="abn" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Australian Business Number (ABN)</FormLabel>
                            <FormControl><Input placeholder="12 345 678 901" {...field} /></FormControl>
                            <FormDescription>We validate your ABN to ensure all vendors are legitimate businesses. This will earn you a "Verified" badge.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}/>
                        <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Business Address</FormLabel>
                            <FormControl><Input placeholder="e.g., 123 High St, Northcote VIC 3070" {...field} /></FormControl>
                            <FormDescription>Your business must be located in the Darebin council area.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField control={form.control} name="phone" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Contact Phone (Optional)</FormLabel>
                            <FormControl><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="0412 345 678" {...field} className="pl-8"/></div></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="website" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Website (Optional)</FormLabel>
                            <FormControl><div className="relative"><Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="https://your-business.com.au" {...field} className="pl-8"/></div></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}/>
                    </div>
                </div>
                
                <FormField
                    control={form.control}
                    name="consent"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                        <FormLabel>Agree to Public Listing</FormLabel>
                        <FormDescription>
                            I understand that my business details will be made public in the directory. By checking this box, I also agree to the{' '}
                            <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link>{' '}
                            and acknowledge the{' '}<Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
                        </FormDescription>
                        <FormMessage />
                        </div>
                    </FormItem>
                    )}
                />
                <Button type="submit" className="w-full md:w-auto" disabled={isAbnLoading || isSubmitting}>
                        {(isAbnLoading || isSubmitting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isAbnLoading ? 'Validating ABN...' : 'Create Business Profile'}
                </Button>
                </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
    
