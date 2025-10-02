/**
 * Environment Configuration for Vivir Feliz Therapy Center
 * Centralized configuration management with validation
 */

// Database Configuration
export const dbConfig = {
  url: process.env.DATABASE_URL!,
  directUrl: process.env.DIRECT_URL!,
  queryLog: process.env.PRISMA_QUERY_LOG === 'true',
} as const

// Supabase Configuration
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'therapy-documents',
} as const

// Authentication Configuration
export const authConfig = {
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  nextAuthSecret: process.env.NEXTAUTH_SECRET!,
  sessionTimeoutHours: parseInt(process.env.SESSION_TIMEOUT_HOURS || '24'),
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
} as const

// Email Configuration
export const emailConfig = {
  resendApiKey: process.env.RESEND_API_KEY!,
  fromEmail: process.env.FROM_EMAIL || 'noreply@vivirfeliz.com',
} as const

// Application Configuration
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || 'Vivir Feliz',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  environment: process.env.NODE_ENV || 'development',
  debug: process.env.DEBUG === 'true',
} as const

// Therapy Center Configuration
export const therapyConfig = {
  defaultConsultationPrice: parseFloat(process.env.DEFAULT_CONSULTATION_PRICE || '100.00'),
  defaultInterviewPrice: parseFloat(process.env.DEFAULT_INTERVIEW_PRICE || '0.00'),
  defaultConsultationDuration: parseInt(process.env.DEFAULT_CONSULTATION_DURATION || '60'),
  defaultInterviewDuration: parseInt(process.env.DEFAULT_INTERVIEW_DURATION || '45'),
  defaultTherapySessionDuration: parseInt(process.env.DEFAULT_THERAPY_SESSION_DURATION || '45'),
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
  paymentTimeoutHours: parseInt(process.env.PAYMENT_TIMEOUT_HOURS || '24'),
} as const

// Security Configuration
export const securityConfig = {
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  forceHttps: process.env.FORCE_HTTPS === 'true',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
} as const

// Monitoring Configuration
export const monitoringConfig = {
  logLevel: process.env.LOG_LEVEL || 'info',
  enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING === 'true',
  auditLogRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '365'),
} as const

// Backup Configuration
export const backupConfig = {
  enabled: process.env.BACKUP_ENABLED === 'true',
  schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
  retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
} as const

/**
 * Get the application URL
 */
export function getAppUrl(): string {
  return appConfig.url
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(): { isValid: boolean; missing: string[] } {
  const required = [
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
  ]

  const missing = required.filter(key => !process.env[key])

  return {
    isValid: missing.length === 0,
    missing,
  }
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = appConfig.environment

  switch (env) {
    case 'production':
      return {
        ...appConfig,
        debug: false,
        forceHttps: true,
        logLevel: 'warn',
        enableAuditLogging: true,
      }
    case 'development':
      return {
        ...appConfig,
        debug: false,
        forceHttps: true,
        logLevel: 'info',
        enableAuditLogging: true,
      }
    case 'development':
    default:
      return {
        ...appConfig,
        debug: true,
        forceHttps: false,
        logLevel: 'debug',
        enableAuditLogging: true,
      }
  }
}

/**
 * Database connection health check
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    await prisma.$connect()
    await prisma.$disconnect()
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

/**
 * Configuration validation on startup
 */
export function validateConfiguration(): void {
  const { isValid, missing } = validateEnvironment()
  
  if (!isValid) {
    console.error('❌ Missing required environment variables:', missing)
    console.error('Please check your .env file and ensure all required variables are set.')
    console.error('Refer to env.example for the complete list of required variables.')
    process.exit(1)
  }

  console.log('✅ Environment configuration validated successfully')
  console.log(`🌍 Environment: ${appConfig.environment}`)
  console.log(`🔧 Debug mode: ${appConfig.debug}`)
  console.log(`📊 Log level: ${monitoringConfig.logLevel}`)
  console.log(`🔐 Audit logging: ${monitoringConfig.enableAuditLogging}`)
}