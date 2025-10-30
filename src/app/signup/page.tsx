'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
} from 'firebase/auth'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect, useMemo } from 'react'
import { useAuth, useUser } from '@/firebase'
import { Separator } from '@/components/ui/separator'

const signupFormSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'Display name must be at least 2 characters.'),
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(6, 'Password must be at least 6 characters long.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })

export default function SignupPage() {
  const { toast } = useToast()
  const router = useRouter()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const googleProvider = useMemo(() => new GoogleAuthProvider(), [])
  const facebookProvider = useMemo(() => new FacebookAuthProvider(), [])

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard/vendor')
    }
  }, [user, isUserLoading, router])

  const form = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function handleEmailSignup(values: z.infer<typeof signupFormSchema>) {
    setIsSubmitting(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      )

      await updateProfile(userCredential.user, {
        displayName: values.displayName,
      })

      await sendEmailVerification(userCredential.user)

      toast({
        title: 'Account Created!',
        description:
          'A verification email has been sent. Please check your inbox.',
      })

      router.push('/login')
    } catch (error: any) {
      console.error('Signup Error:', error)
      let description = 'Could not create your account. Please try again.'
      if (error.code === 'auth/email-already-in-use') {
        description =
          'This email address is already in use. Please sign in instead.'
      }
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSocialLogin = async (
    provider: GoogleAuthProvider | FacebookAuthProvider
  ) => {
    setIsSubmitting(true)
    try {
      await signInWithPopup(auth, provider)
      toast({ title: 'Sign-up Successful', description: 'Welcome!' })
      router.push('/dashboard/vendor')
    } catch (error: any) {
      console.error('Social login error:', error)
      toast({
        variant: 'destructive',
        title: 'Sign-up Failed',
        description:
          error.code === 'auth/account-exists-with-different-credential'
            ? 'An account already exists with this email address. Please sign in with the original method.'
            : 'Could not sign you up. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = () => handleSocialLogin(googleProvider)
  const handleFacebookLogin = () => handleSocialLogin(facebookProvider)

  return (
    <>
      <PageHeader
        title="Create an Account"
        description="Join the Suburbmates community."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Join Suburbmates
            </CardTitle>
            <CardDescription>
              Create your account to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="google"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 488 512"
                >
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 174 55.9L387 110.1C344.9 73.1 298.8 56 248 56c-94.2 0-170.9 76.7-170.9 170.9s76.7 170.9 170.9 170.9c98.2 0 159.9-67.7 165-148.6H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                  ></path>
                </svg>
                Sign up with Google
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleFacebookLogin}
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#1877F2',
                  color: 'white',
                  borderColor: '#1877F2',
                }}
              >
                <svg
                  className="mr-2 h-4 w-4"
                  aria-hidden="true"
                  focusable="false"
                  data-prefix="fab"
                  data-icon="facebook"
                  role="img"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                >
                  <path
                    fill="currentColor"
                    d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"
                  ></path>
                </svg>
                Sign up with Facebook
              </Button>
            </div>

            <Separator className="my-6" />

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleEmailSignup)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Your Name"
                            {...field}
                            className="pl-8"
                          />
                        </div>
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
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            {...field}
                            className="pl-8"
                          />
                        </div>
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
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            className="pl-8"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            className="pl-8"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Account
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              Already have an account?{' '}
              <Link href="/login" className="underline hover:text-primary">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
