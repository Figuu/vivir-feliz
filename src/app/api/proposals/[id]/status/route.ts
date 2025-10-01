import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { validateProposalStatusTransition } from '@/lib/proposal-validation'

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
      therapist: {
        select: { id: true }
      }
    }
  })
  
  return dbUser
}

// Helper function to check if user can change proposal status
function canUserChangeStatus(proposal: any, userRole: string, userId: string, newStatus: string): boolean {
  // Therapists can only submit proposals
  if (userRole === 'THERAPIST') {
    return proposal.therapistId === userId && newStatus === 'SUBMITTED'
  }
  
  // Coordinators can review and approve/reject
  if (userRole === 'COORDINATOR') {
    return ['UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(newStatus)
  }
  
  // Admins can do everything
  if (userRole === 'ADMIN') {
    return true
  }
  
  return false
}

// Helper function to filter proposal data based on user role
function filterProposalData(proposal: any, userRole: string): any {
  const filteredProposal = { ...proposal }
  
  if (userRole === 'THERAPIST') {
    delete filteredProposal.estimatedCost
    delete filteredProposal.pricingNotes
    delete filteredProposal.budgetApproval
    delete filteredProposal.insuranceCoverage
    delete filteredProposal.paymentTerms
    delete filteredProposal.coordinatorNotes
    delete filteredProposal.adminNotes
    delete filteredProposal.finalApprovalNotes
  }
  
  if (userRole === 'COORDINATOR') {
    delete filteredProposal.adminNotes
    delete filteredProposal.finalApprovalNotes
  }
  
  return filteredProposal
}

// GET /api/proposals/[id]/status - Get proposal status and available transitions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const proposalId = params.id
    const userRole = currentUser.role
    const userId = currentUser.id
    const therapistId = currentUser.therapist?.id
    
    // Find proposal from database
    const proposal = await db.therapeuticProposal.findUnique({
      where: { id: proposalId },
      include: {
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
        }
      }
    })
    
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }
    
    // Check access permissions
    if (userRole === 'THERAPIST' && proposal.therapistId !== therapistId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Get available transitions based on current status and user role
    const availableTransitions = []
    
    switch (proposal.status) {
      case 'DRAFT':
        if (userRole === 'THERAPIST' && proposal.therapistId === userId) {
          availableTransitions.push({
            toStatus: 'SUBMITTED',
            description: 'Submit proposal for review',
            requiredRole: 'THERAPIST'
          })
        }
        break
        
      case 'SUBMITTED':
        if (['COORDINATOR', 'ADMIN'].includes(userRole)) {
          availableTransitions.push(
            {
              toStatus: 'UNDER_REVIEW',
              description: 'Start review process',
              requiredRole: 'COORDINATOR'
            },
            {
              toStatus: 'REJECTED',
              description: 'Reject proposal',
              requiredRole: 'COORDINATOR'
            }
          )
        }
        break
        
      case 'UNDER_REVIEW':
        if (['COORDINATOR', 'ADMIN'].includes(userRole)) {
          availableTransitions.push(
            {
              toStatus: 'APPROVED',
              description: 'Approve proposal',
              requiredRole: 'COORDINATOR'
            },
            {
              toStatus: 'REJECTED',
              description: 'Reject proposal',
              requiredRole: 'COORDINATOR'
            },
            {
              toStatus: 'CANCELLED',
              description: 'Cancel proposal',
              requiredRole: 'COORDINATOR'
            }
          )
        }
        break
        
      case 'APPROVED':
        if (userRole === 'ADMIN') {
          availableTransitions.push(
            {
              toStatus: 'COMPLETED',
              description: 'Mark as completed',
              requiredRole: 'ADMIN'
            },
            {
              toStatus: 'CANCELLED',
              description: 'Cancel approved proposal',
              requiredRole: 'ADMIN'
            }
          )
        }
        break
        
      case 'REJECTED':
        if (userRole === 'THERAPIST' && proposal.therapistId === userId) {
          availableTransitions.push({
            toStatus: 'DRAFT',
            description: 'Return to draft for revision',
            requiredRole: 'THERAPIST'
          })
        }
        if (userRole === 'ADMIN') {
          availableTransitions.push({
            toStatus: 'CANCELLED',
            description: 'Cancel rejected proposal',
            requiredRole: 'ADMIN'
          })
        }
        break
    }
    
    return NextResponse.json({
      proposalId,
      currentStatus: proposal.status,
      availableTransitions,
      userRole,
      canChangeStatus: availableTransitions.length > 0
    })
    
  } catch (error) {
    console.error('Error fetching proposal status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/proposals/[id]/status - Update proposal status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const proposalId = params.id
    const userRole = currentUser.role
    const userId = currentUser.id
    const therapistId = currentUser.therapist?.id
    
    // Find proposal from database
    const proposal = await db.therapeuticProposal.findUnique({
      where: { id: proposalId }
    })
    
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }
    
    const body = await request.json()
    
    const { fromStatus, toStatus, notes, reason } = body
    
    // Verify current status matches
    if (proposal.status !== fromStatus) {
      return NextResponse.json(
        { error: `Proposal status mismatch. Expected ${fromStatus}, got ${proposal.status}` },
        { status: 400 }
      )
    }
    
    // Check if user can change status
    if (!canUserChangeStatus(proposal, userRole, userId, toStatus)) {
      return NextResponse.json(
        { error: 'User not authorized to change status to ' + toStatus },
        { status: 403 }
      )
    }
    
    // Validate transition logic
    const transitionValidation = validateProposalStatusTransition(fromStatus, toStatus, userRole)
    if (!transitionValidation.valid) {
      return NextResponse.json(
        { error: transitionValidation.error },
        { status: 400 }
      )
    }
    
    // Prepare update data
    const updateData: any = {
      status: toStatus,
    }
    
    // Set specific fields based on status
    switch (toStatus) {
      case 'SUBMITTED':
        // No additional fields for SUBMITTED status in Prisma schema
        break
      case 'UNDER_REVIEW':
        updateData.reviewedAt = new Date()
        break
      case 'COORDINATOR_APPROVED':
        updateData.coordinatorNotes = notes || 'Approved by coordinator'
        break
      case 'ADMIN_APPROVED':
        updateData.approvedAt = new Date()
        updateData.adminNotes = notes || 'Approved by administrator'
        break
      case 'REJECTED':
        updateData.coordinatorNotes = notes || reason || 'Rejected'
        break
      case 'CONFIRMED':
        updateData.approvedAt = new Date()
        updateData.adminNotes = notes || 'Confirmed'
        break
    }
    
    // Update proposal in database
    const updatedProposal = await db.therapeuticProposal.update({
      where: { id: proposalId },
      data: updateData,
      include: {
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
        }
      }
    })
    
    // Filter data based on user role
    const filteredProposal = filterProposalData(updatedProposal, userRole)
    
    return NextResponse.json({
      proposal: filteredProposal,
      message: `Proposal status changed from ${fromStatus} to ${toStatus}`,
      transition: {
        fromStatus,
        toStatus,
        notes,
        reason,
        changedBy: userId,
        changedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Error updating proposal status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
