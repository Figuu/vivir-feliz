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
  Location,
  CalendarIcon,
  ClockIcon,
  PieChart,
  LineChart,
  BarChart,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
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
import { WeeklyAgendaView } from '@/components/therapist/weekly-agenda-view'
import { useWeeklyAgenda } from '@/hooks/use-weekly-agenda'

export default function WeeklyAgendaPage() {
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('')
  const [therapists, setTherapists] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('agenda')
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date())
  
  const { 
    loading, 
    error, 
    agendaData,
    therapist,
    weekDays,
    sessions,
    availability,
    conflicts,
    suggestions,
    loadWeeklyAgenda,
    refreshAgenda,
    createSession,
    updateSession,
    deleteSession,
    formatTime,
    getStatusColor,
    getStatusIcon,
    generateTimeSlots,
    timeToMinutes,
    minutesToTime,
    getWeekStart,
    getWeekEnd,
    navigateWeek,
    getSessionsForDay,
    getAvailabilityForDay,
    isTimeSlotAvailable,
    getSessionConflicts,
    calculateSessionEndTime,
    getSessionDuration,
    getSessionRevenue,
    getTotalRevenueForWeek,
    getSessionCountForWeek,
    getCompletedSessionsCount,
    getUpcomingSessionsCount,
    clearError,
    clearConflicts,
    clearSuggestions
  } = useWeeklyAgenda()

  // Load therapists list
  useEffect(() => {
    loadTherapists()
  }, [])

  // Load weekly agenda when therapist is selected
  useEffect(() => {
    if (selectedTherapistId) {
      const weekStart = getWeekStart(currentWeekStart)
      loadWeeklyAgenda({
        therapistId: selectedTherapistId,
        weekStart: weekStart.toISOString().split('T')[0],
        includeSessions: true,
        includeAvailability: true,
        includeConflicts: true
      })
    }
  }, [selectedTherapistId, currentWeekStart, loadWeeklyAgenda, getWeekStart])

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

  const handleWeekNavigation = (direction: 'prev' | 'next') => {
    const newWeekStart = navigateWeek(currentWeekStart, direction)
    setCurrentWeekStart(newWeekStart)
  }

  const handleSessionSelect = (session: any) => {
    console.log('Session selected:', session)
    // Handle session selection (e.g., open session details modal)
  }

  const handleSessionUpdate = (session: any) => {
    console.log('Session updated:', session)
    // Handle session update
  }

  const handleSessionDelete = (session: any) => {
    console.log('Session deleted:', session)
    // Handle session deletion
  }

  const handleSessionCreate = (session: any) => {
    console.log('Session created:', session)
    // Handle session creation
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getWeekStatistics = () => {
    const totalSessions = getSessionCountForWeek()
    const completedSessions = getCompletedSessionsCount()
    const upcomingSessions = getUpcomingSessionsCount()
    const totalRevenue = getTotalRevenueForWeek()
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0

    return {
      totalSessions,
      completedSessions,
      upcomingSessions,
      totalRevenue,
      completionRate
    }
  }

  const stats = getWeekStatistics()

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Weekly Agenda View</h1>
          <p className="text-muted-foreground">
            Comprehensive weekly agenda with session management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={refreshAgenda}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Therapist Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Select Therapist
          </CardTitle>
          <CardDescription>
            Choose a therapist to view their weekly agenda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={selectedTherapistId} onValueChange={setSelectedTherapistId}>
              <SelectTrigger className="w-64">
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
            
            {therapist && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{therapist.email}</Badge>
                <div className="flex flex-wrap gap-1">
                  {therapist.specialties.map((specialty: any) => (
                    <Badge key={specialty.id} variant="secondary" className="text-xs">
                      {specialty.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Week Navigation
          </CardTitle>
          <CardDescription>
            Navigate between weeks and view your schedule
          </CardDescription>
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
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeekStart(new Date())}
              >
                This Week
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Week Statistics */}
      {agendaData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                This week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedSessions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completionRate}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue}</div>
              <p className="text-xs text-muted-foreground">
                This week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Session completion
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agenda">Weekly Agenda</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-4">
          {selectedTherapistId ? (
            <WeeklyAgendaView
              therapistId={selectedTherapistId}
              onSessionSelect={handleSessionSelect}
              onSessionUpdate={handleSessionUpdate}
              onSessionDelete={handleSessionDelete}
              onSessionCreate={handleSessionCreate}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Therapist</h3>
                <p className="text-muted-foreground">
                  Choose a therapist from the dropdown above to view their weekly agenda.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {agendaData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Session Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Session Statistics
                  </CardTitle>
                  <CardDescription>
                    Weekly session performance and metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Total Sessions</div>
                          <div className="text-sm text-muted-foreground">This week</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{stats.totalSessions}</div>
                        <div className="text-sm text-muted-foreground">sessions</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Completed Sessions</div>
                          <div className="text-sm text-muted-foreground">Successfully finished</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{stats.completedSessions}</div>
                        <div className="text-sm text-muted-foreground">
                          {stats.completionRate}% rate
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-yellow-100">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium">Upcoming Sessions</div>
                          <div className="text-sm text-muted-foreground">Scheduled</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
                        <div className="text-sm text-muted-foreground">sessions</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Revenue Statistics
                  </CardTitle>
                  <CardDescription>
                    Financial performance for the week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Total Revenue</div>
                          <div className="text-sm text-muted-foreground">This week</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${stats.totalRevenue}</div>
                        <div className="text-sm text-muted-foreground">revenue</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Average per Session</div>
                          <div className="text-sm text-muted-foreground">Revenue per session</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          ${stats.totalSessions > 0 ? Math.round(stats.totalRevenue / stats.totalSessions) : 0}
                        </div>
                        <div className="text-sm text-muted-foreground">per session</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-purple-100">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">Completion Rate</div>
                          <div className="text-sm text-muted-foreground">Session success rate</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{stats.completionRate}%</div>
                        <div className="text-sm text-muted-foreground">success rate</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Agenda Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Weekly calendar view</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Session scheduling</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Time slot management</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Availability tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Management Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Session status tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Conflict detection</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Drag and drop scheduling</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Real-time updates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Session Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Session details</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Patient information</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Service management</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Notes and comments</span>
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
                Weekly Agenda Overview
              </CardTitle>
              <CardDescription>
                Comprehensive weekly agenda with session management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Agenda Components</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Weekly calendar grid view</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Time slot availability</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Session scheduling and management</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Conflict detection and resolution</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Session status tracking</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Key Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Interactive session management</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Real-time availability updates</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Session conflict detection</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Patient and service integration</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Weekly statistics and analytics</span>
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
