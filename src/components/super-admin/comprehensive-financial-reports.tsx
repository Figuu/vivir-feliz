'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface RevenueReport {
  summary: {
    totalRevenue: number
    paidRevenue: number
    pendingRevenue: number
    overdueRevenue: number
    paymentCount: number
    collectionRate: string
  }
}

interface PaymentsReport {
  byStatus: Array<{
    status: string
    count: number
    total: number
  }>
  byMethod: Array<{
    method: string | null
    count: number
    total: number
  }>
  averagePayment: number
  recentPayments: Array<any>
}

interface ServicesReport {
  byService: Array<{
    serviceId: string
    serviceName: string
    sessionCount: number
    totalRevenue: number
    averageRevenue: number
  }>
  totalSessions: number
  totalRevenue: number
}

interface TherapistsReport {
  byTherapist: Array<{
    therapistId: string
    therapistName: string
    totalSessions: number
    completedSessions: number
    totalRevenue: number
    completionRate: string
  }>
  totalSessions: number
  totalRevenue: number
}

export function ComprehensiveFinancialReports() {
  const [loading, setLoading] = useState(false)
  const [reportType, setReportType] = useState<'revenue' | 'payments' | 'services' | 'therapists'>('revenue')
  const [revenueData, setRevenueData] = useState<RevenueReport | null>(null)
  const [paymentsData, setPaymentsData] = useState<PaymentsReport | null>(null)
  const [servicesData, setServicesData] = useState<ServicesReport | null>(null)
  const [therapistsData, setTherapistsData] = useState<TherapistsReport | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month')
  const [activeTab, setActiveTab] = useState('revenue')

  useEffect(() => {
    loadReport()
  }, [reportType, dateRange, groupBy])

  const loadReport = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        reportType,
        groupBy
      })
      
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`/api/super-admin/financial-reports?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load report')
      }

      const result = await response.json()
      
      switch (reportType) {
        case 'revenue':
          setRevenueData(result.data)
          break
        case 'payments':
          setPaymentsData(result.data)
          break
        case 'services':
          setServicesData(result.data)
          break
        case 'therapists':
          setTherapistsData(result.data)
          break
      }
    } catch (err) {
      console.error('Error loading report:', err)
      toast.error('Failed to load financial report')
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams({
        reportType,
        groupBy,
        format: 'csv'
      })
      
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`/api/super-admin/financial-reports?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to export report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `financial-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Report exported successfully')
    } catch (err) {
      console.error('Error exporting report:', err)
      toast.error('Failed to export report')
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
              <FileText className="h-5 w-5 mr-2" />
              Comprehensive Financial Reports
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadReport}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportCSV}
                disabled={loading}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
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
              <Label htmlFor="reportType">Report Type</Label>
              <select
                id="reportType"
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value as any)
                  setActiveTab(e.target.value)
                }}
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="revenue">Revenue Summary</option>
                <option value="payments">Payments Analysis</option>
                <option value="services">Services Performance</option>
                <option value="therapists">Therapists Performance</option>
              </select>
            </div>
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
          </div>
        </CardContent>
      </Card>

      {/* Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue" onClick={() => setReportType('revenue')}>
            <DollarSign className="h-4 w-4 mr-2" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="payments" onClick={() => setReportType('payments')}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="services" onClick={() => setReportType('services')}>
            <Activity className="h-4 w-4 mr-2" />
            Services
          </TabsTrigger>
          <TabsTrigger value="therapists" onClick={() => setReportType('therapists')}>
            <Users className="h-4 w-4 mr-2" />
            Therapists
          </TabsTrigger>
        </TabsList>

        {/* Revenue Report */}
        <TabsContent value="revenue" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading report...</p>
              </CardContent>
            </Card>
          ) : revenueData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(revenueData.summary.totalRevenue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{revenueData.summary.paymentCount} payments</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Collected</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(revenueData.summary.paidRevenue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{revenueData.summary.collectionRate}% rate</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{formatCurrency(revenueData.summary.pendingRevenue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Overdue</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(revenueData.summary.overdueRevenue)}</p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No revenue data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payments Report */}
        <TabsContent value="payments" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading report...</p>
              </CardContent>
            </Card>
          ) : paymentsData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {paymentsData.byStatus.map((status, index) => (
                        <div key={status.status} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(status.status)}>{status.status}</Badge>
                            <span className="text-sm text-muted-foreground">{status.count}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(status.total)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">By Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {paymentsData.byMethod.map((method, index) => (
                        <div key={method.method || 'unknown'} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm capitalize">{method.method || 'Not specified'}</span>
                            <span className="text-xs text-muted-foreground">({method.count})</span>
                          </div>
                          <span className="font-medium">{formatCurrency(method.total)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {paymentsData.recentPayments.slice(0, 10).map((payment, index) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{payment.patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(payment.amount)}</p>
                          <Badge className={getStatusColor(payment.status)} variant="outline">
                            {payment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Services Report */}
        <TabsContent value="services" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading report...</p>
              </CardContent>
            </Card>
          ) : servicesData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
                    <p className="text-3xl font-bold">{servicesData.totalSessions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(servicesData.totalRevenue)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue by Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {servicesData.byService.map((service, index) => (
                      <motion.div
                        key={service.serviceId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{service.serviceName}</p>
                          <Badge variant="outline">{service.sessionCount} sessions</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Revenue</span>
                          <span className="font-bold text-green-600">{formatCurrency(service.totalRevenue)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Average per Session</span>
                          <span className="font-medium">{formatCurrency(service.averageRevenue)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Therapists Report */}
        <TabsContent value="therapists" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading report...</p>
              </CardContent>
            </Card>
          ) : therapistsData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Total Sessions</p>
                    <p className="text-3xl font-bold">{therapistsData.totalSessions}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(therapistsData.totalRevenue)}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance by Therapist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {therapistsData.byTherapist.map((therapist, index) => (
                      <motion.div
                        key={therapist.therapistId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{therapist.therapistName}</p>
                          <Badge variant="outline">{therapist.completionRate}% completion</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Sessions</p>
                            <p className="font-medium">{therapist.totalSessions}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Completed</p>
                            <p className="font-medium text-green-600">{therapist.completedSessions}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Revenue</p>
                            <p className="font-medium text-green-600">{formatCurrency(therapist.totalRevenue)}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
