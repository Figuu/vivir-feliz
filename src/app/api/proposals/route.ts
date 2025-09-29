import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { 
  ProposalValidation,
  validateCreateProposal,
  validateProposalSearch,
  validateProposalBulkOperation
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
  // In a real application, this would extract the role from JWT token or session
  return request.headers.get('x-user-role') || 'THERAPIST'
}

// Helper function to get user ID from request headers
function getUserId(request: NextRequest): string {
  // In a real application, this would extract the user ID from JWT token or session
  return request.headers.get('x-user-id') || 'user-1'
}

// Helper function to check if user can access proposal
function canUserAccessProposal(proposal: any, userRole: string, userId: string): boolean {
  // Therapists can only access their own proposals
  if (userRole === 'THERAPIST') {
    return proposal.therapistId === userId
  }
  
  // Coordinators and admins can access all proposals
  return ['COORDINATOR', 'ADMIN'].includes(userRole)
}

// Helper function to filter proposal data based on user role
function filterProposalData(proposal: any, userRole: string): any {
  const filteredProposal = { ...proposal }
  
  // Therapists cannot see pricing information
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
  
  // Coordinators cannot see admin notes
  if (userRole === 'COORDINATOR') {
    delete filteredProposal.adminNotes
    delete filteredProposal.finalApprovalNotes
  }
  
  return filteredProposal
}

// GET /api/proposals - List proposals with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const userRole = getUserRole(request)
    const userId = getUserId(request)
    
    // Parse search parameters
    const { searchParams } = new URL(request.url)
    const searchData = {
      query: searchParams.get('query') || undefined,
      status: searchParams.get('status')?.split(',') || undefined,
      priority: searchParams.get('priority')?.split(',') || undefined,
      therapistId: searchParams.get('therapistId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      minCost: searchParams.get('minCost') ? parseFloat(searchParams.get('minCost')!) : undefined,
      maxCost: searchParams.get('maxCost') ? parseFloat(searchParams.get('maxCost')!) : undefined,
      currency: searchParams.get('currency') || undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    }
    
    // Validate search parameters
    const validation = validateProposalSearch(searchData)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    // Filter proposals based on user access
    let filteredProposals = mockProposals.filter(proposal => 
      canUserAccessProposal(proposal, userRole, userId)
    )
    
    // Apply search filters
    if (searchData.query) {
      const query = searchData.query.toLowerCase()
      filteredProposals = filteredProposals.filter(proposal =>
        proposal.id.toLowerCase().includes(query) ||
        proposal.patientId.toLowerCase().includes(query) ||
        proposal.notes?.toLowerCase().includes(query) ||
        proposal.goals.some((goal: string) => goal.toLowerCase().includes(query))
      )
    }
    
    if (searchData.status) {
      filteredProposals = filteredProposals.filter(proposal =>
        searchData.status!.includes(proposal.status)
      )
    }
    
    if (searchData.priority) {
      filteredProposals = filteredProposals.filter(proposal =>
        searchData.priority!.includes(proposal.priority)
      )
    }
    
    if (searchData.therapistId) {
      filteredProposals = filteredProposals.filter(proposal =>
        proposal.therapistId === searchData.therapistId
      )
    }
    
    if (searchData.patientId) {
      filteredProposals = filteredProposals.filter(proposal =>
        proposal.patientId === searchData.patientId
      )
    }
    
    if (searchData.dateFrom) {
      const dateFrom = new Date(searchData.dateFrom)
      filteredProposals = filteredProposals.filter(proposal =>
        new Date(proposal.createdAt) >= dateFrom
      )
    }
    
    if (searchData.dateTo) {
      const dateTo = new Date(searchData.dateTo)
      filteredProposals = filteredProposals.filter(proposal =>
        new Date(proposal.createdAt) <= dateTo
      )
    }
    
    if (searchData.minCost !== undefined) {
      filteredProposals = filteredProposals.filter(proposal =>
        proposal.estimatedCost >= searchData.minCost!
      )
    }
    
    if (searchData.maxCost !== undefined) {
      filteredProposals = filteredProposals.filter(proposal =>
        proposal.estimatedCost <= searchData.maxCost!
      )
    }
    
    if (searchData.currency) {
      filteredProposals = filteredProposals.filter(proposal =>
        proposal.currency === searchData.currency
      )
    }
    
    // Sort proposals
    filteredProposals.sort((a, b) => {
      const aValue = a[searchData.sortBy as keyof typeof a]
      const bValue = b[searchData.sortBy as keyof typeof b]
      
      if (searchData.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    // Apply pagination
    const startIndex = (searchData.page - 1) * searchData.limit
    const endIndex = startIndex + searchData.limit
    const paginatedProposals = filteredProposals.slice(startIndex, endIndex)
    
    // Filter data based on user role
    const filteredData = paginatedProposals.map(proposal =>
      filterProposalData(proposal, userRole)
    )
    
    return NextResponse.json({
      proposals: filteredData,
      pagination: {
        page: searchData.page,
        limit: searchData.limit,
        total: filteredProposals.length,
        totalPages: Math.ceil(filteredProposals.length / searchData.limit)
      },
      filters: searchData
    })
    
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/proposals - Create new proposal
export async function POST(request: NextRequest) {
  try {
    const userRole = getUserRole(request)
    const userId = getUserId(request)
    
    // Only therapists can create proposals
    if (userRole !== 'THERAPIST') {
      return NextResponse.json(
        { error: 'Only therapists can create proposals' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validate proposal data
    const validation = validateCreateProposal(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid proposal data', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    // Generate new proposal ID
    const proposalId = `PROP-${Date.now()}`
    
    // Create new proposal
    const newProposal = {
      ...validation.data,
      id: proposalId,
      therapistId: userId,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    // Add to mock data (in real app, save to database)
    mockProposals.push(newProposal)
    
    // Filter data based on user role
    const filteredProposal = filterProposalData(newProposal, userRole)
    
    return NextResponse.json({
      proposal: filteredProposal,
      message: 'Proposal created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating proposal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/proposals - Bulk operations
export async function PUT(request: NextRequest) {
  try {
    const userRole = getUserRole(request)
    const userId = getUserId(request)
    
    // Only coordinators and admins can perform bulk operations
    if (!['COORDINATOR', 'ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions for bulk operations' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // Validate bulk operation data
    const validation = validateProposalBulkOperation(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid bulk operation data', details: validation.error.errors },
        { status: 400 }
      )
    }
    
    const { proposalIds, operation, parameters } = validation.data
    
    // Find proposals that user can access
    const accessibleProposals = proposalIds.filter(id => {
      const proposal = mockProposals.find(p => p.id === id)
      return proposal && canUserAccessProposal(proposal, userRole, userId)
    })
    
    if (accessibleProposals.length === 0) {
      return NextResponse.json(
        { error: 'No accessible proposals found' },
        { status: 404 }
      )
    }
    
    const results = []
    
    // Perform bulk operation
    for (const proposalId of accessibleProposals) {
      const proposal = mockProposals.find(p => p.id === proposalId)
      if (!proposal) continue
      
      try {
        switch (operation) {
          case 'APPROVE':
            if (userRole === 'ADMIN') {
              proposal.status = 'APPROVED'
              proposal.finalApprovalNotes = parameters?.notes || 'Bulk approved'
              proposal.updatedAt = new Date().toISOString()
              results.push({ proposalId, status: 'approved' })
            } else {
              results.push({ proposalId, status: 'insufficient_permissions' })
            }
            break
            
          case 'REJECT':
            proposal.status = 'REJECTED'
            proposal.approvalNotes = parameters?.notes || 'Bulk rejected'
            proposal.updatedAt = new Date().toISOString()
            results.push({ proposalId, status: 'rejected' })
            break
            
          case 'CANCEL':
            proposal.status = 'CANCELLED'
            proposal.updatedAt = new Date().toISOString()
            results.push({ proposalId, status: 'cancelled' })
            break
            
          case 'ASSIGN':
            if (parameters?.therapistId) {
              proposal.therapistId = parameters.therapistId
              proposal.updatedAt = new Date().toISOString()
              results.push({ proposalId, status: 'assigned' })
            } else {
              results.push({ proposalId, status: 'missing_therapist_id' })
            }
            break
            
          default:
            results.push({ proposalId, status: 'unsupported_operation' })
        }
      } catch (error) {
        results.push({ proposalId, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }
    
    return NextResponse.json({
      operation,
      results,
      message: `Bulk operation completed: ${operation}`
    })
    
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
