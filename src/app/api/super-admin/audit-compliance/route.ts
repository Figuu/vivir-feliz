import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const auditQuerySchema = z.object({
  reportType: z.enum(['activity', 'access', 'data_changes', 'compliance', 'security']).optional().default('activity'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  userId: z.string().uuid().optional(),
  resource: z.string().optional(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
  action: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 100)
})

const complianceCheckSchema = z.object({
  checkType: z.enum(['data_retention', 'access_control', 'encryption', 'audit_trail', 'all']),
  generateReport: z.boolean().default(false)
})

// GET - Audit logs and compliance reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const validation = auditQuerySchema.safeParse({
      reportType: searchParams.get('reportType'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      userId: searchParams.get('userId'),
      resource: searchParams.get('resource'),
      severity: searchParams.get('severity'),
      action: searchParams.get('action'),
      limit: searchParams.get('limit')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { reportType, startDate, endDate, userId, resource, severity, action, limit } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (startDate) {
      whereClause.createdAt = { gte: new Date(startDate) }
    }
    if (endDate) {
      whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) }
    }
    if (userId) {
      whereClause.userId = userId
    }
    if (resource) {
      whereClause.resource = resource
    }
    if (severity) {
      whereClause.severity = severity
    }
    if (action) {
      whereClause.action = action
    }

    // Fetch audit logs
    const [logs, totalCount, bySeverity, byAction, byResource, byUser] = await Promise.all([
      db.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      db.auditLog.count({ where: whereClause }),
      db.auditLog.groupBy({
        by: ['severity'],
        where: whereClause,
        _count: true
      }),
      db.auditLog.groupBy({
        by: ['action'],
        where: whereClause,
        _count: true
      }),
      db.auditLog.groupBy({
        by: ['resource'],
        where: whereClause,
        _count: true
      }),
      db.auditLog.groupBy({
        by: ['userId'],
        where: whereClause,
        _count: true,
        orderBy: {
          _count: {
            userId: 'desc'
          }
        },
        take: 10
      })
    ])

    // Get user details for top users
    const topUserIds = byUser.map(u => u.userId).filter(Boolean) as string[]
    const topUsers = await db.user.findMany({
      where: { id: { in: topUserIds } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    })

    const topUserActivity = byUser.map(u => {
      const user = topUsers.find(tu => tu.id === u.userId)
      return {
        userId: u.userId,
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        userEmail: user?.email,
        userRole: user?.role,
        activityCount: u._count
      }
    })

    // Calculate compliance metrics
    const successfulActions = logs.filter(l => l.success).length
    const failedActions = logs.filter(l => !l.success).length
    const successRate = totalCount > 0 ? (successfulActions / totalCount * 100).toFixed(2) : 0

    return NextResponse.json({
      success: true,
      reportType,
      data: {
        logs: logs.map(log => ({
          id: log.id,
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          userId: log.userId,
          userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : null,
          userEmail: log.user?.email,
          userRole: log.user?.role,
          severity: log.severity,
          success: log.success,
          errorMessage: log.errorMessage,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          metadata: log.metadata,
          createdAt: log.createdAt
        })),
        statistics: {
          totalCount,
          successfulActions,
          failedActions,
          successRate,
          bySeverity: bySeverity.map(s => ({
            severity: s.severity,
            count: s._count
          })),
          byAction: byAction.map(a => ({
            action: a.action,
            count: a._count
          })).sort((a, b) => b.count - a.count).slice(0, 10),
          byResource: byResource.map(r => ({
            resource: r.resource,
            count: r._count
          })).sort((a, b) => b.count - a.count).slice(0, 10),
          topUsers: topUserActivity
        },
        dateRange: {
          start: startDate || null,
          end: endDate || null
        }
      }
    })

  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Run compliance checks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = complianceCheckSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { checkType, generateReport } = validation.data

    const complianceResults: any = {}

    // Data retention compliance
    if (checkType === 'data_retention' || checkType === 'all') {
      const oldSessions = await db.patientSession.count({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 365 * 5 * 24 * 60 * 60 * 1000) // 5 years old
          }
        }
      })

      complianceResults.dataRetention = {
        status: oldSessions === 0 ? 'compliant' : 'review_needed',
        oldRecords: oldSessions,
        recommendation: oldSessions > 0 
          ? 'Review and archive records older than 5 years'
          : 'All records are within retention policy'
      }
    }

    // Access control compliance
    if (checkType === 'access_control' || checkType === 'all') {
      const [totalUsers, usersWithoutRole, inactiveWithAccess] = await Promise.all([
        db.user.count(),
        db.user.count({ where: { role: null } }),
        db.user.count({ where: { status: 'inactive', lastLogin: { not: null } } })
      ])

      complianceResults.accessControl = {
        status: usersWithoutRole === 0 && inactiveWithAccess === 0 ? 'compliant' : 'review_needed',
        usersWithoutRole,
        inactiveWithAccess,
        recommendation: usersWithoutRole > 0 || inactiveWithAccess > 0
          ? 'Review user roles and revoke access for inactive users'
          : 'Access control is properly configured'
      }
    }

    // Audit trail compliance
    if (checkType === 'audit_trail' || checkType === 'all') {
      const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const [totalLogs, criticalLogs, failedActions] = await Promise.all([
        db.auditLog.count({ where: { createdAt: { gte: last30Days } } }),
        db.auditLog.count({ 
          where: { 
            createdAt: { gte: last30Days },
            severity: 'CRITICAL' 
          } 
        }),
        db.auditLog.count({ 
          where: { 
            createdAt: { gte: last30Days },
            success: false 
          } 
        })
      ])

      complianceResults.auditTrail = {
        status: totalLogs > 0 ? 'compliant' : 'non_compliant',
        logsLast30Days: totalLogs,
        criticalEvents: criticalLogs,
        failedActions,
        recommendation: totalLogs === 0
          ? 'Audit logging is not functioning properly'
          : criticalLogs > 10
          ? 'High number of critical events - investigate'
          : 'Audit trail is functioning correctly'
      }
    }

    // Overall compliance status
    const allStatuses = Object.values(complianceResults).map((r: any) => r.status)
    const overallStatus = allStatuses.includes('non_compliant') 
      ? 'non_compliant' 
      : allStatuses.includes('review_needed') 
      ? 'review_needed' 
      : 'compliant'

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        overallStatus,
        checks: complianceResults,
        summary: {
          totalChecks: Object.keys(complianceResults).length,
          compliant: allStatuses.filter(s => s === 'compliant').length,
          reviewNeeded: allStatuses.filter(s => s === 'review_needed').length,
          nonCompliant: allStatuses.filter(s => s === 'non_compliant').length
        }
      }
    })

  } catch (error) {
    console.error('Error running compliance checks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
