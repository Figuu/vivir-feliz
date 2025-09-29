import { NextRequest, NextResponse } from 'next/server'
import { 
  validateProposalStatusTransition,
  validateProposalStatusTransition as validateTransition
} from '@/lib/proposal-validation'

// Mock data for demonstration
const mockProposals = [
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
    const userRole = getUserRole(request)
    const userId = getUserId(request)
    const proposalId = params.id
    
    // Find proposal
    const proposal = mockProposals.find(p => p.id === proposalId)
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }
    
    // Check access permissions
    if (userRole === 'THERAPIST' && proposal.therapistId !== userId) {
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
    const userRole = getUserRole(request)
    const userId = getUserId(request)
    const proposalId = params.id
    
    // Find proposal
    const proposalIndex = mockProposals.findIndex(p => p.id === proposalId)
    if (proposalIndex === -1) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }
    
    const proposal = mockProposals[proposalIndex]
    
    const body = await request.json()
    
    // Validate status transition data
    const validation = validateProposalStatusTransition(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid status transition data', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    const { fromStatus, toStatus, notes, reason } = validation.data
    
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
    const transitionValidation = validateTransition(fromStatus, toStatus, userRole)
    if (!transitionValidation.valid) {
      return NextResponse.json(
        { error: transitionValidation.error },
        { status: 400 }
      )
    }
    
    // Update proposal status
    const updatedProposal = {
      ...proposal,
      status: toStatus,
      updatedAt: new Date().toISOString()
    }
    
    // Set specific timestamps based on status
    switch (toStatus) {
      case 'SUBMITTED':
        updatedProposal.submittedAt = new Date().toISOString()
        break
      case 'UNDER_REVIEW':
        updatedProposal.reviewedAt = new Date().toISOString()
        updatedProposal.reviewedBy = userId
        break
      case 'APPROVED':
        updatedProposal.approvalNotes = notes || 'Approved'
        break
      case 'REJECTED':
        updatedProposal.approvalNotes = notes || reason || 'Rejected'
        break
      case 'COMPLETED':
        updatedProposal.finalApprovalNotes = notes || 'Completed'
        break
    }
    
    mockProposals[proposalIndex] = updatedProposal
    
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
