/**
 * Monitoring and Logging Configuration
 * Centralized configuration for system monitoring and logging
 */

// Logging Levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Logging Configuration
export const LOGGING_CONFIG = {
  // General settings
  enabled: true,
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  
  // Output destinations
  destinations: {
    console: true,
    database: true,
    file: false, // Enable for file-based logging
    external: false // Enable for services like Sentry, LogRocket
  },
  
  // What to log
  logRequests: true,
  logResponses: false, // Avoid logging response bodies
  logErrors: true,
  logPerformance: true,
  logSecurity: true,
  
  // Request logging details
  requestLogging: {
    includeHeaders: true,
    includeBody: false, // Security risk
    includeQuery: true,
    includeCookies: false, // Security risk
    excludePaths: ['/api/health', '/_next', '/favicon.ico']
  },
  
  // Performance logging
  performanceLogging: {
    slowRequestThreshold: 1000, // Log requests slower than 1s
    trackDatabaseQueries: true,
    trackExternalAPIs: true
  },
  
  // Error logging
  errorLogging: {
    captureStackTrace: true,
    includeContext: true,
    maxStackTraceDepth: 50,
    groupSimilarErrors: true
  },
  
  // Log rotation (for file-based logging)
  rotation: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 7, // Keep 7 days
    compress: true
  }
}

// Monitoring Configuration
export const MONITORING_CONFIG = {
  // Health checks
  healthCheck: {
    enabled: true,
    interval: 60000, // 1 minute
    endpoints: [
      { name: 'Database', check: 'database' },
      { name: 'API', check: 'api' },
      { name: 'Storage', check: 'storage' }
    ],
    timeout: 5000 // 5 seconds
  },
  
  // Performance monitoring
  performance: {
    enabled: true,
    sampleRate: 1.0, // Log 100% of requests
    slowRequestThreshold: 1000, // 1 second
    trackMetrics: [
      'request_duration',
      'database_query_time',
      'external_api_time',
      'memory_usage',
      'cpu_usage'
    ]
  },
  
  // Error tracking
  errorTracking: {
    enabled: true,
    captureRate: 1.0, // Capture 100% of errors
    ignoreErrors: [
      'NetworkError',
      'AbortError'
    ],
    groupBy: ['message', 'stack'],
    maxSampleSize: 100
  },
  
  // Metrics collection
  metrics: {
    enabled: true,
    interval: 60000, // Collect every minute
    retention: 30 * 24 * 60 * 60 * 1000, // 30 days
    aggregations: ['sum', 'avg', 'min', 'max', 'count']
  },
  
  // Alerting
  alerting: {
    enabled: true,
    channels: ['email', 'in_app'],
    rules: [
      {
        name: 'High Error Rate',
        condition: 'error_rate > 0.05',
        severity: 'critical',
        cooldown: 300000 // 5 minutes
      },
      {
        name: 'Slow Database',
        condition: 'db_response_time > 1000',
        severity: 'warning',
        cooldown: 600000 // 10 minutes
      },
      {
        name: 'High Memory Usage',
        condition: 'memory_usage > 0.9',
        severity: 'warning',
        cooldown: 300000 // 5 minutes
      }
    ]
  }
}

// Audit Logging Configuration
export const AUDIT_LOGGING_CONFIG = {
  enabled: true,
  
  // What actions to audit
  auditActions: [
    'USER_CREATED',
    'USER_UPDATED',
    'USER_DELETED',
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'LOGOUT',
    'PASSWORD_CHANGED',
    'PERMISSION_CHANGED',
    'DATA_ACCESSED',
    'DATA_MODIFIED',
    'DATA_DELETED',
    'FILE_UPLOADED',
    'FILE_DOWNLOADED',
    'FILE_DELETED',
    'REPORT_GENERATED',
    'BACKUP_CREATED',
    'BACKUP_RESTORED',
    'CONFIG_CHANGED',
    'RATE_LIMIT_EXCEEDED'
  ],
  
  // Audit detail levels
  detailLevels: {
    minimal: ['action', 'userId', 'timestamp'],
    standard: ['action', 'userId', 'resource', 'resourceId', 'timestamp', 'ipAddress'],
    detailed: ['action', 'userId', 'resource', 'resourceId', 'timestamp', 'ipAddress', 'userAgent', 'oldData', 'newData', 'metadata']
  },
  
  // Sensitive data masking
  maskSensitiveData: true,
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'taxId',
    'socialSecurity'
  ],
  
  // Retention policy
  retention: {
    critical: 365, // 1 year
    warning: 180, // 6 months
    info: 90 // 3 months
  },
  
  // Compliance
  compliance: {
    gdprCompliant: true,
    hipaaCompliant: true,
    retainForCompliance: true
  }
}

// System Metrics to Track
export const SYSTEM_METRICS = {
  // Application metrics
  application: [
    'active_users',
    'total_sessions',
    'api_requests_per_minute',
    'average_response_time',
    'error_rate',
    'success_rate'
  ],
  
  // Business metrics
  business: [
    'new_patients',
    'completed_sessions',
    'revenue_collected',
    'pending_payments',
    'active_therapists',
    'consultation_requests'
  ],
  
  // System metrics
  system: [
    'cpu_usage',
    'memory_usage',
    'disk_usage',
    'database_connections',
    'cache_hit_rate',
    'uptime'
  ],
  
  // Security metrics
  security: [
    'failed_login_attempts',
    'rate_limit_exceeded',
    'unauthorized_access_attempts',
    'suspicious_activities'
  ]
}

/**
 * Logger utility class
 */
export class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: any) {
    this.log(LogLevel.WARN, message, data)
  }

  error(message: string, error?: Error | any, data?: any) {
    this.log(LogLevel.ERROR, message, { error, ...data })
  }

  critical(message: string, error?: Error | any, data?: any) {
    this.log(LogLevel.CRITICAL, message, { error, ...data })
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (!LOGGING_CONFIG.enabled) return

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      data: data || {},
      environment: process.env.NODE_ENV
    }

    // Console output
    if (LOGGING_CONFIG.destinations.console) {
      const consoleMethod = level === LogLevel.ERROR || level === LogLevel.CRITICAL ? 'error' : 
                           level === LogLevel.WARN ? 'warn' : 'log'
      console[consoleMethod](`[${level.toUpperCase()}] [${this.context}]`, message, data || '')
    }

    // Database logging (async, don't wait)
    if (LOGGING_CONFIG.destinations.database && (level === LogLevel.ERROR || level === LogLevel.CRITICAL)) {
      // Log to audit log for errors
      this.logToDatabase(logEntry).catch(err => 
        console.error('Failed to log to database:', err)
      )
    }
  }

  private async logToDatabase(logEntry: any) {
    // Implementation would write to a SystemLog table
    // For now, we use console as fallback
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context)
}

/**
 * Performance tracking utility
 */
export class PerformanceTracker {
  private startTime: number
  private checkpoints: Map<string, number>

  constructor() {
    this.startTime = Date.now()
    this.checkpoints = new Map()
  }

  checkpoint(name: string) {
    this.checkpoints.set(name, Date.now())
  }

  getDuration(checkpointName?: string): number {
    if (checkpointName && this.checkpoints.has(checkpointName)) {
      return Date.now() - this.checkpoints.get(checkpointName)!
    }
    return Date.now() - this.startTime
  }

  getReport() {
    const total = this.getDuration()
    const checkpoints: Record<string, number> = {}
    
    this.checkpoints.forEach((time, name) => {
      checkpoints[name] = Date.now() - time
    })

    return {
      totalDuration: total,
      checkpoints
    }
  }
}
