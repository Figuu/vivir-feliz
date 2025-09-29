'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Reset,
  Users
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SessionStartComplete } from '@/components/sessions/session-start-complete'
import { useSessionStartComplete } from '@/hooks/use-session-start-complete'

export default function SessionStartCompletePage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [sessions, setSessions] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('interface')
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('')
  const [therapists, setTherapists] = useState<any[]>([])
  
  const { 
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
  } = useSessionStartComplete()

  // Load therapists list
  useEffect(() => {
    loadTherapists()
  }, [])

  // Load sessions when therapist is selected
  useEffect(() => {
    if (selectedTherapistId) {
      loadSessions()
    }
  }, [selectedTherapistId])

  // Load session data when session is selected
  useEffect(() => {
    if (selectedSessionId) {
      loadSessionData(selectedSessionId)
    }
  }, [selectedSessionId, loadSessionData])

  const loadTherapists = async () => {
    try {
      const response = await fetch('/api/therapist/profile?limit=100')
      const result = await response.json()
      if (response.ok) {
        setTherapists(result.data.therapists)
        // Auto-select first therapist if available
        if (result.data.therapists.length > 0) {
          setSelectedTherapistId(result.data.therapists[0].id)
        }
      }
    } catch (err) {
      console.error('Error loading therapists:', err)
    }
  }

  const loadSessions = async () => {
    try {
      const response = await fetch(`/api/sessions?therapistId=${selectedTherapistId}&status=scheduled,in-progress&limit=50`)
      const result = await response.json()
      if (response.ok) {
        setSessions(result.data.sessions)
        // Auto-select first session if available
        if (result.data.sessions.length > 0) {
          setSelectedSessionId(result.data.sessions[0].id)
        }
      }
    } catch (err) {
      console.error('Error loading sessions:', err)
    }
  }

  const handleSessionUpdate = (updatedSession: any) => {
    console.log('Session updated:', updatedSession)
    // Refresh the sessions list
    loadSessions()
  }

  const handleSessionComplete = (completedSession: any) => {
    console.log('Session completed:', completedSession)
    // Refresh the sessions list
    loadSessions()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Start/Complete Interface</h1>
          <p className="text-muted-foreground">
            Comprehensive session management with time tracking and notes validation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadSessions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Therapist and Session Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Select Session
          </CardTitle>
          <CardDescription>
            Choose a therapist and session to manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Therapist</label>
              <Select value={selectedTherapistId} onValueChange={setSelectedTherapistId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a therapist" />
                </SelectTrigger>
                <SelectContent>
                  {therapists.map((therapist) => (
                    <SelectItem key={therapist.id} value={therapist.id}>
                      {therapist.firstName} {therapist.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Session</label>
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {session.patient.firstName} {session.patient.lastName} - {formatDate(session.scheduledDate)} {formatTime(session.scheduledTime)}
                        </span>
                        <Badge className={`ml-2 ${getSessionStatusColor(session.status)}`}>
                          {session.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="interface">Session Interface</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="interface" className="space-y-4">
          {selectedSessionId ? (
            <SessionStartComplete
              sessionId={selectedSessionId}
              onSessionUpdate={handleSessionUpdate}
              onSessionComplete={handleSessionComplete}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Session Selected</h3>
                <p className="text-muted-foreground">
                  Select a session from the dropdown above to start managing it.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {session && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Session Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Session Statistics
                  </CardTitle>
                  <CardDescription>
                    Current session performance and metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Scheduled Duration</div>
                          <div className="text-sm text-muted-foreground">Planned session time</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{session.duration}m</div>
                        <div className="text-sm text-muted-foreground">minutes</div>
                      </div>
                    </div>
                    
                    {sessionStatus === 'in-progress' && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-yellow-100">
                            <Timer className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <div className="font-medium">Elapsed Time</div>
                            <div className="text-sm text-muted-foreground">Current session time</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{formatTime(elapsedTime)}</div>
                          <div className="text-sm text-muted-foreground">elapsed</div>
                        </div>
                      </div>
                    )}
                    
                    {sessionStatus === 'completed' && session.actualDuration && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-green-100">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">Actual Duration</div>
                            <div className="text-sm text-muted-foreground">Completed session time</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{session.actualDuration}m</div>
                          <div className="text-sm text-muted-foreground">
                            {session.actualDuration - session.duration > 0 ? '+' : ''}{session.actualDuration - session.duration}m vs planned
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-purple-100">
                          <DollarSign className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">Session Revenue</div>
                          <div className="text-sm text-muted-foreground">Total session value</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          ${session.services.reduce((total, service) => total + service.price, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">revenue</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session Progress */}
              {sessionStatus === 'in-progress' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Session Progress
                    </CardTitle>
                    <CardDescription>
                      Real-time session progress and timing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary">
                          {Math.round(getProgressPercentage())}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Session Progress
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Time Remaining</span>
                          <span>{formatTime(getTimeRemaining())}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.min(getProgressPercentage(), 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold">
                            {sessionStartTime ? formatDateTime(sessionStartTime.toISOString()) : 'Not started'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Start Time
                          </div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold">
                            {estimatedEndTime ? formatDateTime(estimatedEndTime.toISOString()) : 'Not calculated'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Estimated End
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="h-5 w-5 mr-2" />
                  Session Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Start/complete workflow</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Real-time timer tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Session status management</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Progress visualization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Notes & Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Session notes with length limits</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Therapist comments</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Patient progress tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Validation and error handling</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analytics & Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Time tracking accuracy</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Session completion rates</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Satisfaction ratings</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Performance metrics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Feature Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Session Start/Complete Overview
              </CardTitle>
              <CardDescription>
                Comprehensive session management with time tracking and validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Session Management Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Start/complete workflow with validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Real-time timer with progress tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Session status management</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Time validation and accuracy</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Progress visualization</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Notes & Validation Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Session notes with character limits</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Therapist comments and observations</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Patient progress documentation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Next session recommendations</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Satisfaction ratings and outcomes</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
