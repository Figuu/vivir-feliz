import { useState, useCallback } from 'react'

export type PaymentHistoryFilter = {
  patientId?: string
  therapistId?: string
  paymentMethod?: string
  status?: string
  dateRange?: { start: string; end: string }
  amountRange?: { min: number; max: number }
  searchTerm?: string
}

export type PaymentHistorySort = {
  field: 'date' | 'amount' | 'status' | 'method'
  direction: 'asc' | 'desc'
}

export interface PaymentHistoryEntry {
  id: string
  paymentId: string
  patientId: string
  therapistId: string
  amount: number
  paymentMethod: string
  status: string
  transactionDate: Date
  description?: string
  reference?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface PaymentHistorySummary {
  totalPayments: number
  totalAmount: number
  averageAmount: number
  paymentMethods: Record<string, { count: number; total: number }>
  statusBreakdown: Record<string, number>
  monthlyTrends: Array<{
    month: string
    count: number
    total: number
  }>
  topPatients: Array<{
    patientId: string
    patientName: string
    totalPaid: number
    paymentCount: number
  }>
  topTherapists: Array<{
    therapistId: string
    therapistName: string
    totalReceived: number
    paymentCount: number
  }>
}

export interface PaymentReport {
  id: string
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
  title: string
  description: string
  dateRange: { start: Date; end: Date }
  filters: PaymentHistoryFilter
  generatedAt: Date
  generatedBy: string
  data: PaymentHistorySummary
  metadata?: Record<string, any>
}

export interface PaymentTrend {
  period: string
  count: number
  total: number
  average: number
}

export interface UsePaymentHistoryReturn {
  // Payment history operations
  getPaymentHistory: (params: {
    filters?: PaymentHistoryFilter
    sort?: PaymentHistorySort
    pagination?: { page: number; limit: number }
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
  
  getPaymentHistorySummary: (filters?: PaymentHistoryFilter) => Promise<PaymentHistorySummary>
  
  generatePaymentReport: (params: {
    reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
    dateRange: { start: string; end: string }
    filters?: PaymentHistoryFilter
    generatedBy?: string
  }) => Promise<PaymentReport>
  
  getPaymentTrends: (params: {
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY'
    dateRange: { start: string; end: string }
    filters?: PaymentHistoryFilter
  }) => Promise<PaymentTrend[]>
  
  // State
  loading: boolean
  error: string | null
}

export function usePaymentHistory(): UsePaymentHistoryReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getPaymentHistory = useCallback(async (params: {
    filters?: PaymentHistoryFilter
    sort?: PaymentHistorySort
    pagination?: { page: number; limit: number }
  }) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      // Add pagination
      if (params.pagination) {
        searchParams.append('page', params.pagination.page.toString())
        searchParams.append('limit', params.pagination.limit.toString())
      }
      
      // Add filters
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
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
      
      // Add sorting
      if (params.sort) {
        searchParams.append('sortField', params.sort.field)
        searchParams.append('sortDirection', params.sort.direction)
      }

      const response = await fetch(`/api/payments/history?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment history')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment history'
      setError(errorMessage)
      console.error('Error getting payment history:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentHistorySummary = useCallback(async (filters?: PaymentHistoryFilter): Promise<PaymentHistorySummary> => {
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

      const response = await fetch(`/api/payments/history/summary?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment history summary')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment history summary'
      setError(errorMessage)
      console.error('Error getting payment history summary:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const generatePaymentReport = useCallback(async (params: {
    reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
    dateRange: { start: string; end: string }
    filters?: PaymentHistoryFilter
    generatedBy?: string
  }): Promise<PaymentReport> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: params.reportType,
          startDate: params.dateRange.start,
          endDate: params.dateRange.end,
          generatedBy: params.generatedBy || 'system',
          filters: params.filters
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate payment report')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate payment report'
      setError(errorMessage)
      console.error('Error generating payment report:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentTrends = useCallback(async (params: {
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY'
    dateRange: { start: string; end: string }
    filters?: PaymentHistoryFilter
  }): Promise<PaymentTrend[]> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      searchParams.append('period', params.period)
      searchParams.append('startDate', params.dateRange.start)
      searchParams.append('endDate', params.dateRange.end)
      
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'amountRange' && typeof value === 'object') {
              searchParams.append('minAmount', value.min.toString())
              searchParams.append('maxAmount', value.max.toString())
            } else {
              searchParams.append(key, value.toString())
            }
          }
        })
      }

      const response = await fetch(`/api/payments/trends?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment trends')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment trends'
      setError(errorMessage)
      console.error('Error getting payment trends:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    getPaymentHistory,
    getPaymentHistorySummary,
    generatePaymentReport,
    getPaymentTrends,
    loading,
    error,
  }
}
