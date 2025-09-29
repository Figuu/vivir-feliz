import { useState, useCallback } from 'react'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  email: string
  specialties: Array<{
    id: string
    name: string
    description: string
  }>
}

interface DashboardStatistics {
  sessions: {
    total: number
    completed: number
    cancelled: number
    upcoming: number
    completionRate: number
  }
  patients: {
    total: number
    new: number
  }
  revenue: {
    total: number
    average: number
  }
  performance: {
    averageSessionDuration: number
  }
}

interface Session {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: string
  sessionNotes?: string
  therapistComments?: string
  patient: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  services: Array<{
    id: string
    name: string
    description: string
    price: number
  }>
}

interface AgendaDay {
  date: string
  sessions: Session[]
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  gender?: string
  lastSession: {
    date: string
    status: string
  }
  totalSessions: number
  nextSession?: {
    date: string
    time: string
  }
}

interface DashboardData {
  therapist: Therapist
  period: {
    type: string
    startDate: string
    endDate: string
  }
  statistics?: DashboardStatistics
  agenda?: AgendaDay[]
  patients?: Patient[]
}

interface DashboardQuery {
  therapistId: string
  date?: string
  period?: 'today' | 'week' | 'month'
  includeStats?: boolean
  includeAgenda?: boolean
  includePatients?: boolean
}

interface UseTherapistDashboardReturn {
  loading: boolean
  error: string | null
  
  // Data
  dashboardData: DashboardData | null
  therapist: Therapist | null
  statistics: DashboardStatistics | null
  agenda: AgendaDay[]
  patients: Patient[]
  
  // Operations
  loadDashboard: (query: DashboardQuery) => Promise<DashboardData>
  refreshDashboard: () => Promise<void>
  
  // Utility functions
  formatDate: (dateString: string) => string
  formatTime: (timeString: string) => string
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => string
  calculateWorkingHours: (sessions: Session[]) => number
  getUpcomingSessions: (sessions: Session[], hours: number) => Session[]
  getOverdueSessions: (sessions: Session[]) => Session[]
  getSessionRevenue: (session: Session) => number
  getTotalRevenue: (sessions: Session[]) => number
  
  // State management
  clearError: () => void
}

export function useTherapistDashboard(): UseTherapistDashboardReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null)
  const [agenda, setAgenda] = useState<AgendaDay[]>([])
  const [patients, setPatients] = useState<Patient[]>([])

  const loadDashboard = useCallback(async (query: DashboardQuery): Promise<DashboardData> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('therapistId', query.therapistId)
      if (query.date) params.append('date', query.date)
      if (query.period) params.append('period', query.period)
      if (query.includeStats !== undefined) params.append('includeStats', query.includeStats.toString())
      if (query.includeAgenda !== undefined) params.append('includeAgenda', query.includeAgenda.toString())
      if (query.includePatients !== undefined) params.append('includePatients', query.includePatients.toString())

      const response = await fetch(`/api/therapist/dashboard?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load dashboard data')
      }

      const data = result.data
      setDashboardData(data)
      setTherapist(data.therapist)
      setStatistics(data.statistics || null)
      setAgenda(data.agenda || [])
      setPatients(data.patients || [])
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(errorMessage)
      console.error('Error loading dashboard data:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshDashboard = useCallback(async (): Promise<void> => {
    if (dashboardData) {
      await loadDashboard({
        therapistId: dashboardData.therapist.id,
        period: dashboardData.period.type as 'today' | 'week' | 'month',
        includeStats: true,
        includeAgenda: true,
        includePatients: true
      })
    }
  }, [dashboardData, loadDashboard])

  // Utility functions
  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const formatTime = useCallback((timeString: string): string => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }, [])

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [])

  const getStatusIcon = useCallback((status: string): string => {
    switch (status) {
      case 'completed':
        return 'CheckCircle'
      case 'scheduled':
        return 'Clock'
      case 'cancelled':
        return 'XCircle'
      case 'in-progress':
        return 'Play'
      default:
        return 'AlertCircle'
    }
  }, [])

  const calculateWorkingHours = useCallback((sessions: Session[]): number => {
    const totalMinutes = sessions.reduce((total, session) => {
      return total + session.duration
    }, 0)
    return Math.round((totalMinutes / 60) * 100) / 100 // Round to 2 decimal places
  }, [])

  const getUpcomingSessions = useCallback((sessions: Session[], hours: number = 24): Session[] => {
    const now = new Date()
    const futureTime = new Date(now.getTime() + (hours * 60 * 60 * 1000))
    
    return sessions.filter(session => {
      const sessionDateTime = new Date(`${session.scheduledDate}T${session.scheduledTime}`)
      return sessionDateTime > now && sessionDateTime <= futureTime && session.status === 'scheduled'
    })
  }, [])

  const getOverdueSessions = useCallback((sessions: Session[]): Session[] => {
    const now = new Date()
    
    return sessions.filter(session => {
      const sessionDateTime = new Date(`${session.scheduledDate}T${session.scheduledTime}`)
      return sessionDateTime < now && session.status === 'scheduled'
    })
  }, [])

  const getSessionRevenue = useCallback((session: Session): number => {
    return session.services.reduce((total, service) => {
      return total + service.price
    }, 0)
  }, [])

  const getTotalRevenue = useCallback((sessions: Session[]): number => {
    return sessions.reduce((total, session) => {
      return total + getSessionRevenue(session)
    }, 0)
  }, [getSessionRevenue])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    dashboardData,
    therapist,
    statistics,
    agenda,
    patients,
    loadDashboard,
    refreshDashboard,
    formatDate,
    formatTime,
    getStatusColor,
    getStatusIcon,
    calculateWorkingHours,
    getUpcomingSessions,
    getOverdueSessions,
    getSessionRevenue,
    getTotalRevenue,
    clearError
  }
}
