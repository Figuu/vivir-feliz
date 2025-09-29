import { useState, useCallback } from 'react'

interface CalendarQuery {
  role: 'ADMIN' | 'THERAPIST' | 'PARENT' | 'PATIENT'
  userId?: string
  date: string
  status?: string
  therapistId?: string
  serviceId?: string
  search?: string
  view?: 'month' | 'week' | 'day' | 'agenda'
}

interface Session {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULE_REQUESTED'
  patient: {
    id: string
    firstName: string
    lastName: string
    parent?: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string
    }
  }
  therapist: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  serviceAssignment: {
    service: {
      id: string
      name: string
      type: string
    }
  }
  sessionNotes?: string
  therapistComments?: string
}

interface CalendarStats {
  total: number
  today: number
  upcoming: number
  overdue: number
  statusBreakdown: Record<string, number>
}

interface RoleData {
  therapists?: any[]
  services?: any[]
  patients?: any[]
  children?: any[]
  therapist?: any
  totalTherapists?: number
  totalServices?: number
  totalPatients?: number
  totalChildren?: number
}

interface UseSessionCalendarReturn {
  loading: boolean
  error: string | null
  sessions: Session[]
  stats: CalendarStats
  roleData: RoleData
  filters: CalendarQuery
  
  // Calendar operations
  loadSessions: (query: CalendarQuery) => Promise<{
    sessions: Session[]
    stats: CalendarStats
    roleData: RoleData
  }>
  
  // Session actions
  confirmSession: (sessionId: string) => Promise<void>
  cancelSession: (sessionId: string, reason: string) => Promise<void>
  startSession: (sessionId: string) => Promise<void>
  completeSession: (sessionId: string, data: {
    therapistComments?: string
    sessionNotes?: string
  }) => Promise<void>
  
  // Calendar navigation
  getDateRange: (date: Date, view: 'month' | 'week' | 'day') => {
    start: Date
    end: Date
  }
  
  getCalendarDays: (date: Date, view: 'month' | 'week' | 'day') => Date[]
  
  // Utility functions
  formatTime: (time: string) => string
  getStatusColor: (status: string) => string
  getRoleSpecificActions: (session: Session, role: string, userId?: string) => any[]
  
  clearError: () => void
}

export function useSessionCalendar(): UseSessionCalendarReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState<CalendarStats>({
    total: 0,
    today: 0,
    upcoming: 0,
    overdue: 0,
    statusBreakdown: {}
  })
  const [roleData, setRoleData] = useState<RoleData>({})
  const [filters, setFilters] = useState<CalendarQuery>({
    role: 'ADMIN',
    date: new Date().toISOString(),
    view: 'month'
  })

  const loadSessions = useCallback(async (query: CalendarQuery): Promise<{
    sessions: Session[]
    stats: CalendarStats
    roleData: RoleData
  }> => {
    try {
      setLoading(true)
      setError(null)
      setFilters(query)

      const searchParams = new URLSearchParams()
      searchParams.append('role', query.role)
      if (query.userId) searchParams.append('userId', query.userId)
      searchParams.append('date', query.date)
      if (query.status) searchParams.append('status', query.status)
      if (query.therapistId) searchParams.append('therapistId', query.therapistId)
      if (query.serviceId) searchParams.append('serviceId', query.serviceId)
      if (query.search) searchParams.append('search', query.search)
      if (query.view) searchParams.append('view', query.view)

      const response = await fetch(`/api/sessions/calendar?${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load sessions')
      }

      setSessions(result.data.sessions)
      setStats(result.data.stats)
      setRoleData(result.data.roleData)

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions'
      setError(errorMessage)
      console.error('Error loading sessions:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const confirmSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}/confirm`, {
        method: 'POST'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to confirm session')
      }

      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'CONFIRMED' as const }
          : session
      ))

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm session'
      setError(errorMessage)
      console.error('Error confirming session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelSession = useCallback(async (sessionId: string, reason: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel session')
      }

      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'CANCELLED' as const }
          : session
      ))

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel session'
      setError(errorMessage)
      console.error('Error cancelling session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const startSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}/start`, {
        method: 'POST'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start session')
      }

      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'IN_PROGRESS' as const }
          : session
      ))

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session'
      setError(errorMessage)
      console.error('Error starting session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const completeSession = useCallback(async (sessionId: string, data: {
    therapistComments?: string
    sessionNotes?: string
  }): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete session')
      }

      // Update local state
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              status: 'COMPLETED' as const,
              therapistComments: data.therapistComments || session.therapistComments,
              sessionNotes: data.sessionNotes || session.sessionNotes
            }
          : session
      ))

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete session'
      setError(errorMessage)
      console.error('Error completing session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getDateRange = useCallback((date: Date, view: 'month' | 'week' | 'day'): {
    start: Date
    end: Date
  } => {
    switch (view) {
      case 'month':
        return {
          start: new Date(date.getFullYear(), date.getMonth(), 1),
          end: new Date(date.getFullYear(), date.getMonth() + 1, 0)
        }
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return { start: weekStart, end: weekEnd }
      case 'day':
        const dayStart = new Date(date)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)
        return { start: dayStart, end: dayEnd }
      default:
        return { start: date, end: date }
    }
  }, [])

  const getCalendarDays = useCallback((date: Date, view: 'month' | 'week' | 'day'): Date[] => {
    const days: Date[] = []
    
    switch (view) {
      case 'month':
        const { start, end } = getDateRange(date, 'month')
        const firstDay = new Date(start)
        firstDay.setDate(start.getDate() - start.getDay())
        
        for (let i = 0; i < 42; i++) {
          const day = new Date(firstDay)
          day.setDate(firstDay.getDate() + i)
          days.push(day)
        }
        break
        
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        
        for (let i = 0; i < 7; i++) {
          const day = new Date(weekStart)
          day.setDate(weekStart.getDate() + i)
          days.push(day)
        }
        break
        
      case 'day':
        days.push(new Date(date))
        break
    }
    
    return days
  }, [getDateRange])

  const formatTime = useCallback((time: string): string => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }, [])

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'NO_SHOW':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'RESCHEDULE_REQUESTED':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [])

  const getRoleSpecificActions = useCallback((session: Session, role: string, userId?: string): any[] => {
    const actions = []

    switch (role) {
      case 'ADMIN':
        actions.push(
          { id: 'edit', label: 'Edit', icon: 'Edit', variant: 'outline' },
          { id: 'delete', label: 'Delete', icon: 'Trash2', variant: 'destructive' }
        )
        if (session.status === 'SCHEDULED') {
          actions.push({ id: 'confirm', label: 'Confirm', icon: 'CheckCircle', variant: 'default' })
        }
        if (session.status === 'CONFIRMED') {
          actions.push({ id: 'start', label: 'Start', icon: 'Play', variant: 'default' })
        }
        if (session.status === 'IN_PROGRESS') {
          actions.push({ id: 'complete', label: 'Complete', icon: 'CheckCircle', variant: 'default' })
        }
        break

      case 'THERAPIST':
        if (session.therapist.id === userId) {
          if (session.status === 'CONFIRMED') {
            actions.push({ id: 'start', label: 'Start', icon: 'Play', variant: 'default' })
          }
          if (session.status === 'IN_PROGRESS') {
            actions.push({ id: 'complete', label: 'Complete', icon: 'CheckCircle', variant: 'default' })
          }
          actions.push({ id: 'edit', label: 'Edit', icon: 'Edit', variant: 'outline' })
        }
        break

      case 'PARENT':
      case 'PATIENT':
        if (session.patient.id === userId || session.patient.parent?.id === userId) {
          if (session.status === 'SCHEDULED') {
            actions.push({ id: 'confirm', label: 'Confirm', icon: 'CheckCircle', variant: 'default' })
          }
          actions.push({ id: 'cancel', label: 'Cancel', icon: 'X', variant: 'destructive' })
        }
        break
    }

    return actions
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    sessions,
    stats,
    roleData,
    filters,
    loadSessions,
    confirmSession,
    cancelSession,
    startSession,
    completeSession,
    getDateRange,
    getCalendarDays,
    formatTime,
    getStatusColor,
    getRoleSpecificActions,
    clearError
  }
}
