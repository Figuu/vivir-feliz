'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar,
  Clock,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Settings,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Download,
  Upload,
  BarChart3,
  List,
  Grid,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Bell,
  Star,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Play,
  Label
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface Session {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULE_REQUESTED'
  patient: {
    id: string
    firstName: string
    lastName: string
    parent?: {
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
      color?: string
    }
  }
  sessionNotes?: string
  therapistComments?: string
}

interface RoleBasedCalendarProps {
  userRole: 'ADMIN' | 'THERAPIST' | 'PARENT' | 'PATIENT'
  userId?: string
  viewMode?: 'month' | 'week' | 'day' | 'agenda'
  onSessionSelect?: (session: Session) => void
  onSessionCreate?: () => void
  onSessionEdit?: (session: Session) => void
  onSessionDelete?: (session: Session) => void
}

export function RoleBasedCalendar({
  userRole,
  userId,
  viewMode = 'month',
  onSessionSelect,
  onSessionCreate,
  onSessionEdit,
  onSessionDelete
}: RoleBasedCalendarProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    therapist: '',
    service: '',
    search: ''
  })
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>(viewMode)

  // Load sessions based on role
  useEffect(() => {
    loadSessions()
  }, [userRole, userId, currentDate, filters])

  const loadSessions = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('role', userRole)
      if (userId) params.append('userId', userId)
      params.append('date', currentDate.toISOString())
      if (filters.status) params.append('status', filters.status)
      if (filters.therapist) params.append('therapistId', filters.therapist)
      if (filters.service) params.append('serviceId', filters.service)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/sessions/calendar?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load sessions')
      }

      setSessions(result.data.sessions)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions'
      setError(errorMessage)
      console.error('Error loading sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        break
    }
    
    setCurrentDate(newDate)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session)
    if (onSessionSelect) {
      onSessionSelect(session)
    }
  }

  const handleSessionAction = async (session: Session, action: string) => {
    try {
      switch (action) {
        case 'edit':
          if (onSessionEdit) {
            onSessionEdit(session)
          }
          break
        case 'delete':
          if (onSessionDelete) {
            onSessionDelete(session)
          }
          break
        case 'confirm':
          await confirmSession(session.id)
          break
        case 'cancel':
          await cancelSession(session.id)
          break
        case 'start':
          await startSession(session.id)
          break
        case 'complete':
          await completeSession(session.id)
          break
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action} session`
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error(`Error ${action}ing session:`, err)
    }
  }

  const confirmSession = async (sessionId: string) => {
    const response = await fetch(`/api/sessions/${sessionId}/confirm`, {
      method: 'POST'
    })
    
    if (!response.ok) {
      throw new Error('Failed to confirm session')
    }
    
    toast({
        title: "Success",
        description: 'Session confirmed successfully'
      })
    loadSessions()
  }

  const cancelSession = async (sessionId: string) => {
    const response = await fetch(`/api/sessions/${sessionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Cancelled by user' })
    })
    
    if (!response.ok) {
      throw new Error('Failed to cancel session')
    }
    
    toast({
        title: "Success",
        description: 'Session cancelled successfully'
      })
    loadSessions()
  }

  const startSession = async (sessionId: string) => {
    const response = await fetch(`/api/sessions/${sessionId}/start`, {
      method: 'POST'
    })
    
    if (!response.ok) {
      throw new Error('Failed to start session')
    }
    
    toast({
        title: "Success",
        description: 'Session started successfully'
      })
    loadSessions()
  }

  const completeSession = async (sessionId: string) => {
    const response = await fetch(`/api/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        therapistComments: 'Session completed successfully',
        sessionNotes: 'Session completed as scheduled'
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to complete session')
    }
    
    toast({
        title: "Success",
        description: 'Session completed successfully'
      })
    loadSessions()
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'NO_SHOW':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'RESCHEDULE_REQUESTED':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleSpecificActions = (session: Session) => {
    const actions = []

    switch (userRole) {
      case 'ADMIN':
        actions.push(
          { id: 'edit', label: 'Edit', icon: Edit, variant: 'outline' },
          { id: 'delete', label: 'Delete', icon: Trash2, variant: 'destructive' }
        )
        if (session.status === 'SCHEDULED') {
          actions.push({ id: 'confirm', label: 'Confirm', icon: CheckCircle, variant: 'default' })
        }
        if (session.status === 'CONFIRMED') {
          actions.push({ id: 'start', label: 'Start', icon: Play, variant: 'default' })
        }
        if (session.status === 'IN_PROGRESS') {
          actions.push({ id: 'complete', label: 'Complete', icon: CheckCircle, variant: 'default' })
        }
        break

      case 'THERAPIST':
        if (session.therapist.id === userId) {
          if (session.status === 'CONFIRMED') {
            actions.push({ id: 'start', label: 'Start', icon: Play, variant: 'default' })
          }
          if (session.status === 'IN_PROGRESS') {
            actions.push({ id: 'complete', label: 'Complete', icon: CheckCircle, variant: 'default' })
          }
          actions.push({ id: 'edit', label: 'Edit', icon: Edit, variant: 'outline' })
        }
        break

      case 'PARENT':
      case 'PATIENT':
        if (session.patient.id === userId || session.patient.parent?.id === userId) {
          if (session.status === 'SCHEDULED') {
            actions.push({ id: 'confirm', label: 'Confirm', icon: CheckCircle, variant: 'default' })
          }
          actions.push({ id: 'cancel', label: 'Cancel', icon: X, variant: 'destructive' })
        }
        break
    }

    return actions
  }

  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDay = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.scheduledDate)
        return sessionDate.toDateString() === currentDay.toDateString()
      })
      
      days.push({
        date: new Date(currentDay),
        sessions: daySessions,
        isCurrentMonth: currentDay.getMonth() === month,
        isToday: currentDay.toDateString() === new Date().toDateString()
      })
      
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.01 }}
            className={`min-h-[120px] p-2 border rounded-lg ${
              day.isCurrentMonth ? 'bg-background' : 'bg-muted/50'
            } ${day.isToday ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedDate(day.date)}
          >
            <div className={`text-sm font-medium mb-1 ${
              day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {day.date.getDate()}
            </div>
            <div className="space-y-1">
              {day.sessions.slice(0, 3).map(session => (
                <div
                  key={session.id}
                  className={`text-xs p-1 rounded cursor-pointer truncate ${
                    session.serviceAssignment.service.color || 'bg-blue-100 text-blue-800'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSessionClick(session)
                  }}
                >
                  {formatTime(session.scheduledTime)} - {session.patient.firstName}
                </div>
              ))}
              {day.sessions.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{day.sessions.length - 3} more
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.scheduledDate)
        return sessionDate.toDateString() === day.toDateString()
      })
      
      days.push({
        date: new Date(day),
        sessions: daySessions
      })
    }

    return (
      <div className="grid grid-cols-7 gap-4">
        {days.map((day, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="text-center mb-4">
              <div className="text-sm font-medium text-muted-foreground">
                {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-lg font-semibold">
                {day.date.getDate()}
              </div>
            </div>
            <div className="space-y-2">
              {day.sessions.map(session => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 border rounded cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSessionClick(session)}
                >
                  <div className="text-sm font-medium">
                    {formatTime(session.scheduledTime)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {userRole === 'THERAPIST' ? session.patient.firstName : session.therapist.firstName}
                  </div>
                  <Badge className={`text-xs ${getStatusColor(session.status)}`}>
                    {session.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderDayView = () => {
    const daySessions = sessions.filter(session => {
      const sessionDate = new Date(session.scheduledDate)
      return sessionDate.toDateString() === currentDate.toDateString()
    }).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">
            {currentDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h2>
        </div>
        <div className="space-y-3">
          {daySessions.map(session => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
              onClick={() => handleSessionClick(session)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-lg font-semibold">
                    {formatTime(session.scheduledTime)}
                  </div>
                  <div>
                    <div className="font-medium">
                      {userRole === 'THERAPIST' 
                        ? `${session.patient.firstName} ${session.patient.lastName}`
                        : `${session.therapist.firstName} ${session.therapist.lastName}`
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.serviceAssignment.service.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(session.status)}>
                    {session.status}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {session.duration} min
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {daySessions.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions scheduled</h3>
              <p className="text-muted-foreground">
                No sessions are scheduled for this day.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderAgendaView = () => {
    const sortedSessions = sessions
      .sort((a, b) => {
        const dateA = new Date(`${a.scheduledDate}T${a.scheduledTime}`)
        const dateB = new Date(`${b.scheduledDate}T${b.scheduledTime}`)
        return dateA.getTime() - dateB.getTime()
      })

    return (
      <div className="space-y-4">
        {sortedSessions.map(session => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
            onClick={() => handleSessionClick(session)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-sm font-medium">
                    {new Date(session.scheduledDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="text-lg font-semibold">
                    {formatTime(session.scheduledTime)}
                  </div>
                </div>
                <div>
                  <div className="font-medium">
                    {userRole === 'THERAPIST' 
                      ? `${session.patient.firstName} ${session.patient.lastName}`
                      : `${session.therapist.firstName} ${session.therapist.lastName}`
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {session.serviceAssignment.service.name}
                  </div>
                  {session.sessionNotes && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {session.sessionNotes}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(session.status)}>
                  {session.status}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {session.duration} min
                </div>
                <div className="flex space-x-1">
                  {getRoleSpecificActions(session).map(action => (
                    <Button
                      key={action.id}
                      size="sm"
                      variant={action.variant as any}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSessionAction(session, action.id)
                      }}
                    >
                      <action.icon className="h-3 w-3" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {sortedSessions.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
            <p className="text-muted-foreground">
              No sessions match your current filters.
            </p>
          </div>
        )}
      </div>
    )
  }

  const renderView = () => {
    switch (view) {
      case 'month':
        return renderMonthView()
      case 'week':
        return renderWeekView()
      case 'day':
        return renderDayView()
      case 'agenda':
        return renderAgendaView()
      default:
        return renderMonthView()
    }
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
                Session Calendar - {userRole}
              </CardTitle>
              <CardDescription>
                Manage and view therapy sessions
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadSessions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              {(userRole === 'ADMIN' || userRole === 'THERAPIST') && (
                <Button size="sm" onClick={onSessionCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Session
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* View Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateChange('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDateChange('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="ml-4 text-lg font-semibold">
                {view === 'month' && currentDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
                {view === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}`}
                {view === 'day' && currentDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
                {view === 'agenda' && 'All Sessions'}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select value={view} onValueChange={(value: any) => setView(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="agenda">Agenda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="NO_SHOW">No Show</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading sessions...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Sessions</h3>
              <p className="text-muted-foreground">{error}</p>
              <Button className="mt-4" onClick={loadSessions}>
                Try Again
              </Button>
            </div>
          ) : (
            renderView()
          )}
        </CardContent>
      </Card>

      {/* Session Details Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background p-6 rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Session Details</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSession(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Badge className={getStatusColor(selectedSession.status)}>
                      {selectedSession.status}
                    </Badge>
                  </div>
                </div>
                
                {selectedSession.sessionNotes && (
                  <div>
                    <Label className="text-sm font-medium">Session Notes</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedSession.sessionNotes}
                    </p>
                  </div>
                )}
                
                {selectedSession.therapistComments && (
                  <div>
                    <Label className="text-sm font-medium">Therapist Comments</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedSession.therapistComments}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  {getRoleSpecificActions(selectedSession).map(action => (
                    <Button
                      key={action.id}
                      variant={action.variant as any}
                      onClick={() => {
                        handleSessionAction(selectedSession, action.id)
                        setSelectedSession(null)
                      }}
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
