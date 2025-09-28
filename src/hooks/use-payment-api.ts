import { useState, useCallback } from 'react'

export type PaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'DEBIT_CARD' | 'PAYPAL' | 'STRIPE'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
export type PaymentType = 'CONSULTATION' | 'SESSION' | 'EVALUATION' | 'TREATMENT' | 'PLAN_INSTALLMENT' | 'REFUND'

export interface PaymentRequest {
  patientId: string
  therapistId: string
  consultationRequestId?: string
  paymentPlanId?: string
  amount: number
  paymentMethod: PaymentMethod
  paymentType: PaymentType
  description?: string
  reference?: string
  metadata?: Record<string, any>
  dueDate?: string
  autoProcess?: boolean
}

export interface PaymentResponse {
  id: string
  patientId: string
  therapistId: string
  consultationRequestId?: string
  paymentPlanId?: string
  amount: number
  paymentMethod: PaymentMethod
  paymentType: PaymentType
  status: PaymentStatus
  description?: string
  reference?: string
  transactionId?: string
  processedAt?: Date
  dueDate?: Date
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface PaymentValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface PaymentProcessingResult {
  success: boolean
  paymentId?: string
  transactionId?: string
  status: PaymentStatus
  message: string
  errors?: string[]
}

export interface UsePaymentApiReturn {
  // Payment operations
  createPayment: (request: PaymentRequest) => Promise<PaymentResponse>
  getPayment: (paymentId: string) => Promise<PaymentResponse>
  updatePayment: (paymentId: string, updates: Partial<PaymentRequest>) => Promise<PaymentResponse>
  processPayment: (paymentId: string) => Promise<PaymentProcessingResult>
  cancelPayment: (paymentId: string, reason?: string) => Promise<PaymentProcessingResult>
  validatePayment: (request: PaymentRequest) => Promise<PaymentValidationResult>
  
  // Data operations
  getPayments: (filters?: {
    patientId?: string
    therapistId?: string
    consultationRequestId?: string
    paymentPlanId?: string
    paymentMethod?: PaymentMethod
    paymentType?: PaymentType
    status?: PaymentStatus
    dateRange?: { start: string; end: string }
    amountRange?: { min: number; max: number }
    searchTerm?: string
    page?: number
    limit?: number
    sortField?: 'date' | 'amount' | 'status' | 'method' | 'type'
    sortDirection?: 'asc' | 'desc'
  }) => Promise<{
    payments: any[]
    totalCount: number
    pagination: {
      page: number
      limit: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }>
  
  getPaymentStatistics: (filters?: {
    patientId?: string
    therapistId?: string
    paymentMethod?: PaymentMethod
    paymentType?: PaymentType
    status?: PaymentStatus
    dateRange?: { start: string; end: string }
    amountRange?: { min: number; max: number }
  }) => Promise<any>
  
  // State
  loading: boolean
  error: string | null
}

export function usePaymentApi(): UsePaymentApiReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPayment = useCallback(async (request: PaymentRequest): Promise<PaymentResponse> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment'
      setError(errorMessage)
      console.error('Error creating payment:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPayment = useCallback(async (paymentId: string): Promise<PaymentResponse> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/${paymentId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch payment')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment'
      setError(errorMessage)
      console.error('Error fetching payment:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePayment = useCallback(async (paymentId: string, updates: Partial<PaymentRequest>): Promise<PaymentResponse> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update payment')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment'
      setError(errorMessage)
      console.error('Error updating payment:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const processPayment = useCallback(async (paymentId: string): Promise<PaymentProcessingResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/${paymentId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to process payment')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process payment'
      setError(errorMessage)
      console.error('Error processing payment:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelPayment = useCallback(async (paymentId: string, reason?: string): Promise<PaymentProcessingResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
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

  const validatePayment = useCallback(async (request: PaymentRequest): Promise<PaymentValidationResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to validate payment')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate payment'
      setError(errorMessage)
      console.error('Error validating payment:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPayments = useCallback(async (filters?: {
    patientId?: string
    therapistId?: string
    consultationRequestId?: string
    paymentPlanId?: string
    paymentMethod?: PaymentMethod
    paymentType?: PaymentType
    status?: PaymentStatus
    dateRange?: { start: string; end: string }
    amountRange?: { min: number; max: number }
    searchTerm?: string
    page?: number
    limit?: number
    sortField?: 'date' | 'amount' | 'status' | 'method' | 'type'
    sortDirection?: 'asc' | 'desc'
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
            } else if (key === 'amountRange' && typeof value === 'object') {
              searchParams.append('minAmount', value.min.toString())
              searchParams.append('maxAmount', value.max.toString())
            } else {
              searchParams.append(key, value.toString())
            }
          }
        })
      }

      const response = await fetch(`/api/payments?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payments')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payments'
      setError(errorMessage)
      console.error('Error getting payments:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentStatistics = useCallback(async (filters?: {
    patientId?: string
    therapistId?: string
    paymentMethod?: PaymentMethod
    paymentType?: PaymentType
    status?: PaymentStatus
    dateRange?: { start: string; end: string }
    amountRange?: { min: number; max: number }
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
            } else if (key === 'amountRange' && typeof value === 'object') {
              searchParams.append('minAmount', value.min.toString())
              searchParams.append('maxAmount', value.max.toString())
            } else {
              searchParams.append(key, value.toString())
            }
          }
        })
      }

      const response = await fetch(`/api/payments/statistics?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment statistics')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment statistics'
      setError(errorMessage)
      console.error('Error getting payment statistics:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createPayment,
    getPayment,
    updatePayment,
    processPayment,
    cancelPayment,
    validatePayment,
    getPayments,
    getPaymentStatistics,
    loading,
    error,
  }
}


