
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
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
import { useAuth, useUser } from '@/firebase';

const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

   useEffect(() => {
    if (!isUserLoading && user) {
        // After registration or if already logged in, go to the main dashboard.
        // The dashboard will guide them if they want to become a vendor.
        router.replace('/dashboard/vendor');
    }
  }, [user, isUserLoading, router]);

  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  async function handleRegistration(values: z.infer<typeof registrationSchema>) {
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      // Set the user's display name, which can be used across the app
      await updateProfile(userCredential.user, { displayName: values.name });

      toast({
        title: 'Account Created!',
        description: 'Welcome! You can now participate in the community.',
      });

      // The useEffect will handle the redirect to the dashboard
      
    } catch (error: any) {
      console.error('Registration Error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: error.code === 'auth/email-already-in-use' 
          ? 'This email is already in use. Please log in instead.' 
          : 'Could not create your account. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (isUserLoading || user) {
    return (
        <div className="container mx-auto px-4 pb-16 flex justify-center pt-24">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Create an Account"
        description="Join the community to participate, or register your business."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-lg bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Sign Up
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
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                        <Input
                            placeholder="e.g., Jane Doe"
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
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
                
                <p className="text-sm text-muted-foreground pt-4 border-t">
                    After creating an account, you can choose to register your business from your dashboard.
                </p>

                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
                </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
