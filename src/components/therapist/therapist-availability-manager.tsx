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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
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
  FileText,
  MessageSquare,
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
  RotateCcw,
  TrendingUp,
  TrendingDown,
  PieChart,
  LineChart,
  BarChart,
  Eye,
  Users
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface AvailabilityDay {
  date: string
  dayOfWeek: string
  isWorkingDay: boolean
  startTime: string | null
  endTime: string | null
  breakStartTime: string | null
  breakEndTime: string | null
  maxSessions: number
  sessionDuration: number
  bufferTime: number
  scheduledSessions: number
  availableSlots: number
  conflicts?: Array<{
    type: string
    sessionId?: string
    sessionIds?: string[]
    message: string
  }>
}

interface Session {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: string
  patient: {
    id: string
    firstName: string
    lastName: string
  }
}

interface AvailabilityCheck {
  available: boolean
  reason: string
  conflicts: Array<{
    sessionId: string
    scheduledTime: string
    duration: number
  }>
  suggestions: string[]
  schedule: {
    startTime: string
    endTime: string
    breakStartTime: string | null
    breakEndTime: string | null
    isWorkingDay: boolean
  } | null
}

interface TherapistAvailabilityManagerProps {
  therapistId: string
  onAvailabilityUpdate?: (availability: AvailabilityDay[]) => void
  onConflictResolve?: (conflicts: any[]) => void
}

export function TherapistAvailabilityManager({
  therapistId,
  onAvailabilityUpdate,
  onConflictResolve
}: TherapistAvailabilityManagerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [availability, setAvailability] = useState<AvailabilityDay[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  const [showAvailabilityCheck, setShowAvailabilityCheck] = useState(false)
  const [checkTime, setCheckTime] = useState({ start: '', end: '', duration: 60 })
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityCheck | null>(null)
  const [editingDay, setEditingDay] = useState<AvailabilityDay | null>(null)
  const [editForm, setEditForm] = useState({
    isWorkingDay: true,
    startTime: '09:00',
    endTime: '17:00',
    breakStartTime: '',
    breakEndTime: '',
    maxSessions: 8,
    sessionDuration: 60,
    bufferTime: 15,
    reason: ''
  })

  // Load availability data
  useEffect(() => {
    if (therapistId) {
      loadAvailabilityData()
    }
  }, [therapistId, dateRange])

  const loadAvailabilityData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('therapistId', therapistId)
      params.append('startDate', dateRange.start)
      params.append('endDate', dateRange.end)
      params.append('includeConflicts', 'true')
      params.append('includeSessions', 'true')

      const response = await fetch(`/api/therapist/availability?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load availability data')
      }

      setTherapist(result.data.therapist)
      setAvailability(result.data.availability)
      setSessions(result.data.sessions || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load availability data'
      setError(errorMessage)
      console.error('Error loading availability data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCheckAvailability = async () => {
    if (!selectedDate || !checkTime.start || !checkTime.end) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please select a date and time range'
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId,
          date: selectedDate,
          startTime: checkTime.start,
          endTime: checkTime.end,
          duration: checkTime.duration
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check availability')
      }

      setAvailabilityResult(result.data)
      setShowAvailabilityCheck(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error checking availability:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditDay = (day: AvailabilityDay) => {
    setEditingDay(day)
    setEditForm({
      isWorkingDay: day.isWorkingDay,
      startTime: day.startTime || '09:00',
      endTime: day.endTime || '17:00',
      breakStartTime: day.breakStartTime || '',
      breakEndTime: day.breakEndTime || '',
      maxSessions: day.maxSessions,
      sessionDuration: day.sessionDuration,
      bufferTime: day.bufferTime,
      reason: ''
    })
  }

  const handleSaveAvailability = async () => {
    if (!editingDay) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId,
          date: editingDay.date,
          startTime: editForm.startTime,
          endTime: editForm.endTime,
          isAvailable: editForm.isWorkingDay,
          reason: editForm.reason,
          breakStartTime: editForm.breakStartTime || undefined,
          breakEndTime: editForm.breakEndTime || undefined,
          maxSessions: editForm.maxSessions,
          sessionDuration: editForm.sessionDuration,
          bufferTime: editForm.bufferTime
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update availability')
      }

      toast({
        title: "Success",
        description: 'Availability updated successfully'
      })
      setEditingDay(null)
      loadAvailabilityData()
      
      if (onAvailabilityUpdate) {
        onAvailabilityUpdate(availability)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update availability'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error updating availability:', err)
    } finally {
      setLoading(false)
    }
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

  const getStatusColor = (isWorkingDay: boolean, hasConflicts: boolean) => {
    if (!isWorkingDay) return 'bg-gray-100 text-gray-800'
    if (hasConflicts) return 'bg-red-100 text-red-800'
    return 'bg-green-100 text-green-800'
  }

  const getStatusIcon = (isWorkingDay: boolean, hasConflicts: boolean) => {
    if (!isWorkingDay) return <XCircle className="h-4 w-4" />
    if (hasConflicts) return <AlertCircle className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const getUtilizationPercentage = (day: AvailabilityDay) => {
    if (day.maxSessions === 0) return 0
    return Math.round((day.scheduledSessions / day.maxSessions) * 100)
  }

  if (loading && !therapist) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Loading availability data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Availability</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadAvailabilityData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  if (!therapist) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Therapist Not Found</h3>
        <p className="text-muted-foreground">
          The requested therapist could not be found.
        </p>
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
                Availability Management - {therapist.firstName} {therapist.lastName}
              </CardTitle>
              <CardDescription>
                Manage therapist availability and time validation
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadAvailabilityData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="check">Check Availability</TabsTrigger>
          <TabsTrigger value="conflicts">Conflicts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Working Days</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {availability.filter(day => day.isWorkingDay).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {availability.length} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {availability.reduce((total, day) => total + day.scheduledSessions, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  scheduled sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {availability.reduce((total, day) => total + (day.conflicts?.length || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  scheduling conflicts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Availability List */}
          <Card>
            <CardHeader>
              <CardTitle>Availability Overview</CardTitle>
              <CardDescription>
                Daily availability and session scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availability.map((day) => (
                  <motion.div
                    key={day.date}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getStatusColor(day.isWorkingDay, (day.conflicts?.length || 0) > 0)}`}>
                        {getStatusIcon(day.isWorkingDay, (day.conflicts?.length || 0) > 0)}
                      </div>
                      <div>
                        <div className="font-medium">{formatDate(day.date)}</div>
                        <div className="text-sm text-muted-foreground">
                          {day.isWorkingDay ? (
                            `${day.startTime} - ${day.endTime} (${day.scheduledSessions}/${day.maxSessions} sessions)`
                          ) : (
                            'Not working'
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {day.isWorkingDay && (
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {getUtilizationPercentage(day)}% utilized
                          </div>
                          <Progress value={getUtilizationPercentage(day)} className="w-20 h-2" />
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditDay(day)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Availability Calendar</CardTitle>
              <CardDescription>
                Visual calendar view of therapist availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-medium text-sm p-2">
                    {day}
                  </div>
                ))}
                {availability.map((day) => {
                  const date = new Date(day.date)
                  const dayOfWeek = date.getDay()
                  const isToday = day.date === new Date().toISOString().split('T')[0]
                  
                  return (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        isToday ? 'ring-2 ring-primary' : ''
                      } ${getStatusColor(day.isWorkingDay, (day.conflicts?.length || 0) > 0)}`}
                      onClick={() => handleEditDay(day)}
                    >
                      <div className="text-center">
                        <div className="font-medium">{date.getDate()}</div>
                        <div className="text-xs">
                          {day.isWorkingDay ? (
                            <div>
                              <div>{day.scheduledSessions}/{day.maxSessions}</div>
                              <div>sessions</div>
                            </div>
                          ) : (
                            <div>Off</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Check Availability Tab */}
        <TabsContent value="check" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Check Availability</CardTitle>
              <CardDescription>
                Check if a specific time slot is available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="checkDate">Date</Label>
                    <Input
                      id="checkDate"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={checkTime.start}
                      onChange={(e) => setCheckTime(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={checkTime.end}
                      onChange={(e) => setCheckTime(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={checkTime.duration}
                    onChange={(e) => setCheckTime(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    min="15"
                    max="300"
                  />
                </div>
                
                <Button onClick={handleCheckAvailability} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Check Availability
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Availability Result */}
          {availabilityResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {availabilityResult.available ? (
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 mr-2 text-red-600" />
                  )}
                  Availability Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${availabilityResult.available ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="font-medium">
                      {availabilityResult.available ? 'Available' : 'Not Available'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {availabilityResult.reason}
                    </div>
                  </div>
                  
                  {availabilityResult.conflicts.length > 0 && (
                    <div>
                      <div className="font-medium mb-2">Conflicts:</div>
                      <div className="space-y-2">
                        {availabilityResult.conflicts.map((conflict, index) => (
                          <div key={index} className="p-2 bg-red-50 border border-red-200 rounded">
                            <div className="text-sm">
                              Session at {formatTime(conflict.scheduledTime)} ({conflict.duration} min)
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {availabilityResult.suggestions.length > 0 && (
                    <div>
                      <div className="font-medium mb-2">Suggestions:</div>
                      <div className="space-y-1">
                        {availabilityResult.suggestions.map((suggestion, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            • {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling Conflicts</CardTitle>
              <CardDescription>
                View and resolve scheduling conflicts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availability.some(day => day.conflicts && day.conflicts.length > 0) ? (
                <div className="space-y-4">
                  {availability.map((day) => (
                    day.conflicts && day.conflicts.length > 0 && (
                      <div key={day.date} className="border rounded-lg p-4">
                        <div className="font-medium mb-2">{formatDate(day.date)}</div>
                        <div className="space-y-2">
                          {day.conflicts.map((conflict, index) => (
                            <Alert key={index} variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                {conflict.message}
                              </AlertDescription>
                            </Alert>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Conflicts</h3>
                  <p className="text-muted-foreground">
                    No scheduling conflicts found in the selected date range.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Availability Dialog */}
      {editingDay && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader>
            <CardTitle>Edit Availability - {formatDate(editingDay.date)}</CardTitle>
            <CardDescription>
              Update therapist availability for this day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isWorkingDay"
                  checked={editForm.isWorkingDay}
                  onChange={(e) => setEditForm(prev => ({ ...prev, isWorkingDay: e.target.checked }))}
                />
                <Label htmlFor="isWorkingDay">Working Day</Label>
              </div>
              
              {editForm.isWorkingDay && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={editForm.endTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="breakStartTime">Break Start Time</Label>
                      <Input
                        id="breakStartTime"
                        type="time"
                        value={editForm.breakStartTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, breakStartTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="breakEndTime">Break End Time</Label>
                      <Input
                        id="breakEndTime"
                        type="time"
                        value={editForm.breakEndTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, breakEndTime: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="maxSessions">Max Sessions</Label>
                      <Input
                        id="maxSessions"
                        type="number"
                        value={editForm.maxSessions}
                        onChange={(e) => setEditForm(prev => ({ ...prev, maxSessions: parseInt(e.target.value) || 0 }))}
                        min="0"
                        max="20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sessionDuration">Session Duration (min)</Label>
                      <Input
                        id="sessionDuration"
                        type="number"
                        value={editForm.sessionDuration}
                        onChange={(e) => setEditForm(prev => ({ ...prev, sessionDuration: parseInt(e.target.value) || 60 }))}
                        min="15"
                        max="300"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bufferTime">Buffer Time (min)</Label>
                      <Input
                        id="bufferTime"
                        type="number"
                        value={editForm.bufferTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bufferTime: parseInt(e.target.value) || 15 }))}
                        min="0"
                        max="60"
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={editForm.reason}
                  onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Reason for availability change..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingDay(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAvailability} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
