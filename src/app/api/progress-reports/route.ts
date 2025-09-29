import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const progressReportCreateSchema = z.object({
  // Basic Information
  patientId: z.string().uuid('Invalid patient ID'),
  therapistId: z.string().uuid('Invalid therapist ID'),
  sessionId: z.string().uuid('Invalid session ID'),
  therapeuticPlanId: z.string().uuid('Invalid therapeutic plan ID'),
  
  // Report Information
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title cannot exceed 100 characters')
    .transform(val => val.trim()),
  
  reportDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Report date must be in YYYY-MM-DD format')
    .transform(val => new Date(val)),
  
  sessionNumber: z.number()
    .min(1, 'Session number must be at least 1')
    .max(1000, 'Session number cannot exceed 1000'),
  
  // Progress Assessment
  overallProgressScore: z.number()
    .min(0, 'Progress score must be at least 0')
    .max(100, 'Progress score cannot exceed 100'),
  
  progressDescription: z.string()
    .min(10, 'Progress description must be at least 10 characters')
    .max(2000, 'Progress description cannot exceed 2000 characters')
    .transform(val => val.trim()),
  
  // Achievement Tracking
  achievements: z.array(z.object({
    id: z.string().optional(),
    objectiveId: z.string().uuid('Invalid objective ID'),
    title: z.string()
      .min(5, 'Achievement title must be at least 5 characters')
      .max(100, 'Achievement title cannot exceed 100 characters')
      .transform(val => val.trim()),
    
    description: z.string()
      .min(10, 'Achievement description must be at least 10 characters')
      .max(500, 'Achievement description cannot exceed 500 characters')
      .transform(val => val.trim()),
    
    achievementLevel: z.enum(['not_achieved', 'partially_achieved', 'mostly_achieved', 'fully_achieved']),
    
    progressPercentage: z.number()
      .min(0, 'Progress percentage must be at least 0')
      .max(100, 'Progress percentage cannot exceed 100'),
    
    evidence: z.string()
      .max(1000, 'Evidence cannot exceed 1000 characters')
      .optional()
      .transform(val => val?.trim()),
    
    nextSteps: z.string()
      .max(500, 'Next steps cannot exceed 500 characters')
      .optional()
      .transform(val => val?.trim())
  })).min(1, 'At least one achievement must be reported'),
  
  // Metric Progress
  metricProgress: z.array(z.object({
    id: z.string().optional(),
    metricId: z.string().uuid('Invalid metric ID'),
    currentValue: z.union([
      z.number(),
      z.string(),
      z.boolean()
    ]),
    
    previousValue: z.union([
      z.number(),
      z.string(),
      z.boolean()
    ]).optional(),
    
    targetValue: z.union([
      z.number(),
      z.string(),
      z.boolean()
    ]).optional(),
    
    progressNotes: z.string()
      .max(500, 'Progress notes cannot exceed 500 characters')
      .optional()
      .transform(val => val?.trim()),
    
    measurementDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Measurement date must be in YYYY-MM-DD format')
      .transform(val => new Date(val))
  })).min(1, 'At least one metric progress must be reported'),
  
  // Clinical Observations
  clinicalObservations: z.string()
    .max(2000, 'Clinical observations cannot exceed 2000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  behavioralChanges: z.string()
    .max(1000, 'Behavioral changes cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  emotionalState: z.string()
    .max(1000, 'Emotional state cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  cognitiveFunctioning: z.string()
    .max(1000, 'Cognitive functioning cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  socialFunctioning: z.string()
    .max(1000, 'Social functioning cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  // Treatment Response
  treatmentResponse: z.string()
    .max(1000, 'Treatment response cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  medicationCompliance: z.enum(['excellent', 'good', 'fair', 'poor', 'not_applicable']).optional(),
  
  sideEffects: z.string()
    .max(1000, 'Side effects cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  // Risk Assessment
  riskLevel: z.enum(['low', 'moderate', 'high', 'critical']).optional(),
  
  riskFactors: z.array(z.string().max(100, 'Risk factor cannot exceed 100 characters')).optional().default([]),
  
  protectiveFactors: z.array(z.string().max(100, 'Protective factor cannot exceed 100 characters')).optional().default([]),
  
  safetyConcerns: z.string()
    .max(1000, 'Safety concerns cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  // Recommendations
  recommendations: z.array(z.object({
    id: z.string().optional(),
    type: z.enum(['treatment', 'medication', 'lifestyle', 'referral', 'other']),
    description: z.string()
      .min(10, 'Recommendation description must be at least 10 characters')
      .max(500, 'Recommendation description cannot exceed 500 characters')
      .transform(val => val.trim()),
    
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    
    targetDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Target date must be in YYYY-MM-DD format')
      .transform(val => new Date(val))
      .optional(),
    
    isImplemented: z.boolean().default(false)
  })).optional().default([]),
  
  // Next Session Planning
  nextSessionGoals: z.string()
    .max(1000, 'Next session goals cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  homeworkAssignments: z.string()
    .max(1000, 'Homework assignments cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  // Status
  status: z.enum(['draft', 'pending_review', 'approved', 'finalized']).default('draft'),
  
  isConfidential: z.boolean().default(false)
})

const progressReportUpdateSchema = progressReportCreateSchema.partial()

const progressReportQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  therapeuticPlanId: z.string().uuid('Invalid therapeutic plan ID').optional(),
  status: z.enum(['draft', 'pending_review', 'approved', 'finalized']).optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'reportDate', 'sessionNumber', 'overallProgressScore']).optional().default('reportDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  includeDrafts: z.string().transform(val => val === 'true').optional().default(false)
})

// GET /api/progress-reports - Get progress reports with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = progressReportQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      patientId: searchParams.get('patientId'),
      therapistId: searchParams.get('therapistId'),
      therapeuticPlanId: searchParams.get('therapeuticPlanId'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      includeDrafts: searchParams.get('includeDrafts')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { page, limit, patientId, therapistId, therapeuticPlanId, status, search, sortBy, sortOrder, includeDrafts } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (!includeDrafts) {
      whereClause.status = { not: 'draft' }
    }
    
    if (patientId) {
      whereClause.patientId = patientId
    }
    
    if (therapistId) {
      whereClause.therapistId = therapistId
    }
    
    if (therapeuticPlanId) {
      whereClause.therapeuticPlanId = therapeuticPlanId
    }
    
    if (status) {
      whereClause.status = status
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { progressDescription: { contains: search, mode: 'insensitive' } },
        { clinicalObservations: { contains: search, mode: 'insensitive' } }
      ]
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
          therapeuticPlan: {
            select: {
              id: true,
              title: true,
              status: true
            }
          },
          achievements: {
            include: {
              objective: {
                select: {
                  id: true,
                  title: true,
                  category: true
                }
              }
            }
          },
          metricProgress: {
            include: {
              metric: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  unit: true
                }
              }
            }
          },
          recommendations: true,
          _count: {
            select: {
              achievements: true,
              metricProgress: true,
              recommendations: true
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
          title: report.title,
          reportDate: report.reportDate,
          sessionNumber: report.sessionNumber,
          overallProgressScore: report.overallProgressScore,
          progressDescription: report.progressDescription,
          clinicalObservations: report.clinicalObservations,
          behavioralChanges: report.behavioralChanges,
          emotionalState: report.emotionalState,
          cognitiveFunctioning: report.cognitiveFunctioning,
          socialFunctioning: report.socialFunctioning,
          treatmentResponse: report.treatmentResponse,
          medicationCompliance: report.medicationCompliance,
          sideEffects: report.sideEffects,
          riskLevel: report.riskLevel,
          riskFactors: report.riskFactors,
          protectiveFactors: report.protectiveFactors,
          safetyConcerns: report.safetyConcerns,
          nextSessionGoals: report.nextSessionGoals,
          homeworkAssignments: report.homeworkAssignments,
          status: report.status,
          isConfidential: report.isConfidential,
          patient: report.patient,
          therapist: report.therapist,
          session: report.session,
          therapeuticPlan: report.therapeuticPlan,
          achievements: report.achievements.map(achievement => ({
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            achievementLevel: achievement.achievementLevel,
            progressPercentage: achievement.progressPercentage,
            evidence: achievement.evidence,
            nextSteps: achievement.nextSteps,
            objective: achievement.objective
          })),
          metricProgress: report.metricProgress.map(progress => ({
            id: progress.id,
            currentValue: progress.currentValue,
            previousValue: progress.previousValue,
            targetValue: progress.targetValue,
            progressNotes: progress.progressNotes,
            measurementDate: progress.measurementDate,
            metric: progress.metric
          })),
          recommendations: report.recommendations.map(rec => ({
            id: rec.id,
            type: rec.type,
            description: rec.description,
            priority: rec.priority,
            targetDate: rec.targetDate,
            isImplemented: rec.isImplemented
          })),
          stats: {
            totalAchievements: report._count.achievements,
            totalMetricProgress: report._count.metricProgress,
            totalRecommendations: report._count.recommendations
          },
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
          therapeuticPlanId,
          status,
          search,
          sortBy,
          sortOrder,
          includeDrafts
        }
      }
    })

  } catch (error) {
    console.error('Error fetching progress reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/progress-reports - Create a new progress report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = progressReportCreateSchema.safeParse(body)
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

    // Check if therapeutic plan exists
    const therapeuticPlan = await db.therapeuticPlan.findUnique({
      where: { id: validatedData.therapeuticPlanId }
    })

    if (!therapeuticPlan) {
      return NextResponse.json(
        { error: 'Therapeutic plan not found' },
        { status: 404 }
      )
    }

    // Validate achievements and objectives
    for (const achievement of validatedData.achievements) {
      const objective = await db.therapeuticObjective.findUnique({
        where: { id: achievement.objectiveId }
      })

      if (!objective) {
        return NextResponse.json(
          { error: `Objective with ID ${achievement.objectiveId} not found` },
          { status: 404 }
        )
      }
    }

    // Validate metric progress
    for (const metricProgress of validatedData.metricProgress) {
      const metric = await db.therapeuticMetric.findUnique({
        where: { id: metricProgress.metricId }
      })

      if (!metric) {
        return NextResponse.json(
          { error: `Metric with ID ${metricProgress.metricId} not found` },
          { status: 404 }
        )
      }

      // Validate metric values based on type
      if (metric.type === 'numeric' && typeof metricProgress.currentValue !== 'number') {
        return NextResponse.json(
          { error: `Metric "${metric.name}" requires a numeric value` },
          { status: 400 }
        )
      }

      if (metric.type === 'boolean' && typeof metricProgress.currentValue !== 'boolean') {
        return NextResponse.json(
          { error: `Metric "${metric.name}" requires a boolean value` },
          { status: 400 }
        )
      }

      if (metric.type === 'text' && typeof metricProgress.currentValue !== 'string') {
        return NextResponse.json(
          { error: `Metric "${metric.name}" requires a text value` },
          { status: 400 }
        )
      }

      // Validate numeric ranges
      if (metric.type === 'numeric' && typeof metricProgress.currentValue === 'number') {
        if (metric.minValue !== undefined && metricProgress.currentValue < metric.minValue) {
          return NextResponse.json(
            { error: `Metric "${metric.name}" value must be at least ${metric.minValue}` },
            { status: 400 }
          )
        }
        if (metric.maxValue !== undefined && metricProgress.currentValue > metric.maxValue) {
          return NextResponse.json(
            { error: `Metric "${metric.name}" value cannot exceed ${metric.maxValue}` },
            { status: 400 }
          )
        }
      }

      // Validate text length
      if (metric.type === 'text' && typeof metricProgress.currentValue === 'string') {
        if (metric.maxLength && metricProgress.currentValue.length > metric.maxLength) {
          return NextResponse.json(
            { error: `Metric "${metric.name}" text cannot exceed ${metric.maxLength} characters` },
            { status: 400 }
          )
        }
      }
    }

    // Create progress report with transaction
    const result = await db.$transaction(async (tx) => {
      // Create progress report
      const report = await tx.progressReport.create({
        data: {
          patientId: validatedData.patientId,
          therapistId: validatedData.therapistId,
          sessionId: validatedData.sessionId,
          therapeuticPlanId: validatedData.therapeuticPlanId,
          title: validatedData.title,
          reportDate: validatedData.reportDate,
          sessionNumber: validatedData.sessionNumber,
          overallProgressScore: validatedData.overallProgressScore,
          progressDescription: validatedData.progressDescription,
          clinicalObservations: validatedData.clinicalObservations,
          behavioralChanges: validatedData.behavioralChanges,
          emotionalState: validatedData.emotionalState,
          cognitiveFunctioning: validatedData.cognitiveFunctioning,
          socialFunctioning: validatedData.socialFunctioning,
          treatmentResponse: validatedData.treatmentResponse,
          medicationCompliance: validatedData.medicationCompliance,
          sideEffects: validatedData.sideEffects,
          riskLevel: validatedData.riskLevel,
          riskFactors: validatedData.riskFactors,
          protectiveFactors: validatedData.protectiveFactors,
          safetyConcerns: validatedData.safetyConcerns,
          nextSessionGoals: validatedData.nextSessionGoals,
          homeworkAssignments: validatedData.homeworkAssignments,
          status: validatedData.status,
          isConfidential: validatedData.isConfidential
        }
      })

      // Create achievements
      for (const achievementData of validatedData.achievements) {
        await tx.progressAchievement.create({
          data: {
            reportId: report.id,
            objectiveId: achievementData.objectiveId,
            title: achievementData.title,
            description: achievementData.description,
            achievementLevel: achievementData.achievementLevel,
            progressPercentage: achievementData.progressPercentage,
            evidence: achievementData.evidence,
            nextSteps: achievementData.nextSteps
          }
        })
      }

      // Create metric progress
      for (const metricProgressData of validatedData.metricProgress) {
        await tx.progressMetric.create({
          data: {
            reportId: report.id,
            metricId: metricProgressData.metricId,
            currentValue: metricProgressData.currentValue,
            previousValue: metricProgressData.previousValue,
            targetValue: metricProgressData.targetValue,
            progressNotes: metricProgressData.progressNotes,
            measurementDate: metricProgressData.measurementDate
          }
        })
      }

      // Create recommendations
      for (const recommendationData of validatedData.recommendations) {
        await tx.progressRecommendation.create({
          data: {
            reportId: report.id,
            type: recommendationData.type,
            description: recommendationData.description,
            priority: recommendationData.priority,
            targetDate: recommendationData.targetDate,
            isImplemented: recommendationData.isImplemented
          }
        })
      }

      return report
    })

    // Return created report with related data
    const createdReport = await db.progressReport.findUnique({
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
        therapeuticPlan: {
          select: {
            id: true,
            title: true
          }
        },
        achievements: {
          include: {
            objective: {
              select: {
                id: true,
                title: true,
                category: true
              }
            }
          }
        },
        metricProgress: {
          include: {
            metric: {
              select: {
                id: true,
                name: true,
                type: true,
                unit: true
              }
            }
          }
        },
        recommendations: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Progress report created successfully',
      data: createdReport
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating progress report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
