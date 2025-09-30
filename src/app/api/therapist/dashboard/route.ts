import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const dashboardQuerySchema = z.object({
  therapistId: z.string().uuid('Invalid therapist ID'),
  date: z.string().optional(),
  period: z.enum(['today', 'week', 'month']).default('today'),
  includeStats: z.string().transform(val => val === 'true').default(true),
  includeAgenda: z.string().transform(val => val === 'true').default(true),
  includePatients: z.string().transform(val => val === 'true').default(true)
})

// GET /api/therapist/dashboard - Get therapist dashboard data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = dashboardQuerySchema.safeParse({
      therapistId: searchParams.get('therapistId'),
      date: searchParams.get('date'),
      period: searchParams.get('period'),
      includeStats: searchParams.get('includeStats'),
      includeAgenda: searchParams.get('includeAgenda'),
      includePatients: searchParams.get('includePatients')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { therapistId, date, period, includeStats, includeAgenda, includePatients } = validation.data

    // Check if therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: therapistId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        specialties: {
          include: {
            specialty: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    })

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Calculate date range based on period
    const targetDate = date ? new Date(date) : new Date()
    const { startDate, endDate } = getDateRange(targetDate, period)

    const dashboardData: any = {
      therapist: {
        id: therapist.id,
        firstName: therapist.firstName,
        lastName: therapist.lastName,
        email: therapist.email,
        specialties: therapist.specialties.map(s => s.specialty)
      },
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    }

    // Get statistics if requested
    if (includeStats) {
      dashboardData.statistics = await getDashboardStatistics(therapistId, startDate, endDate)
    }

    // Get agenda if requested
    if (includeAgenda) {
      dashboardData.agenda = await getDashboardAgenda(therapistId, startDate, endDate)
    }

    // Get patients if requested
    if (includePatients) {
      dashboardData.patients = await getDashboardPatients(therapistId)
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Error fetching therapist dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to get date range based on period
function getDateRange(date: Date, period: string): { startDate: Date; endDate: Date } {
  const startDate = new Date(date)
  const endDate = new Date(date)

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      break
    case 'week':
      const dayOfWeek = date.getDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      startDate.setDate(date.getDate() - daysToMonday)
      startDate.setHours(0, 0, 0, 0)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
      break
    case 'month':
      startDate.setDate(1)
      startDate.setHours(0, 0, 0, 0)
      endDate.setMonth(date.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
      break
  }

  return { startDate, endDate }
}

// Helper function to get dashboard statistics
async function getDashboardStatistics(therapistId: string, startDate: Date, endDate: Date) {
  const [
    totalSessions,
    completedSessions,
    cancelledSessions,
    upcomingSessions,
    totalPatients,
    newPatients,
    totalRevenue,
    averageSessionDuration
  ] = await Promise.all([
    // Total sessions in period
    db.patientSession.count({
      where: {
        therapistId,
        scheduledDate: {
          gte: startDate,
          lte: endDate
        }
      }
    }),

    // Completed sessions
    db.patientSession.count({
      where: {
        therapistId,
        scheduledDate: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed'
      }
    }),

    // Cancelled sessions
    db.patientSession.count({
      where: {
        therapistId,
        scheduledDate: {
          gte: startDate,
          lte: endDate
        },
        status: 'cancelled'
      }
    }),

    // Upcoming sessions
    db.patientSession.count({
      where: {
        therapistId,
        scheduledDate: {
          gte: new Date(),
          lte: endDate
        },
        status: 'scheduled'
      }
    }),

    // Total patients
    db.patientSession.findMany({
      where: {
        therapistId,
        scheduledDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: { patientId: true },
      distinct: ['patientId']
    }).then(sessions => sessions.length),

    // New patients (first session in period)
    db.patientSession.findMany({
      where: {
        therapistId,
        scheduledDate: {
          gte: startDate,
          lte: endDate
        }
      },
      select: { patientId: true },
      distinct: ['patientId']
    }).then(async (sessions) => {
      const patientIds = sessions.map(s => s.patientId)
      const firstSessions = await db.patientSession.findMany({
        where: {
          therapistId,
          patientId: { in: patientIds }
        },
        select: { patientId: true, scheduledDate: true },
        orderBy: { scheduledDate: 'asc' }
      })
      
      const firstSessionDates = new Map()
      firstSessions.forEach(session => {
        if (!firstSessionDates.has(session.patientId)) {
          firstSessionDates.set(session.patientId, session.scheduledDate)
        }
      })
      
      return Array.from(firstSessionDates.entries()).filter(([_, date]) => 
        date >= startDate && date <= endDate
      ).length
    }),

    // Total revenue (from completed sessions)
    db.patientSession.findMany({
      where: {
        therapistId,
        scheduledDate: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed'
      },
      select: { 
        serviceAssignments: {
          select: {
            proposalService: {
              select: {
                service: {
                  select: { price: true }
                }
              }
            }
          }
        }
      }
    }).then(sessions => {
      return sessions.reduce((total, session) => {
        const sessionRevenue = session.serviceAssignments.reduce((sessionTotal, assignment) => {
          return sessionTotal + (assignment.proposalService.service.price || 0)
        }, 0)
        return total + sessionRevenue
      }, 0)
    }),

    // Average session duration
    db.patientSession.findMany({
      where: {
        therapistId,
        scheduledDate: {
          gte: startDate,
          lte: endDate
        },
        status: 'completed',
        duration: { not: null }
      },
      select: { duration: true }
    }).then(sessions => {
      if (sessions.length === 0) return 0
      const totalDuration = sessions.reduce((sum, session) => sum + (session.duration || 0), 0)
      return Math.round(totalDuration / sessions.length)
    })
  ])

  return {
    sessions: {
      total: totalSessions,
      completed: completedSessions,
      cancelled: cancelledSessions,
      upcoming: upcomingSessions,
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
    },
    patients: {
      total: totalPatients,
      new: newPatients
    },
    revenue: {
      total: totalRevenue,
      average: completedSessions > 0 ? Math.round(totalRevenue / completedSessions) : 0
    },
    performance: {
      averageSessionDuration: averageSessionDuration
    }
  }
}

// Helper function to get dashboard agenda
async function getDashboardAgenda(therapistId: string, startDate: Date, endDate: Date) {
  const sessions = await db.patientSession.findMany({
    where: {
      therapistId,
      scheduledDate: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
      },
      serviceAssignments: {
        include: {
          proposalService: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { scheduledDate: 'asc' }
  })

  // Group sessions by date
  const agendaByDate = new Map()
  sessions.forEach(session => {
    const dateKey = session.scheduledDate.toISOString().split('T')[0]
    if (!agendaByDate.has(dateKey)) {
      agendaByDate.set(dateKey, [])
    }
    agendaByDate.get(dateKey).push(session)
  })

  // Convert to array format
  const agenda = Array.from(agendaByDate.entries()).map(([date, sessions]) => ({
    date,
    sessions: sessions.map(session => ({
      id: session.id,
      scheduledDate: session.scheduledDate,
      scheduledTime: session.scheduledTime,
      duration: session.duration,
      status: session.status,
      sessionNotes: session.sessionNotes,
      therapistComments: session.therapistComments,
      patient: session.patient,
      services: session.serviceAssignments.map(sa => sa.proposalService.service)
    }))
  }))

  return agenda
}

// Helper function to get dashboard patients
async function getDashboardPatients(therapistId: string) {
  // Get recent patients (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentSessions = await db.patientSession.findMany({
    where: {
      therapistId,
      scheduledDate: {
        gte: thirtyDaysAgo
      }
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          dateOfBirth: true,
          gender: true
        }
      }
    },
    orderBy: { scheduledDate: 'desc' }
  })

  // Group by patient and get latest session info
  const patientMap = new Map()
  recentSessions.forEach(session => {
    if (!patientMap.has(session.patient.id)) {
      patientMap.set(session.patient.id, {
        patient: session.patient,
        lastSession: session,
        totalSessions: 0,
        nextSession: null
      })
    }
    patientMap.get(session.patient.id).totalSessions++
  })

  // Get total sessions and next sessions for each patient
  const patientIds = Array.from(patientMap.keys())
  
  const [totalSessions, nextSessions] = await Promise.all([
    // Total sessions per patient
    db.patientSession.groupBy({
      by: ['patientId'],
      where: {
        therapistId,
        patientId: { in: patientIds }
      },
      _count: { patientId: true }
    }),
    
    // Next sessions per patient
    db.patientSession.findMany({
      where: {
        therapistId,
        patientId: { in: patientIds },
        scheduledDate: { gte: new Date() },
        status: 'scheduled'
      },
      select: { patientId: true, scheduledDate: true, scheduledTime: true },
      orderBy: { scheduledDate: 'asc' }
    })
  ])

  // Update patient data with totals and next sessions
  totalSessions.forEach(total => {
    if (patientMap.has(total.patientId)) {
      patientMap.get(total.patientId).totalSessions = total._count.patientId
    }
  })

  nextSessions.forEach(session => {
    if (patientMap.has(session.patientId) && !patientMap.get(session.patientId).nextSession) {
      patientMap.get(session.patientId).nextSession = session
    }
  })

  return Array.from(patientMap.values()).map(patientData => ({
    ...patientData.patient,
    lastSession: {
      date: patientData.lastSession.scheduledDate,
      status: patientData.lastSession.status
    },
    totalSessions: patientData.totalSessions,
    nextSession: patientData.nextSession ? {
      date: patientData.nextSession.scheduledDate,
      time: patientData.nextSession.scheduledTime
    } : null
  }))
}
