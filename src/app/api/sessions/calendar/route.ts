import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const calendarQuerySchema = z.object({
  role: z.enum(['ADMIN', 'THERAPIST', 'PARENT', 'PATIENT']),
  userId: z.string().uuid().optional(),
  date: z.string().datetime(),
  status: z.string().optional(),
  therapistId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  search: z.string().optional(),
  view: z.enum(['month', 'week', 'day', 'agenda']).default('month')
})

// GET /api/sessions/calendar - Get sessions for calendar view
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = calendarQuerySchema.safeParse({
      role: searchParams.get('role'),
      userId: searchParams.get('userId'),
      date: searchParams.get('date'),
      status: searchParams.get('status'),
      therapistId: searchParams.get('therapistId'),
      serviceId: searchParams.get('serviceId'),
      search: searchParams.get('search'),
      view: searchParams.get('view') || 'month'
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { role, userId, date, status, therapistId, serviceId, search, view } = validation.data

    // Build where clause based on role and filters
    const whereClause = await buildWhereClause(role, userId, date, view, {
      status,
      therapistId,
      serviceId,
      search
    })

    // Get sessions
    const sessions = await db.patientSession.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        serviceAssignment: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { scheduledTime: 'asc' }
      ]
    })

    // Get calendar statistics
    const stats = await getCalendarStats(role, userId, date, view, whereClause)

    // Get role-specific data
    const roleData = await getRoleSpecificData(role, userId, sessions)

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        stats,
        roleData,
        filters: {
          role,
          userId,
          date,
          status,
          therapistId,
          serviceId,
          search,
          view
        }
      }
    })

  } catch (error) {
    console.error('Error fetching calendar data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function buildWhereClause(
  role: string,
  userId: string | undefined,
  date: string,
  view: string,
  filters: {
    status?: string
    therapistId?: string
    serviceId?: string
    search?: string
  }
): Promise<any> {
  const baseDate = new Date(date)
  let dateRange: { gte: Date; lte: Date }

  // Calculate date range based on view
  switch (view) {
    case 'month':
      const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
      const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)
      dateRange = {
        gte: monthStart,
        lte: monthEnd
      }
      break
    case 'week':
      const weekStart = new Date(baseDate)
      weekStart.setDate(baseDate.getDate() - baseDate.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      dateRange = {
        gte: weekStart,
        lte: weekEnd
      }
      break
    case 'day':
      const dayStart = new Date(baseDate)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(baseDate)
      dayEnd.setHours(23, 59, 59, 999)
      dateRange = {
        gte: dayStart,
        lte: dayEnd
      }
      break
    case 'agenda':
      // For agenda view, show sessions for the next 30 days
      const agendaStart = new Date()
      const agendaEnd = new Date()
      agendaEnd.setDate(agendaStart.getDate() + 30)
      dateRange = {
        gte: agendaStart,
        lte: agendaEnd
      }
      break
    default:
      dateRange = {
        gte: baseDate,
        lte: baseDate
      }
  }

  const whereClause: any = {
    scheduledDate: dateRange
  }

  // Role-based filtering
  switch (role) {
    case 'ADMIN':
      // Admin can see all sessions
      break
    case 'THERAPIST':
      if (userId) {
        whereClause.therapistId = userId
      }
      break
    case 'PARENT':
      if (userId) {
        whereClause.patient = {
          parentId: userId
        }
      }
      break
    case 'PATIENT':
      if (userId) {
        whereClause.patientId = userId
      }
      break
  }

  // Apply additional filters
  if (filters.status) {
    whereClause.status = filters.status
  }

  if (filters.therapistId) {
    whereClause.therapistId = filters.therapistId
  }

  if (filters.serviceId) {
    whereClause.serviceAssignment = {
      some: {
        serviceId: filters.serviceId
      }
    }
  }

  if (filters.search) {
    const searchTerm = filters.search.toLowerCase()
    whereClause.OR = [
      {
        patient: {
          firstName: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      },
      {
        patient: {
          lastName: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      },
      {
        therapist: {
          firstName: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      },
      {
        therapist: {
          lastName: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      },
      {
        serviceAssignment: {
          some: {
            service: {
              name: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          }
        }
      }
    ]
  }

  return whereClause
}

async function getCalendarStats(
  role: string,
  userId: string | undefined,
  date: string,
  view: string,
  whereClause: any
): Promise<any> {
  try {
    const baseDate = new Date(date)
    let dateRange: { gte: Date; lte: Date }

    // Calculate date range for stats
    switch (view) {
      case 'month':
        const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
        const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)
        dateRange = { gte: monthStart, lte: monthEnd }
        break
      case 'week':
        const weekStart = new Date(baseDate)
        weekStart.setDate(baseDate.getDate() - baseDate.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        dateRange = { gte: weekStart, lte: weekEnd }
        break
      case 'day':
        const dayStart = new Date(baseDate)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(baseDate)
        dayEnd.setHours(23, 59, 59, 999)
        dateRange = { gte: dayStart, lte: dayEnd }
        break
      default:
        dateRange = { gte: baseDate, lte: baseDate }
    }

    // Get status breakdown
    const statusBreakdown = await db.patientSession.groupBy({
      by: ['status'],
      where: {
        ...whereClause,
        scheduledDate: dateRange
      },
      _count: {
        id: true
      }
    })

    // Get total sessions
    const totalSessions = await db.patientSession.count({
      where: {
        ...whereClause,
        scheduledDate: dateRange
      }
    })

    // Get today's sessions
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const todaySessions = await db.patientSession.count({
      where: {
        ...whereClause,
        scheduledDate: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    // Get upcoming sessions (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const upcomingSessions = await db.patientSession.count({
      where: {
        ...whereClause,
        scheduledDate: {
          gte: new Date(),
          lte: nextWeek
        }
      }
    })

    // Get overdue sessions (past sessions that are still scheduled)
    const overdueSessions = await db.patientSession.count({
      where: {
        ...whereClause,
        scheduledDate: {
          lt: new Date()
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    })

    return {
      total: totalSessions,
      today: todaySessions,
      upcoming: upcomingSessions,
      overdue: overdueSessions,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item.status] = item._count.id
        return acc
      }, {} as Record<string, number>)
    }

  } catch (error) {
    console.error('Error getting calendar stats:', error)
    return {
      total: 0,
      today: 0,
      upcoming: 0,
      overdue: 0,
      statusBreakdown: {}
    }
  }
}

async function getRoleSpecificData(role: string, userId: string | undefined, sessions: any[]): Promise<any> {
  try {
    switch (role) {
      case 'ADMIN':
        // Get all therapists and services for admin
        const [therapists, services] = await Promise.all([
          db.therapist.findMany({
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }),
          db.service.findMany({
            select: {
              id: true,
              name: true,
              type: true
            }
          })
        ])

        return {
          therapists,
          services,
          totalTherapists: therapists.length,
          totalServices: services.length
        }

      case 'THERAPIST':
        if (!userId) return {}

        // Get therapist's patients and services
        const [patients, therapistServices] = await Promise.all([
          db.patient.findMany({
            where: {
              sessions: {
                some: {
                  therapistId: userId
                }
              }
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              parent: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true
                }
              }
            }
          }),
          db.service.findMany({
            where: {
              serviceAssignments: {
                some: {
                  session: {
                    therapistId: userId
                  }
                }
              }
            },
            select: {
              id: true,
              name: true,
              type: true
            }
          })
        ])

        return {
          patients,
          services: therapistServices,
          totalPatients: patients.length,
          totalServices: therapistServices.length
        }

      case 'PARENT':
        if (!userId) return {}

        // Get parent's children and their therapists
        const [children, childTherapists] = await Promise.all([
          db.patient.findMany({
            where: {
              parentId: userId
            },
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }),
          db.therapist.findMany({
            where: {
              sessions: {
                some: {
                  patient: {
                    parentId: userId
                  }
                }
              }
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          })
        ])

        return {
          children,
          therapists: childTherapists,
          totalChildren: children.length,
          totalTherapists: childTherapists.length
        }

      case 'PATIENT':
        if (!userId) return {}

        // Get patient's therapist and services
        const [therapist, patientServices] = await Promise.all([
          db.therapist.findFirst({
            where: {
              sessions: {
                some: {
                  patientId: userId
                }
              }
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }),
          db.service.findMany({
            where: {
              serviceAssignments: {
                some: {
                  session: {
                    patientId: userId
                  }
                }
              }
            },
            select: {
              id: true,
              name: true,
              type: true
            }
          })
        ])

        return {
          therapist,
          services: patientServices,
          totalServices: patientServices.length
        }

      default:
        return {}
    }

  } catch (error) {
    console.error('Error getting role-specific data:', error)
    return {}
  }
}
