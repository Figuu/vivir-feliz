import { LRUCache } from 'lru-cache'
import { auditSecurity } from '@/lib/audit-logger'
import { AuditAction, AuditSeverity } from '@prisma/client'
import { NextRequest } from 'next/server'

export interface RateLimitConfig {
  // Window duration in milliseconds
  windowMs: number
  // Maximum number of requests per window
  maxRequests: number
  // Optional message for rate limit exceeded
  message?: string
  // Skip successful requests when counting
  skipSuccessfulRequests?: boolean
  // Skip failed requests when counting
  skipFailedRequests?: boolean
  // Custom identifier function (defaults to IP address)
  keyGenerator?: (request: NextRequest) => string
  // Custom rate limit handler
  onLimitReached?: (request: NextRequest, identifier: string) => Promise<void>
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

export interface RateLimitResult {
  success: boolean
  info: RateLimitInfo
  message?: string
}

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limit data
// In production, you should use Redis for distributed rate limiting
const rateLimitStore = new LRUCache<string, RateLimitRecord>({
  max: 10000, // Maximum number of keys to store
  ttl: 1000 * 60 * 60, // 1 hour TTL
})

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: this.defaultKeyGenerator,
      ...config,
    }
  }

  /**
   * Default key generator - uses IP address
   */
  public defaultKeyGenerator(request: NextRequest): string {
    // Try various headers to get the real IP
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const cfConnectingIP = request.headers.get('cf-connecting-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    if (realIP) {
      return realIP
    }
    
    if (cfConnectingIP) {
      return cfConnectingIP
    }
    
    return 'unknown'
  }

  /**
   * Check if a request should be rate limited
   */
  async checkRateLimit(request: NextRequest, userId?: string): Promise<RateLimitResult> {
    const identifier = this.config.keyGenerator!(request)
    const key = `rate_limit:${identifier}:${request.nextUrl.pathname}`
    
    const now = Date.now()
    
    // Get current record
    const record = rateLimitStore.get(key)
    
    let count = 0
    let resetTime = now + this.config.windowMs
    
    if (record) {
      if (record.resetTime > now) {
        // Window is still active
        count = record.count
        resetTime = record.resetTime
      }
      // If window has expired, count resets to 0
    }
    
    // Calculate remaining requests
    const remaining = Math.max(0, this.config.maxRequests - count)
    const isLimited = count >= this.config.maxRequests
    
    if (isLimited) {
      // Log rate limit exceeded
      await this.logRateLimitExceeded(request, identifier, userId, count)
      
      // Call custom handler if provided
      if (this.config.onLimitReached) {
        await this.config.onLimitReached(request, identifier)
      }
      
      return {
        success: false,
        info: {
          limit: this.config.maxRequests,
          remaining: 0,
          reset: resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000),
        },
        message: this.config.message,
      }
    }
    
    // Increment counter
    rateLimitStore.set(key, {
      count: count + 1,
      resetTime,
    })
    
    return {
      success: true,
      info: {
        limit: this.config.maxRequests,
        remaining: remaining - 1,
        reset: resetTime,
      },
    }
  }

  /**
   * Log rate limit exceeded event
   */
  private async logRateLimitExceeded(
    request: NextRequest,
    identifier: string,
    userId?: string,
    currentCount?: number
  ) {
    try {
      await auditSecurity({
        action: AuditAction.RATE_LIMIT_EXCEEDED,
        userId,
        severity: AuditSeverity.WARNING,
        request,
        metadata: {
          identifier,
          endpoint: request.nextUrl.pathname,
          method: request.method,
          currentCount,
          limit: this.config.maxRequests,
          windowMs: this.config.windowMs,
        },
      })
    } catch (error) {
      console.error('Failed to log rate limit exceeded event:', error)
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async resetRateLimit(request: NextRequest): Promise<void> {
    const identifier = this.config.keyGenerator!(request)
    const key = `rate_limit:${identifier}:${request.nextUrl.pathname}`
    rateLimitStore.delete(key)
  }

  /**
   * Get current rate limit status for an identifier
   */
  async getRateLimitStatus(request: NextRequest): Promise<RateLimitInfo> {
    const identifier = this.config.keyGenerator!(request)
    const key = `rate_limit:${identifier}:${request.nextUrl.pathname}`
    
    const now = Date.now()
    const record = rateLimitStore.get(key)
    
    if (!record || record.resetTime <= now) {
      return {
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        reset: now + this.config.windowMs,
      }
    }
    
    const remaining = Math.max(0, this.config.maxRequests - record.count)
    
    return {
      limit: this.config.maxRequests,
      remaining,
      reset: record.resetTime,
      retryAfter: remaining === 0 ? Math.ceil((record.resetTime - now) / 1000) : undefined,
    }
  }
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // General API rate limiter - 100 requests per minute
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'API rate limit exceeded. Please try again in a minute.',
  }),

  // Authentication rate limiter - 5 attempts per 15 minutes
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  }),

  // Password reset rate limiter - 3 attempts per hour
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts. Please try again in an hour.',
  }),

  // File upload rate limiter - 20 uploads per 10 minutes
  fileUpload: new RateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 20,
    message: 'File upload rate limit exceeded. Please try again in 10 minutes.',
  }),

  // Admin actions rate limiter - 50 actions per minute
  admin: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50,
    message: 'Admin action rate limit exceeded. Please try again in a minute.',
  }),

  // Search rate limiter - 30 searches per minute
  search: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Search rate limit exceeded. Please try again in a minute.',
  }),
}

// User-based rate limiting (when authenticated)
export class UserRateLimiter extends RateLimiter {
  constructor(config: RateLimitConfig) {
    super({
      ...config,
      keyGenerator: (request: NextRequest) => {
        // Extract user ID from headers if available
        const userId = request.headers.get('x-user-id')
        if (userId) {
          return `user:${userId}`
        }
        // Fall back to IP-based limiting
        return this.defaultKeyGenerator(request)
      },
    })
  }
}

// Create user-specific rate limiters
export const userRateLimiters = {
  // User API rate limiter - 200 requests per minute for authenticated users
  api: new UserRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 200,
    message: 'User API rate limit exceeded. Please try again in a minute.',
  }),

  // User file upload rate limiter - 50 uploads per 10 minutes
  fileUpload: new UserRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 50,
    message: 'User file upload rate limit exceeded. Please try again in 10 minutes.',
  }),
}

/**
 * Utility function to apply rate limiting to any request
 */
export async function applyRateLimit(
  request: NextRequest,
  limiter: RateLimiter,
  userId?: string
): Promise<RateLimitResult> {
  return await limiter.checkRateLimit(request, userId)
}

/**
 * Utility function to get rate limit headers
 */
export function getRateLimitHeaders(info: RateLimitInfo): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': info.limit.toString(),
    'X-RateLimit-Remaining': info.remaining.toString(),
    'X-RateLimit-Reset': info.reset.toString(),
  }

  if (info.retryAfter) {
    headers['Retry-After'] = info.retryAfter.toString()
  }

  return headers
}