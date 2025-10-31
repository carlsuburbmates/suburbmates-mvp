import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminServices } from '@/lib/firebase-admin'

// Set platform fee to 10% as per requirements
const PLATFORM_FEE_PERCENT = 0.1

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-06-20',
  })
  const { auth } = await getAdminServices()
  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const idToken = authorization.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { listing, vendorStripeAccountId, vendorId, listingId } =
      await request.json()

    if (!listing || !vendorStripeAccountId || !vendorId || !listingId) {
      return NextResponse.json(
        { error: 'Missing required checkout information.' },
        { status: 400 }
      )
    }

    const priceInCents = Math.round(listing.price * 100)
    const applicationFeeAmount = Math.round(priceInCents * PLATFORM_FEE_PERCENT)

    const userRecord = await auth.getUser(userId)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: listing.listingName,
              description: listing.description,
              // In a real app, you'd have images here
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/vendors/${vendorId}?checkout=success`,
      cancel_url: `${request.headers.get('origin')}/vendors/${vendorId}?checkout=cancel`,
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: vendorStripeAccountId,
        },
        metadata: {
          vendorId: vendorId,
          listingId: listingId,
          listingName: listing.listingName,
          customerId: userId,
          customerName: userRecord.displayName ?? userRecord.email ?? null,
        },
      },
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      customer_email: userRecord.email!, // Pre-fill customer email
    })

    if (!session.url) {
      throw new Error('Failed to create a Stripe session URL.')
    }

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Stripe Checkout API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
