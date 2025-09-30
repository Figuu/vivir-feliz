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
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
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
  Calendar,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
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

interface PatientProgressDashboardProps {
  patientId?: string
  therapistId?: string
  onProgressAdded?: (progress: any) => void
}

interface ProgressEntry {
  id: string
  entryDate: string
  entryType: 'session' | 'assessment' | 'evaluation' | 'milestone' | 'observation' | 'measurement'
  title: string
  description: string
  progressScore?: number
  overallProgress: number
  progressData: {
    behavioralChanges?: {
      positiveChanges: string[]
      negativeChanges: string[]
      observations?: string
    }
    emotionalState?: {
      moodRating?: number
      emotionalStability?: number
      stressLevel?: number
      anxietyLevel?: number
      depressionLevel?: number
      notes?: string
    }
    cognitiveFunction?: {
      attentionSpan?: number
      memoryFunction?: number
      problemSolving?: number
      decisionMaking?: number
      cognitiveFlexibility?: number
      notes?: string
    }
    socialFunction?: {
      communicationSkills?: number
      socialInteraction?: number
      relationshipQuality?: number
      socialAnxiety?: number
      peerRelationships?: number
      notes?: string
    }
    physicalHealth?: {
      sleepQuality?: number
      appetite?: number
      energyLevel?: number
      physicalSymptoms: string[]
      medicationCompliance?: number
      notes?: string
    }
    treatmentResponse?: {
      therapyEngagement?: number
      homeworkCompletion?: number
      skillApplication?: number
      motivationLevel?: number
      resistanceLevel?: number
      notes?: string
    }
  }
  goalsProgress: Array<{
    goalId?: string
    goalTitle: string
    progressPercentage: number
    status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled'
    notes?: string
  }>
  riskAssessment?: {
    riskLevel: 'low' | 'moderate' | 'high' | 'critical'
    riskFactors: string[]
    protectiveFactors: string[]
    safetyPlan?: string
    crisisIntervention: boolean
    notes?: string
  }
  recommendations: Array<{
    type: 'treatment' | 'medication' | 'lifestyle' | 'referral' | 'monitoring' | 'intervention'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    description: string
    targetDate?: string
    isCompleted: boolean
  }>
  validationStatus: 'pending' | 'validated' | 'flagged' | 'requires_review'
  notes?: string
  tags: string[]
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
    totalEntries: number
    averageProgress: number
    validatedEntries: number
    flaggedEntries: number
    pendingValidation: number
  }
  trends?: any
  comparisons?: {
    byEntryType: any
    byValidationStatus: any
    progressDistribution: any
  }
  riskAnalysis?: {
    highRiskEntries: number
    moderateRiskEntries: number
    lowRiskEntries: number
    criticalRiskEntries: number
    commonRiskFactors: string[]
    riskTrends: any[]
  }
  progressMetrics?: {
    emotionalProgress: any
    cognitiveProgress: any
    socialProgress: any
    physicalProgress: any
    treatmentProgress: any
  }
}

export function PatientProgressDashboard({
  patientId,
  therapistId,
  onProgressAdded
}: PatientProgressDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Data state
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [therapists, setTherapists] = useState<any[]>([])
  
  // Filters
  const [filters, setFilters] = useState({
    patientId: patientId || '',
    therapistId: therapistId || '',
    entryType: '',
    validationStatus: '',
    startDate: '',
    endDate: '',
    minProgress: '',
    maxProgress: ''
  })
  
  // New progress entry form
  const [newProgress, setNewProgress] = useState({
    patientId: patientId || '',
    therapistId: therapistId || '',
    entryDate: new Date().toISOString().split('T')[0],
    entryType: 'session' as 'session' | 'assessment' | 'evaluation' | 'milestone' | 'observation' | 'measurement',
    title: '',
    description: '',
    overallProgress: 0,
    notes: '',
    tags: [] as string[]
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (filters.patientId || filters.therapistId) {
      loadProgressEntries()
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

  const loadProgressEntries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value)
        }
      })

      const response = await fetch(`/api/patient-progress?${params}`)
      const result = await response.json()

      if (response.ok) {
        setProgressEntries(result.data.progressEntries || [])
      } else {
        setError(result.error || 'Failed to load progress entries')
      }
    } catch (err) {
      setError('Failed to load progress entries')
      console.error('Error loading progress entries:', err)
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
      params.append('includeTrends', 'true')
      params.append('includeComparisons', 'true')
      params.append('includeRiskAnalysis', 'true')

      const response = await fetch(`/api/patient-progress?${params}`)
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

  const handleAddProgress = async () => {
    if (!newProgress.patientId || !newProgress.therapistId || !newProgress.title || !newProgress.description) {
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

      const response = await fetch('/api/patient-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProgress,
          progressData: {
            behavioralChanges: {
              positiveChanges: [],
              negativeChanges: [],
              observations: ''
            },
            emotionalState: {
              moodRating: 5,
              emotionalStability: 5,
              stressLevel: 5,
              anxietyLevel: 5,
              depressionLevel: 5,
              notes: ''
            },
            cognitiveFunction: {
              attentionSpan: 5,
              memoryFunction: 5,
              problemSolving: 5,
              decisionMaking: 5,
              cognitiveFlexibility: 5,
              notes: ''
            },
            socialFunction: {
              communicationSkills: 5,
              socialInteraction: 5,
              relationshipQuality: 5,
              socialAnxiety: 5,
              peerRelationships: 5,
              notes: ''
            },
            physicalHealth: {
              sleepQuality: 5,
              appetite: 5,
              energyLevel: 5,
              physicalSymptoms: [],
              medicationCompliance: 5,
              notes: ''
            },
            treatmentResponse: {
              therapyEngagement: 5,
              homeworkCompletion: 5,
              skillApplication: 5,
              motivationLevel: 5,
              resistanceLevel: 5,
              notes: ''
            }
          },
          goalsProgress: [],
          riskAssessment: {
            riskLevel: 'low',
            riskFactors: [],
            protectiveFactors: [],
            crisisIntervention: false
          },
          recommendations: [],
          createdBy: 'user-1' // This should come from auth context
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add progress entry')
      }

      toast({
        title: "Success",
        description: 'Progress entry added successfully'
      })
      
      // Reset form
      setNewProgress({
        patientId: patientId || '',
        therapistId: therapistId || '',
        entryDate: new Date().toISOString().split('T')[0],
        entryType: 'session',
        title: '',
        description: '',
        overallProgress: 0,
        notes: '',
        tags: []
      })

      // Reload data
      loadProgressEntries()
      loadAnalytics()

      if (onProgressAdded) {
        onProgressAdded(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add progress entry'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error adding progress entry:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'validated': return 'bg-green-100 text-green-800'
      case 'flagged': return 'bg-red-100 text-red-800'
      case 'requires_review': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case 'session': return 'bg-blue-100 text-blue-800'
      case 'assessment': return 'bg-green-100 text-green-800'
      case 'evaluation': return 'bg-purple-100 text-purple-800'
      case 'milestone': return 'bg-orange-100 text-orange-800'
      case 'observation': return 'bg-pink-100 text-pink-800'
      case 'measurement': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Patient Progress Dashboard
              </CardTitle>
              <CardDescription>
                Track and analyze patient progress with comprehensive validation
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={loadProgressEntries}>
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
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="add">Add Entry</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.summary.totalEntries || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All progress entries
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.summary.averageProgress ? analytics.summary.averageProgress.toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall progress
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Validated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {analytics?.summary.validatedEntries || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Quality assured
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Flagged</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {analytics?.summary.flaggedEntries || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Progress Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Progress Entries</CardTitle>
              <CardDescription>
                Latest progress entries and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {progressEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Progress Entries</h3>
                  <p className="text-muted-foreground">
                    No progress entries found for the selected filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {progressEntries.slice(0, 5).map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{entry.title}</h3>
                          <Badge className={getEntryTypeColor(entry.entryType)}>
                            {entry.entryType}
                          </Badge>
                          <Badge className={getStatusColor(entry.validationStatus)}>
                            {entry.validationStatus.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(entry.entryDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {entry.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Progress:</span>
                          <Progress value={entry.overallProgress} className="w-24 h-2" />
                          <span className="text-sm font-medium">{entry.overallProgress}%</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.patient.firstName} {entry.patient.lastName}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
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
                  <Label>Entry Type</Label>
                  <Select value={filters.entryType} onValueChange={(value) => setFilters(prev => ({ ...prev, entryType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">Session</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="evaluation">Evaluation</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="observation">Observation</SelectItem>
                      <SelectItem value="measurement">Measurement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Validation Status</Label>
                  <Select value={filters.validationStatus} onValueChange={(value) => setFilters(prev => ({ ...prev, validationStatus: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="validated">Validated</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                      <SelectItem value="requires_review">Requires Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Entries List */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Entries</CardTitle>
              <CardDescription>
                View and manage patient progress entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading progress entries...</p>
                </div>
              ) : progressEntries.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Progress Entries Found</h3>
                  <p className="text-muted-foreground">
                    No progress entries found for the selected filters.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {progressEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{entry.title}</h3>
                          <Badge className={getEntryTypeColor(entry.entryType)}>
                            {entry.entryType}
                          </Badge>
                          <Badge className={getStatusColor(entry.validationStatus)}>
                            {entry.validationStatus.replace('_', ' ')}
                          </Badge>
                          {entry.riskAssessment && (
                            <Badge className={getRiskLevelColor(entry.riskAssessment.riskLevel)}>
                              Risk: {entry.riskAssessment.riskLevel}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(entry.entryDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {entry.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Overall Progress</Label>
                          <div className="flex items-center space-x-2">
                            <Progress value={entry.overallProgress} className="flex-1" />
                            <span className="text-sm font-medium">{entry.overallProgress}%</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Patient</Label>
                          <div className="text-sm">
                            {entry.patient.firstName} {entry.patient.lastName}
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Therapist</Label>
                          <div className="text-sm">
                            {entry.therapist.firstName} {entry.therapist.lastName}
                          </div>
                        </div>
                      </div>
                      
                      {entry.goalsProgress && entry.goalsProgress.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Goals Progress</Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                            {entry.goalsProgress.map((goal, index) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{goal.goalTitle}:</span> {goal.progressPercentage}% ({goal.status})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {entry.recommendations && entry.recommendations.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Recommendations</Label>
                          <div className="space-y-1 mt-1">
                            {entry.recommendations.map((rec, index) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{rec.type}:</span> {rec.description} ({rec.priority})
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
              <CardTitle>Progress Analytics</CardTitle>
              <CardDescription>
                Analyze patient progress trends and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analytics ? (
                <div className="space-y-6">
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Progress Summary</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Entries:</span>
                          <span className="font-medium">{analytics.summary.totalEntries}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Average Progress:</span>
                          <span className="font-medium">{analytics.summary.averageProgress.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Validated:</span>
                          <span className="font-medium text-green-600">{analytics.summary.validatedEntries}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Flagged:</span>
                          <span className="font-medium text-red-600">{analytics.summary.flaggedEntries}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending:</span>
                          <span className="font-medium text-yellow-600">{analytics.summary.pendingValidation}</span>
                        </div>
                      </div>
                    </div>
                    
                    {analytics.riskAnalysis && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">Risk Analysis</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Low Risk:</span>
                            <span className="font-medium text-green-600">{analytics.riskAnalysis.lowRiskEntries}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Moderate Risk:</span>
                            <span className="font-medium text-yellow-600">{analytics.riskAnalysis.moderateRiskEntries}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>High Risk:</span>
                            <span className="font-medium text-orange-600">{analytics.riskAnalysis.highRiskEntries}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Critical Risk:</span>
                            <span className="font-medium text-red-600">{analytics.riskAnalysis.criticalRiskEntries}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Progress Distribution */}
                  {analytics.comparisons?.progressDistribution && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Progress Distribution</h3>
                      <div className="grid grid-cols-5 gap-4">
                        {Object.entries(analytics.comparisons.progressDistribution).map(([range, count]) => (
                          <div key={range} className="text-center">
                            <div className="text-2xl font-bold">{count as number}</div>
                            <div className="text-sm text-muted-foreground">{range}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Common Risk Factors */}
                  {analytics.riskAnalysis?.commonRiskFactors && analytics.riskAnalysis.commonRiskFactors.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Common Risk Factors</h3>
                      <div className="space-y-2">
                        {analytics.riskAnalysis.commonRiskFactors.map((factor, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm">{factor}</span>
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

        {/* Add Entry Tab */}
        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Progress Entry</CardTitle>
              <CardDescription>
                Create a new patient progress entry
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient">Patient *</Label>
                  <Select value={newProgress.patientId} onValueChange={(value) => setNewProgress(prev => ({ ...prev, patientId: value }))}>
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
                  <Select value={newProgress.therapistId} onValueChange={(value) => setNewProgress(prev => ({ ...prev, therapistId: value }))}>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="entryDate">Entry Date *</Label>
                  <Input
                    id="entryDate"
                    type="date"
                    value={newProgress.entryDate}
                    onChange={(e) => setNewProgress(prev => ({ ...prev, entryDate: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="entryType">Entry Type</Label>
                  <Select value={newProgress.entryType} onValueChange={(value: any) => setNewProgress(prev => ({ ...prev, entryType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="session">Session</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="evaluation">Evaluation</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="observation">Observation</SelectItem>
                      <SelectItem value="measurement">Measurement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newProgress.title}
                  onChange={(e) => setNewProgress(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter progress entry title"
                  maxLength={200}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newProgress.description}
                  onChange={(e) => setNewProgress(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter progress entry description"
                  rows={4}
                  maxLength={2000}
                />
              </div>
              
              <div>
                <Label htmlFor="overallProgress">Overall Progress (%)</Label>
                <Input
                  id="overallProgress"
                  type="number"
                  min="0"
                  max="100"
                  value={newProgress.overallProgress}
                  onChange={(e) => setNewProgress(prev => ({ ...prev, overallProgress: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newProgress.notes}
                  onChange={(e) => setNewProgress(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter additional notes"
                  rows={3}
                  maxLength={2000}
                />
              </div>
              
              <Button onClick={handleAddProgress} disabled={loading} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Adding...' : 'Add Progress Entry'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
