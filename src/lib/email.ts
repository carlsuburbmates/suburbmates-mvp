
import { Resend } from 'resend';
import type { Order, Vendor, RefundRequest } from './types';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'onboarding@resend.dev';

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
${vendor.refundPolicyUrl || 'No policy provided.'}

Thank you for supporting a local business!
`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: subject,
      text: text,
    });
    console.log(`[EMAIL] Order confirmation sent to ${customerEmail}`);
  } catch (error) {
    console.error('[EMAIL] Error sending order confirmation:', error);
  }
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
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: vendor.email,
      subject: subject,
      text: text,
    });
     console.log(`[EMAIL] New order notification sent to ${vendor.email}`);
  } catch (error) {
     console.error('[EMAIL] Error sending new order notification:', error);
  }
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
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: vendor.email,
        subject: subject,
        text: text,
      });
       console.log(`[EMAIL] Stripe action required email sent to ${vendor.email}`);
    } catch (error) {
       console.error('[EMAIL] Error sending Stripe action required email:', error);
    }
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

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: customerEmail,
      subject: subject,
      text: text,
    });
    console.log(`[EMAIL] Refund status update sent to ${customerEmail}`);
  } catch (error) {
    console.error('[EMAIL] Error sending refund status update:', error);
  }
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
  try {
    await resend.emails.send({
      from: FROM_EmaiL,
      to: vendor.email,
      subject: subject,
      text: text,
    });
     console.log(`[EMAIL] New refund request notification sent to ${vendor.email}`);
  } catch (error) {
     console.error('[EMAIL] Error sending new refund request notification:', error);
  }
}
