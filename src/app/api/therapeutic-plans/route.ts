import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const therapeuticPlanCreateSchema = z.object({
  // Basic Information
  patientId: z.string().uuid('Invalid patient ID'),
  therapistId: z.string().uuid('Invalid therapist ID'),
  sessionId: z.string().uuid('Invalid session ID'),
  
  // Plan Information
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters')
    .transform(val => val.trim()),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description cannot exceed 1000 characters')
    .transform(val => val.trim()),
  
  // Objectives
  objectives: z.array(z.object({
    id: z.string().optional(),
    title: z.string()
      .min(5, 'Objective title must be at least 5 characters')
      .max(100, 'Objective title cannot exceed 100 characters')
      .transform(val => val.trim()),
    
    description: z.string()
      .min(10, 'Objective description must be at least 10 characters')
      .max(500, 'Objective description cannot exceed 500 characters')
      .transform(val => val.trim()),
    
    category: z.enum(['behavioral', 'emotional', 'cognitive', 'social', 'physical', 'other']),
    
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    
    targetDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format')
      .transform(val => new Date(val))
      .refine(date => date > new Date(), 'Target date must be in the future'),
    
    // Metrics
    metrics: z.array(z.object({
      id: z.string().optional(),
      name: z.string()
        .min(3, 'Metric name must be at least 3 characters')
        .max(50, 'Metric name cannot exceed 50 characters')
        .transform(val => val.trim()),
      
      description: z.string()
        .min(5, 'Metric description must be at least 5 characters')
        .max(200, 'Metric description cannot exceed 200 characters')
        .transform(val => val.trim()),
      
      type: z.enum(['numeric', 'scale', 'boolean', 'text', 'percentage']),
      
      // Numeric validation
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
      targetValue: z.number().optional(),
      currentValue: z.number().optional(),
      
      // Scale validation (1-10, 1-5, etc.)
      scaleMin: z.number().min(1).optional(),
      scaleMax: z.number().max(10).optional(),
      
      // Text validation
      maxLength: z.number().min(1).max(1000).optional(),
      
      // Boolean validation
      isPositive: z.boolean().optional(),
      
      unit: z.string().max(20, 'Unit cannot exceed 20 characters').optional(),
      
      frequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly', 'as-needed']),
      
      isRequired: z.boolean().default(false)
    })).min(1, 'At least one metric is required')
  })).min(1, 'At least one objective is required'),
  
  // Treatment Plan
  treatmentApproach: z.string()
    .min(10, 'Treatment approach must be at least 10 characters')
    .max(1000, 'Treatment approach cannot exceed 1000 characters')
    .transform(val => val.trim()),
  
  estimatedDuration: z.number()
    .min(1, 'Duration must be at least 1 week')
    .max(104, 'Duration cannot exceed 104 weeks (2 years)'),
  
  frequency: z.enum(['weekly', 'bi-weekly', 'monthly', 'as-needed']),
  
  // Risk Assessment
  riskFactors: z.array(z.string().max(100, 'Risk factor cannot exceed 100 characters')).optional().default([]),
  
  safetyPlan: z.string()
    .max(1000, 'Safety plan cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  // Collaboration
  collaborationNotes: z.string()
    .max(1000, 'Collaboration notes cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  // Status
  status: z.enum(['draft', 'pending_approval', 'approved', 'active', 'completed', 'cancelled']).default('draft'),
  
  // Review Schedule
  reviewSchedule: z.enum(['weekly', 'bi-weekly', 'monthly', 'quarterly']).default('monthly'),
  
  nextReviewDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Next review date must be in YYYY-MM-DD format')
    .transform(val => new Date(val))
    .refine(date => date > new Date(), 'Next review date must be in the future')
})

const therapeuticPlanUpdateSchema = therapeuticPlanCreateSchema.partial()

const therapeuticPlanQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'active', 'completed', 'cancelled']).optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'status', 'nextReviewDate']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  includeCompleted: z.string().transform(val => val === 'true').optional().default(false)
})

// GET /api/therapeutic-plans - Get therapeutic plans with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = therapeuticPlanQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      patientId: searchParams.get('patientId'),
      therapistId: searchParams.get('therapistId'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      includeCompleted: searchParams.get('includeCompleted')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { page, limit, patientId, therapistId, status, search, sortBy, sortOrder, includeCompleted } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (!includeCompleted) {
      whereClause.status = { not: 'completed' }
    }
    
    if (patientId) {
      whereClause.patientId = patientId
    }
    
    if (therapistId) {
      whereClause.therapistId = therapistId
    }
    
    if (status) {
      whereClause.status = status
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { treatmentApproach: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get therapeutic plans with related data
    const [plans, totalCount] = await Promise.all([
      db.therapeuticPlan.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              dateOfBirth: true
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
          session: {
            select: {
              id: true,
              scheduledDate: true,
              scheduledTime: true,
              duration: true
            }
          },
          objectives: {
            include: {
              metrics: true
            }
          },
          _count: {
            select: {
              objectives: true,
              progressReports: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.therapeuticPlan.count({ where: whereClause })
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        plans: plans.map(plan => ({
          id: plan.id,
          title: plan.title,
          description: plan.description,
          status: plan.status,
          treatmentApproach: plan.treatmentApproach,
          estimatedDuration: plan.estimatedDuration,
          frequency: plan.frequency,
          riskFactors: plan.riskFactors,
          safetyPlan: plan.safetyPlan,
          collaborationNotes: plan.collaborationNotes,
          reviewSchedule: plan.reviewSchedule,
          nextReviewDate: plan.nextReviewDate,
          patient: plan.patient,
          therapist: plan.therapist,
          session: plan.session,
          objectives: plan.objectives.map(obj => ({
            id: obj.id,
            title: obj.title,
            description: obj.description,
            category: obj.category,
            priority: obj.priority,
            targetDate: obj.targetDate,
            metrics: obj.metrics.map(metric => ({
              id: metric.id,
              name: metric.name,
              description: metric.description,
              type: metric.type,
              minValue: metric.minValue,
              maxValue: metric.maxValue,
              targetValue: metric.targetValue,
              currentValue: metric.currentValue,
              scaleMin: metric.scaleMin,
              scaleMax: metric.scaleMax,
              maxLength: metric.maxLength,
              isPositive: metric.isPositive,
              unit: metric.unit,
              frequency: metric.frequency,
              isRequired: metric.isRequired
            }))
          })),
          stats: {
            totalObjectives: plan._count.objectives,
            totalProgressReports: plan._count.progressReports
          },
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt
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
          status,
          search,
          sortBy,
          sortOrder,
          includeCompleted
        }
      }
    })

  } catch (error) {
    console.error('Error fetching therapeutic plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/therapeutic-plans - Create a new therapeutic plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = therapeuticPlanCreateSchema.safeParse(body)
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

    // Check if session exists
    const session = await db.patientSession.findUnique({
      where: { id: validatedData.sessionId }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Validate metrics based on type
    for (const objective of validatedData.objectives) {
      for (const metric of objective.metrics) {
        // Numeric validation
        if (metric.type === 'numeric') {
          if (metric.minValue !== undefined && metric.maxValue !== undefined) {
            if (metric.minValue >= metric.maxValue) {
              return NextResponse.json(
                { error: `Metric "${metric.name}": minValue must be less than maxValue` },
                { status: 400 }
              )
            }
          }
          if (metric.targetValue !== undefined) {
            if (metric.minValue !== undefined && metric.targetValue < metric.minValue) {
              return NextResponse.json(
                { error: `Metric "${metric.name}": targetValue must be greater than or equal to minValue` },
                { status: 400 }
              )
            }
            if (metric.maxValue !== undefined && metric.targetValue > metric.maxValue) {
              return NextResponse.json(
                { error: `Metric "${metric.name}": targetValue must be less than or equal to maxValue` },
                { status: 400 }
              )
            }
          }
        }

        // Scale validation
        if (metric.type === 'scale') {
          if (metric.scaleMin !== undefined && metric.scaleMax !== undefined) {
            if (metric.scaleMin >= metric.scaleMax) {
              return NextResponse.json(
                { error: `Metric "${metric.name}": scaleMin must be less than scaleMax` },
                { status: 400 }
              )
            }
          }
        }

        // Text validation
        if (metric.type === 'text' && metric.maxLength === undefined) {
          return NextResponse.json(
            { error: `Metric "${metric.name}": maxLength is required for text type` },
            { status: 400 }
          )
        }
      }
    }

    // Create therapeutic plan with transaction
    const result = await db.$transaction(async (tx) => {
      // Create therapeutic plan
      const plan = await tx.therapeuticPlan.create({
        data: {
          patientId: validatedData.patientId,
          therapistId: validatedData.therapistId,
          sessionId: validatedData.sessionId,
          title: validatedData.title,
          description: validatedData.description,
          treatmentApproach: validatedData.treatmentApproach,
          estimatedDuration: validatedData.estimatedDuration,
          frequency: validatedData.frequency,
          riskFactors: validatedData.riskFactors,
          safetyPlan: validatedData.safetyPlan,
          collaborationNotes: validatedData.collaborationNotes,
          status: validatedData.status,
          reviewSchedule: validatedData.reviewSchedule,
          nextReviewDate: validatedData.nextReviewDate
        }
      })

      // Create objectives
      for (const objectiveData of validatedData.objectives) {
        const objective = await tx.therapeuticObjective.create({
          data: {
            planId: plan.id,
            title: objectiveData.title,
            description: objectiveData.description,
            category: objectiveData.category,
            priority: objectiveData.priority,
            targetDate: objectiveData.targetDate
          }
        })

        // Create metrics for each objective
        for (const metricData of objectiveData.metrics) {
          await tx.therapeuticMetric.create({
            data: {
              objectiveId: objective.id,
              name: metricData.name,
              description: metricData.description,
              type: metricData.type,
              minValue: metricData.minValue,
              maxValue: metricData.maxValue,
              targetValue: metricData.targetValue,
              currentValue: metricData.currentValue,
              scaleMin: metricData.scaleMin,
              scaleMax: metricData.scaleMax,
              maxLength: metricData.maxLength,
              isPositive: metricData.isPositive,
              unit: metricData.unit,
              frequency: metricData.frequency,
              isRequired: metricData.isRequired
            }
          })
        }
      }

      return plan
    })

    // Return created plan with related data
    const createdPlan = await db.therapeuticPlan.findUnique({
      where: { id: result.id },
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
        session: {
          select: {
            id: true,
            scheduledDate: true,
            scheduledTime: true
          }
        },
        objectives: {
          include: {
            metrics: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Therapeutic plan created successfully',
      data: createdPlan
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating therapeutic plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
