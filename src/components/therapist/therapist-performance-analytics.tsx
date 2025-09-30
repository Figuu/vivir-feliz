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
  CheckSquare,
  Award,
  Trophy,
  Medal,
  Crown,
  Flame,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  email: string
  specialties: Array<{
    specialty: {
      id: string
      name: string
      category: string
    }
  }>
}

interface PerformanceData {
  therapist: Therapist
  sessions: Array<{
    id: string
    date: string
    duration: number
    status: string
    revenue: number
    patientSatisfaction?: number
    therapistSatisfaction?: number
    patient: any
    services: any[]
  }>
  totalSessions: number
  completedSessions: number
  cancelledSessions: number
  totalHours: number
  totalRevenue: number
  averageSessionDuration: number
  completionRate: number
  averagePatientSatisfaction: number
  averageTherapistSatisfaction: number
  productivityScore: number
  qualityScore: number
  patientRetentionRate: number
  specialtyPerformance: { [key: string]: any }
  monthlyTrends: Array<{
    month: string
    sessions: number
    completedSessions: number
    revenue: number
    hours: number
    averageSatisfaction: number
    completionRate: number
  }>
  performanceMetrics: {
    sessionsPerDay: number
    revenuePerSession: number
    revenuePerHour: number
    utilizationRate: number
    efficiencyScore: number
  }
}

interface PerformanceComparisons {
  topPerformers: {
    productivity: PerformanceData[]
    quality: PerformanceData[]
    revenue: PerformanceData[]
    satisfaction: PerformanceData[]
  }
  averages: {
    productivity: number
    quality: number
    revenue: number
    satisfaction: number
    completionRate: number
  }
}

interface PerformanceTrends {
  productivity: Array<{
    month: string
    therapistId: string
    therapistName: string
    value: number
  }>
  quality: Array<{
    month: string
    therapistId: string
    therapistName: string
    value: number
  }>
  revenue: Array<{
    month: string
    therapistId: string
    therapistName: string
    value: number
  }>
  satisfaction: Array<{
    month: string
    therapistId: string
    therapistName: string
    value: number
  }>
}

interface PerformanceSummary {
  totalTherapists: number
  totalSessions: number
  totalRevenue: number
  totalHours: number
  averageProductivity: number
  averageQuality: number
  averageSatisfaction: number
  averageCompletionRate: number
  averageRevenuePerTherapist: number
  averageSessionsPerTherapist: number
}

interface TherapistPerformanceAnalyticsProps {
  therapistId?: string
  onPerformanceUpdate?: (performance: PerformanceData[]) => void
  onGoalUpdate?: (goals: any) => void
}

export function TherapistPerformanceAnalytics({
  therapistId,
  onPerformanceUpdate,
  onGoalUpdate
}: TherapistPerformanceAnalyticsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [comparisons, setComparisons] = useState<PerformanceComparisons | null>(null)
  const [trends, setTrends] = useState<PerformanceTrends | null>(null)
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>(therapistId || '')
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalForm, setGoalForm] = useState({
    goalType: 'sessions' as 'sessions' | 'revenue' | 'satisfaction' | 'completion_rate' | 'productivity',
    targetValue: 0,
    targetDate: '',
    description: ''
  })

  // Load performance data
  useEffect(() => {
    if (selectedTherapistId || therapistId) {
      loadPerformanceData()
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

  const loadPerformanceData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedTherapistId) {
        params.append('therapistId', selectedTherapistId)
      }
      params.append('period', selectedPeriod)
      params.append('includeComparisons', 'true')
      params.append('includeTrends', 'true')

      const response = await fetch(`/api/therapist/performance-analytics?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load performance data')
      }

      setPerformanceData(result.data.performance)
      setComparisons(result.data.comparisons)
      setTrends(result.data.trends)
      setSummary(result.data.summary)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load performance data'
      setError(errorMessage)
      console.error('Error loading performance data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async () => {
    if (!selectedTherapistId || !goalForm.targetValue || !goalForm.targetDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please fill in all required fields'
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/performance-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId: selectedTherapistId,
          ...goalForm
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create performance goal')
      }

      toast({
        title: "Success",
        description: 'Performance goal created successfully'
      })
      setShowGoalForm(false)
      setGoalForm({
        goalType: 'sessions',
        targetValue: 0,
        targetDate: '',
        description: ''
      })
      
      if (onGoalUpdate) {
        onGoalUpdate(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create performance goal'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error creating performance goal:', err)
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

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getPerformanceBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    if (score >= 40) return 'bg-orange-100'
    return 'bg-red-100'
  }

  const getPerformanceIcon = (score: number) => {
    if (score >= 90) return <Crown className="h-4 w-4" />
    if (score >= 80) return <Trophy className="h-4 w-4" />
    if (score >= 70) return <Medal className="h-4 w-4" />
    if (score >= 60) return <Award className="h-4 w-4" />
    return <Target className="h-4 w-4" />
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="h-5 w-5 text-yellow-600" />
      case 2: return <Trophy className="h-5 w-5 text-gray-600" />
      case 3: return <Medal className="h-5 w-5 text-orange-600" />
      default: return <Award className="h-5 w-5 text-blue-600" />
    }
  }

  if (loading && !performanceData.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Loading performance data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Performance Data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadPerformanceData}>
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
                Performance Analytics
              </CardTitle>
              <CardDescription>
                Comprehensive therapist performance tracking and analytics
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadPerformanceData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowGoalForm(true)}>
                <Target className="h-4 w-4 mr-2" />
                Set Goal
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
              <Button onClick={loadPerformanceData} className="w-full">
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
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary.averageRevenuePerTherapist)} avg per therapist
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Productivity</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.averageProductivity}%</div>
              <p className="text-xs text-muted-foreground">
                {summary.averageQuality}% quality score
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
          <TabsTrigger value="comparisons">Comparisons</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Performance Overview
                </CardTitle>
                <CardDescription>
                  Key performance indicators and metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceData.slice(0, 5).map((therapist, index) => (
                    <motion.div
                      key={therapist.therapist.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${getPerformanceBgColor(therapist.productivityScore)}`}>
                          {getPerformanceIcon(therapist.productivityScore)}
                        </div>
                        <div>
                          <div className="font-medium">
                            {therapist.therapist.firstName} {therapist.therapist.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {therapist.totalSessions} sessions, {formatCurrency(therapist.totalRevenue)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${getPerformanceColor(therapist.productivityScore)}`}>
                          {Math.round(therapist.productivityScore)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          productivity
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            {comparisons && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>
                    Best performing therapists by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Productivity Leaders</div>
                      <div className="space-y-2">
                        {comparisons.topPerformers.productivity.slice(0, 3).map((therapist, index) => (
                          <div key={therapist.therapist.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                            <div className="flex items-center space-x-2">
                              {getRankIcon(index + 1)}
                              <span className="text-sm font-medium">
                                {therapist.therapist.firstName} {therapist.therapist.lastName}
                              </span>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              {Math.round(therapist.productivityScore)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Quality Leaders</div>
                      <div className="space-y-2">
                        {comparisons.topPerformers.quality.slice(0, 3).map((therapist, index) => (
                          <div key={therapist.therapist.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                            <div className="flex items-center space-x-2">
                              {getRankIcon(index + 1)}
                              <span className="text-sm font-medium">
                                {therapist.therapist.firstName} {therapist.therapist.lastName}
                              </span>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              {Math.round(therapist.qualityScore)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Therapists Tab */}
        <TabsContent value="therapists" className="space-y-4">
          <div className="space-y-4">
            {performanceData.map((therapist) => (
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
                      <Badge className={getPerformanceBgColor(therapist.productivityScore)}>
                        {Math.round(therapist.productivityScore)}% productivity
                      </Badge>
                      <Badge className={getPerformanceBgColor(therapist.qualityScore)}>
                        {Math.round(therapist.qualityScore)}% quality
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Total Sessions</div>
                      <div className="text-2xl font-bold">{therapist.totalSessions}</div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(therapist.completionRate)}% completion rate
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
                      <div className="text-2xl font-bold">{formatCurrency(therapist.totalRevenue)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(therapist.performanceMetrics.revenuePerSession)} per session
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Patient Satisfaction</div>
                      <div className="text-2xl font-bold">{therapist.averagePatientSatisfaction.toFixed(1)}/5</div>
                      <div className="text-xs text-muted-foreground">
                        {therapist.averageTherapistSatisfaction.toFixed(1)}/5 therapist
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Efficiency Score</div>
                      <div className="text-2xl font-bold">{Math.round(therapist.performanceMetrics.efficiencyScore)}%</div>
                      <div className="text-xs text-muted-foreground">
                        {therapist.performanceMetrics.sessionsPerDay.toFixed(1)} sessions/day
                      </div>
                    </div>
                  </div>
                  
                  {/* Specialty Performance */}
                  {Object.keys(therapist.specialtyPerformance).length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Specialty Performance:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(therapist.specialtyPerformance).map(([specialty, data]: [string, any]) => (
                          <div key={specialty} className="p-2 border rounded text-sm">
                            <div className="font-medium">{specialty}</div>
                            <div className="text-muted-foreground">
                              {data.sessions} sessions, {formatCurrency(data.revenue)}, {data.averageSatisfaction.toFixed(1)}/5 satisfaction
                            </div>
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

        {/* Comparisons Tab */}
        <TabsContent value="comparisons" className="space-y-4">
          {comparisons && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Performance Averages
                  </CardTitle>
                  <CardDescription>
                    Average performance across all therapists
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Zap className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Average Productivity</div>
                          <div className="text-sm text-muted-foreground">Overall productivity score</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{Math.round(comparisons.averages.productivity)}%</div>
                        <div className="text-sm text-muted-foreground">productivity</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <Star className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Average Quality</div>
                          <div className="text-sm text-muted-foreground">Overall quality score</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{Math.round(comparisons.averages.quality)}%</div>
                        <div className="text-sm text-muted-foreground">quality</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-purple-100">
                          <Heart className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">Average Satisfaction</div>
                          <div className="text-sm text-muted-foreground">Patient satisfaction</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{comparisons.averages.satisfaction.toFixed(1)}/5</div>
                        <div className="text-sm text-muted-foreground">satisfaction</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-yellow-100">
                          <CheckCircle className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium">Average Completion Rate</div>
                          <div className="text-sm text-muted-foreground">Session completion</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{Math.round(comparisons.averages.completionRate)}%</div>
                        <div className="text-sm text-muted-foreground">completion</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>
                    Best performing therapists by category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Revenue Leaders</div>
                      <div className="space-y-2">
                        {comparisons.topPerformers.revenue.slice(0, 3).map((therapist, index) => (
                          <div key={therapist.therapist.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                            <div className="flex items-center space-x-2">
                              {getRankIcon(index + 1)}
                              <span className="text-sm font-medium">
                                {therapist.therapist.firstName} {therapist.therapist.lastName}
                              </span>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              {formatCurrency(therapist.totalRevenue)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Satisfaction Leaders</div>
                      <div className="space-y-2">
                        {comparisons.topPerformers.satisfaction.slice(0, 3).map((therapist, index) => (
                          <div key={therapist.therapist.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                            <div className="flex items-center space-x-2">
                              {getRankIcon(index + 1)}
                              <span className="text-sm font-medium">
                                {therapist.therapist.firstName} {therapist.therapist.lastName}
                              </span>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">
                              {therapist.averagePatientSatisfaction.toFixed(1)}/5
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          {trends && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Performance Trends
                </CardTitle>
                <CardDescription>
                  Performance trends over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Trend Analysis</h3>
                  <p className="text-muted-foreground">
                    Performance trend data is available for detailed analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Goal Form Dialog */}
      {showGoalForm && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader>
            <CardTitle>Set Performance Goal</CardTitle>
            <CardDescription>
              Create a new performance goal for tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="goalType">Goal Type</Label>
                <Select value={goalForm.goalType} onValueChange={(value: any) => setGoalForm(prev => ({ ...prev, goalType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sessions">Sessions</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="satisfaction">Satisfaction</SelectItem>
                    <SelectItem value="completion_rate">Completion Rate</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetValue">Target Value</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={goalForm.targetValue}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, targetValue: parseFloat(e.target.value) || 0 }))}
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={goalForm.targetDate}
                    onChange={(e) => setGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={goalForm.description}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Goal description..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowGoalForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGoal} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Goal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
