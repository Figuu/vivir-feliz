import { useState, useCallback, useEffect, useRef } from 'react'
import { FormProgressTracker, type FormType, type ProgressStatus, type ValidationState } from '@/lib/form-progress-tracker'
import { AutoSaveManager, AutoSaveManagerFactory, type AutoSaveConfig, type AutoSaveData } from '@/lib/auto-save-manager'

export interface FormProgress {
  id: string
  formType: FormType
  formId: string
  userId: string
  currentStep: number
  totalSteps: number
  completedSteps: number[]
  progressPercentage: number
  status: ProgressStatus
  lastSavedAt: Date
  estimatedTimeRemaining: number
  validationState: ValidationState
  autoSaveEnabled: boolean
  autoSaveInterval: number
  createdAt: Date
  updatedAt: Date
}

export interface ProgressSnapshot {
  timestamp: Date
  step: number
  progressPercentage: number
  validationState: ValidationState
  timeSpent: number
  actions: string[]
}

export interface ProgressAnalytics {
  totalForms: number
  averageCompletionTime: number
  completionRate: number
  stepCompletionRates: Record<number, number>
  commonDropOffPoints: Array<{
    step: number
    dropOffRate: number
    commonIssues: string[]
  }>
  userPerformance: Array<{
    userId: string
    averageCompletionTime: number
    completionRate: number
    formsCompleted: number
  }>
}

export interface UseFormProgressReturn {
  // Progress operations
  initializeProgress: (formType: FormType, formId: string, userId: string, totalSteps: number, autoSaveConfig?: Partial<AutoSaveConfig>) => Promise<FormProgress>
  getProgress: (formType: FormType, formId: string, userId: string) => Promise<FormProgress | null>
  updateProgress: (formType: FormType, formId: string, userId: string, currentStep: number, completedSteps: number[], validationState: ValidationState) => Promise<FormProgress>
  markStepCompleted: (formType: FormType, formId: string, userId: string, step: number, validationState: ValidationState) => Promise<FormProgress>
  resetProgress: (formType: FormType, formId: string, userId: string) => Promise<FormProgress>
  deleteProgress: (formType: FormType, formId: string, userId: string) => Promise<boolean>
  
  // Auto-save operations
  startAutoSave: (autoSaveData: AutoSaveData) => void
  stopAutoSave: () => void
  triggerAutoSave: (autoSaveData: AutoSaveData) => Promise<boolean>
  debouncedAutoSave: (autoSaveData: AutoSaveData) => void
  updateAutoSaveConfig: (config: Partial<AutoSaveConfig>) => void
  
  // Snapshot and analytics
  getProgressSnapshots: (formType: FormType, formId: string, userId: string) => Promise<ProgressSnapshot[]>
  getProgressAnalytics: (formType?: FormType, dateRange?: { start: Date; end: Date }) => Promise<ProgressAnalytics>
  
  // State
  progress: FormProgress | null
  autoSaveState: any
  loading: boolean
  error: string | null
}

export function useFormProgress(): UseFormProgressReturn {
  const [progress, setProgress] = useState<FormProgress | null>(null)
  const [autoSaveState, setAutoSaveState] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const autoSaveManagerRef = useRef<AutoSaveManager | null>(null)

  const initializeProgress = useCallback(async (
    formType: FormType,
    formId: string,
    userId: string,
    totalSteps: number,
    autoSaveConfig?: Partial<AutoSaveConfig>
  ): Promise<FormProgress> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/form-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType,
          formId,
          userId,
          totalSteps,
          autoSaveEnabled: autoSaveConfig?.enabled ?? true,
          autoSaveInterval: autoSaveConfig?.interval ?? 30000
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize progress tracking')
      }

      const progressData = result.data
      setProgress(progressData)

      // Initialize auto-save manager
      if (autoSaveConfig?.enabled !== false) {
        autoSaveManagerRef.current = AutoSaveManagerFactory.getManager(
          formType,
          formId,
          userId,
          autoSaveConfig
        )

        // Add auto-save state listener
        const removeListener = autoSaveManagerRef.current.addListener((state) => {
          setAutoSaveState(state)
        })

        // Cleanup listener on unmount
        return () => removeListener()
      }

      return progressData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize progress tracking'
      setError(errorMessage)
      console.error('Error initializing progress tracking:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getProgress = useCallback(async (
    formType: FormType,
    formId: string,
    userId: string
  ): Promise<FormProgress | null> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        formType,
        formId,
        userId
      })

      const response = await fetch(`/api/form-progress?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        if (result.error === 'Progress tracking not found') {
          return null
        }
        throw new Error(result.error || 'Failed to get form progress')
      }

      const progressData = result.data
      setProgress(progressData)
      return progressData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get form progress'
      setError(errorMessage)
      console.error('Error getting form progress:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateProgress = useCallback(async (
    formType: FormType,
    formId: string,
    userId: string,
    currentStep: number,
    completedSteps: number[],
    validationState: ValidationState
  ): Promise<FormProgress> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/form-progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType,
          formId,
          userId,
          currentStep,
          completedSteps,
          validationState
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update form progress')
      }

      const progressData = result.data
      setProgress(progressData)
      return progressData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update form progress'
      setError(errorMessage)
      console.error('Error updating form progress:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const markStepCompleted = useCallback(async (
    formType: FormType,
    formId: string,
    userId: string,
    step: number,
    validationState: ValidationState
  ): Promise<FormProgress> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/form-progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType,
          formId,
          userId,
          currentStep: step,
          completedSteps: [step],
          validationState
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to mark step as completed')
      }

      const progressData = result.data
      setProgress(progressData)
      return progressData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark step as completed'
      setError(errorMessage)
      console.error('Error marking step as completed:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const resetProgress = useCallback(async (
    formType: FormType,
    formId: string,
    userId: string
  ): Promise<FormProgress> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/form-progress?action=reset', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType,
          formId,
          userId
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to reset form progress')
      }

      const progressData = result.data
      setProgress(progressData)
      return progressData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset form progress'
      setError(errorMessage)
      console.error('Error resetting form progress:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteProgress = useCallback(async (
    formType: FormType,
    formId: string,
    userId: string
  ): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/form-progress?action=delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType,
          formId,
          userId
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete form progress')
      }

      setProgress(null)
      return result.success
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete form progress'
      setError(errorMessage)
      console.error('Error deleting form progress:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const startAutoSave = useCallback((autoSaveData: AutoSaveData) => {
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.start(autoSaveData)
    }
  }, [])

  const stopAutoSave = useCallback(() => {
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.stop()
    }
  }, [])

  const triggerAutoSave = useCallback(async (autoSaveData: AutoSaveData): Promise<boolean> => {
    if (autoSaveManagerRef.current) {
      return await autoSaveManagerRef.current.triggerAutoSave(autoSaveData)
    }
    return false
  }, [])

  const debouncedAutoSave = useCallback((autoSaveData: AutoSaveData) => {
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.debouncedAutoSave(autoSaveData)
    }
  }, [])

  const updateAutoSaveConfig = useCallback((config: Partial<AutoSaveConfig>) => {
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.updateConfig(config)
    }
  }, [])

  const getProgressSnapshots = useCallback(async (
    formType: FormType,
    formId: string,
    userId: string
  ): Promise<ProgressSnapshot[]> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams({
        formType,
        formId,
        userId
      })

      const response = await fetch(`/api/form-progress/snapshots?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get progress snapshots')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get progress snapshots'
      setError(errorMessage)
      console.error('Error getting progress snapshots:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getProgressAnalytics = useCallback(async (
    formType?: FormType,
    dateRange?: { start: Date; end: Date }
  ): Promise<ProgressAnalytics> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (formType) {
        searchParams.append('formType', formType)
      }
      if (dateRange) {
        searchParams.append('startDate', dateRange.start.toISOString())
        searchParams.append('endDate', dateRange.end.toISOString())
      }

      const response = await fetch(`/api/form-progress/analytics?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get progress analytics')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get progress analytics'
      setError(errorMessage)
      console.error('Error getting progress analytics:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cleanup auto-save manager on unmount
  useEffect(() => {
    return () => {
      if (autoSaveManagerRef.current) {
        autoSaveManagerRef.current.destroy()
        autoSaveManagerRef.current = null
      }
    }
  }, [])

  return {
    initializeProgress,
    getProgress,
    updateProgress,
    markStepCompleted,
    resetProgress,
    deleteProgress,
    startAutoSave,
    stopAutoSave,
    triggerAutoSave,
    debouncedAutoSave,
    updateAutoSaveConfig,
    getProgressSnapshots,
    getProgressAnalytics,
    progress,
    autoSaveState,
    loading,
    error
  }
}

