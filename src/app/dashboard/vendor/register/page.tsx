'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { CheckCircle2, Phone, Link2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { doc } from 'firebase/firestore'

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
import { PageHeader } from '@/components/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth, useFirestore, useUser } from '@/firebase'
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates'
import { validateAbn } from '@/ai/flows/validate-abn'
import {
  verifyVendorQuality,
  type VerificationSummary,
} from '@/ai/flows/verify-vendor-quality'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  category: z.string().min(1, 'Please select a business category.'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters.')
    .max(280, 'Description cannot exceed 280 characters.'),
  address: z.string().min(5, 'Please enter a valid business address.'),
  phone: z.string().optional(),
  website: z
    .string()
    .url('Please enter a valid URL.')
    .optional()
    .or(z.literal('')),
  termsConsent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to the Terms of Service to continue.',
  }),
  refundPolicyConsent: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge the Refund & Dispute Policy to continue.',
  }),
})

export default function VendorRegistrationPage() {
  const [step, setStep] = useState(1)
  const { toast } = useToast()
  const router = useRouter()
  const firestore = useFirestore()
  const { user, isUserLoading } = useUser()

  const [isSubmitting, setIsSubmitting] = useState(false)

  // If user is not logged in, redirect them away.
  useEffect(() => {
    if (!isUserLoading && !user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please sign in first to register your business.',
      })
      router.replace('/')
    }
  }, [user, isUserLoading, router, toast])

  const form = useForm<z.infer<typeof vendorRegistrationSchema>>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      businessName: '',
      abn: '',
      category: '',
      description: '',
      address: '',
      phone: '',
      website: '',
      termsConsent: false,
      refundPolicyConsent: false,
    },
  })

  async function handleVendorRegistration(
    values: z.infer<typeof vendorRegistrationSchema>
  ) {
    setIsSubmitting(true)

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to register.',
      })
      setIsSubmitting(false)
      return
    }

    try {
      // Step 1: Validate ABN
      toast({
        title: 'Step 1 of 3: Validating ABN...',
        description: 'Please wait.',
      })
      const validationResult = await validateAbn({
        abn: values.abn,
        businessName: values.businessName,
      })
      if (!validationResult.isValid) {
        toast({
          variant: 'destructive',
          title: 'ABN Validation Failed',
          description: validationResult.message,
        })
        setIsSubmitting(false)
        return
      }
      toast({ title: 'ABN Validated!', description: validationResult.message })

      // Step 2: Run Quality & Safety AI Agent
      toast({
        title: 'Step 2 of 3: Analyzing profile quality...',
        description: 'Our AI is reviewing your details.',
      })
      let verificationSummary: VerificationSummary
      try {
        verificationSummary = await verifyVendorQuality({
          businessName: values.businessName,
          description: values.description,
          category: values.category,
        })
      } catch (aiError) {
        console.error('VOQ Agent Error:', aiError)
        toast({
          variant: 'destructive',
          title: 'AI Analysis Failed',
          description:
            'Could not analyze profile. Defaulting to manual review.',
        })
        // Fallback gracefully: create a summary that ensures manual review.
        verificationSummary = {
          overallRecommendation: 'NEEDS_REVIEW',
          recommendationReason:
            'AI agent failed to process. Manual review required.',
          safetyAnalysis: {
            rating: 'NEEDS_REVIEW',
            reason: 'AI agent failed.',
            piiDetected: false,
          },
          descriptionQuality: {
            score: 0,
            confidence: 0,
            reason: 'AI agent failed.',
          },
          categoryVerification: {
            isMatch: false,
            confidence: 0,
            suggestion: '',
            reason: 'AI agent failed.',
          },
          promptVersion: 'fallback',
        }
      }

      // Step 3: Create Vendor Document in Firestore
      toast({
        title: 'Step 3 of 3: Creating business profile...',
        description: 'Finalizing your registration.',
      })
      const vendorRef = doc(firestore, 'vendors', user.uid)
      const consentTimestamp = new Date().toISOString()

      const vendorData = {
        id: user.uid,
        email: user.email,
        businessName: values.businessName,
        abn: values.abn,
        abnVerified: true,
        category: values.category,
        description: values.description,
        address: values.address,
        phone: values.phone || '',
        website: values.website || '',
        paymentsEnabled: false,
        consents: [
          {
            agreementId: 'vendor_tos',
            version: '1.0',
            timestamp: consentTimestamp,
          },
          {
            agreementId: 'refund_policy',
            version: '1.0',
            timestamp: consentTimestamp,
          },
        ],
        verificationSummary, // Add the AI agent's summary
      }

      setDocumentNonBlocking(vendorRef, vendorData, { merge: true })

      toast({
        title: 'Business Account Created!',
        description:
          'Your business details have been saved and are pending admin review.',
      })

      // Redirect to dashboard to continue to Stripe onboarding
      router.push('/dashboard/vendor')
    } catch (error: any) {
      console.error('Onboarding Error:', error)
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'Could not save business details. Please try again.',
      })
      setIsSubmitting(false)
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
              This information will be displayed publicly on your business
              profile page after verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleVendorRegistration)}
                className="space-y-8"
              >
                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">Public Business Details</h3>
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
                          We validate your ABN to ensure all vendors are
                          legitimate businesses. This will earn you a "Verified"
                          badge.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category for your business" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gardening">Gardening</SelectItem>
                            <SelectItem value="cafe">Cafe</SelectItem>
                            <SelectItem value="plumbing">Plumbing</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="bakery">Bakery</SelectItem>
                            <SelectItem value="services">
                              Professional Services
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This helps customers find you in the directory.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Business Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell everyone what makes your business special..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief summary of your business (max 280 characters).
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
                          <Input
                            placeholder="e.g., 123 High St, Northcote VIC 3070"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Your business must be located in the Darebin council
                          area.
                        </FormDescription>
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
                </div>

                <div className="space-y-4 p-4 border rounded-lg">
                  <h3 className="font-medium">Agreements</h3>
                  <FormField
                    control={form.control}
                    name="termsConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Agree to Terms of Service</FormLabel>
                          <FormDescription>
                            I agree to the{' '}
                            <Link
                              href="/terms"
                              className="underline hover:text-primary"
                              target="_blank"
                            >
                              Terms of Service
                            </Link>
                            .
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="refundPolicyConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Acknowledge Refund Policy</FormLabel>
                          <FormDescription>
                            I have read and agree to adhere to the platform's{' '}
                            <Link
                              href="/policy"
                              className="underline hover:text-primary"
                              target="_blank"
                            >
                              Refund &amp; Dispute Policy
                            </Link>
                            .
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? 'Processing...' : 'Create Business Profile'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
