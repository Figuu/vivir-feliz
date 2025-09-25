'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  RefreshCw,
  TrendingUp,
  Search
} from 'lucide-react'
import { motion } from 'framer-motion'
import { PaymentConfirmationWorkflow } from '@/components/payment/payment-confirmation-workflow'
import { usePaymentConfirmationWorkflow, PaymentConfirmationStatus } from '@/hooks/use-payment-confirmation-workflow'

export default function TestPaymentConfirmationWorkflowPage() {
  const [activeTab, setActiveTab] = useState('workflow')
  const [paymentId, setPaymentId] = useState('')
  const [paymentDetails, setPaymentDetails] = useState({
    amount: 150,
    currency: 'USD',
    paymentMethod: 'CASH',
    patientName: 'John Doe',
    specialty: 'Speech Therapy'
  })
  const [confirmationRequests, setConfirmationRequests] = useState<any[]>([])
  const [confirmationStatistics, setConfirmationStatistics] = useState<any>(null)

  const { 
    getConfirmationRequests,
    getConfirmationStatistics,
    loading, 
    error 
  } = usePaymentConfirmationWorkflow()

  const handleFetchConfirmationRequests = async () => {
    try {
      const result = await getConfirmationRequests({
        page: 1,
        limit: 20
      })
      setConfirmationRequests(result.requests)
    } catch (err) {
      console.error('Failed to fetch confirmation requests:', err)
    }
  }

  const handleFetchStatistics = async () => {
    try {
      const result = await getConfirmationStatistics()
      setConfirmationStatistics(result)
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payment Confirmation Workflow Test</h1>
          <p className="text-muted-foreground">
            Test the payment confirmation workflow for administrators
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Payment Confirmation Workflow Test
                </CardTitle>
                <CardDescription>
                  Test the payment confirmation workflow component
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentId">Payment ID</Label>
                    <Input
                      id="paymentId"
                      value={paymentId}
                      onChange={(e) => setPaymentId(e.target.value)}
                      placeholder="Enter payment ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientName">Patient Name</Label>
                    <Input
                      id="patientName"
                      value={paymentDetails.patientName}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, patientName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="specialty">Specialty</Label>
                    <Select value={paymentDetails.specialty} onValueChange={(value) => setPaymentDetails(prev => ({ ...prev, specialty: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
                        <SelectItem value="Occupational Therapy">Occupational Therapy</SelectItem>
                        <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
                        <SelectItem value="Behavioral Therapy">Behavioral Therapy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={paymentDetails.amount}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={paymentDetails.currency} onValueChange={(value) => setPaymentDetails(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={paymentDetails.paymentMethod} onValueChange={(value) => setPaymentDetails(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CHECK">Check</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentId && (
                  <PaymentConfirmationWorkflow
                    paymentId={paymentId}
                    paymentDetails={paymentDetails}
                    onConfirmationComplete={(status) => {
                      alert(`Payment confirmation ${status.toLowerCase()} successfully!`)
                      handleFetchConfirmationRequests()
                    }}
                    showWorkflow={true}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Confirmation Requests
                </CardTitle>
                <CardDescription>
                  View and manage payment confirmation requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleFetchConfirmationRequests} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Requests...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Fetch Requests
                    </>
                  )}
                </Button>

                <Separator />

                <div className="space-y-4">
                  {confirmationRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {request.payment?.consultationRequest?.patient?.firstName} {request.payment?.consultationRequest?.patient?.lastName}
                                </h4>
                                {getStatusBadge(request.status)}
                                {getPriorityBadge(request.priority)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p>Amount: {formatCurrency(request.payment?.amount || 0, request.payment?.currency || 'USD')}</p>
                                <p>Method: {request.payment?.paymentMethod?.replace('_', ' ')}</p>
                                <p>Requested: {formatDate(request.requestedAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPaymentId(request.paymentId)
                                  setActiveTab('workflow')
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Confirmation Statistics
                </CardTitle>
                <CardDescription>
                  View payment confirmation statistics and analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleFetchStatistics} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Statistics...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Fetch Statistics
                    </>
                  )}
                </Button>

                {confirmationStatistics && (
                  <div className="space-y-6">
                    {/* Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{confirmationStatistics.totalRequests}</div>
                            <div className="text-sm text-muted-foreground">Total Requests</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {confirmationStatistics.approvalRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Approval Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {confirmationStatistics.escalationRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Escalation Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {confirmationStatistics.averageReviewTime.toFixed(1)}h
                            </div>
                            <div className="text-sm text-muted-foreground">Avg Review Time</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Status Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Status Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(confirmationStatistics.statusCounts).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(status as PaymentConfirmationStatus)}
                                <span className="text-sm text-muted-foreground">
                                  {confirmationStatistics.totalRequests > 0 ? 
                                    Math.round((count as number) / confirmationStatistics.totalRequests * 100) : 0}%
                                </span>
                              </div>
                              <span className="font-medium">{count as number}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Priority Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Priority Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(confirmationStatistics.priorityCounts).map(([priority, count]) => (
                            <div key={priority} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getPriorityBadge(priority)}
                                <span className="text-sm text-muted-foreground">
                                  {confirmationStatistics.totalRequests > 0 ? 
                                    Math.round((count as number) / confirmationStatistics.totalRequests * 100) : 0}%
                                </span>
                              </div>
                              <span className="font-medium">{count as number}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Workflow Settings
                </CardTitle>
                <CardDescription>
                  Configure payment confirmation workflow settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Workflow Steps
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>1. Initial Review - Verify payment details</li>
                    <li>2. Receipt Verification - Check receipt upload</li>
                    <li>3. Amount Validation - Confirm payment amount</li>
                    <li>4. Documentation Check - Review supporting documents</li>
                    <li>5. Final Approval - Complete confirmation process</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Review Actions
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>• Approve - Confirm payment and complete workflow</li>
                    <li>• Reject - Deny payment with reason</li>
                    <li>• Request Clarification - Ask for additional information</li>
                    <li>• Escalate - Send to higher authority for review</li>
                    <li>• Hold - Temporarily pause review process</li>
                  </ul>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    Priority Levels
                  </h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• Low - Standard processing time</li>
                    <li>• Medium - Normal priority (default)</li>
                    <li>• High - Expedited processing</li>
                    <li>• Urgent - Immediate attention required</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
    </div>
  )
}
