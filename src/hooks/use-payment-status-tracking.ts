import { useState, useCallback } from 'react'

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'

export interface PaymentStatusUpdate {
  id: string
  paymentId: string
  fromStatus: PaymentStatus
  toStatus: PaymentStatus
  updatedBy: string
  updatedAt: Date
  reason?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface PaymentStatusHistory {
  id: string
  paymentId: string
  status: PaymentStatus
  updatedBy: string
  updatedAt: Date
  reason?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface PaymentStatusInfo {
  currentStatus: PaymentStatus
  statusHistory: PaymentStatusHistory[]
  canTransitionTo: PaymentStatus[]
  lastUpdated: Date
  lastUpdatedBy: string
  totalDuration: number
  timeInCurrentStatus: number
  nextAction?: string
  requiresAttention: boolean
}

export interface PaymentStatusStatistics {
  statusCounts: { [key in PaymentStatus]: number }
  totalPayments: number
  statusDistribution: { [key in PaymentStatus]: number }
  averageProcessingTime: number
  completionRate: number
  failureRate: number
}

export interface PaymentsRequiringAttention {
  failed: any[]
  processing: any[]
  pending: any[]
}

export interface UsePaymentStatusTrackingReturn {
  // Status management
  updatePaymentStatus: (params: {
    paymentId: string
    newStatus: PaymentStatus
    updatedBy: string
    reason?: string
    notes?: string
    metadata?: Record<string, any>
  }) => Promise<PaymentStatusUpdate>
  
  // Status information
  getPaymentStatusInfo: (paymentId: string) => Promise<PaymentStatusInfo>
  getPaymentStatusHistory: (paymentId: string) => Promise<PaymentStatusHistory[]>
  getPossibleTransitions: (status: PaymentStatus) => Promise<{
    currentStatus: PaymentStatus
    description: string
    color: string
    priority: number
    possibleTransitions: PaymentStatus[]
  }>
  
  // List operations
  getPaymentsByStatus: (status: PaymentStatus, limit?: number, offset?: number) => Promise<{
    payments: any[]
    totalCount: number
  }>
  
  // Attention operations
  getPaymentsRequiringAttention: () => Promise<PaymentsRequiringAttention>
  
  // Statistics
  getPaymentStatusStatistics: (startDate?: string, endDate?: string) => Promise<PaymentStatusStatistics>
  
  // Auto-update operations
  triggerAutoUpdate: () => Promise<{
    updated: number
    errors: string[]
  }>
  
  // State
  loading: boolean
  error: string | null
}

export function usePaymentStatusTracking(): UsePaymentStatusTrackingReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updatePaymentStatus = useCallback(async (params: {
    paymentId: string
    newStatus: PaymentStatus
    updatedBy: string
    reason?: string
    notes?: string
    metadata?: Record<string, any>
  }): Promise<PaymentStatusUpdate> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update payment status')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment status'
      setError(errorMessage)
      console.error('Error updating payment status:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentStatusInfo = useCallback(async (paymentId: string): Promise<PaymentStatusInfo> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/payments/status?paymentId=${paymentId}&action=info`
      )
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment status info')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment status info'
      setError(errorMessage)
      console.error('Error getting payment status info:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentStatusHistory = useCallback(async (paymentId: string): Promise<PaymentStatusHistory[]> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/payments/status?paymentId=${paymentId}&action=history`
      )
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment status history')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment status history'
      setError(errorMessage)
      console.error('Error getting payment status history:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPossibleTransitions = useCallback(async (status: PaymentStatus): Promise<{
    currentStatus: PaymentStatus
    description: string
    color: string
    priority: number
    possibleTransitions: PaymentStatus[]
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/status?status=${status}&action=transitions`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get possible transitions')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get possible transitions'
      setError(errorMessage)
      console.error('Error getting possible transitions:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentsByStatus = useCallback(async (
    status: PaymentStatus, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<{ payments: any[]; totalCount: number }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/payments/status?status=${status}&action=list&limit=${limit}&offset=${offset}`
      )
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payments by status')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payments by status'
      setError(errorMessage)
      console.error('Error getting payments by status:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentsRequiringAttention = useCallback(async (): Promise<PaymentsRequiringAttention> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/status?action=attention')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payments requiring attention')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payments requiring attention'
      setError(errorMessage)
      console.error('Error getting payments requiring attention:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentStatusStatistics = useCallback(async (
    startDate?: string, 
    endDate?: string
  ): Promise<PaymentStatusStatistics> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      searchParams.append('action', 'statistics')
      if (startDate) searchParams.append('startDate', startDate)
      if (endDate) searchParams.append('endDate', endDate)

      const response = await fetch(`/api/payments/status?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment status statistics')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment status statistics'
      setError(errorMessage)
      console.error('Error getting payment status statistics:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerAutoUpdate = useCallback(async (): Promise<{
    updated: number
    errors: string[]
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/status/auto-update', {
        method: 'POST',
      })
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to trigger auto-update')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger auto-update'
      setError(errorMessage)
      console.error('Error triggering auto-update:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    updatePaymentStatus,
    getPaymentStatusInfo,
    getPaymentStatusHistory,
    getPossibleTransitions,
    getPaymentsByStatus,
    getPaymentsRequiringAttention,
    getPaymentStatusStatistics,
    triggerAutoUpdate,
    loading,
    error,
  }
}


