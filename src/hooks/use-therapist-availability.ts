import { useState, useCallback, useEffect } from 'react'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface AvailabilityDay {
  date: string
  dayOfWeek: string
  isWorkingDay: boolean
  startTime: string | null
  endTime: string | null
  breakStartTime: string | null
  breakEndTime: string | null
  maxSessions: number
  sessionDuration: number
  bufferTime: number
  scheduledSessions: number
  availableSlots: number
  conflicts?: Array<{
    type: string
    sessionId?: string
    sessionIds?: string[]
    message: string
  }>
}

interface Session {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: string
  patient: {
    id: string
    firstName: string
    lastName: string
  }
}

interface AvailabilityCheck {
  available: boolean
  reason: string
  conflicts: Array<{
    sessionId: string
    scheduledTime: string
    duration: number
  }>
  suggestions: string[]
  schedule: {
    startTime: string
    endTime: string
    breakStartTime: string | null
    breakEndTime: string | null
    isWorkingDay: boolean
  } | null
}

interface AvailabilityUpdateData {
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
  reason?: string
  breakStartTime?: string
  breakEndTime?: string
  maxSessions?: number
  sessionDuration?: number
  bufferTime?: number
}

interface UseTherapistAvailabilityReturn {
  loading: boolean
  error: string | null
  
  // Data
  therapist: Therapist | null
  availability: AvailabilityDay[]
  sessions: Session[]
  dateRange: { start: string; end: string }
  
  // Availability check
  availabilityResult: AvailabilityCheck | null
  
  // Operations
  loadAvailabilityData: (therapistId: string, startDate?: string, endDate?: string) => Promise<void>
  checkAvailability: (therapistId: string, date: string, startTime: string, endTime: string, duration?: number) => Promise<AvailabilityCheck>
  updateAvailability: (therapistId: string, data: AvailabilityUpdateData) => Promise<void>
  
  // State management
  setDateRange: (range: { start: string; end: string }) => void
  setAvailabilityResult: (result: AvailabilityCheck | null) => void
  clearError: () => void
  
  // Utility functions
  formatDate: (dateString: string) => string
  formatTime: (timeString: string) => string
  getStatusColor: (isWorkingDay: boolean, hasConflicts: boolean) => string
  getStatusIcon: (isWorkingDay: boolean, hasConflicts: boolean) => string
  getUtilizationPercentage: (day: AvailabilityDay) => number
  getAvailableSlots: (day: AvailabilityDay) => number
  getConflictsCount: (day: AvailabilityDay) => number
  isWorkingDay: (date: string) => boolean
  getWorkingHours: (date: string) => { start: string; end: string } | null
  getBreakTime: (date: string) => { start: string; end: string } | null
  canScheduleSession: (date: string, startTime: string, duration: number) => boolean
  getNextAvailableSlot: (date: string, preferredTime?: string) => string | null
  getAvailabilitySummary: () => {
    totalDays: number
    workingDays: number
    totalSessions: number
    totalConflicts: number
    averageUtilization: number
  }
}

export function useTherapistAvailability(): UseTherapistAvailabilityReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [availability, setAvailability] = useState<AvailabilityDay[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityCheck | null>(null)

  const loadAvailabilityData = useCallback(async (
    therapistId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('therapistId', therapistId)
      params.append('startDate', startDate || dateRange.start)
      params.append('endDate', endDate || dateRange.end)
      params.append('includeConflicts', 'true')
      params.append('includeSessions', 'true')

      const response = await fetch(`/api/therapist/availability?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load availability data')
      }

      setTherapist(result.data.therapist)
      setAvailability(result.data.availability)
      setSessions(result.data.sessions || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load availability data'
      setError(errorMessage)
      console.error('Error loading availability data:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  const checkAvailability = useCallback(async (
    therapistId: string,
    date: string,
    startTime: string,
    endTime: string,
    duration: number = 60
  ): Promise<AvailabilityCheck> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId,
          date,
          startTime,
          endTime,
          duration
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check availability')
      }

      const checkResult = result.data
      setAvailabilityResult(checkResult)
      return checkResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability'
      setError(errorMessage)
      console.error('Error checking availability:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateAvailability = useCallback(async (
    therapistId: string,
    data: AvailabilityUpdateData
  ): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId,
          ...data
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update availability')
      }

      // Reload availability data to reflect changes
      await loadAvailabilityData(therapistId)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update availability'
      setError(errorMessage)
      console.error('Error updating availability:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [loadAvailabilityData])

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

  const getStatusColor = useCallback((isWorkingDay: boolean, hasConflicts: boolean): string => {
    if (!isWorkingDay) return 'bg-gray-100 text-gray-800'
    if (hasConflicts) return 'bg-red-100 text-red-800'
    return 'bg-green-100 text-green-800'
  }, [])

  const getStatusIcon = useCallback((isWorkingDay: boolean, hasConflicts: boolean): string => {
    if (!isWorkingDay) return 'XCircle'
    if (hasConflicts) return 'AlertCircle'
    return 'CheckCircle'
  }, [])

  const getUtilizationPercentage = useCallback((day: AvailabilityDay): number => {
    if (day.maxSessions === 0) return 0
    return Math.round((day.scheduledSessions / day.maxSessions) * 100)
  }, [])

  const getAvailableSlots = useCallback((day: AvailabilityDay): number => {
    return Math.max(0, day.maxSessions - day.scheduledSessions)
  }, [])

  const getConflictsCount = useCallback((day: AvailabilityDay): number => {
    return day.conflicts?.length || 0
  }, [])

  const isWorkingDay = useCallback((date: string): boolean => {
    const day = availability.find(d => d.date === date)
    return day?.isWorkingDay || false
  }, [availability])

  const getWorkingHours = useCallback((date: string): { start: string; end: string } | null => {
    const day = availability.find(d => d.date === date)
    if (!day || !day.isWorkingDay || !day.startTime || !day.endTime) return null
    return { start: day.startTime, end: day.endTime }
  }, [availability])

  const getBreakTime = useCallback((date: string): { start: string; end: string } | null => {
    const day = availability.find(d => d.date === date)
    if (!day || !day.breakStartTime || !day.breakEndTime) return null
    return { start: day.breakStartTime, end: day.breakEndTime }
  }, [availability])

  const canScheduleSession = useCallback((date: string, startTime: string, duration: number): boolean => {
    const day = availability.find(d => d.date === date)
    if (!day || !day.isWorkingDay) return false
    
    const workingHours = getWorkingHours(date)
    if (!workingHours) return false
    
    const sessionStart = timeToMinutes(startTime)
    const sessionEnd = sessionStart + duration
    const workStart = timeToMinutes(workingHours.start)
    const workEnd = timeToMinutes(workingHours.end)
    
    if (sessionStart < workStart || sessionEnd > workEnd) return false
    
    const breakTime = getBreakTime(date)
    if (breakTime) {
      const breakStart = timeToMinutes(breakTime.start)
      const breakEnd = timeToMinutes(breakTime.end)
      if (sessionStart < breakEnd && sessionEnd > breakStart) return false
    }
    
    return true
  }, [availability, getWorkingHours, getBreakTime])

  const getNextAvailableSlot = useCallback((date: string, preferredTime?: string): string | null => {
    const day = availability.find(d => d.date === date)
    if (!day || !day.isWorkingDay || !day.startTime || !day.endTime) return null
    
    const workingHours = getWorkingHours(date)
    if (!workingHours) return null
    
    const breakTime = getBreakTime(date)
    const sessionDuration = day.sessionDuration
    const bufferTime = day.bufferTime
    
    let currentTime = preferredTime ? timeToMinutes(preferredTime) : timeToMinutes(workingHours.start)
    const workStart = timeToMinutes(workingHours.start)
    const workEnd = timeToMinutes(workingHours.end)
    
    while (currentTime + sessionDuration <= workEnd) {
      const slotEndTime = currentTime + sessionDuration
      
      // Check if slot conflicts with break time
      if (breakTime) {
        const breakStart = timeToMinutes(breakTime.start)
        const breakEnd = timeToMinutes(breakTime.end)
        if (currentTime < breakEnd && slotEndTime > breakStart) {
          currentTime = breakEnd
          continue
        }
      }
      
      // Check if slot conflicts with existing sessions
      const daySessions = sessions.filter(s => s.scheduledDate === date)
      const hasConflict = daySessions.some(session => {
        const sessionStart = timeToMinutes(session.scheduledTime)
        const sessionEnd = sessionStart + session.duration
        return currentTime < sessionEnd && slotEndTime > sessionStart
      })
      
      if (!hasConflict) {
        return minutesToTime(currentTime)
      }
      
      currentTime += sessionDuration + bufferTime
    }
    
    return null
  }, [availability, sessions, getWorkingHours, getBreakTime])

  const getAvailabilitySummary = useCallback(() => {
    const totalDays = availability.length
    const workingDays = availability.filter(day => day.isWorkingDay).length
    const totalSessions = availability.reduce((total, day) => total + day.scheduledSessions, 0)
    const totalConflicts = availability.reduce((total, day) => total + (day.conflicts?.length || 0), 0)
    const averageUtilization = workingDays > 0 
      ? Math.round(availability
          .filter(day => day.isWorkingDay)
          .reduce((total, day) => total + getUtilizationPercentage(day), 0) / workingDays)
      : 0

    return {
      totalDays,
      workingDays,
      totalSessions,
      totalConflicts,
      averageUtilization
    }
  }, [availability, getUtilizationPercentage])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Helper functions
  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  return {
    loading,
    error,
    therapist,
    availability,
    sessions,
    dateRange,
    availabilityResult,
    loadAvailabilityData,
    checkAvailability,
    updateAvailability,
    setDateRange,
    setAvailabilityResult,
    clearError,
    formatDate,
    formatTime,
    getStatusColor,
    getStatusIcon,
    getUtilizationPercentage,
    getAvailableSlots,
    getConflictsCount,
    isWorkingDay,
    getWorkingHours,
    getBreakTime,
    canScheduleSession,
    getNextAvailableSlot,
    getAvailabilitySummary
  }
}
