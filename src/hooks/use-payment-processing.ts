import { useState, useCallback } from 'react'

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'OTHER'

export interface PaymentDetails {
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  description?: string
  metadata?: Record<string, any>
}

export interface PaymentResult {
  paymentId: string
  status: PaymentStatus
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  transactionId?: string
  receiptUrl?: string
  processedAt?: Date
  error?: string
}

export interface ReceiptUploadResult {
  receiptId: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  uploadedAt: Date
}

export interface PaymentStatistics {
  totalPayments: number
  totalAmount: number
  statusCounts: { [key in PaymentStatus]: number }
  methodCounts: { [key in PaymentMethod]: number }
  averageAmount: number
  completionRate: number
}

export interface UsePaymentProcessingReturn {
  // Payment operations
  processPayment: (params: {
    consultationRequestId: string
    paymentDetails: PaymentDetails
    processedBy: string
  }) => Promise<PaymentResult>
  
  completePayment: (params: {
    paymentId: string
    transactionId?: string
    receiptUrl?: string
    completedBy?: string
  }) => Promise<PaymentResult>
  
  failPayment: (params: {
    paymentId: string
    error: string
    failedBy?: string
  }) => Promise<PaymentResult>
  
  cancelPayment: (params: {
    paymentId: string
    reason: string
    cancelledBy?: string
  }) => Promise<PaymentResult>
  
  refundPayment: (params: {
    paymentId: string
    refundAmount: number
    reason: string
    refundedBy?: string
  }) => Promise<PaymentResult>
  
  // Receipt operations
  uploadReceipt: (params: {
    paymentId: string
    file: File
    uploadedBy?: string
  }) => Promise<ReceiptUploadResult>
  
  // Data operations
  getPayment: (paymentId: string) => Promise<any>
  getPayments: (filters?: {
    status?: string
    paymentMethod?: string
    consultationRequestId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => Promise<{
    payments: any[]
    pagination: {
      page: number
      limit: number
      totalCount: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }>
  
  getPaymentStatistics: (startDate?: string, endDate?: string) => Promise<PaymentStatistics>
  
  // State
  loading: boolean
  error: string | null
}

export function usePaymentProcessing(): UsePaymentProcessingReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processPayment = useCallback(async (params: {
    consultationRequestId: string
    paymentDetails: PaymentDetails
    processedBy: string
  }): Promise<PaymentResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultationRequestId: params.consultationRequestId,
          ...params.paymentDetails,
          processedBy: params.processedBy
        }),
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

  const completePayment = useCallback(async (params: {
    paymentId: string
    transactionId?: string
    receiptUrl?: string
    completedBy?: string
  }): Promise<PaymentResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/${params.paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'COMPLETED',
          transactionId: params.transactionId,
          receiptUrl: params.receiptUrl,
          updatedBy: params.completedBy
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to complete payment')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete payment'
      setError(errorMessage)
      console.error('Error completing payment:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const failPayment = useCallback(async (params: {
    paymentId: string
    error: string
    failedBy?: string
  }): Promise<PaymentResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/${params.paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'FAILED',
          errorMessage: params.error,
          updatedBy: params.failedBy
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fail payment')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fail payment'
      setError(errorMessage)
      console.error('Error failing payment:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelPayment = useCallback(async (params: {
    paymentId: string
    reason: string
    cancelledBy?: string
  }): Promise<PaymentResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/${params.paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELLED',
          errorMessage: params.reason,
          updatedBy: params.cancelledBy
        }),
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

  const refundPayment = useCallback(async (params: {
    paymentId: string
    refundAmount: number
    reason: string
    refundedBy?: string
  }): Promise<PaymentResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/${params.paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'REFUNDED',
          refundAmount: params.refundAmount,
          refundReason: params.reason,
          updatedBy: params.refundedBy
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to refund payment')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refund payment'
      setError(errorMessage)
      console.error('Error refunding payment:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadReceipt = useCallback(async (params: {
    paymentId: string
    file: File
    uploadedBy?: string
  }): Promise<ReceiptUploadResult> => {
    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()
      formData.append('receipt', params.file)
      if (params.uploadedBy) {
        formData.append('uploadedBy', params.uploadedBy)
      }

      const response = await fetch(`/api/payments/${params.paymentId}/receipt`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload receipt')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload receipt'
      setError(errorMessage)
      console.error('Error uploading receipt:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPayment = useCallback(async (paymentId: string): Promise<any> => {
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

  const getPayments = useCallback(async (filters?: {
    status?: string
    paymentMethod?: string
    consultationRequestId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString())
          }
        })
      }

      const response = await fetch(`/api/payments?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch payments')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payments'
      setError(errorMessage)
      console.error('Error fetching payments:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentStatistics = useCallback(async (
    startDate?: string, 
    endDate?: string
  ): Promise<PaymentStatistics> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (startDate) searchParams.append('startDate', startDate)
      if (endDate) searchParams.append('endDate', endDate)

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
    processPayment,
    completePayment,
    failPayment,
    cancelPayment,
    refundPayment,
    uploadReceipt,
    getPayment,
    getPayments,
    getPaymentStatistics,
    loading,
    error,
  }
}
