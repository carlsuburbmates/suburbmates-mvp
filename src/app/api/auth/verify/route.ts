import { getAdminServices } from '@/lib/firebase-admin-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { auth } = await getAdminServices()
  const { sessionCookie } = await request.json()

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Session cookie not provided' }, { status: 400 })
  }

  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true)
    return NextResponse.json(decodedToken)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid session cookie' }, { status: 401 })
  }
}
