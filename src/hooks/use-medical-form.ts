import { useState, useCallback, useEffect } from 'react'

export type FormStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED' | 'APPROVED'
export type FormStep = 1 | 2 | 3 | 4 | 5 | 6

export interface MedicalForm {
  formId?: string
  consultationRequestId: string
  patientId?: string
  parentId?: string
  parentInfo: any
  childInfo: any
  medicalHistory: any
  currentConcerns: any
  familyInfo: any
  goalsExpectations: any
  status: FormStatus
  currentStep: FormStep
  completedSteps: number[]
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

export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  stepValidation: Record<FormStep, {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }>
}

export interface FormProgress {
  formId: string
  currentStep: FormStep
  completedSteps: number[]
  totalSteps: number
  progressPercentage: number
  lastSavedAt: Date
  estimatedTimeRemaining?: number
}

export interface FormStatistics {
  totalForms: number
  completedForms: number
  draftForms: number
  inProgressForms: number
  reviewedForms: number
  approvedForms: number
  averageCompletionTime: number
  stepCompletionRates: Record<FormStep, number>
  commonIssues: Array<{
    step: FormStep
    field: string
    issue: string
    count: number
  }>
}

export interface UseMedicalFormReturn {
  // Form operations
  createForm: (consultationRequestId: string, parentId?: string, patientId?: string) => Promise<MedicalForm>
  getForm: (formId: string) => Promise<MedicalForm | null>
  getFormByConsultationRequest: (consultationRequestId: string) => Promise<MedicalForm | null>
  updateFormStep: (formId: string, step: FormStep, stepData: any, userId?: string) => Promise<MedicalForm>
  autoSaveForm: (formId: string, currentStep: FormStep, stepData: any, completedSteps: number[]) => Promise<any>
  validateForm: (formId: string) => Promise<FormValidationResult>
  getFormProgress: (formId: string) => Promise<FormProgress>
  submitFormForReview: (formId: string, submittedBy: string) => Promise<MedicalForm>
  approveForm: (formId: string, approvedBy: string, approvalNotes?: string) => Promise<MedicalForm>
  deleteForm: (formId: string) => Promise<boolean>
  getFormStatistics: (dateRange?: { start: Date; end: Date }) => Promise<FormStatistics>
  
  // State
  loading: boolean
  error: string | null
  autoSaveEnabled: boolean
  autoSaveInterval: number
}

export function useMedicalForm(): UseMedicalFormReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [autoSaveInterval, setAutoSaveInterval] = useState(30000) // 30 seconds

  const createForm = useCallback(async (
    consultationRequestId: string,
    parentId?: string,
    patientId?: string
  ): Promise<MedicalForm> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/medical-forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultationRequestId,
          parentId,
          patientId
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create medical form')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create medical form'
      setError(errorMessage)
      console.error('Error creating medical form:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getForm = useCallback(async (formId: string): Promise<MedicalForm | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/medical-forms/${formId}`)
      const result = await response.json()

      if (!result.success) {
        if (result.error === 'Medical form not found') {
          return null
        }
        throw new Error(result.error || 'Failed to get medical form')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get medical form'
      setError(errorMessage)
      console.error('Error getting medical form:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getFormByConsultationRequest = useCallback(async (consultationRequestId: string): Promise<MedicalForm | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/medical-forms?consultationRequestId=${consultationRequestId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get medical form')
      }

      return result.data.forms[0] || null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get medical form'
      setError(errorMessage)
      console.error('Error getting medical form by consultation request:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateFormStep = useCallback(async (
    formId: string,
    step: FormStep,
    stepData: any,
    userId?: string
  ): Promise<MedicalForm> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/medical-forms', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          step,
          stepData,
          userId
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update form step')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update form step'
      setError(errorMessage)
      console.error('Error updating form step:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const autoSaveForm = useCallback(async (
    formId: string,
    currentStep: FormStep,
    stepData: any,
    completedSteps: number[]
  ): Promise<any> => {
    try {
      setError(null)

      const response = await fetch('/api/medical-forms', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId,
          currentStep,
          stepData,
          completedSteps
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to auto-save form')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to auto-save form'
      setError(errorMessage)
      console.error('Error auto-saving form:', err)
      throw new Error(errorMessage)
    }
  }, [])

  const validateForm = useCallback(async (formId: string): Promise<FormValidationResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/medical-forms/${formId}/validate`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to validate form')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate form'
      setError(errorMessage)
      console.error('Error validating form:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getFormProgress = useCallback(async (formId: string): Promise<FormProgress> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/medical-forms/${formId}/progress`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get form progress')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get form progress'
      setError(errorMessage)
      console.error('Error getting form progress:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const submitFormForReview = useCallback(async (
    formId: string,
    submittedBy: string
  ): Promise<MedicalForm> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/medical-forms', {
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

  const approveForm = useCallback(async (
    formId: string,
    approvedBy: string,
    approvalNotes?: string
  ): Promise<MedicalForm> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/medical-forms/${formId}/approve`, {
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
        throw new Error(result.error || 'Failed to approve form')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve form'
      setError(errorMessage)
      console.error('Error approving form:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteForm = useCallback(async (formId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/medical-forms/${formId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete form')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete form'
      setError(errorMessage)
      console.error('Error deleting form:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getFormStatistics = useCallback(async (
    dateRange?: { start: Date; end: Date }
  ): Promise<FormStatistics> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (dateRange) {
        searchParams.append('startDate', dateRange.start.toISOString())
        searchParams.append('endDate', dateRange.end.toISOString())
      }

      const response = await fetch(`/api/medical-forms/statistics?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get form statistics')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get form statistics'
      setError(errorMessage)
      console.error('Error getting form statistics:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    createForm,
    getForm,
    getFormByConsultationRequest,
    updateFormStep,
    autoSaveForm,
    validateForm,
    getFormProgress,
    submitFormForReview,
    approveForm,
    deleteForm,
    getFormStatistics,
    loading,
    error,
    autoSaveEnabled,
    autoSaveInterval
  }
}


