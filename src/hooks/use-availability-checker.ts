import { useState, useCallback } from 'react'

export interface AvailabilityCheckParams {
  therapistId?: string
  specialtyId?: string
  date: string
  time: string
  duration: number
  excludeAppointmentId?: string
}

export interface AvailabilityResult {
  isAvailable: boolean
  reason?: string
  therapistId?: string
  therapistName?: string
  conflictingAppointment?: {
    id: string
    scheduledTime: string
    duration: number
    patientName: string
  }
  alternativeSlots?: {
    time: string
    therapistId: string
    therapistName: string
  }[]
}

export interface TherapistAvailability {
  therapistId: string
  therapistName: string
  specialties: string[]
  isAvailable: boolean
  reason?: string
  nextAvailableSlot?: string
}

export interface UseAvailabilityCheckerReturn {
  checkAvailability: (params: AvailabilityCheckParams) => Promise<AvailabilityResult>
  getTherapistAvailability: (date: string, specialtyId?: string) => Promise<TherapistAvailability[]>
  loading: boolean
  error: string | null
}

export function useAvailabilityChecker(): UseAvailabilityCheckerReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAvailability = useCallback(async (params: AvailabilityCheckParams): Promise<AvailabilityResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/consultation/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to check availability')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability'
      setError(errorMessage)
      console.error('Error checking availability:', err)
      
      // Return a default unavailable result
      return {
        isAvailable: false,
        reason: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const getTherapistAvailability = useCallback(async (
    date: string, 
    specialtyId?: string
  ): Promise<TherapistAvailability[]> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      searchParams.append('date', date)
      if (specialtyId) searchParams.append('specialtyId', specialtyId)

      const response = await fetch(`/api/consultation/check-availability?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get therapist availability')
      }

      return result.data.therapists
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get therapist availability'
      setError(errorMessage)
      console.error('Error getting therapist availability:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    checkAvailability,
    getTherapistAvailability,
    loading,
    error,
  }
}
