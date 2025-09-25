import { NextRequest, NextResponse } from 'next/server'
import { auditSecurity } from '@/lib/audit-logger'
import { AuditAction, AuditSeverity } from '@prisma/client'

export interface SecurityHeadersConfig {
  // Content Security Policy configuration
  csp?: {
    enabled: boolean
    reportOnly?: boolean
    directives?: CSPDirectives
    nonce?: string
    reportUri?: string
  }
  // HSTS configuration
  hsts?: {
    enabled: boolean
    maxAge?: number
    includeSubDomains?: boolean
    preload?: boolean
  }
  // Other security headers
  frameOptions?: 'DENY' | 'SAMEORIGIN' | string
  contentTypeOptions?: boolean
  referrerPolicy?: string
  crossOriginEmbedderPolicy?: string
  crossOriginOpenerPolicy?: string
  crossOriginResourcePolicy?: string
  // Custom headers
  customHeaders?: Record<string, string>
}

export interface CSPDirectives {
  'default-src'?: string[]
  'script-src'?: string[]
  'style-src'?: string[]
  'img-src'?: string[]
  'font-src'?: string[]
  'connect-src'?: string[]
  'media-src'?: string[]
  'object-src'?: string[]
  'child-src'?: string[]
  'frame-src'?: string[]
  'worker-src'?: string[]
  'frame-ancestors'?: string[]
  'form-action'?: string[]
  'upgrade-insecure-requests'?: boolean
  'block-all-mixed-content'?: boolean
  'base-uri'?: string[]
  'manifest-src'?: string[]
}

// Default security configuration
const defaultConfig: SecurityHeadersConfig = {
  csp: {
    enabled: true,
    reportOnly: process.env.NODE_ENV === 'development',
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Next.js requires this for development
        "'unsafe-eval'", // Next.js requires this for development
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Required for CSS-in-JS
        'https://fonts.googleapis.com',
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://*.supabase.co',
        'https://*.githubusercontent.com',
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
      ],
      'connect-src': [
        "'self'",
        'https://*.supabase.co',
        'ws://localhost:*', // For development WebSocket
        'wss://*', // For production WebSocket
      ],
      'media-src': ["'self'", 'https://*.supabase.co'],
      'object-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'upgrade-insecure-requests': process.env.NODE_ENV === 'production',
      'block-all-mixed-content': process.env.NODE_ENV === 'production',
      'base-uri': ["'self'"],
      'manifest-src': ["'self'"],
    },
  },
  hsts: {
    enabled: process.env.NODE_ENV === 'production',
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameOptions: 'DENY',
  contentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  crossOriginEmbedderPolicy: 'credentialless',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
}

/**
 * Generate CSP header value from directives
 */
function generateCSPHeader(directives: CSPDirectives, nonce?: string): string {
  const policies: string[] = []

  Object.entries(directives).forEach(([directive, value]) => {
    if (value === true) {
      policies.push(directive)
    } else if (Array.isArray(value) && value.length > 0) {
      let directiveValue = value.join(' ')
      
      // Add nonce to script-src and style-src if provided
      if (nonce && (directive === 'script-src' || directive === 'style-src')) {
        directiveValue += ` 'nonce-${nonce}'`
      }
      
      policies.push(`${directive} ${directiveValue}`)
    }
  })

  return policies.join('; ')
}

/**
 * Generate a cryptographically secure nonce
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback for environments without crypto.getRandomValues
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = defaultConfig,
  nonce?: string
): NextResponse {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    csp: {
      ...defaultConfig.csp,
      ...config.csp,
      directives: {
        ...defaultConfig.csp?.directives,
        ...config.csp?.directives,
      },
    },
    hsts: {
      ...defaultConfig.hsts,
      ...config.hsts,
    },
  }

  // Content Security Policy
  if (mergedConfig.csp?.enabled && mergedConfig.csp.directives) {
    const cspHeader = generateCSPHeader(mergedConfig.csp.directives, nonce)
    const headerName = mergedConfig.csp.reportOnly 
      ? 'Content-Security-Policy-Report-Only' 
      : 'Content-Security-Policy'
    
    response.headers.set(headerName, cspHeader)
  }

  // HTTP Strict Transport Security
  if (mergedConfig.hsts?.enabled) {
    let hstsValue = `max-age=${mergedConfig.hsts.maxAge || 31536000}`
    if (mergedConfig.hsts.includeSubDomains) {
      hstsValue += '; includeSubDomains'
    }
    if (mergedConfig.hsts.preload) {
      hstsValue += '; preload'
    }
    response.headers.set('Strict-Transport-Security', hstsValue)
  }

  // X-Frame-Options
  if (mergedConfig.frameOptions) {
    response.headers.set('X-Frame-Options', mergedConfig.frameOptions)
  }

  // X-Content-Type-Options
  if (mergedConfig.contentTypeOptions) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }

  // Referrer-Policy
  if (mergedConfig.referrerPolicy) {
    response.headers.set('Referrer-Policy', mergedConfig.referrerPolicy)
  }

  // Cross-Origin-Embedder-Policy
  if (mergedConfig.crossOriginEmbedderPolicy) {
    response.headers.set('Cross-Origin-Embedder-Policy', mergedConfig.crossOriginEmbedderPolicy)
  }

  // Cross-Origin-Opener-Policy
  if (mergedConfig.crossOriginOpenerPolicy) {
    response.headers.set('Cross-Origin-Opener-Policy', mergedConfig.crossOriginOpenerPolicy)
  }

  // Cross-Origin-Resource-Policy
  if (mergedConfig.crossOriginResourcePolicy) {
    response.headers.set('Cross-Origin-Resource-Policy', mergedConfig.crossOriginResourcePolicy)
  }

  // X-DNS-Prefetch-Control
  response.headers.set('X-DNS-Prefetch-Control', 'off')

  // X-Download-Options (IE specific)
  response.headers.set('X-Download-Options', 'noopen')

  // X-Permitted-Cross-Domain-Policies
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  // Custom headers
  if (mergedConfig.customHeaders) {
    Object.entries(mergedConfig.customHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  return response
}

/**
 * Security headers middleware
 */
export async function securityHeadersMiddleware(
  request: NextRequest,
  config?: SecurityHeadersConfig
): Promise<NextResponse> {
  try {
    // Generate nonce for this request
    const nonce = generateNonce()
    
    // Create response with security headers
    const response = NextResponse.next()
    
    // Apply security headers
    applySecurityHeaders(response, config, nonce)
    
    // Add nonce to response headers for use in components
    response.headers.set('X-Nonce', nonce)
    
    return response

  } catch (error) {
    console.error('Security headers middleware error:', error)
    
    // Log security middleware error
    try {
      await auditSecurity({
        action: AuditAction.SECURITY_VIOLATION,
        severity: AuditSeverity.HIGH,
        errorMessage: error instanceof Error ? error.message : 'Security headers middleware error',
        request,
        metadata: {
          middleware: 'security-headers',
          error: error instanceof Error ? error.stack : String(error),
        },
      })
    } catch (auditError) {
      console.error('Failed to log security headers error:', auditError)
    }
    
    // Return response without security headers rather than failing
    return NextResponse.next()
  }
}

/**
 * CSP violation reporting handler
 */
export async function handleCSPViolation(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    
    // Log CSP violation
    await auditSecurity({
      action: AuditAction.SECURITY_VIOLATION,
      severity: AuditSeverity.WARNING,
      errorMessage: 'CSP violation reported',
      request,
      metadata: {
        type: 'csp_violation',
        violation: body,
        userAgent: request.headers.get('user-agent'),
      },
    })
    
    console.warn('CSP Violation:', body)
    
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('CSP violation handler error:', error)
    return new NextResponse('Error', { status: 500 })
  }
}

/**
 * Utility to get CSP nonce from headers
 */
export function getNonceFromHeaders(headers: Headers): string | null {
  return headers.get('X-Nonce')
}

/**
 * Enhanced CSP configuration for development
 */
export const developmentCSPConfig: SecurityHeadersConfig = {
  csp: {
    enabled: true,
    reportOnly: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
        'http://localhost:*',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'http://localhost:*',
      ],
      'connect-src': [
        "'self'",
        'https://*.supabase.co',
        'ws://localhost:*',
        'http://localhost:*',
      ],
    },
  },
  hsts: {
    enabled: false, // Disable HSTS in development
  },
}

/**
 * Production CSP configuration
 */
export const productionCSPConfig: SecurityHeadersConfig = {
  csp: {
    enabled: true,
    reportOnly: false,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Next.js still needs this for some functionality
        'https://cdn.jsdelivr.net',
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://*.supabase.co',
      ],
      'connect-src': [
        "'self'",
        'https://*.supabase.co',
        'wss://*',
      ],
      'upgrade-insecure-requests': true,
      'block-all-mixed-content': true,
    },
  },
  hsts: {
    enabled: true,
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}

export default securityHeadersMiddleware