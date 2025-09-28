import { useState, useCallback } from 'react'

export type PaymentConfirmationStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUIRES_CLARIFICATION' | 'ESCALATED'
export type PaymentReviewAction = 'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION' | 'ESCALATE' | 'HOLD'

export interface PaymentConfirmationRequest {
  id: string
  paymentId: string
  status: PaymentConfirmationStatus
  requestedBy: string
  requestedAt: Date
  reviewedBy?: string
  reviewedAt?: Date
  reviewNotes?: string
  escalationReason?: string
  holdReason?: string
  metadata?: Record<string, any>
}

export interface PaymentConfirmationStatistics {
  totalRequests: number
  statusCounts: { [key in PaymentConfirmationStatus]: number }
  priorityCounts: { [key: string]: number }
  averageReviewTime: number
  approvalRate: number
  escalationRate: number
}

export interface UsePaymentConfirmationWorkflowReturn {
  // Confirmation request operations
  createConfirmationRequest: (params: {
    paymentId: string
    requestedBy: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  }) => Promise<PaymentConfirmationRequest>
  
  reviewConfirmationRequest: (params: {
    confirmationRequestId: string
    action: PaymentReviewAction
    reviewedBy: string
    reviewNotes?: string
    escalationReason?: string
    holdReason?: string
  }) => Promise<PaymentConfirmationRequest>
  
  // Data operations
  getConfirmationRequests: (filters?: {
    status?: PaymentConfirmationStatus
    priority?: string
    assignedTo?: string
    dateRange?: { start: string; end: string }
    page?: number
    limit?: number
  }) => Promise<{
    requests: any[]
    totalCount: number
    pagination: {
      page: number
      limit: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }>
  
  getConfirmationRequestDetails: (confirmationRequestId: string) => Promise<any>
  
  // Statistics
  getConfirmationStatistics: (startDate?: string, endDate?: string) => Promise<PaymentConfirmationStatistics>
  
  // State
  loading: boolean
  error: string | null
}

export function usePaymentConfirmationWorkflow(): UsePaymentConfirmationWorkflowReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createConfirmationRequest = useCallback(async (params: {
    paymentId: string
    requestedBy: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  }): Promise<PaymentConfirmationRequest> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment confirmation request')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment confirmation request'
      setError(errorMessage)
      console.error('Error creating payment confirmation request:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const reviewConfirmationRequest = useCallback(async (params: {
    confirmationRequestId: string
    action: PaymentReviewAction
    reviewedBy: string
    reviewNotes?: string
    escalationReason?: string
    holdReason?: string
  }): Promise<PaymentConfirmationRequest> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/confirmation/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to review payment confirmation request')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to review payment confirmation request'
      setError(errorMessage)
      console.error('Error reviewing payment confirmation request:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getConfirmationRequests = useCallback(async (filters?: {
    status?: PaymentConfirmationStatus
    priority?: string
    assignedTo?: string
    dateRange?: { start: string; end: string }
    page?: number
    limit?: number
  }) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'dateRange' && typeof value === 'object') {
              searchParams.append('startDate', value.start)
              searchParams.append('endDate', value.end)
            } else {
              searchParams.append(key, value.toString())
            }
          }
        })
      }

      const response = await fetch(`/api/payments/confirmation?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment confirmation requests')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment confirmation requests'
      setError(errorMessage)
      console.error('Error getting payment confirmation requests:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getConfirmationRequestDetails = useCallback(async (confirmationRequestId: string): Promise<any> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/confirmation/${confirmationRequestId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment confirmation request details')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment confirmation request details'
      setError(errorMessage)
      console.error('Error getting payment confirmation request details:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getConfirmationStatistics = useCallback(async (
    startDate?: string, 
    endDate?: string
  ): Promise<PaymentConfirmationStatistics> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (startDate) searchParams.append('startDate', startDate)
      if (endDate) searchParams.append('endDate', endDate)

      const response = await fetch(`/api/payments/confirmation/statistics?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment confirmation statistics')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment confirmation statistics'
      setError(errorMessage)
      console.error('Error getting payment confirmation statistics:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createConfirmationRequest,
    reviewConfirmationRequest,
    getConfirmationRequests,
    getConfirmationRequestDetails,
    getConfirmationStatistics,
    loading,
    error,
  }
}


