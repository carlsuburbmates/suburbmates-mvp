'use server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminServices } from '@/lib/firebase-admin'
import { headers } from 'next/headers'
import {
  sendOrderConfirmationEmail,
  sendNewOrderNotification,
  sendStripeActionRequiredEmail,
  sendDisputeCreatedVendorNotification,
  sendDisputeCreatedBuyerNotification,
  sendDisputeClosedNotification,
} from '@/lib/email'
import type { Order, Vendor, Dispute, DisputeSummary } from '@/lib/types'
import { summarizeDispute } from '@/ai/flows/summarize-dispute'
import type { UserRecord } from 'firebase-admin/auth'
import type { Auth } from 'firebase-admin/auth'
import type { Firestore } from 'firebase-admin/firestore'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

// Idempotency check
const processedEvents = new Set()

async function logWebhookEvent(
  db: Firestore,
  event: Stripe.Event,
  status: 'received' | 'processed' | 'failed',
  error?: string
) {
  const logRef = db.collection('logs/webhooks/events')
  const existingLogQuery = logRef.where('eventId', '==', event.id)
  const snapshot = await existingLogQuery.get()

  if (snapshot.empty) {
    await logRef.add({
      timestamp: new Date(event.created * 1000).toISOString(),
      type: 'webhook',
      source: 'stripe',
      eventId: event.id,
      status,
      payload: event,
      error: error || null,
    })
  } else {
    await snapshot.docs[0].ref.update({
      status,
      error: error || null,
    })
  }
}

export async function POST(request: Request) {
  const { db, auth } = await getAdminServices()
  const sig = (await headers()).get('stripe-signature')
  const body = await request.text()

  let event: Stripe.Event

  try {
    if (!sig || !webhookSecret) {
      console.error(
        'Stripe webhook signature or secret is missing. Cannot verify event.'
      )
      return NextResponse.json(
        { error: 'Webhook secret not configured.' },
        { status: 400 }
      )
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    await logWebhookEvent(db, event, 'received')
  } catch (err: unknown) {
    const error = err as Error & {
      type?: string
      raw?: Stripe.Event
      message: string
    }
    console.error(`Webhook signature verification failed: ${error.message}`)
    if (error.type === 'StripeSignatureVerificationError' && error.raw) {
      // Log the failed event for auditing without marking it as processed
      await logWebhookEvent(db, error.raw, 'failed', error.message)
    }
    return NextResponse.json(
      { error: `Webhook Error: ${error.message}` },
      { status: 400 }
    )
  }

  // Idempotency: Check if we've already processed this event
  if (processedEvents.has(event.id)) {
    console.warn(`[IDEMPOTENCY] Already processed event: ${event.id}`)
    return NextResponse.json({
      received: true,
      message: 'Event already processed.',
    })
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'account.updated':
        const account = event.data.object as Stripe.Account
        const firebaseUid = account.metadata?.firebase_uid

        if (firebaseUid) {
          console.warn(
            `Stripe account ${account.id} for Firebase user ${firebaseUid} was updated.`
          )
          const vendorRef = db.collection('vendors').doc(firebaseUid)
          await vendorRef.update({
            stripeAccountId: account.id,
          })
          console.warn(
            `Successfully updated vendor ${firebaseUid} with Stripe account ID.`
          )
          if (!account.charges_enabled) {
            const vendorSnap = await vendorRef.get()
            if (vendorSnap.exists) {
              await sendStripeActionRequiredEmail(
                vendorSnap.data() as Vendor,
                'Your Stripe account needs attention. Payouts may be disabled.'
              )
            }
          }
        }
        break

      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata
        const paymentIntentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id

        if (
          session.payment_status === 'paid' &&
          metadata?.vendorId &&
          metadata.customerId &&
          paymentIntentId
        ) {
          console.warn('Checkout session completed, creating order...')

          const customer = await auth.getUser(metadata.customerId)
          const vendorRef = db.collection('vendors').doc(metadata.vendorId)
          const vendorSnap = await vendorRef.get()

          if (!vendorSnap.exists) {
            throw new Error(`Vendor ${metadata.vendorId} not found.`)
          }
          const vendor = vendorSnap.data() as Vendor

          const ordersCollectionRef = db.collection(
            `vendors/${metadata.vendorId}/orders`
          )

          const orderData = {
            listingName: metadata.listingName,
            buyerId: metadata.customerId,
            vendorId: metadata.vendorId,
            customerName: customer.displayName || customer.email || 'N/A', // Add customer name
            date: new Date().toISOString(),
            amount: (session.amount_total || 0) / 100,
            status: 'Completed' as const,
            paymentIntentId: paymentIntentId,
          }

          await ordersCollectionRef.add(orderData)

          console.warn(
            `Successfully created order for vendor ${metadata.vendorId}`
          )

          await sendOrderConfirmationEmail(
            orderData as Order,
            vendor,
            customer.email!
          )
          await sendNewOrderNotification(orderData as Order, vendor)
        }
        break

      case 'payment_intent.canceled':
        const paymentIntentCanceled = event.data.object as Stripe.PaymentIntent
        console.warn(`Payment intent canceled: ${paymentIntentCanceled.id}`)
        await updateOrderStatusByPaymentIntent(
          db,
          auth,
          paymentIntentCanceled.id,
          'FAILED_PAYMENT'
        )
        break

      case 'charge.refunded':
        const charge = event.data.object as Stripe.Charge
        const chargePaymentIntentId = charge.payment_intent

        if (typeof chargePaymentIntentId !== 'string') {
          console.warn('Charge refunded but no payment_intent ID found.')
          break
        }
        console.warn(
          `Processing refund for payment intent: ${chargePaymentIntentId}`
        )
        const orderUpdated = await updateOrderStatusByPaymentIntent(
          db,
          auth,
          chargePaymentIntentId,
          'Refunded'
        )

        if (orderUpdated) {
          const refundReqQuery = db
            .collection(`vendors/${orderUpdated.vendorId}/refund_requests`)
            .where('orderId', '==', orderUpdated.id)
          const refundReqSnapshot = await refundReqQuery.get()
          if (!refundReqSnapshot.empty) {
            const refundReqDoc = refundReqSnapshot.docs[0]
            await refundReqDoc.ref.update({
              state: 'RESOLVED',
              stripeRefundId: charge.refunds?.data?.[0]?.id,
            })
            console.warn(
              `Updated refund request ${refundReqDoc.id} to RESOLVED.`
            )
          }
        } else {
          console.warn(
            `Could not find an order with paymentIntentId: ${chargePaymentIntentId} to mark as refunded.`
          )
        }
        break

      case 'charge.dispute.created':
        const disputeCreated = event.data.object as Stripe.Dispute
        console.warn(`Dispute created: ${disputeCreated.id}`)

        const orderForDispute = await findOrderAndVendorByPaymentIntent(
          db,
          auth,
          disputeCreated.payment_intent as string
        )
        if (orderForDispute) {
          const { order, vendor, customer } = orderForDispute

          // Call AI Agent to summarize the dispute
          let disputeSummary: DisputeSummary | undefined
          try {
            disputeSummary = await summarizeDispute({
              disputeReason: disputeCreated.reason,
              productName: order.listingName,
              amount: order.amount,
            })
          } catch (aiError) {
            console.error('Dispute Summarizer Agent failed:', aiError)
            // Continue without AI summary if it fails
          }

          const dueBy = disputeCreated.evidence_details?.due_by
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
            evidenceDueBy: dueBy ? new Date(dueBy * 1000).toISOString() : '',
            disputeSummary, // Add the AI summary here
          }

          await db.collection('disputes').add(disputeData)
          await db
            .collection(`vendors/${vendor.id}/orders`)
            .doc(order.id)
            .update({ status: 'DISPUTED' })

          await sendDisputeCreatedVendorNotification(vendor, order, disputeData)
          if (customer?.email) {
            await sendDisputeCreatedBuyerNotification(
              customer.email,
              order,
              disputeData
            )
          }
        }
        break

      case 'charge.dispute.closed':
        const disputeClosed = event.data.object as Stripe.Dispute
        console.warn(`Dispute closed: ${disputeClosed.id}`)
        const disputeQuery = db
          .collection('disputes')
          .where('stripeDisputeId', '==', disputeClosed.id)
        const disputeSnapshot = await disputeQuery.get()

        if (!disputeSnapshot.empty) {
          const disputeDoc = disputeSnapshot.docs[0]
          await disputeDoc.ref.update({ status: disputeClosed.status })

          const dispute = disputeDoc.data() as Dispute
          const { order, vendor, customer } =
            await findOrderAndVendorByPaymentIntent(
              db,
              auth,
              dispute.paymentIntentId
            )

          if (disputeClosed.status === 'lost') {
            await db
              .collection(`vendors/${vendor.id}/orders`)
              .doc(order.id)
              .update({ status: 'Refunded' })
          } else {
            await db
              .collection(`vendors/${vendor.id}/orders`)
              .doc(order.id)
              .update({ status: 'Completed' })
          }
          if (customer?.email) {
            await sendDisputeClosedNotification(
              vendor,
              customer.email,
              order,
              dispute
            )
          }
        }
        break

      case 'payout.failed':
        const payoutFailed = event.data.object as Stripe.Payout
        const failedAccountId = payoutFailed.destination as string
        console.error(`Payout failed for Stripe account: ${failedAccountId}`)
        // Future enhancement: Notify vendor.
        break

      default:
        console.warn(`[INFO] Unhandled event type ${event.type}`)
    }

    processedEvents.add(event.id)
    await logWebhookEvent(db, event, 'processed')

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Webhook handler error:', err)
    await logWebhookEvent(db, event, 'failed', err.message)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

async function findOrderAndVendorByPaymentIntent(
  db: Firestore,
  auth: Auth,
  paymentIntentId: string
): Promise<{ order: Order; vendor: Vendor; customer: UserRecord | null }> {
  const vendorsSnapshot = await db.collection('vendors').get()

  for (const vendorDoc of vendorsSnapshot.docs) {
    const orderSnapshot = await db
      .collection(`vendors/${vendorDoc.id}/orders`)
      .where('paymentIntentId', '==', paymentIntentId)
      .get()

    if (!orderSnapshot.empty) {
      const orderDoc = orderSnapshot.docs[0]
      const order = { id: orderDoc.id, ...orderDoc.data() } as Order
      const vendor = { id: vendorDoc.id, ...vendorDoc.data() } as Vendor

      let customer = null
      try {
        customer = await auth.getUser(order.buyerId)
      } catch (e) {
        console.error('Could not fetch customer for notification', e)
      }

      return { order, vendor, customer }
    }
  }
  throw new Error(`No order found for paymentIntentId: ${paymentIntentId}`)
}

async function updateOrderStatusByPaymentIntent(
  db: Firestore,
  auth: Auth,
  paymentIntentId: string,
  status: Order['status']
): Promise<Order | null> {
  try {
    const { order, vendor } =
      await findOrderAndVendorByPaymentIntent(db, auth, paymentIntentId)
    await db
      .collection(`vendors/${vendor.id}/orders`)
      .doc(order.id)
      .update({ status })
    console.warn(
      `Found order ${order.id} for vendor ${vendor.id}. Marked as ${status}.`
    )
    return { ...order, status }
  } catch (error) {
    console.warn(
      `Could not find an order with paymentIntentId: ${paymentIntentId} to mark as ${status}.`
    )
    return null
  }
}
