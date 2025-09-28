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
  Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePaymentApi, PaymentRequest, PaymentMethod, PaymentType, PaymentStatus } from '@/hooks/use-payment-api'

interface PaymentApiManagerProps {
  patientId?: string
  therapistId?: string
  showCreateForm?: boolean
  showPaymentsList?: boolean
  showStatistics?: boolean
}

export function PaymentApiManager({
  patientId,
  therapistId,
  showCreateForm = true,
  showPaymentsList = true,
  showStatistics = true
}: PaymentApiManagerProps) {
  const [activeTab, setActiveTab] = useState('create')
  const [payments, setPayments] = useState<any[]>([])
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  const [paymentStatistics, setPaymentStatistics] = useState<any>(null)
  
  const [createForm, setCreateForm] = useState<PaymentRequest>({
    patientId: patientId || '',
    therapistId: therapistId || '',
    consultationRequestId: '',
    paymentPlanId: '',
    amount: 0,
    paymentMethod: 'CREDIT_CARD',
    paymentType: 'CONSULTATION',
    description: '',
    reference: '',
    metadata: {},
    dueDate: '',
    autoProcess: false
  })
  
  const [filters, setFilters] = useState({
    patientId: patientId || '',
    therapistId: therapistId || '',
    paymentMethod: '',
    paymentType: '',
    status: '',
    searchTerm: '',
    page: 1,
    limit: 20
  })

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

  // Load payments
  const loadPayments = async () => {
    try {
      const result = await getPayments({
        patientId: filters.patientId || undefined,
        therapistId: filters.therapistId || undefined,
        paymentMethod: filters.paymentMethod as PaymentMethod || undefined,
        paymentType: filters.paymentType as PaymentType || undefined,
        status: filters.status as PaymentStatus || undefined,
        searchTerm: filters.searchTerm || undefined,
        page: filters.page,
        limit: filters.limit
      })
      setPayments(result.payments)
    } catch (err) {
      console.error('Failed to load payments:', err)
    }
  }

  // Load payment statistics
  const loadPaymentStatistics = async () => {
    try {
      const result = await getPaymentStatistics({
        patientId: filters.patientId || undefined,
        therapistId: filters.therapistId || undefined,
        paymentMethod: filters.paymentMethod as PaymentMethod || undefined,
        paymentType: filters.paymentType as PaymentType || undefined,
        status: filters.status as PaymentStatus || undefined
      })
      setPaymentStatistics(result)
    } catch (err) {
      console.error('Failed to load payment statistics:', err)
    }
  }

  useEffect(() => {
    if (showPaymentsList) {
      loadPayments()
    }
  }, [filters, showPaymentsList])

  useEffect(() => {
    if (showStatistics) {
      loadPaymentStatistics()
    }
  }, [filters, showStatistics])

  const handleCreatePayment = async () => {
    try {
      // Validate payment first
      const validation = await validatePayment(createForm)
      if (!validation.isValid) {
        alert(`Validation failed: ${validation.errors.join(', ')}`)
        return
      }

      const result = await createPayment(createForm)
      
      // Reset form
      setCreateForm({
        patientId: patientId || '',
        therapistId: therapistId || '',
        consultationRequestId: '',
        paymentPlanId: '',
        amount: 0,
        paymentMethod: 'CREDIT_CARD',
        paymentType: 'CONSULTATION',
        description: '',
        reference: '',
        metadata: {},
        dueDate: '',
        autoProcess: false
      })
      
      // Reload payments
      await loadPayments()
      
      alert(`Payment created successfully! Payment ID: ${result.id}`)
    } catch (err) {
      console.error('Failed to create payment:', err)
    }
  }

  const handleViewPaymentDetails = async (paymentId: string) => {
    try {
      const payment = await getPayment(paymentId)
      setSelectedPayment(payment)
      setShowPaymentDetails(true)
    } catch (err) {
      console.error('Failed to load payment details:', err)
    }
  }

  const handleProcessPayment = async (paymentId: string) => {
    try {
      const result = await processPayment(paymentId)
      if (result.success) {
        alert(`Payment processed successfully! Status: ${result.status}`)
        await loadPayments()
      } else {
        alert(`Payment processing failed: ${result.message}`)
      }
    } catch (err) {
      console.error('Failed to process payment:', err)
    }
  }

  const handleCancelPayment = async (paymentId: string) => {
    try {
      const reason = prompt('Enter cancellation reason:')
      if (reason === null) return

      const result = await cancelPayment(paymentId, reason)
      if (result.success) {
        alert(`Payment cancelled successfully!`)
        await loadPayments()
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
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Create Payment</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Create Payment Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Payment
              </CardTitle>
              <CardDescription>
                Create a new payment with comprehensive validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientId">Patient ID *</Label>
                  <Input
                    id="patientId"
                    value={createForm.patientId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, patientId: e.target.value }))}
                    placeholder="Patient UUID"
                  />
                </div>
                <div>
                  <Label htmlFor="therapistId">Therapist ID *</Label>
                  <Input
                    id="therapistId"
                    value={createForm.therapistId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, therapistId: e.target.value }))}
                    placeholder="Therapist UUID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={createForm.amount}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select value={createForm.paymentMethod} onValueChange={(value: PaymentMethod) => setCreateForm(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHECK">Check</SelectItem>
                      <SelectItem value="PAYPAL">PayPal</SelectItem>
                      <SelectItem value="STRIPE">Stripe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentType">Payment Type *</Label>
                  <Select value={createForm.paymentType} onValueChange={(value: PaymentType) => setCreateForm(prev => ({ ...prev, paymentType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONSULTATION">Consultation</SelectItem>
                      <SelectItem value="SESSION">Session</SelectItem>
                      <SelectItem value="EVALUATION">Evaluation</SelectItem>
                      <SelectItem value="TREATMENT">Treatment</SelectItem>
                      <SelectItem value="PLAN_INSTALLMENT">Plan Installment</SelectItem>
                      <SelectItem value="REFUND">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={createForm.dueDate}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="consultationRequestId">Consultation Request ID</Label>
                  <Input
                    id="consultationRequestId"
                    value={createForm.consultationRequestId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, consultationRequestId: e.target.value }))}
                    placeholder="Consultation Request UUID"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentPlanId">Payment Plan ID</Label>
                  <Input
                    id="paymentPlanId"
                    value={createForm.paymentPlanId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, paymentPlanId: e.target.value }))}
                    placeholder="Payment Plan UUID"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Payment description"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={createForm.reference}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="Payment reference"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoProcess"
                  checked={createForm.autoProcess}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, autoProcess: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="autoProcess">Auto Process Payment</Label>
              </div>

              <Button
                onClick={handleCreatePayment}
                disabled={loading || !createForm.patientId || !createForm.therapistId || createForm.amount <= 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Payment...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Payment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Payments
              </CardTitle>
              <CardDescription>
                View and manage payments with advanced filtering
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="searchTerm">Search</Label>
                  <Input
                    id="searchTerm"
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    placeholder="Search payments..."
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={filters.paymentMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All methods</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHECK">Check</SelectItem>
                      <SelectItem value="PAYPAL">PayPal</SelectItem>
                      <SelectItem value="STRIPE">Stripe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                      <SelectItem value="PARTIALLY_REFUNDED">Partially Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentType">Payment Type</Label>
                  <Select value={filters.paymentType} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="CONSULTATION">Consultation</SelectItem>
                      <SelectItem value="SESSION">Session</SelectItem>
                      <SelectItem value="EVALUATION">Evaluation</SelectItem>
                      <SelectItem value="TREATMENT">Treatment</SelectItem>
                      <SelectItem value="PLAN_INSTALLMENT">Plan Installment</SelectItem>
                      <SelectItem value="REFUND">Refund</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={loadPayments} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Payments...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Payments
                  </>
                )}
              </Button>

              <Separator />

              {/* Payments List */}
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
                              {getPaymentMethodIcon(payment.paymentMethod)}
                              <span className="font-semibold">
                                {formatCurrency(payment.amount)}
                              </span>
                              {getStatusBadge(payment.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Patient: {payment.patient?.firstName} {payment.patient?.lastName}</p>
                              <p>Therapist: {payment.therapist?.firstName} {payment.therapist?.lastName}</p>
                              <p>Date: {formatDate(payment.createdAt)}</p>
                              {payment.description && <p>Description: {payment.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPaymentDetails(payment.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {payment.status === 'PENDING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleProcessPayment(payment.id)}
                              >
                                <Zap className="h-4 w-4" />
                              </Button>
                            )}
                            {payment.status === 'PENDING' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelPayment(payment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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
                <BarChart3 className="h-5 w-5" />
                Payment Statistics
              </CardTitle>
              <CardDescription>
                View payment statistics and analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={loadPaymentStatistics} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Statistics...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Refresh Statistics
                  </>
                )}
              </Button>

              <Separator />

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
                            {formatCurrency(paymentStatistics.totalAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Amount</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(paymentStatistics.averageAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Average Amount</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {Object.keys(paymentStatistics.paymentMethods).length}
                          </div>
                          <div className="text-sm text-muted-foreground">Payment Methods</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payment Methods Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Methods</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(paymentStatistics.paymentMethods).map(([method, data]: [string, any]) => (
                          <div key={method} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(method as PaymentMethod)}
                              <span className="font-medium">{method}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(data.total)}</div>
                              <div className="text-sm text-muted-foreground">{data.count} payments</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(paymentStatistics.statusBreakdown).map(([status, count]: [string, any]) => (
                          <div key={status} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(status as PaymentStatus)}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{count}</div>
                              <div className="text-sm text-muted-foreground">payments</div>
                            </div>
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
      </Tabs>

      {/* Payment Details Modal */}
      <AnimatePresence>
        {showPaymentDetails && selectedPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowPaymentDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Payment Details</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentDetails(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Payment ID</Label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedPayment.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Amount</Label>
                    <p className="text-lg font-semibold">
                      {formatCurrency(selectedPayment.amount)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Payment Method</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                      <span>{selectedPayment.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Payment Type</Label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.paymentType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Transaction ID</Label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.transactionId || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Created At</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedPayment.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Processed At</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedPayment.processedAt ? formatDate(selectedPayment.processedAt) : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedPayment.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.description}</p>
                  </div>
                )}

                {selectedPayment.reference && (
                  <div>
                    <Label className="text-sm font-medium">Reference</Label>
                    <p className="text-sm text-muted-foreground">{selectedPayment.reference}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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


