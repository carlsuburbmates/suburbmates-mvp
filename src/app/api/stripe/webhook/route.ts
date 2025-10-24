
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore, doc, updateDoc, collection, addDoc, query, where, getDocs, getDoc } from 'firebase-admin/firestore';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import { sendOrderConfirmationEmail, sendNewOrderNotification, sendStripeActionRequiredEmail, sendDisputeCreatedVendorNotification, sendDisputeCreatedBuyerNotification, sendDisputeClosedNotification } from '@/lib/email';
import type { Order, Vendor, Dispute } from '@/lib/types';
import serviceAccount from '@/../service-account.json';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

let app: App;
if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount)
    });
} else {
    app = getApps()[0];
}

const db = getFirestore(app);
const auth = getAuth(app);

// Idempotency check
const processedEvents = new Set();

async function logWebhookEvent(event: Stripe.Event, status: 'received' | 'processed' | 'failed', error?: string) {
    const logRef = collection(db, 'logs/webhooks/events');
    const existingLogQuery = query(logRef, where('eventId', '==', event.id));
    const snapshot = await getDocs(existingLogQuery);
    
    if (snapshot.empty) {
        await addDoc(logRef, {
            timestamp: new Date(event.created * 1000).toISOString(),
            type: 'webhook',
            source: 'stripe',
            eventId: event.id,
            status,
            payload: event,
            error: error || null,
        });
    } else {
        await updateDoc(snapshot.docs[0].ref, {
             status,
             error: error || null,
        });
    }
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
    await logWebhookEvent(event, 'received');

  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    if (err.type === 'StripeSignatureVerificationError' && err.raw) {
       // Log the failed event for auditing without marking it as processed
       await logWebhookEvent(err.raw, 'failed', err.message);
    }
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Idempotency: Check if we've already processed this event
  if (processedEvents.has(event.id)) {
      console.log(`[IDEMPOTENCY] Already processed event: ${event.id}`);
      return NextResponse.json({ received: true, message: 'Event already processed.' });
  }
  
  try {
      // Handle the event
      switch (event.type) {
        case 'account.updated':
          const account = event.data.object as Stripe.Account;
          const firebaseUid = account.metadata?.firebase_uid;

          if (firebaseUid) {
            console.log(`Stripe account ${account.id} for Firebase user ${firebaseUid} was updated.`);
            const vendorRef = doc(db, 'vendors', firebaseUid);
            await updateDoc(vendorRef, {
              stripeAccountId: account.id,
            });
            console.log(`Successfully updated vendor ${firebaseUid} with Stripe account ID.`);
            if (!account.charges_enabled) {
                const vendorSnap = await getDoc(vendorRef);
                if (vendorSnap.exists()) {
                  await sendStripeActionRequiredEmail(vendorSnap.data() as Vendor, 'Your Stripe account needs attention. Payouts may be disabled.');
                }
            }
          }
          break;

        case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            const metadata = session.metadata;
            const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

            if (session.payment_status === 'paid' && metadata?.vendorId && metadata.customerId && paymentIntentId) {
                console.log('Checkout session completed, creating order...');
                
                const customer = await auth.getUser(metadata.customerId);
                const vendorRef = doc(db, 'vendors', metadata.vendorId);
                const vendorSnap = await getDoc(vendorRef);

                if (!vendorSnap.exists()) {
                  throw new Error(`Vendor ${metadata.vendorId} not found.`);
                }
                const vendor = vendorSnap.data() as Vendor;

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

                await sendOrderConfirmationEmail(orderData as any, vendor, customer.email!);
                await sendNewOrderNotification(orderData as any, vendor);
            }
            break;
        
        case 'payment_intent.canceled':
            const paymentIntentCanceled = event.data.object as Stripe.PaymentIntent;
            console.log(`Payment intent canceled: ${paymentIntentCanceled.id}`);
            await updateOrderStatusByPaymentIntent(paymentIntentCanceled.id, 'FAILED_PAYMENT');
            break;

        case 'charge.refunded':
            const charge = event.data.object as Stripe.Charge;
            const chargePaymentIntentId = charge.payment_intent;

            if (typeof chargePaymentIntentId !== 'string') {
                console.log('Charge refunded but no payment_intent ID found.');
                break;
            }
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
                }
            } else {
                 console.warn(`Could not find an order with paymentIntentId: ${chargePaymentIntentId} to mark as refunded.`);
            }
            break;
        
        case 'charge.dispute.created':
            const disputeCreated = event.data.object as Stripe.Dispute;
            console.log(`Dispute created: ${disputeCreated.id}`);
            
            const orderForDispute = await findOrderAndVendorByPaymentIntent(disputeCreated.payment_intent as string);
            if (orderForDispute) {
                const { order, vendor, customer } = orderForDispute;
                const disputeData: Dispute = {
                    id: '', // Firestore will generate
                    stripeDisputeId: disputeCreated.id,
                    paymentIntentId: disputeCreated.payment_intent as string,
                    orderId: order.id,
                    vendorId: vendor.id,
                    buyerId: order.buyerId,
                    amount: disputeCreated.amount,
                    currency: disputeCreated.currency,
                    reason: disputeCreated.reason,
                    status: disputeCreated.status,
                    createdAt: new Date(disputeCreated.created * 1000).toISOString(),
                    evidenceDueBy: new Date(disputeCreated.evidence_details.due_by * 1000).toISOString(),
                };
                
                await addDoc(collection(db, 'disputes'), disputeData);
                await updateDoc(doc(db, `vendors/${vendor.id}/orders`, order.id), { status: 'DISPUTED' });

                await sendDisputeCreatedVendorNotification(vendor, order, disputeData);
                if (customer?.email) {
                    await sendDisputeCreatedBuyerNotification(customer.email, order, disputeData);
                }
            }
            break;

        case 'charge.dispute.closed':
            const disputeClosed = event.data.object as Stripe.Dispute;
            console.log(`Dispute closed: ${disputeClosed.id}`);
            const disputeQuery = query(collection(db, 'disputes'), where('stripeDisputeId', '==', disputeClosed.id));
            const disputeSnapshot = await getDocs(disputeQuery);

            if (!disputeSnapshot.empty) {
                const disputeDoc = disputeSnapshot.docs[0];
                await updateDoc(disputeDoc.ref, { status: disputeClosed.status });

                const dispute = disputeDoc.data() as Dispute;
                const { order, vendor, customer } = await findOrderAndVendorByPaymentIntent(dispute.paymentIntentId);
                
                if (disputeClosed.status === 'lost') {
                    await updateDoc(doc(db, `vendors/${vendor.id}/orders`, order.id), { status: 'Refunded' });
                } else {
                     await updateDoc(doc(db, `vendors/${vendor.id}/orders`, order.id), { status: 'Completed' });
                }
                if (customer?.email) {
                    await sendDisputeClosedNotification(vendor, customer.email, order, dispute);
                }
            }
            break;
            
        case 'payout.failed':
            const payoutFailed = event.data.object as Stripe.Payout;
            const failedAccountId = payoutFailed.destination as string;
            console.error(`Payout failed for Stripe account: ${failedAccountId}`);
            // Future enhancement: Notify vendor.
            break;

        default:
          console.log(`[INFO] Unhandled event type ${event.type}`);
      }
      
      processedEvents.add(event.id);
      await logWebhookEvent(event, 'processed');

      return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('Webhook handler error:', error);
        await logWebhookEvent(event, 'failed', error.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function findOrderAndVendorByPaymentIntent(paymentIntentId: string): Promise<{ order: Order, vendor: Vendor, customer: any | null }> {
    const q = query(collection(db, 'vendors'));
    const vendorsSnapshot = await getDocs(q);

    for (const vendorDoc of vendorsSnapshot.docs) {
        const ordersRef = collection(db, `vendors/${vendorDoc.id}/orders`);
        const orderQuery = query(ordersRef, where('paymentIntentId', '==', paymentIntentId));
        const orderSnapshot = await getDocs(orderQuery);

        if (!orderSnapshot.empty) {
            const orderDoc = orderSnapshot.docs[0];
            const order = { id: orderDoc.id, ...orderDoc.data() } as Order;
            const vendor = { id: vendorDoc.id, ...vendorDoc.data() } as Vendor;
            
            let customer = null;
            try {
                customer = await auth.getUser(order.buyerId);
            } catch (e) {
                console.error("Could not fetch customer for notification", e);
            }
            
            return { order, vendor, customer };
        }
    }
    throw new Error(`No order found for paymentIntentId: ${paymentIntentId}`);
}

async function updateOrderStatusByPaymentIntent(paymentIntentId: string, status: Order['status']): Promise<Order | null> {
    try {
        const { order, vendor } = await findOrderAndVendorByPaymentIntent(paymentIntentId);
        await updateDoc(doc(db, `vendors/${vendor.id}/orders`, order.id), { status });
        console.log(`Found order ${order.id} for vendor ${vendor.id}. Marked as ${status}.`);
        return { ...order, status };
    } catch (error) {
        console.warn(`Could not find an order with paymentIntentId: ${paymentIntentId} to mark as ${status}.`);
        return null;
    }
}
