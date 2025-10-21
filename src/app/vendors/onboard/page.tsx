
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { CreditCard, CheckCircle2, Phone, Link2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { validateAbn } from '@/ai/flows/validate-abn';

const residentSignUpSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const vendorSignUpSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters.'),
  abn: z
    .string()
    .regex(
      /^\d{2} \d{3} \d{3} \d{3}$/,
      'Please enter a valid ABN format (e.g., 12 345 678 901).'
    ),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  phone: z.string().optional(),
  website: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  consent: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions to continue.',
  }),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAbnLoading, setIsAbnLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const residentSignUpForm = useForm<z.infer<typeof residentSignUpSchema>>({
    resolver: zodResolver(residentSignUpSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const vendorSignUpForm = useForm<z.infer<typeof vendorSignUpSchema>>({
    resolver: zodResolver(vendorSignUpSchema),
    defaultValues: {
      businessName: '',
      abn: '',
      email: '',
      password: '',
      phone: '',
      website: '',
      consent: false,
    },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (user) {
    router.push('/dashboard/vendor');
    return null;
  }

  async function handleResidentSignUp(values: z.infer<typeof residentSignUpSchema>) {
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName: values.displayName });
      
      const residentRef = doc(firestore, 'residents', user.uid);
      const residentData = {
        uid: user.uid,
        email: values.email,
        displayName: values.displayName,
        suburb: 'Northcote', // Placeholder
      };

      setDocumentNonBlocking(residentRef, residentData, { merge: true });

      toast({
        title: 'Account Created!',
        description: 'Welcome to Suburbmates!',
      });
      router.push('/forums');

    } catch (error: any) {
      console.error('Resident Sign Up Error:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description:
          error.code === 'auth/email-already-in-use'
            ? 'This email is already in use. Please log in.'
            : 'Could not create account. Please try again.',
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function handleVendorSignUp(values: z.infer<typeof vendorSignUpSchema>) {
    setIsSubmitting(true);
    setIsAbnLoading(true);

    try {
        const validationResult = await validateAbn({ abn: values.abn, businessName: values.businessName });
        if (!validationResult.isValid) {
            toast({ variant: 'destructive', title: 'ABN Validation Failed', description: validationResult.message });
            return;
        }

        toast({ title: 'ABN Validated!', description: validationResult.message });

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            values.email,
            values.password
        );
        const user = userCredential.user;
        setCurrentUserId(user.uid);

        const vendorRef = doc(firestore, 'vendors', user.uid);
        const vendorData = {
            businessName: values.businessName,
            abn: values.abn,
            email: values.email,
            phone: values.phone || '',
            website: values.website || '',
            paymentsEnabled: false,
        };

        setDocumentNonBlocking(vendorRef, vendorData, { merge: true });

        toast({
            title: 'Account Created & Details Saved',
            description: 'Your business details have been successfully validated.',
        });
        setStep(2);
    } catch (error: any) {
      console.error('Onboarding Error:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description:
          error.code === 'auth/email-already-in-use'
            ? 'This email is already in use. Please log in.'
            : 'Could not create account. Please try again.',
      });
    } finally {
        setIsAbnLoading(false);
        setIsSubmitting(false);
    }
  }

  async function handleLogin(values: z.infer<typeof loginSchema>) {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      // A simple way to check role is to see if a vendor doc exists.
      // This is not perfectly secure but sufficient for this stage.
      const vendorRef = doc(firestore, 'vendors', userCredential.user.uid);
      // This part is tricky without a synchronous getDoc, we redirect to a general dashboard
      // which can then handle role-based redirects. For now, we assume vendor.
      router.push('/dashboard/vendor');

    } catch (error: any) {
      console.error('Login Error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
      });
    } finally {
        setIsSubmitting(false);
    }
  }


  async function handleStripeConnect() {
     if (!currentUserId) {
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
          refreshUrl: `${window.location.origin}/vendors/onboard`,
          userId: currentUserId,
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
        title="Join Suburbmates"
        description="Join our marketplace or log in to manage your profile."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              {step === 1 ? "Welcome!" : "Connect for Payments"}
            </CardTitle>
            <CardDescription>
              {step === 1 ? "Sign up to join the community or log in to your existing account." : "Securely connect your Stripe account to receive payments."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
               <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="pt-6">
                   <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(handleLogin)}
                      className="space-y-8"
                    >
                       <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="you@company.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                         {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Login
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="signup" className="pt-6">
                    <Tabs defaultValue="resident" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="resident">Join as a Resident</TabsTrigger>
                            <TabsTrigger value="vendor">Join as a Vendor</TabsTrigger>
                        </TabsList>

                        <TabsContent value="resident" className="pt-6">
                           <Form {...residentSignUpForm}>
                                <form onSubmit={residentSignUpForm.handleSubmit(handleResidentSignUp)} className="space-y-8">
                                    <FormField
                                        control={residentSignUpForm.control}
                                        name="displayName"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Display Name</FormLabel>
                                            <FormControl>
                                            <Input placeholder="e.g., Jane D." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={residentSignUpForm.control}
                                        name="email"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                            <Input type="email" placeholder="you@email.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={residentSignUpForm.control}
                                        name="password"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                            <Input type="password" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Resident Account
                                    </Button>
                                </form>
                           </Form>
                        </TabsContent>

                        <TabsContent value="vendor" className="pt-6">
                            <Form {...vendorSignUpForm}>
                                <form
                                onSubmit={vendorSignUpForm.handleSubmit(handleVendorSignUp)}
                                className="space-y-8"
                                >
                                <FormField
                                    control={vendorSignUpForm.control}
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
                                    control={vendorSignUpForm.control}
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
                                    control={vendorSignUpForm.control}
                                    name="email"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Email</FormLabel>
                                        <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="you@company.com"
                                            {...field}
                                        />
                                        </FormControl>
                                        <FormDescription>
                                        This email will be used for your account login.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={vendorSignUpForm.control}
                                    name="password"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                        <Input type="password" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                        Must be at least 6 characters.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <FormField
                                    control={vendorSignUpForm.control}
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
                                    control={vendorSignUpForm.control}
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
                                    control={vendorSignUpForm.control}
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
                        </TabsContent>
                    </Tabs>
                </TabsContent>
              </Tabs>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="flex items-center text-sm text-muted-foreground mb-6">
                  <CheckCircle2 className="w-5 h-5 mr-2 text-primary" />
                  <span className="font-semibold text-foreground">
                    Step 1: Business Details
                  </span>
                  <div className="flex-grow border-t border-solid mx-4 border-primary"></div>
                  <CheckCircle2 className="w-5 h-5 mr-2 text-primary" />
                  <span>Step 2: Connect Payments</span>
                </div>

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
