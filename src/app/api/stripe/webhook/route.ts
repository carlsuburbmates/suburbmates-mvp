
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getFirestore, doc, updateDoc, collection, addDoc, query, where, getDocs, getDoc } from 'firebase-admin/firestore';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { headers } from 'next/headers';
import { sendOrderConfirmationEmail, sendNewOrderNotification, sendStripeActionRequiredEmail, sendDisputeCreatedVendorNotification, sendDisputeCreatedBuyerNotification, sendDisputeClosedNotification } from '@/lib/email';
import type { Vendor, Order, Dispute } from '@/lib/types';


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


async function logWebhook(event: Stripe.Event, status: 'received' | 'processed' | 'failed', error?: string) {
    const logRef = collection(db, 'logs/webhooks/events');
    await addDoc(logRef, {
        timestamp: new Date().toISOString(),
        type: 'webhook',
        source: 'stripe',
        eventId: event.id,
        status,
        payload: event,
        error: error || null,
    });
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
    await logWebhook(event, 'received');

  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    // Log the failure but don't log the event itself as it's unverified
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  try {
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
            console.log(`Successfully updated vendor ${firebaseUid} with Stripe account ID and status.`);
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

                  if (customer.email) {
                    await sendOrderConfirmationEmail(orderData as any, vendor, customer.email);
                  }
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
      
      case 'payout.failed':
          const payoutFailed = event.data.object as Stripe.Payout;
          const failedAccountId = payoutFailed.destination as string;
          console.error(`Payout failed for Stripe account: ${failedAccountId}`);
          break;
      
      case 'charge.dispute.created':
        const disputeCreated = event.data.object as Stripe.Dispute;
        console.log(`Dispute created: ${disputeCreated.id}`);
        await handleDisputeChange(disputeCreated, 'DISPUTED');
        break;

      case 'charge.dispute.closed':
        const disputeClosed = event.data.object as Stripe.Dispute;
        console.log(`Dispute closed: ${disputeClosed.id}`);
        await handleDisputeChange(disputeClosed, 'Completed'); // Revert to completed or another final status
        break;


      default:
        console.log(`[INFO] Unhandled event type ${event.type}`);
    }

    await logWebhook(event, 'processed');

  } catch (error: any) {
    console.error(`Error processing webhook event ${event.id}:`, error);
    await logWebhook(event, 'failed', error.message);
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function updateOrderStatusByPaymentIntent(paymentIntentId: string, status: Order['status']): Promise<any | null> {
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
    return null;
}

async function handleDisputeChange(dispute: Stripe.Dispute, orderStatus: Order['status']) {
    const paymentIntentId = dispute.payment_intent;
    if (typeof paymentIntentId !== 'string') {
        throw new Error('Dispute is missing a payment_intent ID.');
    }

    const order = await updateOrderStatusByPaymentIntent(paymentIntentId, orderStatus);
    if (!order) {
        console.warn(`Received a dispute for paymentIntentId ${paymentIntentId}, but no matching order was found.`);
        return;
    }

    // Mirror dispute data in Firestore
    const disputeRef = doc(db, 'disputes', dispute.id);
    const disputeData: Dispute = {
        stripeDisputeId: dispute.id,
        paymentIntentId: paymentIntentId,
        orderId: order.id,
        vendorId: order.vendorId,
        buyerId: order.buyerId,
        amount: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason,
        status: dispute.status,
        createdAt: new Date(dispute.created * 1000).toISOString(),
        evidenceDueBy: new Date(dispute.evidence_details.due_by * 1000).toISOString(),
    };
    await updateDoc(disputeRef, disputeData, { merge: true });

    // Notify parties
    const vendorSnap = await getDoc(doc(db, 'vendors', order.vendorId));
    const buyer = await auth.getUser(order.buyerId);
    if (!vendorSnap.exists() || !buyer) {
        throw new Error('Could not find vendor or buyer for dispute notification.');
    }
    const vendor = vendorSnap.data() as Vendor;

    if (dispute.status === 'warning_needs_response') {
        await sendDisputeCreatedVendorNotification(vendor, order, disputeData);
        if (buyer.email) {
            await sendDisputeCreatedBuyerNotification(buyer.email, order, disputeData);
        }
    } else {
        await sendDisputeClosedNotification(vendor, buyer.email || '', order, disputeData);
    }
}
