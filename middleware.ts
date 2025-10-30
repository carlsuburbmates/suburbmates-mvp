import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory rate limiting for development
// TODO: Replace with Redis-based rate limiting for production
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 10 * 60 * 1000 // 10 minutes
const RATE_LIMIT_MAX = 100 // requests per window

export async function middleware(request: NextRequest) {
  // Simple rate limiting for API routes (development only)
  if (
    request.nextUrl.pathname.startsWith('/api/') &&
    !request.nextUrl.pathname.startsWith('/api/health') &&
    !request.nextUrl.pathname.includes('_next') &&
    !request.nextUrl.pathname.includes('favicon')
  ) {
    // Use a simple identifier (could be improved with proper IP detection)
    const clientId =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'

    const now = Date.now()
    const clientData = rateLimitMap.get(clientId)

    if (!clientData || now > clientData.resetTime) {
      // Reset or initialize rate limit data
      rateLimitMap.set(clientId, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      })
    } else if (clientData.count >= RATE_LIMIT_MAX) {
      return new NextResponse(
        'API rate limit exceeded. Please try again later.',
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (clientData.resetTime - now) / 1000
            ).toString(),
          },
        }
      )
    } else {
      clientData.count++
    }
  }

  // Protect /admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('__session')?.value

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      const response = await fetch(new URL('/api/auth/verify', request.url), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionCookie }),
      })

      if (!response.ok) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      const decodedToken = await response.json()

      if (!decodedToken.admin) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
