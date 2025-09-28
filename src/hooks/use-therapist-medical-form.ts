import { useState, useCallback } from 'react'

export type TherapistFormStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED' | 'APPROVED'

export interface TherapistMedicalForm {
  formId?: string
  medicalFormId: string
  therapistId: string
  assessment: any
  status: TherapistFormStatus
  createdAt?: Date
  updatedAt?: Date
  completedAt?: Date
  reviewedAt?: Date
  approvedAt?: Date
  reviewedBy?: string
  approvedBy?: string
  reviewNotes?: string
  approvalNotes?: string
}

export interface TherapistFormValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  sectionValidation: Record<string, {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }>
}

export interface TherapistFormStatistics {
  totalForms: number
  completedForms: number
  draftForms: number
  inProgressForms: number
  reviewedForms: number
  approvedForms: number
  averageCompletionTime: number
  therapistPerformance: Array<{
    therapistId: string
    therapistName: string
    formsCompleted: number
    averageCompletionTime: number
    qualityScore: number
  }>
  commonDiagnoses: Array<{
    diagnosis: string
    count: number
    percentage: number
  }>
  riskAssessmentStats: {
    highRiskForms: number
    moderateRiskForms: number
    lowRiskForms: number
    suicideRiskForms: number
    violenceRiskForms: number
  }
}

export interface UseTherapistMedicalFormReturn {
  // Form operations
  createTherapistForm: (medicalFormId: string, therapistId: string) => Promise<TherapistMedicalForm>
  getTherapistForm: (formId: string) => Promise<TherapistMedicalForm | null>
  getTherapistFormByMedicalForm: (medicalFormId: string, therapistId: string) => Promise<TherapistMedicalForm | null>
  updateTherapistForm: (formId: string, assessment: any, userId?: string) => Promise<TherapistMedicalForm>
  completeTherapistForm: (formId: string, assessment: any, completedBy: string) => Promise<TherapistMedicalForm>
  validateTherapistForm: (formId: string) => Promise<TherapistFormValidationResult>
  submitFormForReview: (formId: string, submittedBy: string) => Promise<TherapistMedicalForm>
  approveTherapistForm: (formId: string, approvedBy: string, approvalNotes?: string) => Promise<TherapistMedicalForm>
  deleteTherapistForm: (formId: string) => Promise<boolean>
  getTherapistFormStatistics: (dateRange?: { start: Date; end: Date }) => Promise<TherapistFormStatistics>
  
  // State
  loading: boolean
  error: string | null
}

export function useTherapistMedicalForm(): UseTherapistMedicalFormReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTherapistForm = useCallback(async (
    medicalFormId: string,
    therapistId: string
  ): Promise<TherapistMedicalForm> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist-medical-forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicalFormId,
          therapistId
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create therapist medical form')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create therapist medical form'
      setError(errorMessage)
      console.error('Error creating therapist medical form:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getTherapistForm = useCallback(async (formId: string): Promise<TherapistMedicalForm | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist-medical-forms/${formId}`)
      const result = await response.json()

      if (!result.success) {
        if (result.error === 'Therapist medical form not found') {
          return null
        }
        throw new Error(result.error || 'Failed to get therapist medical form')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get therapist medical form'
      setError(errorMessage)
      console.error('Error getting therapist medical form:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getTherapistFormByMedicalForm = useCallback(async (
    medicalFormId: string,
    therapistId: string
  ): Promise<TherapistMedicalForm | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist-medical-forms?medicalFormId=${medicalFormId}&therapistId=${therapistId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get therapist medical form')
      }

      return result.data.forms[0] || null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get therapist medical form'
      setError(errorMessage)
      console.error('Error getting therapist medical form by medical form:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTherapistForm = useCallback(async (
    formId: string,
    assessment: any,
    userId?: string
  ): Promise<TherapistMedicalForm> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist-medical-forms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          assessment,
          userId
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update therapist form')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update therapist form'
      setError(errorMessage)
      console.error('Error updating therapist form:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const completeTherapistForm = useCallback(async (
    formId: string,
    assessment: any,
    completedBy: string
  ): Promise<TherapistMedicalForm> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist-medical-forms', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          assessment,
          completedBy
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to complete therapist form')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete therapist form'
      setError(errorMessage)
      console.error('Error completing therapist form:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const validateTherapistForm = useCallback(async (formId: string): Promise<TherapistFormValidationResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist-medical-forms/${formId}/validate`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to validate therapist form')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate therapist form'
      setError(errorMessage)
      console.error('Error validating therapist form:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const submitFormForReview = useCallback(async (
    formId: string,
    submittedBy: string
  ): Promise<TherapistMedicalForm> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist-medical-forms', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          submittedBy
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit form for review')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit form for review'
      setError(errorMessage)
      console.error('Error submitting form for review:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const approveTherapistForm = useCallback(async (
    formId: string,
    approvedBy: string,
    approvalNotes?: string
  ): Promise<TherapistMedicalForm> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist-medical-forms/${formId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approvedBy,
          approvalNotes
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to approve therapist form')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve therapist form'
      setError(errorMessage)
      console.error('Error approving therapist form:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTherapistForm = useCallback(async (formId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist-medical-forms/${formId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete therapist form')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete therapist form'
      setError(errorMessage)
      console.error('Error deleting therapist form:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getTherapistFormStatistics = useCallback(async (
    dateRange?: { start: Date; end: Date }
  ): Promise<TherapistFormStatistics> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (dateRange) {
        searchParams.append('startDate', dateRange.start.toISOString())
        searchParams.append('endDate', dateRange.end.toISOString())
      }

      const response = await fetch(`/api/therapist-medical-forms/statistics?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get therapist form statistics')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get therapist form statistics'
      setError(errorMessage)
      console.error('Error getting therapist form statistics:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createTherapistForm,
    getTherapistForm,
    getTherapistFormByMedicalForm,
    updateTherapistForm,
    completeTherapistForm,
    validateTherapistForm,
    submitFormForReview,
    approveTherapistForm,
    deleteTherapistForm,
    getTherapistFormStatistics,
    loading,
    error,
  }
}


