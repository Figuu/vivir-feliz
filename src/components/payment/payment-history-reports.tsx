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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar,
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
  PieChart,
  LineChart,
  Filter,
  Download as DownloadIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePaymentHistory, PaymentHistoryFilter, PaymentHistorySort } from '@/hooks/use-payment-history'

interface PaymentHistoryReportsProps {
  patientId?: string
  therapistId?: string
  showHistory?: boolean
  showReports?: boolean
  showTrends?: boolean
}

export function PaymentHistoryReports({
  patientId,
  therapistId,
  showHistory = true,
  showReports = true,
  showTrends = true
}: PaymentHistoryReportsProps) {
  const [activeTab, setActiveTab] = useState('history')
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [paymentSummary, setPaymentSummary] = useState<any>(null)
  const [paymentTrends, setPaymentTrends] = useState<any[]>([])
  const [generatedReport, setGeneratedReport] = useState<any>(null)
  
  const [filters, setFilters] = useState<PaymentHistoryFilter>({
    patientId: patientId || '',
    therapistId: therapistId || '',
    paymentMethod: '',
    status: '',
    dateRange: { start: '', end: '' },
    amountRange: { min: 0, max: 10000 },
    searchTerm: ''
  })
  
  const [sort, setSort] = useState<PaymentHistorySort>({
    field: 'date',
    direction: 'desc'
  })
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20
  })
  
  const [reportForm, setReportForm] = useState({
    reportType: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM',
    startDate: '',
    endDate: '',
    generatedBy: 'system'
  })

  const { 
    getPaymentHistory,
    getPaymentHistorySummary,
    generatePaymentReport,
    getPaymentTrends,
    loading, 
    error 
  } = usePaymentHistory()

  // Load payment history
  const loadPaymentHistory = async () => {
    try {
      const result = await getPaymentHistory({
        filters,
        sort,
        pagination
      })
      setPaymentHistory(result.payments)
    } catch (err) {
      console.error('Failed to load payment history:', err)
    }
  }

  // Load payment summary
  const loadPaymentSummary = async () => {
    try {
      const result = await getPaymentHistorySummary(filters)
      setPaymentSummary(result)
    } catch (err) {
      console.error('Failed to load payment summary:', err)
    }
  }

  // Load payment trends
  const loadPaymentTrends = async () => {
    try {
      const result = await getPaymentTrends({
        period: 'MONTHLY',
        dateRange: {
          start: reportForm.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          end: reportForm.endDate || new Date().toISOString()
        },
        filters
      })
      setPaymentTrends(result)
    } catch (err) {
      console.error('Failed to load payment trends:', err)
    }
  }

  useEffect(() => {
    if (showHistory) {
      loadPaymentHistory()
    }
  }, [filters, sort, pagination, showHistory])

  useEffect(() => {
    if (showReports) {
      loadPaymentSummary()
    }
  }, [filters, showReports])

  useEffect(() => {
    if (showTrends) {
      loadPaymentTrends()
    }
  }, [filters, reportForm.startDate, reportForm.endDate, showTrends])

  const handleGenerateReport = async () => {
    try {
      const result = await generatePaymentReport({
        reportType: reportForm.reportType,
        dateRange: {
          start: reportForm.startDate,
          end: reportForm.endDate
        },
        filters,
        generatedBy: reportForm.generatedBy
      })
      setGeneratedReport(result)
    } catch (err) {
      console.error('Failed to generate report:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'COMPLETED': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      'FAILED': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: XCircle },
      'REFUNDED': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: AlertCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />
      case 'bank_transfer':
        return <DollarSign className="h-4 w-4" />
      case 'cash':
        return <DollarSign className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Payment History
              </CardTitle>
              <CardDescription>
                View and filter payment history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="searchTerm">Search</Label>
                  <Input
                    id="searchTerm"
                    value={filters.searchTerm || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    placeholder="Search payments..."
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={filters.paymentMethod || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All methods</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHECK">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filters.status || ''} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sortField">Sort By</Label>
                  <Select value={sort.field} onValueChange={(value: 'date' | 'amount' | 'status' | 'method') => setSort(prev => ({ ...prev, field: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="method">Payment Method</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.dateRange?.start || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange!, start: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.dateRange?.end || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange!, end: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <Button onClick={loadPaymentHistory} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading History...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh History
                  </>
                )}
              </Button>

              <Separator />

              {/* Payment History List */}
              <div className="space-y-4">
                {paymentHistory.map((payment) => (
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
                              <p>Date: {formatDate(payment.transactionDate)}</p>
                              {payment.description && <p>Description: {payment.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {payment.paymentMethod}
                            </Badge>
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

        {/* Reports & Analytics Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Payment Reports & Analytics
              </CardTitle>
              <CardDescription>
                Generate reports and view payment analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Report Generation */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={reportForm.reportType} onValueChange={(value: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM') => setReportForm(prev => ({ ...prev, reportType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reportStartDate">Start Date</Label>
                  <Input
                    id="reportStartDate"
                    type="date"
                    value={reportForm.startDate}
                    onChange={(e) => setReportForm(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="reportEndDate">End Date</Label>
                  <Input
                    id="reportEndDate"
                    type="date"
                    value={reportForm.endDate}
                    onChange={(e) => setReportForm(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="generatedBy">Generated By</Label>
                  <Input
                    id="generatedBy"
                    value={reportForm.generatedBy}
                    onChange={(e) => setReportForm(prev => ({ ...prev, generatedBy: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
              </div>

              <Button onClick={handleGenerateReport} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>

              <Separator />

              {/* Payment Summary */}
              {paymentSummary && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{paymentSummary.totalPayments}</div>
                          <div className="text-sm text-muted-foreground">Total Payments</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(paymentSummary.totalAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Amount</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(paymentSummary.averageAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Average Amount</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {Object.keys(paymentSummary.paymentMethods).length}
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
                        {Object.entries(paymentSummary.paymentMethods).map(([method, data]: [string, any]) => (
                          <div key={method} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(method)}
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

                  {/* Top Patients */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Patients</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {paymentSummary.topPatients.slice(0, 5).map((patient: any) => (
                          <div key={patient.patientId} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="font-medium">{patient.patientName}</div>
                              <div className="text-sm text-muted-foreground">{patient.paymentCount} payments</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(patient.totalPaid)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Generated Report */}
              {generatedReport && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Generated Report
                    </CardTitle>
                    <CardDescription>
                      {generatedReport.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Report ID</Label>
                          <p className="text-sm text-muted-foreground">{generatedReport.id}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Generated At</Label>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(generatedReport.generatedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Total Payments</Label>
                          <p className="text-lg font-semibold">{generatedReport.data.totalPayments}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Total Amount</Label>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(generatedReport.data.totalAmount)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Payment Trends
              </CardTitle>
              <CardDescription>
                View payment trends over time
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={loadPaymentTrends} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Trends...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Refresh Trends
                  </>
                )}
              </Button>

              <Separator />

              {/* Trends Data */}
              <div className="space-y-4">
                {paymentTrends.map((trend) => (
                  <motion.div
                    key={trend.period}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="font-semibold">{trend.period}</div>
                            <div className="text-sm text-muted-foreground">
                              {trend.count} payments
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-green-600">
                              {formatCurrency(trend.total)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Avg: {formatCurrency(trend.average)}
                            </div>
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
  )
}


