'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  User,
  Calendar,
  FileText,
  CreditCard,
  DollarSign,
  Eye,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Play,
  Pause,
  Square,
  RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePaymentConfirmationWorkflow, PaymentConfirmationStatus, PaymentReviewAction } from '@/hooks/use-payment-confirmation-workflow'

interface PaymentConfirmationWorkflowProps {
  paymentId: string
  paymentDetails?: {
    amount: number
    currency: string
    paymentMethod: string
    patientName: string
    specialty: string
  }
  onConfirmationComplete?: (status: PaymentConfirmationStatus) => void
  showWorkflow?: boolean
}

export function PaymentConfirmationWorkflow({
  paymentId,
  paymentDetails,
  onConfirmationComplete,
  showWorkflow = true
}: PaymentConfirmationWorkflowProps) {
  const [confirmationRequest, setConfirmationRequest] = useState<any>(null)
  const [workflow, setWorkflow] = useState<any>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    action: '' as PaymentReviewAction,
    reviewNotes: '',
    escalationReason: '',
    holdReason: '',
    reviewedBy: 'admin' // This would come from auth context
  })

  const { 
    createConfirmationRequest,
    reviewConfirmationRequest,
    getConfirmationRequestDetails,
    getConfirmationRequests,
    loading, 
    error 
  } = usePaymentConfirmationWorkflow()

  // Load confirmation request details
  const loadConfirmationRequest = async () => {
    try {
      // First, try to get existing confirmation request
      const requests = await getConfirmationRequests({ status: 'PENDING_REVIEW' })
      if (requests.requests.length > 0) {
        const request = requests.requests[0]
        const details = await getConfirmationRequestDetails(request.id)
        setConfirmationRequest(details)
        setWorkflow(details.workflow)
      }
    } catch (err) {
      console.error('Failed to load confirmation request:', err)
    }
  }

  useEffect(() => {
    loadConfirmationRequest()
  }, [paymentId])

  const handleCreateConfirmationRequest = async () => {
    try {
      const result = await createConfirmationRequest({
        paymentId,
        requestedBy: 'user', // This would come from auth context
        priority: 'MEDIUM'
      })
      
      setConfirmationRequest(result)
      await loadConfirmationRequest()
    } catch (err) {
      console.error('Failed to create confirmation request:', err)
    }
  }

  const handleReviewConfirmationRequest = async () => {
    try {
      if (!confirmationRequest) return

      const result = await reviewConfirmationRequest({
        confirmationRequestId: confirmationRequest.id,
        action: reviewForm.action,
        reviewedBy: reviewForm.reviewedBy,
        reviewNotes: reviewForm.reviewNotes || undefined,
        escalationReason: reviewForm.escalationReason || undefined,
        holdReason: reviewForm.holdReason || undefined
      })

      setConfirmationRequest(result)
      await loadConfirmationRequest()
      
      // Reset form
      setReviewForm({
        action: '' as PaymentReviewAction,
        reviewNotes: '',
        escalationReason: '',
        holdReason: '',
        reviewedBy: 'admin'
      })
      setShowReviewForm(false)
      
      // Notify parent component
      onConfirmationComplete?.(result.status)
    } catch (err) {
      console.error('Failed to review confirmation request:', err)
    }
  }

  const getStatusBadge = (status: PaymentConfirmationStatus) => {
    const statusConfig = {
      'PENDING_REVIEW': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      'APPROVED': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      'REJECTED': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      'REQUIRES_CLARIFICATION': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: AlertCircle },
      'ESCALATED': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: AlertTriangle }
    }
    
    const config = statusConfig[status] || statusConfig.PENDING_REVIEW
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'LOW': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
      'MEDIUM': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      'HIGH': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      'URGENT': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM
    
    return (
      <Badge className={config.color}>
        {priority}
      </Badge>
    )
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getWorkflowProgress = () => {
    if (!workflow) return 0
    return (workflow.currentStep / workflow.totalSteps) * 100
  }

  return (
    <div className="space-y-6">
      {/* Payment Details */}
      {paymentDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Patient</Label>
                <p className="text-sm text-muted-foreground">{paymentDetails.patientName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Specialty</Label>
                <p className="text-sm text-muted-foreground">{paymentDetails.specialty}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Amount</Label>
                <p className="text-lg font-semibold">
                  {formatCurrency(paymentDetails.amount, paymentDetails.currency)}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Method</Label>
                <p className="text-sm text-muted-foreground">{paymentDetails.paymentMethod}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Request Status */}
      {confirmationRequest ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Confirmation Request
            </CardTitle>
            <CardDescription>
              Payment confirmation request status and details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusBadge(confirmationRequest.status)}
                {getPriorityBadge(confirmationRequest.priority)}
                <span className="text-sm text-muted-foreground">
                  Requested: {formatDate(confirmationRequest.requestedAt)}
                </span>
              </div>
              {confirmationRequest.status === 'PENDING_REVIEW' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                >
                  Review Request
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Requested by: {confirmationRequest.requestedBy}</span>
              </div>
              {confirmationRequest.reviewedBy && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Reviewed by: {confirmationRequest.reviewedBy}</span>
                </div>
              )}
              {confirmationRequest.reviewedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Reviewed: {formatDate(confirmationRequest.reviewedAt)}</span>
                </div>
              )}
            </div>

            {confirmationRequest.reviewNotes && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Review Notes: {confirmationRequest.reviewNotes}
                  </span>
                </div>
              </div>
            )}

            {confirmationRequest.escalationReason && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Escalation Reason: {confirmationRequest.escalationReason}
                  </span>
                </div>
              </div>
            )}

            {confirmationRequest.holdReason && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <div className="flex items-center gap-2">
                  <Pause className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Hold Reason: {confirmationRequest.holdReason}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create Confirmation Request
            </CardTitle>
            <CardDescription>
              Submit this payment for administrative confirmation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCreateConfirmationRequest}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Request...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Create Confirmation Request
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      <AnimatePresence>
        {showReviewForm && confirmationRequest && (
          <motion.div
            initial={{ opacity: 0, blockSize: 0 }}
            animate={{ opacity: 1, blockSize: 'auto' }}
            exit={{ opacity: 0, blockSize: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Review Confirmation Request
                </CardTitle>
                <CardDescription>
                  Review and make a decision on this payment confirmation request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="action">Review Action *</Label>
                  <Select 
                    value={reviewForm.action} 
                    onValueChange={(value: PaymentReviewAction) => setReviewForm(prev => ({ ...prev, action: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select review action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPROVE">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Approve
                        </div>
                      </SelectItem>
                      <SelectItem value="REJECT">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Reject
                        </div>
                      </SelectItem>
                      <SelectItem value="REQUEST_CLARIFICATION">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          Request Clarification
                        </div>
                      </SelectItem>
                      <SelectItem value="ESCALATE">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-purple-600" />
                          Escalate
                        </div>
                      </SelectItem>
                      <SelectItem value="HOLD">
                        <div className="flex items-center gap-2">
                          <Pause className="h-4 w-4 text-gray-600" />
                          Hold
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                  <Textarea
                    id="reviewNotes"
                    value={reviewForm.reviewNotes}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, reviewNotes: e.target.value }))}
                    placeholder="Add notes about your review decision"
                    rows={3}
                  />
                </div>

                {reviewForm.action === 'ESCALATE' && (
                  <div>
                    <Label htmlFor="escalationReason">Escalation Reason *</Label>
                    <Input
                      id="escalationReason"
                      value={reviewForm.escalationReason}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, escalationReason: e.target.value }))}
                      placeholder="Reason for escalation"
                    />
                  </div>
                )}

                {reviewForm.action === 'HOLD' && (
                  <div>
                    <Label htmlFor="holdReason">Hold Reason *</Label>
                    <Input
                      id="holdReason"
                      value={reviewForm.holdReason}
                      onChange={(e) => setReviewForm(prev => ({ ...prev, holdReason: e.target.value }))}
                      placeholder="Reason for holding"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleReviewConfirmationRequest}
                    disabled={loading || !reviewForm.action}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reviewing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Submit Review
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workflow Progress */}
      {showWorkflow && workflow && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Workflow Progress
            </CardTitle>
            <CardDescription>
              Payment confirmation workflow steps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {workflow.currentStep} of {workflow.totalSteps} steps
                </span>
              </div>
              <Progress value={getWorkflowProgress()} className="h-2" />
            </div>

            <div className="space-y-2">
              {workflow.steps?.map((step: any, index: number) => (
                <div key={step.id} className="flex items-center gap-3 p-2 border rounded">
                  <div className="flex-shrink-0">
                    {step.status === 'COMPLETED' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : step.status === 'IN_PROGRESS' ? (
                      <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{step.stepName}</span>
                      <Badge variant={step.status === 'COMPLETED' ? 'default' : 'outline'}>
                        {step.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    {step.notes && (
                      <p className="text-sm text-muted-foreground mt-1">{step.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700 dark:text-red-300">
                {error}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
