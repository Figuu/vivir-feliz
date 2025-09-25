'use client'

import { useState, useEffect } from 'react'
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
  Minus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePaymentAnalytics, PaymentAnalyticsFilters, AnalyticsPeriod, ReportType } from '@/hooks/use-payment-analytics'

interface PaymentAnalyticsDashboardProps {
  showRealTimeDashboard?: boolean
  showAnalytics?: boolean
  showReports?: boolean
  showForecasts?: boolean
  showTrends?: boolean
}

export function PaymentAnalyticsDashboard({
  showRealTimeDashboard = true,
  showAnalytics = true,
  showReports = true,
  showForecasts = true,
  showTrends = true
}: PaymentAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [analytics, setAnalytics] = useState<any>(null)
  const [dashboard, setDashboard] = useState<any>(null)
  const [trends, setTrends] = useState<any>(null)
  const [forecast, setForecast] = useState<any>(null)
  const [report, setReport] = useState<any>(null)
  
  const [filters, setFilters] = useState<PaymentAnalyticsFilters>({})
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>('LAST_30_DAYS')
  const [customPeriod, setCustomPeriod] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  })

  const { 
    getPaymentAnalytics,
    generateFinancialReport,
    generatePaymentForecast,
    getPaymentTrends,
    getRealTimeDashboard,
    loading, 
    error 
  } = usePaymentAnalytics()

  // Load real-time dashboard
  const loadDashboard = async () => {
    try {
      const result = await getRealTimeDashboard()
      setDashboard(result)
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    }
  }

  // Load analytics
  const loadAnalytics = async () => {
    try {
      const result = await getPaymentAnalytics(filters)
      setAnalytics(result)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    }
  }

  // Load trends
  const loadTrends = async () => {
    try {
      const result = await getPaymentTrends(selectedPeriod, selectedPeriod === 'CUSTOM' ? customPeriod : undefined)
      setTrends(result)
    } catch (err) {
      console.error('Failed to load trends:', err)
    }
  }

  // Generate forecast
  const handleGenerateForecast = async () => {
    try {
      const result = await generatePaymentForecast(customPeriod, 12)
      setForecast(result)
    } catch (err) {
      console.error('Failed to generate forecast:', err)
    }
  }

  // Generate report
  const handleGenerateReport = async () => {
    try {
      const result = await generateFinancialReport('MONTHLY', customPeriod, 'user')
      setReport(result)
    } catch (err) {
      console.error('Failed to generate report:', err)
    }
  }

  useEffect(() => {
    if (showRealTimeDashboard) {
      loadDashboard()
    }
  }, [showRealTimeDashboard])

  useEffect(() => {
    if (showAnalytics) {
      loadAnalytics()
    }
  }, [filters, showAnalytics])

  useEffect(() => {
    if (showTrends) {
      loadTrends()
    }
  }, [selectedPeriod, customPeriod, showTrends])

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
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="forecasts">Forecasts</TabsTrigger>
        </TabsList>

        {/* Real-time Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Payment Dashboard
              </CardTitle>
              <CardDescription>
                Live payment metrics and alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={loadDashboard} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Dashboard...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Dashboard
                  </>
                )}
              </Button>

              <Separator />

              {dashboard && (
                <div className="space-y-6">
                  {/* Today's Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Today's Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{dashboard.today.payments}</div>
                          <div className="text-sm text-muted-foreground">Payments</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(dashboard.today.revenue)}
                          </div>
                          <div className="text-sm text-muted-foreground">Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{dashboard.today.pending}</div>
                          <div className="text-sm text-muted-foreground">Pending</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{dashboard.today.completed}</div>
                          <div className="text-sm text-muted-foreground">Completed</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Weekly and Monthly Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">This Week</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Payments:</span>
                            <span className="font-semibold">{dashboard.thisWeek.payments}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Revenue:</span>
                            <span className="font-semibold">{formatCurrency(dashboard.thisWeek.revenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Growth:</span>
                            <span className={`font-semibold ${dashboard.thisWeek.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(dashboard.thisWeek.growth)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">This Month</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Payments:</span>
                            <span className="font-semibold">{dashboard.thisMonth.payments}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Revenue:</span>
                            <span className="font-semibold">{formatCurrency(dashboard.thisMonth.revenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Growth:</span>
                            <span className={`font-semibold ${dashboard.thisMonth.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(dashboard.thisMonth.growth)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Alerts */}
                  {dashboard.alerts.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Alerts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {dashboard.alerts.map((alert: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                {getAlertBadge(alert.severity)}
                                <span>{alert.message}</span>
                              </div>
                              <Badge variant="outline">{alert.type.replace('_', ' ')}</Badge>
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

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Payment Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive payment analysis and insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      startDate: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      endDate: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="minAmount">Min Amount</Label>
                  <Input
                    id="minAmount"
                    type="number"
                    value={filters.minAmount || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      minAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="maxAmount">Max Amount</Label>
                  <Input
                    id="maxAmount"
                    type="number"
                    value={filters.maxAmount || ''}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      maxAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                  />
                </div>
              </div>

              <Button onClick={loadAnalytics} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Analytics...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Load Analytics
                  </>
                )}
              </Button>

              <Separator />

              {analytics && (
                <div className="space-y-6">
                  {/* Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(analytics.averageAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Average Amount</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(analytics.medianAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Median Amount</div>
                        </div>
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
                        {Object.entries(analytics.statusBreakdown).map(([status, count]: [string, any]) => (
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
                    </CardContent>
                  </Card>

                  {/* Method Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Method Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(analytics.methodBreakdown).map(([method, count]: [string, any]) => (
                          <div key={method} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getMethodBadge(method)}
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

                  {/* Top Therapists */}
                  {analytics.topTherapists.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Top Performing Therapists</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {analytics.topTherapists.slice(0, 5).map((therapist: any, index: number) => (
                            <div key={therapist.therapistId} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">#{index + 1}</span>
                                <span>{therapist.therapistName}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{formatCurrency(therapist.totalAmount)}</div>
                                <div className="text-sm text-muted-foreground">{therapist.paymentCount} payments</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Revenue Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Revenue Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(analytics.revenueMetrics.grossRevenue)}
                          </div>
                          <div className="text-sm text-muted-foreground">Gross Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-600">
                            {formatCurrency(analytics.revenueMetrics.netRevenue)}
                          </div>
                          <div className="text-sm text-muted-foreground">Net Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-600">
                            {formatPercentage(analytics.revenueMetrics.revenueGrowth)}
                          </div>
                          <div className="text-sm text-muted-foreground">Growth Rate</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Payment Trends
              </CardTitle>
              <CardDescription>
                Analyze payment trends and comparisons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period">Period</Label>
                  <Select value={selectedPeriod} onValueChange={(value: AnalyticsPeriod) => setSelectedPeriod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODAY">Today</SelectItem>
                      <SelectItem value="YESTERDAY">Yesterday</SelectItem>
                      <SelectItem value="LAST_7_DAYS">Last 7 Days</SelectItem>
                      <SelectItem value="LAST_30_DAYS">Last 30 Days</SelectItem>
                      <SelectItem value="LAST_90_DAYS">Last 90 Days</SelectItem>
                      <SelectItem value="THIS_MONTH">This Month</SelectItem>
                      <SelectItem value="LAST_MONTH">Last Month</SelectItem>
                      <SelectItem value="THIS_YEAR">This Year</SelectItem>
                      <SelectItem value="LAST_YEAR">Last Year</SelectItem>
                      <SelectItem value="CUSTOM">Custom Period</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedPeriod === 'CUSTOM' && (
                  <>
                    <div>
                      <Label htmlFor="customStart">Start Date</Label>
                      <Input
                        id="customStart"
                        type="date"
                        value={customPeriod.start.toISOString().split('T')[0]}
                        onChange={(e) => setCustomPeriod(prev => ({ 
                          ...prev, 
                          start: new Date(e.target.value) 
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customEnd">End Date</Label>
                      <Input
                        id="customEnd"
                        type="date"
                        value={customPeriod.end.toISOString().split('T')[0]}
                        onChange={(e) => setCustomPeriod(prev => ({ 
                          ...prev, 
                          end: new Date(e.target.value) 
                        }))}
                      />
                    </div>
                  </>
                )}
              </div>

              <Button onClick={loadTrends} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Trends...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Load Trends
                  </>
                )}
              </Button>

              <Separator />

              {trends && (
                <div className="space-y-6">
                  {/* Comparison */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Period Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(trends.current.averageAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Average Payment</div>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            {getTrendIcon(trends.comparison.averagePaymentChange >= 0 ? 'INCREASING' : 'DECREASING')}
                            <span className={`text-sm ${trends.comparison.averagePaymentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatPercentage(Math.abs(trends.comparison.averagePaymentChange))}
                            </span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {formatPercentage(trends.comparison.growthRate)}
                          </div>
                          <div className="text-sm text-muted-foreground">Growth Rate</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Financial Reports
              </CardTitle>
              <CardDescription>
                Generate comprehensive financial reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportStart">Start Date</Label>
                  <Input
                    id="reportStart"
                    type="date"
                    value={customPeriod.start.toISOString().split('T')[0]}
                    onChange={(e) => setCustomPeriod(prev => ({ 
                      ...prev, 
                      start: new Date(e.target.value) 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="reportEnd">End Date</Label>
                  <Input
                    id="reportEnd"
                    type="date"
                    value={customPeriod.end.toISOString().split('T')[0]}
                    onChange={(e) => setCustomPeriod(prev => ({ 
                      ...prev, 
                      end: new Date(e.target.value) 
                    }))}
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
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Monthly Report
                  </>
                )}
              </Button>

              <Separator />

              {report && (
                <div className="space-y-6">
                  {/* Report Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Report Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(report.summary.averagePayment)}
                          </div>
                          <div className="text-sm text-muted-foreground">Average Payment</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Insights */}
                  {report.insights.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Insights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {report.insights.map((insight: string, index: number) => (
                            <div key={index} className="flex items-start gap-2 p-2 border rounded">
                              <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                              <span className="text-sm">{insight}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations */}
                  {report.recommendations.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {report.recommendations.map((recommendation: string, index: number) => (
                            <div key={index} className="flex items-start gap-2 p-2 border rounded">
                              <Target className="h-4 w-4 text-green-500 mt-0.5" />
                              <span className="text-sm">{recommendation}</span>
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

        {/* Forecasts Tab */}
        <TabsContent value="forecasts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Payment Forecasts
              </CardTitle>
              <CardDescription>
                Generate payment and revenue forecasts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="forecastStart">Start Date</Label>
                  <Input
                    id="forecastStart"
                    type="date"
                    value={customPeriod.start.toISOString().split('T')[0]}
                    onChange={(e) => setCustomPeriod(prev => ({ 
                      ...prev, 
                      start: new Date(e.target.value) 
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="forecastEnd">End Date</Label>
                  <Input
                    id="forecastEnd"
                    type="date"
                    value={customPeriod.end.toISOString().split('T')[0]}
                    onChange={(e) => setCustomPeriod(prev => ({ 
                      ...prev, 
                      end: new Date(e.target.value) 
                    }))}
                  />
                </div>
              </div>

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
                <div className="space-y-6">
                  {/* Forecast Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Forecast Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatPercentage(forecast.confidenceLevel)}
                          </div>
                          <div className="text-sm text-muted-foreground">Confidence Level</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scenarios */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Forecast Scenarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 border rounded">
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(forecast.scenarios.optimistic)}
                          </div>
                          <div className="text-sm text-muted-foreground">Optimistic</div>
                        </div>
                        <div className="text-center p-4 border rounded">
                          <div className="text-xl font-bold text-blue-600">
                            {formatCurrency(forecast.scenarios.realistic)}
                          </div>
                          <div className="text-sm text-muted-foreground">Realistic</div>
                        </div>
                        <div className="text-center p-4 border rounded">
                          <div className="text-xl font-bold text-red-600">
                            {formatCurrency(forecast.scenarios.pessimistic)}
                          </div>
                          <div className="text-sm text-muted-foreground">Pessimistic</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Factors */}
                  {forecast.factors.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Forecast Factors</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {forecast.factors.map((factor: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <div className="font-medium">{factor.factor}</div>
                                <div className="text-sm text-muted-foreground">{factor.description}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold">{formatPercentage(factor.impact)}</div>
                                <div className="text-sm text-muted-foreground">impact</div>
                              </div>
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
