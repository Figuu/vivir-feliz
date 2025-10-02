import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Simplified validation schemas
const progressReportCreateSchema = z.object({
  therapeuticPlanId: z.string().uuid('Invalid therapeutic plan ID'),
  patientId: z.string().uuid('Invalid patient ID'),
  therapistId: z.string().uuid('Invalid therapist ID'),
  reportNumber: z.number().min(1, 'Report number must be at least 1'),
  progress: z.string().max(2000, 'Progress description cannot exceed 2000 characters').optional(),
  observations: z.string().max(2000, 'Observations cannot exceed 2000 characters').optional(),
  metricsUpdate: z.record(z.string(), z.any()).optional(),
  coordinatorNotes: z.string().max(1000, 'Coordinator notes cannot exceed 1000 characters').optional()
})

const progressReportUpdateSchema = progressReportCreateSchema.partial()

const progressReportQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  therapeuticPlanId: z.string().uuid('Invalid therapeutic plan ID').optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'reportNumber']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// GET /api/progress-reports - Get progress reports with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const validation = progressReportQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      patientId: searchParams.get('patientId'),
      therapistId: searchParams.get('therapistId'),
      therapeuticPlanId: searchParams.get('therapeuticPlanId'),
      status: searchParams.get('status'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, patientId, therapistId, therapeuticPlanId, status, startDate, endDate, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
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
    
    if (startDate) {
      whereClause.createdAt = { gte: new Date(startDate) }
    }
    
    if (endDate) {
      whereClause.createdAt = { 
        ...whereClause.createdAt,
        lte: new Date(endDate) 
      }
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
                  lastName: true,
                  email: true
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
                  lastName: true,
                  email: true
                }
              }
            }
          },
          therapeuticPlan: {
            select: {
              id: true,
              title: true,
              description: true
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
          metricsUpdate: report.metricsUpdate,
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
          therapeuticPlanId,
          status,
          startDate,
          endDate,
          sortBy,
          sortOrder
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
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validation.data

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

    // Check if report number is unique for this therapeutic plan
    const existingReport = await db.progressReport.findFirst({
      where: {
        therapeuticPlanId: validatedData.therapeuticPlanId,
        reportNumber: validatedData.reportNumber
      }
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Report number already exists for this therapeutic plan' },
        { status: 400 }
      )
    }

    // Create progress report
    const result = await db.progressReport.create({
      data: {
        therapeuticPlanId: validatedData.therapeuticPlanId,
        patientId: validatedData.patientId,
        therapistId: validatedData.therapistId,
        reportNumber: validatedData.reportNumber,
        progress: validatedData.progress,
        observations: validatedData.observations,
        metricsUpdate: validatedData.metricsUpdate,
        coordinatorNotes: validatedData.coordinatorNotes,
        status: 'DRAFT'
      },
      include: {
        patient: {
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
        therapeuticPlan: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Progress report created successfully',
      data: result
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating progress report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}