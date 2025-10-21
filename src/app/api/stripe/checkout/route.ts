
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// Assume a 5% platform fee for now
const PLATFORM_FEE_PERCENT = 0.05;

export async function POST(request: Request) {
  try {
    const { listing, vendorStripeAccountId, vendorId, listingId } = await request.json();

    if (!listing || !vendorStripeAccountId || !vendorId || !listingId) {
      return NextResponse.json({ error: 'Missing required checkout information.' }, { status: 400 });
    }

    const priceInCents = Math.round(listing.price * 100);
    const applicationFeeAmount = Math.round(priceInCents * PLATFORM_FEE_PERCENT);

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
        }
      },
    });

    if (!session.url) {
        throw new Error('Failed to create a Stripe session URL.');
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
