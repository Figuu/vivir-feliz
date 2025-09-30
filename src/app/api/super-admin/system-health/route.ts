import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()

    // Database health check
    let databaseStatus = 'healthy'
    let databaseResponseTime = 0
    try {
      const dbStartTime = Date.now()
      await db.$queryRaw`SELECT 1`
      databaseResponseTime = Date.now() - dbStartTime
      
      if (databaseResponseTime > 1000) {
        databaseStatus = 'degraded'
      } else if (databaseResponseTime > 2000) {
        databaseStatus = 'unhealthy'
      }
    } catch (err) {
      databaseStatus = 'down'
      databaseResponseTime = -1
    }

    // Get database statistics
    const [
      totalUsers,
      activeUsers,
      totalPatients,
      totalTherapists,
      totalSessions,
      completedSessions,
      upcomingSessions,
      totalPayments,
      paidPayments,
      pendingPayments
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { status: 'active' } }),
      db.patient.count(),
      db.therapist.count(),
      db.patientSession.count(),
      db.patientSession.count({ where: { status: 'completed' } }),
      db.patientSession.count({ where: { status: 'scheduled' } }),
      db.payment.count(),
      db.payment.count({ where: { status: 'paid' } }),
      db.payment.count({ where: { status: 'pending' } })
    ])

    // System resource usage (simplified - in production would use actual system metrics)
    const memoryUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()

    // Calculate system metrics
    const sessionCompletionRate = totalSessions > 0 ? (completedSessions / totalSessions * 100).toFixed(2) : 0
    const paymentCollectionRate = totalPayments > 0 ? (paidPayments / totalPayments * 100).toFixed(2) : 0
    const userActivityRate = totalUsers > 0 ? (activeUsers / totalUsers * 100).toFixed(2) : 0

    // Check for issues
    const issues = []
    
    if (databaseStatus !== 'healthy') {
      issues.push({
        severity: 'critical',
        component: 'Database',
        message: `Database is ${databaseStatus}`,
        timestamp: new Date().toISOString()
      })
    }

    if (databaseResponseTime > 500) {
      issues.push({
        severity: 'warning',
        component: 'Database',
        message: `Slow database response time: ${databaseResponseTime}ms`,
        timestamp: new Date().toISOString()
      })
    }

    if (pendingPayments > totalPayments * 0.5) {
      issues.push({
        severity: 'warning',
        component: 'Payments',
        message: `High number of pending payments: ${pendingPayments}`,
        timestamp: new Date().toISOString()
      })
    }

    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
      issues.push({
        severity: 'warning',
        component: 'Memory',
        message: 'High memory usage detected',
        timestamp: new Date().toISOString()
      })
    }

    // Overall health status
    let overallStatus = 'healthy'
    if (issues.some(i => i.severity === 'critical')) {
      overallStatus = 'critical'
    } else if (issues.some(i => i.severity === 'warning')) {
      overallStatus = 'warning'
    }

    const totalResponseTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        overall: {
          status: overallStatus,
          uptime: process.uptime(),
          responseTime: totalResponseTime
        },
        components: {
          database: {
            status: databaseStatus,
            responseTime: databaseResponseTime,
            connections: 'N/A' // Would require actual connection pool stats
          },
          api: {
            status: 'healthy',
            responseTime: totalResponseTime,
            requestsPerMinute: 'N/A' // Would require actual tracking
          },
          storage: {
            status: 'healthy',
            usage: 'N/A' // Would require actual file system stats
          }
        },
        resources: {
          memory: {
            used: memoryUsage.heapUsed,
            total: memoryUsage.heapTotal,
            percentage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2),
            external: memoryUsage.external,
            rss: memoryUsage.rss
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
          }
        },
        statistics: {
          users: {
            total: totalUsers,
            active: activeUsers,
            activityRate: userActivityRate
          },
          patients: {
            total: totalPatients
          },
          therapists: {
            total: totalTherapists
          },
          sessions: {
            total: totalSessions,
            completed: completedSessions,
            upcoming: upcomingSessions,
            completionRate: sessionCompletionRate
          },
          payments: {
            total: totalPayments,
            paid: paidPayments,
            pending: pendingPayments,
            collectionRate: paymentCollectionRate
          }
        },
        issues: issues,
        issueCount: {
          critical: issues.filter(i => i.severity === 'critical').length,
          warning: issues.filter(i => i.severity === 'warning').length,
          info: issues.filter(i => i.severity === 'info').length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching system health:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        data: {
          overall: {
            status: 'critical',
            uptime: 0,
            responseTime: 0
          }
        }
      },
      { status: 500 }
    )
  }
}
