import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { ReportStatus } from '@prisma/client'

// Simplified validation schemas based on actual Prisma schema
const finalReportCreateSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  therapistId: z.string().uuid('Invalid therapist ID'),
  finalMetrics: z.record(z.string(), z.unknown()),
  conclusions: z.string().optional(),
  recommendations: z.string().optional(),
  status: z.nativeEnum(ReportStatus).default(ReportStatus.DRAFT),
  coordinatorNotes: z.string().optional(),
  coordinatorReport: z.string().optional()
})

const finalReportUpdateSchema = finalReportCreateSchema.partial()

const finalReportQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  status: z.nativeEnum(ReportStatus).optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt']).optional().default('createdAt'),
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
      status: searchParams.get('status'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      includeDrafts: searchParams.get('includeDrafts')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, patientId, therapistId, status, search, sortBy, sortOrder, includeDrafts } = validation.data

    // Build where clause
    const whereClause: any = {}

    if (!includeDrafts) {
      whereClause.status = { not: ReportStatus.DRAFT }
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
        { conclusions: { contains: search, mode: 'insensitive' } },
        { recommendations: { contains: search, mode: 'insensitive' } },
        { coordinatorReport: { contains: search, mode: 'insensitive' } }
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
              dateOfBirth: true
            }
          },
          therapist: {
            select: {
              id: true,
              profileId: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
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
          patientId: report.patientId,
          patient: report.patient,
          therapistId: report.therapistId,
          therapist: {
            id: report.therapist.id,
            firstName: report.therapist.profile.firstName,
            lastName: report.therapist.profile.lastName,
            email: report.therapist.profile.email
          },
          finalMetrics: report.finalMetrics,
          conclusions: report.conclusions,
          recommendations: report.recommendations,
          status: report.status,
          coordinatorNotes: report.coordinatorNotes,
          coordinatorReport: report.coordinatorReport,
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

    // Create final report
    const report = await db.finalReport.create({
      data: {
        patientId: validatedData.patientId,
        therapistId: validatedData.therapistId,
        finalMetrics: validatedData.finalMetrics as any,
        conclusions: validatedData.conclusions,
        recommendations: validatedData.recommendations,
        status: validatedData.status,
        coordinatorNotes: validatedData.coordinatorNotes,
        coordinatorReport: validatedData.coordinatorReport
      },
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
            profileId: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Final report created successfully',
      data: report
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating final report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
