'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Clock, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  X,
  AlertTriangle,
  RefreshCw,
  Filter,
  Search,
  Users,
  CalendarDays,
  Timer,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

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

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isPast: boolean
  sessions: Session[]
}

interface AdvancedSessionCalendarProps {
  therapistId?: string
  patientId?: string
  serviceAssignmentId?: string
  onSessionSelect?: (session: Session) => void
  onSessionCreate?: () => void
  readOnly?: boolean
}

const SESSION_STATUS_COLORS = {
  SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  NO_SHOW: 'bg-gray-100 text-gray-800 border-gray-200'
}

const SESSION_STATUS_ICONS = {
  SCHEDULED: Clock,
  IN_PROGRESS: Play,
  COMPLETED: CheckCircle,
  CANCELLED: X,
  NO_SHOW: AlertTriangle
}

export function AdvancedSessionCalendar({
  therapistId,
  patientId,
  serviceAssignmentId,
  onSessionSelect,
  onSessionCreate,
  readOnly = false
}: AdvancedSessionCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Load sessions for current month
  const loadSessions = useCallback(async (month: Date) => {
    try {
      setLoading(true)
      setError(null)

      const startDate = new Date(month.getFullYear(), month.getMonth(), 1)
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0)

      const params = new URLSearchParams()
      params.append('dateFrom', startDate.toISOString())
      params.append('dateTo', endDate.toISOString())
      if (therapistId) params.append('therapistId', therapistId)
      if (patientId) params.append('patientId', patientId)
      if (serviceAssignmentId) params.append('serviceAssignmentId', serviceAssignmentId)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/sessions?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load sessions')
      }

      setSessions(result.sessions || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions'
      setError(errorMessage)
      console.error('Error loading sessions:', err)
    } finally {
      setLoading(false)
    }
  }, [therapistId, patientId, serviceAssignmentId, statusFilter])

  // Load sessions when dependencies change
  useEffect(() => {
    loadSessions(currentMonth)
  }, [currentMonth, loadSessions])

  // Generate calendar days
  const generateCalendarDays = (month: Date): CalendarDay[] => {
    const year = month.getFullYear()
    const monthNum = month.getMonth()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const firstDay = new Date(year, monthNum, 1)
    const lastDay = new Date(year, monthNum + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday

    const days: CalendarDay[] = []

    // Generate 42 days (6 weeks) to fill the calendar
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      const isCurrentMonth = currentDate.getMonth() === monthNum
      const isToday = currentDate.getTime() === today.getTime()
      const isPast = currentDate < today

      // Get sessions for this date
      const dateString = currentDate.toISOString().split('T')[0]
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.scheduledDate).toISOString().split('T')[0]
        return sessionDate === dateString
      })

      days.push({
        date: currentDate,
        isCurrentMonth,
        isToday,
        isPast,
        sessions: daySessions
      })
    }

    return days
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getSessionStatusIcon = (status: Session['status']) => {
    const IconComponent = SESSION_STATUS_ICONS[status]
    return <IconComponent className="h-3 w-3" />
  }

  const getSessionStatusColor = (status: Session['status']) => {
    return SESSION_STATUS_COLORS[status]
  }

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session)
    if (onSessionSelect) {
      onSessionSelect(session)
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  const filteredSessions = sessions.filter(session => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        session.patient.firstName.toLowerCase().includes(search) ||
        session.patient.lastName.toLowerCase().includes(search) ||
        session.therapist.firstName.toLowerCase().includes(search) ||
        session.therapist.lastName.toLowerCase().includes(search) ||
        session.serviceAssignment.service.name.toLowerCase().includes(search)
      )
    }
    return true
  })

  const calendarDays = generateCalendarDays(currentMonth)

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading sessions...</span>
        </CardContent>
      </Card>
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
                Session Calendar
              </CardTitle>
              <CardDescription>
                Manage and view therapy sessions
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {!readOnly && (
                <Button onClick={onSessionCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters and Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Patient, therapist, service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="view-mode">View</Label>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Actions</Label>
              <div className="flex space-x-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadSessions(currentMonth)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
              disabled={loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <h2 className="text-xl font-semibold">
              {currentMonth.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
              disabled={loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => loadSessions(currentMonth)}
              className="ml-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 gap-px bg-border">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {calendarDays.map((day, index) => (
              <motion.div
                key={day.date.toISOString()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className={`
                  min-h-[120px] p-2 border-r border-b border-border bg-background
                  ${!day.isCurrentMonth ? 'bg-muted/50' : ''}
                  ${day.isToday ? 'bg-primary/5 border-primary' : ''}
                  ${day.isPast && day.isCurrentMonth ? 'opacity-60' : ''}
                `}
                onClick={() => handleDateClick(day.date)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`
                    text-sm font-medium
                    ${day.isToday ? 'text-primary font-bold' : ''}
                    ${!day.isCurrentMonth ? 'text-muted-foreground' : ''}
                  `}>
                    {day.date.getDate()}
                  </span>
                  {day.sessions.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {day.sessions.length}
                    </Badge>
                  )}
                </div>
                
                {/* Sessions */}
                <div className="space-y-1">
                  {day.sessions.slice(0, 3).map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`
                        p-1 rounded text-xs cursor-pointer transition-colors
                        ${getSessionStatusColor(session.status)}
                        hover:opacity-80
                      `}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSessionClick(session)
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        {getSessionStatusIcon(session.status)}
                        <span className="truncate">
                          {formatTime(session.scheduledTime)}
                        </span>
                      </div>
                      <div className="truncate font-medium">
                        {session.patient.firstName} {session.patient.lastName}
                      </div>
                      <div className="truncate text-xs opacity-75">
                        {session.serviceAssignment.service.name}
                      </div>
                    </motion.div>
                  ))}
                  
                  {day.sessions.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{day.sessions.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session Details Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Session Details</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSession(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                {/* Session Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Patient</Label>
                    <p className="text-sm">
                      {selectedSession.patient.firstName} {selectedSession.patient.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Therapist</Label>
                    <p className="text-sm">
                      {selectedSession.therapist.firstName} {selectedSession.therapist.lastName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Service</Label>
                    <p className="text-sm">{selectedSession.serviceAssignment.service.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getSessionStatusColor(selectedSession.status)}>
                      {selectedSession.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date & Time</Label>
                    <p className="text-sm">
                      {new Date(selectedSession.scheduledDate).toLocaleDateString()} at {formatTime(selectedSession.scheduledTime)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Duration</Label>
                    <p className="text-sm">{selectedSession.duration} minutes</p>
                  </div>
                </div>

                {/* Session Notes */}
                {selectedSession.sessionNotes && (
                  <div>
                    <Label className="text-sm font-medium">Session Notes</Label>
                    <p className="text-sm mt-1">{selectedSession.sessionNotes}</p>
                  </div>
                )}

                {/* Therapist Comments */}
                {selectedSession.therapistComments && (
                  <div>
                    <Label className="text-sm font-medium">Therapist Comments</Label>
                    <p className="text-sm mt-1">{selectedSession.therapistComments}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Eye className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">
                        {selectedSession.parentVisible ? 'Visible to parent' : 'Internal only'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Reschedule Info */}
                {selectedSession.rescheduleReason && (
                  <div>
                    <Label className="text-sm font-medium">Reschedule Reason</Label>
                    <p className="text-sm mt-1">{selectedSession.rescheduleReason}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
