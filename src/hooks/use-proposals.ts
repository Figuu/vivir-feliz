import { useState, useEffect, useCallback } from 'react'

interface Proposal {
  id: string
  consultationRequestId: string
  patientId: string
  therapistId: string
  treatmentPeriod: string
  parentAvailability: any
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  proposalASessions?: number
  proposalACost?: number
  proposalBSessions?: number
  proposalBCost?: number
  selectedProposal?: 'A' | 'B'
  paymentPlan?: string
  notes?: string
  coordinatorNotes?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  reviewedAt?: string
  approvedAt?: string
  patient: {
    id: string
    firstName: string
    lastName: string
    dateOfBirth: string
    parent: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string
    }
  }
  therapist: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  consultationRequest: {
    id: string
    reason: string
    description: string
    status: string
  }
  services: Array<{
    id: string
    serviceId: string
    proposalASession: number
    proposalACostPerSession?: number
    proposalBSessions: number
    proposalBCostPerSession?: number
    assignedTherapistId?: string
    notes?: string
    service: {
      id: string
      name: string
      type: string
      sessionDuration: number
      costPerSession: number
    }
    assignedTherapist?: {
      id: string
      firstName: string
      lastName: string
    }
    serviceAssignments: Array<{
      id: string
      totalSessions: number
      completedSessions: number
      costPerSession: number
      status: string
      startDate?: string
      endDate?: string
      service: {
        id: string
        name: string
        type: string
      }
    }>
  }>
  payments: Array<{
    id: string
    amount: number
    status: string
    dueDate: string
    paidAt?: string
  }>
}

interface ProposalFilters {
  status?: string
  therapistId?: string
  patientId?: string
  treatmentPeriod?: string
  page?: number
  limit?: number
}

interface UseProposalsReturn {
  proposals: Proposal[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  } | null
  loadProposals: (filters?: ProposalFilters) => Promise<void>
  getProposal: (id: string) => Promise<Proposal>
  updateProposal: (id: string, updates: Partial<Proposal>) => Promise<Proposal>
  bulkScheduleSessions: (id: string, data: {
    startDate: string
    endDate: string
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY'
    daysOfWeek?: string[]
    timeSlots: { time: string; duration: number }[]
    notes?: string
    autoResolveConflicts?: boolean
    maxTimeShift?: number
  }) => Promise<{
    createdSessions: any[]
    errors: any[]
    serviceAssignments: any[]
    summary: {
      totalSessionsCreated: number
      totalErrors: number
      servicesProcessed: number
      autoResolvedConflicts: number
    }
  }>
  getBulkSchedulingOptions: (id: string) => Promise<any>
  refreshProposals: () => Promise<void>
}

export function useProposals(initialFilters?: ProposalFilters): UseProposalsReturn {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  } | null>(null)
  const [currentFilters, setCurrentFilters] = useState<ProposalFilters>(initialFilters || {})

  const loadProposals = useCallback(async (filters?: ProposalFilters) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      const activeFilters = { ...currentFilters, ...filters }
      
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/proposals?${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load proposals')
      }

      setProposals(result.proposals || [])
      setPagination(result.pagination || null)
      setCurrentFilters(activeFilters)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load proposals'
      setError(errorMessage)
      console.error('Error loading proposals:', err)
    } finally {
      setLoading(false)
    }
  }, [currentFilters])

  const getProposal = useCallback(async (id: string): Promise<Proposal> => {
    try {
      setError(null)

      const response = await fetch(`/api/proposals/${id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load proposal')
      }

      return result.proposal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load proposal'
      setError(errorMessage)
      console.error('Error loading proposal:', err)
      throw err
    }
  }, [])

  const updateProposal = useCallback(async (id: string, updates: Partial<Proposal>): Promise<Proposal> => {
    try {
      setError(null)

      const response = await fetch(`/api/proposals/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update proposal')
      }

      // Update proposal in the list
      setProposals(prev => prev.map(proposal => 
        proposal.id === id ? result.proposal : proposal
      ))
      
      return result.proposal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update proposal'
      setError(errorMessage)
      console.error('Error updating proposal:', err)
      throw err
    }
  }, [])

  const bulkScheduleSessions = useCallback(async (id: string, data: {
    startDate: string
    endDate: string
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY'
    daysOfWeek?: string[]
    timeSlots: { time: string; duration: number }[]
    notes?: string
    autoResolveConflicts?: boolean
    maxTimeShift?: number
  }) => {
    try {
      setError(null)

      const response = await fetch(`/api/proposals/${id}/bulk-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to bulk schedule sessions')
      }

      return result.results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk schedule sessions'
      setError(errorMessage)
      console.error('Error bulk scheduling sessions:', err)
      throw err
    }
  }, [])

  const getBulkSchedulingOptions = useCallback(async (id: string) => {
    try {
      setError(null)

      const response = await fetch(`/api/proposals/${id}/bulk-schedule`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get bulk scheduling options')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get bulk scheduling options'
      setError(errorMessage)
      console.error('Error getting bulk scheduling options:', err)
      throw err
    }
  }, [])

  const refreshProposals = useCallback(async () => {
    await loadProposals(currentFilters)
  }, [loadProposals, currentFilters])

  // Load proposals on mount
  useEffect(() => {
    loadProposals()
  }, [loadProposals])

  return {
    proposals,
    loading,
    error,
    pagination,
    loadProposals,
    getProposal,
    updateProposal,
    bulkScheduleSessions,
    getBulkSchedulingOptions,
    refreshProposals
  }
}
