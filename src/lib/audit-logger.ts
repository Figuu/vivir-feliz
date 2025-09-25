import { db } from '@/lib/db'
import { AuditAction, AuditSeverity } from '@prisma/client'
import { NextRequest } from 'next/server'

export interface AuditLogData {
  action: AuditAction
  resource: string
  resourceId?: string
  userId?: string
  endpoint?: string
  method?: string
  userAgent?: string
  ipAddress?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  metadata?: Record<string, unknown>
  severity?: AuditSeverity
  category?: string
  success?: boolean
  errorMessage?: string
}

export class AuditLogger {
  /**
   * Log an audit event to the database
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      await db.auditLog.create({
        data: {
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          userId: data.userId,
          endpoint: data.endpoint,
          method: data.method,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
          oldData: data.oldData ? JSON.parse(JSON.stringify(data.oldData)) : null,
          newData: data.newData ? JSON.parse(JSON.stringify(data.newData)) : null,
          metadata: data.metadata ? JSON.parse(JSON.stringify(data.metadata)) : null,
          severity: data.severity || AuditSeverity.INFO,
          category: data.category,
          success: data.success ?? true,
          errorMessage: data.errorMessage,
        },
      })
    } catch (error) {
      // Log to console if database logging fails to prevent infinite loops
      console.error('Failed to write audit log:', error)
      console.error('Audit data:', data)
    }
  }

  /**
   * Extract request information from NextRequest
   */
  static extractRequestInfo(request: NextRequest) {
    const userAgent = request.headers.get('user-agent')
    const ipAddress = this.getClientIP(request)
    const endpoint = request.nextUrl.pathname
    const method = request.method

    return {
      userAgent,
      ipAddress,
      endpoint,
      method,
    }
  }

  /**
   * Get client IP address from request
   */
  static getClientIP(request: NextRequest): string {
    // Check various headers for the real IP address
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
    
    // Fallback to unknown if no IP found
    return 'unknown'
  }

  /**
   * Authentication-related audit logging helpers
   */
  static async logAuth(data: {
    action: AuditAction
    userId?: string
    success?: boolean
    errorMessage?: string
    request?: NextRequest
    metadata?: Record<string, unknown>
  }) {
    const requestInfo = data.request ? this.extractRequestInfo(data.request) : {}
    
    await this.log({
      action: data.action,
      resource: 'auth',
      userId: data.userId,
      success: data.success,
      errorMessage: data.errorMessage,
      category: 'authentication',
      severity: data.success === false ? AuditSeverity.WARNING : AuditSeverity.INFO,
      metadata: data.metadata,
      ...requestInfo,
    })
  }

  /**
   * User management audit logging helpers
   */
  static async logUserAction(data: {
    action: AuditAction
    userId?: string
    targetUserId?: string
    oldData?: Record<string, unknown>
    newData?: Record<string, unknown>
    request?: NextRequest
    metadata?: Record<string, unknown>
  }) {
    const requestInfo = data.request ? this.extractRequestInfo(data.request) : {}
    
    await this.log({
      action: data.action,
      resource: 'users',
      resourceId: data.targetUserId,
      userId: data.userId,
      oldData: data.oldData,
      newData: data.newData,
      category: 'user_management',
      severity: AuditSeverity.INFO,
      metadata: data.metadata,
      ...requestInfo,
    })
  }

  /**
   * File operation audit logging helpers
   */
  static async logFileAction(data: {
    action: AuditAction
    userId?: string
    fileId?: string
    fileName?: string
    fileSize?: number
    request?: NextRequest
    metadata?: Record<string, unknown>
  }) {
    const requestInfo = data.request ? this.extractRequestInfo(data.request) : {}
    
    await this.log({
      action: data.action,
      resource: 'files',
      resourceId: data.fileId,
      userId: data.userId,
      category: 'file_management',
      severity: AuditSeverity.INFO,
      metadata: {
        fileName: data.fileName,
        fileSize: data.fileSize,
        ...data.metadata,
      },
      ...requestInfo,
    })
  }

  /**
   * Security event audit logging helpers
   */
  static async logSecurityEvent(data: {
    action: AuditAction
    userId?: string
    severity?: AuditSeverity
    errorMessage?: string
    request?: NextRequest
    metadata?: Record<string, unknown>
  }) {
    const requestInfo = data.request ? this.extractRequestInfo(data.request) : {}
    
    await this.log({
      action: data.action,
      resource: 'security',
      userId: data.userId,
      category: 'security',
      severity: data.severity || AuditSeverity.WARNING,
      success: false,
      errorMessage: data.errorMessage,
      metadata: data.metadata,
      ...requestInfo,
    })
  }

  /**
   * Admin action audit logging helpers
   */
  static async logAdminAction(data: {
    action: AuditAction
    userId: string
    resourceId?: string
    oldData?: Record<string, unknown>
    newData?: Record<string, unknown>
    request?: NextRequest
    metadata?: Record<string, unknown>
  }) {
    const requestInfo = data.request ? this.extractRequestInfo(data.request) : {}
    
    await this.log({
      action: data.action,
      resource: 'admin',
      resourceId: data.resourceId,
      userId: data.userId,
      oldData: data.oldData,
      newData: data.newData,
      category: 'admin_operations',
      severity: AuditSeverity.HIGH,
      metadata: data.metadata,
      ...requestInfo,
    })
  }

  /**
   * Retrieve audit logs with filtering and pagination
   */
  static async getLogs(options: {
    userId?: string
    action?: AuditAction
    resource?: string
    severity?: AuditSeverity
    category?: string
    success?: boolean
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }) {
    const {
      userId,
      action,
      resource,
      severity,
      category,
      success,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = options

    const where: Record<string, unknown> = {}

    if (userId) where.userId = userId
    if (action) where.action = action
    if (resource) where.resource = resource
    if (severity) where.severity = severity
    if (category) where.category = category
    if (success !== undefined) where.success = success
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) (where.createdAt as { gte?: Date; lte?: Date }).gte = startDate
      if (endDate) (where.createdAt as { gte?: Date; lte?: Date }).lte = endDate
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get audit statistics
   */
  static async getStats(options: {
    startDate?: Date
    endDate?: Date
    userId?: string
  } = {}) {
    const { startDate, endDate, userId } = options

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) (where.createdAt as { gte?: Date; lte?: Date }).gte = startDate
      if (endDate) (where.createdAt as { gte?: Date; lte?: Date }).lte = endDate
    }

    const [
      totalLogs,
      successfulActions,
      failedActions,
      actionsByType,
      severityDistribution,
    ] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.count({ where: { ...where, success: true } }),
      db.auditLog.count({ where: { ...where, success: false } }),
      db.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true,
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),
      db.auditLog.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),
    ])

    return {
      totalLogs,
      successfulActions,
      failedActions,
      successRate: totalLogs > 0 ? (successfulActions / totalLogs) * 100 : 0,
      actionsByType,
      severityDistribution,
    }
  }
}

// Convenience function for common audit logging
export const auditLog = AuditLogger.log
export const auditAuth = AuditLogger.logAuth
export const auditUser = AuditLogger.logUserAction
export const auditFile = AuditLogger.logFileAction
export const auditSecurity = AuditLogger.logSecurityEvent
export const auditAdmin = AuditLogger.logAdminAction