import { config } from 'dotenv';
import Stripe from 'stripe';
import { Resend } from 'resend';

// Load environment variables from .env file
config();

const stripeKey = process.env.STRIPE_SECRET_KEY;
const resendKey = process.env.RESEND_API_KEY;

let hasError = false;

async function verifyStripe() {
  console.log('--- Verifying Stripe ---');
  if (!stripeKey) {
    console.error('❌ STRIPE_SECRET_KEY is not set in your .env file.');
    hasError = true;
    return;
  }
  if (!stripeKey.startsWith('sk_')) {
     console.error('❌ Invalid Stripe secret key format. It should start with "sk_".');
     hasError = true;
     return;
  }

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
    await stripe.customers.list({ limit: 1 });
    console.log('✅ Stripe secret key is valid and connected.');
  } catch (error) {
    console.error('❌ Stripe API Error:', error.message);
    hasError = true;
  }
}

async function verifyResend() {
  console.log('\n--- Verifying Resend ---');
  if (!resendKey) {
    console.error('❌ RESEND_API_KEY is not set in your .env file.');
    hasError = true;
    return;
  }
   if (!resendKey.startsWith('re_')) {
     console.error('❌ Invalid Resend API key format. It should start with "re_".');
     hasError = true;
     return;
  }

  try {
    const resend = new Resend(resendKey);
    await resend.domains.list();
    console.log('✅ Resend API key is valid and connected.');
  } catch (error) {
    console.error('❌ Resend API Error:', error.message);
    hasError = true;
  }
}

async function main() {
  console.log('Running API key verification...\n');
  await verifyStripe();
  await verifyResend();

  if (hasError) {
    console.log('\nVerification failed. Please check the errors above and your .env file.');
    process.exit(1);
  } else {
    console.log('\n🎉 All keys verified successfully! You are ready to proceed.');
    process.exit(0);
  }
}

main();
