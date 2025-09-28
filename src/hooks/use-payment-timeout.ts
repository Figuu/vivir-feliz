import { useState, useCallback } from 'react'

export type PaymentTimeoutStatus = 'ACTIVE' | 'WARNING' | 'EXPIRED' | 'CANCELLED' | 'EXTENDED'
export type CancellationReason = 'USER_REQUEST' | 'TIMEOUT' | 'ADMIN_CANCELLATION' | 'PAYMENT_FAILED' | 'DUPLICATE_PAYMENT' | 'INVALID_AMOUNT' | 'SYSTEM_ERROR' | 'OTHER'

export interface PaymentTimeoutConfig {
  defaultTimeoutMinutes: number
  warningThresholdMinutes: number
  extensionAllowed: boolean
  maxExtensions: number
  extensionMinutes: number
  autoCancelEnabled: boolean
  notificationEnabled: boolean
}

export interface PaymentTimeoutRecord {
  id: string
  paymentId: string
  status: PaymentTimeoutStatus
  timeoutAt: Date
  warningAt: Date
  extendedAt?: Date
  extensionCount: number
  maxExtensions: number
  cancellationReason?: CancellationReason
  cancelledBy?: string
  cancelledAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface PaymentCancellationRequest {
  paymentId: string
  reason: CancellationReason
  notes?: string
  cancelledBy: string
  refundRequired?: boolean
  refundAmount?: number
  refundReason?: string
}

export interface TimeoutStatistics {
  totalTimeouts: number
  activeTimeouts: number
  expiredTimeouts: number
  cancelledTimeouts: number
  averageTimeoutDuration: number
  cancellationReasons: Record<string, number>
  timeoutTrends: Array<{
    date: string
    count: number
    expired: number
    cancelled: number
  }>
}

export interface UsePaymentTimeoutReturn {
  // Timeout operations
  createTimeout: (paymentId: string, timeoutMinutes?: number, config?: Partial<PaymentTimeoutConfig>) => Promise<PaymentTimeoutRecord>
  extendTimeout: (paymentId: string, extensionMinutes?: number, notes?: string) => Promise<PaymentTimeoutRecord>
  cancelPayment: (request: PaymentCancellationRequest) => Promise<PaymentTimeoutRecord>
  getPaymentTimeout: (paymentId: string) => Promise<PaymentTimeoutRecord | null>
  getActiveTimeouts: () => Promise<PaymentTimeoutRecord[]>
  getExpiredTimeouts: () => Promise<PaymentTimeoutRecord[]>
  processExpiredTimeouts: () => Promise<{
    processed: number
    cancelled: number
    errors: string[]
  }>
  
  // Statistics
  getTimeoutStatistics: (dateRange?: { start: Date; end: Date }) => Promise<TimeoutStatistics>
  
  // State
  loading: boolean
  error: string | null
}

export function usePaymentTimeout(): UsePaymentTimeoutReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTimeout = useCallback(async (
    paymentId: string,
    timeoutMinutes?: number,
    config?: Partial<PaymentTimeoutConfig>
  ): Promise<PaymentTimeoutRecord> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/timeout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          timeoutMinutes,
          config
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment timeout')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment timeout'
      setError(errorMessage)
      console.error('Error creating payment timeout:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const extendTimeout = useCallback(async (
    paymentId: string,
    extensionMinutes?: number,
    notes?: string
  ): Promise<PaymentTimeoutRecord> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/timeout', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          extensionMinutes,
          notes
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to extend payment timeout')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to extend payment timeout'
      setError(errorMessage)
      console.error('Error extending payment timeout:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelPayment = useCallback(async (request: PaymentCancellationRequest): Promise<PaymentTimeoutRecord> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/timeout', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel payment')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel payment'
      setError(errorMessage)
      console.error('Error cancelling payment:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentTimeout = useCallback(async (paymentId: string): Promise<PaymentTimeoutRecord | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/timeout?paymentId=${paymentId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment timeout')
      }

      return result.data.timeouts[0] || null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment timeout'
      setError(errorMessage)
      console.error('Error getting payment timeout:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getActiveTimeouts = useCallback(async (): Promise<PaymentTimeoutRecord[]> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/timeout?status=ACTIVE')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get active timeouts')
      }

      return result.data.timeouts
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get active timeouts'
      setError(errorMessage)
      console.error('Error getting active timeouts:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getExpiredTimeouts = useCallback(async (): Promise<PaymentTimeoutRecord[]> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/timeout?status=EXPIRED')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get expired timeouts')
      }

      return result.data.timeouts
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get expired timeouts'
      setError(errorMessage)
      console.error('Error getting expired timeouts:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const processExpiredTimeouts = useCallback(async (): Promise<{
    processed: number
    cancelled: number
    errors: string[]
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/timeout/process-expired', {
        method: 'POST',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to process expired timeouts')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process expired timeouts'
      setError(errorMessage)
      console.error('Error processing expired timeouts:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getTimeoutStatistics = useCallback(async (dateRange?: { start: Date; end: Date }): Promise<TimeoutStatistics> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (dateRange) {
        searchParams.append('startDate', dateRange.start.toISOString())
        searchParams.append('endDate', dateRange.end.toISOString())
      }

      const response = await fetch(`/api/payments/timeout/statistics?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get timeout statistics')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get timeout statistics'
      setError(errorMessage)
      console.error('Error getting timeout statistics:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createTimeout,
    extendTimeout,
    cancelPayment,
    getPaymentTimeout,
    getActiveTimeouts,
    getExpiredTimeouts,
    processExpiredTimeouts,
    getTimeoutStatistics,
    loading,
    error,
  }
}


