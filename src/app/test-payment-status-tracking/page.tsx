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
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  History,
  TrendingUp,
  RefreshCw,
  Loader2,
  Calendar,
  User,
  Search,
  Eye,
  AlertTriangle,
  Play,
  Pause,
  Square
} from 'lucide-react'
import { motion } from 'framer-motion'
import { PaymentStatusManager } from '@/components/payment/payment-status-manager'
import { usePaymentStatusTracking, PaymentStatus } from '@/hooks/use-payment-status-tracking'

export default function TestPaymentStatusTrackingPage() {
  const [activeTab, setActiveTab] = useState('status-manager')
  const [paymentId, setPaymentId] = useState('')
  const [currentStatus, setCurrentStatus] = useState<PaymentStatus>('PENDING')
  const [paymentsByStatus, setPaymentsByStatus] = useState<any[]>([])
  const [paymentStatistics, setPaymentStatistics] = useState<any>(null)
  const [paymentsRequiringAttention, setPaymentsRequiringAttention] = useState<any>(null)

  const { 
    getPaymentsByStatus,
    getPaymentStatusStatistics,
    getPaymentsRequiringAttention,
    triggerAutoUpdate,
    loading, 
    error 
  } = usePaymentStatusTracking()

  const handleFetchPaymentsByStatus = async (status: PaymentStatus) => {
    try {
      const result = await getPaymentsByStatus(status, 20, 0)
      setPaymentsByStatus(result.payments)
    } catch (err) {
      console.error('Failed to fetch payments by status:', err)
    }
  }

  const handleFetchStatistics = async () => {
    try {
      const result = await getPaymentStatusStatistics()
      setPaymentStatistics(result)
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
    }
  }

  const handleFetchRequiringAttention = async () => {
    try {
      const result = await getPaymentsRequiringAttention()
      setPaymentsRequiringAttention(result)
    } catch (err) {
      console.error('Failed to fetch payments requiring attention:', err)
    }
  }

  const handleTriggerAutoUpdate = async () => {
    try {
      const result = await triggerAutoUpdate()
      alert(`Auto-update completed. Updated ${result.updated} payments. Errors: ${result.errors.length}`)
    } catch (err) {
      console.error('Failed to trigger auto-update:', err)
    }
  }

  const getStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: AlertCircle },
      'PROCESSING': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Loader2 },
      'COMPLETED': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      'FAILED': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: XCircle },
      'REFUNDED': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: AlertCircle }
    }
    
    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
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
          <h1 className="text-3xl font-bold mb-2">Payment Status Tracking Test</h1>
          <p className="text-muted-foreground">
            Test the payment status tracking and management system
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="status-manager">Status Manager</TabsTrigger>
            <TabsTrigger value="by-status">By Status</TabsTrigger>
            <TabsTrigger value="attention">Requires Attention</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="auto-update">Auto Update</TabsTrigger>
          </TabsList>

          {/* Status Manager Tab */}
          <TabsContent value="status-manager" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Payment Status Manager Test
                </CardTitle>
                <CardDescription>
                  Test the payment status manager component
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
                    <Label htmlFor="currentStatus">Current Status</Label>
                    <Select value={currentStatus} onValueChange={(value: PaymentStatus) => setCurrentStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="REFUNDED">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {paymentId && (
                  <PaymentStatusManager
                    paymentId={paymentId}
                    currentStatus={currentStatus}
                    onStatusUpdate={(newStatus) => setCurrentStatus(newStatus)}
                    showHistory={true}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Status Tab */}
          <TabsContent value="by-status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Payments by Status
                </CardTitle>
                <CardDescription>
                  View payments filtered by status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'] as PaymentStatus[]).map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      onClick={() => handleFetchPaymentsByStatus(status)}
                      disabled={loading}
                    >
                      {getStatusBadge(status)}
                    </Button>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
                  {paymentsByStatus.map((payment) => (
                    <motion.div
                      key={payment.id}
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
                                  {payment.consultationRequest?.patient?.firstName} {payment.consultationRequest?.patient?.lastName}
                                </h4>
                                {getStatusBadge(payment.status)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p>Amount: {formatCurrency(payment.amount, payment.currency)}</p>
                                <p>Method: {payment.paymentMethod.replace('_', ' ')}</p>
                                <p>Created: {formatDate(payment.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setPaymentId(payment.id)
                                  setCurrentStatus(payment.status)
                                  setActiveTab('status-manager')
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

          {/* Requires Attention Tab */}
          <TabsContent value="attention" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Payments Requiring Attention
                </CardTitle>
                <CardDescription>
                  View payments that need attention or follow-up
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleFetchRequiringAttention} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Check for Attention
                    </>
                  )}
                </Button>

                {paymentsRequiringAttention && (
                  <div className="space-y-4">
                    {/* Failed Payments */}
                    {paymentsRequiringAttention.failed.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            Failed Payments ({paymentsRequiringAttention.failed.length})
                          </CardTitle>
                          <CardDescription>
                            Payments that have failed and need investigation
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {paymentsRequiringAttention.failed.map((payment: any) => (
                              <div key={payment.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <span className="font-medium">
                                    {payment.consultationRequest?.patient?.firstName} {payment.consultationRequest?.patient?.lastName}
                                  </span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {formatCurrency(payment.amount, payment.currency)}
                                  </span>
                                </div>
                                <Badge variant="destructive">Failed</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Processing Payments */}
                    {paymentsRequiringAttention.processing.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 text-blue-500" />
                            Long Processing ({paymentsRequiringAttention.processing.length})
                          </CardTitle>
                          <CardDescription>
                            Payments that have been processing for more than 1 hour
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {paymentsRequiringAttention.processing.map((payment: any) => (
                              <div key={payment.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <span className="font-medium">
                                    {payment.consultationRequest?.patient?.firstName} {payment.consultationRequest?.patient?.lastName}
                                  </span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {formatCurrency(payment.amount, payment.currency)}
                                  </span>
                                </div>
                                <Badge variant="outline">Long Processing</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Pending Payments */}
                    {paymentsRequiringAttention.pending.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                            Old Pending ({paymentsRequiringAttention.pending.length})
                          </CardTitle>
                          <CardDescription>
                            Payments that have been pending for more than 1 day
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {paymentsRequiringAttention.pending.map((payment: any) => (
                              <div key={payment.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <span className="font-medium">
                                    {payment.consultationRequest?.patient?.firstName} {payment.consultationRequest?.patient?.lastName}
                                  </span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {formatCurrency(payment.amount, payment.currency)}
                                  </span>
                                </div>
                                <Badge variant="outline">Old Pending</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Payment Status Statistics
                </CardTitle>
                <CardDescription>
                  View payment status statistics and analytics
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

                {paymentStatistics && (
                  <div className="space-y-6">
                    {/* Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{paymentStatistics.totalPayments}</div>
                            <div className="text-sm text-muted-foreground">Total Payments</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {paymentStatistics.completionRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Completion Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {paymentStatistics.failureRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Failure Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {Math.round(paymentStatistics.averageProcessingTime)}m
                            </div>
                            <div className="text-sm text-muted-foreground">Avg Processing Time</div>
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
                          {Object.entries(paymentStatistics.statusCounts).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(status as PaymentStatus)}
                                <span className="text-sm text-muted-foreground">
                                  {paymentStatistics.totalPayments > 0 ? 
                                    Math.round((count as number) / paymentStatistics.totalPayments * 100) : 0}%
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

          {/* Auto Update Tab */}
          <TabsContent value="auto-update" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Auto Update System
                </CardTitle>
                <CardDescription>
                  Manage automatic payment status updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleTriggerAutoUpdate} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Trigger Auto Update
                    </>
                  )}
                </Button>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Auto Update Rules
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Processing payments older than 2 hours → Failed</li>
                    <li>• Failed payments can be retried</li>
                    <li>• Completed payments can be refunded</li>
                    <li>• Cancelled payments can be retried</li>
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
