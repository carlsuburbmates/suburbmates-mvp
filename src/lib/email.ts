
import { Resend } from 'resend';
import type { Order, Vendor, RefundRequest, Dispute } from './types';
import { getFirestore, collection, addDoc } from 'firebase-admin/firestore';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'onboarding@resend.dev';
const db = getFirestore();

async function logEmail(subject: string, to: string, status: 'sent' | 'failed', error?: string) {
    const logRef = collection(db, 'logs/emails/sends');
    await addDoc(logRef, {
        timestamp: new Date().toISOString(),
        type: 'email',
        source: 'resend',
        eventId: `send-to-${to}-${Date.now()}`,
        status,
        payload: { to, subject },
        error: error || null,
    });
}

async function sendEmail(to: string, subject: string, text: string) {
    try {
        await resend.emails.send({ from: FROM_EMAIL, to, subject, text });
        await logEmail(subject, to, 'sent');
        console.log(`[EMAIL] Sent: "${subject}" to ${to}`);
    } catch (error: any) {
        await logEmail(subject, to, 'failed', error.message);
        console.error(`[EMAIL] Error sending "${subject}" to ${to}:`, error);
    }
}


export async function sendOrderConfirmationEmail(order: Order, vendor: Vendor, customerEmail: string) {
  const subject = `Your order for ${order.listingName} is confirmed!`;
  const text = `Hi ${order.customerName},

Thank you for your purchase from ${vendor.businessName}!

Order Details:
- Item: ${order.listingName}
- Price: $${order.amount.toFixed(2)}
- Vendor: ${vendor.businessName}

Next Steps:
Please coordinate with the vendor to arrange pickup or delivery.
You can contact them directly at: ${vendor.supportEmail || vendor.email}

This purchase is subject to the vendor's refund policy, which you can view here:
${vendor.refundPolicyUrl || 'No policy provided. View general policy: /policy'}

Thank you for supporting a local business!
`;
  await sendEmail(customerEmail, subject, text);
}

export async function sendNewOrderNotification(order: Order, vendor: Vendor) {
  const subject = `New Order Received: ${order.listingName}`;
  const text = `Hi ${vendor.businessName},

You have a new order!

Order Details:
- Item: ${order.listingName}
- Price: $${order.amount.toFixed(2)}
- Customer: ${order.customerName}
- Customer ID: ${order.buyerId}

Please contact the customer to arrange fulfillment.

Regards,
The Darebin Business Directory Team
`;
  await sendEmail(vendor.email, subject, text);
}


export async function sendStripeActionRequiredEmail(vendor: Vendor, message: string) {
    const subject = `Action Required for Your Stripe Account`;
    const text = `Hi ${vendor.businessName},
  
  An update regarding your Stripe account requires your attention.
  
  Details: ${message}
  
  Please log in to your Stripe dashboard to resolve this issue and ensure your payouts are not interrupted.
  
  Regards,
  The Darebin Business Directory Team
  `;
    await sendEmail(vendor.email, subject, text);
  }
  
export async function sendRefundStatusUpdateEmail(customerEmail: string, order: Order, request: RefundRequest, vendor: Vendor) {
  const isApproved = request.state === 'RESOLVED';
  const subject = `Update on your refund request for "${order.listingName}"`;
  const text = `Hi,

We're writing to inform you about an update on your refund request for the order of "${order.listingName}" from ${vendor.businessName}.

Status: ${isApproved ? 'Approved & Processed' : 'Rejected'}

Vendor's Decision: ${request.decision || (isApproved ? 'The vendor has approved your refund request. The funds should appear in your account within 5-10 business days.' : 'The vendor has rejected your refund request.')}

If you have further questions, please contact the vendor directly at ${vendor.supportEmail || vendor.email}.

Regards,
The Darebin Business Directory Team
`;

  await sendEmail(customerEmail, subject, text);
}

export async function sendNewRefundRequestNotification(vendor: Vendor, order: Order, request: RefundRequest) {
  const subject = `New Refund Request for Order: ${order.listingName}`;
  const text = `Hi ${vendor.businessName},

You have received a new refund request for an order. Please review it in your vendor dashboard.

Order: ${order.listingName}
Reason: ${request.reason}

You can approve or reject this request from the "Refunds" section of your dashboard.

Regards,
The Darebin Business Directory Team
`;
  await sendEmail(vendor.email, subject, text);
}

export async function sendDisputeCreatedVendorNotification(vendor: Vendor, order: Order, dispute: Dispute) {
    const subject = `Action Required: Dispute Opened for Order of ${order.listingName}`;
    const text = `Hi ${vendor.businessName},

A customer has opened a dispute for order #${order.id} (${order.listingName}).

Dispute Details:
- Reason: ${dispute.reason}
- Amount: $${(dispute.amount / 100).toFixed(2)} ${dispute.currency.toUpperCase()}
- Evidence Due By: ${new Date(dispute.evidenceDueBy).toLocaleDateString()}

ACTION REQUIRED: You must submit evidence by the due date to challenge this dispute. Please log in to your Stripe Dashboard immediately to respond.

Failing to respond will result in a loss of the dispute, and the funds will be returned to the customer.

Regards,
The Darebin Business Directory Team
`;
    await sendEmail(vendor.email, subject, text);
}

export async function sendDisputeCreatedBuyerNotification(customerEmail: string, order: Order, dispute: Dispute) {
    const subject = `Your Dispute for Order of ${order.listingName} has been recorded`;
    const text = `Hi,

This email confirms that we have received the dispute you filed for your order of ${order.listingName}.

The vendor has been notified and will provide evidence to Stripe. You will be notified via email by Stripe about the outcome of the dispute.

Dispute Details:
- Reason: ${dispute.reason}
- Amount: $${(dispute.amount / 100).toFixed(2)} ${dispute.currency.toUpperCase()}

No further action is required from you at this time.

Regards,
The Darebin Business Directory Team
`;
    await sendEmail(customerEmail, subject, text);
}

export async function sendDisputeClosedNotification(vendor: Vendor, customerEmail: string, order: Order, dispute: Dispute) {
    const subject = `Dispute Closed for Order of ${order.listingName}`;
    const text = `The dispute regarding order #${order.id} (${order.listingName}) has been closed.

The final status is: ${dispute.status}.

Please check your Stripe dashboard or bank statements for details on the outcome.

Regards,
The Darebin Business Directory Team
`;
    // Notify both vendor and buyer
    await sendEmail(vendor.email, subject, text);
    if (customerEmail) {
        await sendEmail(customerEmail, subject, text);
    }
}

    