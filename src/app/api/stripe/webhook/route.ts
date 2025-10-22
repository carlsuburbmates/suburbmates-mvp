
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore, doc, updateDoc, collection, addDoc, query, where, getDocs, writeBatch } from 'firebase-admin/firestore';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';

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
const auth = getAuth(app);

// Idempotency check
const processedEvents = new Set();

// Placeholder for sending emails
async function sendTransactionalEmail(template: string, data: any) {
    console.log(`[EMAIL] Sending '${template}' email with data:`, data);
    // In a real app, you would integrate with a service like Resend here.
}


export async function POST(request: Request) {
  const sig = headers().get('stripe-signature');
  const body = await request.text();

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
        console.error('Stripe webhook signature or secret is missing. Cannot verify event.');
        return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Idempotency: Check if we've already processed this event
  if (processedEvents.has(event.id)) {
      console.log(`[IDEMPOTENCY] Already processed event: ${event.id}`);
      return NextResponse.json({ received: true, message: 'Event already processed.' });
  }
  processedEvents.add(event.id);


  // Handle the event
  switch (event.type) {
    case 'account.updated':
      const account = event.data.object as Stripe.Account;
      const firebaseUid = account.metadata?.firebase_uid;

      if (firebaseUid) {
        console.log(`Stripe account ${account.id} for Firebase user ${firebaseUid} was updated.`);
        try {
          const vendorRef = doc(db, 'vendors', firebaseUid);
          await updateDoc(vendorRef, {
            stripeAccountId: account.id,
            // Payouts are disabled/enabled by the admin, but we can track account health.
            paymentsEnabled: account.charges_enabled && account.details_submitted,
          });
          console.log(`Successfully updated vendor ${firebaseUid} with Stripe account ID and status.`);
           if (!account.charges_enabled) {
              await sendTransactionalEmail('vendor_action_required', { vendorId: firebaseUid, message: 'Your Stripe account needs attention. Payouts may be disabled.'});
           }
        } catch (error) {
            console.error(`Failed to update vendor document for user ${firebaseUid}:`, error);
        }
      }
      break;

    case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;
        const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

        if (session.payment_status === 'paid' && metadata?.vendorId && metadata.customerId && paymentIntentId) {
            console.log('Checkout session completed, creating order...');
            try {
                const customer = await auth.getUser(metadata.customerId);
                const ordersCollectionRef = collection(db, `vendors/${metadata.vendorId}/orders`);
                
                const orderData = {
                    listingName: metadata.listingName,
                    buyerId: metadata.customerId,
                    vendorId: metadata.vendorId,
                    customerName: customer.displayName || customer.email || 'N/A', // Add customer name
                    date: new Date().toISOString(),
                    amount: (session.amount_total || 0) / 100,
                    status: 'Completed' as const,
                    paymentIntentId: paymentIntentId,
                };
                
                await addDoc(ordersCollectionRef, orderData);

                console.log(`Successfully created order for vendor ${metadata.vendorId}`);

                // Emit Notifications (Transactional Email)
                await sendTransactionalEmail('order_confirmation_buyer', {
                    buyerId: metadata.customerId,
                    listingName: metadata.listingName,
                });
                await sendTransactionalEmail('new_order_vendor', {
                     vendorId: metadata.vendorId,
                     listingName: metadata.listingName,
                     amount: orderData.amount,
                     customerName: orderData.customerName,
                });

            } catch (error) {
                console.error('Failed to create order in Firestore:', error);
                 return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
            }
        }
        break;
    
    case 'payment_intent.canceled':
        const paymentIntentCanceled = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment intent canceled: ${paymentIntentCanceled.id}`);
        // Find the order and update its status
        await updateOrderStatusByPaymentIntent(paymentIntentCanceled.id, 'FAILED_PAYMENT');
        // You could also notify the buyer here.
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
            const orderUpdated = await updateOrderStatusByPaymentIntent(chargePaymentIntentId, 'Refunded');
            
            if (orderUpdated) {
                const refundReqQuery = query(collection(db, `vendors/${orderUpdated.vendorId}/refund_requests`), where('orderId', '==', orderUpdated.id));
                const refundReqSnapshot = await getDocs(refundReqQuery);
                if (!refundReqSnapshot.empty) {
                    const refundReqDoc = refundReqSnapshot.docs[0];
                    await updateDoc(refundReqDoc.ref, {
                        state: 'RESOLVED',
                        stripeRefundId: charge.refunds.data[0]?.id
                    });
                    console.log(`Updated refund request ${refundReqDoc.id} to RESOLVED.`);

                    // Notify buyer
                    await sendTransactionalEmail('refund_processed_buyer', {
                        buyerId: orderUpdated.buyerId,
                        orderId: orderUpdated.id
                    });
                }
            } else {
                 console.warn(`Could not find an order with paymentIntentId: ${chargePaymentIntentId} to mark as refunded.`);
            }

        } catch (error) {
            console.error(`Failed to process refund for payment intent ${chargePaymentIntentId}:`, error);
            return NextResponse.json({ error: 'Failed to update order for refund.' }, { status: 500 });
        }
        break;
    
    case 'payout.failed':
        const payoutFailed = event.data.object as Stripe.Payout;
        const failedAccountId = payoutFailed.destination as string; // Assuming it's an account ID
        console.error(`Payout failed for Stripe account: ${failedAccountId}`);
        // Find vendor by stripeAccountId and notify them
        // This is a critical event requiring immediate vendor notification.
        break;

    default:
      console.log(`[INFO] Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

/**
 * Helper function to find and update an order's status based on its paymentIntentId.
 * This is used for both refunds and cancellations.
 */
async function updateOrderStatusByPaymentIntent(paymentIntentId: string, status: 'Refunded' | 'FAILED_PAYMENT'): Promise<any | null> {
    const q = query(collection(db, 'vendors'));
    const vendorsSnapshot = await getDocs(q);

    for (const vendorDoc of vendorsSnapshot.docs) {
        const ordersRef = collection(db, `vendors/${vendorDoc.id}/orders`);
        const orderQuery = query(ordersRef, where('paymentIntentId', '==', paymentIntentId));
        const orderSnapshot = await getDocs(orderQuery);

        if (!orderSnapshot.empty) {
            const orderDoc = orderSnapshot.docs[0];
            await updateDoc(orderDoc.ref, { status });
            console.log(`Found order ${orderDoc.id} for vendor ${vendorDoc.id}. Marked as ${status}.`);
            return { ...orderDoc.data(), id: orderDoc.id }; // Return the updated order data
        }
    }
    return null; // Return null if no order was found
}
