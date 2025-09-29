'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Info,
  X,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ConflictResolutionService, AvailabilityCheck, Conflict, TimeSlotSuggestion } from '@/lib/conflict-resolution'

interface ConflictResolutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onResolve: (suggestedTime: string, suggestedDate: Date) => void
  onCancel: () => void
  conflictData: {
    therapistId: string
    date: Date
    startTime: string
    endTime: string
    duration: number
    excludeSessionId?: string
  }
}

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  onResolve,
  onCancel,
  conflictData
}: ConflictResolutionDialogProps) {
  const [availabilityCheck, setAvailabilityCheck] = useState<AvailabilityCheck | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<TimeSlotSuggestion | null>(null)
  const [autoResolving, setAutoResolving] = useState(false)

  // Check availability when dialog opens
  useEffect(() => {
    if (open && conflictData) {
      checkAvailability()
    }
  }, [open, conflictData])

  const checkAvailability = async () => {
    try {
      setLoading(true)
      
      const result = await ConflictResolutionService.checkAvailability({
        therapistId: conflictData.therapistId,
        date: conflictData.date,
        startTime: conflictData.startTime,
        endTime: conflictData.endTime,
        duration: conflictData.duration,
        excludeSessionId: conflictData.excludeSessionId
      })

      setAvailabilityCheck(result)
    } catch (error) {
      console.error('Error checking availability:', error)
      setAvailabilityCheck({
        available: false,
        reason: 'Error checking availability',
        conflicts: [{
          type: 'THERAPIST_UNAVAILABLE',
          message: 'Unable to verify availability',
          severity: 'ERROR'
        }]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAutoResolve = async () => {
    try {
      setAutoResolving(true)
      
      const result = await ConflictResolutionService.resolveConflicts(
        conflictData.therapistId,
        conflictData.date,
        conflictData.duration,
        {
          preferredTime: conflictData.startTime,
          maxTimeShift: 60,
          allowDifferentDay: false
        }
      )

      if (result.resolved && result.suggestedTime) {
        onResolve(result.suggestedTime, result.suggestedDate || conflictData.date)
      } else {
        // Show error or try manual selection
        console.error('Auto-resolution failed:', result.reason)
      }
    } catch (error) {
      console.error('Error auto-resolving conflicts:', error)
    } finally {
      setAutoResolving(false)
    }
  }

  const handleSuggestionSelect = (suggestion: TimeSlotSuggestion) => {
    setSelectedSuggestion(suggestion)
  }

  const handleApplySuggestion = () => {
    if (selectedSuggestion) {
      onResolve(selectedSuggestion.time, conflictData.date)
    }
  }

  const getConflictIcon = (type: Conflict['type']) => {
    switch (type) {
      case 'SCHEDULE_CONFLICT':
        return <Calendar className="h-4 w-4" />
      case 'BREAK_CONFLICT':
        return <Clock className="h-4 w-4" />
      case 'WORKING_HOURS':
        return <Clock className="h-4 w-4" />
      case 'EXISTING_SESSION':
        return <User className="h-4 w-4" />
      case 'THERAPIST_UNAVAILABLE':
        return <X className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getConflictColor = (severity: Conflict['severity']) => {
    switch (severity) {
      case 'ERROR':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'INFO':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSuggestionPriorityColor = (priority: TimeSlotSuggestion['priority']) => {
    switch (priority) {
      case 'HIGH':
        return 'border-green-500 bg-green-50'
      case 'MEDIUM':
        return 'border-yellow-500 bg-yellow-50'
      case 'LOW':
        return 'border-gray-500 bg-gray-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
            Schedule Conflict Detected
          </DialogTitle>
          <DialogDescription>
            We found conflicts with your requested time slot. Let's resolve them together.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Requested Time Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requested Time Slot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">
                    {conflictData.date.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Time</p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(conflictData.startTime)} - {formatTime(conflictData.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {conflictData.duration} minutes
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    Conflict
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Analyzing conflicts...</span>
            </div>
          )}

          {/* Conflicts */}
          {availabilityCheck && availabilityCheck.conflicts && availabilityCheck.conflicts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Conflicts Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availabilityCheck.conflicts.map((conflict, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Alert className={getConflictColor(conflict.severity)}>
                        <div className="flex items-start space-x-3">
                          {getConflictIcon(conflict.type)}
                          <div className="flex-1">
                            <AlertDescription className="font-medium">
                              {conflict.message}
                            </AlertDescription>
                            {conflict.conflictingItem && (
                              <div className="mt-2 text-sm opacity-75">
                                <p><strong>Type:</strong> {conflict.conflictingItem.type}</p>
                                <p><strong>Time:</strong> {conflict.conflictingItem.startTime} - {conflict.conflictingItem.endTime}</p>
                                {conflict.conflictingItem.description && (
                                  <p><strong>Details:</strong> {conflict.conflictingItem.description}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Alert>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Auto-Resolve Option */}
          {availabilityCheck && !availabilityCheck.available && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Quick Resolution
                </CardTitle>
                <CardDescription>
                  Let us automatically find the best available time slot for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleAutoResolve}
                  disabled={autoResolving}
                  className="w-full"
                >
                  {autoResolving ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  {autoResolving ? 'Finding Best Time...' : 'Auto-Resolve Conflicts'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Suggestions */}
          {availabilityCheck && availabilityCheck.suggestions && availabilityCheck.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Alternative Time Slots
                </CardTitle>
                <CardDescription>
                  Choose from these available time slots:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availabilityCheck.suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        variant={selectedSuggestion?.time === suggestion.time ? "default" : "outline"}
                        className={`w-full h-auto p-4 flex flex-col items-center space-y-2 ${getSuggestionPriorityColor(suggestion.priority)}`}
                        onClick={() => handleSuggestionSelect(suggestion)}
                      >
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-semibold">{formatTime(suggestion.time)}</span>
                        </div>
                        <div className="text-sm opacity-75">
                          {suggestion.duration} minutes
                        </div>
                        <div className="text-xs opacity-60">
                          {suggestion.reason}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            suggestion.priority === 'HIGH' ? 'border-green-500 text-green-700' :
                            suggestion.priority === 'MEDIUM' ? 'border-yellow-500 text-yellow-700' :
                            'border-gray-500 text-gray-700'
                          }`}
                        >
                          {suggestion.priority} Priority
                        </Badge>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Solutions Available */}
          {availabilityCheck && !availabilityCheck.available && 
           (!availabilityCheck.suggestions || availabilityCheck.suggestions.length === 0) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No alternative time slots are available for this day. Please try a different date or contact the therapist directly.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="flex space-x-2">
            {selectedSuggestion && (
              <Button onClick={handleApplySuggestion}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Use Selected Time
              </Button>
            )}
            <Button variant="outline" onClick={checkAvailability}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recheck
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
