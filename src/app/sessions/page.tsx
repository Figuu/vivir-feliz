'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Plus,
  Users,
  Clock,
  BarChart3,
  Settings,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdvancedSessionCalendar } from '@/components/sessions/advanced-session-calendar'
import { SessionSchedulingForm } from '@/components/sessions/session-scheduling-form'

interface Session {
  id: string
  serviceAssignmentId: string
  patientId: string
  therapistId: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
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
    id: string
    service: {
      id: string
      name: string
      type: string
    }
  }
}

export default function SessionsPage() {
  const [activeTab, setActiveTab] = useState('calendar')
  const [showSchedulingForm, setShowSchedulingForm] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [selectedServiceAssignmentId, setSelectedServiceAssignmentId] = useState<string | undefined>()

  const handleSessionSelect = (session: Session) => {
    setSelectedSession(session)
  }

  const handleSessionCreate = () => {
    setShowSchedulingForm(true)
    setActiveTab('schedule')
  }

  const handleSchedulingSuccess = (session: Session) => {
    setShowSchedulingForm(false)
    setSelectedServiceAssignmentId(undefined)
    setActiveTab('calendar')
    // You could add a success notification here
  }

  const handleSchedulingCancel = () => {
    setShowSchedulingForm(false)
    setSelectedServiceAssignmentId(undefined)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Management</h1>
          <p className="text-muted-foreground">
            Schedule and manage therapy sessions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={handleSessionCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              All time sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Sessions for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Therapists</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Therapists with sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">
              Sessions completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="schedule">Schedule Session</TabsTrigger>
          <TabsTrigger value="list">Session List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <AdvancedSessionCalendar
            onSessionSelect={handleSessionSelect}
            onSessionCreate={handleSessionCreate}
            readOnly={false}
          />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <AnimatePresence mode="wait">
            {showSchedulingForm ? (
              <motion.div
                key="scheduling-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SessionSchedulingForm
                  serviceAssignmentId={selectedServiceAssignmentId}
                  onSuccess={handleSchedulingSuccess}
                  onCancel={handleSchedulingCancel}
                />
              </motion.div>
            ) : (
              <motion.div
                key="schedule-placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Schedule a New Session</h3>
                    <p className="text-muted-foreground mb-4">
                      Create a new therapy session for a patient
                    </p>
                    <Button onClick={handleSessionCreate}>
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Session
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Session List
              </CardTitle>
              <CardDescription>
                View and manage all sessions in a list format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Session List View</h3>
                <p className="text-muted-foreground">
                  This view will show all sessions in a table format with filtering and sorting options.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Session Analytics
              </CardTitle>
              <CardDescription>
                View analytics and reports for session data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground">
                  This view will show session analytics, completion rates, and performance metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Selected Session Details */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Selected Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold">Patient</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedSession.patient.firstName} {selectedSession.patient.lastName}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Therapist</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedSession.therapist.firstName} {selectedSession.therapist.lastName}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Service</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedSession.serviceAssignment.service.name}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Date & Time</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedSession.scheduledDate).toLocaleDateString()} at {selectedSession.scheduledTime}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Duration</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedSession.duration} minutes
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Status</h4>
                    <Badge variant="outline">
                      {selectedSession.status.replace('_', ' ')}
                    </Badge>
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
