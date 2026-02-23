import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't need Supabase session refresh
const PUBLIC_ROUTES = ['/login', '/pricing', '/register', '/r', '/funnel']

export async function middleware(request: NextRequest) {
  // Skip Supabase session refresh for public routes
  const { pathname } = request.nextUrl
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  try {
    return await updateSession(request)
  } catch {
    // If Supabase middleware fails (e.g. missing env vars), just continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
