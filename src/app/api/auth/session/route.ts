import { NextResponse } from 'next/server'
import { getAdminServices } from '@/lib/firebase-admin'

// Issues a Firebase Auth session cookie from an ID token provided via Authorization header
export async function POST(req: Request) {
  try {
    const { auth } = await getAdminServices()
    const authorization =
      req.headers.get('authorization') || req.headers.get('Authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing Authorization Bearer token' },
        { status: 401 }
      )
    }
    const idToken = authorization.slice('Bearer '.length)
    // Verify ID token first to ensure it is valid
    const decoded = await auth.verifyIdToken(idToken)

    // Create a session cookie with a reasonable expiry (e.g., 5 days)
    const expiresIn = 5 * 24 * 60 * 60 * 1000 // 5 days in ms
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn })

    const isProd = process.env.NODE_ENV === 'production'
    const res = NextResponse.json({ status: 'ok' })
    res.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(expiresIn / 1000),
    })
    return res
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json(
      { error: error?.message || 'Failed to create session' },
      { status: 400 }
    )
  }
}

// Clears the session cookie
export async function DELETE() {
  const res = NextResponse.json({ status: 'ok' })
  res.cookies.set('__session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
