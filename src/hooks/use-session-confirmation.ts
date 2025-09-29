import { useState, useCallback } from 'react'

interface ConfirmationData {
  sessionId: string
  confirmationType: 'EMAIL' | 'SMS' | 'BOTH'
  reminderHours: number[]
  customMessage?: string
}

interface ConfirmSessionData {
  confirmationToken: string
  confirmedBy: 'PATIENT' | 'PARENT' | 'THERAPIST' | 'ADMIN'
  confirmationMethod: 'EMAIL' | 'SMS' | 'WEB' | 'PHONE'
  notes?: string
}

interface RescheduleRequestData {
  sessionId: string
  newDate: string
  newTime: string
  reason: string
  preferredAlternatives?: Array<{
    date: string
    time: string
  }>
}

interface CancelSessionData {
  sessionId: string
  reason: string
  cancelledBy?: 'PATIENT' | 'PARENT' | 'THERAPIST' | 'ADMIN'
}

interface Session {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: string
  patient: {
    id: string
    firstName: string
    lastName: string
    parent: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string
    }
  }
  therapist: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  serviceAssignment: {
    service: {
      id: string
      name: string
      type: string
    }
  }
}

interface ConfirmationStats {
  total: number
  confirmed: number
  pending: number
  cancelled: number
  noShow: number
}

interface UseSessionConfirmationReturn {
  loading: boolean
  error: string | null
  getConfirmationData: (params: {
    sessionId?: string
    patientId?: string
    therapistId?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }) => Promise<{
    sessions: Session[]
    stats: ConfirmationStats
    breakdown: any[]
  }>
  sendConfirmation: (data: ConfirmationData) => Promise<{
    confirmation: any
    notifications: any
    session: any
  }>
  confirmSession: (data: ConfirmSessionData) => Promise<{
    confirmation: any
    session: any
  }>
  requestReschedule: (data: RescheduleRequestData) => Promise<{
    rescheduleRequest: any
    session: any
  }>
  cancelSession: (data: CancelSessionData) => Promise<{
    session: any
  }>
  clearError: () => void
}

export function useSessionConfirmation(): UseSessionConfirmationReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getConfirmationData = useCallback(async (params: {
    sessionId?: string
    patientId?: string
    therapistId?: string
    status?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<{
    sessions: Session[]
    stats: ConfirmationStats
    breakdown: any[]
  }> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params.sessionId) searchParams.append('sessionId', params.sessionId)
      if (params.patientId) searchParams.append('patientId', params.patientId)
      if (params.therapistId) searchParams.append('therapistId', params.therapistId)
      if (params.status) searchParams.append('status', params.status)
      if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom)
      if (params.dateTo) searchParams.append('dateTo', params.dateTo)

      const response = await fetch(`/api/sessions/confirmation?${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get confirmation data')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get confirmation data'
      setError(errorMessage)
      console.error('Error getting confirmation data:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const sendConfirmation = useCallback(async (data: ConfirmationData): Promise<{
    confirmation: any
    notifications: any
    session: any
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/confirmation?action=send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send confirmation')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send confirmation'
      setError(errorMessage)
      console.error('Error sending confirmation:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const confirmSession = useCallback(async (data: ConfirmSessionData): Promise<{
    confirmation: any
    session: any
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/confirmation?action=confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to confirm session')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm session'
      setError(errorMessage)
      console.error('Error confirming session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const requestReschedule = useCallback(async (data: RescheduleRequestData): Promise<{
    rescheduleRequest: any
    session: any
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/confirmation?action=reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to request reschedule')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request reschedule'
      setError(errorMessage)
      console.error('Error requesting reschedule:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const cancelSession = useCallback(async (data: CancelSessionData): Promise<{
    session: any
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/confirmation?action=cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel session')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel session'
      setError(errorMessage)
      console.error('Error cancelling session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    getConfirmationData,
    sendConfirmation,
    confirmSession,
    requestReschedule,
    cancelSession,
    clearError
  }
}
