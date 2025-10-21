
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore, doc, addDoc, collection, serverTimestamp } from 'firebase-admin/firestore';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';

// This is a placeholder for the real implementation.
// In a real application, you would initialize Stripe with your secret key.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// The webhook secret is necessary to verify that the request is coming from Stripe.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';


// Initialize Firebase Admin SDK
// This requires a service account key file. In a real production environment,
// you would use Application Default Credentials.
let app: App;
if (!getApps().length) {
    // In a real app, you'd protect this service account key.
    // For this example, we'll assume it's set as an environment variable.
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    app = initializeApp({
        credential: cert(serviceAccount)
    });
} else {
    app = getApps()[0];
}

const db = getFirestore(app);


export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  let event: Stripe.Event;

  try {
    // In a real application, you must verify the signature to ensure the request is from Stripe.
    // For this placeholder, we will skip verification but it's critical in production.
    if (!sig || !webhookSecret) {
        console.warn('Stripe webhook signature or secret is missing. Skipping verification (NOT SAFE FOR PRODUCTION).');
        event = JSON.parse(body) as Stripe.Event;
    } else {
       event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    }

  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'account.updated':
      const account = event.data.object as Stripe.Account;
      // This is where you would handle the account update.
      // For example, check if charges_enabled is true, then update your database.
      if (account.charges_enabled) {
        console.log('Stripe account ready:', account.id);
        // In a real app, you would:
        // 1. Find the vendor in your Firestore database associated with this Stripe account
        //    (e.g., using metadata you passed when creating the account link).
        // 2. Update the vendor's document to save the `stripeAccountId` (account.id)
        //    and set their status to `active`.
        //
        // Example Firestore update (pseudo-code):
        // const vendorRef = doc(firestore, 'vendors', associatedVendorId);
        // await updateDoc(vendorRef, {
        //   stripeAccountId: account.id,
        //   paymentsEnabled: true,
        // });
      }
      break;

    case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (session.payment_status === 'paid' && metadata?.vendorId && metadata?.listingName) {
            console.log('Checkout session completed, creating order...');
            try {
                const ordersCollectionRef = collection(db, `vendors/${metadata.vendorId}/orders`);
                const newOrder = {
                    listingName: metadata.listingName,
                    customerName: 'Local Shopper', // Placeholder
                    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
                    amount: (session.amount_total || 0) / 100, // Convert cents to dollars
                    status: 'Completed' as const,
                };
                await addDoc(ordersCollectionRef, newOrder);
                console.log(`Successfully created order for vendor ${metadata.vendorId}`);
            } catch (error) {
                console.error('Failed to create order in Firestore:', error);
                 return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
            }
        }
        break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
