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
  Download as DownloadIcon,
  History,
  Report
} from 'lucide-react'
import { motion } from 'framer-motion'
import { PaymentHistoryReports } from '@/components/payment/payment-history-reports'
import { usePaymentHistory, PaymentHistoryFilter, PaymentHistorySort } from '@/hooks/use-payment-history'

export default function TestPaymentHistoryReportsPage() {
  const [activeTab, setActiveTab] = useState('component')
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [paymentSummary, setPaymentSummary] = useState<any>(null)
  const [paymentTrends, setPaymentTrends] = useState<any[]>([])
  const [generatedReport, setGeneratedReport] = useState<any>(null)

  const { 
    getPaymentHistory,
    getPaymentHistorySummary,
    generatePaymentReport,
    getPaymentTrends,
    loading, 
    error 
  } = usePaymentHistory()

  const handleFetchPaymentHistory = async () => {
    try {
      const result = await getPaymentHistory({
        pagination: { page: 1, limit: 20 }
      })
      setPaymentHistory(result.payments)
    } catch (err) {
      console.error('Failed to fetch payment history:', err)
    }
  }

  const handleFetchSummary = async () => {
    try {
      const result = await getPaymentHistorySummary()
      setPaymentSummary(result)
    } catch (err) {
      console.error('Failed to fetch summary:', err)
    }
  }

  const handleFetchTrends = async () => {
    try {
      const result = await getPaymentTrends({
        period: 'MONTHLY',
        dateRange: {
          start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      })
      setPaymentTrends(result)
    } catch (err) {
      console.error('Failed to fetch trends:', err)
    }
  }

  const handleGenerateReport = async () => {
    try {
      const result = await generatePaymentReport({
        reportType: 'MONTHLY',
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        },
        generatedBy: 'Test User'
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payment History & Reports Test</h1>
          <p className="text-muted-foreground">
            Test the payment history and reporting system
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="component">Component Test</TabsTrigger>
            <TabsTrigger value="api">API Test</TabsTrigger>
          </TabsList>

          {/* Component Test Tab */}
          <TabsContent value="component" className="space-y-6">
            <PaymentHistoryReports
              showHistory={true}
              showReports={true}
              showTrends={true}
            />
          </TabsContent>

          {/* API Test Tab */}
          <TabsContent value="api" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Payment History API
                  </CardTitle>
                  <CardDescription>
                    Test payment history API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleFetchPaymentHistory} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading History...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Fetch Payment History
                      </>
                    )}
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold">Recent Payments ({paymentHistory.length})</h4>
                    {paymentHistory.slice(0, 3).map((payment) => (
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
                            {formatDate(payment.transactionDate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Payment Summary API
                  </CardTitle>
                  <CardDescription>
                    Test payment summary API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleFetchSummary} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading Summary...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Fetch Payment Summary
                      </>
                    )}
                  </Button>

                  <Separator />

                  {paymentSummary && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
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
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Payment Methods</h4>
                        {Object.entries(paymentSummary.paymentMethods).map(([method, data]: [string, any]) => (
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

              {/* Payment Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5" />
                    Payment Trends API
                  </CardTitle>
                  <CardDescription>
                    Test payment trends API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleFetchTrends} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading Trends...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Fetch Payment Trends
                      </>
                    )}
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold">Monthly Trends ({paymentTrends.length})</h4>
                    {paymentTrends.slice(0, 5).map((trend) => (
                      <div key={trend.period} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{trend.period}</div>
                          <div className="text-sm text-muted-foreground">{trend.count} payments</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(trend.total)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Avg: {formatCurrency(trend.average)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Report Generation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Report className="h-5 w-5" />
                    Report Generation API
                  </CardTitle>
                  <CardDescription>
                    Test payment report generation API
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleGenerateReport} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Generate Monthly Report
                      </>
                    )}
                  </Button>

                  <Separator />

                  {generatedReport && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Generated Report</h4>
                        <div className="p-3 border rounded bg-muted">
                          <div className="text-sm">
                            <div><strong>Report ID:</strong> {generatedReport.id}</div>
                            <div><strong>Title:</strong> {generatedReport.title}</div>
                            <div><strong>Type:</strong> {generatedReport.reportType}</div>
                            <div><strong>Generated At:</strong> {formatDate(generatedReport.generatedAt)}</div>
                            <div><strong>Generated By:</strong> {generatedReport.generatedBy}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{generatedReport.data.totalPayments}</div>
                          <div className="text-sm text-muted-foreground">Total Payments</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(generatedReport.data.totalAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Amount</div>
                        </div>
                      </div>
                    </div>
                  )}
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


