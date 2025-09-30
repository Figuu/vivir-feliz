import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { validateProposalComment } from '@/lib/proposal-validation'

// Helper function to get current user from Supabase
async function getCurrentUser(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      role: true,
      name: true,
      therapist: {
        select: { id: true }
      }
    }
  })
  
  return dbUser
}

// Comments are stored directly in coordinatorNotes and adminNotes fields in the database

// GET /api/proposals/[id]/comments - Get proposal comments
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
    const therapistId = currentUser.therapist?.id
    
    // Find proposal from database
    const proposal = await db.therapeuticProposal.findUnique({
      where: { id: proposalId },
      select: {
        id: true,
        therapistId: true,
        notes: true,
        coordinatorNotes: true,
        adminNotes: true,
        createdAt: true,
        updatedAt: true,
        therapist: {
          select: {
            user: {
              select: { name: true }
            }
          }
        }
      }
    })
    
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }
    
    // Check access permissions
    if (userRole === 'THERAPIST' && proposal.therapistId !== therapistId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Build comments array from proposal fields
    const comments = []
    
    if (proposal.notes) {
      comments.push({
        id: `${proposal.id}-therapist-note`,
        proposalId: proposal.id,
        userId: proposal.therapistId,
        userName: proposal.therapist.user.name || 'Therapist',
        userRole: 'THERAPIST',
        content: proposal.notes,
        isInternal: false,
        createdAt: proposal.createdAt
      })
    }
    
    if (proposal.coordinatorNotes && ['COORDINATOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      comments.push({
        id: `${proposal.id}-coordinator-note`,
        proposalId: proposal.id,
        userId: 'coordinator',
        userName: 'Coordinator',
        userRole: 'COORDINATOR',
        content: proposal.coordinatorNotes,
        isInternal: true,
        createdAt: proposal.updatedAt
      })
    }
    
    if (proposal.adminNotes && ['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      comments.push({
        id: `${proposal.id}-admin-note`,
        proposalId: proposal.id,
        userId: 'admin',
        userName: 'Administrator',
        userRole: 'ADMIN',
        content: proposal.adminNotes,
        isInternal: true,
        createdAt: proposal.updatedAt
      })
    }
    
    return NextResponse.json({
      proposalId,
      comments,
      total: comments.length
    })
    
  } catch (error) {
    console.error('Error fetching proposal comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/proposals/[id]/comments - Add comment to proposal
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
    const userName = currentUser.name || 'User'
    const therapistId = currentUser.therapist?.id
    
    // Find proposal from database
    const proposal = await db.therapeuticProposal.findUnique({
      where: { id: proposalId }
    })
    
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }
    
    // Check access permissions
    if (userRole === 'THERAPIST' && proposal.therapistId !== therapistId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    const body = await request.json()
    
    // Validate comment data
    const validation = validateProposalComment(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid comment data', details: validation.error.issues },
        { status: 400 }
      )
    }
    
    const { content, isInternal } = validation.data
    
    // Update appropriate field based on user role
    const updateData: any = {}
    
    if (userRole === 'THERAPIST') {
      updateData.notes = content
    } else if (userRole === 'COORDINATOR') {
      updateData.coordinatorNotes = content
    } else if (['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      updateData.adminNotes = content
    }
    
    // Update proposal in database
    const updatedProposal = await db.therapeuticProposal.update({
      where: { id: proposalId },
      data: updateData
    })
    
    const newComment = {
      id: `${proposalId}-${userRole.toLowerCase()}-note`,
      proposalId,
      userId,
      userName,
      userRole,
      content,
      isInternal: isInternal || false,
      attachments: [],
      createdAt: updatedProposal.updatedAt.toISOString()
    }
    
    const filteredComment = newComment
    
    return NextResponse.json({
      comment: filteredComment,
      message: 'Comment added successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error adding proposal comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
