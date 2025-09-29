'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar,
  Clock,
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Stop,
  Timer,
  User,
  FileText,
  MessageSquare,
  Video,
  PhoneCall,
  Location,
  CalendarIcon,
  ClockIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
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
  Info,
  AlertTriangle,
  CheckSquare,
  Square,
  GripVertical,
  Move,
  Copy,
  RotateCcw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  specialties: Array<{
    id: string
    name: string
    description: string
  }>
}

interface Session {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: string
  sessionNotes?: string
  therapistComments?: string
  patient: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  services: Array<{
    id: string
    name: string
    description: string
    price: number
  }>
}

interface WeekDay {
  date: string
  dayName: string
  dayNumber: number
}

interface Availability {
  startTime: string
  endTime: string
  breakStartTime?: string
  breakEndTime?: string
  maxSessionsPerDay: number
  sessionDuration: number
  bufferTime: number
}

interface WeeklyAgendaViewProps {
  therapistId: string
  onSessionSelect?: (session: Session) => void
  onSessionUpdate?: (session: Session) => void
  onSessionDelete?: (session: Session) => void
  onSessionCreate?: (session: Session) => void
}

export function WeeklyAgendaView({
  therapistId,
  onSessionSelect,
  onSessionUpdate,
  onSessionDelete,
  onSessionCreate
}: WeeklyAgendaViewProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
  const [sessions, setSessions] = useState<Record<string, Session[]>>({})
  const [availability, setAvailability] = useState<Record<string, Availability>>({})
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date())
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [showSessionDialog, setShowSessionDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)
  const [conflicts, setConflicts] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])

  // Load weekly agenda data
  useEffect(() => {
    loadWeeklyAgenda()
  }, [therapistId, currentWeekStart])

  const loadWeeklyAgenda = async () => {
    try {
      setLoading(true)
      setError(null)

      const weekStart = getWeekStart(currentWeekStart)
      const params = new URLSearchParams()
      params.append('therapistId', therapistId)
      params.append('weekStart', weekStart.toISOString().split('T')[0])
      params.append('includeSessions', 'true')
      params.append('includeAvailability', 'true')
      params.append('includeConflicts', 'true')

      const response = await fetch(`/api/therapist/weekly-agenda?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load weekly agenda')
      }

      setTherapist(result.data.therapist)
      setWeekDays(result.data.week.days)
      setSessions(result.data.sessions || {})
      setAvailability(result.data.availability || {})
      setConflicts(result.data.conflicts || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load weekly agenda'
      setError(errorMessage)
      console.error('Error loading weekly agenda:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleWeekNavigation = (direction: 'prev' | 'next') => {
    const newWeekStart = new Date(currentWeekStart)
    newWeekStart.setDate(newWeekStart.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeekStart(newWeekStart)
  }

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session)
    setEditingSession(session)
    setShowSessionDialog(true)
  }

  const handleCreateSession = (date: string, time: string) => {
    setEditingSession(null)
    setShowCreateDialog(true)
    // Pre-fill date and time for new session
  }

  const handleSessionUpdate = async (sessionData: Partial<Session>) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/weekly-agenda', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: selectedSession?.id,
          ...sessionData
        })
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409 && result.conflicts) {
          setConflicts(result.conflicts)
          setSuggestions(result.suggestions)
          toast.error('Session conflicts detected. Please review and resolve conflicts.')
          return
        }
        throw new Error(result.error || 'Failed to update session')
      }

      toast.success('Session updated successfully')
      setShowSessionDialog(false)
      setSelectedSession(null)
      setEditingSession(null)
      loadWeeklyAgenda()
      
      if (onSessionUpdate) {
        onSessionUpdate(result.data.session)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update session'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error updating session:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSessionDelete = async (session: Session) => {
    if (!confirm(`Are you sure you want to delete the session with ${session.patient.firstName} ${session.patient.lastName}?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist/weekly-agenda?sessionId=${session.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete session')
      }

      toast.success('Session deleted successfully')
      setShowSessionDialog(false)
      setSelectedSession(null)
      loadWeeklyAgenda()
      
      if (onSessionDelete) {
        onSessionDelete(session)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete session'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error deleting session:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'no-show':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'scheduled':
        return <Clock className="h-4 w-4" />
      case 'cancelled':
        return <XCircle className="h-4 w-4" />
      case 'in-progress':
        return <Play className="h-4 w-4" />
      case 'no-show':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const generateTimeSlots = (dayAvailability?: Availability) => {
    if (!dayAvailability) return []
    
    const slots = []
    const startTime = timeToMinutes(dayAvailability.startTime)
    const endTime = timeToMinutes(dayAvailability.endTime)
    const sessionDuration = dayAvailability.sessionDuration
    const bufferTime = dayAvailability.bufferTime
    
    for (let time = startTime; time < endTime; time += (sessionDuration + bufferTime)) {
      slots.push(minutesToTime(time))
    }
    
    return slots
  }

  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  const getWeekStart = (date: Date): Date => {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(date.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Loading weekly agenda...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Agenda</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadWeeklyAgenda}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Weekly Agenda - {therapist?.firstName} {therapist?.lastName}
              </CardTitle>
              <CardDescription>
                Manage your weekly schedule and sessions
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadWeeklyAgenda}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Session
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWeekNavigation('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[200px] text-center">
                  Week of {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWeekNavigation('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {therapist?.specialties.map((specialty) => (
                <Badge key={specialty.id} variant="outline" className="text-xs">
                  {specialty.name}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Calendar */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const daySessions = sessions[day.date] || []
          const dayAvailability = availability[day.date]
          const timeSlots = generateTimeSlots(dayAvailability)
          
          return (
            <Card key={day.date} className="min-h-[600px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-center">
                  <div className="text-lg font-semibold">{day.dayName}</div>
                  <div className="text-2xl font-bold text-primary">{day.dayNumber}</div>
                </CardTitle>
                <CardDescription className="text-center">
                  {daySessions.length} sessions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Time Slots */}
                {dayAvailability ? (
                  <div className="space-y-1">
                    {timeSlots.map((timeSlot) => {
                      const hasSession = daySessions.some(session => session.scheduledTime === timeSlot)
                      
                      return (
                        <div
                          key={timeSlot}
                          className={`p-2 border rounded text-xs cursor-pointer transition-colors ${
                            hasSession 
                              ? 'bg-blue-50 border-blue-200' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => !hasSession && handleCreateSession(day.date, timeSlot)}
                        >
                          <div className="font-medium">{formatTime(timeSlot)}</div>
                          {hasSession ? (
                            <div className="text-blue-600">Session</div>
                          ) : (
                            <div className="text-gray-500">Available</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-sm text-muted-foreground">No working hours</div>
                  </div>
                )}

                {/* Sessions */}
                <div className="space-y-2 mt-4">
                  {daySessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${getStatusColor(session.status)}`}
                      onClick={() => handleSessionClick(session)}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(session.status)}
                        <span className="font-medium text-sm">
                          {formatTime(session.scheduledTime)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {session.duration}m
                        </Badge>
                      </div>
                      <div className="text-sm font-medium">
                        {session.patient.firstName} {session.patient.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {session.services.map(s => s.name).join(', ')}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Session Details Dialog */}
      <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Session Details
            </DialogTitle>
            <DialogDescription>
              View and manage session information
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Patient</Label>
                  <div className="text-sm">
                    {selectedSession.patient.firstName} {selectedSession.patient.lastName}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Time</Label>
                  <div className="text-sm">
                    {formatTime(selectedSession.scheduledTime)} ({selectedSession.duration} min)
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedSession.status)}>
                    {selectedSession.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Services</Label>
                  <div className="text-sm">
                    {selectedSession.services.map(s => s.name).join(', ')}
                  </div>
                </div>
              </div>

              {/* Patient Contact */}
              <div>
                <Label className="text-sm font-medium">Patient Contact</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedSession.patient.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedSession.patient.phone}</span>
                  </div>
                </div>
              </div>

              {/* Session Notes */}
              {selectedSession.sessionNotes && (
                <div>
                  <Label className="text-sm font-medium">Session Notes</Label>
                  <div className="text-sm mt-1 p-3 bg-muted rounded">
                    {selectedSession.sessionNotes}
                  </div>
                </div>
              )}

              {/* Therapist Comments */}
              {selectedSession.therapistComments && (
                <div>
                  <Label className="text-sm font-medium">Therapist Comments</Label>
                  <div className="text-sm mt-1 p-3 bg-muted rounded">
                    {selectedSession.therapistComments}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handleSessionDelete(selectedSession)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button onClick={() => setShowSessionDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Session Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Create New Session
            </DialogTitle>
            <DialogDescription>
              Schedule a new therapy session
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Session Creation</h3>
              <p className="text-muted-foreground">
                Session creation form would be implemented here with patient selection, service selection, and scheduling options.
              </p>
            </div>
            
            <div className="flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowCreateDialog(false)}>
                Create Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Conflict Display */}
      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div>Session conflicts detected:</div>
              {conflicts.map((conflict, index) => (
                <div key={index} className="text-sm">
                  • {conflict.conflictType}: {conflict.scheduledTime}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestions Display */}
      {suggestions.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div>Suggestions to resolve conflicts:</div>
              {suggestions.map((suggestion, index) => (
                <div key={index} className="text-sm">
                  • {suggestion.message}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
