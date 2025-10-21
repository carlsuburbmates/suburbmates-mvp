
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore, doc, updateDoc, collection, addDoc } from 'firebase-admin/firestore';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

let app: App;
if (!getApps().length) {
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
      
      if (account.charges_enabled && account.details_submitted) {
        const firebaseUid = account.metadata?.firebase_uid;
        if (firebaseUid) {
          console.log(`Stripe account ${account.id} for Firebase user ${firebaseUid} is now enabled.`);
          try {
            const vendorRef = doc(db, 'vendors', firebaseUid);
            await updateDoc(vendorRef, {
              stripeAccountId: account.id,
              paymentsEnabled: true,
            });
            console.log(`Successfully updated vendor ${firebaseUid} with Stripe account ID.`);
          } catch (error) {
             console.error(`Failed to update vendor document for user ${firebaseUid}:`, error);
          }
        }
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
