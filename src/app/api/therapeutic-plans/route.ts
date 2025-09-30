import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas - Updated to match new schema
const therapeuticPlanCreateSchema = z.object({
  therapeuticProposalId: z.string().uuid('Invalid therapeutic proposal ID'),
  patientId: z.string().uuid('Invalid patient ID'),
  therapistId: z.string().uuid('Invalid therapist ID'),
  objectives: z.any(), // JSON field - flexible validation
  background: z.string().max(2000).optional(),
  metrics: z.any(), // JSON field - flexible validation
  recommendations: z.string().max(2000).optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']).default('DRAFT'),
  coordinatorNotes: z.string().max(1000).optional(),
})

const therapeuticPlanUpdateSchema = therapeuticPlanCreateSchema.partial().omit({ therapeuticProposalId: true })

const therapeuticPlanQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']).optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).optional().default('createdAt'),
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
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, patientId, therapistId, status, search, sortBy, sortOrder, includeCompleted } = validation.data

    // Build where clause
    const whereClause: any = {}

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
        { background: { contains: search, mode: 'insensitive' } },
        { recommendations: { contains: search, mode: 'insensitive' } },
        { coordinatorNotes: { contains: search, mode: 'insensitive' } }
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
              dateOfBirth: true
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
          therapeuticProposal: {
            select: {
              id: true,
              proposalDate: true,
              status: true
            }
          },
          _count: {
            select: {
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
          therapeuticProposalId: plan.therapeuticProposalId,
          status: plan.status,
          objectives: plan.objectives,
          background: plan.background,
          metrics: plan.metrics,
          recommendations: plan.recommendations,
          coordinatorNotes: plan.coordinatorNotes,
          patient: plan.patient,
          therapist: {
            id: plan.therapist.id,
            firstName: plan.therapist.profile.firstName,
            lastName: plan.therapist.profile.lastName,
            email: plan.therapist.profile.email
          },
          therapeuticProposal: plan.therapeuticProposal,
          stats: {
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
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if therapeutic proposal exists
    const therapeuticProposal = await db.therapeuticProposal.findUnique({
      where: { id: validatedData.therapeuticProposalId }
    })

    if (!therapeuticProposal) {
      return NextResponse.json(
        { error: 'Therapeutic proposal not found' },
        { status: 404 }
      )
    }

    // Check if plan already exists for this proposal
    const existingPlan = await db.therapeuticPlan.findUnique({
      where: { therapeuticProposalId: validatedData.therapeuticProposalId }
    })

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Therapeutic plan already exists for this proposal' },
        { status: 409 }
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

    // Create therapeutic plan
    const plan = await db.therapeuticPlan.create({
      data: {
        therapeuticProposalId: validatedData.therapeuticProposalId,
        patientId: validatedData.patientId,
        therapistId: validatedData.therapistId,
        objectives: validatedData.objectives || {},
        background: validatedData.background,
        metrics: validatedData.metrics || {},
        recommendations: validatedData.recommendations,
        status: validatedData.status,
        coordinatorNotes: validatedData.coordinatorNotes,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true
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
        therapeuticProposal: {
          select: {
            id: true,
            proposalDate: true,
            status: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Therapeutic plan created successfully',
      data: {
        ...plan,
        therapist: {
          id: plan.therapist.id,
          firstName: plan.therapist.profile.firstName,
          lastName: plan.therapist.profile.lastName,
          email: plan.therapist.profile.email
        }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating therapeutic plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
