
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import Link from 'next/link';
import Image from 'next/image';

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
import { Separator } from '@/components/ui/separator';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export default function OnboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && user) {
        router.replace('/dashboard/vendor');
    }
  }, [user, isUserLoading, router]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (isUserLoading || user) {
    return (
        <div className="container mx-auto px-4 pb-16 flex justify-center pt-24">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
    );
  }
  
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
        toast({
            title: "Logged In",
            description: "Welcome to the community!",
        });
        router.push('/forums'); // Redirect to a community page
    } catch (error) {
        console.error("Google login error", error);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Could not log you in with Google. Please try again.",
        });
    }
  };


  async function handleLogin(values: z.infer<typeof loginSchema>) {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
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

  return (
    <>
      <PageHeader
        title="Welcome!"
        description="Join the community or log in to your business dashboard."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-lg bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">
              Residents & Community
            </CardTitle>
            <CardDescription>
              The easiest way to join the discussion and support local.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Button className="w-full" onClick={handleGoogleLogin}>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 174 55.9L387 110.1C344.9 73.1 298.8 56 248 56c-94.2 0-170.9 76.7-170.9 170.9s76.7 170.9 170.9 170.9c98.2 0 159.9-67.7 165-148.6H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Sign in with Google
              </Button>
               <p className="text-xs text-muted-foreground text-center mt-3">
                  By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
          </CardContent>

          <Separator className="my-4" />

          <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">
              Business Owners
            </CardTitle>
             <CardDescription>
              Manage your directory listing and marketplace sales.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form
                onSubmit={loginForm.handleSubmit(handleLogin)}
                className="space-y-6"
              >
                  <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@business.com"
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
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Business Login
                </Button>
              </form>
            </Form>
             <p className="text-xs text-muted-foreground text-center mt-4">
                  New business?{" "}
                  <Link href="/dashboard/vendor/register" className="underline hover:text-primary">
                    Register your business here.
                  </Link>
                </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
