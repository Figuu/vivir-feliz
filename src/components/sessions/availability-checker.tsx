'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar,
  Clock,
  CheckCircle,
  X,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Users,
  Timer,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConflictResolutionService, AvailabilityCheck } from '@/lib/conflict-resolution'

interface AvailabilityCheckerProps {
  therapistId?: string
  onAvailabilityCheck?: (result: AvailabilityCheck) => void
  onTimeSlotSelect?: (time: string, date: Date) => void
  readOnly?: boolean
}

interface TimeSlot {
  time: string
  available: boolean
  conflicts?: string[]
  suggestions?: string[]
}

export function AvailabilityChecker({
  therapistId,
  onAvailabilityCheck,
  onTimeSlotSelect,
  readOnly = false
}: AvailabilityCheckerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [duration, setDuration] = useState<number>(60)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityCheck | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Generate time slots for the selected date
  const generateTimeSlots = () => {
    if (!selectedDate) return []

    const slots: TimeSlot[] = []
    const startHour = 8 // 8 AM
    const endHour = 18 // 6 PM
    const interval = 30 // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push({
          time,
          available: true, // Will be updated by availability check
          conflicts: [],
          suggestions: []
        })
      }
    }

    return slots
  }

  // Check availability for all time slots
  const checkAllAvailability = async () => {
    if (!selectedDate || !therapistId) return

    try {
      setLoading(true)
      setError(null)

      const slots = generateTimeSlots()
      const date = new Date(selectedDate)
      const results: TimeSlot[] = []

      // Check availability for each time slot
      for (const slot of slots) {
        const endTime = new Date(date)
        const [hours, minutes] = slot.time.split(':').map(Number)
        endTime.setHours(hours, minutes + duration, 0, 0)

        const availability = await ConflictResolutionService.checkAvailability({
          therapistId,
          date,
          startTime: slot.time,
          endTime: endTime.toTimeString().slice(0, 5),
          duration
        })

        results.push({
          time: slot.time,
          available: availability.available,
          conflicts: availability.conflicts?.map(c => c.message) || [],
          suggestions: availability.suggestions?.map(s => s.reason) || []
        })
      }

      setTimeSlots(results)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability'
      setError(errorMessage)
      console.error('Error checking availability:', err)
    } finally {
      setLoading(false)
    }
  }

  // Check availability for specific time slot
  const checkSpecificAvailability = async () => {
    if (!selectedDate || !selectedTime || !therapistId) return

    try {
      setLoading(true)
      setError(null)

      const date = new Date(selectedDate)
      const endTime = new Date(date)
      const [hours, minutes] = selectedTime.split(':').map(Number)
      endTime.setHours(hours, minutes + duration, 0, 0)

      const result = await ConflictResolutionService.checkAvailability({
        therapistId,
        date,
        startTime: selectedTime,
        endTime: endTime.toTimeString().slice(0, 5),
        duration
      })

      setAvailabilityResult(result)
      
      if (onAvailabilityCheck) {
        onAvailabilityCheck(result)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability'
      setError(errorMessage)
      console.error('Error checking availability:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-check when date or duration changes
  useEffect(() => {
    if (selectedDate && therapistId) {
      checkAllAvailability()
    }
  }, [selectedDate, duration, therapistId])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getTimeSlotColor = (slot: TimeSlot) => {
    if (slot.available) {
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
    } else {
      return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
    }
  }

  const availableSlots = timeSlots.filter(slot => slot.available)
  const unavailableSlots = timeSlots.filter(slot => !slot.available)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Availability Checker
          </CardTitle>
          <CardDescription>
            Check therapist availability and find the best time slots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select value={duration.toString()} onValueChange={(value) => setDuration(parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Actions</Label>
              <div className="flex space-x-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkAllAvailability}
                  disabled={loading || !selectedDate || !therapistId}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Availability Summary */}
      {timeSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Availability Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-green-600">{availableSlots.length}</div>
                <div className="text-sm text-muted-foreground">Available Slots</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-red-600">{unavailableSlots.length}</div>
                <div className="text-sm text-muted-foreground">Unavailable Slots</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((availableSlots.length / timeSlots.length) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Availability Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Slots Grid */}
      {timeSlots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Timer className="h-5 w-5 mr-2" />
              Time Slots
            </CardTitle>
            <CardDescription>
              Click on available time slots to select them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {timeSlots.map((slot, index) => (
                <motion.div
                  key={slot.time}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full h-auto p-2 flex flex-col items-center space-y-1 ${getTimeSlotColor(slot)}`}
                    onClick={() => {
                      if (slot.available && !readOnly) {
                        setSelectedTime(slot.time)
                        if (onTimeSlotSelect) {
                          onTimeSlotSelect(slot.time, new Date(selectedDate))
                        }
                      }
                    }}
                    disabled={!slot.available || readOnly}
                  >
                    <div className="flex items-center space-x-1">
                      {slot.available ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      <span className="text-xs font-medium">
                        {formatTime(slot.time)}
                      </span>
                    </div>
                    {slot.conflicts && slot.conflicts.length > 0 && (
                      <div className="text-xs opacity-75">
                        {slot.conflicts.length} conflict{slot.conflicts.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Specific Time Check */}
      {selectedTime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Detailed Check: {formatTime(selectedTime)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={checkSpecificAvailability}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Checking...' : 'Check Detailed Availability'}
              </Button>

              {availabilityResult && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {availabilityResult.available ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {availabilityResult.available ? 'Available' : 'Not Available'}
                    </span>
                  </div>

                  {availabilityResult.reason && (
                    <p className="text-sm text-muted-foreground">
                      {availabilityResult.reason}
                    </p>
                  )}

                  {availabilityResult.conflicts && availabilityResult.conflicts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Conflicts:</h4>
                      {availabilityResult.conflicts.map((conflict, index) => (
                        <Alert key={index} className="text-sm">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{conflict.message}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  )}

                  {availabilityResult.suggestions && availabilityResult.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Suggestions:</h4>
                      {availabilityResult.suggestions.map((suggestion, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-blue-50">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{formatTime(suggestion.time)}</span>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {suggestion.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Checking availability...</span>
        </div>
      )}
    </div>
  )
}
