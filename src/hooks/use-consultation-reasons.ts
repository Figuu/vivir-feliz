import { useState, useEffect } from 'react'

interface ConsultationReason {
  id: string
  name: string
  description?: string
  specialty: {
    id: string
    name: string
    description?: string
  }
}

interface Specialty {
  id: string
  name: string
  description?: string
  _count?: {
    consultationReasons: number
    therapists: number
  }
}

interface UseConsultationReasonsReturn {
  consultationReasons: ConsultationReason[]
  specialties: Specialty[]
  loading: boolean
  error: string | null
  fetchReasons: (params?: { specialtyId?: string; search?: string }) => Promise<void>
  fetchSpecialties: (params?: { search?: string }) => Promise<void>
  createReason: (data: { name: string; description?: string; specialtyId: string }) => Promise<ConsultationReason | null>
  createSpecialty: (data: { name: string; description?: string }) => Promise<Specialty | null>
}

export function useConsultationReasons(): UseConsultationReasonsReturn {
  const [consultationReasons, setConsultationReasons] = useState<ConsultationReason[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReasons = async (params?: { specialtyId?: string; search?: string }) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params?.specialtyId) searchParams.append('specialtyId', params.specialtyId)
      if (params?.search) searchParams.append('search', params.search)

      const response = await fetch(`/api/consultation/reasons?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch consultation reasons')
      }

      setConsultationReasons(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch consultation reasons'
      setError(errorMessage)
      console.error('Error fetching consultation reasons:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSpecialties = async (params?: { search?: string }) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params?.search) searchParams.append('search', params.search)

      const response = await fetch(`/api/consultation/specialties?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch specialties')
      }

      setSpecialties(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch specialties'
      setError(errorMessage)
      console.error('Error fetching specialties:', err)
    } finally {
      setLoading(false)
    }
  }

  const createReason = async (data: { name: string; description?: string; specialtyId: string }): Promise<ConsultationReason | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/consultation/reasons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create consultation reason')
      }

      // Refresh the reasons list
      await fetchReasons()
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create consultation reason'
      setError(errorMessage)
      console.error('Error creating consultation reason:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const createSpecialty = async (data: { name: string; description?: string }): Promise<Specialty | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/consultation/specialties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create specialty')
      }

      // Refresh the specialties list
      await fetchSpecialties()
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create specialty'
      setError(errorMessage)
      console.error('Error creating specialty:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Fetch initial data
  useEffect(() => {
    fetchReasons()
    fetchSpecialties()
  }, [])

  return {
    consultationReasons,
    specialties,
    loading,
    error,
    fetchReasons,
    fetchSpecialties,
    createReason,
    createSpecialty,
  }
}
