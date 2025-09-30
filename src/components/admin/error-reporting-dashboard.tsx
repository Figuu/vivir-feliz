'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Shield,
  Zap,
  AlertCircle
} from 'lucide-react'

interface ErrorStat {
  type: string
  count: number
  percentage: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface ErrorLog {
  id: string
  timestamp: Date
  type: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  statusCode: number
  userId?: string
  endpoint: string
  resolved: boolean
}

export function ErrorReportingDashboard() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')

  // Fetch error data from audit logs API
  const { data: errorData } = useQuery({
    queryKey: ['error-logs'],
    queryFn: async () => {
      const response = await fetch('/api/audit?success=false&limit=100')
      if (!response.ok) return { errors: [], summary: {} }
      const data = await response.json()
      return {
        errors: data.logs || [],
        summary: {
          total: data.pagination?.total || 0,
          critical: data.logs?.filter((l: any) => l.severity === 'CRITICAL').length || 0,
          high: data.logs?.filter((l: any) => l.severity === 'HIGH').length || 0,
          medium: data.logs?.filter((l: any) => l.severity === 'WARNING').length || 0
        }
      }
    },
    refetchInterval: 30000
  })

  // Use real error data from API
  const recentErrors: ErrorLog[] = errorData?.errors.map((log: any) => ({
    id: log.id,
    timestamp: new Date(log.createdAt),
    type: log.category || 'Unknown',
    message: log.errorMessage || 'No message',
    severity: log.severity.toLowerCase(),
    statusCode: log.metadata?.statusCode || 500,
    userId: log.userId,
    endpoint: log.endpoint,
    resolved: false
  })) || []

  // Calculate error statistics from real data
  const errorsByType = recentErrors.reduce((acc, err) => {
    acc[err.type] = (acc[err.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const totalErrors = recentErrors.length
  const errorStats: ErrorStat[] = Object.entries(errorsByType).map(([type, count]) => ({
    type,
    count,
    percentage: totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0,
    severity: recentErrors.find(e => e.type === type)?.severity || 'low'
  })).sort((a, b) => b.count - a.count)

  const criticalErrors = recentErrors.filter(e => e.severity === 'critical').length
  const errorRate = errorData?.summary.total || 0
  const avgResponseTime = 245 // This should come from performance metrics API

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'high': return <AlertCircle className="h-4 w-4 text-orange-500" />
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'low': return <AlertCircle className="h-4 w-4 text-blue-500" />
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Error Reporting Dashboard
            </div>
            <div className="flex gap-2">
              <Button
                variant={timeRange === '1h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('1h')}
              >
                1H
              </Button>
              <Button
                variant={timeRange === '24h' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('24h')}
              >
                24H
              </Button>
              <Button
                variant={timeRange === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('7d')}
              >
                7D
              </Button>
              <Button
                variant={timeRange === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('30d')}
              >
                30D
              </Button>
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Monitor and analyze system errors in real-time
          </p>
        </CardHeader>
      </Card>

      {/* Critical Alert */}
      {criticalErrors > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <p className="font-semibold text-red-800">Critical Errors Detected</p>
            <p className="text-sm text-red-700 mt-1">
              {criticalErrors} critical error{criticalErrors > 1 ? 's' : ''} detected in the last {timeRange}. 
              Immediate attention required.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{totalErrors}</div>
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8%
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last {timeRange}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold text-red-600">{criticalErrors}</div>
              {criticalErrors > 0 ? (
                <Badge className="bg-red-100 text-red-800 text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Alert
                </Badge>
              ) : (
                <Badge className="bg-green-100 text-green-800 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Clear
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{errorRate}%</div>
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Normal
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Of total requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{avgResponseTime}ms</div>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Good
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Error responses</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent Errors</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Errors by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errorStats.map((stat) => (
                  <div key={stat.type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(stat.severity)}
                        <span className="font-medium">{stat.type}</span>
                        <Badge className={getSeverityColor(stat.severity)}>
                          {stat.severity}
                        </Badge>
                      </div>
                      <span className="font-semibold">{stat.count}</span>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute left-0 top-0 h-full ${
                          stat.severity === 'critical' ? 'bg-red-500' :
                          stat.severity === 'high' ? 'bg-orange-500' :
                          stat.severity === 'medium' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{stat.percentage}% of total errors</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Error Handling Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Automatic error classification and categorization</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Real-time error logging to database and console</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Critical error alerting and notifications</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>User-friendly error messages</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Stack trace capture and analysis</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                    <span>Context-aware error handling</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Error Types Supported
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    'Validation',
                    'Authentication',
                    'Authorization',
                    'Not Found',
                    'Conflict',
                    'Rate Limit',
                    'Database',
                    'External API',
                    'Timeout',
                    'File Upload',
                    'Business Logic',
                    'Internal Server'
                  ].map(type => (
                    <Badge key={type} variant="outline" className="justify-center">
                      {type}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recent Errors Tab */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Errors</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest errors detected in the system
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentErrors.map((error) => (
                  <div
                    key={error.id}
                    className="border rounded-lg p-4 space-y-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getSeverityIcon(error.severity)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{error.type}</span>
                            <Badge className={getSeverityColor(error.severity)}>
                              {error.severity}
                            </Badge>
                            {error.resolved && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{error.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {error.timestamp.toLocaleString()}
                            </span>
                            <span>Status: {error.statusCode}</span>
                            <span>Endpoint: {error.endpoint}</span>
                            {error.userId && <span>User: {error.userId}</span>}
                          </div>
                        </div>
                      </div>
                      {!error.resolved && (
                        <Button size="sm" variant="outline">
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Error Handler Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Error Classification</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Total Error Types</span>
                      <span className="font-medium">12</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Severity Levels</span>
                      <span className="font-medium">4</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Auto Classification</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-sm">Error Logging</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Console Logging</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Database Logging</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Stack Trace Capture</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-sm">Error Reporting</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Critical Alerts</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">User Notifications</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Context Tracking</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-sm">Environment Settings</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Development Mode</span>
                      <Badge variant="outline">
                        {process.env.NODE_ENV === 'development' ? 'Yes' : 'No'}
                      </Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Detailed Errors</span>
                      <Badge variant="outline">
                        {process.env.NODE_ENV === 'development' ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Stack Traces</span>
                      <Badge variant="outline">
                        {process.env.NODE_ENV === 'development' ? 'Full' : 'Minimal'}
                      </Badge>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Helper Functions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="border rounded-lg p-3 space-y-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">asyncHandler()</code>
                  <p className="text-xs text-muted-foreground">
                    Automatic error handling wrapper for API routes
                  </p>
                </div>
                <div className="border rounded-lg p-3 space-y-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">tryCatch()</code>
                  <p className="text-xs text-muted-foreground">
                    Try-catch wrapper with context tracking
                  </p>
                </div>
                <div className="border rounded-lg p-3 space-y-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">validateOrThrow()</code>
                  <p className="text-xs text-muted-foreground">
                    Validation with automatic error throwing
                  </p>
                </div>
                <div className="border rounded-lg p-3 space-y-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">assertExists()</code>
                  <p className="text-xs text-muted-foreground">
                    Assert resource exists or throw NotFoundError
                  </p>
                </div>
                <div className="border rounded-lg p-3 space-y-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">assertAuthorized()</code>
                  <p className="text-xs text-muted-foreground">
                    Assert authorization or throw error
                  </p>
                </div>
                <div className="border rounded-lg p-3 space-y-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">normalizeError()</code>
                  <p className="text-xs text-muted-foreground">
                    Convert any error to AppError instance
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
