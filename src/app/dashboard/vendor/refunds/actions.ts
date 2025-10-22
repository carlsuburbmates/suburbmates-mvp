
'use server';

import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { sendRefundStatusUpdateEmail } from '@/lib/email';
import type { Order, RefundRequest, Vendor } from '@/lib/types';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

// Initialize Firebase Admin SDK
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
  );
  initializeApp({
    credential: cert(serviceAccount),
  });
}

const auth = getAuth();
const db = getFirestore();

async function verifyVendor(vendorId: string): Promise<void> {
  const authorization = headers().get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }
  const idToken = authorization.split('Bearer ')[1];
  const decodedToken = await auth.verifyIdToken(idToken);

  if (decodedToken.uid !== vendorId) {
    throw new Error('Caller is not the authorized vendor for this action.');
  }
}

async function getOrder(vendorId: string, orderId: string): Promise<Order> {
    const orderRef = doc(db, `vendors/${vendorId}/orders`, orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
        throw new Error("Order not found.");
    }
    return { id: orderSnap.id, ...orderSnap.data() } as Order;
}


export async function approveRefund(requestId: string, vendorId: string, idToken: string) {
    // This is a workaround as headers() is not available in non-route files.
    // Ideally, we'd have a better way to pass auth to server actions.
     const decodedToken = await auth.verifyIdToken(idToken);
    if (decodedToken.uid !== vendorId) {
        return { success: false, error: 'Unauthorized vendor' };
    }

    const requestRef = doc(db, `vendors/${vendorId}/refund_requests`, requestId);

    try {
        const requestSnap = await getDoc(requestRef);
        if (!requestSnap.exists()) throw new Error('Refund request not found.');

        const request = requestSnap.data() as RefundRequest;
        const order = await getOrder(vendorId, request.orderId);

        if (request.state !== 'OPEN') {
            return { success: false, error: 'Request is not open for action.' };
        }

        // 1. Process refund with Stripe
        const refund = await stripe.refunds.create({
            payment_intent: order.paymentIntentId,
        });

        // 2. Update Firestore documents
        const updatedRequestData = {
            state: 'RESOLVED' as const,
            stripeRefundId: refund.id,
            decision: 'Refund approved and processed via Stripe.',
            decisionBy: vendorId,
            decisionAt: new Date().toISOString(),
        }
        await updateDoc(requestRef, updatedRequestData);

        // This will be picked up by the webhook to update order status,
        // but we can also update it here for immediate UI feedback if needed.
        const orderRef = doc(db, `vendors/${vendorId}/orders`, request.orderId);
        await updateDoc(orderRef, { status: 'Refunded' });
        
        // 3. Notify customer
        const buyer = await auth.getUser(request.buyerId);
        const vendorSnap = await getDoc(doc(db, 'vendors', vendorId));
        const vendor = vendorSnap.data() as Vendor;
        if (buyer.email) {
            await sendRefundStatusUpdateEmail(buyer.email, order, { ...request, ...updatedRequestData }, vendor);
        }

        revalidatePath(`/dashboard/vendor/refunds`);
        return { success: true };

    } catch (error: any) {
        console.error('Error approving refund:', error);
        return { success: false, error: error.message };
    }
}


export async function rejectRefund(requestId: string, vendorId: string, reason: string, idToken: string) {
     const decodedToken = await auth.verifyIdToken(idToken);
    if (decodedToken.uid !== vendorId) {
        return { success: false, error: 'Unauthorized vendor' };
    }
    const requestRef = doc(db, `vendors/${vendorId}/refund_requests`, requestId);

     try {
        const requestSnap = await getDoc(requestRef);
        if (!requestSnap.exists()) throw new Error('Refund request not found.');

        const request = requestSnap.data() as RefundRequest;
        if (request.state !== 'OPEN') {
            return { success: false, error: 'Request is not open for action.' };
        }

        // 1. Update Firestore
        const updatedRequestData = {
            state: 'REJECTED' as const,
            decision: reason,
            decisionBy: vendorId,
            decisionAt: new Date().toISOString(),
        }
        await updateDoc(requestRef, updatedRequestData);
        
        // 2. Notify customer
        const order = await getOrder(vendorId, request.orderId);
        const buyer = await auth.getUser(request.buyerId);
        const vendorSnap = await getDoc(doc(db, 'vendors', vendorId));
        const vendor = vendorSnap.data() as Vendor;
        if (buyer.email) {
             await sendRefundStatusUpdateEmail(buyer.email, order, { ...request, ...updatedRequestData }, vendor);
        }


        revalidatePath(`/dashboard/vendor/refunds`);
        return { success: true };
     } catch (error: any) {
        console.error('Error rejecting refund:', error);
        return { success: false, error: error.message };
    }
}
