
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
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
import { useAuth, useFirestore, useUser } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const signUpSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

export default function OnboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  if (isUserLoading) {
    return (
        <div className="container mx-auto px-4 pb-16 flex justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
    );
  }

  if (user) {
    router.push('/dashboard/resident');
    return null;
  }

  async function handleSignUp(values: z.infer<typeof signUpSchema>) {
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
      };

      setDocumentNonBlocking(residentRef, residentData, { merge: true });

      toast({
        title: 'Account Created!',
        description: 'Welcome to the Darebin Business Directory!',
      });
      router.push('/dashboard/resident');

    } catch (error: any) {
      console.error('Sign Up Error:', error);
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

  async function handleLogin(values: z.infer<typeof loginSchema>) {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });
      router.push('/dashboard/resident');

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
        title="Join Darebin Business Directory"
        description="Join our community or log in to manage your profile."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-lg bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Welcome!
            </CardTitle>
            <CardDescription>
              Sign up to join the community or log in to your existing account.
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                              placeholder="you@email.com"
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
                       {isSubmitting && <loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Login
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="signup" className="pt-6">
                 <Form {...signUpForm}>
                      <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-8">
                          <FormField
                              control={signUpForm.control}
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
                              control={signUpForm.control}
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
                              control={signUpForm.control}
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
                          <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                              {isSubmitting && <loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Create Account
                          </Button>
                      </form>
                 </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
