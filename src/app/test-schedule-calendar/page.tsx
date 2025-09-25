'use client'

import { useState } from 'react'
import { ScheduleCalendar } from '@/components/consultation/schedule-calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User } from 'lucide-react'

export default function TestScheduleCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [selectedTime, setSelectedTime] = useState<string | undefined>()
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | undefined>()

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedTime(undefined) // Reset time when date changes
    setSelectedTherapistId(undefined)
    console.log('Selected date:', date)
  }

  const handleTimeSelect = (time: string, therapistId?: string) => {
    setSelectedTime(time)
    setSelectedTherapistId(therapistId)
    console.log('Selected time:', time, 'Therapist ID:', therapistId)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Schedule Calendar Test</h1>
          <p className="text-muted-foreground">
            Test the dynamic calendar interface for schedule selection
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar Component */}
          <div className="lg:col-span-2">
            <ScheduleCalendar
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onDateSelect={handleDateSelect}
              onTimeSelect={handleTimeSelect}
              specialtyId="1" // Mock specialty ID
              duration={60}
            />
          </div>

          {/* Selection Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Selection Summary
                </CardTitle>
                <CardDescription>
                  Review your selected appointment details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedDate ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Selected Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {selectedTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Selected Time</p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(selectedTime)}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedTherapistId && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Assigned Therapist</p>
                          <p className="text-sm text-muted-foreground">
                            ID: {selectedTherapistId}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <Badge variant="outline" className="text-xs">
                        Duration: 60 minutes
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No date selected</h3>
                    <p className="text-sm text-muted-foreground">
                      Select a date from the calendar to see your appointment details
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Debug Information */}
            {(selectedDate || selectedTime) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Debug Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium">Selected Date:</span> {selectedDate || 'None'}
                    </div>
                    <div>
                      <span className="font-medium">Selected Time:</span> {selectedTime || 'None'}
                    </div>
                    <div>
                      <span className="font-medium">Therapist ID:</span> {selectedTherapistId || 'None'}
                    </div>
                    <div>
                      <span className="font-medium">Specialty ID:</span> 1 (Mock)
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> 60 minutes
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2">
                <p>1. Navigate through months using the arrow buttons</p>
                <p>2. Click on available dates (highlighted in green)</p>
                <p>3. Select a time slot from the available options</p>
                <p>4. Review your selection in the summary panel</p>
                <p>5. The calendar shows real-time availability from the database</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
