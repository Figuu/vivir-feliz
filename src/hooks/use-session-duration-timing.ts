import { useState, useCallback } from 'react'

interface DurationConfig {
  serviceId: string
  defaultDuration: number
  minDuration: number
  maxDuration: number
  allowedDurations: number[]
  breakBetweenSessions: number
  bufferTime: number
  isActive: boolean
}

interface TimingAdjustment {
  sessionId: string
  newDuration: number
  reason?: string
  adjustFollowingSessions?: boolean
}

interface TimeSlotOptimization {
  therapistId: string
  date: string
  serviceIds?: string[]
  optimizeFor: 'EFFICIENCY' | 'PATIENT_COMFORT' | 'THERAPIST_PREFERENCE'
}

interface OptimizedSlot {
  time: string
  duration: number
  serviceId: string
  serviceName: string
  optimizationScore: number
  isOptimal: boolean
}

interface UseSessionDurationTimingReturn {
  loading: boolean
  error: string | null
  getDurationConfigs: (params: {
    serviceId?: string
    therapistId?: string
  }) => Promise<{
    durationConfigs: any[]
    therapistPreferences: any
    defaultSettings: any
  }>
  updateDurationConfig: (config: DurationConfig) => Promise<{
    service: any
    config: DurationConfig
  }>
  adjustSessionTiming: (adjustment: TimingAdjustment) => Promise<{
    updatedSession: any
    adjustedSessions: any[]
    summary: {
      originalDuration: number
      newDuration: number
      durationDifference: number
      followingSessionsAdjusted: number
    }
  }>
  optimizeTimeSlots: (optimization: TimeSlotOptimization) => Promise<{
    therapistSchedule: any
    existingSessions: any[]
    services: any[]
    optimizedSlots: OptimizedSlot[]
    optimizationCriteria: string
    summary: {
      totalAvailableSlots: number
      totalExistingSessions: number
      workingHours: {
        start: string
        end: string
      }
    }
  }>
  clearError: () => void
}

export function useSessionDurationTiming(): UseSessionDurationTimingReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getDurationConfigs = useCallback(async (params: {
    serviceId?: string
    therapistId?: string
  }): Promise<{
    durationConfigs: any[]
    therapistPreferences: any
    defaultSettings: any
  }> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params.serviceId) searchParams.append('serviceId', params.serviceId)
      if (params.therapistId) searchParams.append('therapistId', params.therapistId)

      const response = await fetch(`/api/sessions/duration-timing?${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get duration configurations')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get duration configurations'
      setError(errorMessage)
      console.error('Error getting duration configs:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateDurationConfig = useCallback(async (config: DurationConfig): Promise<{
    service: any
    config: DurationConfig
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/duration-timing?action=config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update duration configuration')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update duration configuration'
      setError(errorMessage)
      console.error('Error updating duration config:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const adjustSessionTiming = useCallback(async (adjustment: TimingAdjustment): Promise<{
    updatedSession: any
    adjustedSessions: any[]
    summary: {
      originalDuration: number
      newDuration: number
      durationDifference: number
      followingSessionsAdjusted: number
    }
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/duration-timing?action=adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adjustment)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to adjust session timing')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust session timing'
      setError(errorMessage)
      console.error('Error adjusting session timing:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const optimizeTimeSlots = useCallback(async (optimization: TimeSlotOptimization): Promise<{
    therapistSchedule: any
    existingSessions: any[]
    services: any[]
    optimizedSlots: OptimizedSlot[]
    optimizationCriteria: string
    summary: {
      totalAvailableSlots: number
      totalExistingSessions: number
      workingHours: {
        start: string
        end: string
      }
    }
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/duration-timing?action=optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(optimization)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to optimize time slots')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize time slots'
      setError(errorMessage)
      console.error('Error optimizing time slots:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    getDurationConfigs,
    updateDurationConfig,
    adjustSessionTiming,
    optimizeTimeSlots,
    clearError
  }
}
