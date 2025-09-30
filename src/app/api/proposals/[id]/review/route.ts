import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { validateProposalReview } from '@/lib/proposal-validation'

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
      therapist: {
        select: { id: true }
      }
    }
  })
  
  return dbUser
}

// Legacy mock data structure (not used anymore)
const __legacyMockProposals = [
  {
    id: 'PROP-2024-001',
    patientId: 'PAT-2024-001',
    therapistId: 'THER-2024-001',
    selectedServices: [
      {
        service: {
          id: 'service-1',
          code: 'EVAL-001',
          name: 'Evaluación Pediátrica Integral',
          description: 'Evaluación completa del desarrollo infantil',
          categoryId: 'cat-1',
          category: {
            id: 'cat-1',
            name: 'Terapia Pediátrica',
            color: '#3b82f6',
            icon: 'baby'
          },
          type: 'EVALUATION',
          duration: 120,
          price: 150.00,
          currency: 'USD',
          isActive: true,
          requiresApproval: false,
          maxSessions: 1,
          minSessions: 1,
          ageRange: { min: 2, max: 18 },
          prerequisites: ['Historial médico', 'Informes escolares'],
          outcomes: ['Diagnóstico integral', 'Plan de tratamiento', 'Recomendaciones'],
          tags: ['pediatric', 'evaluation', 'development']
        },
        sessionCount: 1,
        notes: 'Evaluación inicial para determinar necesidades específicas',
        priority: 'HIGH'
      }
    ],
    totalSessions: 1,
    estimatedDuration: 120,
    estimatedCost: 150.00,
    currency: 'USD',
    status: 'UNDER_REVIEW',
    priority: 'HIGH',
    notes: 'Propuesta para paciente pediátrico con necesidades múltiples de terapia',
    goals: [
      'Mejorar las habilidades de comunicación y lenguaje',
      'Desarrollar habilidades motoras finas y gruesas'
    ],
    expectedOutcomes: [
      'Comunicación más efectiva con familiares y compañeros',
      'Mejora en las habilidades motoras para actividades diarias'
    ],
    followUpRequired: true,
    followUpNotes: 'Seguimiento mensual para evaluar progreso',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    submittedAt: '2024-01-20T11:00:00Z',
    reviewedAt: '2024-01-20T13:00:00Z',
    reviewedBy: 'coord-001',
    coordinatorNotes: 'Propuesta bien estructurada con objetivos claros',
    pricingNotes: 'Costos dentro del rango presupuestario',
    approvalNotes: 'Aprobación pendiente de revisión final',
    adminNotes: 'Verificar cobertura de seguro antes de aprobación final',
    finalApprovalNotes: 'Aprobación final pendiente',
    budgetApproval: true,
    insuranceCoverage: {
      covered: true,
      percentage: 80,
      notes: 'Cobertura del 80% por seguro médico'
    },
    paymentTerms: {
      method: 'MIXED',
      installments: 3,
      notes: 'Pago en 3 cuotas: 40% inicial, 30% a mitad del tratamiento, 30% final'
    }
  }
]

// Helper function to get user role from request headers
function getUserRole(request: NextRequest): string {
  return request.headers.get('x-user-role') || 'THERAPIST'
}

// Helper function to get user ID from request headers
function getUserId(request: NextRequest): string {
  return request.headers.get('x-user-id') || 'user-1'
}

// Helper function to check if user can review proposal
function canUserReviewProposal(proposal: any, userRole: string): boolean {
  // Only coordinators and admins can review proposals
  if (!['COORDINATOR', 'ADMIN'].includes(userRole)) {
    return false
  }
  
  // Proposal must be in reviewable status
  return ['SUBMITTED', 'UNDER_REVIEW'].includes(proposal.status)
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

// GET /api/proposals/[id]/review - Get proposal review information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = getUserRole(request)
    const userId = getUserId(request)
    const proposalId = params.id
    
    // Find proposal
    const proposal = await db.therapeuticProposal.findUnique({
      where: { id: proposalId },
      include: {
        services: { include: { service: true } },
        patient: true,
        therapist: true
      }
    })
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }
    
    // Check access permissions
    if (!canUserReviewProposal(proposal, userRole)) {
      return NextResponse.json(
        { error: 'Access denied or proposal cannot be reviewed' },
        { status: 403 }
      )
    }
    
    // Get review information
    const reviewInfo = {
      proposalId,
      currentStatus: proposal.status,
      canReview: true,
      reviewHistory: {
        submittedAt: proposal.submittedAt,
        reviewedAt: proposal.reviewedAt,
        reviewedBy: proposal.reviewedBy,
        coordinatorNotes: proposal.coordinatorNotes,
        pricingNotes: proposal.pricingNotes,
        approvalNotes: proposal.approvalNotes,
        adminNotes: proposal.adminNotes,
        budgetApproval: proposal.budgetApproval,
        insuranceCoverage: proposal.insuranceCoverage,
        paymentTerms: proposal.paymentTerms
      },
      availableActions: []
    }
    
    // Determine available review actions based on user role and current status
    if (userRole === 'COORDINATOR') {
      if (proposal.status === 'SUBMITTED') {
        reviewInfo.availableActions.push(
          { action: 'START_REVIEW', description: 'Start review process' },
          { action: 'REJECT', description: 'Reject proposal' }
        )
      } else if (proposal.status === 'UNDER_REVIEW') {
        reviewInfo.availableActions.push(
          { action: 'APPROVE', description: 'Approve proposal' },
          { action: 'REJECT', description: 'Reject proposal' },
          { action: 'REQUEST_REVISION', description: 'Request revision from therapist' }
        )
      }
    }
    
    if (userRole === 'ADMIN') {
      reviewInfo.availableActions.push(
        { action: 'FINAL_APPROVE', description: 'Final administrative approval' },
        { action: 'REJECT', description: 'Reject proposal' },
        { action: 'CANCEL', description: 'Cancel proposal' }
      )
    }
    
    return NextResponse.json(reviewInfo)
    
  } catch (error) {
    console.error('Error fetching proposal review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/proposals/[id]/review - Submit proposal review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = getUserRole(request)
    const userId = getUserId(request)
    const proposalId = params.id
    
    // Find proposal
    const proposal = await db.therapeuticProposal.findUnique({
      where: { id: proposalId }
    })
    
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }
    
    // Check access permissions
    if (!canUserReviewProposal(proposal, userRole)) {
      return NextResponse.json(
        { error: 'Access denied or proposal cannot be reviewed' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validate review data
    const validation = validateProposalReview(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid review data', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    const { 
      status, 
      notes, 
      coordinatorNotes, 
      pricingNotes, 
      approvalNotes, 
      adminNotes, 
      budgetApproval, 
      insuranceCoverage, 
      paymentTerms 
    } = validation.data
    
    // Update proposal with review information
    const updatedProposal = {
      ...proposal,
      status: status === 'APPROVED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : 'UNDER_REVIEW',
      updatedAt: new Date().toISOString(),
      reviewedAt: new Date().toISOString(),
      reviewedBy: userId
    }
    
    // Add review-specific fields based on user role
    if (userRole === 'COORDINATOR') {
      updatedProposal.coordinatorNotes = coordinatorNotes || notes
      updatedProposal.pricingNotes = pricingNotes
      updatedProposal.approvalNotes = approvalNotes
      updatedProposal.budgetApproval = budgetApproval
      updatedProposal.insuranceCoverage = insuranceCoverage
      updatedProposal.paymentTerms = paymentTerms
    }
    
    if (userRole === 'ADMIN') {
      updatedProposal.adminNotes = adminNotes || notes
      updatedProposal.finalApprovalNotes = status === 'APPROVED' ? notes : undefined
    }
    
    // Update proposal in database
    const savedProposal = await db.therapeuticProposal.update({
      where: { id: proposalId },
      data: updatedProposal,
      include: {
        therapist: true,
        patient: true
      }
    })
    
    // Filter data based on user role
    const filteredProposal = filterProposalData(updatedProposal, userRole)
    
    return NextResponse.json({
      proposal: filteredProposal,
      review: {
        status,
        notes,
        reviewedBy: userId,
        reviewedAt: new Date().toISOString(),
        userRole
      },
      message: `Proposal review submitted: ${status}`
    })
    
  } catch (error) {
    console.error('Error submitting proposal review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
