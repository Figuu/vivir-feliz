import { useState, useCallback } from 'react'

interface AnalyticsQuery {
  dateFrom: string
  dateTo: string
  therapistId?: string
  serviceId?: string
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  includeProjections?: boolean
}

interface ReportConfig {
  reportType: 'SCHEDULING_PERFORMANCE' | 'UTILIZATION' | 'TRENDS' | 'COMPARATIVE' | 'CUSTOM'
  dateFrom: string
  dateTo: string
  therapistId?: string
  serviceId?: string
  format: 'json' | 'csv' | 'pdf'
  includeCharts: boolean
}

interface AnalyticsData {
  overview: {
    totalSessions: number
    totalTherapists: number
    totalServices: number
    dateRange: { from: string; to: string }
  }
  scheduling: {
    totalSessions: number
    completedSessions: number
    cancelledSessions: number
    noShowSessions: number
    rescheduledSessions: number
    completionRate: number
    cancellationRate: number
    noShowRate: number
    rescheduleRate: number
  }
  utilization: {
    averageUtilization: number
    maxUtilization: number
    minUtilization: number
    therapistUtilization: Array<{
      therapistId: string
      therapistName: string
      totalSessions: number
      totalHours: number
      sessionUtilization: number
      hourUtilization: number
      overallUtilization: number
    }>
    totalTherapists: number
    overloadedTherapists: number
    underutilizedTherapists: number
  }
  trends: {
    period: string
    data: Array<{
      period: string
      sessions: any[]
    }>
    trends: {
      direction: string
      percentage: number
    }
  }
}

interface SchedulingPerformanceData {
  groupBy: string
  dateRange: { from: string; to: string }
  performance: Array<{
    period: string
    totalSessions: number
    completedSessions: number
    cancelledSessions: number
    noShowSessions: number
    completionRate: number
    cancellationRate: number
    noShowRate: number
  }>
  summary: {
    totalSessions: number
    totalCompleted: number
    totalCancelled: number
    totalNoShow: number
    averageCompletionRate: number
    averageCancellationRate: number
    averageNoShowRate: number
  }
}

interface UtilizationData {
  groupBy: string
  dateRange: { from: string; to: string }
  utilization: Array<{
    therapistId: string
    therapistName: string
    totalSessions: number
    totalHours: number
    periods: Array<{
      period: string
      sessions: number
      hours: number
    }>
  }>
  summary: {
    totalSessions: number
    totalHours: number
    averageSessionsPerTherapist: number
    averageHoursPerTherapist: number
    totalTherapists: number
  }
}

interface TrendData {
  groupBy: string
  dateRange: { from: string; to: string }
  trends: {
    direction: string
    percentage: number
  }
  data: Array<{
    period: string
    sessions: any[]
  }>
}

interface ComparativeData {
  currentPeriod: {
    from: string
    to: string
    data: any
  }
  comparisonPeriod: {
    from: string
    to: string
    data: any
  }
  comparison: Record<string, {
    current: number
    comparison: number
    change: number
    percentageChange: number
    direction: string
  }>
}

interface UseAnalyticsReportingReturn {
  loading: boolean
  error: string | null
  
  // Data
  analyticsData: AnalyticsData | null
  schedulingPerformance: SchedulingPerformanceData | null
  utilizationData: UtilizationData | null
  trendData: TrendData | null
  comparativeData: ComparativeData | null
  customReports: any[]
  
  // Analytics functions
  getOverview: (query: AnalyticsQuery) => Promise<AnalyticsData>
  getSchedulingPerformance: (query: AnalyticsQuery) => Promise<SchedulingPerformanceData>
  getUtilization: (query: AnalyticsQuery) => Promise<UtilizationData>
  getTrends: (query: AnalyticsQuery) => Promise<TrendData>
  getComparative: (query: AnalyticsQuery & { compareWith?: string }) => Promise<ComparativeData>
  
  // Report functions
  generateReport: (config: ReportConfig) => Promise<any>
  exportReport: (config: ReportConfig) => Promise<any>
  getCustomReports: () => Promise<any[]>
  createCustomReport: (report: any) => Promise<any>
  scheduleReport: (reportId: string, schedule: any, recipients: string[]) => Promise<any>
  
  // Utility functions
  formatDate: (dateString: string) => string
  getTrendIcon: (direction: string) => string
  getTrendColor: (direction: string) => string
  getUtilizationColor: (utilization: number) => string
  calculatePercentageChange: (current: number, previous: number) => number
  
  clearError: () => void
}

export function useAnalyticsReporting(): UseAnalyticsReportingReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [schedulingPerformance, setSchedulingPerformance] = useState<SchedulingPerformanceData | null>(null)
  const [utilizationData, setUtilizationData] = useState<UtilizationData | null>(null)
  const [trendData, setTrendData] = useState<TrendData | null>(null)
  const [comparativeData, setComparativeData] = useState<ComparativeData | null>(null)
  const [customReports, setCustomReports] = useState<any[]>([])

  const getOverview = useCallback(async (query: AnalyticsQuery): Promise<AnalyticsData> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('dateFrom', query.dateFrom)
      params.append('dateTo', query.dateTo)
      if (query.therapistId) params.append('therapistId', query.therapistId)
      if (query.serviceId) params.append('serviceId', query.serviceId)
      if (query.groupBy) params.append('groupBy', query.groupBy)
      if (query.includeProjections) params.append('includeProjections', query.includeProjections.toString())

      const response = await fetch(`/api/sessions/analytics-reporting?action=overview&${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get overview')
      }

      setAnalyticsData(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get overview'
      setError(errorMessage)
      console.error('Error getting overview:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getSchedulingPerformance = useCallback(async (query: AnalyticsQuery): Promise<SchedulingPerformanceData> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('dateFrom', query.dateFrom)
      params.append('dateTo', query.dateTo)
      if (query.therapistId) params.append('therapistId', query.therapistId)
      if (query.serviceId) params.append('serviceId', query.serviceId)
      if (query.groupBy) params.append('groupBy', query.groupBy)
      if (query.includeProjections) params.append('includeProjections', query.includeProjections.toString())

      const response = await fetch(`/api/sessions/analytics-reporting?action=scheduling-performance&${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get scheduling performance')
      }

      setSchedulingPerformance(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get scheduling performance'
      setError(errorMessage)
      console.error('Error getting scheduling performance:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getUtilization = useCallback(async (query: AnalyticsQuery): Promise<UtilizationData> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('dateFrom', query.dateFrom)
      params.append('dateTo', query.dateTo)
      if (query.therapistId) params.append('therapistId', query.therapistId)
      if (query.serviceId) params.append('serviceId', query.serviceId)
      if (query.groupBy) params.append('groupBy', query.groupBy)
      if (query.includeProjections) params.append('includeProjections', query.includeProjections.toString())

      const response = await fetch(`/api/sessions/analytics-reporting?action=utilization&${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get utilization')
      }

      setUtilizationData(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get utilization'
      setError(errorMessage)
      console.error('Error getting utilization:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getTrends = useCallback(async (query: AnalyticsQuery): Promise<TrendData> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('dateFrom', query.dateFrom)
      params.append('dateTo', query.dateTo)
      if (query.therapistId) params.append('therapistId', query.therapistId)
      if (query.serviceId) params.append('serviceId', query.serviceId)
      if (query.groupBy) params.append('groupBy', query.groupBy)
      if (query.includeProjections) params.append('includeProjections', query.includeProjections.toString())

      const response = await fetch(`/api/sessions/analytics-reporting?action=trends&${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get trends')
      }

      setTrendData(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get trends'
      setError(errorMessage)
      console.error('Error getting trends:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getComparative = useCallback(async (query: AnalyticsQuery & { compareWith?: string }): Promise<ComparativeData> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('dateFrom', query.dateFrom)
      params.append('dateTo', query.dateTo)
      if (query.therapistId) params.append('therapistId', query.therapistId)
      if (query.serviceId) params.append('serviceId', query.serviceId)
      if (query.compareWith) params.append('compareWith', query.compareWith)

      const response = await fetch(`/api/sessions/analytics-reporting?action=comparative&${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get comparative analysis')
      }

      setComparativeData(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get comparative analysis'
      setError(errorMessage)
      console.error('Error getting comparative analysis:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const generateReport = useCallback(async (config: ReportConfig): Promise<any> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/analytics-reporting?action=generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate report')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report'
      setError(errorMessage)
      console.error('Error generating report:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const exportReport = useCallback(async (config: ReportConfig): Promise<any> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('reportType', config.reportType)
      params.append('dateFrom', config.dateFrom)
      params.append('dateTo', config.dateTo)
      if (config.therapistId) params.append('therapistId', config.therapistId)
      if (config.serviceId) params.append('serviceId', config.serviceId)
      params.append('format', config.format)
      params.append('includeCharts', config.includeCharts.toString())

      const response = await fetch(`/api/sessions/analytics-reporting?action=export&${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to export report')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export report'
      setError(errorMessage)
      console.error('Error exporting report:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getCustomReports = useCallback(async (): Promise<any[]> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/analytics-reporting?action=custom-reports')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get custom reports')
      }

      setCustomReports(result.data.reports)
      return result.data.reports
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get custom reports'
      setError(errorMessage)
      console.error('Error getting custom reports:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createCustomReport = useCallback(async (report: any): Promise<any> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/analytics-reporting?action=create-custom-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create custom report')
      }

      return result.data.report
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create custom report'
      setError(errorMessage)
      console.error('Error creating custom report:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const scheduleReport = useCallback(async (reportId: string, schedule: any, recipients: string[]): Promise<any> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/analytics-reporting?action=schedule-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId, schedule, recipients })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to schedule report')
      }

      return result.data.scheduledReport
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule report'
      setError(errorMessage)
      console.error('Error scheduling report:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const getTrendIcon = useCallback((direction: string): string => {
    switch (direction) {
      case 'increasing':
        return 'TrendingUp'
      case 'decreasing':
        return 'TrendingDown'
      default:
        return 'Minus'
    }
  }, [])

  const getTrendColor = useCallback((direction: string): string => {
    switch (direction) {
      case 'increasing':
        return 'text-green-600'
      case 'decreasing':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }, [])

  const getUtilizationColor = useCallback((utilization: number): string => {
    if (utilization >= 90) return 'bg-red-100 text-red-800 border-red-200'
    if (utilization >= 80) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (utilization >= 60) return 'bg-green-100 text-green-800 border-green-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }, [])

  const calculatePercentageChange = useCallback((current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    analyticsData,
    schedulingPerformance,
    utilizationData,
    trendData,
    comparativeData,
    customReports,
    getOverview,
    getSchedulingPerformance,
    getUtilization,
    getTrends,
    getComparative,
    generateReport,
    exportReport,
    getCustomReports,
    createCustomReport,
    scheduleReport,
    formatDate,
    getTrendIcon,
    getTrendColor,
    getUtilizationColor,
    calculatePercentageChange,
    clearError
  }
}
