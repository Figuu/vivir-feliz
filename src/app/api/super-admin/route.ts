import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { PaymentStatus } from '@prisma/client'

// Centralized super admin API endpoint
// Provides a unified interface for super admin operations

const dashboardQuerySchema = z.object({
  includeFinancial: z.string().optional().transform(val => val === 'true'),
  includeUsers: z.string().optional().transform(val => val === 'true'),
  includeSessions: z.string().optional().transform(val => val === 'true'),
  includeSystem: z.string().optional().transform(val => val === 'true')
})

// GET - Super admin dashboard overview
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Handle different actions
    switch (action) {
      case 'dashboard':
        return handleDashboard(searchParams)
      case 'quick-stats':
        return handleQuickStats()
      case 'recent-activity':
        return handleRecentActivity()
      case 'alerts':
        return handleAlerts()
      default:
        return handleDashboard(searchParams)
    }

  } catch (error) {
    console.error('Error in super admin API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Dashboard overview
async function handleDashboard(searchParams: URLSearchParams) {
  const validation = dashboardQuerySchema.safeParse({
    includeFinancial: searchParams.get('includeFinancial'),
    includeUsers: searchParams.get('includeUsers'),
    includeSessions: searchParams.get('includeSessions'),
    includeSystem: searchParams.get('includeSystem')
  })

  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: validation.error.issues },
      { status: 400 }
    )
  }

  const options = validation.data
  const responseData: any = {}

  // Financial data
  if (options.includeFinancial !== false) {
    const [totalRevenue, paidRevenue, pendingRevenue, overdueRevenue] = await Promise.all([
      db.payment.aggregate({ _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: PaymentStatus.COMPLETED }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: PaymentStatus.PENDING }, _sum: { amount: true } }),
      db.payment.aggregate({
        where: { status: PaymentStatus.PENDING, dueDate: { lt: new Date() } },
        _sum: { amount: true }
      })
    ])

    responseData.financial = {
      totalRevenue: Number(totalRevenue._sum.amount) || 0,
      paidRevenue: Number(paidRevenue._sum.amount) || 0,
      pendingRevenue: Number(pendingRevenue._sum.amount) || 0,
      overdueRevenue: Number(overdueRevenue._sum.amount) || 0,
      collectionRate: totalRevenue._sum.amount
        ? (((Number(paidRevenue._sum.amount) || 0) / Number(totalRevenue._sum.amount)) * 100).toFixed(2)
        : 0
    }
  }

  // User data
  if (options.includeUsers !== false) {
    const [totalUsers, activeUsers, byRole] = await Promise.all([
      db.profile.count(),
      db.profile.count({ where: { isActive: true } }),
      db.profile.groupBy({
        by: ['role'],
        _count: true
      })
    ])

    responseData.users = {
      total: totalUsers,
      active: activeUsers,
      byRole: byRole.map(r => ({ role: r.role, count: r._count }))
    }
  }

  // Session data
  if (options.includeSessions !== false) {
    const [totalSessions, completedSessions, upcomingSessions, todaySessions] = await Promise.all([
      db.patientSession.count(),
      db.patientSession.count({ where: { status: 'COMPLETED' } }),
      db.patientSession.count({ where: { status: 'SCHEDULED' } }),
      db.patientSession.count({
        where: {
          scheduledDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
    ])

    responseData.sessions = {
      total: totalSessions,
      completed: completedSessions,
      upcoming: upcomingSessions,
      today: todaySessions,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions * 100).toFixed(2) : 0
    }
  }

  // System data
  if (options.includeSystem !== false) {
    const memoryUsage = process.memoryUsage()
    
    responseData.system = {
      uptime: process.uptime(),
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2)
      },
      nodejs: process.version,
      platform: process.platform
    }
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: responseData
  })
}

// Quick statistics
async function handleQuickStats() {
  const [
    totalPatients,
    totalTherapists,
    totalSessions,
    totalPayments,
    activeUsers
  ] = await Promise.all([
    db.patient.count(),
    db.therapist.count(),
    db.patientSession.count(),
    db.payment.count(),
    db.profile.count({ where: { isActive: true } })
  ])

  return NextResponse.json({
    success: true,
    data: {
      patients: totalPatients,
      therapists: totalTherapists,
      sessions: totalSessions,
      payments: totalPayments,
      activeUsers: activeUsers
    }
  })
}

// Recent activity
async function handleRecentActivity() {
  const [recentSessions, recentPayments, recentUsers] = await Promise.all([
    db.patientSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        patient: { select: { firstName: true, lastName: true } },
        serviceAssignment: {
          include: {
            service: { select: { name: true } }
          }
        }
      }
    }),
    db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        parent: {
          select: { 
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    }),
    db.profile.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    })
  ])

  return NextResponse.json({
    success: true,
    data: {
      sessions: recentSessions.map(s => ({
        id: s.id,
        patientName: `${s.patient.firstName} ${s.patient.lastName}`,
        serviceName: s.serviceAssignment?.service?.name || 'N/A',
        scheduledDate: s.scheduledDate,
        status: s.status,
        createdAt: s.createdAt
      })),
      payments: recentPayments.map(p => ({
        id: p.id,
        amount: p.amount.toNumber(),
        patientName: `${p.parent?.profile?.firstName || ''} ${p.parent?.profile?.lastName || ''}`,
        status: p.status,
        createdAt: p.createdAt
      })),
      users: recentUsers.map((u: any) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        createdAt: u.createdAt
      }))
    }
  })
}

// System alerts
async function handleAlerts() {
  const alerts = []

  // Check for overdue payments
  const overdueCount = await db.payment.count({
    where: {
      status: PaymentStatus.PENDING,
      dueDate: { lt: new Date() }
    }
  })

  if (overdueCount > 0) {
    alerts.push({
      severity: 'warning',
      type: 'payment',
      message: `${overdueCount} overdue payments require attention`,
      timestamp: new Date().toISOString()
    })
  }

  // Check for pending consultation requests
  const pendingConsultations = await db.consultationRequest.count({
    where: { status: 'PENDING' }
  })

  if (pendingConsultations > 10) {
    alerts.push({
      severity: 'warning',
      type: 'consultation',
      message: `${pendingConsultations} pending consultation requests`,
      timestamp: new Date().toISOString()
    })
  }

  // Check for unassigned sessions (all PatientSessions have therapistId, so this check is not applicable)
  const unassignedSessions = 0 // Since all PatientSessions must have a therapistId according to the schema

  if (unassignedSessions > 0) {
    alerts.push({
      severity: 'critical',
      type: 'session',
      message: `${unassignedSessions} sessions without assigned therapist`,
      timestamp: new Date().toISOString()
    })
  }

  // Check for inactive users
  const inactiveUsers = await db.profile.count({
    where: { isActive: false }
  })

  if (inactiveUsers > 50) {
    alerts.push({
      severity: 'info',
      type: 'user',
      message: `${inactiveUsers} inactive user accounts`,
      timestamp: new Date().toISOString()
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      alerts,
      totalAlerts: alerts.length,
      criticalCount: alerts.filter(a => a.severity === 'critical').length,
      warningCount: alerts.filter(a => a.severity === 'warning').length,
      infoCount: alerts.filter(a => a.severity === 'info').length
    }
  })
}
