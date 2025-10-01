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
  Calendar,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Save,
  X,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Bell,
  User,
  Users,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
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
  AtSign,
  DollarSign,
  Percent,
  Home,
  Menu,
  Play,
  Pause,
  Square,
  RotateCcw,
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
  AlertTriangle,
  Info,
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
  FileText,
  Send,
  Reply,
  Quote,
  Pin,
  Archive,
  Trash2 as Trash2Icon,
  Copy,
  Move,
  GripVertical
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface ProgressTimelineDashboardProps {
  patientId?: string
  therapistId?: string
  onMilestoneAdded?: (milestone: any) => void
}

interface MilestoneData {
  id: string
  title: string
  description: string
  type: 'assessment' | 'goal' | 'session' | 'evaluation' | 'milestone' | 'checkpoint' | 'review'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
  progress: number
  targetDate: string
  completedDate?: string
  dependencies: string[]
  validationRules: any
  metrics: Array<{
    name: string
    targetValue: number
    currentValue: number
    unit?: string
    isRequired: boolean
  }>
  notes?: string
  patient: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  therapist: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

interface AnalyticsData {
  summary: {
    totalMilestones: number
    completedMilestones: number
    pendingMilestones: number
    overdueMilestones: number
    averageProgress: number
  }
  metrics?: {
    totalMetrics: number
    completedMetrics: number
    averageCompletion: number
  }
  trends?: any
  byType?: any
  byStatus?: any
}

export function ProgressTimelineDashboard({
  patientId,
  therapistId,
  onMilestoneAdded
}: ProgressTimelineDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('timeline')
  
  // Data state
  const [milestones, setMilestones] = useState<MilestoneData[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [therapists, setTherapists] = useState<any[]>([])
  
  // Filters
  const [filters, setFilters] = useState({
    patientId: patientId || '',
    therapistId: therapistId || '',
    type: '',
    status: '',
    priority: '',
    startDate: '',
    endDate: ''
  })
  
  // New milestone form
  const [newMilestone, setNewMilestone] = useState({
    patientId: patientId || '',
    therapistId: therapistId || '',
    title: '',
    description: '',
    type: 'milestone' as 'assessment' | 'goal' | 'session' | 'evaluation' | 'milestone' | 'checkpoint' | 'review',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    targetDate: '',
    progress: 0,
    notes: '',
    metrics: [] as Array<{
      name: string
      targetValue: number
      currentValue: number
      unit: string
      isRequired: boolean
    }>
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (filters.patientId || filters.therapistId) {
      loadMilestones()
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

  const loadMilestones = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value)
        }
      })

      const response = await fetch(`/api/progress-timeline?${params}`)
      const result = await response.json()

      if (response.ok) {
        setMilestones(result.data.milestones || [])
      } else {
        setError(result.error || 'Failed to load milestones')
      }
    } catch (err) {
      setError('Failed to load milestones')
      console.error('Error loading milestones:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const params = new URLSearchParams()
      
      if (filters.patientId) params.append('patientId', filters.patientId)
      if (filters.therapistId) params.append('therapistId', filters.therapistId)
      if (filters.startDate) params.append('startDate', filters.startDate)
      if (filters.endDate) params.append('endDate', filters.endDate)
      
      params.append('action', 'analytics')
      params.append('includeMetrics', 'true')
      params.append('includeTrends', 'true')

      const response = await fetch(`/api/progress-timeline?${params}`)
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

  const handleAddMilestone = async () => {
    if (!newMilestone.patientId || !newMilestone.therapistId || !newMilestone.title || !newMilestone.targetDate) {
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

      const response = await fetch('/api/progress-timeline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newMilestone,
          createdBy: 'user-1' // This should come from auth context
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add milestone')
      }

      toast({
        title: "Success",
        description: 'Milestone added successfully'
      })
      
      // Reset form
      setNewMilestone({
        patientId: patientId || '',
        therapistId: therapistId || '',
        title: '',
        description: '',
        type: 'milestone',
        priority: 'medium',
        targetDate: '',
        progress: 0,
        notes: '',
        metrics: []
      })

      // Reload data
      loadMilestones()
      loadAnalytics()

      if (onMilestoneAdded) {
        onMilestoneAdded(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add milestone'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error adding milestone:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'assessment': return <ClipboardCheck className="h-4 w-4" />
      case 'goal': return <Target className="h-4 w-4" />
      case 'session': return <Clock className="h-4 w-4" />
      case 'evaluation': return <BarChart3 className="h-4 w-4" />
      case 'milestone': return <Flag className="h-4 w-4" />
      case 'checkpoint': return <CheckCircle className="h-4 w-4" />
      case 'review': return <Eye className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const isOverdue = (targetDate: string, status: string) => {
    if (status === 'completed' || status === 'cancelled') return false
    return new Date(targetDate) < new Date()
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Progress Timeline & Milestones
              </CardTitle>
              <CardDescription>
                Track patient progress milestones with comprehensive date validation
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={loadMilestones}>
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
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="add">Add Milestone</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.summary.totalMilestones || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All milestones
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics?.summary.completedMilestones || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully completed
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics?.summary.pendingMilestones || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  In progress
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {analytics?.summary.overdueMilestones || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Past due date
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Timeline</CardTitle>
              <CardDescription>
                Visual timeline of milestones and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Milestones Found</h3>
                  <p className="text-muted-foreground">
                    No milestones found for the selected filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones
                    .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime())
                    .map((milestone, index) => (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-4 p-4 border rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-4 h-4 rounded-full ${
                          milestone.status === 'completed' ? 'bg-green-500' :
                          isOverdue(milestone.targetDate, milestone.status) ? 'bg-red-500' :
                          milestone.status === 'in_progress' ? 'bg-blue-500' :
                          'bg-gray-300'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(milestone.type)}
                            <h3 className="font-semibold truncate">{milestone.title}</h3>
                            <Badge className={getStatusColor(milestone.status)}>
                              {milestone.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(milestone.priority)}>
                              {milestone.priority}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(milestone.targetDate).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone.description}
                        </p>
                        
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{milestone.progress}%</span>
                          </div>
                          <Progress value={milestone.progress} className="h-2" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
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
                  <Label>Type</Label>
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="goal">Goal</SelectItem>
                      <SelectItem value="session">Session</SelectItem>
                      <SelectItem value="evaluation">Evaluation</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="checkpoint">Checkpoint</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestones List */}
          <Card>
            <CardHeader>
              <CardTitle>Milestones</CardTitle>
              <CardDescription>
                View and manage progress milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading milestones...</p>
                </div>
              ) : milestones.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Milestones Found</h3>
                  <p className="text-muted-foreground">
                    No milestones found for the selected filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones.map((milestone) => (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(milestone.type)}
                          <h3 className="font-semibold">{milestone.title}</h3>
                          <Badge className={getStatusColor(milestone.status)}>
                            {milestone.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(milestone.priority)}>
                            {milestone.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Target: {new Date(milestone.targetDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {milestone.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Progress</Label>
                          <div className="flex items-center space-x-2">
                            <Progress value={milestone.progress} className="flex-1" />
                            <span className="text-sm font-medium">{milestone.progress}%</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Patient</Label>
                          <div className="text-sm">
                            {milestone.patient.firstName} {milestone.patient.lastName}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Therapist</Label>
                          <div className="text-sm">
                            {milestone.therapist.firstName} {milestone.therapist.lastName}
                          </div>
                        </div>
                      </div>
                      
                      {milestone.metrics && milestone.metrics.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Metrics</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                            {milestone.metrics.map((metric, index) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{metric.name}:</span> {metric.currentValue}/{metric.targetValue} {metric.unit}
                              </div>
                            ))}
                          </div>
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
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>
                Analyze milestone progress and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics ? (
                <div className="space-y-6">
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Milestone Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Milestones:</span>
                          <span className="font-medium">{analytics.summary.totalMilestones}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="font-medium text-green-600">{analytics.summary.completedMilestones}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending:</span>
                          <span className="font-medium text-blue-600">{analytics.summary.pendingMilestones}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Overdue:</span>
                          <span className="font-medium text-red-600">{analytics.summary.overdueMilestones}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Progress:</span>
                          <span className="font-medium">{analytics.summary.averageProgress.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {analytics.metrics && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Metrics Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Total Metrics:</span>
                            <span className="font-medium">{analytics.metrics.totalMetrics}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Completed Metrics:</span>
                            <span className="font-medium text-green-600">{analytics.metrics.completedMetrics}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Average Completion:</span>
                            <span className="font-medium">{(analytics.metrics.averageCompletion * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Trends by Type */}
                  {analytics.byType && Object.keys(analytics.byType).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Milestones by Type</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(analytics.byType).map(([type, milestones]: [string, any]) => (
                          <div key={type} className="border rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                              {getTypeIcon(type)}
                              <h4 className="font-semibold capitalize">{type}</h4>
                            </div>
                            <div className="text-2xl font-bold">{milestones.length}</div>
                            <div className="text-sm text-muted-foreground">milestones</div>
                          </div>
                        ))}
                      </div>
                    </div>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Add Milestone Tab */}
        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Progress Milestone</CardTitle>
              <CardDescription>
                Create a new progress milestone with date validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient">Patient *</Label>
                  <Select value={newMilestone.patientId} onValueChange={(value) => setNewMilestone(prev => ({ ...prev, patientId: value }))}>
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
                  <Select value={newMilestone.therapistId} onValueChange={(value) => setNewMilestone(prev => ({ ...prev, therapistId: value }))}>
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
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter milestone title"
                  maxLength={200}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter milestone description"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={newMilestone.type} onValueChange={(value: any) => setNewMilestone(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="goal">Goal</SelectItem>
                      <SelectItem value="session">Session</SelectItem>
                      <SelectItem value="evaluation">Evaluation</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="checkpoint">Checkpoint</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newMilestone.priority} onValueChange={(value: any) => setNewMilestone(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="targetDate">Target Date *</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={newMilestone.targetDate}
                    onChange={(e) => setNewMilestone(prev => ({ ...prev, targetDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="progress">Initial Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={newMilestone.progress}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newMilestone.notes}
                  onChange={(e) => setNewMilestone(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter additional notes"
                  rows={3}
                  maxLength={2000}
                />
              </div>
              
              <Button onClick={handleAddMilestone} disabled={loading} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Adding...' : 'Add Milestone'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
