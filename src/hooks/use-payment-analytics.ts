import { useState, useCallback } from 'react'

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'OTHER'
export type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
export type AnalyticsPeriod = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'LAST_YEAR' | 'CUSTOM'

export interface PaymentAnalyticsFilters {
  startDate?: Date
  endDate?: Date
  paymentStatus?: PaymentStatus[]
  paymentMethod?: PaymentMethod[]
  therapistId?: string
  patientId?: string
  minAmount?: number
  maxAmount?: number
  specialtyId?: string
  serviceId?: string
}

export interface PaymentAnalytics {
  totalPayments: number
  totalAmount: number
  averageAmount: number
  medianAmount: number
  statusBreakdown: Record<PaymentStatus, number>
  methodBreakdown: Record<PaymentMethod, number>
  amountBreakdown: Record<PaymentStatus, number>
  dailyTrends: Array<{
    date: string
    count: number
    amount: number
    status: PaymentStatus
  }>
  monthlyTrends: Array<{
    month: string
    count: number
    amount: number
    growth: number
  }>
  topTherapists: Array<{
    therapistId: string
    therapistName: string
    paymentCount: number
    totalAmount: number
    averageAmount: number
  }>
  topServices: Array<{
    serviceId: string
    serviceName: string
    paymentCount: number
    totalAmount: number
    averageAmount: number
  }>
  paymentVelocity: {
    averageProcessingTime: number
    completionRate: number
    failureRate: number
    cancellationRate: number
  }
  revenueMetrics: {
    grossRevenue: number
    netRevenue: number
    refundedAmount: number
    pendingAmount: number
    revenueGrowth: number
    revenuePerPatient: number
    revenuePerTherapist: number
  }
}

export interface FinancialReport {
  id: string
  reportType: ReportType
  period: {
    start: Date
    end: Date
  }
  generatedAt: Date
  generatedBy: string
  summary: {
    totalRevenue: number
    totalPayments: number
    averagePayment: number
    growthRate: number
    topPerformingTherapist: string
    topService: string
  }
  revenueBreakdown: {
    byStatus: Record<PaymentStatus, number>
    byMethod: Record<PaymentMethod, number>
    byTherapist: Array<{
      therapistId: string
      therapistName: string
      revenue: number
      percentage: number
    }>
    byService: Array<{
      serviceId: string
      serviceName: string
      revenue: number
      percentage: number
    }>
    byMonth: Array<{
      month: string
      revenue: number
      growth: number
    }>
  }
  performanceMetrics: {
    paymentCompletionRate: number
    averageProcessingTime: number
    refundRate: number
    cancellationRate: number
    patientRetentionRate: number
    therapistUtilizationRate: number
  }
  trends: {
    revenueTrend: 'INCREASING' | 'DECREASING' | 'STABLE'
    paymentVolumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE'
    averagePaymentTrend: 'INCREASING' | 'DECREASING' | 'STABLE'
    growthProjection: number
  }
  insights: string[]
  recommendations: string[]
}

export interface PaymentForecast {
  period: {
    start: Date
    end: Date
  }
  forecastedRevenue: number
  forecastedPayments: number
  confidenceLevel: number
  factors: Array<{
    factor: string
    impact: number
    description: string
  }>
  scenarios: {
    optimistic: number
    realistic: number
    pessimistic: number
  }
}

export interface PaymentTrends {
  period: { start: Date; end: Date }
  current: PaymentAnalytics
  previous: PaymentAnalytics
  comparison: {
    revenueChange: number
    paymentCountChange: number
    averagePaymentChange: number
    growthRate: number
  }
}

export interface RealTimeDashboard {
  today: {
    payments: number
    revenue: number
    pending: number
    completed: number
  }
  thisWeek: {
    payments: number
    revenue: number
    growth: number
  }
  thisMonth: {
    payments: number
    revenue: number
    growth: number
  }
  alerts: Array<{
    type: 'HIGH_PENDING' | 'LOW_COMPLETION' | 'HIGH_REFUND' | 'SYSTEM_ISSUE'
    message: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }>
}

export interface UsePaymentAnalyticsReturn {
  // Analytics operations
  getPaymentAnalytics: (filters?: PaymentAnalyticsFilters) => Promise<PaymentAnalytics>
  generateFinancialReport: (reportType: ReportType, period: { start: Date; end: Date }, generatedBy: string) => Promise<FinancialReport>
  generatePaymentForecast: (period: { start: Date; end: Date }, historicalMonths?: number) => Promise<PaymentForecast>
  getPaymentTrends: (period: AnalyticsPeriod, customPeriod?: { start: Date; end: Date }) => Promise<PaymentTrends>
  getRealTimeDashboard: () => Promise<RealTimeDashboard>
  
  // State
  loading: boolean
  error: string | null
}

export function usePaymentAnalytics(): UsePaymentAnalyticsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getPaymentAnalytics = useCallback(async (filters?: PaymentAnalyticsFilters): Promise<PaymentAnalytics> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'startDate' || key === 'endDate') {
              searchParams.append(key, (value as Date).toISOString())
            } else if (key === 'paymentStatus' || key === 'paymentMethod') {
              searchParams.append(key, (value as string[]).join(','))
            } else {
              searchParams.append(key, value.toString())
            }
          }
        })
      }

      const response = await fetch(`/api/payments/analytics?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get payment analytics')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get payment analytics'
      setError(errorMessage)
      console.error('Error getting payment analytics:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const generateFinancialReport = useCallback(async (
    reportType: ReportType,
    period: { start: Date; end: Date },
    generatedBy: string
  ): Promise<FinancialReport> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          startDate: period.start.toISOString(),
          endDate: period.end.toISOString(),
          generatedBy
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate financial report')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate financial report'
      setError(errorMessage)
      console.error('Error generating financial report:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const generatePaymentForecast = useCallback(async (
    period: { start: Date; end: Date },
    historicalMonths: number = 12
  ): Promise<PaymentForecast> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: period.start.toISOString(),
          endDate: period.end.toISOString(),
          historicalMonths
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate payment forecast')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate payment forecast'
      setError(errorMessage)
      console.error('Error generating payment forecast:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPaymentTrends = useCallback(async (
    period: AnalyticsPeriod,
    customPeriod?: { start: Date; end: Date }
  ): Promise<PaymentTrends> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      searchParams.append('period', period)
      
      if (period === 'CUSTOM' && customPeriod) {
        searchParams.append('startDate', customPeriod.start.toISOString())
        searchParams.append('endDate', customPeriod.end.toISOString())
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

  const getRealTimeDashboard = useCallback(async (): Promise<RealTimeDashboard> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/dashboard')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get real-time dashboard')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get real-time dashboard'
      setError(errorMessage)
      console.error('Error getting real-time dashboard:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    getPaymentAnalytics,
    generateFinancialReport,
    generatePaymentForecast,
    getPaymentTrends,
    getRealTimeDashboard,
    loading,
    error,
  }
}


