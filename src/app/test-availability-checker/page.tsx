'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { TherapistAvailabilityStatus } from '@/components/consultation/therapist-availability-status'
import { useAvailabilityChecker, AvailabilityResult } from '@/hooks/use-availability-checker'

export default function TestAvailabilityCheckerPage() {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedDuration, setSelectedDuration] = useState(60)
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState('')
  const [selectedTherapistId, setSelectedTherapistId] = useState('')
  const [checkResult, setCheckResult] = useState<AvailabilityResult | null>(null)
  const [selectedTherapist, setSelectedTherapist] = useState('')

  const { checkAvailability, loading, error } = useAvailabilityChecker()

  const handleCheckAvailability = async () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select both date and time')
      return
    }

    try {
      const result = await checkAvailability({
        therapistId: selectedTherapistId || undefined,
        specialtyId: selectedSpecialtyId || undefined,
        date: selectedDate,
        time: selectedTime,
        duration: selectedDuration
      })
      
      setCheckResult(result)
    } catch (err) {
      console.error('Error checking availability:', err)
    }
  }

  const handleTherapistSelect = (therapistId: string, therapistName: string) => {
    setSelectedTherapistId(therapistId)
    setSelectedTherapist(therapistName)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 3) // 3 months in advance
    return maxDate.toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Availability Checker Test</h1>
          <p className="text-muted-foreground">
            Test the therapist availability checking system
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Check Availability */}
          <div className="space-y-6">
            {/* Availability Check Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Check Specific Availability
                </CardTitle>
                <CardDescription>
                  Check if a specific time slot is available for booking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={getMinDate()}
                      max={getMaxDate()}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(parseInt(value))}>
                      <SelectTrigger>
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
                    <Label htmlFor="specialty">Specialty (Optional)</Label>
                    <Select value={selectedSpecialtyId} onValueChange={setSelectedSpecialtyId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Specialties</SelectItem>
                        <SelectItem value="1">Psicología Clínica</SelectItem>
                        <SelectItem value="2">Fonoaudiología</SelectItem>
                        <SelectItem value="3">Terapia Ocupacional</SelectItem>
                        <SelectItem value="4">Fisioterapia</SelectItem>
                        <SelectItem value="5">Psicopedagogía</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="therapist">Specific Therapist (Optional)</Label>
                  <Input
                    id="therapist"
                    placeholder="Therapist ID (leave empty for any therapist)"
                    value={selectedTherapistId}
                    onChange={(e) => setSelectedTherapistId(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={handleCheckAvailability}
                  disabled={loading || !selectedDate || !selectedTime}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking Availability...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Check Availability
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Check Result */}
            {checkResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={checkResult.isAvailable ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {checkResult.isAvailable ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      Availability Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={checkResult.isAvailable ? "default" : "destructive"}>
                        {checkResult.isAvailable ? 'Available' : 'Not Available'}
                      </Badge>
                    </div>

                    {checkResult.reason && (
                      <p className="text-sm text-muted-foreground">
                        {checkResult.reason}
                      </p>
                    )}

                    {checkResult.therapistName && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <strong>Assigned Therapist:</strong> {checkResult.therapistName}
                        </span>
                      </div>
                    )}

                    {checkResult.conflictingAppointment && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Conflicting Appointment
                          </span>
                        </div>
                        <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                          <p><strong>Patient:</strong> {checkResult.conflictingAppointment.patientName}</p>
                          <p><strong>Time:</strong> {formatTime(checkResult.conflictingAppointment.scheduledTime)}</p>
                          <p><strong>Duration:</strong> {checkResult.conflictingAppointment.duration} minutes</p>
                        </div>
                      </div>
                    )}

                    {checkResult.alternativeSlots && checkResult.alternativeSlots.length > 0 && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Alternative Time Slots
                          </span>
                        </div>
                        <div className="space-y-1">
                          {checkResult.alternativeSlots.map((slot, index) => (
                            <div key={index} className="text-xs text-blue-700 dark:text-blue-300">
                              <strong>{formatTime(slot.time)}</strong> - {slot.therapistName}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Therapist Availability Status */}
          <div>
            {selectedDate ? (
              <TherapistAvailabilityStatus
                date={selectedDate}
                specialtyId={selectedSpecialtyId || undefined}
                onTherapistSelect={handleTherapistSelect}
                selectedTherapistId={selectedTherapistId}
              />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Date</h3>
                  <p className="text-muted-foreground">
                    Choose a date to view therapist availability status
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Debug Information */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="font-medium">Selected Date:</span>
                  <br />
                  {selectedDate || 'None'}
                </div>
                <div>
                  <span className="font-medium">Selected Time:</span>
                  <br />
                  {selectedTime || 'None'}
                </div>
                <div>
                  <span className="font-medium">Duration:</span>
                  <br />
                  {selectedDuration} minutes
                </div>
                <div>
                  <span className="font-medium">Specialty ID:</span>
                  <br />
                  {selectedSpecialtyId || 'None'}
                </div>
                <div>
                  <span className="font-medium">Therapist ID:</span>
                  <br />
                  {selectedTherapistId || 'None'}
                </div>
                <div>
                  <span className="font-medium">Selected Therapist:</span>
                  <br />
                  {selectedTherapist || 'None'}
                </div>
                <div>
                  <span className="font-medium">Loading:</span>
                  <br />
                  {loading ? 'Yes' : 'No'}
                </div>
                <div>
                  <span className="font-medium">Error:</span>
                  <br />
                  {error || 'None'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


