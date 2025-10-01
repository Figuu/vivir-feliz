import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Helper function to get current user from Supabase
async function getCurrentUser(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  const dbUser = await db.profile.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      role: true,
      firstName: true,
      lastName: true,
      therapist: {
        select: { id: true }
      }
    }
  })
  
  return dbUser
}

// Validation schema for proposal review
const proposalReviewSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES', 'PENDING_REVIEW']),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  coordinatorNotes: z.string().max(1000, 'Coordinator notes cannot exceed 1000 characters').optional(),
  adminNotes: z.string().max(1000, 'Admin notes cannot exceed 1000 characters').optional(),
  selectedProposal: z.enum(['A', 'B']).optional()
})

// GET /api/proposals/[id]/review - Get proposal review data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const proposalId = params.id
    const userRole = currentUser.role
    
    // Find proposal from database
    const proposal = await db.therapeuticProposal.findUnique({
      where: { id: proposalId },
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
            service: true
          }
        }
      }
    })
    
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }
    
    // Check access permissions
    if (userRole === 'THERAPIST' && proposal.therapistId !== currentUser.therapist?.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Build review data
    const reviewData = {
      id: proposal.id,
      patientId: proposal.patientId,
      therapistId: proposal.therapistId,
      status: proposal.status,
      notes: proposal.notes,
      coordinatorNotes: proposal.coordinatorNotes,
      adminNotes: proposal.adminNotes,
      selectedProposal: proposal.selectedProposal,
      patient: proposal.patient,
      therapist: proposal.therapist,
      services: proposal.services,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt
    }
    
    return NextResponse.json({
      success: true,
      data: reviewData
    })
    
  } catch (error) {
    console.error('Error fetching proposal review data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/proposals/[id]/review - Review proposal
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const proposalId = params.id
    const userRole = currentUser.role
    const userId = currentUser.id
    
    // Check if user has permission to review
    if (!['COORDINATOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    // Find proposal from database
    const proposal = await db.therapeuticProposal.findUnique({
      where: { id: proposalId }
    })
    
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }
    
    const body = await request.json()
    
    // Validate review data
    const validation = proposalReviewSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid review data', details: validation.error.issues },
        { status: 400 }
      )
    }
    
    const { action, notes, coordinatorNotes, adminNotes, selectedProposal } = validation.data
    
    // Prepare update data based on user role and action
    const updateData: any = {
      status: action === 'APPROVE' ? 'APPROVED' : 
             action === 'REJECT' ? 'REJECTED' :
             action === 'REQUEST_CHANGES' ? 'PENDING_CHANGES' : 'UNDER_REVIEW'
    }
    
    // Update notes based on user role
    if (userRole === 'COORDINATOR') {
      if (coordinatorNotes) updateData.coordinatorNotes = coordinatorNotes
      if (notes) updateData.coordinatorNotes = notes
    } else if (['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      if (adminNotes) updateData.adminNotes = adminNotes
      if (notes) updateData.adminNotes = notes
    }
    
    // Update selected proposal if provided
    if (selectedProposal) {
      updateData.selectedProposal = selectedProposal
    }
    
    // Update proposal in database
    const updatedProposal = await db.therapeuticProposal.update({
      where: { id: proposalId },
      data: updateData,
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
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `Proposal ${action.toLowerCase()}d successfully`,
      data: {
        id: updatedProposal.id,
        status: updatedProposal.status,
        notes: updatedProposal.notes,
        coordinatorNotes: updatedProposal.coordinatorNotes,
        adminNotes: updatedProposal.adminNotes,
        selectedProposal: updatedProposal.selectedProposal,
        patient: updatedProposal.patient,
        therapist: updatedProposal.therapist,
        updatedAt: updatedProposal.updatedAt
      }
    })
    
  } catch (error) {
    console.error('Error reviewing proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}