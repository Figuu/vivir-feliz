import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const performanceQuerySchema = z.object({
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
  includeComparisons: z.string().transform(val => val === 'true').default(false),
  includeGoals: z.string().transform(val => val === 'true').default(false),
  includeTrends: z.string().transform(val => val === 'true').default(true)
})

const performanceGoalSchema = z.object({
  therapistId: z.string().uuid('Invalid therapist ID'),
  goalType: z.enum(['sessions', 'revenue', 'satisfaction', 'completion_rate', 'productivity']),
  targetValue: z.number().min(0),
  targetDate: z.string(), // ISO date string
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true)
})

// GET /api/therapist/performance-analytics - Get performance analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = performanceQuerySchema.safeParse({
      therapistId: searchParams.get('therapistId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      period: searchParams.get('period'),
      includeComparisons: searchParams.get('includeComparisons'),
      includeGoals: searchParams.get('includeGoals'),
      includeTrends: searchParams.get('includeTrends')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { therapistId, startDate, endDate, period, includeComparisons, includeGoals, includeTrends } = validation.data

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
          queryStartDate.setMonth(now.getMonth() - 1)
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

    // Get sessions data with comprehensive information
    const sessions = await db.patientSession.findMany({
      where: whereClause,
      include: {
        therapist: {
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
                    category: true
                  }
                }
              }
            }
          }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true
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
                    price: true,
                    category: true
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
        effectiveDate: { lte: queryEndDate },
        OR: [
          { endDate: { gte: queryStartDate } },
          { endDate: null }
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

    // Process performance data
    const performanceData = processPerformanceData(sessions, therapistSchedules, queryStartDate, queryEndDate)

    // Get performance comparisons if requested
    let comparisons = null
    if (includeComparisons) {
      comparisons = generatePerformanceComparisons(performanceData, period)
    }

    // Get performance goals if requested
    let goals = null
    if (includeGoals) {
      goals = await getPerformanceGoals(therapistId)
    }

    // Get performance trends if requested
    let trends = null
    if (includeTrends) {
      trends = generatePerformanceTrends(performanceData, period)
    }

    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: queryStartDate.toISOString(),
          endDate: queryEndDate.toISOString(),
          type: period
        },
        performance: performanceData,
        comparisons,
        goals,
        trends,
        summary: generatePerformanceSummary(performanceData)
      }
    })

  } catch (error) {
    console.error('Error fetching performance analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/therapist/performance-analytics - Create performance goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = performanceGoalSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { therapistId, goalType, targetValue, targetDate, description, isActive } = validation.data

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

    // For now, we'll store goals in a simple format
    // In a real implementation, you might want a dedicated goals table
    const goal = {
      id: `goal_${Date.now()}`,
      therapistId,
      goalType,
      targetValue,
      targetDate,
      description,
      isActive,
      createdAt: new Date(),
      progress: 0,
      status: 'active'
    }

    return NextResponse.json({
      success: true,
      message: 'Performance goal created successfully',
      data: { goal }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating performance goal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function processPerformanceData(sessions: any[], schedules: any[], startDate: Date, endDate: Date) {
  const therapistPerformance: { [key: string]: any } = {}

  // Initialize therapist data
  const therapists = [...new Set(sessions.map(s => s.therapist.id))]
  therapists.forEach(therapistId => {
    const therapist = sessions.find(s => s.therapist.id === therapistId)?.therapist
    therapistPerformance[therapistId] = {
      therapist,
      sessions: [],
      totalSessions: 0,
      completedSessions: 0,
      cancelledSessions: 0,
      totalHours: 0,
      totalRevenue: 0,
      averageSessionDuration: 0,
      completionRate: 0,
      averagePatientSatisfaction: 0,
      averageTherapistSatisfaction: 0,
      productivityScore: 0,
      qualityScore: 0,
      patientRetentionRate: 0,
      specialtyPerformance: {},
      monthlyTrends: [],
      performanceMetrics: {
        sessionsPerDay: 0,
        revenuePerSession: 0,
        revenuePerHour: 0,
        utilizationRate: 0,
        efficiencyScore: 0
      }
    }
  })

  // Process sessions
  sessions.forEach(session => {
    const therapistId = session.therapist.id
    const sessionDuration = session.actualDuration || session.duration
    const sessionRevenue = session.serviceAssignments.reduce((total: number, assignment: any) => {
      return total + (assignment.proposalService.service.price || 0)
    }, 0)

    therapistPerformance[therapistId].sessions.push({
      id: session.id,
      date: session.scheduledDate,
      duration: sessionDuration,
      status: session.status,
      revenue: sessionRevenue,
      patientSatisfaction: session.patientSatisfaction,
      therapistSatisfaction: session.therapistSatisfaction,
      patient: session.patient,
      services: session.serviceAssignments.map((sa: any) => sa.proposalService.service)
    })

    therapistPerformance[therapistId].totalSessions++
    therapistPerformance[therapistId].totalHours += sessionDuration / 60
    therapistPerformance[therapistId].totalRevenue += sessionRevenue

    if (session.status === 'completed') {
      therapistPerformance[therapistId].completedSessions++
    } else if (session.status === 'cancelled') {
      therapistPerformance[therapistId].cancelledSessions++
    }

    // Track specialty performance
    session.serviceAssignments.forEach((assignment: any) => {
      const service = assignment.proposalService.service
      const specialty = service.category || 'General'
      
      if (!therapistPerformance[therapistId].specialtyPerformance[specialty]) {
        therapistPerformance[therapistId].specialtyPerformance[specialty] = {
          sessions: 0,
          revenue: 0,
          averageSatisfaction: 0,
          totalSatisfaction: 0,
          satisfactionCount: 0
        }
      }
      
      therapistPerformance[therapistId].specialtyPerformance[specialty].sessions++
      therapistPerformance[therapistId].specialtyPerformance[specialty].revenue += service.price || 0
      
      if (session.patientSatisfaction) {
        therapistPerformance[therapistId].specialtyPerformance[specialty].totalSatisfaction += session.patientSatisfaction
        therapistPerformance[therapistId].specialtyPerformance[specialty].satisfactionCount++
      }
    })
  })

  // Calculate performance metrics
  Object.keys(therapistPerformance).forEach(therapistId => {
    const performance = therapistPerformance[therapistId]
    const daysInPeriod = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Basic metrics
    performance.completionRate = performance.totalSessions > 0 
      ? (performance.completedSessions / performance.totalSessions) * 100 
      : 0
    
    performance.averageSessionDuration = performance.totalSessions > 0 
      ? performance.totalHours / performance.totalSessions 
      : 0

    // Satisfaction scores
    const sessionsWithPatientSatisfaction = performance.sessions.filter(s => s.patientSatisfaction)
    const sessionsWithTherapistSatisfaction = performance.sessions.filter(s => s.therapistSatisfaction)
    
    performance.averagePatientSatisfaction = sessionsWithPatientSatisfaction.length > 0
      ? sessionsWithPatientSatisfaction.reduce((sum, s) => sum + s.patientSatisfaction, 0) / sessionsWithPatientSatisfaction.length
      : 0
    
    performance.averageTherapistSatisfaction = sessionsWithTherapistSatisfaction.length > 0
      ? sessionsWithTherapistSatisfaction.reduce((sum, s) => sum + s.therapistSatisfaction, 0) / sessionsWithTherapistSatisfaction.length
      : 0

    // Performance metrics
    performance.performanceMetrics.sessionsPerDay = daysInPeriod > 0 ? performance.totalSessions / daysInPeriod : 0
    performance.performanceMetrics.revenuePerSession = performance.totalSessions > 0 ? performance.totalRevenue / performance.totalSessions : 0
    performance.performanceMetrics.revenuePerHour = performance.totalHours > 0 ? performance.totalRevenue / performance.totalHours : 0
    
    // Calculate productivity score (0-100)
    const productivityFactors = {
      completionRate: performance.completionRate / 100,
      satisfactionScore: (performance.averagePatientSatisfaction + performance.averageTherapistSatisfaction) / 10,
      revenueEfficiency: Math.min(performance.performanceMetrics.revenuePerHour / 100, 1), // Normalize to 100/hour max
      sessionFrequency: Math.min(performance.performanceMetrics.sessionsPerDay / 8, 1) // Normalize to 8 sessions/day max
    }
    
    performance.productivityScore = Object.values(productivityFactors).reduce((sum, factor) => sum + factor, 0) / Object.keys(productivityFactors).length * 100

    // Calculate quality score (0-100)
    const qualityFactors = {
      completionRate: performance.completionRate / 100,
      patientSatisfaction: performance.averagePatientSatisfaction / 5,
      therapistSatisfaction: performance.averageTherapistSatisfaction / 5,
      retentionRate: 0.8 // Placeholder - would need patient return data
    }
    
    performance.qualityScore = Object.values(qualityFactors).reduce((sum, factor) => sum + factor, 0) / Object.keys(qualityFactors).length * 100

    // Calculate efficiency score
    performance.performanceMetrics.efficiencyScore = (performance.productivityScore + performance.qualityScore) / 2

    // Calculate specialty performance averages
    Object.keys(performance.specialtyPerformance).forEach(specialty => {
      const specialtyData = performance.specialtyPerformance[specialty]
      specialtyData.averageSatisfaction = specialtyData.satisfactionCount > 0 
        ? specialtyData.totalSatisfaction / specialtyData.satisfactionCount 
        : 0
    })

    // Generate monthly trends
    performance.monthlyTrends = generateMonthlyTrends(performance.sessions, startDate, endDate)
  })

  return Object.values(therapistPerformance)
}

function generateMonthlyTrends(sessions: any[], startDate: Date, endDate: Date) {
  const trends: any[] = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1)
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)
    
    const monthSessions = sessions.filter(s => {
      const sessionDate = new Date(s.date)
      return sessionDate >= monthStart && sessionDate <= monthEnd
    })
    
    const monthRevenue = monthSessions.reduce((sum, s) => sum + s.revenue, 0)
    const monthHours = monthSessions.reduce((sum, s) => sum + s.duration, 0) / 60
    const completedSessions = monthSessions.filter(s => s.status === 'completed').length
    const averageSatisfaction = monthSessions.filter(s => s.patientSatisfaction).length > 0
      ? monthSessions.filter(s => s.patientSatisfaction).reduce((sum, s) => sum + s.patientSatisfaction, 0) / monthSessions.filter(s => s.patientSatisfaction).length
      : 0
    
    trends.push({
      month: monthStart.toISOString().substring(0, 7),
      sessions: monthSessions.length,
      completedSessions,
      revenue: monthRevenue,
      hours: monthHours,
      averageSatisfaction,
      completionRate: monthSessions.length > 0 ? (completedSessions / monthSessions.length) * 100 : 0
    })
    
    current.setMonth(current.getMonth() + 1)
  }
  
  return trends
}

function generatePerformanceComparisons(performanceData: any[], period: string) {
  if (performanceData.length <= 1) return null
  
  const comparisons = {
    topPerformers: {
      productivity: performanceData.sort((a, b) => b.productivityScore - a.productivityScore).slice(0, 3),
      quality: performanceData.sort((a, b) => b.qualityScore - a.qualityScore).slice(0, 3),
      revenue: performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 3),
      satisfaction: performanceData.sort((a, b) => b.averagePatientSatisfaction - a.averagePatientSatisfaction).slice(0, 3)
    },
    averages: {
      productivity: performanceData.reduce((sum, p) => sum + p.productivityScore, 0) / performanceData.length,
      quality: performanceData.reduce((sum, p) => sum + p.qualityScore, 0) / performanceData.length,
      revenue: performanceData.reduce((sum, p) => sum + p.totalRevenue, 0) / performanceData.length,
      satisfaction: performanceData.reduce((sum, p) => sum + p.averagePatientSatisfaction, 0) / performanceData.length,
      completionRate: performanceData.reduce((sum, p) => sum + p.completionRate, 0) / performanceData.length
    }
  }
  
  return comparisons
}

async function getPerformanceGoals(therapistId?: string) {
  // Fetch performance goals from database if implemented
  // For now, return empty structure (no mock data)
  return {
    active: [],
    completed: [],
    overdue: []
  }
}

function generatePerformanceTrends(performanceData: any[], period: string) {
  const trends = {
    productivity: [],
    quality: [],
    revenue: [],
    satisfaction: []
  }
  
  // Generate trend data based on monthly trends
  performanceData.forEach(therapist => {
    therapist.monthlyTrends.forEach((month: any) => {
      trends.productivity.push({
        month: month.month,
        therapistId: therapist.therapist.id,
        therapistName: `${therapist.therapist.firstName} ${therapist.therapist.lastName}`,
        value: month.completionRate // Simplified productivity metric
      })
      
      trends.quality.push({
        month: month.month,
        therapistId: therapist.therapist.id,
        therapistName: `${therapist.therapist.firstName} ${therapist.therapist.lastName}`,
        value: month.averageSatisfaction
      })
      
      trends.revenue.push({
        month: month.month,
        therapistId: therapist.therapist.id,
        therapistName: `${therapist.therapist.firstName} ${therapist.therapist.lastName}`,
        value: month.revenue
      })
      
      trends.satisfaction.push({
        month: month.month,
        therapistId: therapist.therapist.id,
        therapistName: `${therapist.therapist.firstName} ${therapist.therapist.lastName}`,
        value: month.averageSatisfaction
      })
    })
  })
  
  return trends
}

function generatePerformanceSummary(performanceData: any[]) {
  const totalTherapists = performanceData.length
  const totalSessions = performanceData.reduce((sum, therapist) => sum + therapist.totalSessions, 0)
  const totalRevenue = performanceData.reduce((sum, therapist) => sum + therapist.totalRevenue, 0)
  const totalHours = performanceData.reduce((sum, therapist) => sum + therapist.totalHours, 0)
  
  const averageProductivity = totalTherapists > 0 
    ? performanceData.reduce((sum, therapist) => sum + therapist.productivityScore, 0) / totalTherapists 
    : 0
  
  const averageQuality = totalTherapists > 0 
    ? performanceData.reduce((sum, therapist) => sum + therapist.qualityScore, 0) / totalTherapists 
    : 0
  
  const averageSatisfaction = totalTherapists > 0 
    ? performanceData.reduce((sum, therapist) => sum + therapist.averagePatientSatisfaction, 0) / totalTherapists 
    : 0
  
  const averageCompletionRate = totalTherapists > 0 
    ? performanceData.reduce((sum, therapist) => sum + therapist.completionRate, 0) / totalTherapists 
    : 0
  
  return {
    totalTherapists,
    totalSessions,
    totalRevenue,
    totalHours,
    averageProductivity: Math.round(averageProductivity),
    averageQuality: Math.round(averageQuality),
    averageSatisfaction: Math.round(averageSatisfaction * 10) / 10,
    averageCompletionRate: Math.round(averageCompletionRate),
    averageRevenuePerTherapist: totalTherapists > 0 ? Math.round(totalRevenue / totalTherapists) : 0,
    averageSessionsPerTherapist: totalTherapists > 0 ? Math.round(totalSessions / totalTherapists) : 0
  }
}
