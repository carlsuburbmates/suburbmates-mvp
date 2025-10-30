'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Save, Phone, Link2, Trash2, FileText, Mail, Text } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { doc } from 'firebase/firestore'
import React, { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  useFirestore,
  useUser,
  useDoc,
  useMemoFirebase,
  useAuth,
} from '@/firebase'
import {
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase/non-blocking-updates'
import type { Vendor } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { signOut } from 'firebase/auth'

const profileFormSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters.'),
  phone: z.string().optional(),
  website: z
    .string()
    .url('Please enter a valid URL.')
    .optional()
    .or(z.literal('')),
  supportEmail: z
    .string()
    .email('Please enter a valid email.')
    .optional()
    .or(z.literal('')),
  refundPolicyUrl: z
    .string()
    .url('Please enter a valid URL.')
    .optional()
    .or(z.literal('')),
  fulfilmentTerms: z
    .string()
    .max(500, 'Terms cannot exceed 500 characters.')
    .optional(),
})

export default function EditProfilePage() {
  const { toast } = useToast()
  const firestore = useFirestore()
  const { user } = useUser()
  const auth = useAuth()
  const router = useRouter()

  const vendorRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'vendors', user.uid) : null),
    [firestore, user]
  )

  const { data: vendor, isLoading } = useDoc<Vendor>(vendorRef)

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      businessName: '',
      phone: '',
      website: '',
      supportEmail: '',
      refundPolicyUrl: '',
      fulfilmentTerms: '',
    },
  })

  useEffect(() => {
    if (vendor) {
      form.reset({
        businessName: vendor.businessName,
        phone: vendor.phone || '',
        website: vendor.website || '',
        supportEmail: vendor.supportEmail || '',
        refundPolicyUrl: vendor.refundPolicyUrl || '',
        fulfilmentTerms: vendor.fulfilmentTerms || '',
      })
    }
  }, [vendor, form])

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user || !vendorRef) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to update your profile.',
      })
      return
    }

    updateDocumentNonBlocking(vendorRef, values)

    toast({
      title: 'Profile Updated!',
      description: 'Your business details have been saved.',
    })

    router.push('/dashboard/vendor')
  }

  const handleDeleteProfile = async () => {
    if (!user || !vendorRef) {
      toast({ variant: 'destructive', title: 'Error deleting profile.' })
      return
    }

    deleteDocumentNonBlocking(vendorRef)

    // Also delete user authentication account
    if (auth.currentUser) {
      await auth.currentUser.delete()
    }

    await signOut(auth)

    toast({
      title: 'Profile Deleted',
      description:
        'Your vendor profile and account have been permanently removed.',
    })

    router.push('/')
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Edit Business Profile"
          description="Update your public-facing information."
        />
        <div className="container mx-auto px-4 pb-16 flex justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-8">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!vendor) {
    return (
      <>
        <PageHeader
          title="Profile Not Found"
          description="We couldn't find your profile."
        />
        <div className="container mx-auto px-4 pb-16 text-center">
          <Button onClick={() => router.push('/dashboard/vendor')}>
            Return to Dashboard
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Edit Business Profile"
        description="Update your public-facing information."
      />
      <div className="container mx-auto px-4 pb-16 flex justify-center">
        <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">
              Editing Profile
            </CardTitle>
            <CardDescription>
              Make your changes below and click save. This information is
              visible on your public vendor page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
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
                            <Input
                              placeholder="0412 345 678"
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
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="https://your-business.com.au"
                              {...field}
                              className="pl-8"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="supportEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="support@your-business.com.au"
                              {...field}
                              className="pl-8"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Your customer support email address for refunds and
                          inquiries.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="refundPolicyUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refund Policy URL (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="https://your-business.com.au/refunds"
                              {...field}
                              className="pl-8"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          A public link to your business's refund policy.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fulfilmentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local Delivery Terms</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Free delivery within 5km of Northcote. $10 delivery for up to 10km. Contact for other areas."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Clearly explain your local delivery radius, costs, and
                        timing if you offer it.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between items-center">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button type="submit" className="w-full sm:w-auto">
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => router.push('/dashboard/vendor')}
                    >
                      Cancel
                    </Button>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Profile
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Are you absolutely sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete your vendor profile, all of your listings, and
                          your account from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProfile}>
                          Yes, delete my profile
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
