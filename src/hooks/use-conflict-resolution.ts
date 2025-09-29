import { useState, useCallback } from 'react'
import { ConflictResolutionService, AvailabilityCheck, Conflict, TimeSlotSuggestion } from '@/lib/conflict-resolution'

interface UseConflictResolutionReturn {
  checking: boolean
  error: string | null
  checkAvailability: (request: {
    therapistId: string
    date: Date
    startTime: string
    endTime: string
    duration: number
    excludeSessionId?: string
  }) => Promise<AvailabilityCheck>
  checkBulkAvailability: (request: {
    therapistId: string
    date: Date
    timeSlots: Array<{
      startTime: string
      endTime: string
      duration: number
    }>
    excludeSessionIds?: string[]
  }) => Promise<{ [key: string]: AvailabilityCheck }>
  resolveConflicts: (request: {
    therapistId: string
    date: Date
    duration: number
    preferences?: {
      preferredTime?: string
      maxTimeShift?: number
      allowDifferentDay?: boolean
    }
  }) => Promise<{
    resolved: boolean
    suggestedTime?: string
    suggestedDate?: Date
    reason?: string
  }>
  clearError: () => void
}

export function useConflictResolution(): UseConflictResolutionReturn {
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAvailability = useCallback(async (request: {
    therapistId: string
    date: Date
    startTime: string
    endTime: string
    duration: number
    excludeSessionId?: string
  }): Promise<AvailabilityCheck> => {
    try {
      setChecking(true)
      setError(null)

      const result = await ConflictResolutionService.checkAvailability(request)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability'
      setError(errorMessage)
      console.error('Error checking availability:', err)
      throw err
    } finally {
      setChecking(false)
    }
  }, [])

  const checkBulkAvailability = useCallback(async (request: {
    therapistId: string
    date: Date
    timeSlots: Array<{
      startTime: string
      endTime: string
      duration: number
    }>
    excludeSessionIds?: string[]
  }): Promise<{ [key: string]: AvailabilityCheck }> => {
    try {
      setChecking(true)
      setError(null)

      const result = await ConflictResolutionService.checkBulkAvailability(request)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check bulk availability'
      setError(errorMessage)
      console.error('Error checking bulk availability:', err)
      throw err
    } finally {
      setChecking(false)
    }
  }, [])

  const resolveConflicts = useCallback(async (request: {
    therapistId: string
    date: Date
    duration: number
    preferences?: {
      preferredTime?: string
      maxTimeShift?: number
      allowDifferentDay?: boolean
    }
  }): Promise<{
    resolved: boolean
    suggestedTime?: string
    suggestedDate?: Date
    reason?: string
  }> => {
    try {
      setChecking(true)
      setError(null)

      const result = await ConflictResolutionService.resolveConflicts(
        request.therapistId,
        request.date,
        request.duration,
        request.preferences
      )
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve conflicts'
      setError(errorMessage)
      console.error('Error resolving conflicts:', err)
      throw err
    } finally {
      setChecking(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    checking,
    error,
    checkAvailability,
    checkBulkAvailability,
    resolveConflicts,
    clearError
  }
}
