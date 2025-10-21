
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

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
import { useAuth, useFirestore } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { validateAbn } from '@/ai/flows/validate-abn';

const registrationSchema = z.object({
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
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  consent: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions to continue.',
  }),
});

export default function VendorRegistrationPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      businessName: '',
      abn: '',
      address: '',
      email: '',
      password: '',
      consent: false,
    },
  });

  async function handleRegistration(values: z.infer<typeof registrationSchema>) {
    setIsSubmitting(true);
    
    // 1. Validate ABN first
    try {
        const validationResult = await validateAbn({ abn: values.abn, businessName: values.businessName });
        if (!validationResult.isValid) {
            toast({ variant: 'destructive', title: 'ABN Validation Failed', description: validationResult.message });
            setIsSubmitting(false);
            return;
        }
        toast({ title: 'ABN Validated!', description: validationResult.message });
    } catch (error) {
        console.error('ABN validation flow error:', error);
        toast({ variant: 'destructive', title: 'ABN Validation Error', description: 'Could not validate ABN at this time.' });
        setIsSubmitting(false);
        return;
    }

    // 2. Create Firebase Auth user
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: values.businessName });
      
      // 3. Create Vendor document in Firestore
      const vendorRef = doc(firestore, 'vendors', user.uid);
      const vendorData = {
          id: user.uid,
          email: user.email,
          businessName: values.businessName,
          abn: values.abn,
          address: values.address,
          paymentsEnabled: false, // Default to false
      };

      setDocumentNonBlocking(vendorRef, vendorData, { merge: true });

      toast({
          title: 'Business Registered!',
          description: 'Your business is now listed in the directory.',
      });
      router.push('/dashboard/vendor');

    } catch (error: any) {
      console.error('Registration Error:', error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.code === 'auth/email-already-in-use' ? 'This email is already registered. Please log in.' : 'Could not create your account.',
      });
    } finally {
      setIsSubmitting(false);
    }
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
              Business Details
            </CardTitle>
            <CardDescription>
              Already have an account?{' '}
               <Link href="/vendors/onboard" className="underline hover:text-primary">
                Login here
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
                <form
                onSubmit={form.handleSubmit(handleRegistration)}
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
                        We validate your ABN to ensure all businesses are legitimate.
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

                <hr/>

                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Login Email</FormLabel>
                        <FormControl>
                        <Input type="email" placeholder="you@company.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
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
                    {isSubmitting ? 'Registering...' : 'Register Business'}
                </Button>
                </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
