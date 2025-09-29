import { useState, useCallback } from 'react'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface ScheduleConfig {
  id: string
  therapistId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  isWorkingDay: boolean
  breakStartTime?: string
  breakEndTime?: string
  maxSessionsPerDay: number
  sessionDuration: number
  bufferTime: number
  isRecurring: boolean
  effectiveDate: string
  endDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
  therapist: Therapist
}

interface ScheduleConfigQuery {
  therapistId?: string
  dayOfWeek?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  isWorkingDay?: boolean
  isRecurring?: boolean
  effectiveDate?: string
  endDate?: string
  page?: number
  limit?: number
  sortBy?: 'dayOfWeek' | 'startTime' | 'effectiveDate' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

interface ScheduleConfigData {
  therapistId: string
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  startTime: string
  endTime: string
  isWorkingDay: boolean
  breakStartTime?: string
  breakEndTime?: string
  maxSessionsPerDay: number
  sessionDuration: number
  bufferTime: number
  isRecurring: boolean
  effectiveDate: string
  endDate?: string
  notes?: string
}

interface ConflictInfo {
  hasConflicts: boolean
  conflicts: Array<{
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
    effectiveDate: string
    endDate?: string
    conflictType: string
  }>
  suggestions: Array<{
    type: string
    message: string
    action: string
  }>
}

interface UseScheduleConfigurationReturn {
  loading: boolean
  error: string | null
  
  // Data
  scheduleConfigs: ScheduleConfig[]
  therapists: Therapist[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  
  // CRUD operations
  getScheduleConfigs: (query?: ScheduleConfigQuery) => Promise<{
    scheduleConfigs: ScheduleConfig[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }>
  
  createScheduleConfig: (data: ScheduleConfigData) => Promise<{
    scheduleConfig: ScheduleConfig
    conflicts?: ConflictInfo
  }>
  
  updateScheduleConfig: (id: string, data: Partial<ScheduleConfigData>) => Promise<{
    scheduleConfig: ScheduleConfig
    conflicts?: ConflictInfo
  }>
  
  deleteScheduleConfig: (id: string) => Promise<void>
  
  // Utility functions
  validateTimeFormat: (time: string) => boolean
  validateTimeLogic: (startTime: string, endTime: string, breakStartTime?: string, breakEndTime?: string) => {
    isValid: boolean
    error?: string
  }
  formatTime: (timeString: string) => string
  generateTimeSlots: () => Array<{ value: string; label: string }>
  getDayOfWeekOptions: () => Array<{ value: string; label: string }>
  calculateWorkingHours: (startTime: string, endTime: string, breakStartTime?: string, breakEndTime?: string) => number
  checkScheduleConflicts: (data: ScheduleConfigData, excludeId?: string) => Promise<ConflictInfo>
  
  // State management
  clearError: () => void
}

export function useScheduleConfiguration(): UseScheduleConfigurationReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scheduleConfigs, setScheduleConfigs] = useState<ScheduleConfig[]>([])
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // CRUD operations
  const getScheduleConfigs = useCallback(async (query: ScheduleConfigQuery = {}): Promise<{
    scheduleConfigs: ScheduleConfig[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('page', (query.page || 1).toString())
      params.append('limit', (query.limit || 10).toString())
      params.append('sortBy', query.sortBy || 'dayOfWeek')
      params.append('sortOrder', query.sortOrder || 'asc')
      if (query.therapistId) params.append('therapistId', query.therapistId)
      if (query.dayOfWeek) params.append('dayOfWeek', query.dayOfWeek)
      if (query.isWorkingDay !== undefined) params.append('isWorkingDay', query.isWorkingDay.toString())
      if (query.isRecurring !== undefined) params.append('isRecurring', query.isRecurring.toString())
      if (query.effectiveDate) params.append('effectiveDate', query.effectiveDate)
      if (query.endDate) params.append('endDate', query.endDate)

      const response = await fetch(`/api/therapist/schedule-config?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get schedule configurations')
      }

      setScheduleConfigs(result.data.scheduleConfigs)
      setPagination(result.data.pagination)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get schedule configurations'
      setError(errorMessage)
      console.error('Error getting schedule configurations:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createScheduleConfig = useCallback(async (data: ScheduleConfigData): Promise<{
    scheduleConfig: ScheduleConfig
    conflicts?: ConflictInfo
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/schedule-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409 && result.conflicts) {
          return {
            scheduleConfig: {} as ScheduleConfig,
            conflicts: {
              hasConflicts: true,
              conflicts: result.conflicts,
              suggestions: result.suggestions
            }
          }
        }
        throw new Error(result.error || 'Failed to create schedule configuration')
      }

      // Update local state
      setScheduleConfigs(prev => [result.data.scheduleConfig, ...prev])
      return { scheduleConfig: result.data.scheduleConfig }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create schedule configuration'
      setError(errorMessage)
      console.error('Error creating schedule configuration:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateScheduleConfig = useCallback(async (id: string, data: Partial<ScheduleConfigData>): Promise<{
    scheduleConfig: ScheduleConfig
    conflicts?: ConflictInfo
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/schedule-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data })
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409 && result.conflicts) {
          return {
            scheduleConfig: {} as ScheduleConfig,
            conflicts: {
              hasConflicts: true,
              conflicts: result.conflicts,
              suggestions: result.suggestions
            }
          }
        }
        throw new Error(result.error || 'Failed to update schedule configuration')
      }

      // Update local state
      setScheduleConfigs(prev => prev.map(s => 
        s.id === id ? result.data.scheduleConfig : s
      ))
      return { scheduleConfig: result.data.scheduleConfig }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule configuration'
      setError(errorMessage)
      console.error('Error updating schedule configuration:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteScheduleConfig = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist/schedule-config?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete schedule configuration')
      }

      // Update local state
      setScheduleConfigs(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule configuration'
      setError(errorMessage)
      console.error('Error deleting schedule configuration:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Utility functions
  const validateTimeFormat = useCallback((time: string): boolean => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)
  }, [])

  const validateTimeLogic = useCallback((startTime: string, endTime: string, breakStartTime?: string, breakEndTime?: string): {
    isValid: boolean
    error?: string
  } => {
    // Convert time strings to minutes for easier comparison
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const breakStartMinutes = breakStartTime ? timeToMinutes(breakStartTime) : null
    const breakEndMinutes = breakEndTime ? timeToMinutes(breakEndTime) : null

    // Check if start time is before end time
    if (startMinutes >= endMinutes) {
      return { isValid: false, error: 'Start time must be before end time' }
    }

    // Check if break times are provided together
    if ((breakStartTime && !breakEndTime) || (!breakStartTime && breakEndTime)) {
      return { isValid: false, error: 'Both break start and end times must be provided' }
    }

    // Check if break time is within working hours
    if (breakStartMinutes && breakEndMinutes) {
      if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
        return { isValid: false, error: 'Break time must be within working hours' }
      }

      if (breakStartMinutes >= breakEndMinutes) {
        return { isValid: false, error: 'Break start time must be before break end time' }
      }
    }

    return { isValid: true }
  }, [])

  const formatTime = useCallback((timeString: string): string => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }, [])

  const generateTimeSlots = useCallback((): Array<{ value: string; label: string }> => {
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayTime = formatTime(timeString)
        slots.push({ value: timeString, label: displayTime })
      }
    }
    return slots
  }, [formatTime])

  const getDayOfWeekOptions = useCallback((): Array<{ value: string; label: string }> => {
    return [
      { value: 'monday', label: 'Monday' },
      { value: 'tuesday', label: 'Tuesday' },
      { value: 'wednesday', label: 'Wednesday' },
      { value: 'thursday', label: 'Thursday' },
      { value: 'friday', label: 'Friday' },
      { value: 'saturday', label: 'Saturday' },
      { value: 'sunday', label: 'Sunday' }
    ]
  }, [])

  const calculateWorkingHours = useCallback((startTime: string, endTime: string, breakStartTime?: string, breakEndTime?: string): number => {
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    let totalMinutes = endMinutes - startMinutes

    if (breakStartTime && breakEndTime) {
      const breakStartMinutes = timeToMinutes(breakStartTime)
      const breakEndMinutes = timeToMinutes(breakEndTime)
      const breakMinutes = breakEndMinutes - breakStartMinutes
      totalMinutes -= breakMinutes
    }

    return Math.round(totalMinutes / 60 * 100) / 100 // Round to 2 decimal places
  }, [])

  const checkScheduleConflicts = useCallback(async (data: ScheduleConfigData, excludeId?: string): Promise<ConflictInfo> => {
    try {
      const params = new URLSearchParams()
      params.append('therapistId', data.therapistId)
      params.append('dayOfWeek', data.dayOfWeek)
      params.append('effectiveDate', data.effectiveDate)
      if (data.endDate) params.append('endDate', data.endDate)
      if (excludeId) params.append('excludeId', excludeId)

      const response = await fetch(`/api/therapist/schedule-config/conflicts?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check schedule conflicts')
      }

      return result.data
    } catch (err) {
      console.error('Error checking schedule conflicts:', err)
      return {
        hasConflicts: false,
        conflicts: [],
        suggestions: []
      }
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Helper function to convert time string to minutes
  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  return {
    loading,
    error,
    scheduleConfigs,
    therapists,
    pagination,
    getScheduleConfigs,
    createScheduleConfig,
    updateScheduleConfig,
    deleteScheduleConfig,
    validateTimeFormat,
    validateTimeLogic,
    formatTime,
    generateTimeSlots,
    getDayOfWeekOptions,
    calculateWorkingHours,
    checkScheduleConflicts,
    clearError
  }
}
