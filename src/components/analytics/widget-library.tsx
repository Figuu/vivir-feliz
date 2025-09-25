"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  Activity,
  Users,
  Shield,
  TrendingUp,
  AlertTriangle,
  Clock,
  Database,
  Zap
} from 'lucide-react'
import { RealTimeAnalytics, RealTimeMetrics, ChartDataPoint } from '@/lib/analytics/real-time'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Widget configuration interfaces
export interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  description?: string
  size: WidgetSize
  dataSource: string
  refreshInterval?: number
  options?: Record<string, unknown>
}

export type WidgetType = 
  | 'metric' 
  | 'line-chart' 
  | 'bar-chart' 
  | 'pie-chart' 
  | 'area-chart' 
  | 'activity-feed'
  | 'performance-gauge'

export type WidgetSize = 'small' | 'medium' | 'large' | 'extra-large'

// Color schemes for charts
const CHART_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', 
  '#00ff00', '#ff00ff', '#00ffff', '#ffff00'
]

const SEVERITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b', 
  high: '#ef4444',
  critical: '#dc2626'
}

/**
 * Metric Widget - Display single key metrics
 */
export function MetricWidget({ config }: { config: WidgetConfig }) {
  const [data, setData] = useState<RealTimeMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metrics = await RealTimeAnalytics.getCurrentMetrics()
        setData(metrics)
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, config.refreshInterval || 30000)
    return () => clearInterval(interval)
  }, [config.refreshInterval])

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  const getMetricValue = (source: string) => {
    if (!data) return 0
    switch (source) {
      case 'activeUsers': return data.activeUsers
      case 'totalSessions': return data.totalSessions
      case 'newSignups': return data.newSignups
      case 'recentActions': return data.recentActions
      case 'securityEvents': return data.securityEvents
      case 'errorRate': return Math.round(data.errorRate * 100) / 100
      default: return 0
    }
  }

  const getIcon = (source: string) => {
    switch (source) {
      case 'activeUsers': return <Users className="h-6 w-6" />
      case 'totalSessions': return <Activity className="h-6 w-6" />
      case 'newSignups': return <TrendingUp className="h-6 w-6" />
      case 'recentActions': return <Zap className="h-6 w-6" />
      case 'securityEvents': return <Shield className="h-6 w-6" />
      case 'errorRate': return <AlertTriangle className="h-6 w-6" />
      default: return <Database className="h-6 w-6" />
    }
  }

  const value = getMetricValue(config.dataSource)
  const icon = getIcon(config.dataSource)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {config.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {config.description}
          </p>
        )}
        <div className="flex items-center text-xs text-muted-foreground mt-2">
          <Clock className="mr-1 h-3 w-3" />
          Last updated: {data?.timestamp.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Chart Widget - Display various chart types
 */
export function ChartWidget({ config }: { config: WidgetConfig }) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const chartData = await RealTimeAnalytics.getChartData(
          config.dataSource as 'users' | 'sessions' | 'actions' | 'errors',
          '24h'
        )
        setData(chartData)
      } catch (error) {
        console.error('Failed to fetch chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, config.refreshInterval || 60000)
    return () => clearInterval(interval)
  }, [config.dataSource, config.refreshInterval])

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  const renderChart = () => {
    switch (config.type) {
      case 'line-chart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={CHART_COLORS[0]} 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar-chart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_COLORS[1]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'area-chart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={CHART_COLORS[2]} 
                fill={CHART_COLORS[2]}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        )

      case 'pie-chart':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data as any}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ label, value }) => `${label}: ${value}`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )

      default:
        return <div>Unsupported chart type</div>
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
        {config.description && (
          <CardDescription>{config.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  )
}

/**
 * Activity Feed Widget - Display recent activity
 */
export function ActivityFeedWidget({ config }: { config: WidgetConfig }) {
  const [activities, setActivities] = useState<Awaited<ReturnType<typeof RealTimeAnalytics.getLiveActivity>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await RealTimeAnalytics.getLiveActivity(10)
        setActivities(data)
      } catch (error) {
        console.error('Failed to fetch activity feed:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, config.refreshInterval || 10000)
    return () => clearInterval(interval)
  }, [config.refreshInterval])

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
        {config.description && (
          <CardDescription>{config.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activities.slice(0, 10).map((activity) => (
            <div key={activity.id} className="flex items-start space-x-2 p-2 rounded-lg bg-muted/50">
              <Badge 
                variant="outline" 
                className="mt-1"
                style={{ borderColor: SEVERITY_COLORS[activity.severity] }}
              >
                {activity.severity}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{activity.message}</p>
                <p className="text-xs text-muted-foreground">
                  {activity.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              No recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Performance Gauge Widget - Display system performance
 */
export function PerformanceGaugeWidget({ config }: { config: WidgetConfig }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof RealTimeAnalytics.getPerformanceMetrics>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const metrics = await RealTimeAnalytics.getPerformanceMetrics()
        setData(metrics)
      } catch (error) {
        console.error('Failed to fetch performance metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, config.refreshInterval || 30000)
    return () => clearInterval(interval)
  }, [config.refreshInterval])

  if (loading || !data) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{config.title}</CardTitle>
        {config.description && (
          <CardDescription>{config.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(data.avgResponseTime)}ms</div>
            <div className="text-xs text-muted-foreground">Avg Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.errorRate.toFixed(2)}%</div>
            <div className="text-xs text-muted-foreground">Error Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.totalRequests.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Requests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(data.uptime / 3600)}h</div>
            <div className="text-xs text-muted-foreground">Uptime</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Widget Factory - Create widgets based on configuration
 */
export function WidgetFactory({ config }: { config: WidgetConfig }) {
  const getSizeClasses = (size: WidgetSize) => {
    switch (size) {
      case 'small': return 'col-span-1 row-span-1'
      case 'medium': return 'col-span-2 row-span-1'
      case 'large': return 'col-span-2 row-span-2'
      case 'extra-large': return 'col-span-4 row-span-2'
      default: return 'col-span-1 row-span-1'
    }
  }

  const renderWidget = () => {
    switch (config.type) {
      case 'metric':
        return <MetricWidget config={config} />
      case 'line-chart':
      case 'bar-chart':
      case 'pie-chart':
      case 'area-chart':
        return <ChartWidget config={config} />
      case 'activity-feed':
        return <ActivityFeedWidget config={config} />
      case 'performance-gauge':
        return <PerformanceGaugeWidget config={config} />
      default:
        return (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full">
              <div>Unknown widget type: {config.type}</div>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className={getSizeClasses(config.size)}>
      {renderWidget()}
    </div>
  )
}

/**
 * Pre-defined widget configurations
 */
export const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: 'active-users',
    type: 'metric',
    title: 'Active Users',
    description: 'Users active in the last 5 minutes',
    size: 'small',
    dataSource: 'activeUsers',
    refreshInterval: 30000
  },
  {
    id: 'total-sessions',
    type: 'metric', 
    title: 'Total Sessions',
    description: 'Sessions created today',
    size: 'small',
    dataSource: 'totalSessions',
    refreshInterval: 30000
  },
  {
    id: 'new-signups',
    type: 'metric',
    title: 'New Signups',
    description: 'New user registrations today',
    size: 'small',
    dataSource: 'newSignups',
    refreshInterval: 30000
  },
  {
    id: 'security-events',
    type: 'metric',
    title: 'Security Events',
    description: 'High/critical security events today',
    size: 'small',
    dataSource: 'securityEvents',
    refreshInterval: 30000
  },
  {
    id: 'user-growth',
    type: 'line-chart',
    title: 'User Growth',
    description: 'New user registrations over time',
    size: 'medium',
    dataSource: 'users',
    refreshInterval: 60000
  },
  {
    id: 'session-activity',
    type: 'area-chart',
    title: 'Session Activity',
    description: 'User session patterns',
    size: 'medium',
    dataSource: 'sessions',
    refreshInterval: 60000
  },
  {
    id: 'live-activity',
    type: 'activity-feed',
    title: 'Live Activity Feed',
    description: 'Recent user actions and system events',
    size: 'large',
    dataSource: 'activity',
    refreshInterval: 10000
  },
  {
    id: 'performance-metrics',
    type: 'performance-gauge',
    title: 'System Performance',
    description: 'Key performance indicators',
    size: 'medium',
    dataSource: 'performance',
    refreshInterval: 30000
  }
]