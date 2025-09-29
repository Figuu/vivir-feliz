'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Settings, 
  Users, 
  ArrowLeft,
  RefreshCw,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TherapistSelector } from '@/components/therapist/therapist-selector'
import { ScheduleConfiguration } from '@/components/therapist/schedule-configuration'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  phone?: string
  licenseNumber?: string
  isCoordinator: boolean
  canTakeConsultations: boolean
  isActive: boolean
  specialties: {
    id: string
    specialty: {
      id: string
      name: string
    }
    isPrimary: boolean
  }[]
  schedules: {
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
    isActive: boolean
  }[]
  createdAt: string
}

export default function TherapistSchedulePage() {
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)
  const [scheduleUpdated, setScheduleUpdated] = useState(false)

  const handleTherapistSelect = (therapist: Therapist | null) => {
    setSelectedTherapist(therapist)
    setScheduleUpdated(false)
  }

  const handleScheduleUpdate = () => {
    setScheduleUpdated(true)
    // You could add additional logic here like refreshing data or showing notifications
  }

  const getScheduleSummary = (therapist: Therapist) => {
    const activeSchedules = therapist.schedules.filter(s => s.isActive)
    if (activeSchedules.length === 0) {
      return 'No schedule configured'
    }

    const days = activeSchedules.map(s => s.dayOfWeek.slice(0, 3)).join(', ')
    return `${activeSchedules.length} working days (${days})`
  }

  const getPrimarySpecialties = (therapist: Therapist) => {
    return therapist.specialties
      .filter(s => s.isPrimary)
      .map(s => s.specialty.name)
      .join(', ')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Therapist Schedule Management</h1>
          <p className="text-muted-foreground">
            Configure working hours and availability for therapists
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {scheduleUpdated && (
            <Badge variant="outline" className="text-green-600">
              Schedule Updated
            </Badge>
          )}
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2" />
            About Schedule Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Working Hours</h4>
              <p className="text-muted-foreground">
                Set daily working hours for each therapist including start/end times and break periods.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Break Management</h4>
              <p className="text-muted-foreground">
                Configure lunch breaks and time between sessions to optimize scheduling.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Availability</h4>
              <p className="text-muted-foreground">
                Enable or disable specific days and manage therapist availability for consultations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Therapist Selection */}
        <div className="lg:col-span-1">
          <TherapistSelector
            selectedTherapistId={selectedTherapist?.id}
            onTherapistSelect={handleTherapistSelect}
            showScheduleInfo={true}
            filterActive={true}
            placeholder="Select a therapist to configure their schedule"
          />
        </div>

        {/* Schedule Configuration */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedTherapist ? (
              <motion.div
                key={selectedTherapist.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Therapist Info Header */}
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center">
                          <Calendar className="h-5 w-5 mr-2" />
                          Schedule Configuration
                        </CardTitle>
                        <CardDescription>
                          Configure working hours for {selectedTherapist.firstName} {selectedTherapist.lastName}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedTherapist(null)}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Selection
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm">Current Schedule</h4>
                        <p className="text-sm text-muted-foreground">
                          {getScheduleSummary(selectedTherapist)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Specialties</h4>
                        <p className="text-sm text-muted-foreground">
                          {getPrimarySpecialties(selectedTherapist)}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Status</h4>
                        <div className="flex space-x-2">
                          <Badge variant={selectedTherapist.isActive ? 'default' : 'secondary'}>
                            {selectedTherapist.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {selectedTherapist.canTakeConsultations && (
                            <Badge variant="outline">Consultations</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Schedule Configuration Component */}
                <ScheduleConfiguration
                  therapistId={selectedTherapist.id}
                  onScheduleUpdate={handleScheduleUpdate}
                  readOnly={false}
                />
              </motion.div>
            ) : (
              <motion.div
                key="no-selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Therapist Selected</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a therapist from the list to configure their schedule
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <p>You can:</p>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Set working hours for each day</li>
                        <li>Configure break times</li>
                        <li>Manage session intervals</li>
                        <li>Enable/disable specific days</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Actions */}
      {selectedTherapist && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common actions for schedule management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Schedule
              </Button>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                View All Schedules
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Export Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

