'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { 
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  FileText,
  User,
  Calendar,
  Tag,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Edit,
  RefreshCw,
  Filter,
  Search,
  Download,
  Send,
  ChevronRight,
  ChevronLeft,
  Info,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface CoordinatorReviewInterfaceProps {
  coordinatorId?: string
  onReviewComplete?: (submission: any) => void
}

interface ReviewSubmission {
  id: string
  reportType: string
  reportId: string
  title: string
  description: string
  status: string
  priority?: string
  content: {
    summary?: string
    findings?: string
    recommendations?: string
  }
  therapist: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  patient: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  reviewer?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  reviewComments?: Array<{
    id: string
    content: string
    commentType: string
    createdAt: string
    reviewer: {
      firstName: string
      lastName: string
    }
  }>
  submittedAt?: string
  reviewStartedAt?: string
  createdAt: string
  updatedAt: string
}

interface ReviewStatistics {
  totalPending: number
  underReview: number
  highPriority: number
  overdue: number
}

export function CoordinatorReviewInterface({
  coordinatorId,
  onReviewComplete
}: CoordinatorReviewInterfaceProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('pending')
  
  // Data state
  const [submissions, setSubmissions] = useState<ReviewSubmission[]>([])
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<ReviewSubmission | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    reportType: '',
    priority: '',
    search: ''
  })

  // Review action state
  const [reviewAction, setReviewAction] = useState<'approve' | 'request_revision' | null>(null)
  const [reviewComments, setReviewComments] = useState('')
  const [revisionNotes, setRevisionNotes] = useState('')
  const [revisionPriority, setRevisionPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [requiresAdminApproval, setRequiresAdminApproval] = useState(false)

  // Dialog state
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  // Load initial data
  useEffect(() => {
    loadSubmissions()
    loadStatistics()
  }, [filters, activeTab])

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (coordinatorId) params.append('coordinatorId', coordinatorId)
      if (activeTab === 'pending') params.append('status', 'submitted')
      if (activeTab === 'reviewing') params.append('status', 'under_review')
      if (activeTab === 'completed') params.append('status', 'approved')
      
      if (filters.reportType) params.append('reportType', filters.reportType)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/coordinator-review?${params}`)
      const result = await response.json()

      if (response.ok) {
        setSubmissions(result.data.submissions || [])
      } else {
        setError(result.error || 'Failed to load submissions')
      }
    } catch (err) {
      setError('Failed to load submissions')
      console.error('Error loading submissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const params = new URLSearchParams()
      params.append('action', 'statistics')
      if (coordinatorId) params.append('coordinatorId', coordinatorId)

      const response = await fetch(`/api/coordinator-review?${params}`)
      const result = await response.json()

      if (response.ok) {
        setStatistics(result.data)
      }
    } catch (err) {
      console.error('Error loading statistics:', err)
    }
  }

  const handleStartReview = async (submissionId: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/coordinator-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId,
          coordinatorId: coordinatorId || 'coordinator-1',
          action: 'start_review',
          comments: 'Review started'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start review')
      }

      toast.success('Review started successfully')
      loadSubmissions()
      loadStatistics()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start review'
      toast.error(errorMessage)
      console.error('Error starting review:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewAction = async () => {
    if (!selectedSubmission || !reviewAction) return

    if (reviewAction === 'request_revision' && !revisionNotes) {
      toast.error('Please provide revision notes')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/coordinator-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          coordinatorId: coordinatorId || 'coordinator-1',
          action: reviewAction,
          comments: reviewComments || undefined,
          revisionNotes: reviewAction === 'request_revision' ? revisionNotes : undefined,
          priority: reviewAction === 'request_revision' ? revisionPriority : undefined,
          requiresAdminApproval
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${reviewAction} submission`)
      }

      toast.success(reviewAction === 'approve' ? 'Report approved successfully' : 'Revision requested successfully')
      
      // Reset state
      setIsReviewDialogOpen(false)
      setSelectedSubmission(null)
      setReviewAction(null)
      setReviewComments('')
      setRevisionNotes('')
      setRevisionPriority('medium')
      setRequiresAdminApproval(false)
      
      // Reload data
      loadSubmissions()
      loadStatistics()

      if (onReviewComplete) {
        onReviewComplete(result.data.submission)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete review'
      toast.error(errorMessage)
      console.error('Error completing review:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async (action: 'start_review' | 'mark_urgent') => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one submission')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/coordinator-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bulkAction: true,
          submissionIds: selectedIds,
          coordinatorId: coordinatorId || 'coordinator-1',
          action
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to perform bulk action')
      }

      toast.success(result.message)
      setSelectedIds([])
      loadSubmissions()
      loadStatistics()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to perform bulk action'
      toast.error(errorMessage)
      console.error('Error performing bulk action:', err)
    } finally {
      setLoading(false)
    }
  }

  const openReviewDialog = (submission: ReviewSubmission, action: 'approve' | 'request_revision') => {
    setSelectedSubmission(submission)
    setReviewAction(action)
    setIsReviewDialogOpen(true)
  }

  const openDetailDialog = (submission: ReviewSubmission) => {
    setSelectedSubmission(submission)
    setIsDetailDialogOpen(true)
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'revision_requested': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDaysAgo = (date: string) => {
    const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalPending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting assignment
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.underReview || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently reviewing
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statistics?.highPriority || 0}</div>
            <p className="text-xs text-muted-foreground">
              Urgent submissions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics?.overdue || 0}</div>
            <p className="text-xs text-muted-foreground">
              Over 3 days old
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <div className="flex items-center space-x-2">
              {selectedIds.length > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('start_review')}>
                    Start Review ({selectedIds.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('mark_urgent')}>
                    Mark Urgent ({selectedIds.length})
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={loadSubmissions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select value={filters.reportType} onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="therapeutic_plan">Therapeutic Plan</SelectItem>
                  <SelectItem value="progress_report">Progress Report</SelectItem>
                  <SelectItem value="final_report">Final Report</SelectItem>
                  <SelectItem value="session_notes">Session Notes</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                  <SelectItem value="evaluation">Evaluation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Priority</Label>
              <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search submissions..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending ({statistics?.totalPending || 0})</TabsTrigger>
          <TabsTrigger value="reviewing">Under Review ({statistics?.underReview || 0})</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {['pending', 'reviewing', 'completed'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {tab === 'pending' && 'Pending Submissions'}
                  {tab === 'reviewing' && 'Under Review'}
                  {tab === 'completed' && 'Completed Reviews'}
                </CardTitle>
                <CardDescription>
                  {tab === 'pending' && 'Submissions awaiting review assignment'}
                  {tab === 'reviewing' && 'Submissions currently being reviewed'}
                  {tab === 'completed' && 'Approved submissions'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading submissions...</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Submissions</h3>
                    <p className="text-muted-foreground">
                      {tab === 'pending' && 'No pending submissions found'}
                      {tab === 'reviewing' && 'No submissions under review'}
                      {tab === 'completed' && 'No completed reviews found'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <motion.div
                        key={submission.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            {tab !== 'completed' && (
                              <Checkbox
                                checked={selectedIds.includes(submission.id)}
                                onCheckedChange={() => toggleSelection(submission.id)}
                              />
                            )}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold">{submission.title}</h3>
                                <Badge className={getStatusColor(submission.status)}>
                                  {submission.status.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline">{submission.reportType.replace('_', ' ')}</Badge>
                                {submission.priority && (
                                  <Badge className={getPriorityColor(submission.priority)}>
                                    {submission.priority}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm text-muted-foreground">
                                {submission.description}
                              </p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <Label className="text-xs font-medium">Therapist</Label>
                                  <div>{submission.therapist.firstName} {submission.therapist.lastName}</div>
                                </div>
                                <div>
                                  <Label className="text-xs font-medium">Patient</Label>
                                  <div>{submission.patient.firstName} {submission.patient.lastName}</div>
                                </div>
                                <div>
                                  <Label className="text-xs font-medium">Submitted</Label>
                                  <div>{submission.submittedAt ? getDaysAgo(submission.submittedAt) : 'Not submitted'}</div>
                                </div>
                                {submission.reviewer && (
                                  <div>
                                    <Label className="text-xs font-medium">Reviewer</Label>
                                    <div>{submission.reviewer.firstName} {submission.reviewer.lastName}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Button size="sm" variant="outline" onClick={() => openDetailDialog(submission)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {tab === 'pending' && (
                              <Button size="sm" onClick={() => handleStartReview(submission.id)}>
                                <Clock className="h-4 w-4 mr-1" />
                                Start Review
                              </Button>
                            )}
                            {tab === 'reviewing' && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => openReviewDialog(submission, 'approve')}>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openReviewDialog(submission, 'request_revision')}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  Request Revision
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Review Action Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Submission' : 'Request Revision'}
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && `${selectedSubmission.title} - ${selectedSubmission.reportType.replace('_', ' ')}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {reviewAction === 'approve' ? (
              <>
                <div>
                  <Label htmlFor="reviewComments">Review Comments (Optional)</Label>
                  <Textarea
                    id="reviewComments"
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    placeholder="Enter any comments about the approval"
                    rows={4}
                    maxLength={2000}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="requiresAdminApproval"
                    checked={requiresAdminApproval}
                    onCheckedChange={(checked: boolean) => setRequiresAdminApproval(checked)}
                  />
                  <Label htmlFor="requiresAdminApproval">Requires Administrator Approval</Label>
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="revisionNotes">Revision Notes *</Label>
                  <Textarea
                    id="revisionNotes"
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="Specify what needs to be revised"
                    rows={6}
                    maxLength={5000}
                  />
                </div>
                
                <div>
                  <Label htmlFor="revisionPriority">Priority</Label>
                  <Select value={revisionPriority} onValueChange={(value: any) => setRevisionPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleReviewAction} disabled={loading}>
              {loading ? 'Processing...' : reviewAction === 'approve' ? 'Approve' : 'Request Revision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedSubmission?.title}</DialogTitle>
            <DialogDescription>
              {selectedSubmission && `${selectedSubmission.reportType.replace('_', ' ')} - ${selectedSubmission.patient.firstName} ${selectedSubmission.patient.lastName}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6 py-4">
              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedSubmission.description}</p>
              </div>
              
              {selectedSubmission.content.summary && (
                <div>
                  <Label className="text-sm font-medium">Summary</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedSubmission.content.summary}</p>
                </div>
              )}
              
              {selectedSubmission.content.findings && (
                <div>
                  <Label className="text-sm font-medium">Findings</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedSubmission.content.findings}</p>
                </div>
              )}
              
              {selectedSubmission.content.recommendations && (
                <div>
                  <Label className="text-sm font-medium">Recommendations</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedSubmission.content.recommendations}</p>
                </div>
              )}
              
              {selectedSubmission.reviewComments && selectedSubmission.reviewComments.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Review Comments</Label>
                  <div className="space-y-2 mt-2">
                    {selectedSubmission.reviewComments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {comment.reviewer.firstName} {comment.reviewer.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
