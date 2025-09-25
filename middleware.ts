import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { securityHeadersMiddleware, developmentCSPConfig, productionCSPConfig } from './src/middleware/security-headers'
import { applyRateLimitMiddleware } from './src/middleware/rate-limit'

export async function middleware(request: NextRequest) {
  // Apply security headers first
  const cspConfig = process.env.NODE_ENV === 'production' ? productionCSPConfig : developmentCSPConfig
  let response = await securityHeadersMiddleware(request, cspConfig)
  
  // Apply rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResult = await applyRateLimitMiddleware(request)
    if (rateLimitResult && rateLimitResult.status === 429) {
      return rateLimitResult
    }
    // Merge rate limit headers with security headers
    if (rateLimitResult && rateLimitResult.headers) {
      rateLimitResult.headers.forEach((value, key) => {
        response.headers.set(key, value)
      })
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, skip auth checks
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured. Skipping authentication.')
    // Copy security headers to the response
    response.headers.forEach((value, key) => {
      supabaseResponse.headers.set(key, value)
    })
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    const redirectResponse = NextResponse.redirect(redirectUrl)
    // Copy security headers to redirect response
    response.headers.forEach((value, key) => {
      redirectResponse.headers.set(key, value)
    })
    return redirectResponse
  }

  // Auth routes redirect if already logged in
  if (user && ['/login', '/signup'].includes(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    const redirectResponse = NextResponse.redirect(redirectUrl)
    // Copy security headers to redirect response
    response.headers.forEach((value, key) => {
      redirectResponse.headers.set(key, value)
    })
    return redirectResponse
  }

  // Copy security headers to the final response
  response.headers.forEach((value, key) => {
    supabaseResponse.headers.set(key, value)
  })

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}