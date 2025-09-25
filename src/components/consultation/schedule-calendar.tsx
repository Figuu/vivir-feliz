'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Clock, User, ChevronLeft, ChevronRight, CheckCircle, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAvailability } from '@/hooks/use-availability'

interface TimeSlot {
  time: string
  available: boolean
  therapistId?: string
  therapistName?: string
  isBooked?: boolean
}

interface DaySchedule {
  date: string
  dayName: string
  isToday: boolean
  isPast: boolean
  timeSlots: TimeSlot[]
}

interface Therapist {
  id: string
  name: string
  specialties: string[]
  avatar?: string
}

interface ScheduleCalendarProps {
  selectedDate?: string
  selectedTime?: string
  onDateSelect: (date: string) => void
  onTimeSelect: (time: string, therapistId?: string) => void
  specialtyId?: string
  duration?: number // in minutes
}

export function ScheduleCalendar({
  selectedDate,
  selectedTime,
  onDateSelect,
  onTimeSelect,
  specialtyId,
  duration = 60
}: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [availableDays, setAvailableDays] = useState<DaySchedule[]>([])
  
  const { 
    availability, 
    loading, 
    error, 
    fetchAvailability, 
    getAvailableSlotsForDate,
    isDateAvailable 
  } = useAvailability()

  // Generate calendar days for current month
  const generateCalendarDays = (date: Date): DaySchedule[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday

    const days: DaySchedule[] = []

    // Generate 42 days (6 weeks) to fill the calendar
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      
      const dateString = currentDate.toISOString().split('T')[0]
      const isCurrentMonth = currentDate.getMonth() === month
      const isToday = currentDate.getTime() === today.getTime()
      const isPast = currentDate < today

      days.push({
        date: dateString,
        dayName: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday,
        isPast: isPast && !isToday,
        timeSlots: [] // Will be populated by API
      })
    }

    return days
  }


  // Load availability for current month
  const loadAvailability = async (month: Date) => {
    const monthString = `${month.getFullYear()}-${(month.getMonth() + 1).toString().padStart(2, '0')}`
    
    await fetchAvailability({
      month: monthString,
      specialtyId: specialtyId
    })
  }

  // Load availability when month changes
  useEffect(() => {
    loadAvailability(currentMonth)
  }, [currentMonth, specialtyId])

  // Update available days when availability data changes
  useEffect(() => {
    if (availability) {
      const days = generateCalendarDays(currentMonth)
      const daysWithSlots = days.map(day => ({
        ...day,
        timeSlots: getAvailableSlotsForDate(day.date).map(slot => ({
          time: slot.time,
          available: slot.available,
          therapistId: slot.therapistId,
          therapistName: slot.therapistName
        }))
      }))
      setAvailableDays(daysWithSlots)
    }
  }, [availability, currentMonth])

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

  const getAvailableSlotsCount = (day: DaySchedule) => {
    return day.timeSlots.filter(slot => slot.available).length
  }

  const getSelectedDay = () => {
    return availableDays.find(day => day.date === selectedDate)
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Date & Time
          </CardTitle>
          <CardDescription>
            Choose your preferred date and time for the consultation
          </CardDescription>
        </CardHeader>
        <CardContent>
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

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {availableDays.map((day, index) => {
              const availableSlots = getAvailableSlotsCount(day)
              const isSelected = day.date === selectedDate
              const hasAvailability = availableSlots > 0

              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={`
                    relative p-2 text-center cursor-pointer rounded-lg transition-all duration-200
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground' 
                      : day.isPast 
                        ? 'text-muted-foreground cursor-not-allowed' 
                        : hasAvailability 
                          ? 'hover:bg-primary/10 hover:text-primary' 
                          : 'text-muted-foreground cursor-not-allowed'
                    }
                  `}
                  onClick={() => {
                    if (!day.isPast && hasAvailability) {
                      onDateSelect(day.date)
                    }
                  }}
                >
                  <div className="text-sm font-medium">
                    {new Date(day.date).getDate()}
                  </div>
                  {day.isToday && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                  {hasAvailability && !day.isPast && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {availableSlots} slots
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {loading && (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 text-muted-foreground mx-auto mb-2 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading availability...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <X className="h-6 w-6 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadAvailability(currentMonth)}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Slots */}
      {selectedDate && getSelectedDay() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Available Times for {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
              <CardDescription>
                Select your preferred time slot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {getSelectedDay()?.timeSlots
                  .filter(slot => slot.available)
                  .map((slot, index) => (
                    <motion.div
                      key={slot.time}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Button
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        className="w-full h-auto p-4 flex flex-col items-center gap-2"
                        onClick={() => onTimeSelect(slot.time, slot.therapistId)}
                      >
                        <div className="font-semibold">
                          {formatTime(slot.time)}
                        </div>
                        {slot.therapistName && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {slot.therapistName}
                          </div>
                        )}
                        {selectedTime === slot.time && (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </motion.div>
                  ))}
              </div>

              {getSelectedDay()?.timeSlots.filter(slot => slot.available).length === 0 && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No available times</h3>
                  <p className="text-muted-foreground">
                    There are no available time slots for this date. Please select another date.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Selection Summary */}
      {selectedDate && selectedTime && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Selected Appointment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatTime(selectedTime)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Duration: {duration} minutes
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
