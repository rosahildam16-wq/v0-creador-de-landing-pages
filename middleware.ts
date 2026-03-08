import { updateSession } from '@/lib/supabase/middleware'
import { jwtVerify } from 'jose'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that do not require any session check
const PUBLIC_ROUTES = ['/login', '/pricing', '/register', '/r', '/funnel', '/book', '/member', '/leader']

// Roles considered admin-level (must match admin_roles table CHECK constraint)
const ADMIN_ROLES = new Set(['super_admin', 'admin', 'finance_admin', 'support_admin', 'compliance_admin'])

/**
 * Reads and verifies the mf_session JWT at the edge.
 * Does NOT import from lib/auth/session (uses next/headers — not edge-compatible).
 */
async function getSessionRole(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get('mf_session')?.value
    if (!token) return null
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'magicfunnel_fallback_secret'
    )
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
    const user = payload.user as { role?: string } | undefined
    return user?.role ?? null
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Edge Security Headers
  const response = NextResponse.next()
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

  // 2. Edge caching for static assets
  if (pathname.includes('/videos/') || pathname.includes('/images/')) {
    response.headers.set('Cache-Control', 'public, s-maxage=31536000, stale-while-revalidate=59')
    return response
  }

  // 3. Admin route guard — server-side, JWT-based
  if (pathname.startsWith('/admin')) {
    const role = await getSessionRole(request)
    if (!role || !ADMIN_ROLES.has(role)) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // 4. Skip session check for other public routes
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return response
  }

  // 5. Supabase session refresh for protected non-admin routes
  try {
    const supabaseResponse = await updateSession(request)
    response.headers.forEach((value, key) => {
      supabaseResponse.headers.set(key, value)
    })
    return supabaseResponse
  } catch {
    return response
  }
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
}
