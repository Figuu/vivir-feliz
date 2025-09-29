import { NextRequest, NextResponse } from 'next/server'
import { validateProposalComment } from '@/lib/proposal-validation'

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

// Mock comments data
const mockComments = [
  {
    id: 'comment-1',
    proposalId: 'PROP-2024-001',
    userId: 'user-1',
    userName: 'Dr. María González',
    userRole: 'THERAPIST',
    content: 'Propuesta inicial creada con objetivos claros para el paciente.',
    isInternal: false,
    attachments: [],
    createdAt: '2024-01-20T10:30:00Z'
  },
  {
    id: 'comment-2',
    proposalId: 'PROP-2024-001',
    userId: 'user-2',
    userName: 'Ana Coordinadora',
    userRole: 'COORDINATOR',
    content: 'Revisión inicial completada. Los costos están dentro del rango presupuestario.',
    isInternal: true,
    attachments: [],
    createdAt: '2024-01-20T13:15:00Z'
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

// Helper function to get user name from request headers
function getUserName(request: NextRequest): string {
  return request.headers.get('x-user-name') || 'User'
}

// Helper function to check if user can access proposal
function canUserAccessProposal(proposal: any, userRole: string, userId: string): boolean {
  if (userRole === 'THERAPIST') {
    return proposal.therapistId === userId
  }
  return ['COORDINATOR', 'ADMIN'].includes(userRole)
}

// Helper function to filter comments based on user role
function filterComments(comments: any[], userRole: string): any[] {
  if (userRole === 'THERAPIST') {
    // Therapists can only see non-internal comments
    return comments.filter(comment => !comment.isInternal)
  }
  
  // Coordinators and admins can see all comments
  return comments
}

// GET /api/proposals/[id]/comments - Get proposal comments
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
    
    // Get comments for this proposal
    const proposalComments = mockComments.filter(comment => comment.proposalId === proposalId)
    
    // Filter comments based on user role
    const filteredComments = filterComments(proposalComments, userRole)
    
    // Sort comments by creation date (newest first)
    filteredComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return NextResponse.json({
      proposalId,
      comments: filteredComments,
      total: filteredComments.length
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
    const userRole = getUserRole(request)
    const userId = getUserId(request)
    const userName = getUserName(request)
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
    
    const body = await request.json()
    
    // Validate comment data
    const validation = validateProposalComment(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid comment data', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    const { content, isInternal, attachments } = validation.data
    
    // Create new comment
    const newComment = {
      id: `comment-${Date.now()}`,
      proposalId,
      userId,
      userName,
      userRole,
      content,
      isInternal: isInternal || false,
      attachments: attachments || [],
      createdAt: new Date().toISOString()
    }
    
    // Add comment to mock data
    mockComments.push(newComment)
    
    // Update proposal's updatedAt timestamp
    const proposalIndex = mockProposals.findIndex(p => p.id === proposalId)
    if (proposalIndex !== -1) {
      mockProposals[proposalIndex].updatedAt = new Date().toISOString()
    }
    
    // Filter comment based on user role
    const filteredComment = filterComments([newComment], userRole)[0]
    
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
