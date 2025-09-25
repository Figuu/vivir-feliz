import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters, userRateLimiters, getRateLimitHeaders, RateLimiter } from '@/lib/rate-limiter'
import { createClient } from '@/lib/supabase/server'

interface RateLimitMiddlewareConfig {
  // Which rate limiter to use
  limiter?: RateLimiter
  // Skip rate limiting for certain conditions
  skip?: (request: NextRequest) => boolean
  // Custom response for rate limit exceeded
  onLimitExceeded?: (request: NextRequest, retryAfter: number) => NextResponse
}

/**
 * Apply rate limiting middleware to a request
 */
export async function applyRateLimitMiddleware(
  request: NextRequest,
  config: RateLimitMiddlewareConfig = {}
): Promise<NextResponse | null> {
  try {
    // Skip rate limiting if configured
    if (config.skip && config.skip(request)) {
      return null
    }

    // Determine which rate limiter to use
    let limiter = config.limiter
    let userId: string | undefined

    if (!limiter) {
      // Auto-select rate limiter based on request path and authentication
      limiter = await selectRateLimiter(request)
      
      // Try to get user ID for user-specific rate limiting
      try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        userId = user?.id
      } catch {
        // Ignore auth errors for rate limiting
      }
    }

    // Apply rate limiting
    const result = await limiter.checkRateLimit(request, userId)

    // Create headers with rate limit info
    const headers = getRateLimitHeaders(result.info)

    if (!result.success) {
      // Rate limit exceeded
      if (config.onLimitExceeded && result.info.retryAfter) {
        return config.onLimitExceeded(request, result.info.retryAfter)
      }

      return new NextResponse(
        JSON.stringify({
          error: result.message || 'Rate limit exceeded',
          retryAfter: result.info.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        }
      )
    }

    // Create a response that includes rate limit headers
    // This will be merged with the actual response
    return new NextResponse(null, {
      headers,
    })

  } catch (error) {
    console.error('Rate limiting middleware error:', error)
    // Don't block requests if rate limiting fails
    return null
  }
}

/**
 * Auto-select appropriate rate limiter based on request
 */
async function selectRateLimiter(request: NextRequest): Promise<RateLimiter> {
  const pathname = request.nextUrl.pathname
  const method = request.method

  // Authentication endpoints
  if (pathname.includes('/auth/') || pathname.includes('/login') || pathname.includes('/signup')) {
    return rateLimiters.auth
  }

  // Password reset endpoints
  if (pathname.includes('/password-reset') || pathname.includes('/change-password')) {
    return rateLimiters.passwordReset
  }

  // File upload endpoints
  if (pathname.includes('/upload') && method === 'POST') {
    return rateLimiters.fileUpload
  }

  // Admin endpoints
  if (pathname.includes('/admin/')) {
    return rateLimiters.admin
  }

  // Search endpoints
  if (pathname.includes('/search') && method === 'GET') {
    return rateLimiters.search
  }

  // Default API rate limiter
  return rateLimiters.api
}

/**
 * Rate limiting middleware for authentication endpoints
 */
export async function authRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return applyRateLimitMiddleware(request, {
    limiter: rateLimiters.auth,
    onLimitExceeded: (req, retryAfter) => {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many authentication attempts. Please try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    },
  })
}

/**
 * Rate limiting middleware for API endpoints
 */
export async function apiRateLimit(request: NextRequest): Promise<NextResponse | null> {
  // Use user-specific rate limiting for authenticated requests
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      return applyRateLimitMiddleware(request, {
        limiter: userRateLimiters.api,
      })
    }
  } catch {
    // Fall back to IP-based rate limiting
  }

  return applyRateLimitMiddleware(request, {
    limiter: rateLimiters.api,
  })
}

/**
 * Rate limiting middleware for file upload endpoints
 */
export async function fileUploadRateLimit(request: NextRequest): Promise<NextResponse | null> {
  // Use user-specific rate limiting for authenticated requests
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      return applyRateLimitMiddleware(request, {
        limiter: userRateLimiters.fileUpload,
      })
    }
  } catch {
    // Fall back to IP-based rate limiting
  }

  return applyRateLimitMiddleware(request, {
    limiter: rateLimiters.fileUpload,
  })
}

/**
 * Rate limiting middleware for admin endpoints
 */
export async function adminRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return applyRateLimitMiddleware(request, {
    limiter: rateLimiters.admin,
    onLimitExceeded: (req, retryAfter) => {
      return new NextResponse(
        JSON.stringify({
          error: 'Admin action rate limit exceeded. Please try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    },
  })
}

/**
 * Rate limiting middleware for search endpoints
 */
export async function searchRateLimit(request: NextRequest): Promise<NextResponse | null> {
  return applyRateLimitMiddleware(request, {
    limiter: rateLimiters.search,
  })
}

/**
 * Utility function to merge rate limit headers with response
 */
export function addRateLimitHeaders(response: NextResponse, headers: Record<string, string>): NextResponse {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

/**
 * Custom rate limiting for specific endpoints
 */
export function createCustomRateLimit(config: {
  windowMs: number
  maxRequests: number
  message?: string
}) {
  const limiter = new RateLimiter(config)
  
  return async (request: NextRequest): Promise<NextResponse | null> => {
    return applyRateLimitMiddleware(request, { limiter })
  }
}

// Pre-configured rate limiting functions for common use cases
export const rateLimitMiddleware = {
  auth: authRateLimit,
  api: apiRateLimit,
  fileUpload: fileUploadRateLimit,
  admin: adminRateLimit,
  search: searchRateLimit,
  custom: createCustomRateLimit,
}