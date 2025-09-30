'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Settings,
  BarChart3,
  Target,
  Zap,
  Activity,
  Calendar,
  User,
  RefreshCw,
  Bell,
  Star,
  Heart,
  Shield,
  Eye,
  Download,
  Upload,
  Filter,
  Search,
  Plus,
  Minus,
  Edit,
  Save,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CapacityWorkloadManager } from '@/components/sessions/capacity-workload-manager'
import { useCapacityWorkload } from '@/hooks/use-capacity-workload'

export default function CapacityWorkloadPage() {
  const [activeTab, setActiveTab] = useState('manager')
  const [selectedTherapist, setSelectedTherapist] = useState<string | undefined>(undefined)
  
  const { 
    loading, 
    error, 
    overview, 
    getOverview,
    getAnalytics,
    analytics,
    clearError 
  } = useCapacityWorkload()

  // Load overview data
  useEffect(() => {
    loadOverview()
  }, [])

  const loadOverview = async () => {
    try {
      await getOverview()
    } catch (err) {
      console.error('Error loading overview:', err)
    }
  }

  const loadAnalytics = async () => {
    try {
      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const dateTo = new Date().toISOString()
      await getAnalytics(dateFrom, dateTo)
    } catch (err) {
      console.error('Error loading analytics:', err)
    }
  }

  const handleConfigUpdate = (config: any) => {
    console.log('Capacity config updated:', config)
    loadOverview() // Refresh overview
  }

  const handleWorkloadAnalysis = (analysis: any) => {
    console.log('Workload analysis completed:', analysis)
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600'
    if (utilization >= 80) return 'text-yellow-600'
    if (utilization >= 60) return 'text-green-600'
    return 'text-blue-600'
  }

  const getUtilizationBadgeColor = (utilization: number) => {
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
          <h1 className="text-3xl font-bold">Capacity & Workload Management</h1>
          <p className="text-muted-foreground">
            Monitor and optimize therapist capacity and workload distribution
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadAnalytics}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Load Analytics
          </Button>
          <Button variant="outline" onClick={loadOverview}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {overview.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Therapists</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.length}</div>
              <p className="text-xs text-muted-foreground">
                Active therapists
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overview.length > 0 
                  ? (overview.reduce((sum, item) => sum + item.utilization, 0) / overview.length).toFixed(1)
                  : 0
                }%
              </div>
              <p className="text-xs text-muted-foreground">
                Capacity utilization
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overloaded</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {overview.filter(item => item.utilization > 90).length}
              </div>
              <p className="text-xs text-muted-foreground">
                90% utilization
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {overview.reduce((sum, item) => sum + item.alerts.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Capacity alerts
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manager">Capacity Manager</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="manager" className="space-y-4">
          <CapacityWorkloadManager
            therapistId={selectedTherapist}
            onConfigUpdate={handleConfigUpdate}
            onWorkloadAnalysis={handleWorkloadAnalysis}
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview.map((item) => (
              <motion.div
                key={item.therapist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`cursor-pointer transition-all ${
                  selectedTherapist === item.therapist.id ? 'ring-2 ring-primary' : ''
                }`} onClick={() => setSelectedTherapist(item.therapist.id)}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {item.therapist.firstName} {item.therapist.lastName}
                        </CardTitle>
                        <CardDescription>{item.therapist.email}</CardDescription>
                      </div>
                      <Badge className={getUtilizationBadgeColor(item.utilization)}>
                        {item.utilization.toFixed(1)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sessions:</span>
                        <span>{item.workload.totalSessions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Hours:</span>
                        <span>{item.workload.totalHours.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Avg Duration:</span>
                        <span>{item.workload.averageSessionDuration.toFixed(1)} min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Alerts:</span>
                        <span className={item.alerts.length > 0 ? 'text-red-600' : 'text-green-600'}>
                          {item.alerts.length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Capacity Analytics
              </CardTitle>
              <CardDescription>
                System-wide capacity and workload analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics ? (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{analytics.summary.averageUtilization?.toFixed(1) || 0}%</div>
                      <div className="text-sm text-muted-foreground">Avg Utilization</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{analytics.summary.totalSessions || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Sessions</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{analytics.summary.totalHours?.toFixed(1) || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Hours</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{analytics.therapists?.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Active Therapists</div>
                    </div>
                  </div>

                  {/* Therapist Utilization Chart */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Therapist Utilization</h3>
                    <div className="space-y-2">
                      {analytics.therapists?.map((therapist: any) => (
                        <div key={therapist.therapistId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{therapist.therapistName}</div>
                            <div className="text-sm text-muted-foreground">
                              {therapist.workload.totalSessions} sessions, {therapist.workload.totalHours.toFixed(1)} hours
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  therapist.utilization >= 90 ? 'bg-red-500' :
                                  therapist.utilization >= 80 ? 'bg-yellow-500' :
                                  therapist.utilization >= 60 ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(therapist.utilization, 100)}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-medium ${getUtilizationColor(therapist.utilization)}`}>
                              {therapist.utilization.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Analytics Data</h3>
                  <p className="text-muted-foreground">
                    Click "Load Analytics" to view system-wide capacity analytics.
                  </p>
                  <Button className="mt-4" onClick={loadAnalytics}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Load Analytics
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Capacity Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Set daily, weekly, and monthly limits</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Configure working days and hours</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Define break times between sessions</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Monitor capacity utilization</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Workload Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Real-time workload monitoring</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Workload trend analysis</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Session distribution insights</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Workload projections</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Automatic workload balancing</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Capacity maximization</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Overtime reduction</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Smart recommendations</span>
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
