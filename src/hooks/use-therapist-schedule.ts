import { useState, useEffect, useCallback } from 'react'

interface ScheduleEntry {
  id?: string
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  startTime: string
  endTime: string
  breakStart?: string
  breakEnd?: string
  breakBetweenSessions: number
  isActive: boolean
}

interface Therapist {
  id: string
  name: string
  isActive: boolean
}

interface ScheduleData {
  therapist: Therapist
  schedules: ScheduleEntry[]
}

interface UseTherapistScheduleReturn {
  scheduleData: ScheduleData | null
  loading: boolean
  error: string | null
  hasChanges: boolean
  loadSchedules: (therapistId: string) => Promise<void>
  saveSchedules: (therapistId: string, schedules: ScheduleEntry[]) => Promise<void>
  updateSchedule: (scheduleId: string, updates: Partial<ScheduleEntry>) => Promise<void>
  deleteSchedule: (scheduleId: string) => Promise<void>
  setHasChanges: (hasChanges: boolean) => void
  refreshSchedules: () => Promise<void>
}

export function useTherapistSchedule(): UseTherapistScheduleReturn {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [currentTherapistId, setCurrentTherapistId] = useState<string | null>(null)

  const loadSchedules = useCallback(async (therapistId: string) => {
    try {
      setLoading(true)
      setError(null)
      setCurrentTherapistId(therapistId)

      const response = await fetch(`/api/therapist/schedule?therapistId=${therapistId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load schedules')
      }

      setScheduleData(result)
      setHasChanges(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schedules'
      setError(errorMessage)
      console.error('Error loading schedules:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveSchedules = useCallback(async (therapistId: string, schedules: ScheduleEntry[]) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId,
          schedules: schedules.filter(s => s.isActive)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save schedules')
      }

      setScheduleData(prev => prev ? { ...prev, schedules: result.schedules } : null)
      setHasChanges(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save schedules'
      setError(errorMessage)
      console.error('Error saving schedules:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSchedule = useCallback(async (scheduleId: string, updates: Partial<ScheduleEntry>) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist/schedule?id=${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update schedule')
      }

      // Update local state
      setScheduleData(prev => {
        if (!prev) return null
        return {
          ...prev,
          schedules: prev.schedules.map(schedule => 
            schedule.id === scheduleId ? { ...schedule, ...updates } : schedule
          )
        }
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule'
      setError(errorMessage)
      console.error('Error updating schedule:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSchedule = useCallback(async (scheduleId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist/schedule?id=${scheduleId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete schedule')
      }

      // Update local state
      setScheduleData(prev => {
        if (!prev) return null
        return {
          ...prev,
          schedules: prev.schedules.filter(schedule => schedule.id !== scheduleId)
        }
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule'
      setError(errorMessage)
      console.error('Error deleting schedule:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshSchedules = useCallback(async () => {
    if (currentTherapistId) {
      await loadSchedules(currentTherapistId)
    }
  }, [currentTherapistId, loadSchedules])

  return {
    scheduleData,
    loading,
    error,
    hasChanges,
    loadSchedules,
    saveSchedules,
    updateSchedule,
    deleteSchedule,
    setHasChanges,
    refreshSchedules
  }
}

