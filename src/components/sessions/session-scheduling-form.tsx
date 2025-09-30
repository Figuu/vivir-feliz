'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Clock, 
  User, 
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Users,
  Timer,
  FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface ServiceAssignment {
  id: string
  serviceId: string
  therapistId: string
  totalSessions: number
  completedSessions: number
  costPerSession: number
  status: string
  startDate?: string
  endDate?: string
  service: {
    id: string
    name: string
    type: string
    sessionDuration: number
  }
  therapist: {
    id: string
    firstName: string
    lastName: string
  }
  proposalService: {
    therapeuticProposal: {
      patientId: string
      patient: {
        id: string
        firstName: string
        lastName: string
        dateOfBirth: string
      }
    }
  }
}

interface SessionSchedulingFormProps {
  serviceAssignmentId?: string
  onSuccess?: (session: any) => void
  onCancel?: () => void
  initialData?: {
    scheduledDate?: string
    scheduledTime?: string
    duration?: number
    notes?: string
  }
}

export function SessionSchedulingForm({
  serviceAssignmentId,
  onSuccess,
  onCancel,
  initialData
}: SessionSchedulingFormProps) {
  const [serviceAssignment, setServiceAssignment] = useState<ServiceAssignment | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    scheduledDate: initialData?.scheduledDate || '',
    scheduledTime: initialData?.scheduledTime || '',
    duration: initialData?.duration || 60,
    notes: initialData?.notes || ''
  })

  // Load service assignment data
  useEffect(() => {
    if (serviceAssignmentId) {
      loadServiceAssignment()
    }
  }, [serviceAssignmentId])

  // Load available time slots when date changes
  useEffect(() => {
    if (formData.scheduledDate && serviceAssignment) {
      loadAvailableSlots()
    }
  }, [formData.scheduledDate, serviceAssignment])

  const loadServiceAssignment = async () => {
    if (!serviceAssignmentId) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/service-assignments/${serviceAssignmentId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load service assignment')
      }

      setServiceAssignment(result.serviceAssignment)
      
      // Set default duration from service
      if (result.serviceAssignment?.service?.sessionDuration) {
        setFormData(prev => ({
          ...prev,
          duration: result.serviceAssignment.service.sessionDuration
        }))
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load service assignment'
      setError(errorMessage)
      console.error('Error loading service assignment:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableSlots = async () => {
    if (!formData.scheduledDate || !serviceAssignment) return

    try {
      setLoadingSlots(true)

      const date = new Date(formData.scheduledDate)
      const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
      
      const params = new URLSearchParams()
      params.append('month', month)
      params.append('therapistId', serviceAssignment.therapistId)
      params.append('date', formData.scheduledDate)

      const response = await fetch(`/api/consultation/availability?${params.toString()}`)
      const result = await response.json()

      if (response.ok && result.success) {
        const daySlots = result.data.availability[formData.scheduledDate] || []
        setAvailableSlots(daySlots.map((slot: any) => ({
          time: slot.time,
          available: slot.available
        })))
      } else {
        setAvailableSlots([])
      }
    } catch (err) {
      console.error('Error loading available slots:', err)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!serviceAssignment) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Service assignment not loaded'
      })
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceAssignmentId: serviceAssignment.id,
          patientId: serviceAssignment.proposalService.therapeuticProposal.patientId,
          therapistId: serviceAssignment.therapistId,
          scheduledDate: new Date(formData.scheduledDate).toISOString(),
          scheduledTime: formData.scheduledTime,
          duration: formData.duration,
          notes: formData.notes
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create session')
      }

      toast({
        title: "Success",
        description: 'Session scheduled successfully'
      })
      
      if (onSuccess) {
        onSuccess(result.session)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule session'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error scheduling session:', err)
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getAvailableSlotsForSelectedTime = () => {
    return availableSlots.filter(slot => slot.available)
  }

  const isTimeSlotAvailable = (time: string) => {
    return availableSlots.some(slot => slot.time === time && slot.available)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading service assignment...</span>
        </CardContent>
      </Card>
    )
  }

  if (error && !serviceAssignment) {
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
                onClick={loadServiceAssignment}
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Schedule Session
        </CardTitle>
        <CardDescription>
          Create a new therapy session
        </CardDescription>
      </CardHeader>
      <CardContent>
        {serviceAssignment && (
          <div className="space-y-6">
            {/* Service Assignment Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-sm font-medium">Patient</Label>
                <p className="text-sm">
                  {serviceAssignment.proposalService.therapeuticProposal.patient.firstName}{' '}
                  {serviceAssignment.proposalService.therapeuticProposal.patient.lastName}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Therapist</Label>
                <p className="text-sm">
                  {serviceAssignment.therapist.firstName} {serviceAssignment.therapist.lastName}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Service</Label>
                <p className="text-sm">{serviceAssignment.service.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Progress</Label>
                <p className="text-sm">
                  {serviceAssignment.completedSessions} / {serviceAssignment.totalSessions} sessions
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <p className="text-sm">{serviceAssignment.status}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Cost per Session</Label>
                <p className="text-sm">${serviceAssignment.costPerSession}</p>
              </div>
            </div>

            {/* Session Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <Label htmlFor="scheduledDate">Session Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="mt-1"
                  />
                </div>

                {/* Duration */}
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    max="480"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Time Selection */}
              {formData.scheduledDate && (
                <div>
                  <Label>Available Time Slots</Label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Loading available slots...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      {getAvailableSlotsForSelectedTime().map((slot) => (
                        <Button
                          key={slot.time}
                          type="button"
                          variant={formData.scheduledTime === slot.time ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, scheduledTime: slot.time }))}
                          className="h-auto p-3 flex flex-col items-center"
                        >
                          <Clock className="h-4 w-4 mb-1" />
                          <span className="text-sm">{formatTime(slot.time)}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  {!loadingSlots && getAvailableSlotsForSelectedTime().length === 0 && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        No available time slots for this date. Please select a different date.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Session Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes for this session..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !formData.scheduledDate || !formData.scheduledTime}
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? 'Scheduling...' : 'Schedule Session'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
