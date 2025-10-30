import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminServices } from '@/lib/firebase-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})
export async function POST(request: Request) {
  const { auth } = await getAdminServices()
  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const idToken = authorization.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(idToken)
    const userId = decodedToken.uid

    const { returnUrl, refreshUrl } = await request.json()

    if (!returnUrl || !refreshUrl) {
      return NextResponse.json(
        { error: 'Missing returnUrl or refreshUrl' },
        { status: 400 }
      )
    }

    const account = await stripe.accounts.create({
      type: 'standard',
      metadata: {
        firebase_uid: userId,
      },
    })

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Stripe API Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
