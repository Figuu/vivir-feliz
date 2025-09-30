import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const progressMetricCreateSchema = z.object({
  // Basic Information
  patientId: z.string().uuid('Invalid patient ID'),
  therapistId: z.string().uuid('Invalid therapist ID'),
  metricId: z.string().uuid('Invalid metric ID'),
  sessionId: z.string().uuid('Invalid session ID').optional(),
  
  // Metric Data
  value: z.union([
    z.number(),
    z.string(),
    z.boolean()
  ]),
  
  measurementDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Measurement date must be in YYYY-MM-DD format')
    .transform(val => new Date(val)),
  
  measurementTime: z.string()
    .regex(/^\d{2}:\d{2}$/, 'Measurement time must be in HH:MM format')
    .optional(),
  
  // Context
  context: z.string()
    .max(500, 'Context cannot exceed 500 characters')
    .optional()
    .transform(val => val?.trim()),
  
  notes: z.string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  // Validation
  isValidated: z.boolean().default(false),
  validatedBy: z.string().uuid('Invalid validator ID').optional(),
  validationDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Validation date must be in YYYY-MM-DD format')
    .transform(val => new Date(val))
    .optional(),
  
  // Status
  status: z.enum(['active', 'archived', 'flagged', 'corrected']).default('active'),
  
  isBaseline: z.boolean().default(false)
})

const progressMetricUpdateSchema = progressMetricCreateSchema.partial()

const progressMetricQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  metricId: z.string().uuid('Invalid metric ID').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  status: z.enum(['active', 'archived', 'flagged', 'corrected']).optional(),
  isValidated: z.string().transform(val => val === 'true').optional(),
  isBaseline: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['measurementDate', 'createdAt', 'value', 'status']).optional().default('measurementDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

const progressMetricAnalyticsSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  metricId: z.string().uuid('Invalid metric ID').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter']).optional().default('week'),
  includeTrends: z.string().transform(val => val === 'true').optional().default(true),
  includeStatistics: z.string().transform(val => val === 'true').optional().default(true)
})

// GET /api/progress-metrics - Get progress metrics with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'analytics') {
      // Handle analytics request
      const validation = progressMetricAnalyticsSchema.safeParse({
        patientId: searchParams.get('patientId'),
        therapistId: searchParams.get('therapistId'),
        metricId: searchParams.get('metricId'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        groupBy: searchParams.get('groupBy'),
        includeTrends: searchParams.get('includeTrends'),
        includeStatistics: searchParams.get('includeStatistics')
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid analytics parameters', details: validation.error.issues },
          { status: 400 }
        )
      }

      const { patientId, therapistId, metricId, startDate, endDate, groupBy, includeTrends, includeStatistics } = validation.data

      // Build where clause for analytics
      const whereClause: any = {}
      
      if (patientId) {
        whereClause.patientId = patientId
      }
      
      if (therapistId) {
        whereClause.therapistId = therapistId
      }
      
      if (metricId) {
        whereClause.metricId = metricId
      }
      
      if (startDate) {
        whereClause.measurementDate = { gte: new Date(startDate) }
      }
      
      if (endDate) {
        whereClause.measurementDate = { 
          ...whereClause.measurementDate,
          lte: new Date(endDate) 
        }
      }

      // Get metrics for analytics
      const metrics = await db.progressMetric.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          therapist: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          metric: {
            select: {
              id: true,
              name: true,
              type: true,
              unit: true,
              minValue: true,
              maxValue: true
            }
          }
        },
        orderBy: { measurementDate: 'asc' }
      })

      // Process analytics data
      const analytics = processAnalyticsData(metrics, groupBy, includeTrends, includeStatistics)

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
        metricId: searchParams.get('metricId'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        status: searchParams.get('status'),
        isValidated: searchParams.get('isValidated'),
        isBaseline: searchParams.get('isBaseline'),
        sortBy: searchParams.get('sortBy'),
        sortOrder: searchParams.get('sortOrder')
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: validation.error.issues },
          { status: 400 }
        )
      }

      const { page, limit, patientId, therapistId, metricId, startDate, endDate, status, isValidated, isBaseline, sortBy, sortOrder } = validation.data

      // Build where clause
      const whereClause: any = {}
      
      if (patientId) {
        whereClause.patientId = patientId
      }
      
      if (therapistId) {
        whereClause.therapistId = therapistId
      }
      
      if (metricId) {
        whereClause.metricId = metricId
      }
      
      if (startDate) {
        whereClause.measurementDate = { gte: new Date(startDate) }
      }
      
      if (endDate) {
        whereClause.measurementDate = { 
          ...whereClause.measurementDate,
          lte: new Date(endDate) 
        }
      }
      
      if (status) {
        whereClause.status = status
      }
      
      if (isValidated !== undefined) {
        whereClause.isValidated = isValidated
      }
      
      if (isBaseline !== undefined) {
        whereClause.isBaseline = isBaseline
      }

      // Calculate pagination
      const skip = (page - 1) * limit

      // Get progress metrics with related data
      const [metrics, totalCount] = await Promise.all([
        db.progressMetric.findMany({
          where: whereClause,
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            therapist: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            metric: {
              select: {
                id: true,
                name: true,
                type: true,
                unit: true,
                minValue: true,
                maxValue: true
              }
            },
            session: {
              select: {
                id: true,
                scheduledDate: true,
                scheduledTime: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        db.progressMetric.count({ where: whereClause })
      ])

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1

      return NextResponse.json({
        success: true,
        data: {
          metrics: metrics.map(metric => ({
            id: metric.id,
            value: metric.value,
            measurementDate: metric.measurementDate,
            measurementTime: metric.measurementTime,
            context: metric.context,
            notes: metric.notes,
            isValidated: metric.isValidated,
            validatedBy: metric.validatedBy,
            validationDate: metric.validationDate,
            status: metric.status,
            isBaseline: metric.isBaseline,
            patient: metric.patient,
            therapist: metric.therapist,
            metric: metric.metric,
            session: metric.session,
            createdAt: metric.createdAt,
            updatedAt: metric.updatedAt
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
            metricId,
            startDate,
            endDate,
            status,
            isValidated,
            isBaseline,
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

// POST /api/progress-metrics - Create a new progress metric
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = progressMetricCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if patient exists
    const patient = await db.patient.findUnique({
      where: { id: validatedData.patientId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Check if therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: validatedData.therapistId }
    })

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Check if metric exists
    const metric = await db.therapeuticMetric.findUnique({
      where: { id: validatedData.metricId }
    })

    if (!metric) {
      return NextResponse.json(
        { error: 'Metric not found' },
        { status: 404 }
      )
    }

    // Validate metric value based on type
    if (metric.type === 'numeric' && typeof validatedData.value !== 'number') {
      return NextResponse.json(
        { error: `Metric "${metric.name}" requires a numeric value` },
        { status: 400 }
      )
    }

    if (metric.type === 'boolean' && typeof validatedData.value !== 'boolean') {
      return NextResponse.json(
        { error: `Metric "${metric.name}" requires a boolean value` },
        { status: 400 }
      )
    }

    if (metric.type === 'text' && typeof validatedData.value !== 'string') {
      return NextResponse.json(
        { error: `Metric "${metric.name}" requires a text value` },
        { status: 400 }
      )
    }

    // Validate numeric ranges
    if (metric.type === 'numeric' && typeof validatedData.value === 'number') {
      if (metric.minValue !== undefined && validatedData.value < metric.minValue) {
        return NextResponse.json(
          { error: `Metric "${metric.name}" value must be at least ${metric.minValue}` },
          { status: 400 }
        )
      }
      if (metric.maxValue !== undefined && validatedData.value > metric.maxValue) {
        return NextResponse.json(
          { error: `Metric "${metric.name}" value cannot exceed ${metric.maxValue}` },
          { status: 400 }
        )
      }
    }

    // Validate text length
    if (metric.type === 'text' && typeof validatedData.value === 'string') {
      if (metric.maxLength && validatedData.value.length > metric.maxLength) {
        return NextResponse.json(
          { error: `Metric "${metric.name}" text cannot exceed ${metric.maxLength} characters` },
          { status: 400 }
        )
      }
    }

    // Create progress metric
    const result = await db.progressMetric.create({
      data: {
        patientId: validatedData.patientId,
        therapistId: validatedData.therapistId,
        metricId: validatedData.metricId,
        sessionId: validatedData.sessionId,
        value: validatedData.value,
        measurementDate: validatedData.measurementDate,
        measurementTime: validatedData.measurementTime,
        context: validatedData.context,
        notes: validatedData.notes,
        isValidated: validatedData.isValidated,
        validatedBy: validatedData.validatedBy,
        validationDate: validatedData.validationDate,
        status: validatedData.status,
        isBaseline: validatedData.isBaseline
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        metric: {
          select: {
            id: true,
            name: true,
            type: true,
            unit: true
          }
        },
        session: {
          select: {
            id: true,
            scheduledDate: true,
            scheduledTime: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Progress metric created successfully',
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating progress metric:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to process analytics data
function processAnalyticsData(metrics: any[], groupBy: string, includeTrends: boolean, includeStatistics: boolean) {
  const analytics: any = {
    summary: {
      totalMeasurements: metrics.length,
      dateRange: {
        start: metrics.length > 0 ? metrics[0].measurementDate : null,
        end: metrics.length > 0 ? metrics[metrics.length - 1].measurementDate : null
      }
    }
  }

  if (includeStatistics) {
    // Calculate basic statistics
    const numericMetrics = metrics.filter(m => typeof m.value === 'number')
    if (numericMetrics.length > 0) {
      const values = numericMetrics.map(m => m.value as number)
      analytics.statistics = {
        mean: values.reduce((sum, val) => sum + val, 0) / values.length,
        median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
        min: Math.min(...values),
        max: Math.max(...values),
        standardDeviation: calculateStandardDeviation(values)
      }
    }
  }

  if (includeTrends) {
    // Group data by time period
    analytics.trends = groupMetricsByTime(metrics, groupBy)
  }

  // Group by metric
  analytics.byMetric = groupMetricsByMetric(metrics)

  return analytics
}

function groupMetricsByTime(metrics: any[], groupBy: string) {
  const groups: any = {}
  
  metrics.forEach(metric => {
    const date = new Date(metric.measurementDate)
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
      groups[key] = []
    }
    groups[key].push(metric)
  })
  
  return groups
}

function groupMetricsByMetric(metrics: any[]) {
  const groups: any = {}
  
  metrics.forEach(metric => {
    const metricId = metric.metricId
    if (!groups[metricId]) {
      groups[metricId] = {
        metric: metric.metric,
        measurements: []
      }
    }
    groups[metricId].measurements.push(metric)
  })
  
  return groups
}

function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
  return Math.sqrt(avgSquaredDiff)
}
