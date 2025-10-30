import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminServices } from '@/lib/firebase-admin'

// Dev-only endpoint to grant the current signed-in user admin access.
// Requires FIREBASE_SERVICE_ACCOUNT_KEY to be configured.
export async function POST(req: Request) {
  try {
    const { auth } = await getAdminServices()

    // Prefer verifying the Firebase session cookie
    const cookieStore = await cookies()
    const sessionCookie = cookieStore?.get?.('__session')?.value || null

    let decoded: unknown | null = null

    if (sessionCookie) {
      try {
        decoded = await auth.verifySessionCookie(sessionCookie, true)
      } catch (err) {
        // Fall through to Authorization header verification
      }
    }

    if (!decoded) {
      const authorization =
        req.headers.get('authorization') || req.headers.get('Authorization')
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Not authenticated' },
          { status: 401 }
        )
      }
      const idToken = authorization.slice('Bearer '.length)
      decoded = await auth.verifyIdToken(idToken)
    }

    const token = decoded as { uid?: string; email?: string }
    const uid = token?.uid
    if (!uid) {
      return NextResponse.json(
        { error: 'Unable to determine user' },
        { status: 400 }
      )
    }

    // Production guard: require secret token and allowed email for bootstrap
    if (process.env.NODE_ENV === 'production') {
      const expectedToken = process.env.ADMIN_BOOTSTRAP_TOKEN
      const allowedEmail = process.env.ADMIN_BOOTSTRAP_EMAIL

      if (!expectedToken || !allowedEmail) {
        return NextResponse.json(
          { error: 'Bootstrap env not configured' },
          { status: 403 }
        )
      }

      const providedToken = req.headers.get('x-admin-bootstrap-token')
      const userEmail = token?.email as string | undefined

      if (!providedToken || providedToken !== expectedToken) {
        return NextResponse.json(
          { error: 'Invalid bootstrap token' },
          { status: 403 }
        )
      }
      if (
        !userEmail ||
        userEmail.toLowerCase() !== allowedEmail.toLowerCase()
      ) {
        return NextResponse.json(
          { error: 'Email not allowed for bootstrap' },
          { status: 403 }
        )
      }
    }

    await auth.setCustomUserClaims(uid, { admin: true })

    return NextResponse.json({ status: 'ok', uid, admin: true })
  } catch (err: unknown) {
    const error = err as Error
    const message = error?.message || 'Failed to grant admin'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
