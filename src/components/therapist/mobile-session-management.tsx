'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar,
  Clock,
  Play,
  Pause,
  Stop,
  CheckCircle,
  X,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  User,
  MessageSquare,
  FileText,
  Timer,
  AlertCircle,
  Info,
  Edit,
  Save,
  Trash2,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Maximize,
  Minimize,
  ExternalLink,
  Link,
  Share,
  Bookmark,
  Flag,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  Percent,
  Home,
  Settings,
  Bell,
  Menu,
  X as XIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  MoreVertical as MoreVerticalIcon,
  Home as HomeIcon,
  User as UserIcon,
  MessageSquare as MessageSquareIcon,
  FileText as FileTextIcon,
  Timer as TimerIcon,
  AlertCircle as AlertCircleIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Trash2 as Trash2Icon,
  RefreshCw as RefreshCwIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  ExternalLink as ExternalLinkIcon,
  Link as LinkIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  Flag as FlagIcon,
  Tag as TagIcon,
  Hash as HashIcon,
  AtSign as AtSignIcon,
  DollarSign as DollarSignIcon,
  Percent as PercentIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  CheckCircle as CheckCircleIcon,
  X as XIcon2,
  Plus as PlusIcon2,
  Search as SearchIcon2,
  Filter as FilterIcon2,
  ChevronLeft as ChevronLeftIcon2,
  ChevronRight as ChevronRightIcon2,
  MoreVertical as MoreVerticalIcon2,
  User as UserIcon2,
  MessageSquare as MessageSquareIcon2,
  FileText as FileTextIcon2,
  Timer as TimerIcon2,
  AlertCircle as AlertCircleIcon2,
  Info as InfoIcon2,
  Edit as EditIcon2,
  Save as SaveIcon2,
  Trash2 as Trash2Icon2,
  RefreshCw as RefreshCwIcon2,
  ArrowLeft as ArrowLeftIcon2,
  ArrowRight as ArrowRightIcon2,
  ArrowUp as ArrowUpIcon2,
  ArrowDown as ArrowDownIcon2,
  Maximize as MaximizeIcon2,
  Minimize as MinimizeIcon2,
  ExternalLink as ExternalLinkIcon2,
  Link as LinkIcon2,
  Share as ShareIcon2,
  Bookmark as BookmarkIcon2,
  Flag as FlagIcon2,
  Tag as TagIcon2,
  Hash as HashIcon2,
  AtSign as AtSignIcon2,
  DollarSign as DollarSignIcon2,
  Percent as PercentIcon2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface MobileSessionManagementProps {
  therapistId?: string
  onSessionUpdate?: (session: any) => void
  onSessionStart?: (sessionId: string) => void
  onSessionComplete?: (sessionId: string) => void
}

export function MobileSessionManagement({
  therapistId,
  onSessionUpdate,
  onSessionStart,
  onSessionComplete
}: MobileSessionManagementProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('today')
  const [sessions, setSessions] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState<any | null>(null)
  const [showSessionDetails, setShowSessionDetails] = useState(false)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sessionForm, setSessionForm] = useState({
    patientId: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    notes: '',
    serviceId: ''
  })
  const [sessionNotes, setSessionNotes] = useState('')
  const [sessionTimer, setSessionTimer] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)

  // Load sessions
  useEffect(() => {
    if (therapistId) {
      loadSessions()
    }
  }, [therapistId, currentDate, statusFilter])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning) {
      interval = setInterval(() => {
        setSessionTimer(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning])

  const loadSessions = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (therapistId) params.append('therapistId', therapistId)
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      params.append('date', currentDate.toISOString().split('T')[0])

      const response = await fetch(`/api/sessions?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load sessions')
      }

      setSessions(result.data.sessions || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load sessions'
      setError(errorMessage)
      console.error('Error loading sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSessionAction = async (sessionId: string, action: 'start' | 'complete' | 'cancel') => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/sessions/${sessionId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: sessionNotes,
          duration: sessionTimer
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} session`)
      }

      toast({
        title: "Success",
        description: `Session ${action}ed successfully`
      })
      
      if (action === 'start') {
        setIsTimerRunning(true)
        if (onSessionStart) onSessionStart(sessionId)
      } else if (action === 'complete') {
        setIsTimerRunning(false)
        if (onSessionComplete) onSessionComplete(sessionId)
      }

      loadSessions()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action} session`
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error(`Error ${action}ing session:`, err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async () => {
    if (!sessionForm.patientId || !sessionForm.scheduledDate || !sessionForm.scheduledTime) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please fill in all required fields'
      })
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...sessionForm,
          therapistId
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create session')
      }

      toast({
        title: "Success",
        description: 'Session created successfully'
      })
      setShowSessionForm(false)
      setSessionForm({
        patientId: '',
        scheduledDate: '',
        scheduledTime: '',
        duration: 60,
        notes: '',
        serviceId: ''
      })
      loadSessions()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create session'
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error creating session:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSessionStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'in-progress': return <Play className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <X className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1)
    } else {
      newDate.setDate(newDate.getDate() + 1)
    }
    setCurrentDate(newDate)
  }

  if (loading && !sessions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <span>Loading sessions...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Sessions</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadSessions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate('prev')}
            className="p-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold">Sessions</h1>
            <p className="text-sm text-muted-foreground">
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate('next')}
            className="p-2"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSessionForm(true)}
            className="p-2"
          >
            <Plus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Sessions List */}
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Sessions Found</h3>
              <p className="text-muted-foreground mb-4">
                No sessions found for the selected date and filters.
              </p>
              <Button onClick={() => setShowSessionForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      {getSessionStatusIcon(session.status)}
                    </div>
                    <div>
                      <div className="font-medium">
                        {session.patient?.firstName} {session.patient?.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(session.scheduledTime)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getSessionStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSession(session)
                        setShowSessionDetails(true)
                      }}
                      className="p-2"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {session.duration} minutes • {session.serviceAssignments?.[0]?.proposalService?.service?.name || 'General Session'}
                  </div>
                  <div className="flex items-center space-x-2">
                    {session.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={() => handleSessionAction(session.id, 'start')}
                        disabled={loading}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {session.status === 'in-progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSessionAction(session.id, 'complete')}
                        disabled={loading}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    {session.status === 'scheduled' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSessionAction(session.id, 'cancel')}
                        disabled={loading}
                        className="text-red-600"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      <AnimatePresence>
        {showSessionDetails && selectedSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white rounded-t-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Session Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSessionDetails(false)}
                    className="p-2"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <Label className="text-sm font-medium">Patient</Label>
                  <div className="text-sm">
                    {selectedSession.patient?.firstName} {selectedSession.patient?.lastName}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Date & Time</Label>
                  <div className="text-sm">
                    {formatDate(selectedSession.scheduledDate)} at {formatTime(selectedSession.scheduledTime)}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Duration</Label>
                  <div className="text-sm">{selectedSession.duration} minutes</div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getSessionStatusColor(selectedSession.status)}>
                    {selectedSession.status}
                  </Badge>
                </div>
                
                {selectedSession.status === 'in-progress' && (
                  <div>
                    <Label className="text-sm font-medium">Session Timer</Label>
                    <div className="text-2xl font-mono font-bold text-blue-600">
                      {formatDuration(sessionTimer)}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Button
                        size="sm"
                        variant={isTimerRunning ? 'outline' : 'default'}
                        onClick={() => setIsTimerRunning(!isTimerRunning)}
                      >
                        {isTimerRunning ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                        {isTimerRunning ? 'Pause' : 'Resume'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSessionTimer(0)}
                      >
                        <Stop className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium">Session Notes</Label>
                  <Textarea
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Add session notes..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-4">
                  {selectedSession.status === 'scheduled' && (
                    <Button
                      onClick={() => handleSessionAction(selectedSession.id, 'start')}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Session
                    </Button>
                  )}
                  {selectedSession.status === 'in-progress' && (
                    <Button
                      onClick={() => handleSessionAction(selectedSession.id, 'complete')}
                      disabled={loading}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Session
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Session Modal */}
      <AnimatePresence>
        {showSessionForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white rounded-t-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Schedule Session</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSessionForm(false)}
                    className="p-2"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <Label htmlFor="patientId">Patient *</Label>
                  <Select value={sessionForm.patientId} onValueChange={(value) => setSessionForm(prev => ({ ...prev, patientId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Patient options would be loaded here */}
                      <SelectItem value="patient1">John Doe</SelectItem>
                      <SelectItem value="patient2">Jane Smith</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="scheduledDate">Date *</Label>
                    <Input
                      id="scheduledDate"
                      type="date"
                      value={sessionForm.scheduledDate}
                      onChange={(e) => setSessionForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="scheduledTime">Time *</Label>
                    <Input
                      id="scheduledTime"
                      type="time"
                      value={sessionForm.scheduledTime}
                      onChange={(e) => setSessionForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={sessionForm.duration}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    min="15"
                    max="180"
                    step="15"
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={sessionForm.notes}
                    onChange={(e) => setSessionForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add session notes..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowSessionForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateSession}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Schedule Session
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          <Button
            variant={activeTab === 'today' ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
            onClick={() => setActiveTab('today')}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs">Today</span>
          </Button>
          <Button
            variant={activeTab === 'upcoming' ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
            onClick={() => setActiveTab('upcoming')}
          >
            <Clock className="h-5 w-5" />
            <span className="text-xs">Upcoming</span>
          </Button>
          <Button
            variant={activeTab === 'completed' ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
            onClick={() => setActiveTab('completed')}
          >
            <CheckCircle className="h-5 w-5" />
            <span className="text-xs">Completed</span>
          </Button>
          <Button
            variant={activeTab === 'schedule' ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
            onClick={() => setActiveTab('schedule')}
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">Schedule</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
