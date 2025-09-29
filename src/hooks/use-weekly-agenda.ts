import { useState, useCallback } from 'react'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  specialties: Array<{
    id: string
    name: string
    description: string
  }>
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

interface WeekDay {
  date: string
  dayName: string
  dayNumber: number
}

interface Availability {
  startTime: string
  endTime: string
  breakStartTime?: string
  breakEndTime?: string
  maxSessionsPerDay: number
  sessionDuration: number
  bufferTime: number
}

interface WeeklyAgendaData {
  therapist: Therapist
  week: {
    startDate: string
    endDate: string
    days: WeekDay[]
  }
  sessions: Record<string, Session[]>
  availability: Record<string, Availability>
  conflicts: any[]
}

interface WeeklyAgendaQuery {
  therapistId: string
  weekStart?: string
  includeSessions?: boolean
  includeAvailability?: boolean
  includeConflicts?: boolean
}

interface SessionUpdateData {
  sessionId: string
  scheduledDate?: string
  scheduledTime?: string
  duration?: number
  status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'no-show'
  sessionNotes?: string
  therapistComments?: string
}

interface SessionCreateData {
  therapistId: string
  patientId: string
  scheduledDate: string
  scheduledTime: string
  duration?: number
  serviceIds: string[]
  notes?: string
}

interface UseWeeklyAgendaReturn {
  loading: boolean
  error: string | null
  
  // Data
  agendaData: WeeklyAgendaData | null
  therapist: Therapist | null
  weekDays: WeekDay[]
  sessions: Record<string, Session[]>
  availability: Record<string, Availability>
  conflicts: any[]
  suggestions: any[]
  
  // Operations
  loadWeeklyAgenda: (query: WeeklyAgendaQuery) => Promise<WeeklyAgendaData>
  refreshAgenda: () => Promise<void>
  createSession: (sessionData: SessionCreateData) => Promise<Session>
  updateSession: (sessionData: SessionUpdateData) => Promise<Session>
  deleteSession: (sessionId: string) => Promise<void>
  
  // Utility functions
  formatTime: (timeString: string) => string
  getStatusColor: (status: string) => string
  getStatusIcon: (status: string) => string
  generateTimeSlots: (availability?: Availability) => string[]
  timeToMinutes: (timeString: string) => number
  minutesToTime: (minutes: number) => string
  getWeekStart: (date: Date) => Date
  getWeekEnd: (date: Date) => Date
  navigateWeek: (currentWeekStart: Date, direction: 'prev' | 'next') => Date
  getSessionsForDay: (date: string) => Session[]
  getAvailabilityForDay: (date: string) => Availability | undefined
  isTimeSlotAvailable: (date: string, time: string, duration: number) => boolean
  getSessionConflicts: (sessionData: SessionCreateData | SessionUpdateData) => any[]
  calculateSessionEndTime: (startTime: string, duration: number) => string
  getSessionDuration: (session: Session) => number
  getSessionRevenue: (session: Session) => number
  getTotalRevenueForWeek: () => number
  getSessionCountForWeek: () => number
  getCompletedSessionsCount: () => number
  getUpcomingSessionsCount: () => number
  
  // State management
  clearError: () => void
  clearConflicts: () => void
  clearSuggestions: () => void
}

export function useWeeklyAgenda(): UseWeeklyAgendaReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agendaData, setAgendaData] = useState<WeeklyAgendaData | null>(null)
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
  const [sessions, setSessions] = useState<Record<string, Session[]>>({})
  const [availability, setAvailability] = useState<Record<string, Availability>>({})
  const [conflicts, setConflicts] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])

  const loadWeeklyAgenda = useCallback(async (query: WeeklyAgendaQuery): Promise<WeeklyAgendaData> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('therapistId', query.therapistId)
      if (query.weekStart) params.append('weekStart', query.weekStart)
      if (query.includeSessions !== undefined) params.append('includeSessions', query.includeSessions.toString())
      if (query.includeAvailability !== undefined) params.append('includeAvailability', query.includeAvailability.toString())
      if (query.includeConflicts !== undefined) params.append('includeConflicts', query.includeConflicts.toString())

      const response = await fetch(`/api/therapist/weekly-agenda?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load weekly agenda')
      }

      const data = result.data
      setAgendaData(data)
      setTherapist(data.therapist)
      setWeekDays(data.week.days)
      setSessions(data.sessions || {})
      setAvailability(data.availability || {})
      setConflicts(data.conflicts || [])
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load weekly agenda'
      setError(errorMessage)
      console.error('Error loading weekly agenda:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshAgenda = useCallback(async (): Promise<void> => {
    if (agendaData) {
      await loadWeeklyAgenda({
        therapistId: agendaData.therapist.id,
        weekStart: agendaData.week.startDate,
        includeSessions: true,
        includeAvailability: true,
        includeConflicts: true
      })
    }
  }, [agendaData, loadWeeklyAgenda])

  const createSession = useCallback(async (sessionData: SessionCreateData): Promise<Session> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/weekly-agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409 && result.conflicts) {
          setConflicts(result.conflicts)
          setSuggestions(result.suggestions)
          throw new Error('Session conflicts detected')
        }
        throw new Error(result.error || 'Failed to create session')
      }

      return result.data.session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session'
      setError(errorMessage)
      console.error('Error creating session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSession = useCallback(async (sessionData: SessionUpdateData): Promise<Session> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/weekly-agenda', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409 && result.conflicts) {
          setConflicts(result.conflicts)
          setSuggestions(result.suggestions)
          throw new Error('Session conflicts detected')
        }
        throw new Error(result.error || 'Failed to update session')
      }

      return result.data.session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session'
      setError(errorMessage)
      console.error('Error updating session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist/weekly-agenda?sessionId=${sessionId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete session')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete session'
      setError(errorMessage)
      console.error('Error deleting session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Utility functions
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
      case 'no-show':
        return 'bg-gray-100 text-gray-800 border-gray-200'
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
      case 'no-show':
        return 'AlertCircle'
      default:
        return 'AlertCircle'
    }
  }, [])

  const generateTimeSlots = useCallback((availability?: Availability): string[] => {
    if (!availability) return []
    
    const slots = []
    const startTime = timeToMinutes(availability.startTime)
    const endTime = timeToMinutes(availability.endTime)
    const sessionDuration = availability.sessionDuration
    const bufferTime = availability.bufferTime
    
    for (let time = startTime; time < endTime; time += (sessionDuration + bufferTime)) {
      slots.push(minutesToTime(time))
    }
    
    return slots
  }, [])

  const timeToMinutes = useCallback((timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }, [])

  const minutesToTime = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }, [])

  const getWeekStart = useCallback((date: Date): Date => {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(date.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }, [])

  const getWeekEnd = useCallback((date: Date): Date => {
    const weekStart = getWeekStart(date)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    return weekEnd
  }, [getWeekStart])

  const navigateWeek = useCallback((currentWeekStart: Date, direction: 'prev' | 'next'): Date => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(newWeekStart.getDate() + (direction === 'next' ? 7 : -7))
    return newWeekStart
  }, [])

  const getSessionsForDay = useCallback((date: string): Session[] => {
    return sessions[date] || []
  }, [sessions])

  const getAvailabilityForDay = useCallback((date: string): Availability | undefined => {
    return availability[date]
  }, [availability])

  const isTimeSlotAvailable = useCallback((date: string, time: string, duration: number): boolean => {
    const daySessions = getSessionsForDay(date)
    const sessionStart = timeToMinutes(time)
    const sessionEnd = sessionStart + duration
    
    return !daySessions.some(session => {
      const existingStart = timeToMinutes(session.scheduledTime)
      const existingEnd = existingStart + session.duration
      return sessionStart < existingEnd && sessionEnd > existingStart
    })
  }, [getSessionsForDay, timeToMinutes])

  const getSessionConflicts = useCallback((sessionData: SessionCreateData | SessionUpdateData): any[] => {
    // This would implement conflict detection logic
    // For now, return empty array
    return []
  }, [])

  const calculateSessionEndTime = useCallback((startTime: string, duration: number): string => {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = startMinutes + duration
    return minutesToTime(endMinutes)
  }, [timeToMinutes, minutesToTime])

  const getSessionDuration = useCallback((session: Session): number => {
    return session.duration
  }, [])

  const getSessionRevenue = useCallback((session: Session): number => {
    return session.services.reduce((total, service) => {
      return total + service.price
    }, 0)
  }, [])

  const getTotalRevenueForWeek = useCallback((): number => {
    return Object.values(sessions).flat().reduce((total, session) => {
      return total + getSessionRevenue(session)
    }, 0)
  }, [sessions, getSessionRevenue])

  const getSessionCountForWeek = useCallback((): number => {
    return Object.values(sessions).flat().length
  }, [sessions])

  const getCompletedSessionsCount = useCallback((): number => {
    return Object.values(sessions).flat().filter(session => session.status === 'completed').length
  }, [sessions])

  const getUpcomingSessionsCount = useCallback((): number => {
    const now = new Date()
    return Object.values(sessions).flat().filter(session => {
      const sessionDateTime = new Date(`${session.scheduledDate}T${session.scheduledTime}`)
      return sessionDateTime > now && session.status === 'scheduled'
    }).length
  }, [sessions])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearConflicts = useCallback(() => {
    setConflicts([])
  }, [])

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
  }, [])

  return {
    loading,
    error,
    agendaData,
    therapist,
    weekDays,
    sessions,
    availability,
    conflicts,
    suggestions,
    loadWeeklyAgenda,
    refreshAgenda,
    createSession,
    updateSession,
    deleteSession,
    formatTime,
    getStatusColor,
    getStatusIcon,
    generateTimeSlots,
    timeToMinutes,
    minutesToTime,
    getWeekStart,
    getWeekEnd,
    navigateWeek,
    getSessionsForDay,
    getAvailabilityForDay,
    isTimeSlotAvailable,
    getSessionConflicts,
    calculateSessionEndTime,
    getSessionDuration,
    getSessionRevenue,
    getTotalRevenueForWeek,
    getSessionCountForWeek,
    getCompletedSessionsCount,
    getUpcomingSessionsCount,
    clearError,
    clearConflicts,
    clearSuggestions
  }
}
