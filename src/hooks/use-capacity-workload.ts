import { useState, useCallback } from 'react'

interface CapacityConfig {
  therapistId: string
  maxSessionsPerDay: number
  maxSessionsPerWeek: number
  maxSessionsPerMonth: number
  maxHoursPerDay: number
  maxHoursPerWeek: number
  preferredSessionDuration: number
  breakTimeBetweenSessions: number
  workingDays: number[]
  isActive: boolean
}

interface WorkloadData {
  totalSessions: number
  totalHours: number
  averageSessionDuration: number
  dailyWorkload: Record<string, { sessions: number; hours: number }>
  sessions: any[]
}

interface TherapistOverview {
  therapist: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  capacity: CapacityConfig
  workload: WorkloadData
  alerts: any[]
  utilization: number
}

interface CapacityAlert {
  id: string
  therapistId: string
  alertType: 'CAPACITY_EXCEEDED' | 'WORKLOAD_HIGH' | 'BREAK_TIME_VIOLATION' | 'OVERTIME_WARNING'
  threshold: number
  isActive: boolean
  createdAt: string
}

interface WorkloadAnalysis {
  analysis: Array<{
    therapist: {
      id: string
      firstName: string
      lastName: string
    }
    capacity: CapacityConfig
    workload: WorkloadData
    utilization: number
    projections?: any
    recommendations: string[]
  }>
  summary: {
    totalTherapists: number
    averageUtilization: number
    overloadedTherapists: number
    underutilizedTherapists: number
  }
}

interface UseCapacityWorkloadReturn {
  loading: boolean
  error: string | null
  
  // Overview and data
  overview: TherapistOverview[]
  capacityConfig: CapacityConfig | null
  workloadData: WorkloadData | null
  alerts: CapacityAlert[]
  analytics: any
  
  // Capacity management
  getOverview: (therapistId?: string) => Promise<{
    overview: TherapistOverview[]
    summary: any
  }>
  
  getCapacity: (therapistId: string) => Promise<{
    capacity: CapacityConfig
    history: any[]
  }>
  
  setCapacityConfig: (config: CapacityConfig) => Promise<{
    config: CapacityConfig
  }>
  
  // Workload management
  getWorkload: (therapistId: string, dateFrom: string, dateTo: string) => Promise<{
    workload: WorkloadData
    trends: any
    distribution: any
  }>
  
  analyzeWorkload: (params: {
    therapistId?: string
    dateFrom: string
    dateTo: string
    includeProjections?: boolean
  }) => Promise<WorkloadAnalysis>
  
  // Alerts management
  getAlerts: (params: {
    therapistId?: string
    alertType?: string
    isActive?: boolean
  }) => Promise<{
    alerts: CapacityAlert[]
    currentAlerts: any[]
  }>
  
  setCapacityAlert: (alert: {
    therapistId: string
    alertType: 'CAPACITY_EXCEEDED' | 'WORKLOAD_HIGH' | 'BREAK_TIME_VIOLATION' | 'OVERTIME_WARNING'
    threshold: number
    isActive?: boolean
  }) => Promise<{
    alert: CapacityAlert
  }>
  
  // Analytics
  getAnalytics: (dateFrom: string, dateTo: string) => Promise<any>
  
  // Optimization
  optimizeCapacity: (params: {
    therapistId: string
    optimizationType: 'BALANCE_WORKLOAD' | 'MAXIMIZE_CAPACITY' | 'REDUCE_OVERTIME'
    constraints?: any
  }) => Promise<any>
  
  // Utility functions
  calculateUtilization: (capacity: CapacityConfig, workload: WorkloadData) => number
  getUtilizationColor: (utilization: number) => string
  getUtilizationBadgeColor: (utilization: number) => string
  
  clearError: () => void
}

export function useCapacityWorkload(): UseCapacityWorkloadReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<TherapistOverview[]>([])
  const [capacityConfig, setCapacityConfig] = useState<CapacityConfig | null>(null)
  const [workloadData, setWorkloadData] = useState<WorkloadData | null>(null)
  const [alerts, setAlerts] = useState<CapacityAlert[]>([])
  const [analytics, setAnalytics] = useState<any>(null)

  const getOverview = useCallback(async (therapistId?: string): Promise<{
    overview: TherapistOverview[]
    summary: any
  }> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (therapistId) params.append('therapistId', therapistId)

      const response = await fetch(`/api/sessions/capacity-workload?action=overview&${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get overview')
      }

      setOverview(result.data.overview)
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

  const getCapacity = useCallback(async (therapistId: string): Promise<{
    capacity: CapacityConfig
    history: any[]
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/capacity-workload?action=capacity&therapistId=${therapistId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get capacity')
      }

      setCapacityConfig(result.data.capacity)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get capacity'
      setError(errorMessage)
      console.error('Error getting capacity:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const setCapacityConfig = useCallback(async (config: CapacityConfig): Promise<{
    config: CapacityConfig
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/capacity-workload?action=config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to set capacity config')
      }

      setCapacityConfig(result.data.config)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set capacity config'
      setError(errorMessage)
      console.error('Error setting capacity config:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getWorkload = useCallback(async (therapistId: string, dateFrom: string, dateTo: string): Promise<{
    workload: WorkloadData
    trends: any
    distribution: any
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/capacity-workload?action=workload&therapistId=${therapistId}&dateFrom=${dateFrom}&dateTo=${dateTo}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get workload')
      }

      setWorkloadData(result.data.workload)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get workload'
      setError(errorMessage)
      console.error('Error getting workload:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const analyzeWorkload = useCallback(async (params: {
    therapistId?: string
    dateFrom: string
    dateTo: string
    includeProjections?: boolean
  }): Promise<WorkloadAnalysis> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/capacity-workload?action=analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze workload')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze workload'
      setError(errorMessage)
      console.error('Error analyzing workload:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getAlerts = useCallback(async (params: {
    therapistId?: string
    alertType?: string
    isActive?: boolean
  }): Promise<{
    alerts: CapacityAlert[]
    currentAlerts: any[]
  }> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params.therapistId) searchParams.append('therapistId', params.therapistId)
      if (params.alertType) searchParams.append('alertType', params.alertType)
      if (params.isActive !== undefined) searchParams.append('isActive', params.isActive.toString())

      const response = await fetch(`/api/sessions/capacity-workload?action=alerts&${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get alerts')
      }

      setAlerts(result.data.alerts)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get alerts'
      setError(errorMessage)
      console.error('Error getting alerts:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const setCapacityAlert = useCallback(async (alert: {
    therapistId: string
    alertType: 'CAPACITY_EXCEEDED' | 'WORKLOAD_HIGH' | 'BREAK_TIME_VIOLATION' | 'OVERTIME_WARNING'
    threshold: number
    isActive?: boolean
  }): Promise<{
    alert: CapacityAlert
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/capacity-workload?action=alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to set capacity alert')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set capacity alert'
      setError(errorMessage)
      console.error('Error setting capacity alert:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getAnalytics = useCallback(async (dateFrom: string, dateTo: string): Promise<any> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/capacity-workload?action=analytics&dateFrom=${dateFrom}&dateTo=${dateTo}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get analytics')
      }

      setAnalytics(result.data)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get analytics'
      setError(errorMessage)
      console.error('Error getting analytics:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const optimizeCapacity = useCallback(async (params: {
    therapistId: string
    optimizationType: 'BALANCE_WORKLOAD' | 'MAXIMIZE_CAPACITY' | 'REDUCE_OVERTIME'
    constraints?: any
  }): Promise<any> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/capacity-workload?action=optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to optimize capacity')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize capacity'
      setError(errorMessage)
      console.error('Error optimizing capacity:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const calculateUtilization = useCallback((capacity: CapacityConfig, workload: WorkloadData): number => {
    if (!capacity || !workload) return 0

    const dailyUtilization = (workload.totalHours / capacity.maxHoursPerDay) * 100
    const weeklyUtilization = (workload.totalSessions / capacity.maxSessionsPerWeek) * 100

    return Math.max(dailyUtilization, weeklyUtilization)
  }, [])

  const getUtilizationColor = useCallback((utilization: number): string => {
    if (utilization >= 90) return 'text-red-600'
    if (utilization >= 80) return 'text-yellow-600'
    if (utilization >= 60) return 'text-green-600'
    return 'text-blue-600'
  }, [])

  const getUtilizationBadgeColor = useCallback((utilization: number): string => {
    if (utilization >= 90) return 'bg-red-100 text-red-800 border-red-200'
    if (utilization >= 80) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (utilization >= 60) return 'bg-green-100 text-green-800 border-green-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    overview,
    capacityConfig,
    workloadData,
    alerts,
    analytics,
    getOverview,
    getCapacity,
    setCapacityConfig,
    getWorkload,
    analyzeWorkload,
    getAlerts,
    setCapacityAlert,
    getAnalytics,
    optimizeCapacity,
    calculateUtilization,
    getUtilizationColor,
    getUtilizationBadgeColor,
    clearError
  }
}
