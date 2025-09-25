import { useState, useCallback } from 'react'

export interface ConsultationRequest {
  id: string
  consultationType: 'CONSULTATION' | 'INTERVIEW'
  specialtyId: string
  consultationReasonId: string
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  preferredDate: string
  preferredTime: string
  scheduledDate?: string
  scheduledTime?: string
  duration: number
  additionalNotes?: string
  previousTherapy: boolean
  previousTherapyDetails?: string
  hasInsurance: boolean
  insuranceProvider?: string
  insurancePolicyNumber?: string
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string
  cancellationReason?: string
  patientId: string
  parentId: string
  therapistId?: string
  createdAt: string
  updatedAt: string
  patient?: {
    id: string
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
  }
  parent?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  therapist?: {
    id: string
    firstName: string
    lastName: string
    user?: {
      name: string
    }
  }
  specialty?: {
    id: string
    name: string
    description?: string
  }
  consultationReason?: {
    id: string
    name: string
    description?: string
  }
}

export interface CreateConsultationRequestData {
  // Patient information
  patientFirstName: string
  patientLastName: string
  patientDateOfBirth: string
  patientGender: 'MALE' | 'FEMALE' | 'OTHER'
  
  // Parent/Guardian information
  parentFirstName: string
  parentLastName: string
  parentEmail: string
  parentPhone: string
  parentRelationship: 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER'
  
  // Address information
  address: string
  city: string
  state: string
  zipCode: string
  
  // Consultation details
  consultationType: 'CONSULTATION' | 'INTERVIEW'
  specialtyId: string
  consultationReasonId: string
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  
  // Scheduling
  preferredDate: string
  preferredTime: string
  duration?: number
  
  // Additional information
  additionalNotes?: string
  previousTherapy?: boolean
  previousTherapyDetails?: string
  
  // Assignment preferences
  preferredTherapistId?: string
  excludeTherapistIds?: string[]
  
  // Insurance information
  hasInsurance?: boolean
  insuranceProvider?: string
  insurancePolicyNumber?: string
  
  // Emergency contact
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
}

export interface UpdateConsultationRequestData {
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  scheduledDate?: string
  scheduledTime?: string
  therapistId?: string
  duration?: number
  notes?: string
  cancellationReason?: string
  additionalNotes?: string
  previousTherapyDetails?: string
  insuranceProvider?: string
  insurancePolicyNumber?: string
}

export interface ConsultationRequestFilters {
  status?: string
  specialtyId?: string
  therapistId?: string
  consultationType?: string
  urgency?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ConsultationRequestStatistics {
  summary: {
    totalRequests: number
    dateRange: { startDate: string; endDate: string }
    averageDuration: number
    completionRate: number
    cancellationRate: number
    noShowRate: number
  }
  statusBreakdown: Array<{ status: string; count: number }>
  consultationTypeBreakdown: Array<{ consultationType: string; count: number }>
  urgencyBreakdown: Array<{ urgency: string; count: number }>
  specialtyBreakdown: Array<{ specialtyId: string; specialtyName: string; count: number; averageDuration: number }>
  therapistBreakdown: Array<{ therapistId: string; therapistName: string; count: number; averageDuration: number }>
  dailyTrends: Array<{ date: string; count: number }>
  monthlyTrends: Array<{ month: string; count: number }>
}

export interface UseConsultationRequestsReturn {
  // CRUD operations
  createConsultationRequest: (data: CreateConsultationRequestData) => Promise<ConsultationRequest>
  getConsultationRequest: (id: string) => Promise<ConsultationRequest>
  updateConsultationRequest: (id: string, data: UpdateConsultationRequestData) => Promise<ConsultationRequest>
  cancelConsultationRequest: (id: string, reason?: string) => Promise<ConsultationRequest>
  
  // List operations
  getConsultationRequests: (filters?: ConsultationRequestFilters) => Promise<{
    consultationRequests: ConsultationRequest[]
    pagination: {
      page: number
      limit: number
      totalCount: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }>
  
  // Statistics
  getConsultationRequestStatistics: (startDate: string, endDate: string, specialtyId?: string, therapistId?: string) => Promise<ConsultationRequestStatistics>
  
  // State
  loading: boolean
  error: string | null
}

export function useConsultationRequests(): UseConsultationRequestsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createConsultationRequest = useCallback(async (data: CreateConsultationRequestData): Promise<ConsultationRequest> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/consultation/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create consultation request')
      }

      return result.data.consultationRequest
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create consultation request'
      setError(errorMessage)
      console.error('Error creating consultation request:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getConsultationRequest = useCallback(async (id: string): Promise<ConsultationRequest> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/consultation/requests/${id}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch consultation request')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch consultation request'
      setError(errorMessage)
      console.error('Error fetching consultation request:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateConsultationRequest = useCallback(async (id: string, data: UpdateConsultationRequestData): Promise<ConsultationRequest> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/consultation/requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update consultation request')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update consultation request'
      setError(errorMessage)
      console.error('Error updating consultation request:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelConsultationRequest = useCallback(async (id: string, reason?: string): Promise<ConsultationRequest> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/consultation/requests/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cancellationReason: reason }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel consultation request')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel consultation request'
      setError(errorMessage)
      console.error('Error cancelling consultation request:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getConsultationRequests = useCallback(async (filters?: ConsultationRequestFilters) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value.toString())
          }
        })
      }

      const response = await fetch(`/api/consultation/requests?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch consultation requests')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch consultation requests'
      setError(errorMessage)
      console.error('Error fetching consultation requests:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getConsultationRequestStatistics = useCallback(async (
    startDate: string, 
    endDate: string, 
    specialtyId?: string, 
    therapistId?: string
  ): Promise<ConsultationRequestStatistics> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      searchParams.append('startDate', startDate)
      searchParams.append('endDate', endDate)
      if (specialtyId) searchParams.append('specialtyId', specialtyId)
      if (therapistId) searchParams.append('therapistId', therapistId)

      const response = await fetch(`/api/consultation/requests/statistics?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch consultation request statistics')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch consultation request statistics'
      setError(errorMessage)
      console.error('Error fetching consultation request statistics:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createConsultationRequest,
    getConsultationRequest,
    updateConsultationRequest,
    cancelConsultationRequest,
    getConsultationRequests,
    getConsultationRequestStatistics,
    loading,
    error,
  }
}
