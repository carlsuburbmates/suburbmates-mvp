
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

export async function POST(request: Request) {
  try {
    const { returnUrl, refreshUrl, userId } = await request.json();

    if (!returnUrl || !refreshUrl || !userId) {
      return NextResponse.json({ error: 'Missing returnUrl, refreshUrl, or userId' }, { status: 400 });
    }

    const account = await stripe.accounts.create({
      type: 'standard',
      metadata: {
        firebase_uid: userId,
      },
    });

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    
    return NextResponse.json({ url: accountLink.url });

  } catch (error: any) {
    console.error('Stripe API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
