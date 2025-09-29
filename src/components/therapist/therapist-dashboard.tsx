'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
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
  MapPin as Location,
  Calendar as CalendarIcon,
  Clock as ClockIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  email: string
  specialties: Array<{
    id: string
    name: string
    description: string
  }>
}

interface DashboardStatistics {
  sessions: {
    total: number
    completed: number
    cancelled: number
    upcoming: number
    completionRate: number
  }
  patients: {
    total: number
    new: number
  }
  revenue: {
    total: number
    average: number
  }
  performance: {
    averageSessionDuration: number
  }
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

interface AgendaDay {
  date: string
  sessions: Session[]
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  gender?: string
  lastSession: {
    date: string
    status: string
  }
  totalSessions: number
  nextSession?: {
    date: string
    time: string
  }
}

interface TherapistDashboardProps {
  therapistId: string
  onSessionSelect?: (session: Session) => void
  onPatientSelect?: (patient: Patient) => void
  onQuickAction?: (action: string, data?: any) => void
}

export function TherapistDashboard({
  therapistId,
  onSessionSelect,
  onPatientSelect,
  onQuickAction
}: TherapistDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null)
  const [agenda, setAgenda] = useState<AgendaDay[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Load dashboard data
  useEffect(() => {
    loadDashboardData()
  }, [therapistId, selectedPeriod, selectedDate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('therapistId', therapistId)
      params.append('period', selectedPeriod)
      params.append('date', selectedDate.toISOString().split('T')[0])
      params.append('includeStats', 'true')
      params.append('includeAgenda', 'true')
      params.append('includePatients', 'true')

      const response = await fetch(`/api/therapist/dashboard?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load dashboard data')
      }

      setTherapist(result.data.therapist)
      setStatistics(result.data.statistics)
      setAgenda(result.data.agenda)
      setPatients(result.data.patients)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(errorMessage)
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (period: 'today' | 'week' | 'month') => {
    setSelectedPeriod(period)
  }

  const handleDateChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    switch (selectedPeriod) {
      case 'today':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
    }
    setSelectedDate(newDate)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
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
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Loading dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadDashboardData}>
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
                <User className="h-5 w-5 mr-2" />
                {therapist?.firstName} {therapist?.lastName} Dashboard
              </CardTitle>
              <CardDescription>
                Welcome back! Here's your therapy practice overview.
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadDashboardData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => onQuickAction?.('new-session')}>
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
                  onClick={() => handleDateChange('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[120px] text-center">
                  {selectedPeriod === 'today' && formatDate(selectedDate.toISOString())}
                  {selectedPeriod === 'week' && `Week of ${formatDate(selectedDate.toISOString())}`}
                  {selectedPeriod === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDateChange('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.sessions.total}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.sessions.completed} completed ({statistics.sessions.completionRate}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.patients.total}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.patients.new} new this period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${statistics.revenue.total}</div>
              <p className="text-xs text-muted-foreground">
                ${statistics.revenue.average} average per session
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.performance.averageSessionDuration}m</div>
              <p className="text-xs text-muted-foreground">
                Per session
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>
                  Your sessions for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                {agenda.length > 0 ? (
                  <div className="space-y-3">
                    {agenda[0]?.sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => onSessionSelect?.(session)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${getStatusColor(session.status)}`}>
                            {getStatusIcon(session.status)}
                          </div>
                          <div>
                            <div className="font-medium">
                              {session.patient.firstName} {session.patient.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(session.scheduledTime)} • {session.duration}min
                            </div>
                          </div>
                        </div>
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Sessions Today</h3>
                    <p className="text-muted-foreground">
                      You have no sessions scheduled for today.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Patients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Recent Patients
                </CardTitle>
                <CardDescription>
                  Your most recent patient interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {patients.length > 0 ? (
                  <div className="space-y-3">
                    {patients.slice(0, 5).map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => onPatientSelect?.(patient)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {patient.firstName} {patient.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {patient.totalSessions} sessions • Last: {formatDate(patient.lastSession.date)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={patient.lastSession.status === 'completed' ? 'default' : 'secondary'}>
                            {patient.lastSession.status}
                          </Badge>
                          {patient.nextSession && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Next: {formatDate(patient.nextSession.date)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Recent Patients</h3>
                    <p className="text-muted-foreground">
                      No patient interactions in the last 30 days.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Agenda Tab */}
        <TabsContent value="agenda" className="space-y-4">
          {agenda.length > 0 ? (
            <div className="space-y-4">
              {agenda.map((day) => (
                <Card key={day.date}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      {formatDate(day.date)}
                    </CardTitle>
                    <CardDescription>
                      {day.sessions.length} sessions scheduled
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {day.sessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                          onClick={() => onSessionSelect?.(session)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-full ${getStatusColor(session.status)}`}>
                              {getStatusIcon(session.status)}
                            </div>
                            <div>
                              <div className="font-medium text-lg">
                                {session.patient.firstName} {session.patient.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatTime(session.scheduledTime)} • {session.duration} minutes
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {session.services.map(s => s.name).join(', ')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(session.status)}>
                              {session.status}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-2">
                              {session.patient.email}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sessions Scheduled</h3>
                <p className="text-muted-foreground">
                  No sessions are scheduled for the selected period.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients" className="space-y-4">
          {patients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patients.map((patient) => (
                <Card
                  key={patient.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onPatientSelect?.(patient)}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {patient.firstName} {patient.lastName}
                        </CardTitle>
                        <CardDescription>{patient.email}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{patient.phone}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{patient.totalSessions} total sessions</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Last: {formatDate(patient.lastSession.date)}</span>
                      </div>
                      {patient.nextSession && (
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Next: {formatDate(patient.nextSession.date)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant={patient.lastSession.status === 'completed' ? 'default' : 'secondary'}>
                        {patient.lastSession.status}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Patients Found</h3>
                <p className="text-muted-foreground">
                  No patients have been seen in the last 30 days.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
