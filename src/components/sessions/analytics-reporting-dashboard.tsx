'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Clock,
  Target,
  Download,
  RefreshCw,
  Filter,
  Settings,
  Eye,
  FileText,
  PieChart,
  LineChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Edit,
  Trash2,
  Bell,
  Star,
  Heart,
  Shield,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface AnalyticsData {
  overview: {
    totalSessions: number
    totalTherapists: number
    totalServices: number
    dateRange: { from: string; to: string }
  }
  scheduling: {
    totalSessions: number
    completedSessions: number
    cancelledSessions: number
    noShowSessions: number
    rescheduledSessions: number
    completionRate: number
    cancellationRate: number
    noShowRate: number
    rescheduleRate: number
  }
  utilization: {
    averageUtilization: number
    maxUtilization: number
    minUtilization: number
    therapistUtilization: Array<{
      therapistId: string
      therapistName: string
      totalSessions: number
      totalHours: number
      sessionUtilization: number
      hourUtilization: number
      overallUtilization: number
    }>
    totalTherapists: number
    overloadedTherapists: number
    underutilizedTherapists: number
  }
  trends: {
    period: string
    data: Array<{
      period: string
      sessions: any[]
    }>
    trends: {
      direction: string
      percentage: number
    }
  }
}

interface ReportConfig {
  reportType: 'SCHEDULING_PERFORMANCE' | 'UTILIZATION' | 'TRENDS' | 'COMPARATIVE' | 'CUSTOM'
  dateFrom: string
  dateTo: string
  therapistId?: string
  serviceId?: string
  format: 'json' | 'csv' | 'pdf'
  includeCharts: boolean
}

interface AnalyticsReportingDashboardProps {
  onReportGenerated?: (report: any) => void
  onExportReport?: (report: any) => void
}

export function AnalyticsReportingDashboard({
  onReportGenerated,
  onExportReport
}: AnalyticsReportingDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    reportType: 'SCHEDULING_PERFORMANCE',
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    format: 'json',
    includeCharts: true
  })
  const [filters, setFilters] = useState({
    therapistId: '',
    serviceId: '',
    groupBy: 'day'
  })
  const [customReports, setCustomReports] = useState<any[]>([])

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData()
  }, [filters])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('dateFrom', new Date(reportConfig.dateFrom).toISOString())
      params.append('dateTo', new Date(reportConfig.dateTo).toISOString())
      if (filters.therapistId) params.append('therapistId', filters.therapistId)
      if (filters.serviceId) params.append('serviceId', filters.serviceId)

      const response = await fetch(`/api/sessions/analytics-reporting?action=overview&${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load analytics data')
      }

      setAnalyticsData(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics data'
      setError(errorMessage)
      console.error('Error loading analytics data:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/analytics-reporting?action=generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reportConfig,
          dateFrom: new Date(reportConfig.dateFrom).toISOString(),
          dateTo: new Date(reportConfig.dateTo).toISOString()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate report')
      }

      if (onReportGenerated) {
        onReportGenerated(result.data)
      }

      toast({
        title: "Success",
        description: 'Report generated successfully'
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate report'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error generating report:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/analytics-reporting?action=export&format=${format}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to export report')
      }

      if (onExportReport) {
        onExportReport(result.data)
      }

      toast({
        title: "Success",
        description: `Report exported as ${format.toUpperCase()}`
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export report'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error exporting report:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return 'text-green-600'
      case 'decreasing':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-100 text-red-800 border-red-200'
    if (utilization >= 80) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (utilization >= 60) return 'bg-green-100 text-green-800 border-green-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading && !analyticsData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading analytics data...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Analytics & Reporting Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive analytics and reporting for session scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    type="date"
                    value={reportConfig.dateFrom}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-40"
                  />
                  <span>to</span>
                  <Input
                    type="date"
                    value={reportConfig.dateTo}
                    onChange={(e) => setReportConfig(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-40"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Group By</Label>
                <Select 
                  value={filters.groupBy} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, groupBy: value }))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="quarter">Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadAnalyticsData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={generateReport} disabled={loading}>
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                {formatDate(analyticsData.overview.dateRange.from)} - {formatDate(analyticsData.overview.dateRange.to)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analyticsData.scheduling.completionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.scheduling.completedSessions} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analyticsData.utilization.averageUtilization.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.utilization.totalTherapists} therapists
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trend</CardTitle>
              {getTrendIcon(analyticsData.trends.trends.direction)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getTrendColor(analyticsData.trends.trends.direction)}`}>
                {analyticsData.trends.trends.percentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.trends.trends.direction} trend
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {analyticsData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Scheduling Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completion Rate</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${analyticsData.scheduling.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{analyticsData.scheduling.completionRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cancellation Rate</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${analyticsData.scheduling.cancellationRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{analyticsData.scheduling.cancellationRate.toFixed(1)}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">No-Show Rate</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${analyticsData.scheduling.noShowRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{analyticsData.scheduling.noShowRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Therapist Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Utilization</span>
                      <Badge className={getUtilizationColor(analyticsData.utilization.averageUtilization)}>
                        {analyticsData.utilization.averageUtilization.toFixed(1)}%
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overloaded Therapists</span>
                      <span className="text-sm font-medium text-red-600">
                        {analyticsData.utilization.overloadedTherapists}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Underutilized Therapists</span>
                      <span className="text-sm font-medium text-blue-600">
                        {analyticsData.utilization.underutilizedTherapists}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Scheduling Tab */}
        <TabsContent value="scheduling" className="space-y-4">
          {analyticsData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Scheduling Performance Analysis
                </CardTitle>
                <CardDescription>
                  Detailed analysis of scheduling performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analyticsData.scheduling.completedSessions}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{analyticsData.scheduling.cancelledSessions}</div>
                    <div className="text-sm text-muted-foreground">Cancelled</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{analyticsData.scheduling.noShowSessions}</div>
                    <div className="text-sm text-muted-foreground">No Shows</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analyticsData.scheduling.rescheduledSessions}</div>
                    <div className="text-sm text-muted-foreground">Rescheduled</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Utilization Tab */}
        <TabsContent value="utilization" className="space-y-4">
          {analyticsData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Therapist Utilization Analysis
                </CardTitle>
                <CardDescription>
                  Individual therapist utilization and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.utilization.therapistUtilization.map((therapist) => (
                    <div key={therapist.therapistId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{therapist.therapistName}</div>
                        <div className="text-sm text-muted-foreground">
                          {therapist.totalSessions} sessions, {therapist.totalHours.toFixed(1)} hours
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              therapist.overallUtilization >= 90 ? 'bg-red-500' :
                              therapist.overallUtilization >= 80 ? 'bg-yellow-500' :
                              therapist.overallUtilization >= 60 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(therapist.overallUtilization, 100)}%` }}
                          ></div>
                        </div>
                        <Badge className={getUtilizationColor(therapist.overallUtilization)}>
                          {therapist.overallUtilization.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {analyticsData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="h-5 w-5 mr-2" />
                  Trend Analysis
                </CardTitle>
                <CardDescription>
                  Historical trends and patterns in session scheduling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Overall Trend</div>
                      <div className="text-sm text-muted-foreground">
                        {analyticsData.trends.period} period analysis
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(analyticsData.trends.trends.direction)}
                      <span className={`font-medium ${getTrendColor(analyticsData.trends.trends.direction)}`}>
                        {analyticsData.trends.trends.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center py-8">
                    <LineChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Trend Visualization</h3>
                    <p className="text-muted-foreground">
                      Interactive trend charts would be displayed here in a full implementation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Report Generation
              </CardTitle>
              <CardDescription>
                Generate and export custom reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reportType">Report Type</Label>
                    <Select 
                      value={reportConfig.reportType} 
                      onValueChange={(value: any) => setReportConfig(prev => ({ ...prev, reportType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SCHEDULING_PERFORMANCE">Scheduling Performance</SelectItem>
                        <SelectItem value="UTILIZATION">Utilization</SelectItem>
                        <SelectItem value="TRENDS">Trends</SelectItem>
                        <SelectItem value="COMPARATIVE">Comparative</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="format">Export Format</Label>
                    <Select 
                      value={reportConfig.format} 
                      onValueChange={(value: any) => setReportConfig(prev => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button onClick={generateReport} disabled={loading}>
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Generate Report
                  </Button>
                  
                  <Button variant="outline" onClick={() => exportReport('csv')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  
                  <Button variant="outline" onClick={() => exportReport('pdf')}>
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
