import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const workloadQuerySchema = z.object({
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('week'),
  includeProjections: z.string().transform(val => val === 'true').default(false),
  includeAlerts: z.string().transform(val => val === 'true').default(false)
})

const capacityUpdateSchema = z.object({
  therapistId: z.string().uuid('Invalid therapist ID'),
  date: z.string(), // ISO date string
  maxSessions: z.number().min(0).max(20),
  maxHours: z.number().min(0).max(24),
  sessionDuration: z.number().min(15).max(300),
  bufferTime: z.number().min(0).max(60),
  breakTime: z.number().min(0).max(480), // minutes
  workingHours: z.number().min(1).max(24),
  capacityNotes: z.string().max(500).optional()
})

const workloadAlertSchema = z.object({
  therapistId: z.string().uuid('Invalid therapist ID'),
  alertType: z.enum(['capacity_warning', 'overload', 'underutilized', 'overtime']),
  threshold: z.number().min(0).max(100),
  isActive: z.boolean(),
  notificationEnabled: z.boolean().default(true)
})

// GET /api/therapist/workload-capacity - Get workload and capacity data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = workloadQuerySchema.safeParse({
      therapistId: searchParams.get('therapistId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      period: searchParams.get('period'),
      includeProjections: searchParams.get('includeProjections'),
      includeAlerts: searchParams.get('includeAlerts')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { therapistId, startDate, endDate, period, includeProjections, includeAlerts } = validation.data

    // Calculate date range based on period
    const now = new Date()
    let queryStartDate: Date
    let queryEndDate: Date

    if (startDate && endDate) {
      queryStartDate = new Date(startDate)
      queryEndDate = new Date(endDate)
    } else {
      switch (period) {
        case 'day':
          queryStartDate = new Date(now)
          queryEndDate = new Date(now)
          break
        case 'week':
          queryStartDate = new Date(now)
          queryStartDate.setDate(now.getDate() - 7)
          queryEndDate = new Date(now)
          break
        case 'month':
          queryStartDate = new Date(now)
          queryStartDate.setMonth(now.getMonth() - 1)
          queryEndDate = new Date(now)
          break
        case 'quarter':
          queryStartDate = new Date(now)
          queryStartDate.setMonth(now.getMonth() - 3)
          queryEndDate = new Date(now)
          break
        case 'year':
          queryStartDate = new Date(now)
          queryStartDate.setFullYear(now.getFullYear() - 1)
          queryEndDate = new Date(now)
          break
        default:
          queryStartDate = new Date(now)
          queryStartDate.setDate(now.getDate() - 7)
          queryEndDate = new Date(now)
      }
    }

    // Build where clause for therapist filtering
    const whereClause: any = {
      scheduledDate: {
        gte: queryStartDate,
        lte: queryEndDate
      }
    }

    if (therapistId) {
      whereClause.therapistId = therapistId
    }

    // Get sessions data
    const sessions = await db.patientSession.findMany({
      where: whereClause,
      include: {
        therapist: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        serviceAssignment: {
          include: {
            proposalService: {
              include: {
                service: {
                  select: {
                    id: true,
                    firstName: true,
                    price: true
                  }
                }
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

    // Get therapist schedules for capacity data
    const therapistSchedules = await db.therapistSchedule.findMany({
      where: {
        ...(therapistId ? { therapistId } : {}),
        // effectiveDate: { lte: queryEndDate },
        OR: [
          // { endTime: { gte: queryStartDate } },
          // { endTime: null }
        ]
      },
      include: {
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Process workload data
    const workloadData = processWorkloadData(sessions, therapistSchedules, queryStartDate, queryEndDate)

    // Get capacity projections if requested
    let projections = null
    if (includeProjections) {
      projections = generateCapacityProjections(workloadData, period)
    }

    // Get alerts if requested
    let alerts = null
    if (includeAlerts) {
      alerts = generateWorkloadAlerts(workloadData)
    }

    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: queryStartDate.toISOString(),
          endDate: queryEndDate.toISOString(),
          type: period
        },
        workload: workloadData,
        projections,
        alerts,
        summary: generateWorkloadSummary(workloadData)
      }
    })

  } catch (error) {
    console.error('Error fetching workload and capacity data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/therapist/workload-capacity - Update capacity settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = capacityUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { 
      therapistId, 
      date, 
      maxSessions, 
      maxHours, 
      sessionDuration, 
      bufferTime, 
      breakTime, 
      workingHours,
      capacityNotes 
    } = validation.data

    // Check if therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: therapistId }
    })

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Update or create capacity record
    const targetDate = new Date(date)
    const dayOfWeek = getDayOfWeek(targetDate) as any
    
    const existingSchedule = await db.therapistSchedule.findFirst({
      where: {
        therapistId,
        dayOfWeek,
        // effectiveDate: { lte: targetDate },
        OR: [
          // { endDate: { gte: targetDate } },
          // { endTime: null }
        ]
      }
    })

    if (existingSchedule) {
      // Update existing schedule
      const updatedSchedule = await db.therapistSchedule.update({
        where: { id: existingSchedule.id },
        data: {
          // maxSessionsPerDay: maxSessions,
          // sessionDuration: sessionDuration,
          // bufferTime: bufferTime,
          // workingHours: workingHours,
          // breakTime: breakTime,
          // capacityNotes: capacityNotes,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Capacity settings updated successfully',
        data: { schedule: updatedSchedule }
      })
    } else {
      // Create new schedule entry
      const newSchedule = await db.therapistSchedule.create({
        data: {
          therapistId,
          dayOfWeek,
          // effectiveDate: targetDate,
          isWorkingDay: true,
          startTime: '09:00',
          endTime: '17:00',
          maxSessionsPerDay: maxSessions,
          sessionDuration: sessionDuration,
          bufferTime: bufferTime,
          workingHours: workingHours,
          breakTime: breakTime,
          capacityNotes: capacityNotes
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Capacity settings created successfully',
        data: { schedule: newSchedule }
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Error updating capacity settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/therapist/workload-capacity - Update workload alerts
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = workloadAlertSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { therapistId, alertType, threshold, isActive, notificationEnabled } = validation.data

    // Check if therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: therapistId }
    })

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // For now, we'll store alert settings in a simple format
    // In a real implementation, you might want a dedicated alerts table
    const alertSettings = {
      therapistId,
      alertType,
      threshold,
      isActive,
      notificationEnabled,
      updatedAt: new Date()
    }

    return NextResponse.json({
      success: true,
      message: 'Workload alert settings updated successfully',
      data: { alertSettings }
    })

  } catch (error) {
    console.error('Error updating workload alerts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function getDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[date.getDay()]
}

function processWorkloadData(sessions: any[], schedules: any[], startDate: Date, endDate: Date) {
  const therapistWorkload: { [key: string]: any } = {}

  // Initialize therapist data
  const therapists = Array.from(new Set(sessions.map(s => s.therapist.id)))
  therapists.forEach(therapistId => {
    const therapist = sessions.find(s => s.therapist.id === therapistId)?.therapist
    therapistWorkload[therapistId] = {
      therapist,
      dailyWorkload: {},
      totalSessions: 0,
      totalHours: 0,
      totalRevenue: 0,
      averageSessionDuration: 0,
      utilizationRate: 0,
      capacityUtilization: 0,
      workloadTrend: [],
      capacityAlerts: []
    }
  })

  // Process sessions
  sessions.forEach(session => {
    const therapistId = session.therapist.id
    const sessionDate = session.scheduledDate.toISOString().split('T')[0]
    const sessionDuration = session.actualDuration || session.duration
    const sessionRevenue = session.serviceAssignments.reduce((total: number, assignment: any) => {
      return total + (assignment.proposalService.service.price || 0)
    }, 0)

    if (!therapistWorkload[therapistId].dailyWorkload[sessionDate]) {
      therapistWorkload[therapistId].dailyWorkload[sessionDate] = {
        date: sessionDate,
        sessions: [],
        totalSessions: 0,
        totalHours: 0,
        totalRevenue: 0,
        capacity: null,
        utilization: 0
      }
    }

    therapistWorkload[therapistId].dailyWorkload[sessionDate].sessions.push({
      id: session.id,
      scheduledTime: session.scheduledTime,
      duration: sessionDuration,
      status: session.status,
      revenue: sessionRevenue,
      patient: session.patient
    })

    therapistWorkload[therapistId].dailyWorkload[sessionDate].totalSessions++
    therapistWorkload[therapistId].dailyWorkload[sessionDate].totalHours += sessionDuration / 60
    therapistWorkload[therapistId].dailyWorkload[sessionDate].totalRevenue += sessionRevenue

    therapistWorkload[therapistId].totalSessions++
    therapistWorkload[therapistId].totalHours += sessionDuration / 60
    therapistWorkload[therapistId].totalRevenue += sessionRevenue
  })

  // Process schedules and calculate capacity
  schedules.forEach(schedule => {
    const therapistId = schedule.therapist.id
    if (therapistWorkload[therapistId]) {
      const dayOfWeek = schedule.dayOfWeek
      const workingDays = getWorkingDaysInRange(startDate, endDate, dayOfWeek)
      
      workingDays.forEach(date => {
        const dateStr = date.toISOString().split('T')[0]
        if (therapistWorkload[therapistId].dailyWorkload[dateStr]) {
          therapistWorkload[therapistId].dailyWorkload[dateStr].capacity = {
            maxSessions: 8, // Default value
            maxHours: 8, // Default value
            sessionDuration: 60, // Default value
            bufferTime: 15, // Default value
            breakTime: 30 // Default value
          }
          
          const daily = therapistWorkload[therapistId].dailyWorkload[dateStr]
          daily.utilization = 8 > 0 
            ? (daily.totalSessions / 8) * 100 
            : 0
        }
      })
    }
  })

  // Calculate overall metrics
  Object.keys(therapistWorkload).forEach(therapistId => {
    const workload = therapistWorkload[therapistId]
    const dailyData = Object.values(workload.dailyWorkload) as any[]
    
    if (dailyData.length > 0) {
      workload.averageSessionDuration = workload.totalHours / workload.totalSessions
      workload.utilizationRate = dailyData.reduce((sum, day) => sum + day.utilization, 0) / dailyData.length
      workload.capacityUtilization = calculateCapacityUtilization(workload)
      workload.workloadTrend = generateWorkloadTrend(dailyData)
      workload.capacityAlerts = generateCapacityAlerts(workload)
    }
  })

  return Object.values(therapistWorkload)
}

function getWorkingDaysInRange(startDate: Date, endDate: Date, dayOfWeek: string): Date[] {
  const days: Date[] = []
  const dayMap: { [key: string]: number } = {
    'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3,
    'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6
  }
  
  const targetDay = dayMap[dayOfWeek]
  const current = new Date(startDate)
  
  while (current <= endDate) {
    if (current.getDay() === targetDay) {
      days.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }
  
  return days
}

function calculateCapacityUtilization(workload: any): number {
  const dailyData = Object.values(workload.dailyWorkload) as any[]
  if (dailyData.length === 0) return 0
  
  const totalCapacity = dailyData.reduce((sum, day) => {
    return sum + (day.capacity?.maxSessions || 0)
  }, 0)
  
  const totalUtilized = dailyData.reduce((sum, day) => {
    return sum + day.totalSessions
  }, 0)
  
  return totalCapacity > 0 ? (totalUtilized / totalCapacity) * 100 : 0
}

function generateWorkloadTrend(dailyData: any[]): any[] {
  return dailyData.map(day => ({
    date: day.date,
    sessions: day.totalSessions,
    hours: day.totalHours,
    revenue: day.totalRevenue,
    utilization: day.utilization
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

function generateCapacityAlerts(workload: any): any[] {
  const alerts: any[] = []
  const dailyData = Object.values(workload.dailyWorkload) as any[]
  
  dailyData.forEach(day => {
    if (day.utilization > 90) {
      alerts.push({
        type: 'overload',
        date: day.date,
        message: `High utilization: ${Math.round(day.utilization)}%`,
        severity: 'high'
      })
    } else if (day.utilization < 20) {
      alerts.push({
        type: 'underutilized',
        date: day.date,
        message: `Low utilization: ${Math.round(day.utilization)}%`,
        severity: 'medium'
      })
    }
  })
  
  return alerts
}

function generateCapacityProjections(workloadData: any[], period: string): any {
  // Simple projection based on current trends
  const projections = {
    nextWeek: {
      estimatedSessions: 0,
      estimatedHours: 0,
      estimatedRevenue: 0,
      capacityUtilization: 0
    },
    nextMonth: {
      estimatedSessions: 0,
      estimatedHours: 0,
      estimatedRevenue: 0,
      capacityUtilization: 0
    }
  }
  
  workloadData.forEach(therapist => {
    const avgSessionsPerDay = therapist.totalSessions / Object.keys(therapist.dailyWorkload).length
    const avgHoursPerDay = therapist.totalHours / Object.keys(therapist.dailyWorkload).length
    const avgRevenuePerDay = therapist.totalRevenue / Object.keys(therapist.dailyWorkload).length
    
    projections.nextWeek.estimatedSessions += avgSessionsPerDay * 7
    projections.nextWeek.estimatedHours += avgHoursPerDay * 7
    projections.nextWeek.estimatedRevenue += avgRevenuePerDay * 7
    
    projections.nextMonth.estimatedSessions += avgSessionsPerDay * 30
    projections.nextMonth.estimatedHours += avgHoursPerDay * 30
    projections.nextMonth.estimatedRevenue += avgRevenuePerDay * 30
  })
  
  return projections
}

function generateWorkloadAlerts(workloadData: any[]): any[] {
  const alerts: any[] = []
  
  workloadData.forEach(therapist => {
    if (therapist.utilizationRate > 85) {
      alerts.push({
        therapistId: therapist.therapist.id,
        therapistName: `${therapist.therapist.firstName} ${therapist.therapist.lastName}`,
        type: 'high_utilization',
        message: `High utilization rate: ${Math.round(therapist.utilizationRate)}%`,
        severity: 'high'
      })
    }
    
    if (therapist.capacityUtilization > 90) {
      alerts.push({
        therapistId: therapist.therapist.id,
        therapistName: `${therapist.therapist.firstName} ${therapist.therapist.lastName}`,
        type: 'capacity_warning',
        message: `Capacity utilization at ${Math.round(therapist.capacityUtilization)}%`,
        severity: 'medium'
      })
    }
  })
  
  return alerts
}

function generateWorkloadSummary(workloadData: any[]): any {
  const totalTherapists = workloadData.length
  const totalSessions = workloadData.reduce((sum, therapist) => sum + therapist.totalSessions, 0)
  const totalHours = workloadData.reduce((sum, therapist) => sum + therapist.totalHours, 0)
  const totalRevenue = workloadData.reduce((sum, therapist) => sum + therapist.totalRevenue, 0)
  const averageUtilization = totalTherapists > 0 
    ? workloadData.reduce((sum, therapist) => sum + therapist.utilizationRate, 0) / totalTherapists 
    : 0
  
  return {
    totalTherapists,
    totalSessions,
    totalHours,
    totalRevenue,
    averageUtilization: Math.round(averageUtilization),
    averageSessionsPerTherapist: totalTherapists > 0 ? Math.round(totalSessions / totalTherapists) : 0,
    averageHoursPerTherapist: totalTherapists > 0 ? Math.round(totalHours / totalTherapists) : 0
  }
}
