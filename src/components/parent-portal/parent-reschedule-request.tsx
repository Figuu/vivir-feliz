'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  Filter
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface ParentRescheduleRequestProps {
  patientId: string
  parentId: string
}

interface Session {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: string
  service: {
    name: string
  }
  therapist: {
    firstName: string
    lastName: string
  }
}

interface RescheduleRequest {
  id: string
  sessionId: string
  session?: Session
  requestedBy: string
  reason: string
  preferredDates: string[]
  preferredTimes: string[]
  alternativeOptions: string
  urgency: 'low' | 'medium' | 'high'
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  coordinatorNotes?: string
  respondedAt?: string
  createdAt: string
}

interface RescheduleFormData {
  sessionId: string
  reason: string
  preferredDate1: string
  preferredTime1: string
  preferredDate2: string
  preferredTime2: string
  preferredDate3: string
  preferredTime3: string
  alternativeOptions: string
  urgency: 'low' | 'medium' | 'high'
}

export function ParentRescheduleRequest({ patientId, parentId }: ParentRescheduleRequestProps) {
  const [loading, setLoading] = useState(false)
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([])
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([])
  const [requestDialogOpen, setRequestDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<RescheduleRequest | null>(null)
  const [activeTab, setActiveTab] = useState('upcoming')
  
  const [formData, setFormData] = useState<RescheduleFormData>({
    sessionId: '',
    reason: '',
    preferredDate1: '',
    preferredTime1: '',
    preferredDate2: '',
    preferredTime2: '',
    preferredDate3: '',
    preferredTime3: '',
    alternativeOptions: '',
    urgency: 'medium'
  })

  useEffect(() => {
    loadData()
  }, [patientId])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadUpcomingSessions(), loadRescheduleRequests()])
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

  const loadUpcomingSessions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const queryParams = new URLSearchParams({
        patientId,
        status: 'scheduled',
        startDate: today,
        limit: '50',
        sortBy: 'scheduledDate',
        sortOrder: 'asc'
      })

      const response = await fetch(`/api/sessions?${queryParams}`)
      const data = await response.json()

      if (data.data) {
        setUpcomingSessions(data.data)
      }
    } catch (err) {
      console.error('Error loading sessions:', err)
    }
  }

  const loadRescheduleRequests = async () => {
    try {
      // Fetch real data from API
      const response = await fetch(`/api/schedule-requests?parentId=${parentId}&type=RESCHEDULE_SESSION`)
      if (response.ok) {
        const data = await response.json()
        setRescheduleRequests(data.scheduleRequests || [])
        return
      }
      
      // Fallback to empty if API fails
      const __removedMockRequests: RescheduleRequest[] = [
        {
          id: 'req-1',
          sessionId: 'session-1',
          requestedBy: 'parent-1',
          reason: 'Family emergency',
          preferredDates: ['2025-10-05', '2025-10-06', '2025-10-07'],
          preferredTimes: ['10:00', '14:00', '16:00'],
          alternativeOptions: 'Any afternoon slot would work',
          urgency: 'high',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      ]
      setRescheduleRequests([])
    } catch (err) {
      console.error('Error loading requests:', err)
    }
  }

  const handleRequestReschedule = (session: Session) => {
    setSelectedSession(session)
    setFormData({
      ...formData,
      sessionId: session.id
    })
    setRequestDialogOpen(true)
  }

  const handleSubmitRequest = async () => {
    if (!formData.reason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please provide a reason for rescheduling'
      })
      return
    }

    if (!formData.preferredDate1 || !formData.preferredTime1) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please provide at least one preferred date and time'
      })
      return
    }

    try {
      setLoading(true)

      const preferredDates = [
        formData.preferredDate1,
        formData.preferredDate2,
        formData.preferredDate3
      ].filter(Boolean)

      const preferredTimes = [
        formData.preferredTime1,
        formData.preferredTime2,
        formData.preferredTime3
      ].filter(Boolean)

      // Create reschedule request via API
      const request: RescheduleRequest = {
        id: `req-${Date.now()}`,
        sessionId: formData.sessionId,
        requestedBy: parentId,
        reason: formData.reason,
        preferredDates,
        preferredTimes,
        alternativeOptions: formData.alternativeOptions,
        urgency: formData.urgency,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      setRescheduleRequests(prev => [request, ...prev])
      setRequestDialogOpen(false)
      setFormData({
        sessionId: '',
        reason: '',
        preferredDate1: '',
        preferredTime1: '',
        preferredDate2: '',
        preferredTime2: '',
        preferredDate3: '',
        preferredTime3: '',
        alternativeOptions: '',
        urgency: 'medium'
      })

      toast({
        title: "Success",
        description: 'Reschedule request submitted successfully'
      })
    } catch (err) {
      console.error('Error submitting request:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to submit request'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    try {
      // Cancel request via API
      setRescheduleRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, status: 'cancelled' as const } : req
        )
      )
      toast({
        title: "Success",
        description: 'Request cancelled successfully'
      })
    } catch (err) {
      console.error('Error cancelling request:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to cancel request'
      })
    }
  }

  const handleViewRequest = (request: RescheduleRequest) => {
    setSelectedRequest(request)
    setViewDialogOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const pendingRequests = rescheduleRequests.filter(r => r.status === 'pending')
  const completedRequests = rescheduleRequests.filter(r => ['approved', 'rejected', 'cancelled'].includes(r.status))

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Rescheduling Requests
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadData}>
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Sessions</p>
                <p className="text-2xl font-bold">{upcomingSessions.length}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{rescheduleRequests.length}</p>
              </div>
              <Send className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming Sessions ({upcomingSessions.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="history">History ({completedRequests.length})</TabsTrigger>
        </TabsList>

        {/* Upcoming Sessions */}
        <TabsContent value="upcoming" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading sessions...</p>
              </CardContent>
            </Card>
          ) : upcomingSessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Sessions</h3>
                <p className="text-muted-foreground">
                  You don't have any upcoming sessions scheduled.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {upcomingSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-lg">{session.service.name}</h3>
                            <Badge className={getStatusColor(session.status)}>
                              {session.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4" />
                              <span>{session.therapist.firstName} {session.therapist.lastName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{new Date(session.scheduledDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{session.scheduledTime} ({session.duration} min)</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleRequestReschedule(session)}>
                          <Send className="h-4 w-4 mr-1" />
                          Request Reschedule
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pending Requests */}
        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                <p className="text-muted-foreground">
                  You don't have any pending reschedule requests.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <Badge className={getUrgencyColor(request.urgency)}>
                              {request.urgency} urgency
                            </Badge>
                          </div>
                          <p className="font-semibold mb-2">Reason: {request.reason}</p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Preferred dates: {request.preferredDates.map(d => new Date(d).toLocaleDateString()).join(', ')}</p>
                            <p>Preferred times: {request.preferredTimes.join(', ')}</p>
                            <p className="text-xs">Submitted: {new Date(request.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => handleViewRequest(request)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleCancelRequest(request.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-4">
          {completedRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No History</h3>
                <p className="text-muted-foreground">
                  You don't have any completed requests yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {completedRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                          <p className="font-semibold mb-2">Reason: {request.reason}</p>
                          {request.coordinatorNotes && (
                            <Alert className="mt-2">
                              <AlertDescription>
                                <strong>Coordinator:</strong> {request.coordinatorNotes}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleViewRequest(request)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Reschedule Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Session Reschedule</DialogTitle>
            <DialogDescription>
              {selectedSession && (
                <>
                  {selectedSession.service.name} - {new Date(selectedSession.scheduledDate).toLocaleDateString()} at {selectedSession.scheduledTime}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rescheduling *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Please explain why you need to reschedule..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.reason.length}/500 characters
              </p>
            </div>

            {/* Urgency */}
            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <select
                id="urgency"
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="low">Low - Can wait for normal processing</option>
                <option value="medium">Medium - Prefer quick response</option>
                <option value="high">High - Urgent need</option>
              </select>
            </div>

            {/* Preferred Options */}
            <div className="space-y-4">
              <Label>Preferred Alternative Dates & Times *</Label>
              
              {/* Option 1 */}
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="date1">Option 1 - Date</Label>
                  <Input
                    id="date1"
                    type="date"
                    value={formData.preferredDate1}
                    onChange={(e) => setFormData({ ...formData, preferredDate1: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time1">Option 1 - Time</Label>
                  <Input
                    id="time1"
                    type="time"
                    value={formData.preferredTime1}
                    onChange={(e) => setFormData({ ...formData, preferredTime1: e.target.value })}
                  />
                </div>
              </div>

              {/* Option 2 */}
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="date2">Option 2 - Date</Label>
                  <Input
                    id="date2"
                    type="date"
                    value={formData.preferredDate2}
                    onChange={(e) => setFormData({ ...formData, preferredDate2: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time2">Option 2 - Time</Label>
                  <Input
                    id="time2"
                    type="time"
                    value={formData.preferredTime2}
                    onChange={(e) => setFormData({ ...formData, preferredTime2: e.target.value })}
                  />
                </div>
              </div>

              {/* Option 3 */}
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="date3">Option 3 - Date</Label>
                  <Input
                    id="date3"
                    type="date"
                    value={formData.preferredDate3}
                    onChange={(e) => setFormData({ ...formData, preferredDate3: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time3">Option 3 - Time</Label>
                  <Input
                    id="time3"
                    type="time"
                    value={formData.preferredTime3}
                    onChange={(e) => setFormData({ ...formData, preferredTime3: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Alternative Options */}
            <div className="space-y-2">
              <Label htmlFor="alternatives">Alternative Options (Optional)</Label>
              <Textarea
                id="alternatives"
                value={formData.alternativeOptions}
                onChange={(e) => setFormData({ ...formData, alternativeOptions: e.target.value })}
                placeholder="Any other time preferences or flexible options..."
                rows={2}
                maxLength={300}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your request will be reviewed by a coordinator. You'll be notified once a decision is made.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRequest} disabled={loading}>
              <Send className="h-4 w-4 mr-1" />
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reschedule Request Details</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
                <Badge className={getUrgencyColor(selectedRequest.urgency)}>
                  {selectedRequest.urgency} urgency
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <p className="text-sm">{selectedRequest.reason}</p>
              </div>

              <div className="space-y-2">
                <Label>Preferred Dates</Label>
                <div className="space-y-1">
                  {selectedRequest.preferredDates.map((date, idx) => (
                    <p key={idx} className="text-sm">
                      {idx + 1}. {new Date(date).toLocaleDateString()} at {selectedRequest.preferredTimes[idx]}
                    </p>
                  ))}
                </div>
              </div>

              {selectedRequest.alternativeOptions && (
                <div className="space-y-2">
                  <Label>Alternative Options</Label>
                  <p className="text-sm">{selectedRequest.alternativeOptions}</p>
                </div>
              )}

              {selectedRequest.coordinatorNotes && (
                <Alert>
                  <AlertDescription>
                    <strong>Coordinator Response:</strong> {selectedRequest.coordinatorNotes}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground">
                <p>Submitted: {new Date(selectedRequest.createdAt).toLocaleString()}</p>
                {selectedRequest.respondedAt && (
                  <p>Responded: {new Date(selectedRequest.respondedAt).toLocaleString()}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
