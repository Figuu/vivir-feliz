'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Stop,
  RotateCcw,
  Copy,
  Move,
  GripVertical
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// Validation schema
const scheduleConfigSchema = z.object({
  therapistId: z.string().uuid('Invalid therapist ID'),
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
  endTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'),
  isWorkingDay: z.boolean().default(true),
  breakStartTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Break start time must be in HH:MM format')
    .optional(),
  breakEndTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Break end time must be in HH:MM format')
    .optional(),
  maxSessionsPerDay: z.number()
    .min(1, 'Maximum sessions per day must be at least 1')
    .max(20, 'Maximum sessions per day cannot exceed 20')
    .default(8),
  sessionDuration: z.number()
    .min(15, 'Session duration must be at least 15 minutes')
    .max(180, 'Session duration cannot exceed 180 minutes')
    .default(60),
  bufferTime: z.number()
    .min(0, 'Buffer time cannot be negative')
    .max(60, 'Buffer time cannot exceed 60 minutes')
    .default(15),
  isRecurring: z.boolean().default(true),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  endDate: z.string().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
})

type ScheduleConfigFormData = z.infer<typeof scheduleConfigSchema>

interface Therapist {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface ScheduleConfig {
  id: string
  therapistId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  isWorkingDay: boolean
  breakStartTime?: string
  breakEndTime?: string
  maxSessionsPerDay: number
  sessionDuration: number
  bufferTime: number
  isRecurring: boolean
  effectiveDate: string
  endDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
  therapist: Therapist
}

interface ScheduleConfigurationInterfaceProps {
  onScheduleSelect?: (schedule: ScheduleConfig) => void
  onScheduleUpdate?: (schedule: ScheduleConfig) => void
  onScheduleDelete?: (schedule: ScheduleConfig) => void
}

export function ScheduleConfigurationInterface({
  onScheduleSelect,
  onScheduleUpdate,
  onScheduleDelete
}: ScheduleConfigurationInterfaceProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scheduleConfigs, setScheduleConfigs] = useState<ScheduleConfig[]>([])
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleConfig | null>(null)
  const [activeTab, setActiveTab] = useState('list')
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [filters, setFilters] = useState({
    therapistId: '',
    dayOfWeek: '',
    isWorkingDay: '',
    isRecurring: '',
    search: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [conflicts, setConflicts] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ScheduleConfigFormData>({
    resolver: zodResolver(scheduleConfigSchema),
    defaultValues: {
      isWorkingDay: true,
      maxSessionsPerDay: 8,
      sessionDuration: 60,
      bufferTime: 15,
      isRecurring: true
    }
  })

  const isWorkingDay = watch('isWorkingDay')
  const breakStartTime = watch('breakStartTime')
  const breakEndTime = watch('breakEndTime')

  // Load data
  useEffect(() => {
    loadTherapists()
    loadScheduleConfigs()
  }, [filters, pagination.page, pagination.limit])

  const loadTherapists = async () => {
    try {
      const response = await fetch('/api/therapist/profile?limit=100')
      const result = await response.json()
      if (response.ok) {
        setTherapists(result.data.therapists)
      }
    } catch (err) {
      console.error('Error loading therapists:', err)
    }
  }

  const loadScheduleConfigs = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      if (filters.therapistId) params.append('therapistId', filters.therapistId)
      if (filters.dayOfWeek) params.append('dayOfWeek', filters.dayOfWeek)
      if (filters.isWorkingDay) params.append('isWorkingDay', filters.isWorkingDay)
      if (filters.isRecurring) params.append('isRecurring', filters.isRecurring)

      const response = await fetch(`/api/therapist/schedule-config?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load schedule configurations')
      }

      setScheduleConfigs(result.data.scheduleConfigs)
      setPagination(prev => ({
        ...prev,
        total: result.data.pagination.total,
        pages: result.data.pagination.pages
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schedule configurations'
      setError(errorMessage)
      console.error('Error loading schedule configurations:', err)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ScheduleConfigFormData) => {
    try {
      setLoading(true)
      setError(null)
      setConflicts([])
      setSuggestions([])

      const url = editMode 
        ? '/api/therapist/schedule-config'
        : '/api/therapist/schedule-config'
      
      const method = editMode ? 'PUT' : 'POST'
      const body = editMode ? { id: selectedSchedule?.id, ...data } : data

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409 && result.conflicts) {
          setConflicts(result.conflicts)
          setSuggestions(result.suggestions)
          toast.error('Schedule conflicts detected. Please review and resolve conflicts.')
          return
        }
        throw new Error(result.error || 'Failed to save schedule configuration')
      }

      toast.success(editMode ? 'Schedule configuration updated successfully' : 'Schedule configuration created successfully')
      
      if (editMode && onScheduleUpdate) {
        onScheduleUpdate(result.data.scheduleConfig)
      } else if (!editMode && onScheduleSelect) {
        onScheduleSelect(result.data.scheduleConfig)
      }

      loadScheduleConfigs()
      setShowForm(false)
      setEditMode(false)
      reset()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save schedule configuration'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error saving schedule configuration:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleScheduleSelect = (schedule: ScheduleConfig) => {
    setSelectedSchedule(schedule)
    if (onScheduleSelect) {
      onScheduleSelect(schedule)
    }
  }

  const handleEditSchedule = (schedule: ScheduleConfig) => {
    setSelectedSchedule(schedule)
    setEditMode(true)
    setShowForm(true)
    setActiveTab('form')
    
    // Populate form with existing data
    setValue('therapistId', schedule.therapistId)
    setValue('dayOfWeek', schedule.dayOfWeek as any)
    setValue('startTime', schedule.startTime)
    setValue('endTime', schedule.endTime)
    setValue('isWorkingDay', schedule.isWorkingDay)
    setValue('breakStartTime', schedule.breakStartTime || '')
    setValue('breakEndTime', schedule.breakEndTime || '')
    setValue('maxSessionsPerDay', schedule.maxSessionsPerDay)
    setValue('sessionDuration', schedule.sessionDuration)
    setValue('bufferTime', schedule.bufferTime)
    setValue('isRecurring', schedule.isRecurring)
    setValue('effectiveDate', schedule.effectiveDate.split('T')[0])
    setValue('endDate', schedule.endDate ? schedule.endDate.split('T')[0] : '')
    setValue('notes', schedule.notes || '')
  }

  const handleDeleteSchedule = async (schedule: ScheduleConfig) => {
    if (!confirm(`Are you sure you want to delete the schedule configuration for ${schedule.therapist.firstName} ${schedule.therapist.lastName} on ${schedule.dayOfWeek}?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist/schedule-config?id=${schedule.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete schedule configuration')
      }

      toast.success('Schedule configuration deleted successfully')
      loadScheduleConfigs()
      
      if (onScheduleDelete) {
        onScheduleDelete(schedule)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule configuration'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error deleting schedule configuration:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewSchedule = () => {
    setSelectedSchedule(null)
    setEditMode(false)
    setShowForm(true)
    setActiveTab('form')
    reset()
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

  const getDayOfWeekOptions = () => [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ]

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        const displayTime = formatTime(timeString)
        slots.push({ value: timeString, label: displayTime })
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Schedule Configuration
          </CardTitle>
          <CardDescription>
            Configure therapist schedules with time validation and conflict checking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search schedules..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              
              <Select 
                value={filters.therapistId} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, therapistId: value }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by therapist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Therapists</SelectItem>
                  {therapists.map((therapist) => (
                    <SelectItem key={therapist.id} value={therapist.id}>
                      {therapist.firstName} {therapist.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.dayOfWeek} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, dayOfWeek: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Days</SelectItem>
                  {getDayOfWeekOptions().map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.isWorkingDay} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, isWorkingDay: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="true">Working</SelectItem>
                  <SelectItem value="false">Off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadScheduleConfigs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={handleNewSchedule}>
                <Plus className="h-4 w-4 mr-2" />
                New Schedule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Schedule List</TabsTrigger>
          <TabsTrigger value="form">Configuration Form</TabsTrigger>
          <TabsTrigger value="details">Schedule Details</TabsTrigger>
        </TabsList>

        {/* Schedule List Tab */}
        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading schedule configurations...</span>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scheduleConfigs.map((schedule) => (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`cursor-pointer transition-all ${
                    selectedSchedule?.id === schedule.id ? 'ring-2 ring-primary' : ''
                  }`} onClick={() => handleScheduleSelect(schedule)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {schedule.therapist.firstName} {schedule.therapist.lastName}
                          </CardTitle>
                          <CardDescription className="capitalize">{schedule.dayOfWeek}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-1">
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
                    </CardHeader>
                    <CardContent>
                      {schedule.isWorkingDay ? (
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                          </div>
                          {schedule.breakStartTime && schedule.breakEndTime && (
                            <div className="flex items-center text-sm">
                              <Pause className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>Break: {formatTime(schedule.breakStartTime)} - {formatTime(schedule.breakEndTime)}</span>
                            </div>
                          )}
                          <div className="flex items-center text-sm">
                            <Timer className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{schedule.sessionDuration}min sessions</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Max {schedule.maxSessionsPerDay} sessions/day</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="text-sm text-muted-foreground">No working hours</div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Effective: {formatDate(schedule.effectiveDate)}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditSchedule(schedule)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSchedule(schedule)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Form Tab */}
        <TabsContent value="form" className="space-y-4">
          {showForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  {editMode ? 'Edit Schedule Configuration' : 'Create New Schedule Configuration'}
                </CardTitle>
                <CardDescription>
                  {editMode 
                    ? 'Update schedule configuration and settings'
                    : 'Create a new schedule configuration with time validation'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="therapistId">Therapist *</Label>
                      <Select {...register('therapistId')}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select therapist" />
                        </SelectTrigger>
                        <SelectContent>
                          {therapists.map((therapist) => (
                            <SelectItem key={therapist.id} value={therapist.id}>
                              {therapist.firstName} {therapist.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.therapistId && (
                        <p className="text-sm text-red-600 mt-1">{errors.therapistId.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="dayOfWeek">Day of Week *</Label>
                      <Select {...register('dayOfWeek')}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {getDayOfWeekOptions().map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.dayOfWeek && (
                        <p className="text-sm text-red-600 mt-1">{errors.dayOfWeek.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isWorkingDay"
                      {...register('isWorkingDay')}
                    />
                    <Label htmlFor="isWorkingDay">This is a working day</Label>
                  </div>

                  {isWorkingDay && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="startTime">Start Time *</Label>
                          <Select {...register('startTime')}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select start time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((slot) => (
                                <SelectItem key={slot.value} value={slot.value}>
                                  {slot.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.startTime && (
                            <p className="text-sm text-red-600 mt-1">{errors.startTime.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="endTime">End Time *</Label>
                          <Select {...register('endTime')}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select end time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((slot) => (
                                <SelectItem key={slot.value} value={slot.value}>
                                  {slot.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.endTime && (
                            <p className="text-sm text-red-600 mt-1">{errors.endTime.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="breakStartTime">Break Start Time</Label>
                          <Select {...register('breakStartTime')}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select break start time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((slot) => (
                                <SelectItem key={slot.value} value={slot.value}>
                                  {slot.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.breakStartTime && (
                            <p className="text-sm text-red-600 mt-1">{errors.breakStartTime.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="breakEndTime">Break End Time</Label>
                          <Select {...register('breakEndTime')}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select break end time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((slot) => (
                                <SelectItem key={slot.value} value={slot.value}>
                                  {slot.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.breakEndTime && (
                            <p className="text-sm text-red-600 mt-1">{errors.breakEndTime.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <Label htmlFor="maxSessionsPerDay">Max Sessions Per Day</Label>
                          <Input
                            id="maxSessionsPerDay"
                            type="number"
                            min="1"
                            max="20"
                            {...register('maxSessionsPerDay', { valueAsNumber: true })}
                            className="mt-1"
                          />
                          {errors.maxSessionsPerDay && (
                            <p className="text-sm text-red-600 mt-1">{errors.maxSessionsPerDay.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="sessionDuration">Session Duration (minutes)</Label>
                          <Input
                            id="sessionDuration"
                            type="number"
                            min="15"
                            max="180"
                            step="15"
                            {...register('sessionDuration', { valueAsNumber: true })}
                            className="mt-1"
                          />
                          {errors.sessionDuration && (
                            <p className="text-sm text-red-600 mt-1">{errors.sessionDuration.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
                          <Input
                            id="bufferTime"
                            type="number"
                            min="0"
                            max="60"
                            step="5"
                            {...register('bufferTime', { valueAsNumber: true })}
                            className="mt-1"
                          />
                          {errors.bufferTime && (
                            <p className="text-sm text-red-600 mt-1">{errors.bufferTime.message}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="effectiveDate">Effective Date *</Label>
                      <Input
                        id="effectiveDate"
                        type="date"
                        {...register('effectiveDate')}
                        className="mt-1"
                      />
                      {errors.effectiveDate && (
                        <p className="text-sm text-red-600 mt-1">{errors.effectiveDate.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        {...register('endDate')}
                        className="mt-1"
                      />
                      {errors.endDate && (
                        <p className="text-sm text-red-600 mt-1">{errors.endDate.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRecurring"
                      {...register('isRecurring')}
                    />
                    <Label htmlFor="isRecurring">This is a recurring schedule</Label>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Enter any additional notes about this schedule"
                      className="mt-1"
                      rows={3}
                    />
                    {errors.notes && (
                      <p className="text-sm text-red-600 mt-1">{errors.notes.message}</p>
                    )}
                  </div>

                  {/* Conflict Display */}
                  {conflicts.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div>Schedule conflicts detected:</div>
                          {conflicts.map((conflict, index) => (
                            <div key={index} className="text-sm">
                              • {conflict.dayOfWeek} {formatTime(conflict.startTime)}-{formatTime(conflict.endTime)} 
                              (Effective: {formatDate(conflict.effectiveDate)})
                            </div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Suggestions Display */}
                  {suggestions.length > 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
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

                  {/* Error Display */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Form Actions */}
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
                        setEditMode(false)
                        setActiveTab('list')
                        reset()
                        setConflicts([])
                        setSuggestions([])
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {editMode ? 'Update Schedule' : 'Create Schedule'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Form Selected</h3>
                <p className="text-muted-foreground">
                  Click "New Schedule" to create a new schedule configuration or select a schedule to edit.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {selectedSchedule ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Schedule Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Therapist</Label>
                    <p className="text-sm mt-1">
                      {selectedSchedule.therapist.firstName} {selectedSchedule.therapist.lastName}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Day of Week</Label>
                    <p className="text-sm mt-1 capitalize">{selectedSchedule.dayOfWeek}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">
                        <Badge variant={selectedSchedule.isWorkingDay ? "default" : "secondary"}>
                          {selectedSchedule.isWorkingDay ? 'Working' : 'Off'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Recurring</Label>
                      <div className="mt-1">
                        <Badge variant={selectedSchedule.isRecurring ? "default" : "outline"}>
                          {selectedSchedule.isRecurring ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {selectedSchedule.isWorkingDay && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Start Time</Label>
                          <p className="text-sm mt-1">{formatTime(selectedSchedule.startTime)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">End Time</Label>
                          <p className="text-sm mt-1">{formatTime(selectedSchedule.endTime)}</p>
                        </div>
                      </div>
                      
                      {selectedSchedule.breakStartTime && selectedSchedule.breakEndTime && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Break Start</Label>
                            <p className="text-sm mt-1">{formatTime(selectedSchedule.breakStartTime)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Break End</Label>
                            <p className="text-sm mt-1">{formatTime(selectedSchedule.breakEndTime)}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Max Sessions</Label>
                          <p className="text-sm mt-1">{selectedSchedule.maxSessionsPerDay}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Session Duration</Label>
                          <p className="text-sm mt-1">{selectedSchedule.sessionDuration} min</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Buffer Time</Label>
                          <p className="text-sm mt-1">{selectedSchedule.bufferTime} min</p>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {selectedSchedule.notes && (
                    <div>
                      <Label className="text-sm font-medium">Notes</Label>
                      <p className="text-sm mt-1">{selectedSchedule.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Effective Date</Label>
                    <p className="text-sm mt-1">{formatDate(selectedSchedule.effectiveDate)}</p>
                  </div>
                  
                  {selectedSchedule.endDate && (
                    <div>
                      <Label className="text-sm font-medium">End Date</Label>
                      <p className="text-sm mt-1">{formatDate(selectedSchedule.endDate)}</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm mt-1">{formatDate(selectedSchedule.createdAt)}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <p className="text-sm mt-1">{formatDate(selectedSchedule.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Schedule Selected</h3>
                <p className="text-muted-foreground">
                  Select a schedule from the list to view its detailed information.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
