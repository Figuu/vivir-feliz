'use client'

import { useState } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { 
  CheckCircle, 
  XCircle,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  MessageSquare,
  Search,
  Filter
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface ReschedulingApprovalInterfaceProps {
  coordinatorId?: string
}

interface ReschedulingRequest {
  id: string
  sessionId: string
  session: {
    id: string
    scheduledDate: string
    scheduledTime: string
    duration: number
    patient: {
      firstName: string
      lastName: string
    }
    therapist: {
      firstName: string
      lastName: string
    }
    service: {
      name: string
    }
  }
  requestedDate: string
  requestedTime: string
  alternativeDates: Array<{
    date: string
    time: string
  }>
  reason: string
  requestedBy: string
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  approvedBy?: string
  approvedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  createdAt: string
}

interface ApprovalFormData {
  requestId: string
  action: 'approve' | 'reject' | 'suggest_alternative'
  comments: string
  suggestedDate: string
  suggestedTime: string
}

export function ReschedulingApprovalInterface({ coordinatorId = 'coordinator-1' }: ReschedulingApprovalInterfaceProps) {
  const queryClient = useQueryClient()
  const [selectedRequest, setSelectedRequest] = useState<ReschedulingRequest | null>(null)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [activeTab, setActiveTab] = useState('pending')
  
  const [formData, setFormData] = useState<ApprovalFormData>({
    requestId: '',
    action: 'approve',
    comments: '',
    suggestedDate: '',
    suggestedTime: ''
  })

  // Fetch schedule requests from API
  const { data: requests = [], isLoading: loading } = useQuery({
    queryKey: ['schedule-requests', statusFilter],
    queryFn: async () => {
      const statusParam = statusFilter === 'all' ? '' : `&status=${statusFilter.toUpperCase()}`
      const response = await fetch(`/api/schedule-requests?${statusParam}`)
      if (!response.ok) {
        throw new Error('Failed to fetch schedule requests')
      }
      const data = await response.json()
      return data.scheduleRequests.map((req: any) => ({
        id: req.id,
        sessionId: req.sessionId,
        session: req.session ? {
          id: req.session.id,
          scheduledDate: req.session.scheduledDate,
          scheduledTime: req.session.scheduledTime,
          duration: req.session.duration,
          patient: {
            firstName: req.session.patient.firstName,
            lastName: req.session.patient.lastName
          },
          therapist: {
            firstName: req.session.therapist.firstName,
            lastName: req.session.therapist.lastName
          },
          service: {
            name: req.session.serviceAssignment.service.name
          }
        } : null,
        requestedDate: req.newDate,
        requestedTime: req.newTime,
        alternativeDates: req.newAvailability?.alternativeDates || [],
        reason: req.reason,
        requestedBy: req.parentId,
        status: req.status.toLowerCase(),
        comments: req.adminNotes,
        approvedBy: req.processedBy,
        approvedAt: req.processedAt,
        rejectedBy: req.status === 'REJECTED' ? req.processedBy : undefined,
        rejectedAt: req.status === 'REJECTED' ? req.processedAt : undefined,
        createdAt: req.createdAt
      }))
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  // Mutation for updating schedule request
  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, notes }: { requestId: string, status: string, notes: string }) => {
      const response = await fetch(`/api/schedule-requests?id=${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status.toUpperCase(),
          adminNotes: notes
        })
      })
      if (!response.ok) {
        throw new Error('Failed to update schedule request')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-requests'] })
      toast({
        title: "Success",
        description: 'Request updated successfully'
      })
      setApprovalDialogOpen(false)
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to update request'
      })
    }
  })

  // Legacy mock data structure - not used anymore
  const __legacyMockRequests: ReschedulingRequest[] = [
        {
          id: 'req-1',
          sessionId: 'session-1',
          session: {
            id: 'session-1',
            scheduledDate: '2025-10-10',
            scheduledTime: '10:00',
            duration: 60,
            patient: {
              firstName: 'Emma',
              lastName: 'Johnson'
            },
            therapist: {
              firstName: 'Dr. Sarah',
              lastName: 'Smith'
            },
            service: {
              name: 'Speech Therapy'
            }
          },
          requestedDate: '2025-10-15',
          requestedTime: '14:00',
          alternativeDates: [
            { date: '2025-10-16', time: '10:00' },
            { date: '2025-10-17', time: '15:00' }
          ],
          reason: 'Family emergency - need to reschedule for later in the week',
          requestedBy: 'parent-1',
          status: 'pending',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'req-2',
          sessionId: 'session-2',
          session: {
            id: 'session-2',
            scheduledDate: '2025-10-12',
            scheduledTime: '11:00',
            duration: 45,
            patient: {
              firstName: 'Michael',
              lastName: 'Brown'
            },
            therapist: {
              firstName: 'Dr. John',
              lastName: 'Doe'
            },
            service: {
              name: 'Occupational Therapy'
            }
          },
          requestedDate: '2025-10-13',
          requestedTime: '09:00',
          alternativeDates: [],
          reason: 'Conflict with school event',
          requestedBy: 'parent-2',
          status: 'approved',
          comments: 'Approved - therapist available at requested time',
          approvedBy: 'coordinator-1',
          approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

  const handleReview = (request: ReschedulingRequest) => {
    setSelectedRequest(request)
    setFormData({
      requestId: request.id,
      action: 'approve',
      comments: '',
      suggestedDate: '',
      suggestedTime: ''
    })
    setApprovalDialogOpen(true)
  }

  const handleSubmitApproval = async () => {
    if (!formData.comments.trim() && (formData.action === 'reject' || formData.action === 'suggest_alternative')) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please provide comments for rejection or alternative suggestion'
      })
      return
    }

    if (formData.action === 'suggest_alternative' && (!formData.suggestedDate || !formData.suggestedTime)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please provide suggested date and time'
      })
      return
    }

    try {
      const response = await fetch('/api/rescheduling-approval', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          approvedBy: coordinatorId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process approval')
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: `Request ${formData.action}d successfully`
      })
      setApprovalDialogOpen(false)
      setFormData({
        requestId: '',
        action: 'approve',
        comments: '',
        suggestedDate: '',
        suggestedTime: ''
      })
      
      // Reload data
      queryClient.invalidateQueries({ queryKey: ['schedule-requests'] })
    } catch (err: any) {
      console.error('Error processing approval:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to process approval'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const filteredRequests = requests.filter((request: ReschedulingRequest) =>
    searchTerm === '' ||
    request.session.patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.session.patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.session.therapist.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.session.therapist.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.session.service.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pendingCount = requests.filter((r: ReschedulingRequest) => r.status === 'pending').length
  const approvedCount = requests.filter((r: ReschedulingRequest) => r.status === 'approved').length
  const rejectedCount = requests.filter((r: ReschedulingRequest) => r.status === 'rejected').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Rescheduling Approval Workflow
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient, therapist, or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border rounded-md px-3 py-2 flex-1"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedCount})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedCount})</TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'rejected'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading requests...</p>
                </CardContent>
              </Card>
            ) : filteredRequests.filter((r: ReschedulingRequest) => r.status === tab).length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  {getStatusIcon(tab)}
                  <h3 className="text-lg font-semibold mb-2 mt-4">No {tab} Requests</h3>
                  <p className="text-muted-foreground">
                    No {tab} rescheduling requests at this time.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredRequests.filter((r: ReschedulingRequest) => r.status === tab).map((request: ReschedulingRequest, index: number) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-lg">{request.session.service.name}</h3>
                                <Badge className={getStatusColor(request.status)}>
                                  {getStatusIcon(request.status)}
                                  <span className="ml-1">{request.status}</span>
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground mb-1">Patient</p>
                                  <p className="font-medium">{request.session.patient.firstName} {request.session.patient.lastName}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground mb-1">Therapist</p>
                                  <p className="font-medium">{request.session.therapist.firstName} {request.session.therapist.lastName}</p>
                                </div>
                              </div>
                            </div>
                            
                            {request.status === 'pending' && (
                              <Button onClick={() => handleReview(request)} className="ml-4">
                                Review
                              </Button>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Current Schedule</p>
                              <p className="text-sm font-medium">
                                {new Date(request.session.scheduledDate).toLocaleDateString()} at {request.session.scheduledTime}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Requested Schedule</p>
                              <p className="text-sm font-medium text-blue-600">
                                {new Date(request.requestedDate).toLocaleDateString()} at {request.requestedTime}
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t">
                            <p className="text-xs text-muted-foreground mb-1">Reason</p>
                            <p className="text-sm">{request.reason}</p>
                          </div>

                          {request.alternativeDates.length > 0 && (
                            <div className="pt-3 border-t">
                              <p className="text-xs text-muted-foreground mb-2">Alternative Dates</p>
                              <div className="space-y-1">
                                {request.alternativeDates.map((alt: { date: string; time: string }, idx: number) => (
                                  <p key={idx} className="text-sm">
                                    {idx + 1}. {new Date(alt.date).toLocaleDateString()} at {alt.time}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {request.comments && (
                            <Alert className={request.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                              <MessageSquare className="h-4 w-4" />
                              <AlertDescription>
                                <p className="font-medium text-sm mb-1">Coordinator Comments:</p>
                                <p className="text-sm">{request.comments}</p>
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="text-xs text-muted-foreground">
                            Submitted: {new Date(request.createdAt).toLocaleString()}
                            {request.approvedAt && ` • Approved: ${new Date(request.approvedAt).toLocaleString()}`}
                            {request.rejectedAt && ` • Rejected: ${new Date(request.rejectedAt).toLocaleString()}`}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Rescheduling Request</DialogTitle>
            <DialogDescription>
              Approve, reject, or suggest an alternative time
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6 py-4">
              {/* Request Details */}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Patient:</strong> {selectedRequest.session.patient.firstName} {selectedRequest.session.patient.lastName}</p>
                    <p><strong>Service:</strong> {selectedRequest.session.service.name}</p>
                    <p><strong>Therapist:</strong> {selectedRequest.session.therapist.firstName} {selectedRequest.session.therapist.lastName}</p>
                    <p><strong>Current:</strong> {new Date(selectedRequest.session.scheduledDate).toLocaleDateString()} at {selectedRequest.session.scheduledTime}</p>
                    <p><strong>Requested:</strong> {new Date(selectedRequest.requestedDate).toLocaleDateString()} at {selectedRequest.requestedTime}</p>
                    <p><strong>Reason:</strong> {selectedRequest.reason}</p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Action Selection */}
              <div className="space-y-2">
                <Label htmlFor="action">Action *</Label>
                <select
                  id="action"
                  value={formData.action}
                  onChange={(e) => setFormData({ ...formData, action: e.target.value as any })}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="approve">Approve Request</option>
                  <option value="reject">Reject Request</option>
                  <option value="suggest_alternative">Suggest Alternative</option>
                </select>
              </div>

              {/* Suggested Date/Time (if suggesting alternative) */}
              {formData.action === 'suggest_alternative' && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-blue-50">
                  <div className="space-y-2">
                    <Label htmlFor="suggestedDate">Suggested Date *</Label>
                    <Input
                      id="suggestedDate"
                      type="date"
                      value={formData.suggestedDate}
                      onChange={(e) => setFormData({ ...formData, suggestedDate: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="suggestedTime">Suggested Time *</Label>
                    <Input
                      id="suggestedTime"
                      type="time"
                      value={formData.suggestedTime}
                      onChange={(e) => setFormData({ ...formData, suggestedTime: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="space-y-2">
                <Label htmlFor="comments">
                  Comments {(formData.action === 'reject' || formData.action === 'suggest_alternative') && '*'}
                </Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder={
                    formData.action === 'approve' 
                      ? "Optional: Add any notes about the approval..." 
                      : "Required: Explain the reason..."
                  }
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.comments.length}/1000 characters
                </p>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {formData.action === 'approve' && 'The session will be rescheduled to the requested time. Both patient and therapist will be notified.'}
                  {formData.action === 'reject' && 'The request will be rejected and the original session time will remain. The parent will be notified.'}
                  {formData.action === 'suggest_alternative' && 'The parent will receive a notification with your suggested alternative time.'}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitApproval}>
              {formData.action === 'approve' ? 'Approve' : formData.action === 'reject' ? 'Reject' : 'Send Suggestion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
