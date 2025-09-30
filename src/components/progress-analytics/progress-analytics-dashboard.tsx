'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  LineChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  Download,
  Settings,
  Plus,
  Minus,
  Edit,
  Trash2,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Maximize,
  Minimize,
  ExternalLink,
  Link,
  Share,
  Bookmark,
  Flag,
  Tag,
  Hash,
  AtSignAt,
  DollarSign,
  Percent,
  Home,
  Menu,
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
  Zap,
  Brain,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  Lightbulb,
  BookmarkCheck,
  ClipboardCheck,
  FileCheck,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity as ActivityIcon,
  Type,
  Hash as HashIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckSquare as CheckSquareIcon,
  Circle,
  Upload as UploadIcon,
  PenTool,
  Send,
  Reply,
  Quote,
  Pin,
  Archive,
  Trash2 as Trash2Icon,
  Copy,
  Move,
  GripVertical,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface ProgressAnalyticsDashboardProps {
  patientId?: string
  therapistId?: string
  onAnalyticsGenerated?: (analytics: any) => void
}

interface AnalyticsData {
  overview?: {
    totalEntries: number
    averageProgress: number
    progressTrend: string
    goalCompletionRate: number
    totalGoals: number
    completedGoals: number
  }
  distributions?: {
    progress: any
    entryType: any
    validationStatus: any
    riskLevel: any
  }
  trends?: any[]
  trendAnalysis?: any
  comparison?: any
  insights?: string[]
  metadata?: {
    generatedAt: string
    parameters: any
    dataRange: any
    filters: any
  }
}

export function ProgressAnalyticsDashboard({
  patientId,
  therapistId,
  onAnalyticsGenerated
}: ProgressAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Data state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [therapists, setTherapists] = useState<any[]>([])
  
  // Filters
  const [filters, setFilters] = useState({
    patientId: patientId || '',
    therapistId: therapistId || '',
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    analyticsType: 'overview',
    groupBy: 'week',
    comparisonPeriod: 'previous_period',
    includePredictions: false,
    includeCorrelations: false,
    includeOutliers: false,
    includeBenchmarks: false
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (filters.patientId || filters.therapistId) {
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
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== false) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','))
          } else {
            params.append(key, value.toString())
          }
        }
      })

      const response = await fetch(`/api/progress-analytics?${params}`)
      const result = await response.json()

      if (response.ok) {
        setAnalytics(result.data)
        if (onAnalyticsGenerated) {
          onAnalyticsGenerated(result.data)
        }
      } else {
        setError(result.error || 'Failed to load analytics')
      }
    } catch (err) {
      setError('Failed to load analytics')
      console.error('Error loading analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'stable': return <Activity className="h-4 w-4 text-blue-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600'
      case 'declining': return 'text-red-600'
      case 'stable': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getValidationStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'validated': return 'bg-green-100 text-green-800'
      case 'flagged': return 'bg-red-100 text-red-800'
      case 'requires_review': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Progress Analytics & Insights
              </CardTitle>
              <CardDescription>
                Comprehensive analytics and insights for patient progress tracking
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={loadAnalytics}>
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
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Patient</Label>
              <Select value={filters.patientId} onValueChange={(value) => handleFilterChange('patientId', value)}>
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
              <Select value={filters.therapistId} onValueChange={(value) => handleFilterChange('therapistId', value)}>
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
              <Label>Analytics Type</Label>
              <Select value={filters.analyticsType} onValueChange={(value) => handleFilterChange('analyticsType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="trends">Trends</SelectItem>
                  <SelectItem value="comparative">Comparative</SelectItem>
                  <SelectItem value="predictive">Predictive</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="risk_analysis">Risk Analysis</SelectItem>
                  <SelectItem value="goal_analysis">Goal Analysis</SelectItem>
                  <SelectItem value="therapist_performance">Therapist Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Group By</Label>
              <Select value={filters.groupBy} onValueChange={(value) => handleFilterChange('groupBy', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                max={filters.endDate}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={filters.startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>Comparison Period</Label>
              <Select value={filters.comparisonPeriod} onValueChange={(value) => handleFilterChange('comparisonPeriod', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous_period">Previous Period</SelectItem>
                  <SelectItem value="same_period_last_year">Same Period Last Year</SelectItem>
                  <SelectItem value="baseline">Baseline</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includePredictions"
                checked={filters.includePredictions}
                onCheckedChange={(checked) => handleFilterChange('includePredictions', checked)}
              />
              <Label htmlFor="includePredictions">Include Predictions</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCorrelations"
                checked={filters.includeCorrelations}
                onCheckedChange={(checked) => handleFilterChange('includeCorrelations', checked)}
              />
              <Label htmlFor="includeCorrelations">Include Correlations</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeOutliers"
                checked={filters.includeOutliers}
                onCheckedChange={(checked) => handleFilterChange('includeOutliers', checked)}
              />
              <Label htmlFor="includeOutliers">Include Outliers</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeBenchmarks"
                checked={filters.includeBenchmarks}
                onCheckedChange={(checked) => handleFilterChange('includeBenchmarks', checked)}
              />
              <Label htmlFor="includeBenchmarks">Include Benchmarks</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading analytics...</p>
            </div>
          ) : analytics?.overview ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.overview.totalEntries}</div>
                    <p className="text-xs text-muted-foreground">
                      Progress entries
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.overview.averageProgress}%</div>
                    <p className="text-xs text-muted-foreground">
                      Overall progress
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Progress Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(analytics.overview.progressTrend)}
                      <span className={`text-sm font-medium ${getTrendColor(analytics.overview.progressTrend)}`}>
                        {analytics.overview.progressTrend}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Trend direction
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Goal Completion</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.overview.goalCompletionRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.overview.completedGoals} of {analytics.overview.totalGoals} goals
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison */}
              {analytics.comparison && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comparison Analysis</CardTitle>
                    <CardDescription>
                      Comparison with {filters.comparisonPeriod.replace('_', ' ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Progress Change</Label>
                        <div className={`text-lg font-bold ${analytics.comparison.averageProgressChange > 0 ? 'text-green-600' : analytics.comparison.averageProgressChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {analytics.comparison.averageProgressChange > 0 ? '+' : ''}{analytics.comparison.averageProgressChange.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {analytics.comparison.averageProgressChangePercent.toFixed(1)}% change
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Entries Change</Label>
                        <div className={`text-lg font-bold ${analytics.comparison.entriesChange > 0 ? 'text-green-600' : analytics.comparison.entriesChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {analytics.comparison.entriesChange > 0 ? '+' : ''}{analytics.comparison.entriesChange}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {analytics.comparison.entriesChangePercent.toFixed(1)}% change
                        </p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Overall Trend</Label>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(analytics.comparison.trend)}
                          <span className={`text-sm font-medium ${getTrendColor(analytics.comparison.trend)}`}>
                            {analytics.comparison.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
              <p className="text-muted-foreground">
                Select filters to view analytics and insights.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {analytics?.trends ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Progress Trends</CardTitle>
                  <CardDescription>
                    Progress trends grouped by {filters.groupBy}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.trends.map((trend, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{trend.period}</h4>
                          <Badge variant="outline">{trend.entryCount} entries</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-sm font-medium">Average Progress</Label>
                            <div className="text-lg font-bold">{trend.averageProgress}%</div>
                            <Progress value={trend.averageProgress} className="w-full h-2" />
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Goal Completion</Label>
                            <div className="text-lg font-bold">{trend.goalCompletionRate}%</div>
                            <Progress value={trend.goalCompletionRate} className="w-full h-2" />
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Risk Distribution</Label>
                            <div className="space-y-1">
                              {Object.entries(trend.riskDistribution).map(([level, count]) => (
                                <div key={level} className="flex items-center justify-between text-sm">
                                  <span className="capitalize">{level}</span>
                                  <Badge className={getRiskLevelColor(level)}>{count as number}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <LineChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Trend Data</h3>
              <p className="text-muted-foreground">
                Select "trends" analytics type to view trend analysis.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Distributions Tab */}
        <TabsContent value="distributions" className="space-y-4">
          {analytics?.distributions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Progress Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Progress Distribution</CardTitle>
                  <CardDescription>
                    Distribution of progress scores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.distributions.progress).map(([range, count]) => (
                      <div key={range} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{range}%</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={(count as number / analytics.overview!.totalEntries) * 100} className="w-24 h-2" />
                          <span className="text-sm text-muted-foreground w-8">{count as number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Entry Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Entry Type Distribution</CardTitle>
                  <CardDescription>
                    Distribution by entry type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.distributions.entryType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{type}</span>
                        <div className="flex items-center space-x-2">
                          <Progress value={(count as number / analytics.overview!.totalEntries) * 100} className="w-24 h-2" />
                          <span className="text-sm text-muted-foreground w-8">{count as number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Validation Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Validation Status Distribution</CardTitle>
                  <CardDescription>
                    Distribution by validation status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.distributions.validationStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <Badge className={getValidationStatusColor(status)}>
                          {status.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <Progress value={(count as number / analytics.overview!.totalEntries) * 100} className="w-24 h-2" />
                          <span className="text-sm text-muted-foreground w-8">{count as number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Level Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Risk Level Distribution</CardTitle>
                  <CardDescription>
                    Distribution by risk level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.distributions.riskLevel).map(([level, count]) => (
                      <div key={level} className="flex items-center justify-between">
                        <Badge className={getRiskLevelColor(level)}>
                          {level}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <Progress value={(count as number / analytics.overview!.totalEntries) * 100} className="w-24 h-2" />
                          <span className="text-sm text-muted-foreground w-8">{count as number}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Distribution Data</h3>
              <p className="text-muted-foreground">
                Select filters to view distribution analysis.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {analytics?.insights && analytics.insights.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Analytics Insights
                </CardTitle>
                <CardDescription>
                  Key insights and recommendations based on the analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3 p-3 border rounded-lg"
                    >
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Insights Available</h3>
              <p className="text-muted-foreground">
                Generate analytics to view insights and recommendations.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
