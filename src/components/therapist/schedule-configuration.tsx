'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  User,
  Settings,
  Copy,
  RotateCcw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface ScheduleEntry {
  id?: string
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  startTime: string
  endTime: string
  breakStart?: string
  breakEnd?: string
  breakBetweenSessions: number
  isActive: boolean
}

interface Therapist {
  id: string
  name: string
  isActive: boolean
}

interface ScheduleConfigurationProps {
  therapistId?: string
  onScheduleUpdate?: () => void
  readOnly?: boolean
}

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Monday', short: 'Mon' },
  { value: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { value: 'THURSDAY', label: 'Thursday', short: 'Thu' },
  { value: 'FRIDAY', label: 'Friday', short: 'Fri' },
  { value: 'SATURDAY', label: 'Saturday', short: 'Sat' },
  { value: 'SUNDAY', label: 'Sunday', short: 'Sun' }
] as const

const DEFAULT_SCHEDULE: Omit<ScheduleEntry, 'dayOfWeek'> = {
  startTime: '09:00',
  endTime: '17:00',
  breakStart: '12:00',
  breakEnd: '13:00',
  breakBetweenSessions: 15,
  isActive: true
}

export function ScheduleConfiguration({ 
  therapistId, 
  onScheduleUpdate, 
  readOnly = false 
}: ScheduleConfigurationProps) {
  const [therapist, setTherapist] = useState<Therapist | null>(null)
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Load therapist and schedules
  useEffect(() => {
    if (therapistId) {
      loadSchedules()
    }
  }, [therapistId])

  const loadSchedules = async () => {
    if (!therapistId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist/schedule?therapistId=${therapistId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load schedules')
      }

      setTherapist(result.therapist)
      setSchedules(result.schedules || [])
      setHasChanges(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load schedules'
      setError(errorMessage)
      console.error('Error loading schedules:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveSchedules = async () => {
    if (!therapistId || !hasChanges) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/therapist/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId,
          schedules: schedules.filter(s => s.isActive)
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save schedules')
      }

      setSchedules(result.schedules)
      setHasChanges(false)
      toast.success('Schedule saved successfully')
      
      if (onScheduleUpdate) {
        onScheduleUpdate()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save schedules'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error saving schedules:', err)
    } finally {
      setSaving(false)
    }
  }

  const addSchedule = (dayOfWeek: typeof DAYS_OF_WEEK[number]['value']) => {
    const existingSchedule = schedules.find(s => s.dayOfWeek === dayOfWeek)
    if (existingSchedule) {
      toast.error('Schedule already exists for this day')
      return
    }

    const newSchedule: ScheduleEntry = {
      ...DEFAULT_SCHEDULE,
      dayOfWeek
    }

    setSchedules(prev => [...prev, newSchedule])
    setHasChanges(true)
  }

  const updateSchedule = (index: number, updates: Partial<ScheduleEntry>) => {
    setSchedules(prev => prev.map((schedule, i) => 
      i === index ? { ...schedule, ...updates } : schedule
    ))
    setHasChanges(true)
  }

  const removeSchedule = (index: number) => {
    setSchedules(prev => prev.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const toggleSchedule = (index: number) => {
    updateSchedule(index, { isActive: !schedules[index].isActive })
  }

  const copySchedule = (sourceIndex: number) => {
    const sourceSchedule = schedules[sourceIndex]
    const availableDays = DAYS_OF_WEEK.filter(day => 
      !schedules.some(s => s.dayOfWeek === day.value && s.isActive)
    )

    if (availableDays.length === 0) {
      toast.error('No available days to copy to')
      return
    }

    // For now, copy to the first available day
    const targetDay = availableDays[0].value
    const newSchedule: ScheduleEntry = {
      ...sourceSchedule,
      dayOfWeek: targetDay
    }

    setSchedules(prev => [...prev, newSchedule])
    setHasChanges(true)
    toast.success(`Schedule copied to ${availableDays[0].label}`)
  }

  const resetToDefaults = () => {
    setSchedules([])
    setHasChanges(true)
  }

  const getAvailableDays = () => {
    const usedDays = new Set(schedules.map(s => s.dayOfWeek))
    return DAYS_OF_WEEK.filter(day => !usedDays.has(day.value))
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const calculateWorkingHours = (schedule: ScheduleEntry) => {
    const start = new Date(`2000-01-01T${schedule.startTime}:00`)
    const end = new Date(`2000-01-01T${schedule.endTime}:00`)
    const breakDuration = schedule.breakStart && schedule.breakEnd ? 
      (new Date(`2000-01-01T${schedule.breakEnd}:00`).getTime() - 
       new Date(`2000-01-01T${schedule.breakStart}:00`).getTime()) / (1000 * 60) : 0
    
    const totalMinutes = (end.getTime() - start.getTime()) / (1000 * 60) - breakDuration
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    return `${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading schedule configuration...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadSchedules}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
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
                Schedule Configuration
              </CardTitle>
              <CardDescription>
                {therapist ? `Configure working hours for ${therapist.name}` : 'Select a therapist to configure schedule'}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600">
                  Unsaved Changes
                </Badge>
              )}
              {!readOnly && (
                <Button
                  onClick={saveSchedules}
                  disabled={!hasChanges || saving}
                  className="min-w-[100px]"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Saving...' : 'Save Schedule'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Add Schedule */}
      {!readOnly && getAvailableDays().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Add Working Day
            </CardTitle>
            <CardDescription>
              Add a new working day to the schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getAvailableDays().map(day => (
                <Button
                  key={day.value}
                  variant="outline"
                  onClick={() => addSchedule(day.value)}
                  className="min-w-[100px]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {day.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Entries */}
      <div className="space-y-4">
        {schedules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Schedule Configured</h3>
              <p className="text-muted-foreground mb-4">
                Add working days to configure the therapist's schedule
              </p>
              {!readOnly && getAvailableDays().length > 0 && (
                <Button onClick={() => addSchedule(getAvailableDays()[0].value)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Day
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          schedules.map((schedule, index) => (
            <motion.div
              key={`${schedule.dayOfWeek}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={!schedule.isActive ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={schedule.isActive}
                          onCheckedChange={() => toggleSchedule(index)}
                          disabled={readOnly}
                        />
                        <Label className="text-lg font-semibold">
                          {DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label}
                        </Label>
                      </div>
                      <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                        {schedule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!readOnly && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copySchedule(index)}
                            disabled={getAvailableDays().length === 0}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeSchedule(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Start Time */}
                    <div>
                      <Label htmlFor={`start-${index}`}>Start Time</Label>
                      <Input
                        id={`start-${index}`}
                        type="time"
                        value={schedule.startTime}
                        onChange={(e) => updateSchedule(index, { startTime: e.target.value })}
                        disabled={readOnly}
                        className="mt-1"
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <Label htmlFor={`end-${index}`}>End Time</Label>
                      <Input
                        id={`end-${index}`}
                        type="time"
                        value={schedule.endTime}
                        onChange={(e) => updateSchedule(index, { endTime: e.target.value })}
                        disabled={readOnly}
                        className="mt-1"
                      />
                    </div>

                    {/* Break Start */}
                    <div>
                      <Label htmlFor={`break-start-${index}`}>Break Start</Label>
                      <Input
                        id={`break-start-${index}`}
                        type="time"
                        value={schedule.breakStart || ''}
                        onChange={(e) => updateSchedule(index, { breakStart: e.target.value || undefined })}
                        disabled={readOnly}
                        className="mt-1"
                      />
                    </div>

                    {/* Break End */}
                    <div>
                      <Label htmlFor={`break-end-${index}`}>Break End</Label>
                      <Input
                        id={`break-end-${index}`}
                        type="time"
                        value={schedule.breakEnd || ''}
                        onChange={(e) => updateSchedule(index, { breakEnd: e.target.value || undefined })}
                        disabled={readOnly}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor={`break-between-${index}`}>Break Between Sessions (minutes)</Label>
                    <Input
                      id={`break-between-${index}`}
                      type="number"
                      min="0"
                      max="60"
                      value={schedule.breakBetweenSessions}
                      onChange={(e) => updateSchedule(index, { breakBetweenSessions: parseInt(e.target.value) || 15 })}
                      disabled={readOnly}
                      className="mt-1 w-32"
                    />
                  </div>

                  {/* Schedule Summary */}
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Working Hours:</span>
                      <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                    </div>
                    {schedule.breakStart && schedule.breakEnd && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="font-medium">Break:</span>
                        <span>{formatTime(schedule.breakStart)} - {formatTime(schedule.breakEnd)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="font-medium">Total Working Time:</span>
                      <span className="font-semibold">{calculateWorkingHours(schedule)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      {!readOnly && schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={resetToDefaults}
                className="text-orange-600 hover:text-orange-700"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear All Schedules
              </Button>
              <Button
                variant="outline"
                onClick={loadSchedules}
                disabled={!hasChanges}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

