import { useState, useEffect } from 'react'

interface TimeSlot {
  time: string
  therapistId: string
  therapistName: string
  available: boolean
  specialties: string[]
}

interface AvailabilityData {
  month: string
  availability: { [date: string]: TimeSlot[] }
  totalSchedules: number
  totalAppointments: number
}

interface UseAvailabilityReturn {
  availability: AvailabilityData | null
  loading: boolean
  error: string | null
  fetchAvailability: (params: {
    month: string
    specialtyId?: string
    therapistId?: string
  }) => Promise<void>
  getAvailableSlotsForDate: (date: string) => TimeSlot[]
  getAvailableDates: () => string[]
  isDateAvailable: (date: string) => boolean
}

export function useAvailability(): UseAvailabilityReturn {
  const [availability, setAvailability] = useState<AvailabilityData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailability = async (params: {
    month: string
    specialtyId?: string
    therapistId?: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      searchParams.append('month', params.month)
      if (params.specialtyId) searchParams.append('specialtyId', params.specialtyId)
      if (params.therapistId) searchParams.append('therapistId', params.therapistId)

      const response = await fetch(`/api/consultation/availability?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch availability')
      }

      setAvailability(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch availability'
      setError(errorMessage)
      console.error('Error fetching availability:', err)
    } finally {
      setLoading(false)
    }
  }

  const getAvailableSlotsForDate = (date: string): TimeSlot[] => {
    if (!availability) return []
    return availability.availability[date] || []
  }

  const getAvailableDates = (): string[] => {
    if (!availability) return []
    return Object.keys(availability.availability).filter(date => {
      const slots = availability.availability[date]
      return slots && slots.some(slot => slot.available)
    })
  }

  const isDateAvailable = (date: string): boolean => {
    if (!availability) return false
    const slots = availability.availability[date]
    return slots && slots.some(slot => slot.available)
  }

  return {
    availability,
    loading,
    error,
    fetchAvailability,
    getAvailableSlotsForDate,
    getAvailableDates,
    isDateAvailable,
  }
}
