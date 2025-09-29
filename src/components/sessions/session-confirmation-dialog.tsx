'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  AlertTriangle,
  RefreshCw,
  X,
  Edit,
  MessageSquare,
  Info,
  CheckSquare,
  Square
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
    parent: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string
    }
  }
  therapist: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  serviceAssignment: {
    service: {
      id: string
      name: string
      type: string
    }
  }
}

interface SessionConfirmationDialogProps {
  confirmationToken: string
  onConfirmationComplete?: (result: any) => void
  onRescheduleRequest?: (result: any) => void
  onCancel?: () => void
}

export function SessionConfirmationDialog({
  confirmationToken,
  onConfirmationComplete,
  onRescheduleRequest,
  onCancel
}: SessionConfirmationDialogProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<'confirm' | 'reschedule' | 'cancel' | null>(null)
  const [showRescheduleForm, setShowRescheduleForm] = useState(false)
  const [showCancelForm, setShowCancelForm] = useState(false)

  // Form state
  const [confirmationForm, setConfirmationForm] = useState({
    notes: '',
    confirmedBy: 'PARENT' as 'PATIENT' | 'PARENT' | 'THERAPIST' | 'ADMIN',
    confirmationMethod: 'WEB' as 'EMAIL' | 'SMS' | 'WEB' | 'PHONE'
  })

  const [rescheduleForm, setRescheduleForm] = useState({
    reason: '',
    newDate: '',
    newTime: '',
    preferredAlternatives: [] as Array<{ date: string; time: string }>
  })

  const [cancelForm, setCancelForm] = useState({
    reason: '',
    cancelledBy: 'PARENT' as 'PATIENT' | 'PARENT' | 'THERAPIST' | 'ADMIN'
  })

  // Load session data
  useEffect(() => {
    if (confirmationToken) {
      loadSessionData()
    }
  }, [confirmationToken])

  const loadSessionData = async () => {
    try {
      setLoading(true)
      setError(null)

      // In a real implementation, you would fetch session data using the confirmation token
      // For now, we'll simulate the data
      const mockSession: Session = {
        id: 'session-123',
        scheduledDate: '2024-01-15',
        scheduledTime: '14:00',
        duration: 60,
        status: 'SCHEDULED',
        patient: {
          id: 'patient-123',
          firstName: 'John',
          lastName: 'Doe',
          parent: {
            id: 'parent-123',
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com',
            phone: '+1234567890'
          }
        },
        therapist: {
          id: 'therapist-123',
          firstName: 'Dr. Sarah',
          lastName: 'Smith',
          email: 'sarah.smith@therapy.com',
          phone: '+1234567891'
        },
        serviceAssignment: {
          service: {
            id: 'service-123',
            name: 'Speech Therapy',
            type: 'SPEECH_THERAPY'
          }
        }
      }

      setSession(mockSession)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load session data'
      setError(errorMessage)
      console.error('Error loading session data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSession = async () => {
    if (!session) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/confirmation?action=confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationToken,
          ...confirmationForm
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to confirm session')
      }

      toast.success('Session confirmed successfully!')
      
      if (onConfirmationComplete) {
        onConfirmationComplete(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm session'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error confirming session:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRescheduleRequest = async () => {
    if (!session) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/confirmation?action=reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          newDate: rescheduleForm.newDate,
          newTime: rescheduleForm.newTime,
          reason: rescheduleForm.reason,
          preferredAlternatives: rescheduleForm.preferredAlternatives
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit reschedule request')
      }

      toast.success('Reschedule request submitted successfully!')
      
      if (onRescheduleRequest) {
        onRescheduleRequest(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit reschedule request'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error submitting reschedule request:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSession = async () => {
    if (!session) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/confirmation?action=cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          reason: cancelForm.reason,
          cancelledBy: cancelForm.cancelledBy
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel session')
      }

      toast.success('Session cancelled successfully!')
      
      if (onCancel) {
        onCancel()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel session'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error cancelling session:', err)
    } finally {
      setLoading(false)
    }
  }

  const addPreferredAlternative = () => {
    setRescheduleForm(prev => ({
      ...prev,
      preferredAlternatives: [...prev.preferredAlternatives, { date: '', time: '' }]
    }))
  }

  const removePreferredAlternative = (index: number) => {
    setRescheduleForm(prev => ({
      ...prev,
      preferredAlternatives: prev.preferredAlternatives.filter((_, i) => i !== index)
    }))
  }

  const updatePreferredAlternative = (index: number, field: 'date' | 'time', value: string) => {
    setRescheduleForm(prev => ({
      ...prev,
      preferredAlternatives: prev.preferredAlternatives.map((alt, i) => 
        i === index ? { ...alt, [field]: value } : alt
      )
    }))
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

  if (loading && !session) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading session details...</span>
        </CardContent>
      </Card>
    )
  }

  if (error && !session) {
    return (
      <Card>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!session) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Session Not Found</h3>
          <p className="text-muted-foreground">
            The session you're looking for could not be found or has expired.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Session Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Session Confirmation
          </CardTitle>
          <CardDescription>
            Please confirm your upcoming therapy session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Patient</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{session.patient.firstName} {session.patient.lastName}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Therapist</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{session.therapist.firstName} {session.therapist.lastName}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Service</Label>
                <div className="mt-1">
                  <Badge variant="outline">{session.serviceAssignment.service.name}</Badge>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Date & Time</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(session.scheduledDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatTime(session.scheduledTime)}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Duration</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDuration(session.duration)}</span>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                    {session.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!action && (
        <Card>
          <CardHeader>
            <CardTitle>What would you like to do?</CardTitle>
            <CardDescription>
              Please select an action for this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => setAction('confirm')}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <CheckCircle className="h-6 w-6" />
                <span>Confirm Session</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setAction('reschedule')}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <Edit className="h-6 w-6" />
                <span>Request Reschedule</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setAction('cancel')}
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <X className="h-6 w-6" />
                <span>Cancel Session</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Form */}
      {action === 'confirm' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirm Session
              </CardTitle>
              <CardDescription>
                Please confirm that you will attend this session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requests or notes for this session..."
                  value={confirmationForm.notes}
                  onChange={(e) => setConfirmationForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  By confirming this session, you acknowledge that you will attend at the scheduled time.
                  If you need to make changes, please contact us at least 24 hours in advance.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setAction(null)}>
                  Back
                </Button>
                <Button onClick={handleConfirmSession} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirm Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Reschedule Form */}
      {action === 'reschedule' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="h-5 w-5 mr-2" />
                Request Reschedule
              </CardTitle>
              <CardDescription>
                Please provide your preferred new time and reason for rescheduling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reason">Reason for Rescheduling</Label>
                <Textarea
                  id="reason"
                  placeholder="Please explain why you need to reschedule this session..."
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="mt-1"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newDate">Preferred New Date</Label>
                  <input
                    id="newDate"
                    type="date"
                    value={rescheduleForm.newDate}
                    onChange={(e) => setRescheduleForm(prev => ({ ...prev, newDate: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="newTime">Preferred New Time</Label>
                  <input
                    id="newTime"
                    type="time"
                    value={rescheduleForm.newTime}
                    onChange={(e) => setRescheduleForm(prev => ({ ...prev, newTime: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Alternative Times (Optional)</Label>
                <div className="space-y-2 mt-1">
                  {rescheduleForm.preferredAlternatives.map((alt, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={alt.date}
                        onChange={(e) => updatePreferredAlternative(index, 'date', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <input
                        type="time"
                        value={alt.time}
                        onChange={(e) => updatePreferredAlternative(index, 'time', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePreferredAlternative(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addPreferredAlternative}
                  >
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Add Alternative Time
                  </Button>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your reschedule request will be reviewed and we will contact you to confirm the new time.
                  Please provide as many alternative times as possible to help us find a suitable replacement.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setAction(null)}>
                  Back
                </Button>
                <Button 
                  onClick={handleRescheduleRequest} 
                  disabled={loading || !rescheduleForm.reason || !rescheduleForm.newDate || !rescheduleForm.newTime}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Edit className="h-4 w-4 mr-2" />
                  )}
                  Submit Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Cancel Form */}
      {action === 'cancel' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <X className="h-5 w-5 mr-2" />
                Cancel Session
              </CardTitle>
              <CardDescription>
                Please provide a reason for cancelling this session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cancelReason">Reason for Cancellation</Label>
                <Textarea
                  id="cancelReason"
                  placeholder="Please explain why you need to cancel this session..."
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="mt-1"
                  rows={3}
                  required
                />
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Cancelling this session may affect your treatment plan.
                  Please consider rescheduling instead if possible. Cancellation fees may apply.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setAction(null)}>
                  Back
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleCancelSession} 
                  disabled={loading || !cancelForm.reason}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Cancel Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
