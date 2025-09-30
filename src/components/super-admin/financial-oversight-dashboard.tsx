'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Download,
  RefreshCw,
  BarChart3,
  PieChart
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface FinancialOversightDashboardProps {
  superAdminId?: string
}

interface FinancialData {
  overview: {
    totalRevenue: number
    totalPaid: number
    totalPending: number
    totalOverdue: number
    collectionRate: string
    outstandingBalance: number
  }
  paymentStatus: {
    byStatus: Array<{
      status: string
      count: number
      amount: number
    }>
    distribution: {
      paid: number
      pending: number
      overdue: number
    }
  }
  revenueByService: Array<{
    serviceId: string | null
    serviceName: string
    sessionCount: number
    totalRevenue: number
  }>
  paymentPlans: {
    totalPlans: number
    totalAmount: number
    paidAmount: number
    remainingAmount: number
    completionRate: string
  }
  recentPayments: Array<{
    id: string
    amount: number
    status: string
    patientName: string
    dueDate: string
    paidDate: string | null
    createdAt: string
  }>
  topPatients: Array<{
    patientId: string
    patientName: string
    patientEmail: string | null
    totalPaid: number
    paymentCount: number
  }>
}

export function FinancialOversightDashboard({ superAdminId }: FinancialOversightDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FinancialData | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadFinancialData()
  }, [dateRange, groupBy])

  const loadFinancialData = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)
      params.append('groupBy', groupBy)

      const response = await fetch(`/api/super-admin/financial-oversight?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load financial data')
      }

      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error('Error loading financial data:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to load financial oversight data'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!data) return

    try {
      const report = `
FINANCIAL OVERSIGHT REPORT
Generated: ${new Date().toLocaleString()}
Date Range: ${dateRange.startDate || 'All'} to ${dateRange.endDate || 'All'}

=== REVENUE OVERVIEW ===
Total Revenue: $${data.overview.totalRevenue.toFixed(2)}
Total Paid: $${data.overview.totalPaid.toFixed(2)}
Total Pending: $${data.overview.totalPending.toFixed(2)}
Total Overdue: $${data.overview.totalOverdue.toFixed(2)}
Outstanding Balance: $${data.overview.outstandingBalance.toFixed(2)}
Collection Rate: ${data.overview.collectionRate}%

=== PAYMENT STATUS ===
${data.paymentStatus.byStatus.map(ps => 
  `${ps.status.toUpperCase()}: ${ps.count} payments, $${ps.amount.toFixed(2)}`
).join('\n')}

=== REVENUE BY SERVICE ===
${data.revenueByService.map(rbs => 
  `${rbs.serviceName}: ${rbs.sessionCount} sessions, $${rbs.totalRevenue.toFixed(2)}`
).join('\n')}

=== PAYMENT PLANS ===
Total Plans: ${data.paymentPlans.totalPlans}
Total Amount: $${data.paymentPlans.totalAmount.toFixed(2)}
Paid Amount: $${data.paymentPlans.paidAmount.toFixed(2)}
Remaining: $${data.paymentPlans.remainingAmount.toFixed(2)}
Completion Rate: ${data.paymentPlans.completionRate}%

=== TOP PATIENTS ===
${data.topPatients.map((tp, idx) => 
  `${idx + 1}. ${tp.patientName}: $${tp.totalPaid.toFixed(2)} (${tp.paymentCount} payments)`
).join('\n')}
      `.trim()

      const blob = new Blob([report], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `financial-oversight-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: 'Report exported successfully'
      })
    } catch (err) {
      console.error('Error exporting report:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to export report'
      })
    }
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
              <DollarSign className="h-5 w-5 mr-2" />
              Financial Oversight & Analytics
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadFinancialData}
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
              <Button onClick={loadFinancialData} disabled={loading} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading financial data...</p>
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground">Select a date range to view financial data</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">By Service</TabsTrigger>
            <TabsTrigger value="patients">Top Patients</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <DollarSign className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold">{formatCurrency(data.overview.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All generated revenue
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Collected</p>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(data.overview.totalPaid)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.overview.collectionRate}% collection rate
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-600">{formatCurrency(data.overview.totalPending)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pending collection
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Overdue</p>
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-red-600">{formatCurrency(data.overview.totalOverdue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requires attention
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Payment Plans</p>
                      <FileText className="h-8 w-8 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold">{data.paymentPlans.totalPlans}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.paymentPlans.completionRate}% completion rate
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Collection Rate</p>
                      {parseFloat(data.overview.collectionRate) >= 80 ? (
                        <TrendingUp className="h-8 w-8 text-green-500" />
                      ) : (
                        <TrendingDown className="h-8 w-8 text-red-500" />
                      )}
                    </div>
                    <p className="text-3xl font-bold">{data.overview.collectionRate}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {parseFloat(data.overview.collectionRate) >= 80 ? 'Excellent' : 'Needs improvement'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Payment Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <PieChart className="h-5 w-5 mr-2" />
                  Payment Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-600">Paid</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(data.paymentStatus.distribution.paid)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all"
                        style={{ 
                          width: `${(data.paymentStatus.distribution.paid / data.overview.totalRevenue) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-yellow-600">Pending</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(data.paymentStatus.distribution.pending)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-yellow-500 h-3 rounded-full transition-all"
                        style={{ 
                          width: `${(data.paymentStatus.distribution.pending / data.overview.totalRevenue) * 100}%` 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-600">Overdue</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(data.paymentStatus.distribution.overdue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-red-500 h-3 rounded-full transition-all"
                        style={{ 
                          width: `${(data.paymentStatus.distribution.overdue / data.overview.totalRevenue) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Revenue by Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.revenueByService.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No service revenue data available
                  </p>
                ) : (
                  <div className="space-y-4">
                    {data.revenueByService.map((service, index) => (
                      <motion.div
                        key={service.serviceId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-4"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">{service.serviceName}</p>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(service.totalRevenue)} ({service.sessionCount} sessions)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ 
                                width: `${(service.totalRevenue / data.revenueByService[0].totalRevenue) * 100}%` 
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Patients Tab */}
          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Users className="h-5 w-5 mr-2" />
                  Top Paying Patients
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.topPatients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No patient payment data available
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.topPatients.map((patient, index) => (
                      <motion.div
                        key={patient.patientId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{patient.patientName}</p>
                            {patient.patientEmail && (
                              <p className="text-xs text-muted-foreground">{patient.patientEmail}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(patient.totalPaid)}</p>
                          <p className="text-xs text-muted-foreground">{patient.paymentCount} payments</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent payment activity
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.recentPayments.map((payment, index) => (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium">{payment.patientName}</p>
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(payment.dueDate).toLocaleDateString()}
                            {payment.paidDate && ` • Paid: ${new Date(payment.paidDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
