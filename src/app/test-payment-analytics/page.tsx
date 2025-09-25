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
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  Loader2,
  PieChart,
  LineChart,
  Activity,
  Target,
  Zap,
  Eye,
  FileText,
  Database,
  Bell,
  Info,
  ArrowUp,
  ArrowDown,
  Minus,
  TestTube
} from 'lucide-react'
import { motion } from 'framer-motion'
import { PaymentAnalyticsDashboard } from '@/components/payment/payment-analytics-dashboard'
import { usePaymentAnalytics, PaymentAnalyticsFilters, AnalyticsPeriod, ReportType } from '@/hooks/use-payment-analytics'

export default function TestPaymentAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('component')
  const [analytics, setAnalytics] = useState<any>(null)
  const [dashboard, setDashboard] = useState<any>(null)
  const [trends, setTrends] = useState<any>(null)
  const [forecast, setForecast] = useState<any>(null)
  const [report, setReport] = useState<any>(null)

  const { 
    getPaymentAnalytics,
    generateFinancialReport,
    generatePaymentForecast,
    getPaymentTrends,
    getRealTimeDashboard,
    loading, 
    error 
  } = usePaymentAnalytics()

  const handleFetchAnalytics = async () => {
    try {
      const filters: PaymentAnalyticsFilters = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date()
      }
      const result = await getPaymentAnalytics(filters)
      setAnalytics(result)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
    }
  }

  const handleFetchDashboard = async () => {
    try {
      const result = await getRealTimeDashboard()
      setDashboard(result)
    } catch (err) {
      console.error('Failed to fetch dashboard:', err)
    }
  }

  const handleFetchTrends = async () => {
    try {
      const result = await getPaymentTrends('LAST_30_DAYS')
      setTrends(result)
    } catch (err) {
      console.error('Failed to fetch trends:', err)
    }
  }

  const handleGenerateForecast = async () => {
    try {
      const result = await generatePaymentForecast({
        start: new Date(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
      }, 12)
      setForecast(result)
    } catch (err) {
      console.error('Failed to generate forecast:', err)
    }
  }

  const handleGenerateReport = async () => {
    try {
      const result = await generateFinancialReport('MONTHLY', {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      }, 'test-user')
      setReport(result)
    } catch (err) {
      console.error('Failed to generate report:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'PROCESSING': { color: 'bg-blue-100 text-blue-800', icon: Activity },
      'COMPLETED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'FAILED': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      'REFUNDED': { color: 'bg-orange-100 text-orange-800', icon: RefreshCw }
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

  const getMethodBadge = (method: string) => {
    const methodConfig = {
      'CASH': { color: 'bg-green-100 text-green-800', icon: DollarSign },
      'CARD': { color: 'bg-blue-100 text-blue-800', icon: CreditCard },
      'BANK_TRANSFER': { color: 'bg-purple-100 text-purple-800', icon: Database },
      'CHECK': { color: 'bg-gray-100 text-gray-800', icon: FileText },
      'OTHER': { color: 'bg-gray-100 text-gray-800', icon: Info }
    }
    
    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.OTHER
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {method.replace('_', ' ')}
      </Badge>
    )
  }

  const getAlertBadge = (severity: string) => {
    const severityConfig = {
      'LOW': { color: 'bg-blue-100 text-blue-800', icon: Info },
      'MEDIUM': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      'HIGH': { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      'CRITICAL': { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    }
    
    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.LOW
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {severity}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'INCREASING':
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case 'DECREASING':
        return <ArrowDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payment Analytics & Financial Reporting Test</h1>
          <p className="text-muted-foreground">
            Test the comprehensive payment analytics and financial reporting system
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="component">Component Test</TabsTrigger>
            <TabsTrigger value="api">API Test</TabsTrigger>
          </TabsList>

          {/* Component Test Tab */}
          <TabsContent value="component" className="space-y-6">
            <PaymentAnalyticsDashboard
              showRealTimeDashboard={true}
              showAnalytics={true}
              showReports={true}
              showForecasts={true}
              showTrends={true}
            />
          </TabsContent>

          {/* API Test Tab */}
          <TabsContent value="api" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Real-time Dashboard */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Real-time Dashboard API
                  </CardTitle>
                  <CardDescription>
                    Test real-time payment dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleFetchDashboard} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading Dashboard...
                      </>
                    ) : (
                      <>
                        <Activity className="mr-2 h-4 w-4" />
                        Fetch Dashboard
                      </>
                    )}
                  </Button>

                  <Separator />

                  {dashboard && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{dashboard.today.payments}</div>
                          <div className="text-sm text-muted-foreground">Today's Payments</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(dashboard.today.revenue)}
                          </div>
                          <div className="text-sm text-muted-foreground">Today's Revenue</div>
                        </div>
                      </div>
                      
                      {dashboard.alerts.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold">Alerts ({dashboard.alerts.length})</h4>
                          {dashboard.alerts.map((alert: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                {getAlertBadge(alert.severity)}
                                <span className="text-sm">{alert.message}</span>
                              </div>
                              <Badge variant="outline">{alert.type.replace('_', ' ')}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Payment Analytics API
                  </CardTitle>
                  <CardDescription>
                    Test payment analytics and insights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleFetchAnalytics} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading Analytics...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Fetch Analytics
                      </>
                    )}
                  </Button>

                  <Separator />

                  {analytics && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{analytics.totalPayments}</div>
                          <div className="text-sm text-muted-foreground">Total Payments</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(analytics.totalAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Amount</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Status Breakdown</h4>
                        {Object.entries(analytics.statusBreakdown).slice(0, 3).map(([status, count]: [string, any]) => (
                          <div key={status} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(status)}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{count}</div>
                              <div className="text-sm text-muted-foreground">payments</div>
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
                    <TrendingUp className="h-5 w-5" />
                    Payment Trends API
                  </CardTitle>
                  <CardDescription>
                    Test payment trends analysis
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
                        Fetch Trends
                      </>
                    )}
                  </Button>

                  <Separator />

                  {trends && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{trends.current.totalPayments}</div>
                          <div className="text-sm text-muted-foreground">Current Payments</div>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            {getTrendIcon(trends.comparison.paymentCountChange >= 0 ? 'INCREASING' : 'DECREASING')}
                            <span className={`text-sm ${trends.comparison.paymentCountChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(Math.abs(trends.comparison.paymentCountChange))}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(trends.current.totalAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Current Revenue</div>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            {getTrendIcon(trends.comparison.revenueChange >= 0 ? 'INCREASING' : 'DECREASING')}
                            <span className={`text-sm ${trends.comparison.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(Math.abs(trends.comparison.revenueChange))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Forecast */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Payment Forecast API
                  </CardTitle>
                  <CardDescription>
                    Test payment forecasting
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleGenerateForecast} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Forecast...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Generate Forecast
                      </>
                    )}
                  </Button>

                  <Separator />

                  {forecast && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(forecast.forecastedRevenue)}
                          </div>
                          <div className="text-sm text-muted-foreground">Forecasted Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{forecast.forecastedPayments}</div>
                          <div className="text-sm text-muted-foreground">Forecasted Payments</div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">
                          {formatPercentage(forecast.confidenceLevel)}
                        </div>
                        <div className="text-sm text-muted-foreground">Confidence Level</div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Scenarios</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 border rounded">
                            <div className="font-semibold text-green-600">
                              {formatCurrency(forecast.scenarios.optimistic)}
                            </div>
                            <div className="text-xs text-muted-foreground">Optimistic</div>
                          </div>
                          <div className="text-center p-2 border rounded">
                            <div className="font-semibold text-blue-600">
                              {formatCurrency(forecast.scenarios.realistic)}
                            </div>
                            <div className="text-xs text-muted-foreground">Realistic</div>
                          </div>
                          <div className="text-center p-2 border rounded">
                            <div className="font-semibold text-red-600">
                              {formatCurrency(forecast.scenarios.pessimistic)}
                            </div>
                            <div className="text-xs text-muted-foreground">Pessimistic</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Report */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Financial Report API
                  </CardTitle>
                  <CardDescription>
                    Test financial report generation
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
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Report
                      </>
                    )}
                  </Button>

                  <Separator />

                  {report && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(report.summary.totalRevenue)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{report.summary.totalPayments}</div>
                          <div className="text-sm text-muted-foreground">Total Payments</div>
                        </div>
                      </div>
                      
                      {report.insights.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold">Insights ({report.insights.length})</h4>
                          {report.insights.slice(0, 2).map((insight: string, index: number) => (
                            <div key={index} className="flex items-start gap-2 p-2 border rounded">
                              <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                              <span className="text-sm">{insight}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {report.recommendations.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold">Recommendations ({report.recommendations.length})</h4>
                          {report.recommendations.slice(0, 2).map((recommendation: string, index: number) => (
                            <div key={index} className="flex items-start gap-2 p-2 border rounded">
                              <Target className="h-4 w-4 text-green-500 mt-0.5" />
                              <span className="text-sm">{recommendation}</span>
                            </div>
                          ))}
                        </div>
                      )}
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
                    Available payment analytics API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/payments/analytics</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/payments/dashboard</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/payments/trends</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm">/api/payments/forecast</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm">/api/payments/reports</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/payments/reports</code>
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
