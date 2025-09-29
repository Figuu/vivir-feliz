import { NextRequest, NextResponse } from 'next/server'
import { 
  validateUpdateProposal,
  validateProposalStatusTransition,
  validateProposalComment,
  validateProposalAssignment,
  validateProposalReview
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

// Helper function to check if user can access proposal
function canUserAccessProposal(proposal: any, userRole: string, userId: string): boolean {
  if (userRole === 'THERAPIST') {
    return proposal.therapistId === userId
  }
  return ['COORDINATOR', 'ADMIN'].includes(userRole)
}

// Helper function to check if user can edit proposal
function canUserEditProposal(proposal: any, userRole: string, userId: string): boolean {
  if (userRole === 'THERAPIST') {
    return proposal.therapistId === userId && proposal.status === 'DRAFT'
  }
  return ['COORDINATOR', 'ADMIN'].includes(userRole)
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

// GET /api/proposals/[id] - Get specific proposal
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
    if (!canUserAccessProposal(proposal, userRole, userId)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Filter data based on user role
    const filteredProposal = filterProposalData(proposal, userRole)
    
    return NextResponse.json({
      proposal: filteredProposal
    })
    
  } catch (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/proposals/[id] - Update proposal
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
    
    // Check access permissions
    if (!canUserEditProposal(proposal, userRole, userId)) {
      return NextResponse.json(
        { error: 'Access denied or proposal cannot be edited' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validate update data
    const validation = validateUpdateProposal(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid proposal data', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    // Update proposal
    const updatedProposal = {
      ...proposal,
      ...validation.data,
      updatedAt: new Date().toISOString()
    }
    
    mockProposals[proposalIndex] = updatedProposal
    
    // Filter data based on user role
    const filteredProposal = filterProposalData(updatedProposal, userRole)
    
    return NextResponse.json({
      proposal: filteredProposal,
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

// DELETE /api/proposals/[id] - Delete proposal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userRole = getUserRole(request)
    const userId = getUserId(request)
    const proposalId = params.id
    
    // Only admins can delete proposals
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only administrators can delete proposals' },
        { status: 403 }
      )
    }
    
    // Find proposal
    const proposalIndex = mockProposals.findIndex(p => p.id === proposalId)
    if (proposalIndex === -1) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }
    
    // Remove proposal
    mockProposals.splice(proposalIndex, 1)
    
    return NextResponse.json({
      message: 'Proposal deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
