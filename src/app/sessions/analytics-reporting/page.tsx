'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Minimize2,
  Download as DownloadIcon,
  Upload,
  Share,
  Mail,
  Printer
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnalyticsReportingDashboard } from '@/components/sessions/analytics-reporting-dashboard'
import { useAnalyticsReporting } from '@/hooks/use-analytics-reporting'

export default function AnalyticsReportingPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedReport, setSelectedReport] = useState<any>(null)
  
  const { 
    loading, 
    error, 
    analyticsData,
    getOverview,
    generateReport,
    exportReport,
    clearError 
  } = useAnalyticsReporting()

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const dateTo = new Date().toISOString()
      
      await getOverview({
        dateFrom,
        dateTo,
        groupBy: 'day',
        includeProjections: false
      })
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const handleReportGenerated = (report: any) => {
    console.log('Report generated:', report)
    setSelectedReport(report)
  }

  const handleExportReport = (report: any) => {
    console.log('Report exported:', report)
    // In a real implementation, this would trigger a download
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Reporting</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and reporting for session scheduling
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadInitialData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

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
                Last 30 days
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <AnalyticsReportingDashboard
            onReportGenerated={handleReportGenerated}
            onExportReport={handleExportReport}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Scheduling Performance
                </CardTitle>
                <CardDescription>
                  Session completion rates and scheduling metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completion Rate:</span>
                    <span className="font-medium">{analyticsData?.scheduling.completionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cancellation Rate:</span>
                    <span className="font-medium">{analyticsData?.scheduling.cancellationRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>No-Show Rate:</span>
                    <span className="font-medium">{analyticsData?.scheduling.noShowRate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Utilization Report
                </CardTitle>
                <CardDescription>
                  Therapist capacity and workload analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Avg Utilization:</span>
                    <Badge className={getUtilizationColor(analyticsData?.utilization.averageUtilization || 0)}>
                      {analyticsData?.utilization.averageUtilization.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Overloaded:</span>
                    <span className="font-medium text-red-600">{analyticsData?.utilization.overloadedTherapists}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Underutilized:</span>
                    <span className="font-medium text-blue-600">{analyticsData?.utilization.underutilizedTherapists}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="h-5 w-5 mr-2" />
                  Trend Analysis
                </CardTitle>
                <CardDescription>
                  Historical trends and patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Trend Direction:</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(analyticsData?.trends.trends.direction || 'stable')}
                      <span className="font-medium capitalize">{analyticsData?.trends.trends.direction || 'stable'}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Change:</span>
                    <span className={`font-medium ${getTrendColor(analyticsData?.trends.trends.direction || 'stable')}`}>
                      {analyticsData?.trends.trends.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Period:</span>
                    <span className="font-medium capitalize">{analyticsData?.trends.period || 'day'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Key Insights
                </CardTitle>
                <CardDescription>
                  Automated insights from your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData && (
                    <>
                      {analyticsData.scheduling.completionRate > 85 && (
                        <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-green-800">Excellent Completion Rate</div>
                            <div className="text-sm text-green-700">
                              Your completion rate of {analyticsData.scheduling.completionRate.toFixed(1)}% is above the industry average.
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {analyticsData.utilization.overloadedTherapists > 0 && (
                        <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-yellow-800">Therapist Overload Alert</div>
                            <div className="text-sm text-yellow-700">
                              {analyticsData.utilization.overloadedTherapists} therapist(s) are operating above 90% capacity.
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {analyticsData.scheduling.cancellationRate > 15 && (
                        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-red-800">High Cancellation Rate</div>
                            <div className="text-sm text-red-700">
                              Your cancellation rate of {analyticsData.scheduling.cancellationRate.toFixed(1)}% is above recommended levels.
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {analyticsData.trends.trends.direction === 'increasing' && (
                        <div className="flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="font-medium text-blue-800">Positive Growth Trend</div>
                            <div className="text-sm text-blue-700">
                              Session volume is increasing by {analyticsData.trends.trends.percentage.toFixed(1)}%.
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Recommendations
                </CardTitle>
                <CardDescription>
                  Actionable recommendations to improve performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData && (
                    <>
                      {analyticsData.utilization.underutilizedTherapists > 0 && (
                        <div className="p-3 border rounded-lg">
                          <div className="font-medium mb-2">Optimize Therapist Utilization</div>
                          <div className="text-sm text-muted-foreground">
                            Consider redistributing sessions to {analyticsData.utilization.underutilizedTherapists} underutilized therapist(s).
                          </div>
                        </div>
                      )}
                      
                      {analyticsData.scheduling.noShowRate > 10 && (
                        <div className="p-3 border rounded-lg">
                          <div className="font-medium mb-2">Reduce No-Show Rate</div>
                          <div className="text-sm text-muted-foreground">
                            Implement reminder systems to reduce the {analyticsData.scheduling.noShowRate.toFixed(1)}% no-show rate.
                          </div>
                        </div>
                      )}
                      
                      {analyticsData.scheduling.rescheduleRate > 20 && (
                        <div className="p-3 border rounded-lg">
                          <div className="font-medium mb-2">Improve Scheduling Stability</div>
                          <div className="text-sm text-muted-foreground">
                            Review scheduling policies to reduce the {analyticsData.scheduling.rescheduleRate.toFixed(1)}% reschedule rate.
                          </div>
                        </div>
                      )}
                      
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium mb-2">Regular Performance Reviews</div>
                        <div className="text-sm text-muted-foreground">
                          Schedule monthly reviews to monitor trends and adjust capacity as needed.
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DownloadIcon className="h-5 w-5 mr-2" />
                Export & Share
              </CardTitle>
              <CardDescription>
                Export reports in various formats and share with stakeholders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <FileText className="h-6 w-6" />
                    <span>Export PDF</span>
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <DownloadIcon className="h-6 w-6" />
                    <span>Export CSV</span>
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                    <Share className="h-6 w-6" />
                    <span>Share Report</span>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Recent Reports</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Scheduling Performance Report</div>
                        <div className="text-sm text-muted-foreground">Generated 2 hours ago</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <DownloadIcon className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Utilization Analysis</div>
                        <div className="text-sm text-muted-foreground">Generated 1 day ago</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <DownloadIcon className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Analytics Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Real-time performance metrics</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Trend analysis and forecasting</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Comparative period analysis</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Custom date range filtering</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Reporting Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Multiple export formats (PDF, CSV, JSON)</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Automated report generation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Scheduled report delivery</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Custom report templates</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Automated insights generation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Performance recommendations</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Alert system for anomalies</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Benchmark comparisons</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
