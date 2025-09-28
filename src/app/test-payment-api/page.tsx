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
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Play,
  User,
  FileText,
  TrendingUp,
  Loader2,
  Plus,
  Edit,
  Eye,
  Search,
  RefreshCw,
  Download,
  BarChart3,
  Filter,
  Zap,
  Shield,
  Settings,
  Trash2,
  API,
  Database,
  TestTube
} from 'lucide-react'
import { motion } from 'framer-motion'
import { PaymentApiManager } from '@/components/payment/payment-api-manager'
import { usePaymentApi, PaymentRequest, PaymentMethod, PaymentType, PaymentStatus } from '@/hooks/use-payment-api'

export default function TestPaymentApiPage() {
  const [activeTab, setActiveTab] = useState('component')
  const [payments, setPayments] = useState<any[]>([])
  const [paymentStatistics, setPaymentStatistics] = useState<any>(null)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [validationResult, setValidationResult] = useState<any>(null)

  const { 
    createPayment,
    getPayments,
    getPayment,
    updatePayment,
    processPayment,
    cancelPayment,
    validatePayment,
    getPaymentStatistics,
    loading, 
    error 
  } = usePaymentApi()

  const handleCreatePayment = async () => {
    try {
      const paymentRequest: PaymentRequest = {
        patientId: '550e8400-e29b-41d4-a716-446655440000', // Sample UUID
        therapistId: '550e8400-e29b-41d4-a716-446655440001', // Sample UUID
        amount: 150.00,
        paymentMethod: 'CREDIT_CARD',
        paymentType: 'CONSULTATION',
        description: 'Test payment for consultation',
        reference: 'TEST-001',
        autoProcess: false
      }

      const result = await createPayment(paymentRequest)
      alert(`Payment created successfully! Payment ID: ${result.id}`)
    } catch (err) {
      console.error('Failed to create payment:', err)
    }
  }

  const handleFetchPayments = async () => {
    try {
      const result = await getPayments({
        page: 1,
        limit: 20
      })
      setPayments(result.payments)
    } catch (err) {
      console.error('Failed to fetch payments:', err)
    }
  }

  const handleFetchStatistics = async () => {
    try {
      const result = await getPaymentStatistics()
      setPaymentStatistics(result)
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
    }
  }

  const handleValidatePayment = async () => {
    try {
      const paymentRequest: PaymentRequest = {
        patientId: '550e8400-e29b-41d4-a716-446655440000',
        therapistId: '550e8400-e29b-41d4-a716-446655440001',
        amount: 150.00,
        paymentMethod: 'CREDIT_CARD',
        paymentType: 'CONSULTATION',
        description: 'Test payment validation'
      }

      const result = await validatePayment(paymentRequest)
      setValidationResult(result)
    } catch (err) {
      console.error('Failed to validate payment:', err)
    }
  }

  const handleProcessPayment = async (paymentId: string) => {
    try {
      const result = await processPayment(paymentId)
      if (result.success) {
        alert(`Payment processed successfully! Status: ${result.status}`)
      } else {
        alert(`Payment processing failed: ${result.message}`)
      }
    } catch (err) {
      console.error('Failed to process payment:', err)
    }
  }

  const handleCancelPayment = async (paymentId: string) => {
    try {
      const result = await cancelPayment(paymentId, 'Test cancellation')
      if (result.success) {
        alert(`Payment cancelled successfully!`)
      } else {
        alert(`Payment cancellation failed: ${result.message}`)
      }
    } catch (err) {
      console.error('Failed to cancel payment:', err)
    }
  }

  const getStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      'COMPLETED': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      'FAILED': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: XCircle },
      'REFUNDED': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: AlertCircle },
      'PARTIALLY_REFUNDED': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: AlertCircle }
    }
    
    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return <CreditCard className="h-4 w-4" />
      case 'BANK_TRANSFER':
        return <DollarSign className="h-4 w-4" />
      case 'CASH':
        return <DollarSign className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payment API Test</h1>
          <p className="text-muted-foreground">
            Test the comprehensive payment API system with validation
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="component">Component Test</TabsTrigger>
            <TabsTrigger value="api">API Test</TabsTrigger>
          </TabsList>

          {/* Component Test Tab */}
          <TabsContent value="component" className="space-y-6">
            <PaymentApiManager
              showCreateForm={true}
              showPaymentsList={true}
              showStatistics={true}
            />
          </TabsContent>

          {/* API Test Tab */}
          <TabsContent value="api" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Creation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Payment Creation API
                  </CardTitle>
                  <CardDescription>
                    Test payment creation with validation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleCreatePayment} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Payment...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Test Payment
                      </>
                    )}
                  </Button>

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    <p>This will create a test payment with:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Amount: $150.00</li>
                      <li>Method: Credit Card</li>
                      <li>Type: Consultation</li>
                      <li>Auto Process: false</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Validation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Payment Validation API
                  </CardTitle>
                  <CardDescription>
                    Test payment request validation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleValidatePayment} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Validate Payment Request
                      </>
                    )}
                  </Button>

                  <Separator />

                  {validationResult && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Validation Result:</span>
                        <Badge className={validationResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {validationResult.isValid ? 'Valid' : 'Invalid'}
                        </Badge>
                      </div>
                      {validationResult.errors.length > 0 && (
                        <div>
                          <span className="font-medium text-red-600">Errors:</span>
                          <ul className="list-disc list-inside text-sm text-red-600">
                            {validationResult.errors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {validationResult.warnings.length > 0 && (
                        <div>
                          <span className="font-medium text-yellow-600">Warnings:</span>
                          <ul className="list-disc list-inside text-sm text-yellow-600">
                            {validationResult.warnings.map((warning: string, index: number) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Listing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Payment Listing API
                  </CardTitle>
                  <CardDescription>
                    Test payment retrieval with filtering
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleFetchPayments} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading Payments...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Fetch Payments
                      </>
                    )}
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold">Recent Payments ({payments.length})</h4>
                    {payments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          <span className="font-medium">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(payment.status)}
                          <span className="text-sm text-muted-foreground">
                            {formatDate(payment.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Payment Statistics API
                  </CardTitle>
                  <CardDescription>
                    Test payment statistics and analytics
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

                  {paymentStatistics && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{paymentStatistics.totalPayments}</div>
                          <div className="text-sm text-muted-foreground">Total Payments</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(paymentStatistics.totalAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Amount</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Payment Methods</h4>
                        {Object.entries(paymentStatistics.paymentMethods).map(([method, data]: [string, any]) => (
                          <div key={method} className="flex items-center justify-between p-2 border rounded">
                            <span className="font-medium">{method}</span>
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(data.total)}</div>
                              <div className="text-sm text-muted-foreground">{data.count} payments</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Payment Operations API
                  </CardTitle>
                  <CardDescription>
                    Test payment processing and cancellation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentId">Payment ID</Label>
                    <Input
                      id="paymentId"
                      placeholder="Enter payment ID to test operations"
                      onChange={(e) => setSelectedPayment({ id: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => selectedPayment?.id && handleProcessPayment(selectedPayment.id)} 
                      disabled={loading || !selectedPayment?.id}
                      variant="outline"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Process
                    </Button>
                    <Button 
                      onClick={() => selectedPayment?.id && handleCancelPayment(selectedPayment.id)} 
                      disabled={loading || !selectedPayment?.id}
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    <p>Enter a payment ID above to test:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Payment processing</li>
                      <li>Payment cancellation</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* API Endpoints Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <API className="h-5 w-5" />
                    API Endpoints
                  </CardTitle>
                  <CardDescription>
                    Available payment API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm">/api/payments</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/payments</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/payments/[id]</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">PUT</Badge>
                      <code className="text-sm">/api/payments/[id]</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">DELETE</Badge>
                      <code className="text-sm">/api/payments/[id]</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm">/api/payments/[id]/process</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm">/api/payments/validate</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/payments/statistics</code>
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


