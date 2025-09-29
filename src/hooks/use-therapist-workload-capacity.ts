import { useState, useCallback, useEffect } from 'react'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface WorkloadData {
  therapist: Therapist
  dailyWorkload: { [key: string]: any }
  totalSessions: number
  totalHours: number
  totalRevenue: number
  averageSessionDuration: number
  utilizationRate: number
  capacityUtilization: number
  workloadTrend: Array<{
    date: string
    sessions: number
    hours: number
    revenue: number
    utilization: number
  }>
  capacityAlerts: Array<{
    type: string
    date: string
    message: string
    severity: string
  }>
}

interface CapacityProjections {
  nextWeek: {
    estimatedSessions: number
    estimatedHours: number
    estimatedRevenue: number
    capacityUtilization: number
  }
  nextMonth: {
    estimatedSessions: number
    estimatedHours: number
    estimatedRevenue: number
    capacityUtilization: number
  }
}

interface WorkloadAlert {
  therapistId: string
  therapistName: string
  type: string
  message: string
  severity: string
}

interface WorkloadSummary {
  totalTherapists: number
  totalSessions: number
  totalHours: number
  totalRevenue: number
  averageUtilization: number
  averageSessionsPerTherapist: number
  averageHoursPerTherapist: number
}

interface CapacityUpdateData {
  therapistId: string
  date: string
  maxSessions: number
  maxHours: number
  sessionDuration: number
  bufferTime: number
  breakTime: number
  workingHours: number
  capacityNotes?: string
}

interface WorkloadAlertData {
  therapistId: string
  alertType: 'capacity_warning' | 'overload' | 'underutilized' | 'overtime'
  threshold: number
  isActive: boolean
  notificationEnabled?: boolean
}

interface UseTherapistWorkloadCapacityReturn {
  loading: boolean
  error: string | null
  
  // Data
  workloadData: WorkloadData[]
  projections: CapacityProjections | null
  alerts: WorkloadAlert[]
  summary: WorkloadSummary | null
  therapists: Therapist[]
  
  // Filters
  selectedTherapistId: string
  selectedPeriod: 'day' | 'week' | 'month' | 'quarter' | 'year'
  
  // Operations
  loadWorkloadData: (therapistId?: string, period?: string) => Promise<void>
  updateCapacity: (data: CapacityUpdateData) => Promise<void>
  updateWorkloadAlert: (data: WorkloadAlertData) => Promise<void>
  loadTherapists: () => Promise<void>
  
  // State management
  setSelectedTherapistId: (id: string) => void
  setSelectedPeriod: (period: 'day' | 'week' | 'month' | 'quarter' | 'year') => void
  clearError: () => void
  
  // Utility functions
  formatDate: (dateString: string) => string
  formatCurrency: (amount: number) => string
  formatDuration: (minutes: number) => string
  getUtilizationColor: (utilization: number) => string
  getUtilizationBgColor: (utilization: number) => string
  getAlertSeverityColor: (severity: string) => string
  getWorkloadTrend: (therapistId: string) => any[]
  getCapacityAlerts: (therapistId: string) => any[]
  getUtilizationRate: (therapistId: string) => number
  getTotalSessions: (therapistId: string) => number
  getTotalHours: (therapistId: string) => number
  getTotalRevenue: (therapistId: string) => number
  isOverloaded: (therapistId: string) => boolean
  isUnderutilized: (therapistId: string) => boolean
  getCapacityUtilization: (therapistId: string) => number
  getWorkloadSummary: () => {
    totalTherapists: number
    totalSessions: number
    totalHours: number
    totalRevenue: number
    averageUtilization: number
    overloadedTherapists: number
    underutilizedTherapists: number
  }
}

export function useTherapistWorkloadCapacity(): UseTherapistWorkloadCapacityReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([])
  const [projections, setProjections] = useState<CapacityProjections | null>(null)
  const [alerts, setAlerts] = useState<WorkloadAlert[]>([])
  const [summary, setSummary] = useState<WorkloadSummary | null>(null)
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('week')

  const loadWorkloadData = useCallback(async (
    therapistId?: string,
    period?: string
  ): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (therapistId || selectedTherapistId) {
        params.append('therapistId', therapistId || selectedTherapistId)
      }
      params.append('period', period || selectedPeriod)
      params.append('includeProjections', 'true')
      params.append('includeAlerts', 'true')

      const response = await fetch(`/api/therapist/workload-capacity?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load workload data')
      }

      setWorkloadData(result.data.workload)
      setProjections(result.data.projections)
      setAlerts(result.data.alerts)
      setSummary(result.data.summary)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workload data'
      setError(errorMessage)
      console.error('Error loading workload data:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [selectedTherapistId, selectedPeriod])

  const updateCapacity = useCallback(async (data: CapacityUpdateData): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/workload-capacity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update capacity')
      }

      // Reload workload data to reflect changes
      await loadWorkloadData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update capacity'
      setError(errorMessage)
      console.error('Error updating capacity:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadWorkloadData])

  const updateWorkloadAlert = useCallback(async (data: WorkloadAlertData): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/workload-capacity', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update workload alert')
      }

      // Reload workload data to reflect changes
      await loadWorkloadData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update workload alert'
      setError(errorMessage)
      console.error('Error updating workload alert:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadWorkloadData])

  const loadTherapists = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/therapist/profile?limit=100')
      const result = await response.json()
      if (response.ok) {
        setTherapists(result.data.therapists)
      }
    } catch (err) {
      console.error('Error loading therapists:', err)
    }
  }, [])

  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }, [])

  const formatDuration = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }, [])

  const getUtilizationColor = useCallback((utilization: number): string => {
    if (utilization >= 90) return 'text-red-600'
    if (utilization >= 75) return 'text-yellow-600'
    if (utilization >= 50) return 'text-green-600'
    return 'text-blue-600'
  }, [])

  const getUtilizationBgColor = useCallback((utilization: number): string => {
    if (utilization >= 90) return 'bg-red-100'
    if (utilization >= 75) return 'bg-yellow-100'
    if (utilization >= 50) return 'bg-green-100'
    return 'bg-blue-100'
  }, [])

  const getAlertSeverityColor = useCallback((severity: string): string => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [])

  const getWorkloadTrend = useCallback((therapistId: string): any[] => {
    const therapist = workloadData.find(w => w.therapist.id === therapistId)
    return therapist?.workloadTrend || []
  }, [workloadData])

  const getCapacityAlerts = useCallback((therapistId: string): any[] => {
    const therapist = workloadData.find(w => w.therapist.id === therapistId)
    return therapist?.capacityAlerts || []
  }, [workloadData])

  const getUtilizationRate = useCallback((therapistId: string): number => {
    const therapist = workloadData.find(w => w.therapist.id === therapistId)
    return therapist?.utilizationRate || 0
  }, [workloadData])

  const getTotalSessions = useCallback((therapistId: string): number => {
    const therapist = workloadData.find(w => w.therapist.id === therapistId)
    return therapist?.totalSessions || 0
  }, [workloadData])

  const getTotalHours = useCallback((therapistId: string): number => {
    const therapist = workloadData.find(w => w.therapist.id === therapistId)
    return therapist?.totalHours || 0
  }, [workloadData])

  const getTotalRevenue = useCallback((therapistId: string): number => {
    const therapist = workloadData.find(w => w.therapist.id === therapistId)
    return therapist?.totalRevenue || 0
  }, [workloadData])

  const isOverloaded = useCallback((therapistId: string): boolean => {
    const utilization = getUtilizationRate(therapistId)
    return utilization >= 90
  }, [getUtilizationRate])

  const isUnderutilized = useCallback((therapistId: string): boolean => {
    const utilization = getUtilizationRate(therapistId)
    return utilization < 20
  }, [getUtilizationRate])

  const getCapacityUtilization = useCallback((therapistId: string): number => {
    const therapist = workloadData.find(w => w.therapist.id === therapistId)
    return therapist?.capacityUtilization || 0
  }, [workloadData])

  const getWorkloadSummary = useCallback(() => {
    const totalTherapists = workloadData.length
    const totalSessions = workloadData.reduce((sum, therapist) => sum + therapist.totalSessions, 0)
    const totalHours = workloadData.reduce((sum, therapist) => sum + therapist.totalHours, 0)
    const totalRevenue = workloadData.reduce((sum, therapist) => sum + therapist.totalRevenue, 0)
    const averageUtilization = totalTherapists > 0 
      ? workloadData.reduce((sum, therapist) => sum + therapist.utilizationRate, 0) / totalTherapists 
      : 0
    const overloadedTherapists = workloadData.filter(therapist => isOverloaded(therapist.therapist.id)).length
    const underutilizedTherapists = workloadData.filter(therapist => isUnderutilized(therapist.therapist.id)).length

    return {
      totalTherapists,
      totalSessions,
      totalHours,
      totalRevenue,
      averageUtilization: Math.round(averageUtilization),
      overloadedTherapists,
      underutilizedTherapists
    }
  }, [workloadData, isOverloaded, isUnderutilized])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    workloadData,
    projections,
    alerts,
    summary,
    therapists,
    selectedTherapistId,
    selectedPeriod,
    loadWorkloadData,
    updateCapacity,
    updateWorkloadAlert,
    loadTherapists,
    setSelectedTherapistId,
    setSelectedPeriod,
    clearError,
    formatDate,
    formatCurrency,
    formatDuration,
    getUtilizationColor,
    getUtilizationBgColor,
    getAlertSeverityColor,
    getWorkloadTrend,
    getCapacityAlerts,
    getUtilizationRate,
    getTotalSessions,
    getTotalHours,
    getTotalRevenue,
    isOverloaded,
    isUnderutilized,
    getCapacityUtilization,
    getWorkloadSummary
  }
}
