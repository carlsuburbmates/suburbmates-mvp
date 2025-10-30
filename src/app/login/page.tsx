'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Mail, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'
import { Separator } from '@/components/ui/separator'

const loginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export default function LoginPage() {
  const { toast } = useToast()
  const router = useRouter()
  const auth = useAuth()
  const { user, isUserLoading } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const useEmulators =
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost' &&
    process.env.NEXT_PUBLIC_USE_EMULATORS === 'true'

  const googleProvider = useMemo(() => new GoogleAuthProvider(), [])
  const facebookProvider = useMemo(() => new FacebookAuthProvider(), [])

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard/vendor')
    }
  }, [user, isUserLoading, router])

  const form = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const handleEmailLogin = async (values: z.infer<typeof loginFormSchema>) => {
    setIsSubmitting(true)
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password)
      // Explicitly establish secure server-side session cookie
      try {
        const idToken = await auth.currentUser?.getIdToken()
        if (idToken) {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { Authorization: `Bearer ${idToken}` },
          })
        }
      } catch (e) {
        // Non-blocking: UI proceeds even if session cookie setup fails
        console.warn(
          'Failed to establish server session cookie after email login',
          e
        )
      }
      toast({ title: 'Login Successful', description: 'Welcome back!' })
      router.push('/dashboard/vendor')
    } catch (error: any) {
      console.error('Email login error:', error)
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
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
      if (useEmulators) {
        throw Object.assign(
          new Error('Social login not supported in emulator mode'),
          { code: 'auth/emulator-unsupported' }
        )
      }
      await signInWithPopup(auth, provider)
      // Explicitly establish secure server-side session cookie
      try {
        const idToken = await auth.currentUser?.getIdToken()
        if (idToken) {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { Authorization: `Bearer ${idToken}` },
          })
        }
      } catch (e) {
        // Non-blocking: UI proceeds even if session cookie setup fails
        console.warn(
          'Failed to establish server session cookie after social login',
          e
        )
      }
      toast({ title: 'Login Successful', description: 'Welcome back!' })
      router.push('/dashboard/vendor')
    } catch (error: any) {
      console.error('Social login error:', error)
      const shouldFallbackToRedirect =
        error?.code === 'auth/popup-blocked' ||
        error?.code === 'auth/internal-error' ||
        error?.code === 'auth/popup-closed-by-user'

      if (shouldFallbackToRedirect && !useEmulators) {
        try {
          await signInWithRedirect(auth, provider)
          return
        } catch (redirectErr) {
          console.error('Social login redirect fallback error:', redirectErr)
        }
      }

      const description =
        error?.code === 'auth/emulator-unsupported'
          ? 'Social providers are not supported when Firebase emulators are enabled. Set NEXT_PUBLIC_USE_EMULATORS=false and restart.'
          : error?.code === 'auth/account-exists-with-different-credential'
            ? 'An account already exists with this email address. Please sign in with the original method.'
            : `Could not log you in. ${error?.message || 'Please try again.'}`

      toast({ variant: 'destructive', title: 'Login Failed', description })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = () => handleSocialLogin(googleProvider)
  const handleFacebookLogin = () => handleSocialLogin(facebookProvider)

  if (isUserLoading || user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Sign In"
          description="Access your dashboard and engage with the community."
        />
        <div className="flex justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Sign In"
        description="Access your dashboard and engage with the community."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Welcome Back
            </CardTitle>
            <CardDescription>
              Sign in with a social account or with your email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isSubmitting || useEmulators}
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
                {useEmulators
                  ? 'Google sign-in disabled (emulator mode)'
                  : 'Sign in with Google'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleFacebookLogin}
                disabled={isSubmitting || useEmulators}
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
                {useEmulators
                  ? 'Facebook sign-in disabled (emulator mode)'
                  : 'Sign in with Facebook'}
              </Button>
            </div>

            <Separator className="my-6" />

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleEmailLogin)}
                className="space-y-6"
              >
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In with Email
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm">
              Don't have an account?{' '}
              <Link href="/signup" className="underline hover:text-primary">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
