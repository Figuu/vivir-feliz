'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  BarChart3,
  Activity,
  CreditCard,
  Zap
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface AnalyticsData {
  overview: {
    totalCount: number
    totalAmount: number
    averageAmount: number
    paidCount: number
    paidAmount: number
    pendingCount: number
    pendingAmount: number
    overdueCount: number
    overdueAmount: number
    failedCount: number
    failedAmount: number
    collectionRate: string
    onTimePaymentRate: string
  }
  velocity: {
    averageProcessingDays: string
    fastestPayments: number
    slowPayments: number
  }
  distribution: {
    byMethod: Array<{
      method: string
      count: number
      amount: number
      percentage: string
    }>
    byStatus: Array<{
      status: string
      count: number
      amount: number
      percentage: string
    }>
  }
  topPayments: Array<{
    id: string
    amount: number
    patientName: string
    status: string
    method: string | null
    createdAt: string
  }>
  recentActivity: Array<any>
}

export function PaymentAnalyticsTracker() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange, groupBy])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({ groupBy })
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`/api/super-admin/payment-analytics?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error('Error loading analytics:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to load payment analytics'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!data) return

    const csv = [
      ['Payment Analytics Report'],
      ['Generated', new Date().toLocaleString()],
      ['Date Range', `${dateRange.startDate || 'All'} to ${dateRange.endDate || 'All'}`],
      [],
      ['OVERVIEW'],
      ['Metric', 'Value'],
      ['Total Payments', data.overview.totalCount.toString()],
      ['Total Amount', `$${data.overview.totalAmount.toFixed(2)}`],
      ['Average Payment', `$${data.overview.averageAmount.toFixed(2)}`],
      ['Collection Rate', `${data.overview.collectionRate}%`],
      ['On-Time Rate', `${data.overview.onTimePaymentRate}%`],
      [],
      ['BY STATUS'],
      ['Status', 'Count', 'Amount', 'Percentage'],
      ...data.distribution.byStatus.map(s => [s.status, s.count.toString(), `$${s.amount.toFixed(2)}`, `${s.percentage}%`]),
      [],
      ['BY METHOD'],
      ['Method', 'Count', 'Amount', 'Percentage'],
      ...data.distribution.byMethod.map(m => [m.method, m.count.toString(), `$${m.amount.toFixed(2)}`, `${m.percentage}%`])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payment-analytics-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast({
        title: "Success",
        description: 'Analytics exported successfully'
      })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Payment Analytics & Tracking
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadAnalytics}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport}
                disabled={!data || loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupBy">Group By</Label>
              <select
                id="groupBy"
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadAnalytics} disabled={loading} className="w-full">
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics...</p>
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground">Select a date range to view analytics</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="velocity">Velocity</TabsTrigger>
            <TabsTrigger value="top">Top Payments</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Total Payments</p>
                      <DollarSign className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold">{data.overview.totalCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(data.overview.totalAmount)}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Paid</p>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">{data.overview.paidCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(data.overview.paidAmount)}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-600">{data.overview.pendingCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(data.overview.pendingAmount)}</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Overdue</p>
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-red-600">{data.overview.overdueCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(data.overview.overdueAmount)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Collection Rate</p>
                      <p className="text-3xl font-bold">{data.overview.collectionRate}%</p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-green-500" />
                  </div>
                  {parseFloat(data.overview.collectionRate) >= 80 ? (
                    <p className="text-xs text-green-600 mt-2">✓ Excellent collection rate</p>
                  ) : (
                    <p className="text-xs text-yellow-600 mt-2">⚠ Collection rate needs improvement</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">On-Time Rate</p>
                      <p className="text-3xl font-bold">{data.overview.onTimePaymentRate}%</p>
                    </div>
                    <CheckCircle className="h-10 w-10 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Payments made by due date
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Average Payment</p>
                      <p className="text-3xl font-bold">{formatCurrency(data.overview.averageAmount)}</p>
                    </div>
                    <DollarSign className="h-10 w-10 text-purple-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Per transaction
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <Activity className="h-5 w-5 mr-2" />
                    By Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.distribution.byStatus.map((status, index) => (
                      <motion.div
                        key={status.status}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(status.status)}>{status.status}</Badge>
                            <span className="text-sm text-muted-foreground">{status.count}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(status.amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              status.status === 'paid' ? 'bg-green-500' :
                              status.status === 'pending' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${status.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">{status.percentage}%</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base">
                    <CreditCard className="h-5 w-5 mr-2" />
                    By Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.distribution.byMethod.map((method, index) => (
                      <motion.div
                        key={method.method}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{method.method}</span>
                            <span className="text-sm text-muted-foreground">({method.count})</span>
                          </div>
                          <span className="font-medium">{formatCurrency(method.amount)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${method.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">{method.percentage}%</p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Velocity Tab */}
          <TabsContent value="velocity" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Avg Processing Time</p>
                    <Clock className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold">{data.velocity.averageProcessingDays}</p>
                  <p className="text-xs text-muted-foreground mt-1">days</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Fast Payments</p>
                    <Zap className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold text-green-600">{data.velocity.fastestPayments}</p>
                  <p className="text-xs text-muted-foreground mt-1">≤ 1 day</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Slow Payments</p>
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-3xl font-bold text-red-600">{data.velocity.slowPayments}</p>
                  <p className="text-xs text-muted-foreground mt-1">&gt; 30 days</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Velocity Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {parseFloat(data.velocity.averageProcessingDays) <= 7 && (
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      <span>Excellent payment processing speed - average under 1 week</span>
                    </li>
                  )}
                  {data.velocity.fastestPayments > data.overview.paidCount * 0.5 && (
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      <span>Over 50% of payments processed within 1 day</span>
                    </li>
                  )}
                  {data.velocity.slowPayments > data.overview.paidCount * 0.2 && (
                    <li className="flex items-start">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5" />
                      <span>More than 20% of payments take over 30 days - consider follow-up procedures</span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Payments Tab */}
          <TabsContent value="top" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Largest Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.topPayments.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{payment.patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString()}
                            {payment.method && ` • ${payment.method}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-green-600">{formatCurrency(payment.amount)}</p>
                        <Badge className={getStatusColor(payment.status)} variant="outline">
                          {payment.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
