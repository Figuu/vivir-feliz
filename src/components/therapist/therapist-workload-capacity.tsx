'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Activity,
  Target,
  Zap,
  PieChart,
  LineChart,
  BarChart,
  RefreshCw,
  Settings,
  Download,
  Upload,
  Bell,
  Eye,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  Filter,
  Search,
  Info,
  AlertCircle,
  User,
  Timer,
  Heart,
  Star,
  Globe,
  Building,
  Shield,
  BookOpen,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Stop,
  RotateCcw,
  Copy,
  Move,
  GripVertical,
  Square,
  CheckSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface WorkloadData {
  therapist: Therapist
  dailyWorkload: { [key: string]: any }
  totalSessions: number
  totalHours: number
  totalRevenue: number
  averageSessionDuration: number
  utilizationRate: number
  capacityUtilization: number
  workloadTrend: Array<{
    date: string
    sessions: number
    hours: number
    revenue: number
    utilization: number
  }>
  capacityAlerts: Array<{
    type: string
    date: string
    message: string
    severity: string
  }>
}

interface CapacityProjections {
  nextWeek: {
    estimatedSessions: number
    estimatedHours: number
    estimatedRevenue: number
    capacityUtilization: number
  }
  nextMonth: {
    estimatedSessions: number
    estimatedHours: number
    estimatedRevenue: number
    capacityUtilization: number
  }
}

interface WorkloadAlert {
  therapistId: string
  therapistName: string
  type: string
  message: string
  severity: string
}

interface TherapistWorkloadCapacityProps {
  therapistId?: string
  onWorkloadUpdate?: (workload: WorkloadData[]) => void
  onCapacityUpdate?: (capacity: any) => void
}

export function TherapistWorkloadCapacity({
  therapistId,
  onWorkloadUpdate,
  onCapacityUpdate
}: TherapistWorkloadCapacityProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workloadData, setWorkloadData] = useState<WorkloadData[]>([])
  const [projections, setProjections] = useState<CapacityProjections | null>(null)
  const [alerts, setAlerts] = useState<WorkloadAlert[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('week')
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>(therapistId || '')
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [editingCapacity, setEditingCapacity] = useState<{ therapistId: string; date: string } | null>(null)
  const [capacityForm, setCapacityForm] = useState({
    maxSessions: 8,
    maxHours: 8,
    sessionDuration: 60,
    bufferTime: 15,
    breakTime: 60,
    workingHours: 8,
    capacityNotes: ''
  })

  // Load workload data
  useEffect(() => {
    if (selectedTherapistId || therapistId) {
      loadWorkloadData()
    }
  }, [selectedTherapistId, selectedPeriod, therapistId])

  // Load therapists list
  useEffect(() => {
    loadTherapists()
  }, [])

  const loadTherapists = async () => {
    try {
      const response = await fetch('/api/therapist/profile?limit=100')
      const result = await response.json()
      if (response.ok) {
        setTherapists(result.data.therapists)
        if (!selectedTherapistId && result.data.therapists.length > 0) {
          setSelectedTherapistId(result.data.therapists[0].id)
        }
      }
    } catch (err) {
      console.error('Error loading therapists:', err)
    }
  }

  const loadWorkloadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedTherapistId) {
        params.append('therapistId', selectedTherapistId)
      }
      params.append('period', selectedPeriod)
      params.append('includeProjections', 'true')
      params.append('includeAlerts', 'true')

      const response = await fetch(`/api/therapist/workload-capacity?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load workload data')
      }

      setWorkloadData(result.data.workload)
      setProjections(result.data.projections)
      setAlerts(result.data.alerts)
      setSummary(result.data.summary)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load workload data'
      setError(errorMessage)
      console.error('Error loading workload data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCapacityUpdate = async () => {
    if (!editingCapacity) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/workload-capacity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId: editingCapacity.therapistId,
          date: editingCapacity.date,
          ...capacityForm
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update capacity')
      }

      toast.success('Capacity settings updated successfully')
      setEditingCapacity(null)
      loadWorkloadData()
      
      if (onCapacityUpdate) {
        onCapacityUpdate(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update capacity'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error updating capacity:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600'
    if (utilization >= 75) return 'text-yellow-600'
    if (utilization >= 50) return 'text-green-600'
    return 'text-blue-600'
  }

  const getUtilizationBgColor = (utilization: number) => {
    if (utilization >= 90) return 'bg-red-100'
    if (utilization >= 75) return 'bg-yellow-100'
    if (utilization >= 50) return 'bg-green-100'
    return 'bg-blue-100'
  }

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading && !workloadData.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Loading workload data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Workload Data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadWorkloadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Workload & Capacity Tracking
              </CardTitle>
              <CardDescription>
                Monitor therapist workload and capacity utilization
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadWorkloadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="therapist">Therapist</Label>
              <Select value={selectedTherapistId} onValueChange={setSelectedTherapistId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select therapist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Therapists</SelectItem>
                  {therapists.map((therapist) => (
                    <SelectItem key={therapist.id} value={therapist.id}>
                      {therapist.firstName} {therapist.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="period">Period</Label>
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadWorkloadData} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Load Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Therapists</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalTherapists}</div>
              <p className="text-xs text-muted-foreground">
                Active therapists
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                {summary.averageSessionsPerTherapist} avg per therapist
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                {summary.averageHoursPerTherapist.toFixed(1)}h avg per therapist
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {summary.averageUtilization}% avg utilization
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="therapists">Therapists</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utilization Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Utilization Overview
                </CardTitle>
                <CardDescription>
                  Current capacity utilization across all therapists
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workloadData.map((therapist) => (
                    <motion.div
                      key={therapist.therapist.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getUtilizationBgColor(therapist.utilizationRate)}`}>
                          <Activity className={`h-4 w-4 ${getUtilizationColor(therapist.utilizationRate)}`} />
                        </div>
                        <div>
                          <div className="font-medium">
                            {therapist.therapist.firstName} {therapist.therapist.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {therapist.totalSessions} sessions, {therapist.totalHours.toFixed(1)}h
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${getUtilizationColor(therapist.utilizationRate)}`}>
                          {Math.round(therapist.utilizationRate)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          utilization
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Capacity Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Capacity Alerts
                </CardTitle>
                <CardDescription>
                  Recent capacity and workload alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((alert, index) => (
                      <Alert key={index} className={getAlertSeverityColor(alert.severity)}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="font-medium">{alert.therapistName}</div>
                          <div className="text-sm">{alert.message}</div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
                    <p className="text-muted-foreground">
                      No capacity or workload alerts at this time.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Therapists Tab */}
        <TabsContent value="therapists" className="space-y-4">
          <div className="space-y-4">
            {workloadData.map((therapist) => (
              <Card key={therapist.therapist.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        {therapist.therapist.firstName} {therapist.therapist.lastName}
                      </CardTitle>
                      <CardDescription>
                        {therapist.therapist.email}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getUtilizationBgColor(therapist.utilizationRate)}>
                        {Math.round(therapist.utilizationRate)}% utilized
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCapacity({ 
                          therapistId: therapist.therapist.id, 
                          date: new Date().toISOString().split('T')[0] 
                        })}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Total Sessions</div>
                      <div className="text-2xl font-bold">{therapist.totalSessions}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Total Hours</div>
                      <div className="text-2xl font-bold">{therapist.totalHours.toFixed(1)}h</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
                      <div className="text-2xl font-bold">{formatCurrency(therapist.totalRevenue)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Avg Session Duration</div>
                      <div className="text-2xl font-bold">{formatDuration(therapist.averageSessionDuration * 60)}</div>
                    </div>
                  </div>
                  
                  {therapist.capacityAlerts.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Capacity Alerts:</div>
                      <div className="space-y-1">
                        {therapist.capacityAlerts.map((alert, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            • {formatDate(alert.date)}: {alert.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Projections Tab */}
        <TabsContent value="projections" className="space-y-4">
          {projections && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Next Week Projections
                  </CardTitle>
                  <CardDescription>
                    Estimated workload for the next 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Estimated Sessions</div>
                          <div className="text-sm text-muted-foreground">Next 7 days</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{Math.round(projections.nextWeek.estimatedSessions)}</div>
                        <div className="text-sm text-muted-foreground">sessions</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <Clock className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Estimated Hours</div>
                          <div className="text-sm text-muted-foreground">Next 7 days</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{projections.nextWeek.estimatedHours.toFixed(1)}h</div>
                        <div className="text-sm text-muted-foreground">hours</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-purple-100">
                          <DollarSign className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">Estimated Revenue</div>
                          <div className="text-sm text-muted-foreground">Next 7 days</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{formatCurrency(projections.nextWeek.estimatedRevenue)}</div>
                        <div className="text-sm text-muted-foreground">revenue</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Next Month Projections
                  </CardTitle>
                  <CardDescription>
                    Estimated workload for the next 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Estimated Sessions</div>
                          <div className="text-sm text-muted-foreground">Next 30 days</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{Math.round(projections.nextMonth.estimatedSessions)}</div>
                        <div className="text-sm text-muted-foreground">sessions</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <Clock className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Estimated Hours</div>
                          <div className="text-sm text-muted-foreground">Next 30 days</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{projections.nextMonth.estimatedHours.toFixed(1)}h</div>
                        <div className="text-sm text-muted-foreground">hours</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-purple-100">
                          <DollarSign className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">Estimated Revenue</div>
                          <div className="text-sm text-muted-foreground">Next 30 days</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{formatCurrency(projections.nextMonth.estimatedRevenue)}</div>
                        <div className="text-sm text-muted-foreground">revenue</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Workload Alerts
              </CardTitle>
              <CardDescription>
                Capacity and workload alerts for all therapists
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <Alert key={index} className={getAlertSeverityColor(alert.severity)}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{alert.therapistName}</div>
                            <div className="text-sm">{alert.message}</div>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {alert.type.replace('_', ' ')}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Alerts</h3>
                  <p className="text-muted-foreground">
                    No workload or capacity alerts at this time.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Capacity Edit Dialog */}
      {editingCapacity && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader>
            <CardTitle>Edit Capacity Settings</CardTitle>
            <CardDescription>
              Update capacity settings for {formatDate(editingCapacity.date)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxSessions">Max Sessions</Label>
                  <Input
                    id="maxSessions"
                    type="number"
                    value={capacityForm.maxSessions}
                    onChange={(e) => setCapacityForm(prev => ({ ...prev, maxSessions: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="20"
                  />
                </div>
                <div>
                  <Label htmlFor="maxHours">Max Hours</Label>
                  <Input
                    id="maxHours"
                    type="number"
                    value={capacityForm.maxHours}
                    onChange={(e) => setCapacityForm(prev => ({ ...prev, maxHours: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="24"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="sessionDuration">Session Duration (min)</Label>
                  <Input
                    id="sessionDuration"
                    type="number"
                    value={capacityForm.sessionDuration}
                    onChange={(e) => setCapacityForm(prev => ({ ...prev, sessionDuration: parseInt(e.target.value) || 60 }))}
                    min="15"
                    max="300"
                  />
                </div>
                <div>
                  <Label htmlFor="bufferTime">Buffer Time (min)</Label>
                  <Input
                    id="bufferTime"
                    type="number"
                    value={capacityForm.bufferTime}
                    onChange={(e) => setCapacityForm(prev => ({ ...prev, bufferTime: parseInt(e.target.value) || 15 }))}
                    min="0"
                    max="60"
                  />
                </div>
                <div>
                  <Label htmlFor="breakTime">Break Time (min)</Label>
                  <Input
                    id="breakTime"
                    type="number"
                    value={capacityForm.breakTime}
                    onChange={(e) => setCapacityForm(prev => ({ ...prev, breakTime: parseInt(e.target.value) || 60 }))}
                    min="0"
                    max="480"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="capacityNotes">Notes</Label>
                <Textarea
                  id="capacityNotes"
                  value={capacityForm.capacityNotes}
                  onChange={(e) => setCapacityForm(prev => ({ ...prev, capacityNotes: e.target.value }))}
                  placeholder="Capacity notes..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-end space-x-2">
                <Button variant="outline" onClick={() => setEditingCapacity(null)}>
                  Cancel
                </Button>
                <Button onClick={handleCapacityUpdate} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
