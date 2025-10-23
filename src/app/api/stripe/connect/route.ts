
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import serviceAccount from '@/../service-account.json';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}
const auth = getAuth();


export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const { returnUrl, refreshUrl } = await request.json();

    if (!returnUrl || !refreshUrl) {
      return NextResponse.json({ error: 'Missing returnUrl or refreshUrl' }, { status: 400 });
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
