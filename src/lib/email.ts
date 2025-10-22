
import { Resend } from 'resend';
import type { Order, Vendor } from './types';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

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
