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
  LineChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Plus,
  Minus,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  Clock,
  User,
  Users,
  Shield,
  AlertTriangle,
  Edit,
  Trash2,
  Copy,
  Move,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Maximize,
  Minimize,
  ExternalLink,
  Link,
  Share,
  Bookmark,
  Flag,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  Percent,
  Home,
  Settings,
  Bell,
  Menu,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Stop,
  RotateCcw,
  Square,
  CheckSquare,
  Crown,
  Trophy,
  Medal,
  Award,
  BookOpen,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Star,
  Heart,
  Flame,
  Sparkles,
  Globe,
  Building,
  Key,
  Lock,
  Unlock,
  Database,
  Server,
  Code,
  Timer,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserCog,
  Zap,
  Brain,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon,
  Lightbulb,
  BookmarkCheck,
  ClipboardCheck,
  FileCheck,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart,
  PieChart,
  Activity as ActivityIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface ProgressMetricsDashboardProps {
  patientId?: string
  therapistId?: string
  onMetricAdded?: (metric: any) => void
}

interface MetricData {
  id: string
  value: number | string | boolean
  measurementDate: string
  measurementTime?: string
  context?: string
  notes?: string
  isValidated: boolean
  status: 'active' | 'archived' | 'flagged' | 'corrected'
  isBaseline: boolean
  metric: {
    id: string
    name: string
    type: 'numeric' | 'scale' | 'boolean' | 'text' | 'percentage'
    unit?: string
    minValue?: number
    maxValue?: number
  }
}

interface AnalyticsData {
  summary: {
    totalMeasurements: number
    dateRange: {
      start: string | null
      end: string | null
    }
  }
  statistics?: {
    mean: number
    median: number
    min: number
    max: number
    standardDeviation: number
  }
  trends?: any
  byMetric?: any
}

export function ProgressMetricsDashboard({
  patientId,
  therapistId,
  onMetricAdded
}: ProgressMetricsDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Data state
  const [metrics, setMetrics] = useState<MetricData[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [availableMetrics, setAvailableMetrics] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [therapists, setTherapists] = useState<any[]>([])
  
  // Filters
  const [filters, setFilters] = useState({
    patientId: patientId || '',
    therapistId: therapistId || '',
    metricId: '',
    startDate: '',
    endDate: '',
    status: '',
    isValidated: '',
    isBaseline: ''
  })
  
  // New metric form
  const [newMetric, setNewMetric] = useState({
    patientId: patientId || '',
    therapistId: therapistId || '',
    metricId: '',
    value: '',
    measurementDate: new Date().toISOString().split('T')[0],
    measurementTime: '',
    context: '',
    notes: '',
    isBaseline: false
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (filters.patientId || filters.therapistId) {
      loadMetrics()
      loadAnalytics()
    }
  }, [filters])

  const loadInitialData = async () => {
    try {
      // Load patients
      const patientsResponse = await fetch('/api/patients?limit=100')
      const patientsResult = await patientsResponse.json()
      if (patientsResponse.ok) {
        setPatients(patientsResult.data.patients || [])
      }

      // Load therapists
      const therapistsResponse = await fetch('/api/therapist?limit=100')
      const therapistsResult = await therapistsResponse.json()
      if (therapistsResponse.ok) {
        setTherapists(therapistsResult.data.therapists || [])
      }

      // Load available metrics
      const metricsResponse = await fetch('/api/therapeutic-plans?limit=100')
      const metricsResult = await metricsResponse.json()
      if (metricsResponse.ok) {
        const allMetrics = metricsResult.data.plans.flatMap((plan: any) => 
          plan.objectives.flatMap((obj: any) => obj.metrics || [])
        )
        setAvailableMetrics(allMetrics)
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const loadMetrics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value)
        }
      })

      const response = await fetch(`/api/progress-metrics?${params}`)
      const result = await response.json()

      if (response.ok) {
        setMetrics(result.data.metrics || [])
      } else {
        setError(result.error || 'Failed to load metrics')
      }
    } catch (err) {
      setError('Failed to load metrics')
      console.error('Error loading metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const params = new URLSearchParams()
      
      if (filters.patientId) params.append('patientId', filters.patientId)
      if (filters.therapistId) params.append('therapistId', filters.therapistId)
      if (filters.metricId) params.append('metricId', filters.metricId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      
      params.append('action', 'analytics')
      params.append('includeTrends', 'true')
      params.append('includeStatistics', 'true')

      const response = await fetch(`/api/progress-metrics?${params}`)
      const result = await response.json()

      if (response.ok) {
        setAnalytics(result.data)
      } else {
        console.error('Failed to load analytics:', result.error)
      }
    } catch (err) {
      console.error('Error loading analytics:', err)
    }
  }

  const handleAddMetric = async () => {
    if (!newMetric.patientId || !newMetric.therapistId || !newMetric.metricId || !newMetric.value) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/progress-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMetric)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add metric')
      }

      toast.success('Metric added successfully')
      
      // Reset form
      setNewMetric({
        patientId: patientId || '',
        therapistId: therapistId || '',
        metricId: '',
        value: '',
        measurementDate: new Date().toISOString().split('T')[0],
        measurementTime: '',
        context: '',
        notes: '',
        isBaseline: false
      })

      // Reload data
      loadMetrics()
      loadAnalytics()

      if (onMetricAdded) {
        onMetricAdded(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add metric'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error adding metric:', err)
    } finally {
      setLoading(false)
    }
  }

  const getMetricTypeColor = (type: string) => {
    switch (type) {
      case 'numeric': return 'bg-blue-100 text-blue-800'
      case 'scale': return 'bg-green-100 text-green-800'
      case 'boolean': return 'bg-purple-100 text-purple-800'
      case 'text': return 'bg-orange-100 text-orange-800'
      case 'percentage': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      case 'flagged': return 'bg-red-100 text-red-800'
      case 'corrected': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatMetricValue = (value: any, type: string, unit?: string) => {
    if (type === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (type === 'percentage') {
      return `${value}%`
    }
    if (unit && typeof value === 'number') {
      return `${value} ${unit}`
    }
    return value
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Progress Metrics Dashboard
              </CardTitle>
              <CardDescription>
                Track and visualize patient progress metrics with comprehensive validation
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={loadMetrics}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="add">Add Metric</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Measurements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.summary.totalMeasurements || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All time measurements
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.filter(m => m.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Validated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.filter(m => m.isValidated).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Quality assured
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Baseline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.filter(m => m.isBaseline).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseline measurements
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          {analytics?.statistics && (
            <Card>
              <CardHeader>
                <CardTitle>Statistical Summary</CardTitle>
                <CardDescription>
                  Key statistics for numeric metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.statistics.mean.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Mean</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.statistics.median.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Median</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.statistics.min}</div>
                    <div className="text-sm text-muted-foreground">Minimum</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.statistics.max}</div>
                    <div className="text-sm text-muted-foreground">Maximum</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analytics.statistics.standardDeviation.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Std Dev</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Patient</Label>
                  <Select value={filters.patientId} onValueChange={(value) => setFilters(prev => ({ ...prev, patientId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Therapist</Label>
                  <Select value={filters.therapistId} onValueChange={(value) => setFilters(prev => ({ ...prev, therapistId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select therapist" />
                    </SelectTrigger>
                    <SelectContent>
                      {therapists.map((therapist) => (
                        <SelectItem key={therapist.id} value={therapist.id}>
                          {therapist.firstName} {therapist.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metrics List */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Metrics</CardTitle>
              <CardDescription>
                View and manage progress metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading metrics...</p>
                </div>
              ) : metrics.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Metrics Found</h3>
                  <p className="text-muted-foreground">
                    No progress metrics found for the selected filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {metrics.map((metric) => (
                    <motion.div
                      key={metric.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getMetricTypeColor(metric.metric.type)}>
                            {metric.metric.type}
                          </Badge>
                          <Badge className={getStatusColor(metric.status)}>
                            {metric.status}
                          </Badge>
                          {metric.isValidated && (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Validated
                            </Badge>
                          )}
                          {metric.isBaseline && (
                            <Badge variant="outline">
                              <Target className="h-3 w-3 mr-1" />
                              Baseline
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(metric.measurementDate).toLocaleDateString()}
                          {metric.measurementTime && ` at ${metric.measurementTime}`}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Metric</Label>
                          <div className="text-lg font-semibold">{metric.metric.name}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Value</Label>
                          <div className="text-lg font-semibold">
                            {formatMetricValue(metric.value, metric.metric.type, metric.metric.unit)}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Context</Label>
                          <div className="text-sm">{metric.context || 'No context provided'}</div>
                        </div>
                      </div>
                      
                      {metric.notes && (
                        <div>
                          <Label className="text-sm font-medium">Notes</Label>
                          <div className="text-sm text-muted-foreground">{metric.notes}</div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Trends</CardTitle>
              <CardDescription>
                Visualize progress trends and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics ? (
                <div className="space-y-6">
                  {/* Date Range */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Date Range</h3>
                    <p className="text-muted-foreground">
                      {analytics.summary.dateRange.start && analytics.summary.dateRange.end
                        ? `${new Date(analytics.summary.dateRange.start).toLocaleDateString()} - ${new Date(analytics.summary.dateRange.end).toLocaleDateString()}`
                        : 'No data available'
                      }
                    </p>
                  </div>

                  {/* Trends by Metric */}
                  {analytics.byMetric && Object.keys(analytics.byMetric).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Trends by Metric</h3>
                      <div className="space-y-4">
                        {Object.entries(analytics.byMetric).map(([metricId, data]: [string, any]) => (
                          <div key={metricId} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{data.metric.name}</h4>
                              <Badge className={getMetricTypeColor(data.metric.type)}>
                                {data.metric.type}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {data.measurements.length} measurements
                            </div>
                            {/* Simple trend visualization */}
                            <div className="flex items-end space-x-1 h-20">
                              {data.measurements.slice(-10).map((measurement: any, index: number) => {
                                if (typeof measurement.value !== 'number') return null
                                const maxValue = Math.max(...data.measurements.map((m: any) => m.value).filter((v: any) => typeof v === 'number'))
                                const height = (measurement.value / maxValue) * 100
                                return (
                                  <div
                                    key={index}
                                    className="bg-primary rounded-t"
                                    style={{ height: `${height}%`, width: '20px' }}
                                    title={`${measurement.value} on ${new Date(measurement.measurementDate).toLocaleDateString()}`}
                                  />
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
                  <p className="text-muted-foreground">
                    Select filters to view analytics and trends.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Metric Tab */}
        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Progress Metric</CardTitle>
              <CardDescription>
                Add a new progress metric measurement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient">Patient *</Label>
                  <Select value={newMetric.patientId} onValueChange={(value) => setNewMetric(prev => ({ ...prev, patientId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="therapist">Therapist *</Label>
                  <Select value={newMetric.therapistId} onValueChange={(value) => setNewMetric(prev => ({ ...prev, therapistId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select therapist" />
                    </SelectTrigger>
                    <SelectContent>
                      {therapists.map((therapist) => (
                        <SelectItem key={therapist.id} value={therapist.id}>
                          {therapist.firstName} {therapist.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="metric">Metric *</Label>
                <Select value={newMetric.metricId} onValueChange={(value) => setNewMetric(prev => ({ ...prev, metricId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMetrics.map((metric) => (
                      <SelectItem key={metric.id} value={metric.id}>
                        {metric.name} ({metric.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="measurementDate">Measurement Date *</Label>
                  <Input
                    id="measurementDate"
                    type="date"
                    value={newMetric.measurementDate}
                    onChange={(e) => setNewMetric(prev => ({ ...prev, measurementDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="measurementTime">Measurement Time</Label>
                  <Input
                    id="measurementTime"
                    type="time"
                    value={newMetric.measurementTime}
                    onChange={(e) => setNewMetric(prev => ({ ...prev, measurementTime: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="value">Value *</Label>
                <Input
                  id="value"
                  value={newMetric.value}
                  onChange={(e) => setNewMetric(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Enter metric value"
                />
              </div>
              
              <div>
                <Label htmlFor="context">Context</Label>
                <Input
                  id="context"
                  value={newMetric.context}
                  onChange={(e) => setNewMetric(prev => ({ ...prev, context: e.target.value }))}
                  placeholder="Enter measurement context"
                  maxLength={500}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newMetric.notes}
                  onChange={(e) => setNewMetric(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter additional notes"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isBaseline"
                  checked={newMetric.isBaseline}
                  onChange={(e) => setNewMetric(prev => ({ ...prev, isBaseline: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="isBaseline">Mark as baseline measurement</Label>
              </div>
              
              <Button onClick={handleAddMetric} disabled={loading} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Adding...' : 'Add Metric'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
