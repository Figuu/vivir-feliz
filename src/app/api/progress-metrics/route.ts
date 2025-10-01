import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Simplified validation schemas
const progressMetricQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'reportNumber']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

const progressMetricAnalyticsSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter']).optional().default('week')
})

// GET /api/progress-metrics - Get progress metrics (using ProgressReport data)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'analytics') {
      // Handle analytics request
      const validation = progressMetricAnalyticsSchema.safeParse({
        patientId: searchParams.get('patientId'),
        therapistId: searchParams.get('therapistId'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        groupBy: searchParams.get('groupBy')
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid analytics parameters', details: validation.error.issues },
          { status: 400 }
        )
      }

      const { patientId, therapistId, startDate, endDate, groupBy } = validation.data

      // Build where clause for analytics
      const whereClause: any = {}
      
      if (patientId) {
        whereClause.patientId = patientId
      }
      
      if (therapistId) {
        whereClause.therapistId = therapistId
      }
      
      if (startDate) {
        whereClause.createdAt = { gte: new Date(startDate) }
      }
      
      if (endDate) {
        whereClause.createdAt = { 
          ...whereClause.createdAt,
          lte: new Date(endDate) 
        }
      }

      // Get progress reports for analytics
      const progressReports = await db.progressReport.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          therapist: {
            select: {
              id: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          therapeuticPlan: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      })

      // Process analytics data
      const analytics = processAnalyticsData(progressReports, groupBy)

      return NextResponse.json({
        success: true,
        data: analytics
      })
    } else {
      // Handle regular metrics request
      const validation = progressMetricQuerySchema.safeParse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        patientId: searchParams.get('patientId'),
        therapistId: searchParams.get('therapistId'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        status: searchParams.get('status'),
        sortBy: searchParams.get('sortBy'),
        sortOrder: searchParams.get('sortOrder')
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: validation.error.issues },
          { status: 400 }
        )
      }

      const { page, limit, patientId, therapistId, startDate, endDate, status, sortBy, sortOrder } = validation.data

      // Build where clause
      const whereClause: any = {}
      
      if (patientId) {
        whereClause.patientId = patientId
      }
      
      if (therapistId) {
        whereClause.therapistId = therapistId
      }
      
      if (startDate) {
        whereClause.createdAt = { gte: new Date(startDate) }
      }
      
      if (endDate) {
        whereClause.createdAt = { 
          ...whereClause.createdAt,
          lte: new Date(endDate) 
        }
      }
      
      if (status) {
        whereClause.status = status
      }

      // Calculate pagination
      const skip = (page - 1) * limit

      // Get progress reports with related data
      const [reports, totalCount] = await Promise.all([
        db.progressReport.findMany({
          where: whereClause,
          include: {
            patient: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            therapist: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            therapeuticPlan: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        db.progressReport.count({ where: whereClause })
      ])

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1

      return NextResponse.json({
        success: true,
        data: {
          reports: reports.map(report => ({
            id: report.id,
            reportNumber: report.reportNumber,
            progress: report.progress,
            observations: report.observations,
            status: report.status,
            coordinatorNotes: report.coordinatorNotes,
            patient: report.patient,
            therapist: report.therapist,
            therapeuticPlan: report.therapeuticPlan,
            createdAt: report.createdAt,
            updatedAt: report.updatedAt
          })),
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNextPage,
            hasPrevPage
          },
          filters: {
            patientId,
            therapistId,
            startDate,
            endDate,
            status,
            sortBy,
            sortOrder
          }
        }
      })
    }

  } catch (error) {
    console.error('Error fetching progress metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to process analytics data
function processAnalyticsData(reports: any[], groupBy: string) {
  const analytics: any = {
    summary: {
      totalReports: reports.length,
      dateRange: {
        start: reports.length > 0 ? reports[0].createdAt : null,
        end: reports.length > 0 ? reports[reports.length - 1].createdAt : null
      }
    }
  }

  // Calculate status distribution
  const statusDistribution: any = {}
  reports.forEach(report => {
    statusDistribution[report.status] = (statusDistribution[report.status] || 0) + 1
  })

  analytics.statusDistribution = statusDistribution

  // Group data by time period
  analytics.trends = groupReportsByTime(reports, groupBy)

  // Group by patient
  analytics.byPatient = groupReportsByPatient(reports)

  return analytics
}

function groupReportsByTime(reports: any[], groupBy: string) {
  const groups: any = {}
  
  reports.forEach(report => {
    const date = new Date(report.createdAt)
    let key: string
    
    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        key = `${date.getFullYear()}-Q${quarter}`
        break
      default:
        key = date.toISOString().split('T')[0]
    }
    
    if (!groups[key]) {
      groups[key] = {
        period: key,
        count: 0,
        reports: []
      }
    }
    groups[key].count++
    groups[key].reports.push(report)
  })
  
  return Object.values(groups)
}

function groupReportsByPatient(reports: any[]) {
  const groups: any = {}
  
  reports.forEach(report => {
    const patientId = report.patientId
    if (!groups[patientId]) {
      groups[patientId] = {
        patient: report.patient,
        reports: []
      }
    }
    groups[patientId].reports.push(report)
  })
  
  return groups
}