import { useState, useCallback } from 'react'

export type ConsultationStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface StatusUpdate {
  id: string
  consultationRequestId: string
  fromStatus: ConsultationStatus
  toStatus: ConsultationStatus
  updatedBy: string
  updatedAt: Date
  reason?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface StatusHistory {
  id: string
  consultationRequestId: string
  status: ConsultationStatus
  updatedBy: string
  updatedAt: Date
  reason?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface ConsultationStatusInfo {
  currentStatus: ConsultationStatus
  statusHistory: StatusHistory[]
  canTransitionTo: ConsultationStatus[]
  lastUpdated: Date
  lastUpdatedBy: string
  totalDuration: number
  timeInCurrentStatus: number
}

export interface StatusStatistics {
  statusCounts: { [key in ConsultationStatus]: number }
  totalConsultations: number
  statusDistribution: { [key in ConsultationStatus]: number }
}

export interface ConsultationsNeedingUpdates {
  toInProgress: any[]
  toCompleted: any[]
  overdue: any[]
}

export interface UseConsultationStatusReturn {
  // Status management
  updateStatus: (params: {
    consultationRequestId: string
    newStatus: ConsultationStatus
    updatedBy: string
    reason?: string
    notes?: string
    metadata?: Record<string, any>
  }) => Promise<StatusUpdate>
  
  // Status information
  getStatusInfo: (consultationRequestId: string) => Promise<ConsultationStatusInfo>
  getStatusHistory: (consultationRequestId: string) => Promise<StatusHistory[]>
  getPossibleTransitions: (status: ConsultationStatus) => Promise<{
    currentStatus: ConsultationStatus
    description: string
    color: string
    possibleTransitions: ConsultationStatus[]
  }>
  
  // List operations
  getConsultationsByStatus: (status: ConsultationStatus, limit?: number, offset?: number) => Promise<{
    consultations: any[]
    totalCount: number
  }>
  
  // Statistics
  getStatusStatistics: (startDate?: string, endDate?: string) => Promise<StatusStatistics>
  
  // Auto-update operations
  getConsultationsNeedingUpdates: () => Promise<ConsultationsNeedingUpdates>
  triggerAutoUpdate: () => Promise<{
    updated: number
    errors: string[]
  }>
  
  // State
  loading: boolean
  error: string | null
}

export function useConsultationStatus(): UseConsultationStatusReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStatus = useCallback(async (params: {
    consultationRequestId: string
    newStatus: ConsultationStatus
    updatedBy: string
    reason?: string
    notes?: string
    metadata?: Record<string, any>
  }): Promise<StatusUpdate> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/consultation/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update consultation status')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update consultation status'
      setError(errorMessage)
      console.error('Error updating consultation status:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getStatusInfo = useCallback(async (consultationRequestId: string): Promise<ConsultationStatusInfo> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/consultation/status?consultationRequestId=${consultationRequestId}&action=info`
      )
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get consultation status info')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get consultation status info'
      setError(errorMessage)
      console.error('Error getting consultation status info:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getStatusHistory = useCallback(async (consultationRequestId: string): Promise<StatusHistory[]> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/consultation/status?consultationRequestId=${consultationRequestId}&action=history`
      )
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get consultation status history')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get consultation status history'
      setError(errorMessage)
      console.error('Error getting consultation status history:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPossibleTransitions = useCallback(async (status: ConsultationStatus): Promise<{
    currentStatus: ConsultationStatus
    description: string
    color: string
    possibleTransitions: ConsultationStatus[]
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/consultation/status?status=${status}&action=transitions`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get possible transitions')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get possible transitions'
      setError(errorMessage)
      console.error('Error getting possible transitions:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getConsultationsByStatus = useCallback(async (
    status: ConsultationStatus, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<{ consultations: any[]; totalCount: number }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `/api/consultation/status?status=${status}&action=list&limit=${limit}&offset=${offset}`
      )
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get consultations by status')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get consultations by status'
      setError(errorMessage)
      console.error('Error getting consultations by status:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getStatusStatistics = useCallback(async (
    startDate?: string, 
    endDate?: string
  ): Promise<StatusStatistics> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      searchParams.append('action', 'statistics')
      if (startDate) searchParams.append('startDate', startDate)
      if (endDate) searchParams.append('endDate', endDate)

      const response = await fetch(`/api/consultation/status?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get status statistics')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get status statistics'
      setError(errorMessage)
      console.error('Error getting status statistics:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getConsultationsNeedingUpdates = useCallback(async (): Promise<ConsultationsNeedingUpdates> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/consultation/status/auto-update')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get consultations needing updates')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get consultations needing updates'
      setError(errorMessage)
      console.error('Error getting consultations needing updates:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const triggerAutoUpdate = useCallback(async (): Promise<{
    updated: number
    errors: string[]
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/consultation/status/auto-update', {
        method: 'POST',
      })
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to trigger auto-update')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to trigger auto-update'
      setError(errorMessage)
      console.error('Error triggering auto-update:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    updateStatus,
    getStatusInfo,
    getStatusHistory,
    getPossibleTransitions,
    getConsultationsByStatus,
    getStatusStatistics,
    getConsultationsNeedingUpdates,
    triggerAutoUpdate,
    loading,
    error,
  }
}


