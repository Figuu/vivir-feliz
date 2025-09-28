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
  CreditCard, 
  DollarSign, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  FileText,
  TrendingUp,
  Search,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'
import { PaymentProcessingInterface } from '@/components/payment/payment-processing-interface'
import { usePaymentProcessing, PaymentMethod, PaymentStatus } from '@/hooks/use-payment-processing'

export default function TestPaymentProcessingPage() {
  const [activeTab, setActiveTab] = useState('payment-interface')
  const [consultationRequestId, setConsultationRequestId] = useState('')
  const [consultationDetails, setConsultationDetails] = useState({
    patientName: 'John Doe',
    specialty: 'Speech Therapy',
    amount: 150,
    currency: 'USD'
  })
  const [payments, setPayments] = useState<any[]>([])
  const [paymentStatistics, setPaymentStatistics] = useState<any>(null)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  const { 
    getPayments,
    getPaymentStatistics,
    getPayment,
    loading, 
    error 
  } = usePaymentProcessing()

  const handleFetchPayments = async () => {
    try {
      const result = await getPayments({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
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

  const handleViewPayment = async (paymentId: string) => {
    try {
      const result = await getPayment(paymentId)
      setSelectedPayment(result)
      setActiveTab('payment-details')
    } catch (err) {
      console.error('Failed to fetch payment details:', err)
    }
  }

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH':
        return <DollarSign className="h-4 w-4" />
      case 'CARD':
        return <CreditCard className="h-4 w-4" />
      case 'BANK_TRANSFER':
        return <FileText className="h-4 w-4" />
      case 'CHECK':
        return <FileText className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentStatusBadge = (status: PaymentStatus) => {
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
          <h1 className="text-3xl font-bold mb-2">Payment Processing Test</h1>
          <p className="text-muted-foreground">
            Test the payment processing interface and management system
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="payment-interface">Payment Interface</TabsTrigger>
            <TabsTrigger value="payment-list">Payment List</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="payment-details">Payment Details</TabsTrigger>
          </TabsList>

          {/* Payment Interface Tab */}
          <TabsContent value="payment-interface" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Processing Interface Test
                </CardTitle>
                <CardDescription>
                  Test the payment processing interface with different scenarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="consultationId">Consultation Request ID</Label>
                    <Input
                      id="consultationId"
                      value={consultationRequestId}
                      onChange={(e) => setConsultationRequestId(e.target.value)}
                      placeholder="Enter consultation request ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientName">Patient Name</Label>
                    <Input
                      id="patientName"
                      value={consultationDetails.patientName}
                      onChange={(e) => setConsultationDetails(prev => ({ ...prev, patientName: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="specialty">Specialty</Label>
                    <Select value={consultationDetails.specialty} onValueChange={(value) => setConsultationDetails(prev => ({ ...prev, specialty: value }))}>
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
                      value={consultationDetails.amount}
                      onChange={(e) => setConsultationDetails(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={consultationDetails.currency} onValueChange={(value) => setConsultationDetails(prev => ({ ...prev, currency: value }))}>
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

                {consultationRequestId && (
                  <PaymentProcessingInterface
                    consultationRequestId={consultationRequestId}
                    consultationDetails={consultationDetails}
                    onPaymentComplete={(paymentId) => {
                      alert(`Payment completed successfully! Payment ID: ${paymentId}`)
                      handleFetchPayments()
                    }}
                    onPaymentCancel={() => {
                      alert('Payment cancelled')
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment List Tab */}
          <TabsContent value="payment-list" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Payment List
                </CardTitle>
                <CardDescription>
                  View and manage all payments
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
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Fetch Payments
                    </>
                  )}
                </Button>

                <Separator />

                <div className="space-y-4">
                  {payments.map((payment) => (
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
                                {getPaymentStatusBadge(payment.status)}
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
                                onClick={() => handleViewPayment(payment.id)}
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
                  Payment Statistics
                </CardTitle>
                <CardDescription>
                  View payment statistics and analytics
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
                              {formatCurrency(paymentStatistics.totalAmount, 'USD')}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Amount</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {formatCurrency(paymentStatistics.averageAmount, 'USD')}
                            </div>
                            <div className="text-sm text-muted-foreground">Average Amount</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {paymentStatistics.completionRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Completion Rate</div>
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
                                {getPaymentStatusBadge(status as PaymentStatus)}
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

                    {/* Payment Method Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Payment Method Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(paymentStatistics.methodCounts).map(([method, count]) => (
                            <div key={method} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getPaymentMethodIcon(method as PaymentMethod)}
                                <span className="font-medium">{method.replace('_', ' ')}</span>
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

          {/* Payment Details Tab */}
          <TabsContent value="payment-details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Detailed view of a specific payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPayment ? (
                  <div className="space-y-6">
                    {/* Payment Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Payment ID</Label>
                        <p className="text-sm text-muted-foreground">{selectedPayment.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-1">
                          {getPaymentStatusBadge(selectedPayment.status)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Amount</Label>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Payment Method</Label>
                        <div className="flex items-center gap-2 mt-1">
                          {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                          <span className="text-sm">{selectedPayment.paymentMethod.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Consultation Information */}
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3">Consultation Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Patient</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedPayment.consultationRequest?.patient?.firstName} {selectedPayment.consultationRequest?.patient?.lastName}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Specialty</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedPayment.consultationRequest?.specialty?.name}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Parent</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedPayment.consultationRequest?.parent?.firstName} {selectedPayment.consultationRequest?.parent?.lastName}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Email</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedPayment.consultationRequest?.parent?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3">Payment Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Created</Label>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(selectedPayment.createdAt)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Updated</Label>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(selectedPayment.updatedAt)}
                          </p>
                        </div>
                        {selectedPayment.transactionId && (
                          <div>
                            <Label className="text-sm font-medium">Transaction ID</Label>
                            <p className="text-sm text-muted-foreground">
                              {selectedPayment.transactionId}
                            </p>
                          </div>
                        )}
                        {selectedPayment.receiptUrl && (
                          <div>
                            <Label className="text-sm font-medium">Receipt</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(selectedPayment.receiptUrl, '_blank')}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Receipt
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Payment Selected</h3>
                    <p className="text-muted-foreground">
                      Select a payment from the Payment List tab to view details
                    </p>
                  </div>
                )}
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


