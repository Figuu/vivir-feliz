'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Database,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface SystemHealthData {
  overall: {
    status: string
    uptime: number
    responseTime: number
  }
  components: {
    database: {
      status: string
      responseTime: number
      connections: string
    }
    api: {
      status: string
      responseTime: number
      requestsPerMinute: string
    }
    storage: {
      status: string
      usage: string
    }
  }
  resources: {
    memory: {
      used: number
      total: number
      percentage: string
      external: number
      rss: number
    }
    cpu: {
      user: number
      system: number
    }
  }
  statistics: {
    users: {
      total: number
      active: number
      activityRate: string
    }
    patients: {
      total: number
    }
    therapists: {
      total: number
    }
    sessions: {
      total: number
      completed: number
      upcoming: number
      completionRate: string
    }
    payments: {
      total: number
      paid: number
      pending: number
      collectionRate: string
    }
  }
  issues: Array<{
    severity: string
    component: string
    message: string
    timestamp: string
  }>
  issueCount: {
    critical: number
    warning: number
    info: number
  }
}

export function SystemHealthMonitor() {
  const [loading, setLoading] = useState(false)
  const [health, setHealth] = useState<SystemHealthData | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadHealth()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadHealth()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const loadHealth = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/super-admin/system-health')
      
      if (!response.ok) {
        throw new Error('Failed to load system health')
      }

      const result = await response.json()
      setHealth(result.data)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error loading system health:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to load system health'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'degraded': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      case 'down': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />
      case 'down': return <XCircle className="h-5 w-5 text-red-500" />
      default: return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'info': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              System Health Monitor
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="autoRefresh" className="cursor-pointer text-sm">
                  Auto-refresh (30s)
                </Label>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadHealth}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </CardHeader>
      </Card>

      {loading && !health ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading system health...</p>
          </CardContent>
        </Card>
      ) : health ? (
        <>
          {/* Overall Status */}
          <Card className={
            health.overall.status === 'critical' ? 'border-red-500' :
            health.overall.status === 'warning' ? 'border-yellow-500' :
            'border-green-500'
          }>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(health.overall.status)}
                  <div>
                    <h3 className="text-2xl font-bold">System Status</h3>
                    <Badge className={getStatusColor(health.overall.status)}>
                      {health.overall.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Uptime</p>
                  <p className="text-2xl font-bold">{formatUptime(health.overall.uptime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues Alert */}
          {health.issues.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">
                  {health.issueCount.critical} Critical, {health.issueCount.warning} Warning, {health.issueCount.info} Info
                </p>
                <div className="space-y-1">
                  {health.issues.slice(0, 3).map((issue, index) => (
                    <p key={index} className="text-sm">
                      • {issue.component}: {issue.message}
                    </p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Response Time</p>
                      <Clock className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold">{health.overall.responseTime}ms</p>
                    {health.overall.responseTime < 500 ? (
                      <p className="text-xs text-green-600 mt-1">✓ Fast</p>
                    ) : (
                      <p className="text-xs text-yellow-600 mt-1">⚠ Slow</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">System Uptime</p>
                      <Server className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold">{formatUptime(health.overall.uptime)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Running continuously</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Active Issues</p>
                      {health.issues.length === 0 ? (
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-8 w-8 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-3xl font-bold">{health.issues.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {health.issueCount.critical} critical, {health.issueCount.warning} warnings
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Issues List */}
              {health.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Active Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {health.issues.map((issue, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <Badge className={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{issue.component}</p>
                            <p className="text-sm text-muted-foreground">{issue.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(issue.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Components Tab */}
            <TabsContent value="components" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Database className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-semibold">Database</p>
                            <Badge className={getStatusColor(health.components.database.status)}>
                              {health.components.database.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Response Time</span>
                          <span className="font-medium">{health.components.database.responseTime}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Connections</span>
                          <span className="font-medium">{health.components.database.connections}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Server className="h-8 w-8 text-green-500" />
                          <div>
                            <p className="font-semibold">API</p>
                            <Badge className={getStatusColor(health.components.api.status)}>
                              {health.components.api.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Response Time</span>
                          <span className="font-medium">{health.components.api.responseTime}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Requests/min</span>
                          <span className="font-medium">{health.components.api.requestsPerMinute}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <HardDrive className="h-8 w-8 text-purple-500" />
                          <div>
                            <p className="font-semibold">Storage</p>
                            <Badge className={getStatusColor(health.components.storage.status)}>
                              {health.components.storage.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Usage</span>
                          <span className="font-medium">{health.components.storage.usage}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base">
                      <MemoryStick className="h-5 w-5 mr-2" />
                      Memory Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Heap Usage</span>
                          <span className="text-sm font-medium">{health.resources.memory.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              parseFloat(health.resources.memory.percentage) > 90 ? 'bg-red-500' :
                              parseFloat(health.resources.memory.percentage) > 70 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${health.resources.memory.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Used</p>
                          <p className="font-medium">{formatBytes(health.resources.memory.used)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-medium">{formatBytes(health.resources.memory.total)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">External</p>
                          <p className="font-medium">{formatBytes(health.resources.memory.external)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">RSS</p>
                          <p className="font-medium">{formatBytes(health.resources.memory.rss)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base">
                      <Cpu className="h-5 w-5 mr-2" />
                      CPU Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">User CPU</p>
                          <p className="text-2xl font-bold">{(health.resources.cpu.user / 1000).toFixed(2)}ms</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">System CPU</p>
                          <p className="text-2xl font-bold">{(health.resources.cpu.system / 1000).toFixed(2)}ms</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        CPU time since process start
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base">
                      <Users className="h-5 w-5 mr-2" />
                      Users & Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Users</span>
                        <span className="text-2xl font-bold">{health.statistics.users.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Active Users</span>
                        <span className="text-2xl font-bold text-green-600">{health.statistics.users.active}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Activity Rate</span>
                        <span className="text-2xl font-bold">{health.statistics.users.activityRate}%</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Patients</span>
                        <span className="text-xl font-bold">{health.statistics.patients.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Therapists</span>
                        <span className="text-xl font-bold">{health.statistics.therapists.total}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base">
                      <Calendar className="h-5 w-5 mr-2" />
                      Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Sessions</span>
                        <span className="text-2xl font-bold">{health.statistics.sessions.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Completed</span>
                        <span className="text-2xl font-bold text-green-600">{health.statistics.sessions.completed}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Upcoming</span>
                        <span className="text-2xl font-bold text-blue-600">{health.statistics.sessions.upcoming}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Completion Rate</span>
                        <span className="text-2xl font-bold">{health.statistics.sessions.completionRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Payments</span>
                        <span className="text-2xl font-bold">{health.statistics.payments.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Paid</span>
                        <span className="text-2xl font-bold text-green-600">{health.statistics.payments.paid}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Pending</span>
                        <span className="text-2xl font-bold text-yellow-600">{health.statistics.payments.pending}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Collection Rate</span>
                        <span className="text-2xl font-bold">{health.statistics.payments.collectionRate}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  )
}
