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
  FileText,
  Target,
  BarChart3,
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
  Activity,
  TrendingUp,
  TrendingDown,
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
  LineChart,
  Activity as ActivityIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface ProgressReportCreationFormProps {
  patientId?: string
  therapistId?: string
  sessionId?: string
  therapeuticPlanId?: string
  onReportCreated?: (report: any) => void
  onCancel?: () => void
}

interface Achievement {
  id?: string
  objectiveId: string
  title: string
  description: string
  achievementLevel: 'not_achieved' | 'partially_achieved' | 'mostly_achieved' | 'fully_achieved'
  progressPercentage: number
  evidence?: string
  nextSteps?: string
}

interface MetricProgress {
  id?: string
  metricId: string
  currentValue: number | string | boolean
  previousValue?: number | string | boolean
  targetValue?: number | string | boolean
  progressNotes?: string
  measurementDate: string
}

interface Recommendation {
  id?: string
  type: 'treatment' | 'medication' | 'lifestyle' | 'referral' | 'other'
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  targetDate?: string
  isImplemented: boolean
}

export function ProgressReportCreationForm({
  patientId,
  therapistId,
  sessionId,
  therapeuticPlanId,
  onReportCreated,
  onCancel
}: ProgressReportCreationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    reportDate: '',
    sessionNumber: 2,
    overallProgressScore: 0,
    progressDescription: '',
    clinicalObservations: '',
    behavioralChanges: '',
    emotionalState: '',
    cognitiveFunctioning: '',
    socialFunctioning: '',
    treatmentResponse: '',
    medicationCompliance: 'not_applicable' as 'excellent' | 'good' | 'fair' | 'poor' | 'not_applicable',
    sideEffects: '',
    riskLevel: 'low' as 'low' | 'moderate' | 'high' | 'critical',
    riskFactors: [] as string[],
    protectiveFactors: [] as string[],
    safetyConcerns: '',
    nextSessionGoals: '',
    homeworkAssignments: '',
    status: 'draft' as 'draft' | 'pending_review' | 'approved' | 'finalized',
    isConfidential: false
  })
  
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [metricProgress, setMetricProgress] = useState<MetricProgress[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [newRiskFactor, setNewRiskFactor] = useState('')
  const [newProtectiveFactor, setNewProtectiveFactor] = useState('')
  
  // Data state
  const [therapeuticPlan, setTherapeuticPlan] = useState<any>(null)
  const [objectives, setObjectives] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any[]>([])

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [therapeuticPlanId])

  const loadInitialData = async () => {
    try {
      if (therapeuticPlanId) {
        // Load therapeutic plan
        const planResponse = await fetch(`/api/therapeutic-plans/${therapeuticPlanId}`)
        const planResult = await planResponse.json()
        if (planResponse.ok) {
          setTherapeuticPlan(planResult.data)
          setObjectives(planResult.data.objectives || [])
          
          // Extract all metrics from objectives
          const allMetrics = planResult.data.objectives.flatMap((obj: any) => obj.metrics || [])
          setMetrics(allMetrics)
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const addAchievement = () => {
    if (objectives.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'No objectives available. Please select a therapeutic plan first.'
      })
      return
    }
    
    const newAchievement: Achievement = {
      objectiveId: objectives[0].id,
      title: '',
      description: '',
      achievementLevel: 'partially_achieved',
      progressPercentage: 0
    }
    setAchievements([...achievements, newAchievement])
  }

  const updateAchievement = (index: number, field: keyof Achievement, value: any) => {
    const updatedAchievements = [...achievements]
    updatedAchievements[index] = { ...updatedAchievements[index], [field]: value }
    setAchievements(updatedAchievements)
  }

  const removeAchievement = (index: number) => {
    const updatedAchievements = achievements.filter((_, i) => i !== index)
    setAchievements(updatedAchievements)
  }

  const addMetricProgress = () => {
    if (metrics.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'No metrics available. Please select a therapeutic plan first.'
      })
      return
    }
    
    const newMetricProgress: MetricProgress = {
      metricId: metrics[0].id,
      currentValue: '',
      measurementDate: new Date().toISOString().split('T')[0]
    }
    setMetricProgress([...metricProgress, newMetricProgress])
  }

  const updateMetricProgress = (index: number, field: keyof MetricProgress, value: any) => {
    const updatedMetricProgress = [...metricProgress]
    updatedMetricProgress[index] = { ...updatedMetricProgress[index], [field]: value }
    setMetricProgress(updatedMetricProgress)
  }

  const removeMetricProgress = (index: number) => {
    const updatedMetricProgress = metricProgress.filter((_, i) => i !== index)
    setMetricProgress(updatedMetricProgress)
  }

  const addRecommendation = () => {
    const newRecommendation: Recommendation = {
      type: 'treatment',
      description: '',
      priority: 'medium',
      isImplemented: false
    }
    setRecommendations([...recommendations, newRecommendation])
  }

  const updateRecommendation = (index: number, field: keyof Recommendation, value: any) => {
    const updatedRecommendations = [...recommendations]
    updatedRecommendations[index] = { ...updatedRecommendations[index], [field]: value }
    setRecommendations(updatedRecommendations)
  }

  const removeRecommendation = (index: number) => {
    const updatedRecommendations = recommendations.filter((_, i) => i !== index)
    setRecommendations(updatedRecommendations)
  }

  const addRiskFactor = () => {
    if (newRiskFactor.trim()) {
      setFormData(prev => ({
        ...prev,
        riskFactors: [...prev.riskFactors, newRiskFactor.trim()]
      }))
      setNewRiskFactor('')
    }
  }

  const removeRiskFactor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      riskFactors: prev.riskFactors.filter((_, i) => i !== index)
    }))
  }

  const addProtectiveFactor = () => {
    if (newProtectiveFactor.trim()) {
      setFormData(prev => ({
        ...prev,
        protectiveFactors: [...prev.protectiveFactors, newProtectiveFactor.trim()]
      }))
      setNewProtectiveFactor('')
    }
  }

  const removeProtectiveFactor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      protectiveFactors: prev.protectiveFactors.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please enter a report title'
      })
      return false
    }
    
    if (!formData.reportDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please select a report date'
      })
      return false
    }
    
    if (!formData.progressDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please enter a progress description'
      })
      return false
    }
    
    if (achievements.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please add at least one achievement'
      })
      return false
    }
    
    if (metricProgress.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please add at least one metric progress'
      })
      return false
    }
    
    for (let i = 0; i < achievements.length; i++) {
      const achievement = achievements[i]
      
      if (!achievement.title.trim()) {
        toast({
        variant: "destructive",
        title: "Error",
        description: `Please enter a title for achievement ${i + 1}`
      })
        return false
      }
      
      if (!achievement.description.trim()) {
        toast({
        variant: "destructive",
        title: "Error",
        description: `Please enter a description for achievement ${i + 1}`
      })
        return false
      }
      
      if (achievement.progressPercentage < 0 || achievement.progressPercentage > 100) {
        toast({
        variant: "destructive",
        title: "Error",
        description: `Progress percentage for achievement ${i + 1} must be between 0 and 100`
      })
        return false
      }
    }
    
    for (let i = 0; i < metricProgress.length; i++) {
      const progress = metricProgress[i]
      
      if (progress.currentValue === '' || progress.currentValue === null || progress.currentValue === undefined) {
        toast({
        variant: "destructive",
        title: "Error",
        description: `Please enter a current value for metric progress ${i + 1}`
      })
        return false
      }
      
      if (!progress.measurementDate) {
        toast({
        variant: "destructive",
        title: "Error",
        description: `Please select a measurement date for metric progress ${i + 1}`
      })
        return false
      }
    }
    
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/progress-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          therapistId,
          sessionId,
          therapeuticPlanId,
          ...formData,
          achievements,
          metricProgress,
          recommendations
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create progress report')
      }

      toast({
        title: "Success",
        description: 'Progress report created successfully'
      })
      if (onReportCreated) {
        onReportCreated(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create progress report'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error creating progress report:', err)
    } finally {
      setLoading(false)
    }
  }

  const getAchievementLevelColor = (level: string) => {
    switch (level) {
      case 'fully_achieved': return 'bg-green-100 text-green-800'
      case 'mostly_achieved': return 'bg-blue-100 text-blue-800'
      case 'partially_achieved': return 'bg-yellow-100 text-yellow-800'
      case 'not_achieved': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Create Progress Report
              </CardTitle>
              <CardDescription>
                Create a comprehensive progress report after the second session
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Report'}
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

      {/* Main Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="clinical">Clinical</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic information for the progress report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Report Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter report title"
                  maxLength={100}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {formData.title.length}/100 characters
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportDate">Report Date *</Label>
                  <Input
                    id="reportDate"
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionNumber">Session Number</Label>
                  <Input
                    id="sessionNumber"
                    type="number"
                    value={formData.sessionNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, sessionNumber: parseInt(e.target.value) || 2 }))}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="overallProgressScore">Overall Progress Score (0-100)</Label>
                <div className="space-y-2">
                  <Input
                    id="overallProgressScore"
                    type="number"
                    value={formData.overallProgressScore}
                    onChange={(e) => setFormData(prev => ({ ...prev, overallProgressScore: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                  />
                  <Progress value={formData.overallProgressScore} className="w-full" />
                  <div className="text-sm text-muted-foreground">
                    {formData.overallProgressScore}% progress
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="progressDescription">Progress Description *</Label>
                <Textarea
                  id="progressDescription"
                  value={formData.progressDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, progressDescription: e.target.value }))}
                  placeholder="Describe the overall progress made"
                  rows={4}
                  maxLength={2000}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {formData.progressDescription.length}/2000 characters
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Achievements & Progress</CardTitle>
                  <CardDescription>
                    Track achievements and progress towards objectives
                  </CardDescription>
                </div>
                <Button onClick={addAchievement} disabled={objectives.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Achievement
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {achievements.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Achievements Added</h3>
                  <p className="text-muted-foreground mb-4">
                    Add achievements to track progress towards therapeutic objectives.
                  </p>
                  <Button onClick={addAchievement} disabled={objectives.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Achievement
                  </Button>
                </div>
              ) : (
                achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getAchievementLevelColor(achievement.achievementLevel)}>
                          {achievement.achievementLevel.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline">
                          {achievement.progressPercentage}% progress
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAchievement(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <Label>Objective</Label>
                      <Select value={achievement.objectiveId} onValueChange={(value) => updateAchievement(index, 'objectiveId', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {objectives.map((objective) => (
                            <SelectItem key={objective.id} value={objective.id}>
                              {objective.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Achievement Title *</Label>
                      <Input
                        value={achievement.title}
                        onChange={(e) => updateAchievement(index, 'title', e.target.value)}
                        placeholder="Enter achievement title"
                        maxLength={100}
                      />
                    </div>
                    
                    <div>
                      <Label>Description *</Label>
                      <Textarea
                        value={achievement.description}
                        onChange={(e) => updateAchievement(index, 'description', e.target.value)}
                        placeholder="Describe the achievement"
                        rows={3}
                        maxLength={500}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Achievement Level</Label>
                        <Select value={achievement.achievementLevel} onValueChange={(value: any) => updateAchievement(index, 'achievementLevel', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not_achieved">Not Achieved</SelectItem>
                            <SelectItem value="partially_achieved">Partially Achieved</SelectItem>
                            <SelectItem value="mostly_achieved">Mostly Achieved</SelectItem>
                            <SelectItem value="fully_achieved">Fully Achieved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Progress Percentage (0-100)</Label>
                        <Input
                          type="number"
                          value={achievement.progressPercentage}
                          onChange={(e) => updateAchievement(index, 'progressPercentage', parseInt(e.target.value) || 0)}
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Evidence</Label>
                      <Textarea
                        value={achievement.evidence || ''}
                        onChange={(e) => updateAchievement(index, 'evidence', e.target.value)}
                        placeholder="Provide evidence for this achievement"
                        rows={2}
                        maxLength={1000}
                      />
                    </div>
                    
                    <div>
                      <Label>Next Steps</Label>
                      <Textarea
                        value={achievement.nextSteps || ''}
                        onChange={(e) => updateAchievement(index, 'nextSteps', e.target.value)}
                        placeholder="Describe next steps for this objective"
                        rows={2}
                        maxLength={500}
                      />
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Metric Progress</CardTitle>
                  <CardDescription>
                    Track progress on specific metrics and measurements
                  </CardDescription>
                </div>
                <Button onClick={addMetricProgress} disabled={metrics.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Metric Progress
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {metricProgress.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Metric Progress Added</h3>
                  <p className="text-muted-foreground mb-4">
                    Add metric progress to track specific measurements and outcomes.
                  </p>
                  <Button onClick={addMetricProgress} disabled={metrics.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Metric Progress
                  </Button>
                </div>
              ) : (
                metricProgress.map((progress, index) => {
                  const metric = metrics.find(m => m.id === progress.metricId)
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{metric?.type || 'Unknown'}</Badge>
                          <Badge variant="secondary">{metric?.name || 'Unknown Metric'}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMetricProgress(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div>
                        <Label>Metric</Label>
                        <Select value={progress.metricId} onValueChange={(value) => updateMetricProgress(index, 'metricId', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {metrics.map((metric) => (
                              <SelectItem key={metric.id} value={metric.id}>
                                {metric.name} ({metric.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Current Value *</Label>
                          {metric?.type === 'numeric' && (
                            <Input
                              type="number"
                              value={progress.currentValue as number}
                              onChange={(e) => updateMetricProgress(index, 'currentValue', parseFloat(e.target.value) || 0)}
                              placeholder="Enter current value"
                            />
                          )}
                          {metric?.type === 'boolean' && (
                            <Select value={progress.currentValue as string} onValueChange={(value) => updateMetricProgress(index, 'currentValue', value === 'true')}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Yes</SelectItem>
                                <SelectItem value="false">No</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {metric?.type === 'text' && (
                            <Input
                              value={progress.currentValue as string}
                              onChange={(e) => updateMetricProgress(index, 'currentValue', e.target.value)}
                              placeholder="Enter current value"
                              maxLength={metric?.maxLength || 1000}
                            />
                          )}
                          {metric?.type === 'scale' && (
                            <Input
                              type="number"
                              value={progress.currentValue as number}
                              onChange={(e) => updateMetricProgress(index, 'currentValue', parseInt(e.target.value) || 0)}
                              min={metric?.scaleMin || 1}
                              max={metric?.scaleMax || 10}
                              placeholder="Enter scale value"
                            />
                          )}
                          {metric?.type === 'percentage' && (
                            <Input
                              type="number"
                              value={progress.currentValue as number}
                              onChange={(e) => updateMetricProgress(index, 'currentValue', parseInt(e.target.value) || 0)}
                              min="0"
                              max="100"
                              placeholder="Enter percentage"
                            />
                          )}
                        </div>
                        <div>
                          <Label>Measurement Date *</Label>
                          <Input
                            type="date"
                            value={progress.measurementDate}
                            onChange={(e) => updateMetricProgress(index, 'measurementDate', e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Progress Notes</Label>
                        <Textarea
                          value={progress.progressNotes || ''}
                          onChange={(e) => updateMetricProgress(index, 'progressNotes', e.target.value)}
                          placeholder="Add notes about this metric progress"
                          rows={2}
                          maxLength={500}
                        />
                      </div>
                    </motion.div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clinical Tab */}
        <TabsContent value="clinical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Observations</CardTitle>
              <CardDescription>
                Record clinical observations and assessment findings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clinicalObservations">Clinical Observations</Label>
                <Textarea
                  id="clinicalObservations"
                  value={formData.clinicalObservations}
                  onChange={(e) => setFormData(prev => ({ ...prev, clinicalObservations: e.target.value }))}
                  placeholder="Record clinical observations and findings"
                  rows={4}
                  maxLength={2000}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {formData.clinicalObservations.length}/2000 characters
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="behavioralChanges">Behavioral Changes</Label>
                  <Textarea
                    id="behavioralChanges"
                    value={formData.behavioralChanges}
                    onChange={(e) => setFormData(prev => ({ ...prev, behavioralChanges: e.target.value }))}
                    placeholder="Describe behavioral changes observed"
                    rows={3}
                    maxLength={1000}
                  />
                </div>
                <div>
                  <Label htmlFor="emotionalState">Emotional State</Label>
                  <Textarea
                    id="emotionalState"
                    value={formData.emotionalState}
                    onChange={(e) => setFormData(prev => ({ ...prev, emotionalState: e.target.value }))}
                    placeholder="Describe emotional state and mood"
                    rows={3}
                    maxLength={1000}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cognitiveFunctioning">Cognitive Functioning</Label>
                  <Textarea
                    id="cognitiveFunctioning"
                    value={formData.cognitiveFunctioning}
                    onChange={(e) => setFormData(prev => ({ ...prev, cognitiveFunctioning: e.target.value }))}
                    placeholder="Describe cognitive functioning"
                    rows={3}
                    maxLength={1000}
                  />
                </div>
                <div>
                  <Label htmlFor="socialFunctioning">Social Functioning</Label>
                  <Textarea
                    id="socialFunctioning"
                    value={formData.socialFunctioning}
                    onChange={(e) => setFormData(prev => ({ ...prev, socialFunctioning: e.target.value }))}
                    placeholder="Describe social functioning"
                    rows={3}
                    maxLength={1000}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="treatmentResponse">Treatment Response</Label>
                <Textarea
                  id="treatmentResponse"
                  value={formData.treatmentResponse}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatmentResponse: e.target.value }))}
                  placeholder="Describe response to treatment"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="medicationCompliance">Medication Compliance</Label>
                  <Select value={formData.medicationCompliance} onValueChange={(value: any) => setFormData(prev => ({ ...prev, medicationCompliance: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="not_applicable">Not Applicable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="riskLevel">Risk Level</Label>
                  <Select value={formData.riskLevel} onValueChange={(value: any) => setFormData(prev => ({ ...prev, riskLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="sideEffects">Side Effects</Label>
                <Textarea
                  id="sideEffects"
                  value={formData.sideEffects}
                  onChange={(e) => setFormData(prev => ({ ...prev, sideEffects: e.target.value }))}
                  placeholder="Describe any side effects observed"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              
              <div>
                <Label htmlFor="safetyConcerns">Safety Concerns</Label>
                <Textarea
                  id="safetyConcerns"
                  value={formData.safetyConcerns}
                  onChange={(e) => setFormData(prev => ({ ...prev, safetyConcerns: e.target.value }))}
                  placeholder="Describe any safety concerns"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              
              {/* Risk Factors */}
              <div>
                <Label>Risk Factors</Label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      value={newRiskFactor}
                      onChange={(e) => setNewRiskFactor(e.target.value)}
                      placeholder="Add risk factor"
                      maxLength={100}
                      onKeyPress={(e) => e.key === 'Enter' && addRiskFactor()}
                    />
                    <Button onClick={addRiskFactor} disabled={!newRiskFactor.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.riskFactors.map((factor, index) => (
                      <Badge key={index} variant="destructive" className="flex items-center space-x-1">
                        <span>{factor}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRiskFactor(index)}
                          className="h-4 w-4 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Protective Factors */}
              <div>
                <Label>Protective Factors</Label>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <Input
                      value={newProtectiveFactor}
                      onChange={(e) => setNewProtectiveFactor(e.target.value)}
                      placeholder="Add protective factor"
                      maxLength={100}
                      onKeyPress={(e) => e.key === 'Enter' && addProtectiveFactor()}
                    />
                    <Button onClick={addProtectiveFactor} disabled={!newProtectiveFactor.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.protectiveFactors.map((factor, index) => (
                      <Badge key={index} variant="default" className="flex items-center space-x-1">
                        <span>{factor}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProtectiveFactor(index)}
                          className="h-4 w-4 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recommendations & Next Steps</CardTitle>
                  <CardDescription>
                    Provide recommendations and plan next steps
                  </CardDescription>
                </div>
                <Button onClick={addRecommendation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recommendation
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="nextSessionGoals">Next Session Goals</Label>
                <Textarea
                  id="nextSessionGoals"
                  value={formData.nextSessionGoals}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextSessionGoals: e.target.value }))}
                  placeholder="Describe goals for the next session"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              
              <div>
                <Label htmlFor="homeworkAssignments">Homework Assignments</Label>
                <Textarea
                  id="homeworkAssignments"
                  value={formData.homeworkAssignments}
                  onChange={(e) => setFormData(prev => ({ ...prev, homeworkAssignments: e.target.value }))}
                  placeholder="Describe homework assignments or exercises"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Recommendations Added</h3>
                  <p className="text-muted-foreground mb-4">
                    Add recommendations for treatment, medication, lifestyle, or referrals.
                  </p>
                  <Button onClick={addRecommendation}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Recommendation
                  </Button>
                </div>
              ) : (
                recommendations.map((recommendation, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{recommendation.type}</Badge>
                        <Badge className={getPriorityColor(recommendation.priority)}>
                          {recommendation.priority}
                        </Badge>
                        {recommendation.isImplemented && (
                          <Badge variant="default">Implemented</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRecommendation(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <Label>Recommendation Description *</Label>
                      <Textarea
                        value={recommendation.description}
                        onChange={(e) => updateRecommendation(index, 'description', e.target.value)}
                        placeholder="Describe the recommendation"
                        rows={3}
                        maxLength={500}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Type</Label>
                        <Select value={recommendation.type} onValueChange={(value: any) => updateRecommendation(index, 'type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="treatment">Treatment</SelectItem>
                            <SelectItem value="medication">Medication</SelectItem>
                            <SelectItem value="lifestyle">Lifestyle</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Select value={recommendation.priority} onValueChange={(value: any) => updateRecommendation(index, 'priority', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Target Date</Label>
                        <Input
                          type="date"
                          value={recommendation.targetDate || ''}
                          onChange={(e) => updateRecommendation(index, 'targetDate', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`implemented-${index}`}
                        checked={recommendation.isImplemented}
                        onChange={(e) => updateRecommendation(index, 'isImplemented', e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor={`implemented-${index}`}>Already Implemented</Label>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
