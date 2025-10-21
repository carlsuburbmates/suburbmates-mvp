
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore, doc, updateDoc, collection, addDoc, query, where, getDocs, writeBatch } from 'firebase-admin/firestore';
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
        console.error('Stripe webhook signature or secret is missing. Cannot verify event.');
        return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'account.updated':
      const account = event.data.object as Stripe.Account;
      const firebaseUid = account.metadata?.firebase_uid;

      if (firebaseUid) {
        console.log(`Stripe account ${account.id} for Firebase user ${firebaseUid} was updated.`);
        // This is where an admin approval flow would begin.
        // We save the Stripe Account ID, but we DO NOT automatically enable payments.
        // An admin must manually set `paymentsEnabled` to true in the vendor document.
        try {
          const vendorRef = doc(db, 'vendors', firebaseUid);
          await updateDoc(vendorRef, {
            stripeAccountId: account.id,
            // REMOVED: paymentsEnabled is now handled by an admin approval process.
          });
          console.log(`Successfully updated vendor ${firebaseUid} with Stripe account ID. Awaiting admin approval.`);
        } catch (error) {
            console.error(`Failed to update vendor document for user ${firebaseUid}:`, error);
        }
      }
      break;

    case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;
        const paymentIntent = session.payment_intent;

        if (session.payment_status === 'paid' && metadata?.vendorId && metadata?.listingName && paymentIntent) {
            console.log('Checkout session completed, creating order...');
            try {
                const ordersCollectionRef = collection(db, `vendors/${metadata.vendorId}/orders`);
                const newOrder = {
                    listingName: metadata.listingName,
                    customerName: 'Local Shopper', // Placeholder
                    customerId: metadata.customerId,
                    date: new Date().toISOString(),
                    amount: (session.amount_total || 0) / 100, // Convert cents to dollars
                    status: 'Completed' as const,
                    paymentIntentId: typeof paymentIntent === 'string' ? paymentIntent : paymentIntent.id,
                };
                await addDoc(ordersCollectionRef, newOrder);
                console.log(`Successfully created order for vendor ${metadata.vendorId}`);
            } catch (error) {
                console.error('Failed to create order in Firestore:', error);
                 return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
            }
        }
        break;

    case 'charge.refunded':
        const charge = event.data.object as Stripe.Charge;
        const chargePaymentIntentId = charge.payment_intent;

        if (typeof chargePaymentIntentId !== 'string') {
            console.log('Charge refunded but no payment_intent ID found.');
            break;
        }

        try {
            console.log(`Processing refund for payment intent: ${chargePaymentIntentId}`);
            const q = query(
              collection(db, 'vendors'), 
            );
            const vendorsSnapshot = await getDocs(q);

            const batch = writeBatch(db);
            let orderFound = false;

            for (const vendorDoc of vendorsSnapshot.docs) {
                const ordersRef = collection(db, `vendors/${vendorDoc.id}/orders`);
                const orderQuery = query(ordersRef, where('paymentIntentId', '==', chargePaymentIntentId));
                const orderSnapshot = await getDocs(orderQuery);

                if (!orderSnapshot.empty) {
                    orderSnapshot.forEach(orderDoc => {
                        console.log(`Found order ${orderDoc.id} for vendor ${vendorDoc.id}. Marking as Refunded.`);
                        batch.update(orderDoc.ref, { status: 'Refunded' });
                        orderFound = true;
                    });
                    // Break the outer loop once we found the order(s)
                    if(orderFound) break; 
                }
            }
            
            if (orderFound) {
                await batch.commit();
                console.log(`Successfully updated order status to Refunded.`);
            } else {
                console.warn(`Could not find an order with paymentIntentId: ${chargePaymentIntentId}`);
            }

        } catch (error) {
            console.error(`Failed to process refund for payment intent ${chargePaymentIntentId}:`, error);
            return NextResponse.json({ error: 'Failed to update order for refund.' }, { status: 500 });
        }
        break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

    