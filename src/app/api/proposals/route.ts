import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const proposalQuerySchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']).optional(),
  therapistId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  treatmentPeriod: z.enum(['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM']).optional(),
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional()
})

// GET /api/proposals - Get therapeutic proposals with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    // Validate query parameters
    const validation = proposalQuerySchema.safeParse(query)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { status, therapistId, patientId, treatmentPeriod, page = 1, limit = 20 } = validation.data

    // Build where clause
    let whereClause: any = {}

    if (status) whereClause.status = status
    if (therapistId) whereClause.therapistId = therapistId
    if (patientId) whereClause.patientId = patientId
    if (treatmentPeriod) whereClause.treatmentPeriod = treatmentPeriod

    // Fetch proposals with related data
    const proposals = await db.therapeuticProposal.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            },
            parent: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true
                  }
                }
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
                email: true,
                phone: true
              }
            }
          }
        },
        consultationRequest: {
          select: {
            id: true,
            reason: true,
            status: true
          }
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                type: true,
                sessionDuration: true,
                costPerSession: true
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
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    })

    // Get total count for pagination
    const total = await db.therapeuticProposal.count({ where: whereClause })

    return NextResponse.json({
      proposals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}