'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAvailabilityChecker, TherapistAvailability } from '@/hooks/use-availability-checker'

interface TherapistAvailabilityStatusProps {
  date: string
  specialtyId?: string
  onTherapistSelect?: (therapistId: string, therapistName: string) => void
  selectedTherapistId?: string
}

export function TherapistAvailabilityStatus({
  date,
  specialtyId,
  onTherapistSelect,
  selectedTherapistId
}: TherapistAvailabilityStatusProps) {
  const [therapistAvailability, setTherapistAvailability] = useState<TherapistAvailability[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const { 
    getTherapistAvailability, 
    loading, 
    error 
  } = useAvailabilityChecker()

  const loadAvailability = async () => {
    try {
      const availability = await getTherapistAvailability(date, specialtyId)
      setTherapistAvailability(availability)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load therapist availability:', err)
    }
  }

  useEffect(() => {
    if (date) {
      loadAvailability()
    }
  }, [date, specialtyId])

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getAvailabilityIcon = (isAvailable: boolean) => {
    if (isAvailable) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getAvailabilityBadge = (isAvailable: boolean, reason?: string) => {
    if (isAvailable) {
      return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Available</Badge>
    } else {
      return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Unavailable</Badge>
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const availableTherapists = therapistAvailability.filter(t => t.isAvailable)
  const unavailableTherapists = therapistAvailability.filter(t => !t.isAvailable)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Therapist Availability
              </CardTitle>
              <CardDescription>
                Available therapists for {new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAvailability}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Loading therapist availability...</h3>
            <p className="text-muted-foreground">
              Checking schedules and existing appointments
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-600">Error loading availability</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={loadAvailability}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Available Therapists */}
      {!loading && !error && availableTherapists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Available Therapists ({availableTherapists.length})
            </CardTitle>
            <CardDescription>
              These therapists have available time slots for your selected date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableTherapists.map((therapist, index) => (
                <motion.div
                  key={therapist.therapistId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTherapistId === therapist.therapistId 
                        ? 'border-primary ring-2 ring-primary' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => onTherapistSelect?.(therapist.therapistId, therapist.therapistName)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(therapist.therapistName)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{therapist.therapistName}</h4>
                            {getAvailabilityIcon(therapist.isAvailable)}
                            {getAvailabilityBadge(therapist.isAvailable)}
                          </div>
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {therapist.specialties.map((specialty) => (
                              <Badge key={specialty} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                          
                          {therapist.nextAvailableSlot && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              Next available: {formatTime(therapist.nextAvailableSlot)}
                            </div>
                          )}
                        </div>
                        
                        {selectedTherapistId === therapist.therapistId && (
                          <CheckCircle className="h-6 w-6 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unavailable Therapists */}
      {!loading && !error && unavailableTherapists.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Unavailable Therapists ({unavailableTherapists.length})
            </CardTitle>
            <CardDescription>
              These therapists are not available for the selected date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unavailableTherapists.map((therapist, index) => (
                <motion.div
                  key={therapist.therapistId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {getInitials(therapist.therapistName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-sm">{therapist.therapistName}</h5>
                        {getAvailabilityIcon(therapist.isAvailable)}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-1">
                        {therapist.specialties.map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      
                      {therapist.reason && (
                        <p className="text-xs text-muted-foreground">
                          {therapist.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Therapists Available */}
      {!loading && !error && therapistAvailability.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No therapists found</h3>
            <p className="text-muted-foreground">
              {specialtyId 
                ? 'No therapists available for the selected specialty on this date.'
                : 'No therapists are available for the selected date.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {!loading && !error && therapistAvailability.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium">{availableTherapists.length} Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium">{unavailableTherapists.length} Unavailable</span>
                </div>
              </div>
              <div className="text-muted-foreground">
                Total: {therapistAvailability.length} therapists
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


