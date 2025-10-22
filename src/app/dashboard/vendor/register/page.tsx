
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CreditCard, CheckCircle2, Phone, Link2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';


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
import { Separator } from '@/components/ui/separator';

const vendorRegistrationSchema = z.object({
  displayName: z.string().min(2, 'Your name must be at least 2 characters.').optional(),
  email: z.string().email().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters.').optional(),
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
}).refine(data => data.email && data.password || !data.email && !data.password, {
    message: "Email and password must be provided together.",
    path: ["email"],
});

type LoginMethod = 'email' | 'google' | null;

export default function VendorRegistrationPage() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const [isAbnLoading, setIsAbnLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(null);
  
  // If user is already logged in and tries to access this page, redirect them.
  useEffect(() => {
    if (!isUserLoading && user) {
        // If they already have a vendor profile, go to dashboard.
        // Otherwise, they might be a resident wanting to upgrade, so we let them stay.
        const vendorDocRef = doc(firestore, 'vendors', user.uid);
        // This is a one-off check, not a subscription.
        const getVendorDoc = async () => {
            const { getDoc } = await import('firebase/firestore');
            const docSnap = await getDoc(vendorDocRef);
            if (docSnap.exists()) {
                router.replace('/dashboard/vendor');
            }
        }
        getVendorDoc();
    }
  }, [user, isUserLoading, router, firestore]);


  const form = useForm<z.infer<typeof vendorRegistrationSchema>>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      businessName: '',
      abn: '',
      address: '',
      phone: '',
      website: '',
      consent: false,
    },
  });

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setLoginMethod('google');
      // The useEffect will handle redirection if they are already a vendor.
      // Otherwise, they can proceed with the form.
    } catch (error) {
      console.error("Google sign-in error", error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: "Could not sign you in with Google. Please try again or use email.",
      });
    }
  };

  async function handleVendorRegistration(values: z.infer<typeof vendorRegistrationSchema>) {
    setIsSubmitting(true);
    setIsAbnLoading(true);

    let currentUser = user;

    try {
        // Step 1: Ensure user is authenticated
        if (!currentUser) {
            if (values.email && values.password) {
                const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
                currentUser = userCredential.user;
                await updateProfile(currentUser, { displayName: values.displayName });
            } else {
                throw new Error("You must be logged in to register a business. Please sign in with Google or create an account.");
            }
        }

        // Step 2: Validate ABN
        const validationResult = await validateAbn({ abn: values.abn, businessName: values.businessName });
        if (!validationResult.isValid) {
            toast({ variant: 'destructive', title: 'ABN Validation Failed', description: validationResult.message });
            setIsAbnLoading(false);
            setIsSubmitting(false);
            return;
        }
        toast({ title: 'ABN Validated!', description: validationResult.message });
        setIsAbnLoading(false);
        
        // Step 3: Create Vendor Document in Firestore
        const vendorRef = doc(firestore, 'vendors', currentUser.uid);
        const vendorData = {
            id: currentUser.uid,
            email: currentUser.email,
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
        setStep(2); // Move to Stripe connection step
    } catch (error: any) {
      console.error('Onboarding Error:', error);
      let description = 'Could not save business details. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email is already registered. Please log in or use a different email.';
      }
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: description,
      });
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
          returnUrl: `${window.location.origin}/dashboard/vendor`,
          refreshUrl: `${window.location.origin}/dashboard/vendor`,
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
              {step === 1 ? "Step 1: Business & Account Details" : "Step 2: Connect for Payments"}
            </CardTitle>
            <CardDescription>
              {step === 1 ? "This information is used to create your account and verify your business." : "Securely connect your Stripe account to receive payments for sales."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
                <Form {...form}>
                    <form
                    onSubmit={form.handleSubmit(handleVendorRegistration)}
                    className="space-y-8"
                    >
                    
                    {!user && (
                         <div className='space-y-4 p-4 border rounded-lg'>
                            <h3 className='font-medium'>First, create your account</h3>
                            <p className="text-sm text-muted-foreground">You can sign up with Google or a traditional email and password.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <Button type="button" onClick={handleGoogleSignIn} variant="outline">
                                 <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 174 55.9L387 110.1C344.9 73.1 298.8 56 248 56c-94.2 0-170.9 76.7-170.9 170.9s76.7 170.9 170.9 170.9c98.2 0 159.9-67.7 165-148.6H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                                 Sign up with Google
                               </Button>
                               <div className="relative">
                                  <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                  </div>
                                  <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                      Or
                                    </span>
                                  </div>
                                </div>
                            </div>
                            <FormField
                                control={form.control}
                                name="displayName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Full Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Login Email</FormLabel>
                                        <FormControl><Input type="email" placeholder="you@email.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="password" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl><Input type="password" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </div>
                        </div>
                    )}
                    
                    {user && (
                        <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-900">
                           <p>Signed in as <span className="font-bold">{user.email}</span>. Now, please provide your business details below.</p>
                        </div>
                    )}

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
                            <FormLabel>Agree to Terms and Conditions</FormLabel>
                            <FormDescription>
                                I understand that my business details will be public. By checking this box, I agree to the{' '}
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
                        {isAbnLoading ? 'Validating ABN...' : 'Create Business and Continue'}
                    </Button>
                    </form>
                </Form>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="text-center bg-secondary p-8 rounded-lg">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-headline text-xl font-bold">
                    Business Registered! One Last Step.
                  </h3>
                  <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                    To sell products and receive payments, connect your Stripe account. We partner with Stripe for secure payment processing and never handle your financial data directly.
                  </p>
                  <Button
                    className="mt-6"
                    size="lg"
                    onClick={handleStripeConnect}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Connect with Stripe
                  </Button>
                   <Button variant="link" onClick={() => router.push('/dashboard/vendor')} className="mt-2">
                        Skip for now
                    </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
