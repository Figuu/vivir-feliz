'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  BarChart3,
  Settings,
  Trash2,
  Edit,
  Eye,
  Loader2,
  Timer,
  Calendar,
  User,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Shield,
  Bell,
  AlertCircle,
  Info,
  Database,
  TestTube
} from 'lucide-react'
import { motion } from 'framer-motion'
import { PaymentTimeoutManager } from '@/components/payment/payment-timeout-manager'
import { usePaymentTimeout, PaymentTimeoutStatus, CancellationReason, PaymentTimeoutConfig } from '@/hooks/use-payment-timeout'

export default function TestPaymentTimeoutPage() {
  const [activeTab, setActiveTab] = useState('component')
  const [activeTimeouts, setActiveTimeouts] = useState<any[]>([])
  const [expiredTimeouts, setExpiredTimeouts] = useState<any[]>([])
  const [timeoutStatistics, setTimeoutStatistics] = useState<any>(null)
  const [selectedTimeout, setSelectedTimeout] = useState<any>(null)

  const { 
    createTimeout,
    extendTimeout,
    cancelPayment,
    getPaymentTimeout,
    getActiveTimeouts,
    getExpiredTimeouts,
    processExpiredTimeouts,
    getTimeoutStatistics,
    loading, 
    error 
  } = usePaymentTimeout()

  const handleCreateTestTimeout = async () => {
    try {
      const result = await createTimeout(
        '550e8400-e29b-41d4-a716-446655440000', // Sample UUID
        30, // 30 minutes
        {
          defaultTimeoutMinutes: 30,
          warningThresholdMinutes: 5,
          extensionAllowed: true,
          maxExtensions: 2,
          extensionMinutes: 15,
          autoCancelEnabled: true,
          notificationEnabled: true
        }
      )
      alert(`Timeout created successfully! Timeout ID: ${result.id}`)
    } catch (err) {
      console.error('Failed to create timeout:', err)
    }
  }

  const handleExtendTestTimeout = async () => {
    try {
      const result = await extendTimeout(
        '550e8400-e29b-41d4-a716-446655440000',
        15, // 15 minutes
        'Test extension'
      )
      alert(`Timeout extended successfully! New timeout: ${new Date(result.timeoutAt).toLocaleString()}`)
    } catch (err) {
      console.error('Failed to extend timeout:', err)
    }
  }

  const handleCancelTestPayment = async () => {
    try {
      const result = await cancelPayment({
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'USER_REQUEST',
        notes: 'Test cancellation',
        cancelledBy: 'user',
        refundRequired: false
      })
      alert(`Payment cancelled successfully! Reason: USER_REQUEST`)
    } catch (err) {
      console.error('Failed to cancel payment:', err)
    }
  }

  const handleFetchActiveTimeouts = async () => {
    try {
      const result = await getActiveTimeouts()
      setActiveTimeouts(result)
    } catch (err) {
      console.error('Failed to fetch active timeouts:', err)
    }
  }

  const handleFetchExpiredTimeouts = async () => {
    try {
      const result = await getExpiredTimeouts()
      setExpiredTimeouts(result)
    } catch (err) {
      console.error('Failed to fetch expired timeouts:', err)
    }
  }

  const handleFetchStatistics = async () => {
    try {
      const result = await getTimeoutStatistics()
      setTimeoutStatistics(result)
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
    }
  }

  const handleProcessExpiredTimeouts = async () => {
    try {
      const result = await processExpiredTimeouts()
      alert(`Processed ${result.processed} expired timeouts, cancelled ${result.cancelled} payments`)
    } catch (err) {
      console.error('Failed to process expired timeouts:', err)
    }
  }

  const getStatusBadge = (status: PaymentTimeoutStatus) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: Clock },
      'WARNING': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: AlertTriangle },
      'EXPIRED': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: Trash2 },
      'EXTENDED': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Timer }
    }
    
    const config = statusConfig[status] || statusConfig.ACTIVE
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getCancellationReasonBadge = (reason: CancellationReason) => {
    const reasonConfig = {
      'USER_REQUEST': { color: 'bg-blue-100 text-blue-800', icon: User },
      'TIMEOUT': { color: 'bg-red-100 text-red-800', icon: Clock },
      'ADMIN_CANCELLATION': { color: 'bg-purple-100 text-purple-800', icon: Shield },
      'PAYMENT_FAILED': { color: 'bg-orange-100 text-orange-800', icon: XCircle },
      'DUPLICATE_PAYMENT': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      'INVALID_AMOUNT': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      'SYSTEM_ERROR': { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
      'OTHER': { color: 'bg-gray-100 text-gray-800', icon: Info }
    }
    
    const config = reasonConfig[reason] || reasonConfig.OTHER
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {reason.replace('_', ' ')}
      </Badge>
    )
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours}h ${remainingMinutes}m`
    }
  }

  const getTimeRemaining = (timeoutAt: Date) => {
    const now = new Date()
    const diff = timeoutAt.getTime() - now.getTime()
    
    if (diff <= 0) {
      return 'Expired'
    }
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else {
      return `${minutes}m`
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payment Timeout Management Test</h1>
          <p className="text-muted-foreground">
            Test the comprehensive payment timeout and cancellation system
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="component">Component Test</TabsTrigger>
            <TabsTrigger value="api">API Test</TabsTrigger>
          </TabsList>

          {/* Component Test Tab */}
          <TabsContent value="component" className="space-y-6">
            <PaymentTimeoutManager
              paymentId="550e8400-e29b-41d4-a716-446655440000"
              showCreateForm={true}
              showActiveTimeouts={true}
              showExpiredTimeouts={true}
              showStatistics={true}
            />
          </TabsContent>

          {/* API Test Tab */}
          <TabsContent value="api" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Timeout Creation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Timeout Creation API
                  </CardTitle>
                  <CardDescription>
                    Test payment timeout creation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleCreateTestTimeout} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Timeout...
                      </>
                    ) : (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Create Test Timeout
                      </>
                    )}
                  </Button>

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    <p>This will create a timeout with:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Payment ID: 550e8400-e29b-41d4-a716-446655440000</li>
                      <li>Duration: 30 minutes</li>
                      <li>Warning: 5 minutes before expiry</li>
                      <li>Extensions: Up to 2 extensions of 15 minutes each</li>
                      <li>Auto-cancel: Enabled</li>
                      <li>Notifications: Enabled</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Timeout Extension */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Timeout Extension API
                  </CardTitle>
                  <CardDescription>
                    Test payment timeout extension
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleExtendTestTimeout} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extending Timeout...
                      </>
                    ) : (
                      <>
                        <Timer className="mr-2 h-4 w-4" />
                        Extend Test Timeout
                      </>
                    )}
                  </Button>

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    <p>This will extend the timeout by:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Payment ID: 550e8400-e29b-41d4-a716-446655440000</li>
                      <li>Extension: 15 minutes</li>
                      <li>Notes: Test extension</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Cancellation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Payment Cancellation API
                  </CardTitle>
                  <CardDescription>
                    Test payment cancellation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleCancelTestPayment} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cancelling Payment...
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Test Payment
                      </>
                    )}
                  </Button>

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    <p>This will cancel the payment with:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Payment ID: 550e8400-e29b-41d4-a716-446655440000</li>
                      <li>Reason: USER_REQUEST</li>
                      <li>Notes: Test cancellation</li>
                      <li>Refund: Not required</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Active Timeouts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Active Timeouts API
                  </CardTitle>
                  <CardDescription>
                    Test active timeout retrieval
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleFetchActiveTimeouts} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading Active Timeouts...
                      </>
                    ) : (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Fetch Active Timeouts
                      </>
                    )}
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold">Active Timeouts ({activeTimeouts.length})</h4>
                    {activeTimeouts.slice(0, 3).map((timeout) => (
                      <div key={timeout.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{timeout.paymentId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(timeout.status)}
                          <span className="text-sm text-muted-foreground">
                            {getTimeRemaining(timeout.timeoutAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Expired Timeouts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Expired Timeouts API
                  </CardTitle>
                  <CardDescription>
                    Test expired timeout retrieval
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleFetchExpiredTimeouts} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading Expired Timeouts...
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Fetch Expired Timeouts
                      </>
                    )}
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold">Expired Timeouts ({expiredTimeouts.length})</h4>
                    {expiredTimeouts.slice(0, 3).map((timeout) => (
                      <div key={timeout.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{timeout.paymentId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(timeout.status)}
                          {timeout.cancellationReason && (
                            <div className="flex items-center gap-2">
                              {getCancellationReasonBadge(timeout.cancellationReason)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Process Expired Timeouts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Process Expired Timeouts API
                  </CardTitle>
                  <CardDescription>
                    Test expired timeout processing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleProcessExpiredTimeouts} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Process Expired Timeouts
                      </>
                    )}
                  </Button>

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    <p>This will process all expired timeouts:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Find all expired timeouts</li>
                      <li>Cancel payments automatically</li>
                      <li>Send notifications</li>
                      <li>Update timeout status</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Timeout Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Timeout Statistics API
                  </CardTitle>
                  <CardDescription>
                    Test timeout statistics and analytics
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
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Fetch Statistics
                      </>
                    )}
                  </Button>

                  <Separator />

                  {timeoutStatistics && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{timeoutStatistics.totalTimeouts}</div>
                          <div className="text-sm text-muted-foreground">Total Timeouts</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{timeoutStatistics.activeTimeouts}</div>
                          <div className="text-sm text-muted-foreground">Active</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Cancellation Reasons</h4>
                        {Object.entries(timeoutStatistics.cancellationReasons).map(([reason, count]: [string, any]) => (
                          <div key={reason} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getCancellationReasonBadge(reason as CancellationReason)}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{count}</div>
                              <div className="text-sm text-muted-foreground">cancellations</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* API Endpoints Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    API Endpoints
                  </CardTitle>
                  <CardDescription>
                    Available timeout management API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm">/api/payments/timeout</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/payments/timeout</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">PUT</Badge>
                      <code className="text-sm">/api/payments/timeout</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">DELETE</Badge>
                      <code className="text-sm">/api/payments/timeout</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm">/api/payments/timeout/process-expired</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/payments/timeout/statistics</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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


