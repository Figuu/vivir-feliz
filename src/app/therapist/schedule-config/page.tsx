'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock,
  Calendar,
  User,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Search,
  Filter,
  X,
  Eye,
  EyeOff,
  Users,
  Settings,
  CheckCircle,
  AlertTriangle,
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
  TrendingUp,
  PieChart,
  Timer,
  Pause,
  Play,
  Square,
  RotateCcw,
  Copy,
  Move,
  GripVertical,
  AlertCircle,
  Info,
  Check,
  Square as SquareIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScheduleConfigurationInterface } from '@/components/therapist/schedule-configuration-interface'
import { useScheduleConfiguration } from '@/hooks/use-schedule-configuration'

export default function ScheduleConfigPage() {
  const [activeTab, setActiveTab] = useState('interface')
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null)
  
  const { 
    loading, 
    error, 
    scheduleConfigs,
    therapists,
    getScheduleConfigs,
    getTherapists,
    clearError 
  } = useScheduleConfiguration()

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      await Promise.all([
        getScheduleConfigs({
          page: 1,
          limit: 10,
          sortBy: 'dayOfWeek',
          sortOrder: 'asc'
        }),
        getTherapists()
      ])
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const handleScheduleSelect = (schedule: any) => {
    console.log('Schedule selected:', schedule)
    setSelectedSchedule(schedule)
  }

  const handleScheduleUpdate = (schedule: any) => {
    console.log('Schedule updated:', schedule)
    setSelectedSchedule(schedule)
  }

  const handleScheduleDelete = (schedule: any) => {
    console.log('Schedule deleted:', schedule)
    if (selectedSchedule?.id === schedule.id) {
      setSelectedSchedule(null)
    }
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

  const getActiveSchedules = () => {
    return scheduleConfigs.filter(s => s.isWorkingDay)
  }

  const getRecurringSchedules = () => {
    return scheduleConfigs.filter(s => s.isRecurring)
  }

  const getTotalWorkingHours = () => {
    return scheduleConfigs.reduce((total, schedule) => {
      if (schedule.isWorkingDay) {
        const startMinutes = timeToMinutes(schedule.startTime)
        const endMinutes = timeToMinutes(schedule.endTime)
        let workingMinutes = endMinutes - startMinutes
        
        if (schedule.breakStartTime && schedule.breakEndTime) {
          const breakStartMinutes = timeToMinutes(schedule.breakStartTime)
          const breakEndMinutes = timeToMinutes(schedule.breakEndTime)
          workingMinutes -= (breakEndMinutes - breakStartMinutes)
        }
        
        return total + workingMinutes
      }
      return total
    }, 0) / 60 // Convert to hours
  }

  const getTotalSessionsCapacity = () => {
    return scheduleConfigs.reduce((total, schedule) => {
      return total + schedule.maxSessionsPerDay
    }, 0)
  }

  const timeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schedule Configuration</h1>
          <p className="text-muted-foreground">
            Configure therapist schedules with time validation and conflict checking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadInitialData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduleConfigs.length}</div>
            <p className="text-xs text-muted-foreground">
              {getActiveSchedules().length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recurring Schedules</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {getRecurringSchedules().length}
            </div>
            <p className="text-xs text-muted-foreground">
              Weekly patterns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Working Hours</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getTotalWorkingHours().toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Per week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {getTotalSessionsCapacity()}
            </div>
            <p className="text-xs text-muted-foreground">
              Max sessions/week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="interface">Configuration Interface</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="interface" className="space-y-4">
          <ScheduleConfigurationInterface
            onScheduleSelect={handleScheduleSelect}
            onScheduleUpdate={handleScheduleUpdate}
            onScheduleDelete={handleScheduleDelete}
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schedule Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Schedule Overview
                </CardTitle>
                <CardDescription>
                  Current schedule configurations by therapist
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {therapists.slice(0, 5).map((therapist) => {
                    const therapistSchedules = scheduleConfigs.filter(s => s.therapistId === therapist.id)
                    const activeSchedules = therapistSchedules.filter(s => s.isWorkingDay)
                    const totalWorkingHours = activeSchedules.reduce((total, schedule) => {
                      const startMinutes = timeToMinutes(schedule.startTime)
                      const endMinutes = timeToMinutes(schedule.endTime)
                      let workingMinutes = endMinutes - startMinutes
                      
                      if (schedule.breakStartTime && schedule.breakEndTime) {
                        const breakStartMinutes = timeToMinutes(schedule.breakStartTime)
                        const breakEndMinutes = timeToMinutes(schedule.breakEndTime)
                        workingMinutes -= (breakEndMinutes - breakStartMinutes)
                      }
                      
                      return total + workingMinutes
                    }, 0) / 60
                    
                    return (
                      <div key={therapist.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{therapist.firstName} {therapist.lastName}</div>
                          <div className="text-sm text-muted-foreground">
                            {activeSchedules.length} working days
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{totalWorkingHours.toFixed(1)}h</div>
                          <div className="text-sm text-muted-foreground">per week</div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {therapists.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground">
                      +{therapists.length - 5} more therapists
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Schedule Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Schedule Patterns
                </CardTitle>
                <CardDescription>
                  Common schedule patterns and configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                    const daySchedules = scheduleConfigs.filter(s => s.dayOfWeek === day && s.isWorkingDay)
                    const totalSessions = daySchedules.reduce((sum, s) => sum + s.maxSessionsPerDay, 0)
                    
                    return (
                      <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium capitalize">{day}</div>
                          <div className="text-sm text-muted-foreground">
                            {daySchedules.length} therapists working
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{totalSessions}</div>
                          <div className="text-sm text-muted-foreground">max sessions</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest schedule configuration updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduleConfigs
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 10)
                  .map((schedule) => (
                    <div key={schedule.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div className="flex-1">
                        <div className="font-medium">
                          {schedule.therapist.firstName} {schedule.therapist.lastName} - {schedule.dayOfWeek}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {schedule.isWorkingDay 
                            ? `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`
                            : 'No working hours'
                          } • Updated {formatDate(schedule.updatedAt)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={schedule.isWorkingDay ? "default" : "secondary"}>
                          {schedule.isWorkingDay ? 'Working' : 'Off'}
                        </Badge>
                        {schedule.isRecurring && (
                          <Badge variant="outline" className="text-xs">
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Recurring
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Time Validation Features
                </CardTitle>
                <CardDescription>
                  Comprehensive time format and logic validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Time Format Validation</div>
                      <div className="text-sm text-muted-foreground">
                        Validates HH:MM format for all time inputs
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Time Logic Validation</div>
                      <div className="text-sm text-muted-foreground">
                        Ensures start time is before end time
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Break Time Validation</div>
                      <div className="text-sm text-muted-foreground">
                        Validates break times are within working hours
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Duration Validation</div>
                      <div className="text-sm text-muted-foreground">
                        Validates session duration and buffer time limits
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Date Range Validation</div>
                      <div className="text-sm text-muted-foreground">
                        Validates effective and end date ranges
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Conflict Detection Features
                </CardTitle>
                <CardDescription>
                  Advanced conflict detection and resolution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Overlap Detection</div>
                      <div className="text-sm text-muted-foreground">
                        Detects overlapping schedule periods
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Conflict Suggestions</div>
                      <div className="text-sm text-muted-foreground">
                        Provides suggestions to resolve conflicts
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Session Dependencies</div>
                      <div className="text-sm text-muted-foreground">
                        Checks for existing sessions before deletion
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Real-time Validation</div>
                      <div className="text-sm text-muted-foreground">
                        Validates conflicts in real-time during editing
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Visual Conflict Display</div>
                      <div className="text-sm text-muted-foreground">
                        Shows conflicts and suggestions visually
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Schedule Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Multi-day schedule configuration</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Break time management</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Session capacity limits</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Recurring schedule patterns</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Validation Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Time format validation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Time logic validation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Conflict detection</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Real-time validation</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Management Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Schedule editing</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Search and filtering</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Conflict resolution</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Schedule analytics</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

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
