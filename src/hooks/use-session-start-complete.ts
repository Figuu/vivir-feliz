import { useState, useCallback, useRef, useEffect } from 'react'

interface Session {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: string
  actualStartTime?: string
  actualEndTime?: string
  actualDuration?: number
  sessionNotes?: string
  therapistComments?: string
  patientProgress?: string
  nextSessionRecommendations?: string
  sessionOutcome?: string
  patientSatisfaction?: number
  therapistSatisfaction?: number
  patient: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  therapist: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  services: Array<{
    id: string
    name: string
    description: string
    price: number
  }>
}

interface SessionStartData {
  notes?: string
  therapistComments?: string
}

interface SessionCompleteData {
  actualDuration?: number
  sessionNotes?: string
  therapistComments?: string
  patientProgress?: string
  nextSessionRecommendations?: string
  sessionOutcome?: 'successful' | 'partial' | 'challenging' | 'cancelled_early'
  patientSatisfaction?: number
  therapistSatisfaction?: number
}

interface UseSessionStartCompleteReturn {
  loading: boolean
  error: string | null
  
  // Session data
  session: Session | null
  sessionStatus: 'scheduled' | 'in-progress' | 'completed'
  
  // Timer functionality
  currentTime: Date
  sessionStartTime: Date | null
  sessionEndTime: Date | null
  elapsedTime: number
  estimatedEndTime: Date | null
  isTimerRunning: boolean
  
  // Form data
  notes: string
  therapistComments: string
  patientProgress: string
  nextSessionRecommendations: string
  sessionOutcome: string
  patientSatisfaction: number
  therapistSatisfaction: number
  actualDuration: number
  
  // Validation
  showValidationErrors: boolean
  
  // Operations
  loadSessionData: (sessionId: string) => Promise<Session>
  startSession: (sessionId: string, data: SessionStartData) => Promise<Session>
  completeSession: (sessionId: string, data: SessionCompleteData) => Promise<Session>
  
  // Form management
  setNotes: (notes: string) => void
  setTherapistComments: (comments: string) => void
  setPatientProgress: (progress: string) => void
  setNextSessionRecommendations: (recommendations: string) => void
  setSessionOutcome: (outcome: string) => void
  setPatientSatisfaction: (satisfaction: number) => void
  setTherapistSatisfaction: (satisfaction: number) => void
  setActualDuration: (duration: number) => void
  setShowValidationErrors: (show: boolean) => void
  
  // Timer management
  startTimer: () => void
  stopTimer: () => void
  resetTimer: () => void
  
  // Utility functions
  formatTime: (seconds: number) => string
  formatDateTime: (dateString: string) => string
  getStatusColor: (status: string) => string
  getProgressPercentage: () => number
  getTimeRemaining: () => number
  validateSessionData: (data: SessionCompleteData) => string[]
  canStartSession: () => boolean
  canCompleteSession: () => boolean
  
  // State management
  clearError: () => void
}

export function useSessionStartComplete(): UseSessionStartCompleteReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [sessionStatus, setSessionStatus] = useState<'scheduled' | 'in-progress' | 'completed'>('scheduled')
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  const [sessionEndTime, setSessionEndTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [estimatedEndTime, setEstimatedEndTime] = useState<Date | null>(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [notes, setNotes] = useState('')
  const [therapistComments, setTherapistComments] = useState('')
  const [patientProgress, setPatientProgress] = useState('')
  const [nextSessionRecommendations, setNextSessionRecommendations] = useState('')
  const [sessionOutcome, setSessionOutcome] = useState<string>('')
  const [patientSatisfaction, setPatientSatisfaction] = useState<number>(0)
  const [therapistSatisfaction, setTherapistSatisfaction] = useState<number>(0)
  const [actualDuration, setActualDuration] = useState<number>(0)
  const [showValidationErrors, setShowValidationErrors] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && sessionStartTime) {
      timerRef.current = setInterval(() => {
        const now = new Date()
        setCurrentTime(now)
        const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isTimerRunning, sessionStartTime])

  const loadSessionData = useCallback(async (sessionId: string): Promise<Session> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load session data')
      }

      const sessionData = result.data
      setSession(sessionData)
      setSessionStatus(sessionData.status)
      
      if (sessionData.actualStartTime) {
        setSessionStartTime(new Date(sessionData.actualStartTime))
        setIsTimerRunning(sessionData.status === 'in-progress')
      }
      
      if (sessionData.actualEndTime) {
        setSessionEndTime(new Date(sessionData.actualEndTime))
      }
      
      if (sessionData.actualDuration) {
        setActualDuration(sessionData.actualDuration)
      }
      
      setNotes(sessionData.sessionNotes || '')
      setTherapistComments(sessionData.therapistComments || '')
      setPatientProgress(sessionData.patientProgress || '')
      setNextSessionRecommendations(sessionData.nextSessionRecommendations || '')
      setSessionOutcome(sessionData.sessionOutcome || '')
      setPatientSatisfaction(sessionData.patientSatisfaction || 0)
      setTherapistSatisfaction(sessionData.therapistSatisfaction || 0)
      
      return sessionData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load session data'
      setError(errorMessage)
      console.error('Error loading session data:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const startSession = useCallback(async (sessionId: string, data: SessionStartData): Promise<Session> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start session')
      }

      const startTime = new Date(result.data.startTime)
      setSessionStartTime(startTime)
      setEstimatedEndTime(new Date(result.data.estimatedEndTime))
      setSessionStatus('in-progress')
      setIsTimerRunning(true)
      setSession(result.data.session)
      
      return result.data.session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session'
      setError(errorMessage)
      console.error('Error starting session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const completeSession = useCallback(async (sessionId: string, data: SessionCompleteData): Promise<Session> => {
    try {
      setLoading(true)
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

      const endTime = new Date(result.data.endTime)
      setSessionEndTime(endTime)
      setSessionStatus('completed')
      setIsTimerRunning(false)
      setSession(result.data.session)
      
      return result.data.session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete session'
      setError(errorMessage)
      console.error('Error completing session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const startTimer = useCallback(() => {
    setIsTimerRunning(true)
  }, [])

  const stopTimer = useCallback(() => {
    setIsTimerRunning(false)
  }, [])

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false)
    setElapsedTime(0)
    setSessionStartTime(null)
    setEstimatedEndTime(null)
  }, [])

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const formatDateTime = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }, [])

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [])

  const getProgressPercentage = useCallback((): number => {
    if (!session || !sessionStartTime) return 0
    const totalDuration = session.duration * 60 // Convert to seconds
    return Math.min((elapsedTime / totalDuration) * 100, 100)
  }, [session, sessionStartTime, elapsedTime])

  const getTimeRemaining = useCallback((): number => {
    if (!session || !sessionStartTime) return 0
    const totalDuration = session.duration * 60 // Convert to seconds
    return Math.max(totalDuration - elapsedTime, 0)
  }, [session, sessionStartTime, elapsedTime])

  const validateSessionData = useCallback((data: SessionCompleteData): string[] => {
    const errors = []
    
    if (data.sessionNotes && data.sessionNotes.length > 2000) {
      errors.push('Session notes cannot exceed 2000 characters')
    }
    
    if (data.therapistComments && data.therapistComments.length > 2000) {
      errors.push('Therapist comments cannot exceed 2000 characters')
    }
    
    if (data.patientProgress && data.patientProgress.length > 1000) {
      errors.push('Patient progress notes cannot exceed 1000 characters')
    }
    
    if (data.nextSessionRecommendations && data.nextSessionRecommendations.length > 1000) {
      errors.push('Next session recommendations cannot exceed 1000 characters')
    }
    
    if (data.actualDuration && (data.actualDuration < 1 || data.actualDuration > 300)) {
      errors.push('Session duration must be between 1 and 300 minutes')
    }

    return errors
  }, [])

  const canStartSession = useCallback((): boolean => {
    if (!session) return false
    if (session.status !== 'scheduled') return false
    
    // Check if session is not too early (more than 30 minutes before scheduled time)
    const scheduledDateTime = new Date(`${session.scheduledDate}T${session.scheduledTime}`)
    const now = new Date()
    const timeDifference = scheduledDateTime.getTime() - now.getTime()
    const thirtyMinutes = 30 * 60 * 1000
    
    if (timeDifference > thirtyMinutes) return false
    
    // Check if session is not too late (more than 2 hours after scheduled time)
    const twoHours = 2 * 60 * 60 * 1000
    if (timeDifference < -twoHours) return false
    
    return true
  }, [session])

  const canCompleteSession = useCallback((): boolean => {
    if (!session) return false
    if (session.status !== 'in-progress') return false
    if (!sessionStartTime) return false
    
    // Check if session has been running for at least 1 minute
    const now = new Date()
    const timeDifference = now.getTime() - sessionStartTime.getTime()
    const oneMinute = 60 * 1000
    
    return timeDifference >= oneMinute
  }, [session, sessionStartTime])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    session,
    sessionStatus,
    currentTime,
    sessionStartTime,
    sessionEndTime,
    elapsedTime,
    estimatedEndTime,
    isTimerRunning,
    notes,
    therapistComments,
    patientProgress,
    nextSessionRecommendations,
    sessionOutcome,
    patientSatisfaction,
    therapistSatisfaction,
    actualDuration,
    showValidationErrors,
    loadSessionData,
    startSession,
    completeSession,
    setNotes,
    setTherapistComments,
    setPatientProgress,
    setNextSessionRecommendations,
    setSessionOutcome,
    setPatientSatisfaction,
    setTherapistSatisfaction,
    setActualDuration,
    setShowValidationErrors,
    startTimer,
    stopTimer,
    resetTimer,
    formatTime,
    formatDateTime,
    getStatusColor,
    getProgressPercentage,
    getTimeRemaining,
    validateSessionData,
    canStartSession,
    canCompleteSession,
    clearError
  }
}
