/**
 * Centralized Error Handling and Reporting System
 */

import { NextRequest, NextResponse } from 'next/server'
import { AuditLogger } from './audit-logger'
import { AuditAction, AuditSeverity } from '@prisma/client'
import { createLogger } from './monitoring-config'

const logger = createLogger('ErrorHandler')

// Error Types
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  CONFLICT = 'CONFLICT_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  TIMEOUT = 'TIMEOUT_ERROR',
  FILE_UPLOAD = 'FILE_UPLOAD_ERROR',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC_ERROR'
}

// Error Severity Levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Custom Application Error
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly statusCode: number
  public readonly severity: ErrorSeverity
  public readonly isOperational: boolean
  public readonly context?: Record<string, unknown>
  public readonly userMessage?: string

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isOperational: boolean = true,
    context?: Record<string, unknown>,
    userMessage?: string
  ) {
    super(message)
    this.type = type
    this.statusCode = statusCode
    this.severity = severity
    this.isOperational = isOperational
    this.context = context
    this.userMessage = userMessage
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

// Predefined Error Classes
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      ErrorType.VALIDATION,
      400,
      ErrorSeverity.LOW,
      true,
      context,
      'The data provided is invalid. Please check your input and try again.'
    )
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(
      message,
      ErrorType.AUTHENTICATION,
      401,
      ErrorSeverity.MEDIUM,
      true,
      undefined,
      'You must be logged in to access this resource.'
    )
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(
      message,
      ErrorType.AUTHORIZATION,
      403,
      ErrorSeverity.MEDIUM,
      true,
      undefined,
      'You do not have permission to perform this action.'
    )
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: Record<string, unknown>) {
    super(
      `${resource} not found`,
      ErrorType.NOT_FOUND,
      404,
      ErrorSeverity.LOW,
      true,
      context,
      `The requested ${resource.toLowerCase()} could not be found.`
    )
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      ErrorType.CONFLICT,
      409,
      ErrorSeverity.MEDIUM,
      true,
      context,
      'This operation conflicts with existing data.'
    )
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      'Rate limit exceeded',
      ErrorType.RATE_LIMIT,
      429,
      ErrorSeverity.LOW,
      true,
      { retryAfter },
      'Too many requests. Please try again later.'
    )
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      ErrorType.DATABASE,
      500,
      ErrorSeverity.HIGH,
      true,
      context,
      'A database error occurred. Please try again later.'
    )
  }
}

export class ExternalAPIError extends AppError {
  constructor(service: string, context?: Record<string, unknown>) {
    super(
      `External service error: ${service}`,
      ErrorType.EXTERNAL_API,
      502,
      ErrorSeverity.HIGH,
      true,
      context,
      'An external service is currently unavailable. Please try again later.'
    )
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string) {
    super(
      `Operation timed out: ${operation}`,
      ErrorType.TIMEOUT,
      408,
      ErrorSeverity.MEDIUM,
      true,
      { operation },
      'The operation took too long to complete. Please try again.'
    )
  }
}

export class FileUploadError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(
      message,
      ErrorType.FILE_UPLOAD,
      400,
      ErrorSeverity.LOW,
      true,
      context,
      'File upload failed. Please check the file and try again.'
    )
  }
}

export class BusinessLogicError extends AppError {
  constructor(message: string, userMessage: string, context?: Record<string, unknown>) {
    super(
      message,
      ErrorType.BUSINESS_LOGIC,
      422,
      ErrorSeverity.MEDIUM,
      true,
      context,
      userMessage
    )
  }
}

// Error Handler Class
export class ErrorHandler {
  /**
   * Handle errors in API routes
   */
  static async handleAPIError(
    error: unknown,
    request?: NextRequest,
    userId?: string
  ): Promise<NextResponse> {
    // Convert unknown error to AppError
    const appError = this.normalizeError(error)

    // Log the error
    await this.logError(appError, request, userId)

    // Report critical errors
    if (appError.severity === ErrorSeverity.CRITICAL) {
      await this.reportCriticalError(appError, request, userId)
    }

    // Return error response
    return this.createErrorResponse(appError)
  }

  /**
   * Normalize any error to AppError
   */
  static normalizeError(error: unknown): AppError {
    // Already an AppError
    if (error instanceof AppError) {
      return error
    }

    // Standard Error
    if (error instanceof Error) {
      // Check for specific error patterns
      const message = error.message.toLowerCase()

      if (message.includes('unique constraint') || message.includes('duplicate')) {
        return new ConflictError(error.message, { originalError: error.name })
      }

      if (message.includes('foreign key') || message.includes('not found')) {
        return new NotFoundError('Resource', { originalError: error.name })
      }

      if (message.includes('timeout') || message.includes('timed out')) {
        return new TimeoutError('Database operation')
      }

      if (message.includes('prisma') || message.includes('database')) {
        return new DatabaseError(error.message, { originalError: error.name })
      }

      // Generic error
      return new AppError(
        error.message,
        ErrorType.INTERNAL,
        500,
        ErrorSeverity.HIGH,
        false,
        { originalError: error.name }
      )
    }

    // String error
    if (typeof error === 'string') {
      return new AppError(error, ErrorType.INTERNAL, 500, ErrorSeverity.MEDIUM)
    }

    // Unknown error
    return new AppError(
      'An unexpected error occurred',
      ErrorType.INTERNAL,
      500,
      ErrorSeverity.HIGH,
      false,
      { error: JSON.stringify(error) }
    )
  }

  /**
   * Log error to audit log and console
   */
  private static async logError(
    error: AppError,
    request?: NextRequest,
    userId?: string
  ): Promise<void> {
    // Console logging
    const logLevel = this.getLogLevel(error.severity)
    logger[logLevel](
      `[${error.type}] ${error.message}`,
      error,
      {
        statusCode: error.statusCode,
        context: error.context,
        stack: error.stack
      }
    )

    // Audit logging for operational errors
    if (error.isOperational && request) {
      try {
        await AuditLogger.log({
          action: AuditAction.API_ERROR,
          resource: 'api',
          userId,
          endpoint: request.nextUrl.pathname,
          method: request.method,
          severity: this.mapToAuditSeverity(error.severity),
          success: false,
          errorMessage: error.message,
          metadata: {
            errorType: error.type,
            statusCode: error.statusCode,
            context: error.context,
            userMessage: error.userMessage
          },
          ...AuditLogger.extractRequestInfo(request)
        })
      } catch (auditError) {
        logger.error('Failed to log error to audit log', auditError)
      }
    }
  }

  /**
   * Report critical errors (e.g., send alerts)
   */
  private static async reportCriticalError(
    error: AppError,
    request?: NextRequest,
    userId?: string
  ): Promise<void> {
    // In production, this would send alerts via email, Slack, etc.
    logger.critical('CRITICAL ERROR DETECTED', error, {
      request: request?.url,
      userId,
      context: error.context
    })

    // TODO: Integrate with alerting service (e.g., email, Slack, PagerDuty)
    // await sendAlert({
    //   severity: 'critical',
    //   message: error.message,
    //   context: { request, userId, error }
    // })
  }

  /**
   * Create error response
   */
  private static createErrorResponse(error: AppError): NextResponse {
    const isDevelopment = process.env.NODE_ENV === 'development'

    const response: Record<string, unknown> = {
      error: {
        type: error.type,
        message: error.userMessage || error.message,
        statusCode: error.statusCode
      }
    }

    // Include additional details in development
    if (isDevelopment) {
      response.error = {
        ...response.error,
        technicalMessage: error.message,
        context: error.context,
        stack: error.stack
      }
    }

    // Include context if available
    if (error.context && Object.keys(error.context).length > 0) {
      response.error = {
        ...response.error,
        details: error.context
      }
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  /**
   * Map error severity to log level
   */
  private static getLogLevel(severity: ErrorSeverity): 'debug' | 'info' | 'warn' | 'error' | 'critical' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'info'
      case ErrorSeverity.MEDIUM:
        return 'warn'
      case ErrorSeverity.HIGH:
        return 'error'
      case ErrorSeverity.CRITICAL:
        return 'critical'
      default:
        return 'error'
    }
  }

  /**
   * Map error severity to audit severity
   */
  private static mapToAuditSeverity(severity: ErrorSeverity): AuditSeverity {
    switch (severity) {
      case ErrorSeverity.LOW:
        return AuditSeverity.INFO
      case ErrorSeverity.MEDIUM:
        return AuditSeverity.WARNING
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return AuditSeverity.ERROR
      default:
        return AuditSeverity.ERROR
    }
  }
}

/**
 * Async error wrapper for API routes
 */
export function asyncHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      return await ErrorHandler.handleAPIError(error, request)
    }
  }
}

/**
 * Try-catch wrapper with automatic error handling
 */
export async function tryCatch<T>(
  operation: () => Promise<T>,
  errorContext?: Record<string, unknown>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    const appError = ErrorHandler.normalizeError(error)
    if (errorContext) {
      appError.context = { ...appError.context, ...errorContext }
    }
    throw appError
  }
}

/**
 * Validate and throw if invalid
 */
export function validateOrThrow(
  condition: boolean,
  message: string,
  context?: Record<string, unknown>
): asserts condition {
  if (!condition) {
    throw new ValidationError(message, context)
  }
}

/**
 * Assert resource exists or throw NotFoundError
 */
export function assertExists<T>(
  resource: T | null | undefined,
  resourceName: string = 'Resource'
): asserts resource is T {
  if (!resource) {
    throw new NotFoundError(resourceName)
  }
}

/**
 * Assert user has permission or throw AuthorizationError
 */
export function assertAuthorized(
  condition: boolean,
  message: string = 'Insufficient permissions'
): asserts condition {
  if (!condition) {
    throw new AuthorizationError(message)
  }
}
