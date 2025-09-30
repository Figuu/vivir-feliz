'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  AlertCircle,
  Users,
  FileText
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface ReschedulingAnalyticsDashboardProps {
  defaultStartDate?: string
  defaultEndDate?: string
}

interface AnalyticsData {
  totalRequests: number
  approved: number
  rejected: number
  pending: number
  approvalRate: number
  topReasons: Array<{
    reason: string
    count: number
  }>
}

export function ReschedulingAnalyticsDashboard({
  defaultStartDate,
  defaultEndDate
}: ReschedulingAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: defaultStartDate || '',
    endDate: defaultEndDate || ''
  })
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadAnalytics()
  }, [dateRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`/api/rescheduling-analytics?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }

      const result = await response.json()
      setAnalytics(result.data)
    } catch (err) {
      console.error('Error loading analytics:', err)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = () => {
    if (!analytics) return

    try {
      const report = `
Rescheduling Analytics Report
Generated: ${new Date().toLocaleString()}
Date Range: ${dateRange.startDate || 'All'} to ${dateRange.endDate || 'All'}

SUMMARY STATISTICS
==================
Total Requests: ${analytics.totalRequests}
Approved: ${analytics.approved} (${((analytics.approved / analytics.totalRequests) * 100).toFixed(1)}%)
Rejected: ${analytics.rejected} (${((analytics.rejected / analytics.totalRequests) * 100).toFixed(1)}%)
Pending: ${analytics.pending} (${((analytics.pending / analytics.totalRequests) * 100).toFixed(1)}%)
Approval Rate: ${analytics.approvalRate.toFixed(1)}%

TOP REASONS
===========
${analytics.topReasons.map((reason, idx) => 
  `${idx + 1}. ${reason.reason}: ${reason.count} (${((reason.count / analytics.totalRequests) * 100).toFixed(1)}%)`
).join('\n')}
      `.trim()

      const blob = new Blob([report], { type: 'text/plain' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rescheduling-analytics-${new Date().toISOString().split('T')[0]}.txt`
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

  const getRejectionRate = () => {
    if (!analytics || analytics.totalRequests === 0) return 0
    return ((analytics.rejected / analytics.totalRequests) * 100).toFixed(1)
  }

  const getPendingRate = () => {
    if (!analytics || analytics.totalRequests === 0) return 0
    return ((analytics.pending / analytics.totalRequests) * 100).toFixed(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Rescheduling Analytics & Reporting
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportReport}
              disabled={!analytics || loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
            <Button 
              onClick={loadAnalytics}
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? 'Loading...' : 'Refresh Analytics'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="reasons">Top Reasons</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading analytics...</p>
              </CardContent>
            </Card>
          ) : !analytics ? (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                <p className="text-muted-foreground">
                  Select a date range to view analytics
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Total Requests</p>
                        <FileText className="h-8 w-8 text-blue-500" />
                      </div>
                      <p className="text-3xl font-bold">{analytics.totalRequests}</p>
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
                        <p className="text-sm text-muted-foreground">Approved</p>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                      <p className="text-3xl font-bold">{analytics.approved}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analytics.approvalRate.toFixed(1)}% approval rate
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
                        <p className="text-sm text-muted-foreground">Rejected</p>
                        <XCircle className="h-8 w-8 text-red-500" />
                      </div>
                      <p className="text-3xl font-bold">{analytics.rejected}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getRejectionRate()}% rejection rate
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
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <Clock className="h-8 w-8 text-yellow-500" />
                      </div>
                      <p className="text-3xl font-bold">{analytics.pending}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getPendingRate()}% pending review
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Visual Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Request Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Approved</span>
                        <span className="text-sm text-muted-foreground">
                          {analytics.approved} ({analytics.approvalRate.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all"
                          style={{ width: `${analytics.approvalRate}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Rejected</span>
                        <span className="text-sm text-muted-foreground">
                          {analytics.rejected} ({getRejectionRate()}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-red-500 h-3 rounded-full transition-all"
                          style={{ width: `${getRejectionRate()}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Pending</span>
                        <span className="text-sm text-muted-foreground">
                          {analytics.pending} ({getPendingRate()}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-yellow-500 h-3 rounded-full transition-all"
                          style={{ width: `${getPendingRate()}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Approval Rate</h3>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold text-green-600">
                          {analytics.approvalRate.toFixed(1)}%
                        </span>
                        <span className="text-sm text-muted-foreground">
                          of requests approved
                        </span>
                      </div>
                      {analytics.approvalRate >= 70 ? (
                        <p className="text-sm text-green-600 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Good approval rate
                        </p>
                      ) : (
                        <p className="text-sm text-yellow-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Consider reviewing policies
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm">Request Volume</h3>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-4xl font-bold">{analytics.totalRequests}</span>
                        <span className="text-sm text-muted-foreground">
                          total requests
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {analytics.pending} awaiting review
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-sm mb-3">Insights</h3>
                    <ul className="space-y-2">
                      {analytics.approvalRate > 80 && (
                        <li className="text-sm flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>High approval rate indicates good parent-coordinator alignment</span>
                        </li>
                      )}
                      {analytics.pending > analytics.approved && (
                        <li className="text-sm flex items-start">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>More pending requests than approved - consider increasing review capacity</span>
                        </li>
                      )}
                      {analytics.rejected > analytics.approved * 0.3 && (
                        <li className="text-sm flex items-start">
                          <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>High rejection rate - review common rejection reasons</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No data available for the selected period
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Reasons Tab */}
        <TabsContent value="reasons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Top Rescheduling Reasons
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics && analytics.topReasons.length > 0 ? (
                <div className="space-y-4">
                  {analytics.topReasons.map((reason, index) => (
                    <motion.div
                      key={index}
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
                          <p className="text-sm font-medium line-clamp-1">{reason.reason}</p>
                          <span className="text-sm text-muted-foreground ml-2">
                            {reason.count} ({((reason.count / analytics.totalRequests) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ 
                              width: `${(reason.count / analytics.totalRequests) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <div className="pt-4 border-t">
                    <h3 className="font-semibold text-sm mb-2">Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      The most common reason accounts for{' '}
                      {((analytics.topReasons[0].count / analytics.totalRequests) * 100).toFixed(1)}%
                      {' '}of all rescheduling requests. Consider addressing these patterns proactively.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No reasons data available for the selected period
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
