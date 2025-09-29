import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const milestoneCreateSchema = z.object({
  // Basic Information
  patientId: z.string().uuid('Invalid patient ID'),
  therapistId: z.string().uuid('Invalid therapist ID'),
  
  // Milestone Details
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .transform(val => val.trim()),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description cannot exceed 1000 characters')
    .transform(val => val.trim()),
  
  // Timeline
  targetDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format')
    .transform(val => new Date(val)),
  
  completedDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Completed date must be in YYYY-MM-DD format')
    .transform(val => new Date(val))
    .optional(),
  
  // Milestone Configuration
  type: z.enum(['assessment', 'goal', 'session', 'evaluation', 'milestone', 'checkpoint', 'review']),
  
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue', 'cancelled']).default('pending'),
  
  // Progress Tracking
  progress: z.number().min(0).max(100).default(0),
  
  // Dependencies
  dependencies: z.array(z.string().uuid('Invalid dependency ID')).optional().default([]),
  
  // Validation Rules
  validationRules: z.object({
    requireCompletion: z.boolean().default(true),
    allowEarlyCompletion: z.boolean().default(true),
    maxDelayDays: z.number().min(0).max(365).default(30),
    requireApproval: z.boolean().default(false),
    autoComplete: z.boolean().default(false)
  }).optional().default({}),
  
  // Metrics and KPIs
  metrics: z.array(z.object({
    name: z.string().max(100, 'Metric name cannot exceed 100 characters'),
    targetValue: z.number(),
    currentValue: z.number().default(0),
    unit: z.string().max(20, 'Unit cannot exceed 20 characters').optional(),
    isRequired: z.boolean().default(false)
  })).optional().default([]),
  
  // Notes and Comments
  notes: z.string()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  // Created by
  createdBy: z.string().uuid('Invalid creator ID')
})

const milestoneUpdateSchema = milestoneCreateSchema.partial()

const milestoneQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  type: z.enum(['assessment', 'goal', 'session', 'evaluation', 'milestone', 'checkpoint', 'review']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  sortBy: z.enum(['targetDate', 'createdAt', 'updatedAt', 'priority', 'status', 'progress']).optional().default('targetDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
})

const timelineAnalyticsSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter']).optional().default('week'),
  includeMetrics: z.string().transform(val => val === 'true').optional().default(true),
  includeTrends: z.string().transform(val => val === 'true').optional().default(true)
})

// GET /api/progress-timeline - Get milestones with filtering and analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'analytics') {
      // Handle analytics request
      const validation = timelineAnalyticsSchema.safeParse({
        patientId: searchParams.get('patientId'),
        therapistId: searchParams.get('therapistId'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        groupBy: searchParams.get('groupBy'),
        includeMetrics: searchParams.get('includeMetrics'),
        includeTrends: searchParams.get('includeTrends')
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid analytics parameters', details: validation.error.errors },
          { status: 400 }
        )
      }

      const { patientId, therapistId, startDate, endDate, groupBy, includeMetrics, includeTrends } = validation.data

      // Build where clause for analytics
      const whereClause: any = {}
      
      if (patientId) {
        whereClause.patientId = patientId
      }
      
      if (therapistId) {
        whereClause.therapistId = therapistId
      }
      
      if (startDate) {
        whereClause.targetDate = { gte: new Date(startDate) }
      }
      
      if (endDate) {
        whereClause.targetDate = { 
          ...whereClause.targetDate,
          lte: new Date(endDate) 
        }
      }

      // Get milestones for analytics
      const milestones = await db.progressMilestone.findMany({
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
          }
        },
        orderBy: { targetDate: 'asc' }
      })

      // Process analytics data
      const analytics = processTimelineAnalytics(milestones, groupBy, includeMetrics, includeTrends)

      return NextResponse.json({
        success: true,
        data: analytics
      })
    } else {
      // Handle regular milestones request
      const validation = milestoneQuerySchema.safeParse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        patientId: searchParams.get('patientId'),
        therapistId: searchParams.get('therapistId'),
        type: searchParams.get('type'),
        status: searchParams.get('status'),
        priority: searchParams.get('priority'),
        startDate: searchParams.get('startDate'),
        endDate: searchParams.get('endDate'),
        search: searchParams.get('search'),
        sortBy: searchParams.get('sortBy'),
        sortOrder: searchParams.get('sortOrder')
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: validation.error.errors },
          { status: 400 }
        )
      }

      const { page, limit, patientId, therapistId, type, status, priority, startDate, endDate, search, sortBy, sortOrder } = validation.data

      // Build where clause
      const whereClause: any = {}
      
      if (patientId) {
        whereClause.patientId = patientId
      }
      
      if (therapistId) {
        whereClause.therapistId = therapistId
      }
      
      if (type) {
        whereClause.type = type
      }
      
      if (status) {
        whereClause.status = status
      }
      
      if (priority) {
        whereClause.priority = priority
      }
      
      if (startDate) {
        whereClause.targetDate = { gte: new Date(startDate) }
      }
      
      if (endDate) {
        whereClause.targetDate = { 
          ...whereClause.targetDate,
          lte: new Date(endDate) 
        }
      }
      
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }

      // Calculate pagination
      const skip = (page - 1) * limit

      // Get milestones with related data
      const [milestones, totalCount] = await Promise.all([
        db.progressMilestone.findMany({
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
            createdByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        db.progressMilestone.count({ where: whereClause })
      ])

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit)
      const hasNextPage = page < totalPages
      const hasPrevPage = page > 1

      return NextResponse.json({
        success: true,
        data: {
          milestones: milestones.map(milestone => ({
            id: milestone.id,
            title: milestone.title,
            description: milestone.description,
            type: milestone.type,
            priority: milestone.priority,
            status: milestone.status,
            progress: milestone.progress,
            targetDate: milestone.targetDate,
            completedDate: milestone.completedDate,
            dependencies: milestone.dependencies,
            validationRules: milestone.validationRules,
            metrics: milestone.metrics,
            notes: milestone.notes,
            patient: milestone.patient,
            therapist: milestone.therapist,
            createdBy: milestone.createdBy,
            createdByUser: milestone.createdByUser,
            createdAt: milestone.createdAt,
            updatedAt: milestone.updatedAt
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
            type,
            status,
            priority,
            startDate,
            endDate,
            search,
            sortBy,
            sortOrder
          }
        }
      })
    }

  } catch (error) {
    console.error('Error fetching progress timeline data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/progress-timeline - Create a new milestone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = milestoneCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
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

    // Check if creator exists
    const creator = await db.user.findUnique({
      where: { id: validatedData.createdBy }
    })

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    // Validate date constraints
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (validatedData.targetDate < today) {
      return NextResponse.json(
        { error: 'Target date cannot be in the past' },
        { status: 400 }
      )
    }

    // Validate dependencies exist
    if (validatedData.dependencies && validatedData.dependencies.length > 0) {
      const existingMilestones = await db.progressMilestone.findMany({
        where: {
          id: { in: validatedData.dependencies }
        }
      })

      if (existingMilestones.length !== validatedData.dependencies.length) {
        return NextResponse.json(
          { error: 'One or more dependencies do not exist' },
          { status: 400 }
        )
      }
    }

    // Validate metrics
    for (const metric of validatedData.metrics) {
      if (metric.targetValue <= 0) {
        return NextResponse.json(
          { error: `Metric "${metric.name}" target value must be greater than 0` },
          { status: 400 }
        )
      }
      
      if (metric.currentValue < 0) {
        return NextResponse.json(
          { error: `Metric "${metric.name}" current value cannot be negative` },
          { status: 400 }
        )
      }
      
      if (metric.currentValue > metric.targetValue) {
        return NextResponse.json(
          { error: `Metric "${metric.name}" current value cannot exceed target value` },
          { status: 400 }
        )
      }
    }

    // Create milestone
    const result = await db.progressMilestone.create({
      data: {
        patientId: validatedData.patientId,
        therapistId: validatedData.therapistId,
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        priority: validatedData.priority,
        status: validatedData.status,
        progress: validatedData.progress,
        targetDate: validatedData.targetDate,
        completedDate: validatedData.completedDate,
        dependencies: validatedData.dependencies,
        validationRules: validatedData.validationRules,
        metrics: validatedData.metrics,
        notes: validatedData.notes,
        createdBy: validatedData.createdBy
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
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Milestone created successfully',
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating milestone:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to process timeline analytics
function processTimelineAnalytics(milestones: any[], groupBy: string, includeMetrics: boolean, includeTrends: boolean) {
  const analytics: any = {
    summary: {
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter(m => m.status === 'completed').length,
      pendingMilestones: milestones.filter(m => m.status === 'pending').length,
      overdueMilestones: milestones.filter(m => m.status === 'overdue').length,
      averageProgress: milestones.length > 0 ? milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length : 0
    }
  }

  if (includeMetrics) {
    // Calculate metrics analytics
    const allMetrics = milestones.flatMap(m => m.metrics || [])
    if (allMetrics.length > 0) {
      analytics.metrics = {
        totalMetrics: allMetrics.length,
        completedMetrics: allMetrics.filter(m => m.currentValue >= m.targetValue).length,
        averageCompletion: allMetrics.length > 0 ? 
          allMetrics.reduce((sum, m) => sum + (m.currentValue / m.targetValue), 0) / allMetrics.length : 0
      }
    }
  }

  if (includeTrends) {
    // Group data by time period
    analytics.trends = groupMilestonesByTime(milestones, groupBy)
  }

  // Group by type and status
  analytics.byType = groupMilestonesByType(milestones)
  analytics.byStatus = groupMilestonesByStatus(milestones)

  return analytics
}

function groupMilestonesByTime(milestones: any[], groupBy: string) {
  const groups: any = {}
  
  milestones.forEach(milestone => {
    const date = new Date(milestone.targetDate)
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
    groups[key].push(milestone)
  })
  
  return groups
}

function groupMilestonesByType(milestones: any[]) {
  const groups: any = {}
  
  milestones.forEach(milestone => {
    const type = milestone.type
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(milestone)
  })
  
  return groups
}

function groupMilestonesByStatus(milestones: any[]) {
  const groups: any = {}
  
  milestones.forEach(milestone => {
    const status = milestone.status
    if (!groups[status]) {
      groups[status] = []
    }
    groups[status].push(milestone)
  })
  
  return groups
}
