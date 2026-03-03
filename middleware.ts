import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/pricing', '/register', '/r', '/funnel', '/book', '/admin', '/member', '/leader']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Edge Security Headers (Shield up!)
  const response = NextResponse.next()

  // Security & Speed headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

  // 2. EDGE CACHING FOR ASSETS (Speed Lightning)
  // If the request is for public videos or images, tell Vercel Edge to cache them longer
  if (pathname.includes('/videos/') || pathname.includes('/images/')) {
    response.headers.set('Cache-Control', 'public, s-maxage=31536000, stale-while-revalidate=59')
    return response
  }

  // Skip session check for public routes but keep headers
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return response
  }

  try {
    const supabaseResponse = await updateSession(request)
    // Merge headers
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
