'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar,
  Clock,
  Users,
  Settings,
  Play,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Minus,
  Zap,
  FileText,
  BarChart3,
  Timer,
  User,
  Package,
  DollarSign
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Proposal {
  id: string
  status: string
  selectedProposal: 'A' | 'B' | null
  treatmentPeriod: string
  patient: {
    id: string
    firstName: string
    lastName: string
  }
  therapist: {
    id: string
    firstName: string
    lastName: string
  }
}

interface Service {
  id: string
  serviceId: string
  serviceName: string
  serviceType: string
  sessionDuration: number
  assignedTherapist: {
    id: string
    firstName: string
    lastName: string
  } | null
  proposalA: {
    sessions: number
    costPerSession: number | null
  }
  proposalB: {
    sessions: number
    costPerSession: number | null
  }
  existingSessions: any[]
}

interface BulkSchedulingOptions {
  proposal: Proposal
  services: Service[]
  therapistSchedules: any[]
  availability: {
    workingDays: string[]
    workingHours: any
  }
}

interface BulkSessionSchedulerProps {
  proposalId: string
  onSuccess?: (result: any) => void
  onCancel?: () => void
}

export function BulkSessionScheduler({
  proposalId,
  onSuccess,
  onCancel
}: BulkSessionSchedulerProps) {
  const [options, setOptions] = useState<BulkSchedulingOptions | null>(null)
  const [loading, setLoading] = useState(false)
  const [scheduling, setScheduling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    frequency: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'BIWEEKLY',
    daysOfWeek: [] as string[],
    timeSlots: [{ time: '09:00', duration: 60 }],
    notes: '',
    autoResolveConflicts: true,
    maxTimeShift: 60
  })

  // Load scheduling options
  useEffect(() => {
    loadSchedulingOptions()
  }, [proposalId])

  const loadSchedulingOptions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/proposals/${proposalId}/bulk-schedule`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load scheduling options')
      }

      setOptions(result.data)
      
      // Set default end date (3 months from start)
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 3)
      
      setFormData(prev => ({
        ...prev,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load scheduling options'
      setError(errorMessage)
      console.error('Error loading scheduling options:', err)
    } finally {
      setLoading(false)
    }
  }

  const generatePreview = () => {
    if (!options || !formData.startDate || !formData.endDate) return

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const dates: Date[] = []

    let currentDate = new Date(start)
    while (currentDate <= end) {
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
      
      if (formData.daysOfWeek.length === 0 || formData.daysOfWeek.includes(dayOfWeek)) {
        dates.push(new Date(currentDate))
      }

      switch (formData.frequency) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + 1)
          break
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case 'BIWEEKLY':
          currentDate.setDate(currentDate.getDate() + 14)
          break
      }
    }

    const totalSessions = dates.length * formData.timeSlots.length
    const servicesWithSessions = options.services.map(service => {
      const selectedProposal = options.proposal.selectedProposal === 'A' ? service.proposalA : service.proposalB
      const maxSessions = Math.min(selectedProposal.sessions, totalSessions)
      
      return {
        ...service,
        maxSessions,
        estimatedCost: maxSessions * (selectedProposal.costPerSession || 0)
      }
    })

    setPreview({
      totalDates: dates.length,
      totalSessions,
      servicesWithSessions,
      estimatedTotalCost: servicesWithSessions.reduce((sum, service) => sum + service.estimatedCost, 0),
      dates: dates.slice(0, 10) // Show first 10 dates
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!options) return

    try {
      setScheduling(true)
      setError(null)

      const response = await fetch(`/api/proposals/${proposalId}/bulk-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to schedule sessions')
      }

      toast.success(`Successfully created ${result.results.summary.totalSessionsCreated} sessions`)
      
      if (onSuccess) {
        onSuccess(result.results)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule sessions'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error scheduling sessions:', err)
    } finally {
      setScheduling(false)
    }
  }

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { time: '09:00', duration: 60 }]
    }))
  }

  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }))
  }

  const updateTimeSlot = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) => 
        i === index ? { ...slot, [field]: value } : slot
      )
    }))
  }

  const toggleDayOfWeek = (day: string) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day]
    }))
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading scheduling options...</span>
        </CardContent>
      </Card>
    )
  }

  if (error && !options) {
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
                onClick={loadSchedulingOptions}
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

  if (!options) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Bulk Session Scheduling
          </CardTitle>
          <CardDescription>
            Schedule multiple sessions for approved proposal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Patient</Label>
              <p className="text-sm">
                {options.proposal.patient.firstName} {options.proposal.patient.lastName}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Therapist</Label>
              <p className="text-sm">
                {options.proposal.therapist.firstName} {options.proposal.therapist.lastName}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Selected Proposal</Label>
              <Badge variant="outline">
                Proposal {options.proposal.selectedProposal}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Services to Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {options.services.map((service, index) => {
              const selectedProposal = options.proposal.selectedProposal === 'A' ? service.proposalA : service.proposalB
              return (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{service.serviceName}</h4>
                    <Badge variant="outline">{service.serviceType}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-xs">Sessions</Label>
                      <p className="font-medium">{selectedProposal.sessions}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Duration</Label>
                      <p className="font-medium">{service.sessionDuration} min</p>
                    </div>
                    <div>
                      <Label className="text-xs">Cost per Session</Label>
                      <p className="font-medium">${selectedProposal.costPerSession || 0}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Total Cost</Label>
                      <p className="font-medium text-green-600">
                        ${(selectedProposal.sessions * (selectedProposal.costPerSession || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Scheduling Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Scheduling Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  min={formData.startDate}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={formData.frequency} onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
                    <Button
                      key={day}
                      type="button"
                      variant={formData.daysOfWeek.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDayOfWeek(day)}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Time Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.timeSlots.map((slot, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={slot.time}
                      onChange={(e) => updateTimeSlot(index, 'time', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="15"
                      max="480"
                      value={slot.duration}
                      onChange={(e) => updateTimeSlot(index, 'duration', parseInt(e.target.value) || 60)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTimeSlot(index)}
                      disabled={formData.timeSlots.length === 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addTimeSlot}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Advanced Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.autoResolveConflicts}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoResolveConflicts: checked }))}
              />
              <Label>Auto-resolve conflicts</Label>
            </div>
            
            {formData.autoResolveConflicts && (
              <div>
                <Label htmlFor="maxTimeShift">Maximum time shift (minutes)</Label>
                <Input
                  id="maxTimeShift"
                  type="number"
                  min="0"
                  max="480"
                  value={formData.maxTimeShift}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxTimeShift: parseInt(e.target.value) || 60 }))}
                  className="mt-1"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="notes">Session Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add notes for all scheduled sessions..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Scheduling Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={generatePreview}
                disabled={!formData.startDate || !formData.endDate}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Preview
              </Button>
              
              {preview && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{preview.totalDates}</div>
                      <div className="text-sm text-muted-foreground">Scheduling Dates</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{preview.totalSessions}</div>
                      <div className="text-sm text-muted-foreground">Total Sessions</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">${preview.estimatedTotalCost.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Estimated Cost</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Sample Dates:</h4>
                    <div className="flex flex-wrap gap-2">
                      {preview.dates.map((date: Date, index: number) => (
                        <Badge key={index} variant="outline">
                          {date.toLocaleDateString()}
                        </Badge>
                      ))}
                      {preview.totalDates > 10 && (
                        <Badge variant="outline">
                          +{preview.totalDates - 10} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
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

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={scheduling}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={scheduling || !formData.startDate || !formData.endDate}
          >
            {scheduling ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {scheduling ? 'Scheduling...' : 'Schedule Sessions'}
          </Button>
        </div>
      </form>
    </div>
  )
}
