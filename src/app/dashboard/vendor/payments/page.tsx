'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ExternalLink } from 'lucide-react'
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase'
import { doc } from 'firebase/firestore'
import type { Vendor } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'

export default function VendorPaymentsPage() {
  const { user } = useUser()
  const firestore = useFirestore()

  const vendorRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'vendors', user.uid) : null),
    [firestore, user]
  )
  const { data: vendor, isLoading: isVendorLoading } = useDoc<Vendor>(vendorRef)

  const isStripeConnected = vendor?.stripeAccountId && vendor?.paymentsEnabled

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Manage Payments</CardTitle>
        <CardDescription>
          Review your payment status and manage your Stripe account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isVendorLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : isStripeConnected ? (
          <div className="flex items-center p-4 rounded-lg bg-secondary/50 border border-secondary">
            <CheckCircle className="h-6 w-6 text-green-600 mr-4" />
            <div>
              <h3 className="font-semibold">Stripe Account Connected</h3>
              <p className="text-sm text-muted-foreground">
                Your account is ready to receive payments from marketplace
                sales.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center p-4 rounded-lg bg-destructive/10 border border-destructive/50 text-destructive">
            <AlertCircle className="h-6 w-6 mr-4" />
            <div>
              <h3 className="font-semibold text-destructive-foreground">
                Stripe Account Not Ready
              </h3>
              <p className="text-sm">
                Your account is either not connected or pending approval. Please
                complete onboarding or wait for an admin to enable payments.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h4 className="font-semibold">Payouts Dashboard</h4>
          <p className="text-sm text-muted-foreground">
            Payouts are managed by Stripe and are typically transferred to your
            bank account on a rolling basis. For detailed reports, transaction
            history, and to manage your bank details, please visit your Stripe
            dashboard.
          </p>
          <Button asChild variant="outline" disabled={!isStripeConnected}>
            <a
              href="https://dashboard.stripe.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Go to Stripe Dashboard
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
