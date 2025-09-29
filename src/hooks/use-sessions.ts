import { useState, useEffect, useCallback } from 'react'

interface Session {
  id: string
  serviceAssignmentId: string
  patientId: string
  therapistId: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  startedAt?: string
  completedAt?: string
  actualDuration?: number
  sessionNotes?: string
  therapistComments?: string
  parentVisible: boolean
  originalDate?: string
  rescheduleReason?: string
  rescheduledBy?: string
  rescheduledAt?: string
  createdAt: string
  updatedAt: string
  patient: {
    id: string
    firstName: string
    lastName: string
    dateOfBirth: string
  }
  therapist: {
    id: string
    firstName: string
    lastName: string
  }
  serviceAssignment: {
    id: string
    service: {
      id: string
      name: string
      type: string
    }
  }
}

interface SessionFilters {
  therapistId?: string
  patientId?: string
  serviceAssignmentId?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

interface UseSessionsReturn {
  sessions: Session[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  } | null
  loadSessions: (filters?: SessionFilters) => Promise<void>
  createSession: (sessionData: {
    serviceAssignmentId: string
    patientId: string
    therapistId: string
    scheduledDate: string
    scheduledTime: string
    duration: number
    notes?: string
  }) => Promise<Session>
  updateSession: (sessionId: string, updates: Partial<Session>) => Promise<Session>
  startSession: (sessionId: string, actualStartTime?: string) => Promise<Session>
  completeSession: (sessionId: string, data: {
    actualDuration?: number
    sessionNotes?: string
    therapistComments?: string
    parentVisible?: boolean
  }) => Promise<Session>
  cancelSession: (sessionId: string) => Promise<void>
  bulkScheduleSessions: (data: {
    serviceAssignmentId: string
    startDate: string
    endDate: string
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY'
    daysOfWeek?: string[]
    timeSlots: { time: string; duration: number }[]
    notes?: string
  }) => Promise<{ createdSessions: Session[]; errors: any[] }>
  refreshSessions: () => Promise<void>
}

export function useSessions(initialFilters?: SessionFilters): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    totalPages: number
  } | null>(null)
  const [currentFilters, setCurrentFilters] = useState<SessionFilters>(initialFilters || {})

  const loadSessions = useCallback(async (filters?: SessionFilters) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      const activeFilters = { ...currentFilters, ...filters }
      
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/sessions?${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load sessions')
      }

      setSessions(result.sessions || [])
      setPagination(result.pagination || null)
      setCurrentFilters(activeFilters)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions'
      setError(errorMessage)
      console.error('Error loading sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [currentFilters])

  const createSession = useCallback(async (sessionData: {
    serviceAssignmentId: string
    patientId: string
    therapistId: string
    scheduledDate: string
    scheduledTime: string
    duration: number
    notes?: string
  }): Promise<Session> => {
    try {
      setError(null)

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create session')
      }

      // Add new session to the list
      setSessions(prev => [result.session, ...prev])
      
      return result.session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session'
      setError(errorMessage)
      console.error('Error creating session:', err)
      throw err
    }
  }, [])

  const updateSession = useCallback(async (sessionId: string, updates: Partial<Session>): Promise<Session> => {
    try {
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update session')
      }

      // Update session in the list
      setSessions(prev => prev.map(session => 
        session.id === sessionId ? result.session : session
      ))
      
      return result.session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session'
      setError(errorMessage)
      console.error('Error updating session:', err)
      throw err
    }
  }, [])

  const startSession = useCallback(async (sessionId: string, actualStartTime?: string): Promise<Session> => {
    try {
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actualStartTime })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start session')
      }

      // Update session in the list
      setSessions(prev => prev.map(session => 
        session.id === sessionId ? result.session : session
      ))
      
      return result.session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session'
      setError(errorMessage)
      console.error('Error starting session:', err)
      throw err
    }
  }, [])

  const completeSession = useCallback(async (sessionId: string, data: {
    actualDuration?: number
    sessionNotes?: string
    therapistComments?: string
    parentVisible?: boolean
  }): Promise<Session> => {
    try {
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete session')
      }

      // Update session in the list
      setSessions(prev => prev.map(session => 
        session.id === sessionId ? result.session : session
      ))
      
      return result.session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete session'
      setError(errorMessage)
      console.error('Error completing session:', err)
      throw err
    }
  }, [])

  const cancelSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel session')
      }

      // Remove session from the list
      setSessions(prev => prev.filter(session => session.id !== sessionId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel session'
      setError(errorMessage)
      console.error('Error cancelling session:', err)
      throw err
    }
  }, [])

  const bulkScheduleSessions = useCallback(async (data: {
    serviceAssignmentId: string
    startDate: string
    endDate: string
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY'
    daysOfWeek?: string[]
    timeSlots: { time: string; duration: number }[]
    notes?: string
  }): Promise<{ createdSessions: Session[]; errors: any[] }> => {
    try {
      setError(null)

      const response = await fetch('/api/sessions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to bulk schedule sessions')
      }

      // Add new sessions to the list
      setSessions(prev => [...result.createdSessions, ...prev])
      
      return {
        createdSessions: result.createdSessions,
        errors: result.errors
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk schedule sessions'
      setError(errorMessage)
      console.error('Error bulk scheduling sessions:', err)
      throw err
    }
  }, [])

  const refreshSessions = useCallback(async () => {
    await loadSessions(currentFilters)
  }, [loadSessions, currentFilters])

  // Load sessions on mount
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  return {
    sessions,
    loading,
    error,
    pagination,
    loadSessions,
    createSession,
    updateSession,
    startSession,
    completeSession,
    cancelSession,
    bulkScheduleSessions,
    refreshSessions
  }
}
