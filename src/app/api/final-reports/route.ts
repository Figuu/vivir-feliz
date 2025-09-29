import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const finalReportCreateSchema = z.object({
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
  
  treatmentStartDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Treatment start date must be in YYYY-MM-DD format')
    .transform(val => new Date(val)),
  
  treatmentEndDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Treatment end date must be in YYYY-MM-DD format')
    .transform(val => new Date(val)),
  
  totalSessions: z.number()
    .min(1, 'Total sessions must be at least 1')
    .max(1000, 'Total sessions cannot exceed 1000'),
  
  // Treatment Summary
  treatmentSummary: z.string()
    .min(10, 'Treatment summary must be at least 10 characters')
    .max(3000, 'Treatment summary cannot exceed 3000 characters')
    .transform(val => val.trim()),
  
  presentingProblems: z.string()
    .min(10, 'Presenting problems must be at least 10 characters')
    .max(1000, 'Presenting problems cannot exceed 1000 characters')
    .transform(val => val.trim()),
  
  treatmentGoals: z.string()
    .min(10, 'Treatment goals must be at least 10 characters')
    .max(1000, 'Treatment goals cannot exceed 1000 characters')
    .transform(val => val.trim()),
  
  // Outcome Measurements
  outcomeMeasurements: z.array(z.object({
    id: z.string().optional(),
    metricId: z.string().uuid('Invalid metric ID'),
    initialValue: z.union([
      z.number(),
      z.string(),
      z.boolean()
    ]),
    
    finalValue: z.union([
      z.number(),
      z.string(),
      z.boolean()
    ]),
    
    improvementPercentage: z.number()
      .min(-100, 'Improvement percentage cannot be less than -100')
      .max(1000, 'Improvement percentage cannot exceed 1000'),
    
    outcomeNotes: z.string()
      .max(500, 'Outcome notes cannot exceed 500 characters')
      .optional()
      .transform(val => val?.trim()),
    
    measurementDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Measurement date must be in YYYY-MM-DD format')
      .transform(val => new Date(val))
  })).min(1, 'At least one outcome measurement must be reported'),
  
  // Objective Outcomes
  objectiveOutcomes: z.array(z.object({
    id: z.string().optional(),
    objectiveId: z.string().uuid('Invalid objective ID'),
    finalStatus: z.enum(['not_achieved', 'partially_achieved', 'mostly_achieved', 'fully_achieved']),
    
    achievementPercentage: z.number()
      .min(0, 'Achievement percentage must be at least 0')
      .max(100, 'Achievement percentage cannot exceed 100'),
    
    outcomeDescription: z.string()
      .min(10, 'Outcome description must be at least 10 characters')
      .max(1000, 'Outcome description cannot exceed 1000 characters')
      .transform(val => val.trim()),
    
    evidence: z.string()
      .max(1000, 'Evidence cannot exceed 1000 characters')
      .optional()
      .transform(val => val?.trim()),
    
    challenges: z.string()
      .max(1000, 'Challenges cannot exceed 1000 characters')
      .optional()
      .transform(val => val?.trim())
  })).min(1, 'At least one objective outcome must be reported'),
  
  // Treatment Effectiveness
  overallEffectiveness: z.enum(['excellent', 'good', 'fair', 'poor', 'not_applicable']),
  
  effectivenessRating: z.number()
    .min(1, 'Effectiveness rating must be at least 1')
    .max(10, 'Effectiveness rating cannot exceed 10'),
  
  patientSatisfaction: z.number()
    .min(1, 'Patient satisfaction must be at least 1')
    .max(10, 'Patient satisfaction cannot exceed 10')
    .optional(),
  
  therapistSatisfaction: z.number()
    .min(1, 'Therapist satisfaction must be at least 1')
    .max(10, 'Therapist satisfaction cannot exceed 10')
    .optional(),
  
  // Clinical Assessment
  clinicalAssessment: z.string()
    .min(10, 'Clinical assessment must be at least 10 characters')
    .max(2000, 'Clinical assessment cannot exceed 2000 characters')
    .transform(val => val.trim()),
  
  functionalImprovements: z.string()
    .max(1000, 'Functional improvements cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  behavioralChanges: z.string()
    .max(1000, 'Behavioral changes cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  emotionalStability: z.string()
    .max(1000, 'Emotional stability cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  socialFunctioning: z.string()
    .max(1000, 'Social functioning cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  // Recommendations
  recommendations: z.array(z.object({
    id: z.string().optional(),
    type: z.enum(['follow_up', 'maintenance', 'referral', 'medication', 'lifestyle', 'other']),
    description: z.string()
      .min(10, 'Recommendation description must be at least 10 characters')
      .max(500, 'Recommendation description cannot exceed 500 characters')
      .transform(val => val.trim()),
    
    priority: z.enum(['low', 'medium', 'high', 'urgent']),
    
    timeframe: z.string()
      .max(100, 'Timeframe cannot exceed 100 characters')
      .optional()
      .transform(val => val?.trim()),
    
    responsibleParty: z.string()
      .max(100, 'Responsible party cannot exceed 100 characters')
      .optional()
      .transform(val => val?.trim()),
    
    isImplemented: z.boolean().default(false)
  })).optional().default([]),
  
  // Follow-up Planning
  followUpPlan: z.string()
    .max(1000, 'Follow-up plan cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  followUpSchedule: z.string()
    .max(500, 'Follow-up schedule cannot exceed 500 characters')
    .optional()
    .transform(val => val?.trim()),
  
  maintenanceRecommendations: z.string()
    .max(1000, 'Maintenance recommendations cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  // Risk Assessment
  currentRiskLevel: z.enum(['low', 'moderate', 'high', 'critical']).optional(),
  
  riskFactors: z.array(z.string().max(100, 'Risk factor cannot exceed 100 characters')).optional().default([]),
  
  protectiveFactors: z.array(z.string().max(100, 'Protective factor cannot exceed 100 characters')).optional().default([]),
  
  safetyPlan: z.string()
    .max(1000, 'Safety plan cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  // Discharge Information
  dischargeReason: z.enum(['goals_achieved', 'patient_request', 'insurance_limit', 'therapist_recommendation', 'other']),
  
  dischargeStatus: z.enum(['successful', 'partial_success', 'unsuccessful', 'transferred']),
  
  dischargeNotes: z.string()
    .max(1000, 'Discharge notes cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  // Status
  status: z.enum(['draft', 'pending_review', 'approved', 'finalized']).default('draft'),
  
  isConfidential: z.boolean().default(false)
})

const finalReportUpdateSchema = finalReportCreateSchema.partial()

const finalReportQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  therapeuticPlanId: z.string().uuid('Invalid therapeutic plan ID').optional(),
  status: z.enum(['draft', 'pending_review', 'approved', 'finalized']).optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'reportDate', 'treatmentEndDate', 'overallEffectiveness']).optional().default('reportDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  includeDrafts: z.string().transform(val => val === 'true').optional().default(false)
})

// GET /api/final-reports - Get final reports with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = finalReportQuerySchema.safeParse({
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
        { treatmentSummary: { contains: search, mode: 'insensitive' } },
        { clinicalAssessment: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get final reports with related data
    const [reports, totalCount] = await Promise.all([
      db.finalReport.findMany({
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
          outcomeMeasurements: {
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
          objectiveOutcomes: {
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
          recommendations: true,
          _count: {
            select: {
              outcomeMeasurements: true,
              objectiveOutcomes: true,
              recommendations: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.finalReport.count({ where: whereClause })
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
          treatmentStartDate: report.treatmentStartDate,
          treatmentEndDate: report.treatmentEndDate,
          totalSessions: report.totalSessions,
          treatmentSummary: report.treatmentSummary,
          presentingProblems: report.presentingProblems,
          treatmentGoals: report.treatmentGoals,
          overallEffectiveness: report.overallEffectiveness,
          effectivenessRating: report.effectivenessRating,
          patientSatisfaction: report.patientSatisfaction,
          therapistSatisfaction: report.therapistSatisfaction,
          clinicalAssessment: report.clinicalAssessment,
          functionalImprovements: report.functionalImprovements,
          behavioralChanges: report.behavioralChanges,
          emotionalStability: report.emotionalStability,
          socialFunctioning: report.socialFunctioning,
          followUpPlan: report.followUpPlan,
          followUpSchedule: report.followUpSchedule,
          maintenanceRecommendations: report.maintenanceRecommendations,
          currentRiskLevel: report.currentRiskLevel,
          riskFactors: report.riskFactors,
          protectiveFactors: report.protectiveFactors,
          safetyPlan: report.safetyPlan,
          dischargeReason: report.dischargeReason,
          dischargeStatus: report.dischargeStatus,
          dischargeNotes: report.dischargeNotes,
          status: report.status,
          isConfidential: report.isConfidential,
          patient: report.patient,
          therapist: report.therapist,
          session: report.session,
          therapeuticPlan: report.therapeuticPlan,
          outcomeMeasurements: report.outcomeMeasurements.map(measurement => ({
            id: measurement.id,
            initialValue: measurement.initialValue,
            finalValue: measurement.finalValue,
            improvementPercentage: measurement.improvementPercentage,
            outcomeNotes: measurement.outcomeNotes,
            measurementDate: measurement.measurementDate,
            metric: measurement.metric
          })),
          objectiveOutcomes: report.objectiveOutcomes.map(outcome => ({
            id: outcome.id,
            finalStatus: outcome.finalStatus,
            achievementPercentage: outcome.achievementPercentage,
            outcomeDescription: outcome.outcomeDescription,
            evidence: outcome.evidence,
            challenges: outcome.challenges,
            objective: outcome.objective
          })),
          recommendations: report.recommendations.map(rec => ({
            id: rec.id,
            type: rec.type,
            description: rec.description,
            priority: rec.priority,
            timeframe: rec.timeframe,
            responsibleParty: rec.responsibleParty,
            isImplemented: rec.isImplemented
          })),
          stats: {
            totalOutcomeMeasurements: report._count.outcomeMeasurements,
            totalObjectiveOutcomes: report._count.objectiveOutcomes,
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
    console.error('Error fetching final reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/final-reports - Create a new final report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = finalReportCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Validate date logic
    if (validatedData.treatmentEndDate <= validatedData.treatmentStartDate) {
      return NextResponse.json(
        { error: 'Treatment end date must be after treatment start date' },
        { status: 400 }
      )
    }

    if (validatedData.reportDate < validatedData.treatmentEndDate) {
      return NextResponse.json(
        { error: 'Report date must be on or after treatment end date' },
        { status: 400 }
      )
    }

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

    // Validate outcome measurements and metrics
    for (const measurement of validatedData.outcomeMeasurements) {
      const metric = await db.therapeuticMetric.findUnique({
        where: { id: measurement.metricId }
      })

      if (!metric) {
        return NextResponse.json(
          { error: `Metric with ID ${measurement.metricId} not found` },
          { status: 404 }
        )
      }

      // Validate metric values based on type
      if (metric.type === 'numeric' && (typeof measurement.initialValue !== 'number' || typeof measurement.finalValue !== 'number')) {
        return NextResponse.json(
          { error: `Metric "${metric.name}" requires numeric values` },
          { status: 400 }
        )
      }

      if (metric.type === 'boolean' && (typeof measurement.initialValue !== 'boolean' || typeof measurement.finalValue !== 'boolean')) {
        return NextResponse.json(
          { error: `Metric "${metric.name}" requires boolean values` },
          { status: 400 }
        )
      }

      if (metric.type === 'text' && (typeof measurement.initialValue !== 'string' || typeof measurement.finalValue !== 'string')) {
        return NextResponse.json(
          { error: `Metric "${metric.name}" requires text values` },
          { status: 400 }
        )
      }

      // Validate numeric ranges
      if (metric.type === 'numeric' && typeof measurement.initialValue === 'number' && typeof measurement.finalValue === 'number') {
        if (metric.minValue !== undefined && (measurement.initialValue < metric.minValue || measurement.finalValue < metric.minValue)) {
          return NextResponse.json(
            { error: `Metric "${metric.name}" values must be at least ${metric.minValue}` },
            { status: 400 }
          )
        }
        if (metric.maxValue !== undefined && (measurement.initialValue > metric.maxValue || measurement.finalValue > metric.maxValue)) {
          return NextResponse.json(
            { error: `Metric "${metric.name}" values cannot exceed ${metric.maxValue}` },
            { status: 400 }
          )
        }
      }

      // Validate text length
      if (metric.type === 'text' && typeof measurement.initialValue === 'string' && typeof measurement.finalValue === 'string') {
        if (metric.maxLength && (measurement.initialValue.length > metric.maxLength || measurement.finalValue.length > metric.maxLength)) {
          return NextResponse.json(
            { error: `Metric "${metric.name}" text cannot exceed ${metric.maxLength} characters` },
            { status: 400 }
          )
        }
      }
    }

    // Validate objective outcomes
    for (const outcome of validatedData.objectiveOutcomes) {
      const objective = await db.therapeuticObjective.findUnique({
        where: { id: outcome.objectiveId }
      })

      if (!objective) {
        return NextResponse.json(
          { error: `Objective with ID ${outcome.objectiveId} not found` },
          { status: 404 }
        )
      }
    }

    // Create final report with transaction
    const result = await db.$transaction(async (tx) => {
      // Create final report
      const report = await tx.finalReport.create({
        data: {
          patientId: validatedData.patientId,
          therapistId: validatedData.therapistId,
          sessionId: validatedData.sessionId,
          therapeuticPlanId: validatedData.therapeuticPlanId,
          title: validatedData.title,
          reportDate: validatedData.reportDate,
          treatmentStartDate: validatedData.treatmentStartDate,
          treatmentEndDate: validatedData.treatmentEndDate,
          totalSessions: validatedData.totalSessions,
          treatmentSummary: validatedData.treatmentSummary,
          presentingProblems: validatedData.presentingProblems,
          treatmentGoals: validatedData.treatmentGoals,
          overallEffectiveness: validatedData.overallEffectiveness,
          effectivenessRating: validatedData.effectivenessRating,
          patientSatisfaction: validatedData.patientSatisfaction,
          therapistSatisfaction: validatedData.therapistSatisfaction,
          clinicalAssessment: validatedData.clinicalAssessment,
          functionalImprovements: validatedData.functionalImprovements,
          behavioralChanges: validatedData.behavioralChanges,
          emotionalStability: validatedData.emotionalStability,
          socialFunctioning: validatedData.socialFunctioning,
          followUpPlan: validatedData.followUpPlan,
          followUpSchedule: validatedData.followUpSchedule,
          maintenanceRecommendations: validatedData.maintenanceRecommendations,
          currentRiskLevel: validatedData.currentRiskLevel,
          riskFactors: validatedData.riskFactors,
          protectiveFactors: validatedData.protectiveFactors,
          safetyPlan: validatedData.safetyPlan,
          dischargeReason: validatedData.dischargeReason,
          dischargeStatus: validatedData.dischargeStatus,
          dischargeNotes: validatedData.dischargeNotes,
          status: validatedData.status,
          isConfidential: validatedData.isConfidential
        }
      })

      // Create outcome measurements
      for (const measurementData of validatedData.outcomeMeasurements) {
        await tx.finalOutcomeMeasurement.create({
          data: {
            reportId: report.id,
            metricId: measurementData.metricId,
            initialValue: measurementData.initialValue,
            finalValue: measurementData.finalValue,
            improvementPercentage: measurementData.improvementPercentage,
            outcomeNotes: measurementData.outcomeNotes,
            measurementDate: measurementData.measurementDate
          }
        })
      }

      // Create objective outcomes
      for (const outcomeData of validatedData.objectiveOutcomes) {
        await tx.finalObjectiveOutcome.create({
          data: {
            reportId: report.id,
            objectiveId: outcomeData.objectiveId,
            finalStatus: outcomeData.finalStatus,
            achievementPercentage: outcomeData.achievementPercentage,
            outcomeDescription: outcomeData.outcomeDescription,
            evidence: outcomeData.evidence,
            challenges: outcomeData.challenges
          }
        })
      }

      // Create recommendations
      for (const recommendationData of validatedData.recommendations) {
        await tx.finalRecommendation.create({
          data: {
            reportId: report.id,
            type: recommendationData.type,
            description: recommendationData.description,
            priority: recommendationData.priority,
            timeframe: recommendationData.timeframe,
            responsibleParty: recommendationData.responsibleParty,
            isImplemented: recommendationData.isImplemented
          }
        })
      }

      return report
    })

    // Return created report with related data
    const createdReport = await db.finalReport.findUnique({
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
        outcomeMeasurements: {
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
        objectiveOutcomes: {
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
        recommendations: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Final report created successfully',
      data: createdReport
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating final report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
