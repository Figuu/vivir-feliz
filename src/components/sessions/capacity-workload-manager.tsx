'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Edit,
  Save,
  X,
  Plus,
  Minus,
  Filter,
  Download,
  Upload,
  Bell,
  BellOff,
  Star,
  Heart,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface CapacityConfig {
  therapistId: string
  maxSessionsPerDay: number
  maxSessionsPerWeek: number
  maxSessionsPerMonth: number
  maxHoursPerDay: number
  maxHoursPerWeek: number
  preferredSessionDuration: number
  breakTimeBetweenSessions: number
  workingDays: number[]
  isActive: boolean
}

interface WorkloadData {
  totalSessions: number
  totalHours: number
  averageSessionDuration: number
  dailyWorkload: Record<string, { sessions: number; hours: number }>
  sessions: any[]
}

interface TherapistOverview {
  therapist: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  capacity: CapacityConfig
  workload: WorkloadData
  alerts: any[]
  utilization: number
}

interface CapacityWorkloadManagerProps {
  therapistId?: string
  onConfigUpdate?: (config: CapacityConfig) => void
  onWorkloadAnalysis?: (analysis: any) => void
}

export function CapacityWorkloadManager({
  therapistId,
  onConfigUpdate,
  onWorkloadAnalysis
}: CapacityWorkloadManagerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTherapist, setSelectedTherapist] = useState<string | undefined>(therapistId)
  const [overview, setOverview] = useState<TherapistOverview[]>([])
  const [capacityConfig, setCapacityConfig] = useState<CapacityConfig | null>(null)
  const [workloadData, setWorkloadData] = useState<WorkloadData | null>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)

  // Form state for capacity configuration
  const [configForm, setConfigForm] = useState({
    maxSessionsPerDay: 8,
    maxSessionsPerWeek: 40,
    maxSessionsPerMonth: 160,
    maxHoursPerDay: 8,
    maxHoursPerWeek: 40,
    preferredSessionDuration: 60,
    breakTimeBetweenSessions: 15,
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    isActive: true
  })

  // Load data
  useEffect(() => {
    loadOverview()
  }, [selectedTherapist])

  const loadOverview = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedTherapist) params.append('therapistId', selectedTherapist)

      const response = await fetch(`/api/sessions/capacity-workload?action=overview&${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load overview')
      }

      setOverview(result.data.overview)
      
      if (selectedTherapist && result.data.overview.length > 0) {
        const therapistData = result.data.overview[0]
        setCapacityConfig(therapistData.capacity)
        setWorkloadData(therapistData.workload)
        setAlerts(therapistData.alerts)
        
        // Update form with current config
        setConfigForm({
          maxSessionsPerDay: therapistData.capacity.maxSessionsPerDay,
          maxSessionsPerWeek: therapistData.capacity.maxSessionsPerWeek,
          maxSessionsPerMonth: therapistData.capacity.maxSessionsPerMonth,
          maxHoursPerDay: therapistData.capacity.maxHoursPerDay,
          maxHoursPerWeek: therapistData.capacity.maxHoursPerWeek,
          preferredSessionDuration: therapistData.capacity.preferredSessionDuration,
          breakTimeBetweenSessions: therapistData.capacity.breakTimeBetweenSessions,
          workingDays: therapistData.capacity.workingDays,
          isActive: therapistData.capacity.isActive
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load overview'
      setError(errorMessage)
      console.error('Error loading overview:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const dateTo = new Date().toISOString()

      const response = await fetch(`/api/sessions/capacity-workload?action=analytics&dateFrom=${dateFrom}&dateTo=${dateTo}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load analytics')
      }

      setAnalytics(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load analytics'
      setError(errorMessage)
      console.error('Error loading analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!selectedTherapist) {
      toast.error('Please select a therapist')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/capacity-workload?action=config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId: selectedTherapist,
          ...configForm
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save configuration')
      }

      toast.success('Capacity configuration saved successfully')
      
      if (onConfigUpdate) {
        onConfigUpdate(result.data.config)
      }

      loadOverview()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error saving configuration:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeWorkload = async () => {
    if (!selectedTherapist) {
      toast.error('Please select a therapist')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const dateTo = new Date().toISOString()

      const response = await fetch('/api/sessions/capacity-workload?action=analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId: selectedTherapist,
          dateFrom,
          dateTo,
          includeProjections: true
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze workload')
      }

      if (onWorkloadAnalysis) {
        onWorkloadAnalysis(result.data)
      }

      toast.success('Workload analysis completed')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze workload'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error analyzing workload:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOptimizeCapacity = async (optimizationType: string) => {
    if (!selectedTherapist) {
      toast.error('Please select a therapist')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/capacity-workload?action=optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId: selectedTherapist,
          optimizationType,
          constraints: {}
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to optimize capacity')
      }

      toast.success('Capacity optimization completed')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize capacity'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error optimizing capacity:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleWorkingDay = (day: number) => {
    setConfigForm(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }))
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

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[day]
  }

  if (loading && overview.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading capacity and workload data...</span>
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
            <Users className="h-5 w-5 mr-2" />
            Capacity & Workload Management
          </CardTitle>
          <CardDescription>
            Manage therapist capacity and monitor workload distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <Label className="text-sm font-medium">Therapist</Label>
                <Select 
                  value={selectedTherapist || ''} 
                  onValueChange={setSelectedTherapist}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a therapist" />
                  </SelectTrigger>
                  <SelectContent>
                    {overview.map((item) => (
                      <SelectItem key={item.therapist.id} value={item.therapist.id}>
                        {item.therapist.firstName} {item.therapist.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadOverview}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={loadAnalytics}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
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
                >90% utilization
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
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

        {/* Capacity Tab */}
        <TabsContent value="capacity" className="space-y-4">
          {selectedTherapist ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Capacity Configuration
                </CardTitle>
                <CardDescription>
                  Configure capacity limits and working preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="maxSessionsPerDay">Max Sessions Per Day</Label>
                    <Input
                      id="maxSessionsPerDay"
                      type="number"
                      min="1"
                      max="20"
                      value={configForm.maxSessionsPerDay}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, maxSessionsPerDay: parseInt(e.target.value) || 8 }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxSessionsPerWeek">Max Sessions Per Week</Label>
                    <Input
                      id="maxSessionsPerWeek"
                      type="number"
                      min="1"
                      max="50"
                      value={configForm.maxSessionsPerWeek}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, maxSessionsPerWeek: parseInt(e.target.value) || 40 }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxSessionsPerMonth">Max Sessions Per Month</Label>
                    <Input
                      id="maxSessionsPerMonth"
                      type="number"
                      min="1"
                      max="200"
                      value={configForm.maxSessionsPerMonth}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, maxSessionsPerMonth: parseInt(e.target.value) || 160 }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxHoursPerDay">Max Hours Per Day</Label>
                    <Input
                      id="maxHoursPerDay"
                      type="number"
                      min="1"
                      max="12"
                      value={configForm.maxHoursPerDay}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, maxHoursPerDay: parseInt(e.target.value) || 8 }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="maxHoursPerWeek">Max Hours Per Week</Label>
                    <Input
                      id="maxHoursPerWeek"
                      type="number"
                      min="1"
                      max="60"
                      value={configForm.maxHoursPerWeek}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, maxHoursPerWeek: parseInt(e.target.value) || 40 }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredSessionDuration">Preferred Session Duration (minutes)</Label>
                    <Input
                      id="preferredSessionDuration"
                      type="number"
                      min="15"
                      max="480"
                      value={configForm.preferredSessionDuration}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, preferredSessionDuration: parseInt(e.target.value) || 60 }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="breakTimeBetweenSessions">Break Time Between Sessions (minutes)</Label>
                    <Input
                      id="breakTimeBetweenSessions"
                      type="number"
                      min="0"
                      max="60"
                      value={configForm.breakTimeBetweenSessions}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, breakTimeBetweenSessions: parseInt(e.target.value) || 15 }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Working Days</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <Button
                        key={day}
                        variant={configForm.workingDays.includes(day) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleWorkingDay(day)}
                      >
                        {getDayName(day).substring(0, 3)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={configForm.isActive}
                    onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>Active Configuration</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={loadOverview}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveConfig} disabled={loading}>
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Therapist</h3>
                <p className="text-muted-foreground">
                  Please select a therapist to configure their capacity settings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Workload Tab */}
        <TabsContent value="workload" className="space-y-4">
          {selectedTherapist && workloadData ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Workload Analysis
                  </CardTitle>
                  <CardDescription>
                    Current workload statistics and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{workloadData.totalSessions}</div>
                      <div className="text-sm text-muted-foreground">Total Sessions</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{workloadData.totalHours.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Total Hours</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{workloadData.averageSessionDuration.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">Avg Duration (min)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={handleAnalyzeWorkload} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4 mr-2" />
                  )}
                  Analyze Workload
                </Button>
                <Button variant="outline" onClick={() => handleOptimizeCapacity('BALANCE_WORKLOAD')}>
                  <Zap className="h-4 w-4 mr-2" />
                  Optimize Workload
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Workload Data</h3>
                <p className="text-muted-foreground">
                  Please select a therapist to view their workload analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
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
                <div className="space-y-4">
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
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
                  <p className="text-muted-foreground">
                    Click the Analytics button to load system-wide analytics.
                  </p>
                </div>
              )}
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
