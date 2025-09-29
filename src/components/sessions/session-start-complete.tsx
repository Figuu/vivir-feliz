'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Play,
  Pause,
  Stop,
  Timer,
  Clock,
  User,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Star,
  Heart,
  Zap,
  Target,
  Activity,
  BarChart3,
  Download,
  Upload,
  Bell,
  Globe,
  Building,
  Shield,
  BookOpen,
  Settings,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Info,
  AlertTriangle,
  CheckSquare,
  Square,
  GripVertical,
  Move,
  Copy,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  PieChart,
  LineChart,
  BarChart,
  Save,
  Edit,
  Eye,
  Trash2,
  Plus,
  Minus,
  RotateCcw as Reset
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

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

interface SessionStartCompleteProps {
  sessionId: string
  onSessionUpdate?: (session: Session) => void
  onSessionComplete?: (session: Session) => void
}

export function SessionStartComplete({
  sessionId,
  onSessionUpdate,
  onSessionComplete
}: SessionStartCompleteProps) {
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

  // Load session data
  useEffect(() => {
    if (sessionId) {
      loadSessionData()
    }
  }, [sessionId])

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

  const loadSessionData = async () => {
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load session data'
      setError(errorMessage)
      console.error('Error loading session data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notes,
          therapistComments: therapistComments
        })
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
      
      toast.success('Session started successfully')
      
      if (onSessionUpdate) {
        onSessionUpdate(result.data.session)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start session'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error starting session:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteSession = async () => {
    // Validate required fields
    const validationErrors = []
    
    if (sessionNotes.length > 2000) {
      validationErrors.push('Session notes cannot exceed 2000 characters')
    }
    
    if (therapistComments.length > 2000) {
      validationErrors.push('Therapist comments cannot exceed 2000 characters')
    }
    
    if (patientProgress.length > 1000) {
      validationErrors.push('Patient progress notes cannot exceed 1000 characters')
    }
    
    if (nextSessionRecommendations.length > 1000) {
      validationErrors.push('Next session recommendations cannot exceed 1000 characters')
    }
    
    if (actualDuration < 1 || actualDuration > 300) {
      validationErrors.push('Session duration must be between 1 and 300 minutes')
    }

    if (validationErrors.length > 0) {
      setShowValidationErrors(true)
      toast.error('Please fix validation errors before completing session')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actualDuration: actualDuration,
          sessionNotes: notes,
          therapistComments: therapistComments,
          patientProgress: patientProgress,
          nextSessionRecommendations: nextSessionRecommendations,
          sessionOutcome: sessionOutcome,
          patientSatisfaction: patientSatisfaction,
          therapistSatisfaction: therapistSatisfaction
        })
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
      
      toast.success('Session completed successfully')
      
      if (onSessionComplete) {
        onSessionComplete(result.data.session)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete session'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error completing session:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
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
  }

  const getProgressPercentage = () => {
    if (!session || !sessionStartTime) return 0
    const totalDuration = session.duration * 60 // Convert to seconds
    return Math.min((elapsedTime / totalDuration) * 100, 100)
  }

  const getTimeRemaining = () => {
    if (!session || !sessionStartTime) return 0
    const totalDuration = session.duration * 60 // Convert to seconds
    return Math.max(totalDuration - elapsedTime, 0)
  }

  if (loading && !session) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Loading session data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Session</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadSessionData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Session Not Found</h3>
        <p className="text-muted-foreground">
          The requested session could not be found.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Timer className="h-5 w-5 mr-2" />
                Session Management
              </CardTitle>
              <CardDescription>
                {session.patient.firstName} {session.patient.lastName} - {formatDateTime(session.scheduledDate)}
              </CardDescription>
            </div>
            <Badge className={getStatusColor(sessionStatus)}>
              {sessionStatus}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Patient</Label>
              <div className="text-sm">
                {session.patient.firstName} {session.patient.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {session.patient.email}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Therapist</Label>
              <div className="text-sm">
                {session.therapist.firstName} {session.therapist.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                {session.therapist.email}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Services</Label>
              <div className="text-sm">
                {session.services.map(s => s.name).join(', ')}
              </div>
              <div className="text-xs text-muted-foreground">
                ${session.services.reduce((total, service) => total + service.price, 0)} total
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timer and Progress */}
      {sessionStatus === 'in-progress' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Session Timer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Elapsed Time
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(getProgressPercentage())}%</span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">
                    {formatTime(getTimeRemaining())}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Time Remaining
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold">
                    {session.duration} min
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Scheduled Duration
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Session Notes
          </CardTitle>
          <CardDescription>
            Document session activities and observations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sessionNotes">Session Notes</Label>
              <Textarea
                id="sessionNotes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document what happened during the session..."
                rows={4}
                maxLength={2000}
                disabled={sessionStatus === 'completed'}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {notes.length}/2000 characters
              </div>
            </div>
            
            <div>
              <Label htmlFor="therapistComments">Therapist Comments</Label>
              <Textarea
                id="therapistComments"
                value={therapistComments}
                onChange={(e) => setTherapistComments(e.target.value)}
                placeholder="Add your professional observations and comments..."
                rows={3}
                maxLength={2000}
                disabled={sessionStatus === 'completed'}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {therapistComments.length}/2000 characters
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session Completion Form */}
      {sessionStatus === 'in-progress' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Session Completion
            </CardTitle>
            <CardDescription>
              Complete the session with final notes and assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="actualDuration">Actual Duration (minutes)</Label>
                  <Input
                    id="actualDuration"
                    type="number"
                    value={actualDuration}
                    onChange={(e) => setActualDuration(parseInt(e.target.value) || 0)}
                    min="1"
                    max="300"
                    placeholder="Enter actual session duration"
                  />
                </div>
                <div>
                  <Label htmlFor="sessionOutcome">Session Outcome</Label>
                  <Select value={sessionOutcome} onValueChange={setSessionOutcome}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="successful">Successful</SelectItem>
                      <SelectItem value="partial">Partially Successful</SelectItem>
                      <SelectItem value="challenging">Challenging</SelectItem>
                      <SelectItem value="cancelled_early">Cancelled Early</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="patientProgress">Patient Progress</Label>
                <Textarea
                  id="patientProgress"
                  value={patientProgress}
                  onChange={(e) => setPatientProgress(e.target.value)}
                  placeholder="Document patient progress and improvements..."
                  rows={3}
                  maxLength={1000}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {patientProgress.length}/1000 characters
                </div>
              </div>
              
              <div>
                <Label htmlFor="nextSessionRecommendations">Next Session Recommendations</Label>
                <Textarea
                  id="nextSessionRecommendations"
                  value={nextSessionRecommendations}
                  onChange={(e) => setNextSessionRecommendations(e.target.value)}
                  placeholder="Recommendations for the next session..."
                  rows={3}
                  maxLength={1000}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {nextSessionRecommendations.length}/1000 characters
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientSatisfaction">Patient Satisfaction (1-5)</Label>
                  <Select value={patientSatisfaction.toString()} onValueChange={(value) => setPatientSatisfaction(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Very Dissatisfied</SelectItem>
                      <SelectItem value="2">2 - Dissatisfied</SelectItem>
                      <SelectItem value="3">3 - Neutral</SelectItem>
                      <SelectItem value="4">4 - Satisfied</SelectItem>
                      <SelectItem value="5">5 - Very Satisfied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="therapistSatisfaction">Therapist Satisfaction (1-5)</Label>
                  <Select value={therapistSatisfaction.toString()} onValueChange={(value) => setTherapistSatisfaction(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Very Dissatisfied</SelectItem>
                      <SelectItem value="2">2 - Dissatisfied</SelectItem>
                      <SelectItem value="3">3 - Neutral</SelectItem>
                      <SelectItem value="4">4 - Satisfied</SelectItem>
                      <SelectItem value="5">5 - Very Satisfied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {showValidationErrors && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div>Please fix the following errors:</div>
              <ul className="list-disc list-inside text-sm">
                {notes.length > 2000 && <li>Session notes cannot exceed 2000 characters</li>}
                {therapistComments.length > 2000 && <li>Therapist comments cannot exceed 2000 characters</li>}
                {patientProgress.length > 1000 && <li>Patient progress notes cannot exceed 1000 characters</li>}
                {nextSessionRecommendations.length > 1000 && <li>Next session recommendations cannot exceed 1000 characters</li>}
                {(actualDuration < 1 || actualDuration > 300) && <li>Session duration must be between 1 and 300 minutes</li>}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4">
            {sessionStatus === 'scheduled' && (
              <Button 
                size="lg" 
                onClick={handleStartSession}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-5 w-5 mr-2" />
                Start Session
              </Button>
            )}
            
            {sessionStatus === 'in-progress' && (
              <Button 
                size="lg" 
                onClick={handleCompleteSession}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Stop className="h-5 w-5 mr-2" />
                Complete Session
              </Button>
            )}
            
            {sessionStatus === 'completed' && (
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">Session Completed</h3>
                <p className="text-muted-foreground">
                  Session completed on {sessionEndTime ? formatDateTime(sessionEndTime.toISOString()) : 'Unknown'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
