'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock,
  Edit,
  Save,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar,
  Timer,
  Users,
  ArrowRight,
  ArrowLeft,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

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
  therapist: {
    id: string
    firstName: string
    lastName: string
  }
  serviceAssignment: {
    service: {
      id: string
      name: string
      type: string
    }
  }
  sessionNotes?: string
}

interface SessionTimingAdjusterProps {
  session: Session
  onAdjustmentComplete?: (result: any) => void
  onCancel?: () => void
}

export function SessionTimingAdjuster({
  session,
  onAdjustmentComplete,
  onCancel
}: SessionTimingAdjusterProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    newDuration: session.duration,
    reason: '',
    adjustFollowingSessions: false
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Validate form data
  const validateForm = () => {
    const errors: string[] = []

    if (formData.newDuration < 15) {
      errors.push('Duration must be at least 15 minutes')
    }

    if (formData.newDuration > 480) {
      errors.push('Duration cannot exceed 480 minutes (8 hours)')
    }

    if (formData.newDuration === session.duration) {
      errors.push('New duration must be different from current duration')
    }

    if (formData.reason.trim().length === 0) {
      errors.push('Reason for adjustment is required')
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  // Generate preview of changes
  const generatePreview = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError(null)

      // Calculate new end time
      const [hours, minutes] = session.scheduledTime.split(':').map(Number)
      const startTime = hours * 60 + minutes
      const newEndTime = startTime + formData.newDuration
      const newEndTimeString = `${Math.floor(newEndTime / 60).toString().padStart(2, '0')}:${(newEndTime % 60).toString().padStart(2, '0')}`

      // Calculate duration difference
      const durationDifference = formData.newDuration - session.duration

      setPreview({
        originalDuration: session.duration,
        newDuration: formData.newDuration,
        durationDifference,
        newEndTime: newEndTimeString,
        originalEndTime: `${Math.floor((startTime + session.duration) / 60).toString().padStart(2, '0')}:${((startTime + session.duration) % 60).toString().padStart(2, '0')}`,
        impact: {
          timeShift: durationDifference,
          affectsFollowingSessions: formData.adjustFollowingSessions
        }
      })

      setShowPreview(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview'
      setError(errorMessage)
      console.error('Error generating preview:', err)
    } finally {
      setLoading(false)
    }
  }

  // Apply timing adjustment
  const handleApplyAdjustment = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/duration-timing?action=adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          newDuration: formData.newDuration,
          reason: formData.reason,
          adjustFollowingSessions: formData.adjustFollowingSessions
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to adjust session timing')
      }

      toast.success('Session timing adjusted successfully')
      
      if (onAdjustmentComplete) {
        onAdjustmentComplete(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to adjust session timing'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error adjusting session timing:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Session Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Session Timing Adjustment
          </CardTitle>
          <CardDescription>
            Adjust the duration and timing for this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Patient</Label>
              <p className="text-sm">
                {session.patient.firstName} {session.patient.lastName}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Therapist</Label>
              <p className="text-sm">
                {session.therapist.firstName} {session.therapist.lastName}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Service</Label>
              <p className="text-sm">{session.serviceAssignment.service.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Badge variant="outline">{session.status}</Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Date & Time</Label>
              <p className="text-sm">
                {new Date(session.scheduledDate).toLocaleDateString()} at {formatTime(session.scheduledTime)}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Current Duration</Label>
              <p className="text-sm">{formatDuration(session.duration)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Edit className="h-5 w-5 mr-2" />
            Duration Adjustment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="newDuration">New Duration (minutes)</Label>
              <Input
                id="newDuration"
                type="number"
                min="15"
                max="480"
                value={formData.newDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, newDuration: parseInt(e.target.value) || 60 }))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Current: {session.duration} minutes
              </p>
            </div>
            
            <div>
              <Label>Duration Change</Label>
              <div className="mt-1 p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  {formData.newDuration > session.duration ? (
                    <ArrowRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowLeft className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    formData.newDuration > session.duration ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {Math.abs(formData.newDuration - session.duration)} minutes
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formData.newDuration > session.duration ? 'increase' : 'decrease'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Adjustment</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this duration adjustment is necessary..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.adjustFollowingSessions}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, adjustFollowingSessions: checked }))}
            />
            <Label>Adjust following sessions on the same day</Label>
          </div>

          {formData.adjustFollowingSessions && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This will automatically shift all subsequent sessions on the same day to accommodate the duration change.
                Sessions will be moved by {Math.abs(formData.newDuration - session.duration)} minutes.
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-sm">{error}</div>
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

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={generatePreview}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Preview Changes
              </Button>
              <Button
                onClick={handleApplyAdjustment}
                disabled={loading || validationErrors.length > 0}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Apply Adjustment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <AnimatePresence>
        {showPreview && preview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Adjustment Preview
                </CardTitle>
                <CardDescription>
                  Review the changes before applying them
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Duration Change</Label>
                      <div className="mt-1 p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Original:</span>
                          <span className="font-medium">{formatDuration(preview.originalDuration)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">New:</span>
                          <span className="font-medium">{formatDuration(preview.newDuration)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t pt-2 mt-2">
                          <span className="text-sm font-medium">Change:</span>
                          <span className={`font-medium ${
                            preview.durationDifference > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {preview.durationDifference > 0 ? '+' : ''}{preview.durationDifference} minutes
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Time Impact</Label>
                      <div className="mt-1 p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Start Time:</span>
                          <span className="font-medium">{formatTime(session.scheduledTime)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Original End:</span>
                          <span className="font-medium">{formatTime(preview.originalEndTime)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">New End:</span>
                          <span className="font-medium">{formatTime(preview.newEndTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {preview.impact.affectsFollowingSessions && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium mb-1">Following Sessions Impact</div>
                        <div className="text-sm">
                          All subsequent sessions on {new Date(session.scheduledDate).toLocaleDateString()} will be shifted by {Math.abs(preview.impact.timeShift)} minutes.
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end">
                    <Button onClick={() => setShowPreview(false)} variant="outline">
                      Close Preview
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
