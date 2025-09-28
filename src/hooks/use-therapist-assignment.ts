import { useState, useCallback } from 'react'

export interface AssignmentCriteria {
  specialtyId: string
  date: string
  time: string
  duration: number
  patientAge?: number
  patientGender?: string
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  preferredTherapistId?: string
  excludeTherapistIds?: string[]
  maxWorkload?: number
}

export interface TherapistScore {
  therapistId: string
  therapistName: string
  score: number
  reasons: string[]
  specialties: string[]
  currentWorkload: number
  maxWorkload: number
  availability: boolean
  experience: number
  rating?: number
  lastAssigned?: Date
  distance?: number
}

export interface AssignmentResult {
  assignedTherapist?: {
    therapistId: string
    therapistName: string
    specialties: string[]
    score: number
    reasons: string[]
  }
  alternativeTherapists: TherapistScore[]
  assignmentStrategy: string
  totalCandidates: number
  assignmentTime: Date
}

export interface AssignmentStatistics {
  totalAssignments: number
  therapistWorkload: { [therapistId: string]: number }
  averageAssignmentsPerDay: number
  mostAssignedTherapist: {
    therapistId: string
    count: number
  } | null
  leastAssignedTherapist: {
    therapistId: string
    count: number
  } | null
}

export interface UseTherapistAssignmentReturn {
  assignTherapist: (criteria: AssignmentCriteria) => Promise<AssignmentResult>
  getAssignmentStatistics: (startDate: string, endDate: string) => Promise<AssignmentStatistics>
  loading: boolean
  error: string | null
}

export function useTherapistAssignment(): UseTherapistAssignmentReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assignTherapist = useCallback(async (criteria: AssignmentCriteria): Promise<AssignmentResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/consultation/assign-therapist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(criteria),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to assign therapist')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign therapist'
      setError(errorMessage)
      console.error('Error assigning therapist:', err)
      
      // Return a default result
      return {
        alternativeTherapists: [],
        assignmentStrategy: 'Assignment failed',
        totalCandidates: 0,
        assignmentTime: new Date()
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const getAssignmentStatistics = useCallback(async (
    startDate: string, 
    endDate: string
  ): Promise<AssignmentStatistics> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      searchParams.append('startDate', startDate)
      searchParams.append('endDate', endDate)

      const response = await fetch(`/api/consultation/assign-therapist?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get assignment statistics')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get assignment statistics'
      setError(errorMessage)
      console.error('Error getting assignment statistics:', err)
      
      // Return default statistics
      return {
        totalAssignments: 0,
        therapistWorkload: {},
        averageAssignmentsPerDay: 0,
        mostAssignedTherapist: null,
        leastAssignedTherapist: null
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    assignTherapist,
    getAssignmentStatistics,
    loading,
    error,
  }
}


