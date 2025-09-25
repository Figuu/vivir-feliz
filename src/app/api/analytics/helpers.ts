import { db } from '@/lib/db'
import { AuditSeverity } from '@prisma/client'

export async function getCurrentMetrics() {
  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [
    activeSessions,
    totalSessions,
    newSignups,
    recentActions,
    securityEvents
  ] = await Promise.all([
    // Active sessions in last 5 minutes
    db.session.count({
      where: {
        isActive: true,
        lastActivity: { gte: fiveMinutesAgo }
      }
    }),
    
    // Total sessions today
    db.session.count({
      where: {
        createdAt: { gte: oneDayAgo }
      }
    }),
    
    // New signups today
    db.user.count({
      where: {
        createdAt: { gte: oneDayAgo }
      }
    }),
    
    // Recent audit actions in last 5 minutes
    db.auditLog.count({
      where: {
        createdAt: { gte: fiveMinutesAgo }
      }
    }),
    
    // Security events today
    db.auditLog.count({
      where: {
        severity: { in: [AuditSeverity.HIGH, AuditSeverity.CRITICAL] },
        createdAt: { gte: oneDayAgo }
      }
    })
  ])

  const errorRate = await calculateErrorRate()

  return {
    timestamp: now,
    activeUsers: activeSessions,
    totalSessions,
    newSignups,
    recentActions,
    securityEvents,
    systemLoad: {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
      networkActivity: Math.random() * 1000
    },
    errorRate
  }
}

export async function getLiveActivity(limit: number) {
  const recentLogs = await db.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { name: true, email: true }
      }
    }
  })

  return recentLogs.map(log => ({
    id: log.id,
    type: mapActionToType(log.action),
    message: formatActivityMessage(log),
    severity: mapSeverityToLevel(log.severity),
    timestamp: log.createdAt,
    userId: log.userId || undefined,
    metadata: {
      action: log.action,
      resource: log.resource,
      success: log.success,
      userName: log.user?.name || log.user?.email
    }
  }))
}

export async function getChartData(metric: string, timeRange: string) {
  const now = new Date()
  const timeRanges = {
    '1h': { duration: 60 * 60 * 1000, intervals: 12, format: 'HH:mm' },
    '24h': { duration: 24 * 60 * 60 * 1000, intervals: 24, format: 'HH:mm' },
    '7d': { duration: 7 * 24 * 60 * 60 * 1000, intervals: 7, format: 'MM/dd' },
    '30d': { duration: 30 * 24 * 60 * 60 * 1000, intervals: 30, format: 'MM/dd' }
  }

  const range = timeRanges[timeRange as keyof typeof timeRanges]
  const startTime = new Date(now.getTime() - range.duration)
  const intervalMs = range.duration / range.intervals

  const dataPoints = []
  
  for (let i = 0; i < range.intervals; i++) {
    const intervalStart = new Date(startTime.getTime() + i * intervalMs)
    const intervalEnd = new Date(intervalStart.getTime() + intervalMs)
    
    let value = 0
    
    switch (metric) {
      case 'users':
        value = await db.user.count({
          where: {
            createdAt: { gte: intervalStart, lt: intervalEnd }
          }
        })
        break
        
      case 'sessions':
        value = await db.session.count({
          where: {
            createdAt: { gte: intervalStart, lt: intervalEnd }
          }
        })
        break
        
      case 'actions':
        value = await db.auditLog.count({
          where: {
            createdAt: { gte: intervalStart, lt: intervalEnd }
          }
        })
        break
        
      case 'errors':
        value = await db.auditLog.count({
          where: {
            success: false,
            createdAt: { gte: intervalStart, lt: intervalEnd }
          }
        })
        break
    }

    dataPoints.push({
      timestamp: intervalStart.toISOString(),
      value,
      label: formatTimestamp(intervalStart, range.format)
    })
  }

  return dataPoints
}

export async function getPerformanceMetrics() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const [errorCount, totalRequests] = await Promise.all([
    db.auditLog.count({
      where: {
        success: false,
        createdAt: { gte: oneDayAgo }
      }
    }),
    
    db.auditLog.count({
      where: {
        createdAt: { gte: oneDayAgo }
      }
    })
  ])

  return {
    avgResponseTime: Math.random() * 200 + 50, // 50-250ms
    errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
    totalRequests,
    slowQueries: Math.floor(Math.random() * 10),
    uptime: process.uptime(),
    timestamp: new Date()
  }
}

async function calculateErrorRate(): Promise<number> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [errorCount, totalCount] = await Promise.all([
      db.auditLog.count({
        where: {
          success: false,
          createdAt: { gte: oneDayAgo }
        }
      }),
      db.auditLog.count({
        where: {
          createdAt: { gte: oneDayAgo }
        }
      })
    ])
    
    return totalCount > 0 ? (errorCount / totalCount) * 100 : 0
  } catch {
    return 0
  }
}

function mapActionToType(action: string): 'user_action' | 'security_event' | 'system_event' {
  if (action.includes('SECURITY') || action.includes('SUSPICIOUS')) {
    return 'security_event'
  }
  if (action.includes('SYSTEM') || action.includes('CONFIGURATION')) {
    return 'system_event'
  }
  return 'user_action'
}

function mapSeverityToLevel(severity: AuditSeverity): 'low' | 'medium' | 'high' | 'critical' {
  switch (severity) {
    case AuditSeverity.CRITICAL:
      return 'critical'
    case AuditSeverity.HIGH:
      return 'high'
    case AuditSeverity.WARNING:
      return 'medium'
    default:
      return 'low'
  }
}

function formatActivityMessage(log: Record<string, unknown>): string {
  const action = String(log.action).replace(/_/g, ' ').toLowerCase()
  const user = log.user as Record<string, unknown> | undefined
  const userName = user?.name || user?.email || 'Unknown user'
  
  return `${userName} ${action} ${log.resource || 'resource'}`
}

function formatTimestamp(date: Date, format: string): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  
  switch (format) {
    case 'HH:mm':
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`
    case 'MM/dd':
      return `${pad(date.getMonth() + 1)}/${pad(date.getDate())}`
    default:
      return date.toISOString()
  }
}