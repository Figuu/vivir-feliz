import { useState, useCallback } from 'react'

export type PaymentPlanStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE'
export type PaymentPlanType = 'MONTHLY' | 'QUARTERLY' | 'SEMESTER' | 'ANNUAL'
export type PaymentPlanFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY'

export interface PaymentPlan {
  id: string
  patientId: string
  therapistId: string
  serviceId: string
  planName: string
  planType: PaymentPlanType
  frequency: PaymentPlanFrequency
  totalAmount: number
  installmentAmount: number
  totalInstallments: number
  paidInstallments: number
  remainingInstallments: number
  startDate: Date
  endDate: Date
  nextPaymentDate: Date
  status: PaymentPlanStatus
  autoPay: boolean
  description?: string
  metadata?: Record<string, any>
}

export interface PaymentPlanInstallment {
  id: string
  paymentPlanId: string
  installmentNumber: number
  amount: number
  dueDate: Date
  paidDate?: Date
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentId?: string
  notes?: string
}

export interface PaymentPlanSummary {
  totalPlans: number
  activePlans: number
  completedPlans: number
  overduePlans: number
  totalRevenue: number
  pendingRevenue: number
  averagePlanValue: number
  completionRate: number
}

export interface UsePaymentPlanManagementReturn {
  // Payment plan operations
  createPaymentPlan: (params: {
    patientId: string
    therapistId: string
    serviceId: string
    planName: string
    planType: PaymentPlanType
    frequency: PaymentPlanFrequency
    totalAmount: number
    startDate: string
    autoPay?: boolean
    description?: string
    metadata?: Record<string, any>
  }) => Promise<PaymentPlan>
  
  updatePaymentPlanStatus: (params: {
    paymentPlanId: string
    status: PaymentPlanStatus
    reason?: string
  }) => Promise<PaymentPlan>
  
  recordPayment: (params: {
    paymentPlanId: string
    installmentNumber: number
    paymentId: string
    paidDate: string
    notes?: string
  }) => Promise<PaymentPlanInstallment>
  
  // Data operations
  getPaymentPlan: (paymentPlanId: string) => Promise<any>
  getPaymentPlans: (filters?: {
    patientId?: string
    therapistId?: string
    status?: PaymentPlanStatus
    planType?: PaymentPlanType
    frequency?: PaymentPlanFrequency
    dateRange?: { start: string; end: string }
    page?: number
    limit?: number
  }) => Promise<{
    plans: any[]
    totalCount: number
    pagination: {
      page: number
      limit: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }>
  
  // Statistics and analytics
  getPaymentPlanStatistics: (startDate?: string, endDate?: string) => Promise<PaymentPlanSummary>
  getOverduePayments: () => Promise<{
    overduePlans: any[]
    overdueInstallments: any[]
  }>
  
  // State
  loading: boolean
  error: string | null
}

export function usePaymentPlanManagement(): UsePaymentPlanManagementReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPaymentPlan = useCallback(async (params: {
    patientId: string
    therapistId: string
    serviceId: string
    planName: string
    planType: PaymentPlanType
    frequency: PaymentPlanFrequency
    totalAmount: number
    startDate: string
    autoPay?: boolean
    description?: string
    metadata?: Record<string, any>
  }): Promise<PaymentPlan> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payment-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment plan')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment plan'
      setError(errorMessage)
      console.error('Error creating payment plan:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePaymentPlanStatus = useCallback(async (params: {
    paymentPlanId: string
    status: PaymentPlanStatus
    reason?: string
  }): Promise<PaymentPlan> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payment-plans/${params.paymentPlanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: params.status,
          reason: params.reason
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update payment plan status')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update payment plan status'
      setError(errorMessage)
      console.error('Error updating payment plan status:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const recordPayment = useCallback(async (params: {
    paymentPlanId: string
    installmentNumber: number
    paymentId: string
    paidDate: string
    notes?: string
  }): Promise<PaymentPlanInstallment> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payment-plans/${params.paymentPlanId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installmentNumber: params.installmentNumber,
          paymentId: params.paymentId,
          paidDate: params.paidDate,
          notes: params.notes
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to record payment')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record payment'
      setError(errorMessage)
      console.error('Error recording payment:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentPlan = useCallback(async (paymentPlanId: string): Promise<any> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payment-plans/${paymentPlanId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch payment plan')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment plan'
      setError(errorMessage)
      console.error('Error fetching payment plan:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentPlans = useCallback(async (filters?: {
    patientId?: string
    therapistId?: string
    status?: PaymentPlanStatus
    planType?: PaymentPlanType
    frequency?: PaymentPlanFrequency
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

      const response = await fetch(`/api/payment-plans?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment plans')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment plans'
      setError(errorMessage)
      console.error('Error getting payment plans:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentPlanStatistics = useCallback(async (
    startDate?: string, 
    endDate?: string
  ): Promise<PaymentPlanSummary> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (startDate) searchParams.append('startDate', startDate)
      if (endDate) searchParams.append('endDate', endDate)

      const response = await fetch(`/api/payment-plans/statistics?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment plan statistics')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment plan statistics'
      setError(errorMessage)
      console.error('Error getting payment plan statistics:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getOverduePayments = useCallback(async (): Promise<{
    overduePlans: any[]
    overdueInstallments: any[]
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payment-plans/overdue')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get overdue payments')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get overdue payments'
      setError(errorMessage)
      console.error('Error getting overdue payments:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createPaymentPlan,
    updatePaymentPlanStatus,
    recordPayment,
    getPaymentPlan,
    getPaymentPlans,
    getPaymentPlanStatistics,
    getOverduePayments,
    loading,
    error,
  }
}
