import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const updateProposalSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']).optional(),
  selectedProposal: z.enum(['A', 'B']).optional(),
  paymentPlanType: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'SINGLE_PAYMENT']).optional(),
  notes: z.string().optional(),
  coordinatorNotes: z.string().optional(),
  adminNotes: z.string().optional()
})

// GET /api/proposals/[id] - Get specific proposal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const proposal = await db.therapeuticProposal.findUnique({
      where: { id: params.id },
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
            description: true,
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
            assignedTherapist: {
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
            serviceAssignments: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    type: true
                  }
                }
              }
            }
          }
        },
        // Note: payments relation not directly available in TherapeuticProposal schema
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ proposal })

  } catch (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/proposals/[id] - Update proposal
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = updateProposalSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const updateData = validation.data

    // Get existing proposal
    const existingProposal = await db.therapeuticProposal.findUnique({
      where: { id: params.id }
    })

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Prepare update data with timestamps
    const updatePayload: any = { ...updateData }

    // Add timestamps based on status changes
    if (updateData.status === 'UNDER_REVIEW' && existingProposal.status !== 'UNDER_REVIEW') {
      updatePayload.reviewedAt = new Date()
    }

    if (updateData.status === 'APPROVED' && existingProposal.status !== 'APPROVED') {
      updatePayload.approvedAt = new Date()
    }

    // Update proposal
    const updatedProposal = await db.therapeuticProposal.update({
      where: { id: params.id },
      data: updatePayload,
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
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      proposal: updatedProposal,
      message: 'Proposal updated successfully'
    })

  } catch (error) {
    console.error('Error updating proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}