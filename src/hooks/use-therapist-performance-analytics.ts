import { useState, useCallback, useEffect } from 'react'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  email: string
  specialties: Array<{
    specialty: {
      id: string
      name: string
      category: string
    }
  }>
}

interface PerformanceData {
  therapist: Therapist
  sessions: Array<{
    id: string
    date: string
    duration: number
    status: string
    revenue: number
    patientSatisfaction?: number
    therapistSatisfaction?: number
    patient: any
    services: any[]
  }>
  totalSessions: number
  completedSessions: number
  cancelledSessions: number
  totalHours: number
  totalRevenue: number
  averageSessionDuration: number
  completionRate: number
  averagePatientSatisfaction: number
  averageTherapistSatisfaction: number
  productivityScore: number
  qualityScore: number
  patientRetentionRate: number
  specialtyPerformance: { [key: string]: any }
  monthlyTrends: Array<{
    month: string
    sessions: number
    completedSessions: number
    revenue: number
    hours: number
    averageSatisfaction: number
    completionRate: number
  }>
  performanceMetrics: {
    sessionsPerDay: number
    revenuePerSession: number
    revenuePerHour: number
    utilizationRate: number
    efficiencyScore: number
  }
}

interface PerformanceComparisons {
  topPerformers: {
    productivity: PerformanceData[]
    quality: PerformanceData[]
    revenue: PerformanceData[]
    satisfaction: PerformanceData[]
  }
  averages: {
    productivity: number
    quality: number
    revenue: number
    satisfaction: number
    completionRate: number
  }
}

interface PerformanceTrends {
  productivity: Array<{
    month: string
    therapistId: string
    therapistName: string
    value: number
  }>
  quality: Array<{
    month: string
    therapistId: string
    therapistName: string
    value: number
  }>
  revenue: Array<{
    month: string
    therapistId: string
    therapistName: string
    value: number
  }>
  satisfaction: Array<{
    month: string
    therapistId: string
    therapistName: string
    value: number
  }>
}

interface PerformanceSummary {
  totalTherapists: number
  totalSessions: number
  totalRevenue: number
  totalHours: number
  averageProductivity: number
  averageQuality: number
  averageSatisfaction: number
  averageCompletionRate: number
  averageRevenuePerTherapist: number
  averageSessionsPerTherapist: number
}

interface PerformanceGoal {
  id: string
  therapistId: string
  goalType: 'sessions' | 'revenue' | 'satisfaction' | 'completion_rate' | 'productivity'
  targetValue: number
  targetDate: string
  description?: string
  isActive: boolean
  createdAt: string
  progress: number
  status: string
}

interface PerformanceGoalData {
  therapistId: string
  goalType: 'sessions' | 'revenue' | 'satisfaction' | 'completion_rate' | 'productivity'
  targetValue: number
  targetDate: string
  description?: string
}

interface UseTherapistPerformanceAnalyticsReturn {
  loading: boolean
  error: string | null
  
  // Data
  performanceData: PerformanceData[]
  comparisons: PerformanceComparisons | null
  trends: PerformanceTrends | null
  summary: PerformanceSummary | null
  therapists: Therapist[]
  
  // Filters
  selectedTherapistId: string
  selectedPeriod: 'day' | 'week' | 'month' | 'quarter' | 'year'
  
  // Operations
  loadPerformanceData: (therapistId?: string, period?: string) => Promise<void>
  createPerformanceGoal: (data: PerformanceGoalData) => Promise<PerformanceGoal>
  loadTherapists: () => Promise<void>
  
  // State management
  setSelectedTherapistId: (id: string) => void
  setSelectedPeriod: (period: 'day' | 'week' | 'month' | 'quarter' | 'year') => void
  clearError: () => void
  
  // Utility functions
  formatDate: (dateString: string) => string
  formatCurrency: (amount: number) => string
  formatDuration: (minutes: number) => string
  getPerformanceColor: (score: number) => string
  getPerformanceBgColor: (score: number) => string
  getPerformanceIcon: (score: number) => string
  getRankIcon: (rank: number) => string
  getPerformanceTrend: (therapistId: string) => any[]
  getSpecialtyPerformance: (therapistId: string) => { [key: string]: any }
  getProductivityScore: (therapistId: string) => number
  getQualityScore: (therapistId: string) => number
  getCompletionRate: (therapistId: string) => number
  getTotalSessions: (therapistId: string) => number
  getTotalRevenue: (therapistId: string) => number
  getTotalHours: (therapistId: string) => number
  getAverageSatisfaction: (therapistId: string) => number
  isTopPerformer: (therapistId: string, category: 'productivity' | 'quality' | 'revenue' | 'satisfaction') => boolean
  getPerformanceRank: (therapistId: string, category: 'productivity' | 'quality' | 'revenue' | 'satisfaction') => number
  getPerformanceSummary: () => {
    totalTherapists: number
    totalSessions: number
    totalRevenue: number
    totalHours: number
    averageProductivity: number
    averageQuality: number
    averageSatisfaction: number
    topPerformers: PerformanceData[]
    underperformers: PerformanceData[]
  }
}

export function useTherapistPerformanceAnalytics(): UseTherapistPerformanceAnalyticsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [comparisons, setComparisons] = useState<PerformanceComparisons | null>(null)
  const [trends, setTrends] = useState<PerformanceTrends | null>(null)
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month')

  const loadPerformanceData = useCallback(async (
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
      params.append('includeComparisons', 'true')
      params.append('includeTrends', 'true')

      const response = await fetch(`/api/therapist/performance-analytics?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load performance data')
      }

      setPerformanceData(result.data.performance)
      setComparisons(result.data.comparisons)
      setTrends(result.data.trends)
      setSummary(result.data.summary)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load performance data'
      setError(errorMessage)
      console.error('Error loading performance data:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [selectedTherapistId, selectedPeriod])

  const createPerformanceGoal = useCallback(async (data: PerformanceGoalData): Promise<PerformanceGoal> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/performance-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create performance goal')
      }

      return result.data.goal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create performance goal'
      setError(errorMessage)
      console.error('Error creating performance goal:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

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

  const getPerformanceColor = useCallback((score: number): string => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }, [])

  const getPerformanceBgColor = useCallback((score: number): string => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    if (score >= 40) return 'bg-orange-100'
    return 'bg-red-100'
  }, [])

  const getPerformanceIcon = useCallback((score: number): string => {
    if (score >= 90) return 'Crown'
    if (score >= 80) return 'Trophy'
    if (score >= 70) return 'Medal'
    if (score >= 60) return 'Award'
    return 'Target'
  }, [])

  const getRankIcon = useCallback((rank: number): string => {
    switch (rank) {
      case 1: return 'Crown'
      case 2: return 'Trophy'
      case 3: return 'Medal'
      default: return 'Award'
    }
  }, [])

  const getPerformanceTrend = useCallback((therapistId: string): any[] => {
    const therapist = performanceData.find(p => p.therapist.id === therapistId)
    return therapist?.monthlyTrends || []
  }, [performanceData])

  const getSpecialtyPerformance = useCallback((therapistId: string): { [key: string]: any } => {
    const therapist = performanceData.find(p => p.therapist.id === therapistId)
    return therapist?.specialtyPerformance || {}
  }, [performanceData])

  const getProductivityScore = useCallback((therapistId: string): number => {
    const therapist = performanceData.find(p => p.therapist.id === therapistId)
    return therapist?.productivityScore || 0
  }, [performanceData])

  const getQualityScore = useCallback((therapistId: string): number => {
    const therapist = performanceData.find(p => p.therapist.id === therapistId)
    return therapist?.qualityScore || 0
  }, [performanceData])

  const getCompletionRate = useCallback((therapistId: string): number => {
    const therapist = performanceData.find(p => p.therapist.id === therapistId)
    return therapist?.completionRate || 0
  }, [performanceData])

  const getTotalSessions = useCallback((therapistId: string): number => {
    const therapist = performanceData.find(p => p.therapist.id === therapistId)
    return therapist?.totalSessions || 0
  }, [performanceData])

  const getTotalRevenue = useCallback((therapistId: string): number => {
    const therapist = performanceData.find(p => p.therapist.id === therapistId)
    return therapist?.totalRevenue || 0
  }, [performanceData])

  const getTotalHours = useCallback((therapistId: string): number => {
    const therapist = performanceData.find(p => p.therapist.id === therapistId)
    return therapist?.totalHours || 0
  }, [performanceData])

  const getAverageSatisfaction = useCallback((therapistId: string): number => {
    const therapist = performanceData.find(p => p.therapist.id === therapistId)
    return therapist?.averagePatientSatisfaction || 0
  }, [performanceData])

  const isTopPerformer = useCallback((therapistId: string, category: 'productivity' | 'quality' | 'revenue' | 'satisfaction'): boolean => {
    if (!comparisons) return false
    
    const topPerformers = comparisons.topPerformers[category]
    return topPerformers.some(therapist => therapist.therapist.id === therapistId)
  }, [comparisons])

  const getPerformanceRank = useCallback((therapistId: string, category: 'productivity' | 'quality' | 'revenue' | 'satisfaction'): number => {
    if (!comparisons) return 0
    
    const topPerformers = comparisons.topPerformers[category]
    const index = topPerformers.findIndex(therapist => therapist.therapist.id === therapistId)
    return index >= 0 ? index + 1 : 0
  }, [comparisons])

  const getPerformanceSummary = useCallback(() => {
    const totalTherapists = performanceData.length
    const totalSessions = performanceData.reduce((sum, therapist) => sum + therapist.totalSessions, 0)
    const totalRevenue = performanceData.reduce((sum, therapist) => sum + therapist.totalRevenue, 0)
    const totalHours = performanceData.reduce((sum, therapist) => sum + therapist.totalHours, 0)
    
    const averageProductivity = totalTherapists > 0 
      ? performanceData.reduce((sum, therapist) => sum + therapist.productivityScore, 0) / totalTherapists 
      : 0
    
    const averageQuality = totalTherapists > 0 
      ? performanceData.reduce((sum, therapist) => sum + therapist.qualityScore, 0) / totalTherapists 
      : 0
    
    const averageSatisfaction = totalTherapists > 0 
      ? performanceData.reduce((sum, therapist) => sum + therapist.averagePatientSatisfaction, 0) / totalTherapists 
      : 0
    
    // Top performers (top 20%)
    const topPerformers = performanceData
      .sort((a, b) => b.productivityScore - a.productivityScore)
      .slice(0, Math.max(1, Math.floor(totalTherapists * 0.2)))
    
    // Underperformers (bottom 20%)
    const underperformers = performanceData
      .sort((a, b) => a.productivityScore - b.productivityScore)
      .slice(0, Math.max(1, Math.floor(totalTherapists * 0.2)))

    return {
      totalTherapists,
      totalSessions,
      totalRevenue,
      totalHours,
      averageProductivity: Math.round(averageProductivity),
      averageQuality: Math.round(averageQuality),
      averageSatisfaction: Math.round(averageSatisfaction * 10) / 10,
      topPerformers,
      underperformers
    }
  }, [performanceData])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    performanceData,
    comparisons,
    trends,
    summary,
    therapists,
    selectedTherapistId,
    selectedPeriod,
    loadPerformanceData,
    createPerformanceGoal,
    loadTherapists,
    setSelectedTherapistId,
    setSelectedPeriod,
    clearError,
    formatDate,
    formatCurrency,
    formatDuration,
    getPerformanceColor,
    getPerformanceBgColor,
    getPerformanceIcon,
    getRankIcon,
    getPerformanceTrend,
    getSpecialtyPerformance,
    getProductivityScore,
    getQualityScore,
    getCompletionRate,
    getTotalSessions,
    getTotalRevenue,
    getTotalHours,
    getAverageSatisfaction,
    isTopPerformer,
    getPerformanceRank,
    getPerformanceSummary
  }
}
