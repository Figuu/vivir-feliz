/**
 * Security Configuration
 * Centralized security settings and utilities
 */

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  // Authentication endpoints - strict limiting
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts'
  },
  
  // Password reset - very strict
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset attempts'
  },
  
  // API endpoints - moderate limiting
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'API rate limit exceeded'
  },
  
  // File uploads - strict limiting
  fileUpload: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
    message: 'Too many file uploads'
  },
  
  // Search endpoints - moderate limiting
  search: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Search rate limit exceeded'
  },
  
  // Admin endpoints - relaxed for admins
  admin: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 200,
    message: 'Admin API rate limit exceeded'
  }
}

// Password Security Requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: false,
  requireLowercase: false,
  requireNumbers: false,
  requireSpecialChars: false,
  preventCommonPasswords: true,
  preventReuse: 5, // Remember last 5 passwords
  expiryDays: 90 // Require change every 90 days (if enabled)
}

// Session Security Configuration
export const SESSION_CONFIG = {
  timeout: 60 * 60 * 1000, // 1 hour
  refreshThreshold: 15 * 60 * 1000, // Refresh when 15 min remaining
  maxConcurrentSessions: 3,
  cookieName: 'sb-auth-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7 // 7 days
  }
}

// Login Security Configuration
export const LOGIN_SECURITY = {
  maxAttempts: 5,
  lockoutDuration: 30 * 60 * 1000, // 30 minutes
  resetAttemptsAfter: 15 * 60 * 1000, // 15 minutes
  requireCaptcha: false,
  requireCaptchaAfterAttempts: 3,
  enableTwoFactor: false
}

// CORS Configuration
export const CORS_CONFIG = {
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    ...(process.env.CORS_ALLOWED_ORIGINS?.split(',') || [])
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Current-Page',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
}

// Security Headers Configuration
export const SECURITY_HEADERS = {
  // Content Security Policy
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    connectSrc: ["'self'", 'https://*.supabase.co'],
    mediaSrc: ["'self'", 'https://*.supabase.co'],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: process.env.NODE_ENV === 'production'
  },
  
  // HTTP Strict Transport Security
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Other security headers
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: []
  }
}

// File Upload Security
export const FILE_UPLOAD_SECURITY = {
  maxFileSize: {
    avatar: 5 * 1024 * 1024, // 5MB
    document: 10 * 1024 * 1024, // 10MB
    report: 20 * 1024 * 1024, // 20MB
    general: 10 * 1024 * 1024 // 10MB
  },
  allowedMimeTypes: {
    images: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ],
    all: [] // Will be populated by combining above
  },
  virusScan: false, // Enable in production with actual AV service
  quarantineSuspicious: true,
  validateFileHeaders: true
}

// Populate combined allowed types
FILE_UPLOAD_SECURITY.allowedMimeTypes.all = [
  ...FILE_UPLOAD_SECURITY.allowedMimeTypes.images,
  ...FILE_UPLOAD_SECURITY.allowedMimeTypes.documents
]

// API Security Configuration
export const API_SECURITY = {
  // Request validation
  maxRequestBodySize: 10 * 1024 * 1024, // 10MB
  maxQueryParamsLength: 2000,
  maxHeaderSize: 16 * 1024, // 16KB
  
  // Input sanitization
  sanitizeInput: true,
  stripHtmlTags: true,
  preventSqlInjection: true,
  preventXss: true,
  
  // Response security
  hideStackTrace: process.env.NODE_ENV === 'production',
  hideInternalErrors: process.env.NODE_ENV === 'production',
  sanitizeErrorMessages: true
}

// Encryption Configuration
export const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyDerivation: 'pbkdf2',
  iterations: 100000,
  saltLength: 32,
  ivLength: 16,
  tagLength: 16
}

// Audit Logging Security
export const AUDIT_CONFIG = {
  enabled: true,
  logLevel: 'INFO',
  includeRequestBody: false, // Don't log sensitive data
  includeResponseBody: false,
  includeHeaders: true,
  maskSensitiveData: true,
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'taxId'
  ],
  retentionDays: 365,
  archiveAfterDays: 90
}

/**
 * Validate password against security requirements
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`)
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`)
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (!API_SECURITY.sanitizeInput) return input

  let sanitized = input

  // Strip HTML tags if enabled
  if (API_SECURITY.stripHtmlTags) {
    sanitized = sanitized.replace(/<[^>]*>/g, '')
  }

  // Prevent XSS
  if (API_SECURITY.preventXss) {
    sanitized = sanitized
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  return sanitized
}

/**
 * Mask sensitive data in logs
 */
export function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) return data

  const masked = { ...data }

  AUDIT_CONFIG.sensitiveFields.forEach(field => {
    if (field in masked) {
      masked[field] = '***REDACTED***'
    }
  })

  // Recursively mask nested objects
  Object.keys(masked).forEach(key => {
    if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key])
    }
  })

  return masked
}

/**
 * Generate secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    result += chars[randomIndex]
  }
  
  return result
}

/**
 * Check if IP address is in allowed list
 */
export function isAllowedIP(ipAddress: string, allowList: string[]): boolean {
  if (allowList.length === 0) return true
  return allowList.includes(ipAddress)
}

/**
 * Check if IP address is in blocked list
 */
export function isBlockedIP(ipAddress: string, blockList: string[]): boolean {
  return blockList.includes(ipAddress)
}
