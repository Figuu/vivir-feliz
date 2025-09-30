'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  UserCheck, 
  Calendar,
  Clock,
  User,
  Search,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface TherapistReassignmentInterfaceProps {
  defaultSessionId?: string
}

interface Session {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: string
  patient: {
    firstName: string
    lastName: string
  }
  therapist: {
    id: string
    firstName: string
    lastName: string
    specialty: string
  }
  service: {
    name: string
  }
}

interface Therapist {
  id: string
  firstName: string
  lastName: string
  specialty: string
  email: string
  phone: string
}

interface ReassignmentHistory {
  id: string
  sessionId: string
  oldTherapist: {
    firstName: string
    lastName: string
  }
  newTherapist: {
    firstName: string
    lastName: string
  }
  reason: string
  reassignedBy: string
  reassignedAt: string
}

export function TherapistReassignmentInterface({ defaultSessionId }: TherapistReassignmentInterfaceProps) {
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [history, setHistory] = useState<ReassignmentHistory[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('reassign')
  
  const [formData, setFormData] = useState({
    sessionId: defaultSessionId || '',
    newTherapistId: '',
    reason: '',
    maintainSchedule: true
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (defaultSessionId) {
      const session = sessions.find(s => s.id === defaultSessionId)
      if (session) {
        handleSelectSession(session)
      }
    }
  }, [defaultSessionId, sessions])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load upcoming sessions
      const sessionsResponse = await fetch('/api/sessions?status=scheduled&limit=50')
      const sessionsData = await sessionsResponse.json()
      if (sessionsData.data) {
        setSessions(sessionsData.data)
      }

      // Load therapists
      const therapistsResponse = await fetch('/api/therapist?limit=100')
      const therapistsData = await therapistsResponse.json()
      if (therapistsData.data) {
        setTherapists(therapistsData.data)
      }

      // Load reassignment history
      loadHistory()
    } catch (err) {
      console.error('Error loading data:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to load data'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      // Fetch reassignment history from audit logs
      const response = await fetch('/api/audit?action=SESSION_REASSIGNED&limit=50')
      if (response.ok) {
        const data = await response.json()
        const reassignmentHistory = data.logs?.map((log: any) => ({
          id: log.id,
          sessionId: log.resourceId,
          oldTherapist: log.oldData?.therapist || { firstName: 'Unknown', lastName: '' },
          newTherapist: log.newData?.therapist || { firstName: 'Unknown', lastName: '' },
          reason: log.metadata?.reason || 'No reason provided',
          reassignedBy: log.userId,
          reassignedAt: log.createdAt
        })) || []
        setHistory(reassignmentHistory)
      }
    } catch (err) {
      console.error('Error loading history:', err)
    }
  }

  const handleSelectSession = (session: Session) => {
    setSelectedSession(session)
    setFormData(prev => ({
      ...prev,
      sessionId: session.id,
      newTherapistId: ''
    }))
    setReassignDialogOpen(true)
  }

  const handleReassign = async () => {
    if (!formData.sessionId || !formData.newTherapistId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please select a session and new therapist'
      })
      return
    }

    if (!formData.reason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please provide a reason for reassignment'
      })
      return
    }

    if (formData.reason.length < 10) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Reason must be at least 10 characters'
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/therapist-reassignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          reassignedBy: 'admin-1' // Should come from auth context
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reassign therapist')
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: 'Therapist reassigned successfully'
      })
      setReassignDialogOpen(false)
      setFormData({
        sessionId: '',
        newTherapistId: '',
        reason: '',
        maintainSchedule: true
      })
      
      // Reload data
      await loadData()
    } catch (err: any) {
      console.error('Error reassigning therapist:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to reassign therapist'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredSessions = sessions.filter(session =>
    searchTerm === '' ||
    session.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.therapist.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.therapist.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.service.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedNewTherapist = therapists.find(t => t.id === formData.newTherapistId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Therapist Reassignment System
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Scheduled Sessions</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Therapists</p>
                <p className="text-2xl font-bold">{therapists.length}</p>
              </div>
              <User className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Reassignments</p>
                <p className="text-2xl font-bold">{history.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reassign">Reassign Therapist</TabsTrigger>
          <TabsTrigger value="history">History ({history.length})</TabsTrigger>
        </TabsList>

        {/* Reassign Tab */}
        <TabsContent value="reassign" className="space-y-4">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sessions by patient, therapist, or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          {loading ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading sessions...</p>
              </CardContent>
            </Card>
          ) : filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sessions Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try a different search term' : 'No scheduled sessions available'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{session.service.name}</h3>
                            <Badge className={getStatusColor(session.status)}>
                              {session.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1">Patient</p>
                              <p className="font-medium">{session.patient.firstName} {session.patient.lastName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Current Therapist</p>
                              <p className="font-medium">{session.therapist.firstName} {session.therapist.lastName}</p>
                              <p className="text-xs text-muted-foreground">{session.therapist.specialty}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Date & Time</p>
                              <p className="font-medium">
                                {new Date(session.scheduledDate).toLocaleDateString()} at {session.scheduledTime}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Duration</p>
                              <p className="font-medium">{session.duration} minutes</p>
                            </div>
                          </div>
                        </div>
                        
                        <Button onClick={() => handleSelectSession(session)} className="ml-4">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Reassign
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {history.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No History</h3>
                <p className="text-muted-foreground">
                  No therapist reassignments have been made yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {history.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="bg-purple-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Reassigned
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(item.reassignedAt).toLocaleDateString()} {new Date(item.reassignedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">From</p>
                            <p className="font-medium">{item.oldTherapist.firstName} {item.oldTherapist.lastName}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">To</p>
                            <p className="font-medium">{item.newTherapist.firstName} {item.newTherapist.lastName}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Reason</p>
                          <p className="text-sm">{item.reason}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reassignment Dialog */}
      <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reassign Therapist</DialogTitle>
            <DialogDescription>
              Change the assigned therapist for this session
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-6 py-4">
              {/* Current Session Info */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Session:</strong> {selectedSession.service.name}</p>
                    <p><strong>Patient:</strong> {selectedSession.patient.firstName} {selectedSession.patient.lastName}</p>
                    <p><strong>Date & Time:</strong> {new Date(selectedSession.scheduledDate).toLocaleDateString()} at {selectedSession.scheduledTime}</p>
                    <p><strong>Current Therapist:</strong> {selectedSession.therapist.firstName} {selectedSession.therapist.lastName}</p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* New Therapist Selection */}
              <div className="space-y-2">
                <Label htmlFor="newTherapist">New Therapist *</Label>
                <select
                  id="newTherapist"
                  value={formData.newTherapistId}
                  onChange={(e) => setFormData({ ...formData, newTherapistId: e.target.value })}
                  className="w-full border rounded-md px-3 py-2"
                  disabled={loading}
                >
                  <option value="">Select a therapist...</option>
                  {therapists
                    .filter(t => t.id !== selectedSession.therapist.id)
                    .map(therapist => (
                      <option key={therapist.id} value={therapist.id}>
                        {therapist.firstName} {therapist.lastName} - {therapist.specialty}
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* New Therapist Info */}
              {selectedNewTherapist && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="space-y-1 text-green-900">
                      <p><strong>Selected:</strong> {selectedNewTherapist.firstName} {selectedNewTherapist.lastName}</p>
                      <p><strong>Specialty:</strong> {selectedNewTherapist.specialty}</p>
                      <p><strong>Email:</strong> {selectedNewTherapist.email}</p>
                      <p><strong>Phone:</strong> {selectedNewTherapist.phone}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Reassignment *</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Explain why the therapist is being reassigned..."
                  rows={4}
                  maxLength={500}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.reason.length}/500 characters (minimum 10)
                </p>
              </div>

              {/* Maintain Schedule */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="maintainSchedule"
                  checked={formData.maintainSchedule}
                  onChange={(e) => setFormData({ ...formData, maintainSchedule: e.target.checked })}
                  className="rounded"
                  disabled={loading}
                />
                <Label htmlFor="maintainSchedule" className="cursor-pointer">
                  Maintain current schedule (check for conflicts)
                </Label>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Both the patient and therapists will be notified of this change.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReassignDialogOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleReassign} disabled={loading || !formData.newTherapistId || !formData.reason.trim()}>
              {loading ? 'Processing...' : 'Reassign Therapist'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
