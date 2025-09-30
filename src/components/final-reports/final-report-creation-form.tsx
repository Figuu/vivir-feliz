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

interface FinalReportCreationFormProps {
  patientId?: string
  therapistId?: string
  sessionId?: string
  therapeuticPlanId?: string
  onReportCreated?: (report: any) => void
  onCancel?: () => void
}

interface OutcomeMeasurement {
  id?: string
  metricId: string
  initialValue: number | string | boolean
  finalValue: number | string | boolean
  improvementPercentage: number
  outcomeNotes?: string
  measurementDate: string
}

interface ObjectiveOutcome {
  id?: string
  objectiveId: string
  finalStatus: 'not_achieved' | 'partially_achieved' | 'mostly_achieved' | 'fully_achieved'
  achievementPercentage: number
  outcomeDescription: string
  evidence?: string
  challenges?: string
}

interface Recommendation {
  id?: string
  type: 'follow_up' | 'maintenance' | 'referral' | 'medication' | 'lifestyle' | 'other'
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timeframe?: string
  responsibleParty?: string
  isImplemented: boolean
}

export function FinalReportCreationForm({
  patientId,
  therapistId,
  sessionId,
  therapeuticPlanId,
  onReportCreated,
  onCancel
}: FinalReportCreationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    reportDate: '',
    treatmentStartDate: '',
    treatmentEndDate: '',
    totalSessions: 1,
    treatmentSummary: '',
    presentingProblems: '',
    treatmentGoals: '',
    overallEffectiveness: 'good' as 'excellent' | 'good' | 'fair' | 'poor' | 'not_applicable',
    effectivenessRating: 5,
    patientSatisfaction: 5,
    therapistSatisfaction: 5,
    clinicalAssessment: '',
    functionalImprovements: '',
    behavioralChanges: '',
    emotionalStability: '',
    socialFunctioning: '',
    followUpPlan: '',
    followUpSchedule: '',
    maintenanceRecommendations: '',
    currentRiskLevel: 'low' as 'low' | 'moderate' | 'high' | 'critical',
    riskFactors: [] as string[],
    protectiveFactors: [] as string[],
    safetyPlan: '',
    dischargeReason: 'goals_achieved' as 'goals_achieved' | 'patient_request' | 'insurance_limit' | 'therapist_recommendation' | 'other',
    dischargeStatus: 'successful' as 'successful' | 'partial_success' | 'unsuccessful' | 'transferred',
    dischargeNotes: '',
    status: 'draft' as 'draft' | 'pending_review' | 'approved' | 'finalized',
    isConfidential: false
  })
  
  const [outcomeMeasurements, setOutcomeMeasurements] = useState<OutcomeMeasurement[]>([])
  const [objectiveOutcomes, setObjectiveOutcomes] = useState<ObjectiveOutcome[]>([])
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

  const addOutcomeMeasurement = () => {
    if (metrics.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'No metrics available. Please select a therapeutic plan first.'
      })
      return
    }
    
    const newMeasurement: OutcomeMeasurement = {
      metricId: metrics[0].id,
      initialValue: '',
      finalValue: '',
      improvementPercentage: 0,
      measurementDate: new Date().toISOString().split('T')[0]
    }
    setOutcomeMeasurements([...outcomeMeasurements, newMeasurement])
  }

  const updateOutcomeMeasurement = (index: number, field: keyof OutcomeMeasurement, value: any) => {
    const updatedMeasurements = [...outcomeMeasurements]
    updatedMeasurements[index] = { ...updatedMeasurements[index], [field]: value }
    setOutcomeMeasurements(updatedMeasurements)
  }

  const removeOutcomeMeasurement = (index: number) => {
    const updatedMeasurements = outcomeMeasurements.filter((_, i) => i !== index)
    setOutcomeMeasurements(updatedMeasurements)
  }

  const addObjectiveOutcome = () => {
    if (objectives.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'No objectives available. Please select a therapeutic plan first.'
      })
      return
    }
    
    const newOutcome: ObjectiveOutcome = {
      objectiveId: objectives[0].id,
      finalStatus: 'partially_achieved',
      achievementPercentage: 0,
      outcomeDescription: ''
    }
    setObjectiveOutcomes([...objectiveOutcomes, newOutcome])
  }

  const updateObjectiveOutcome = (index: number, field: keyof ObjectiveOutcome, value: any) => {
    const updatedOutcomes = [...objectiveOutcomes]
    updatedOutcomes[index] = { ...updatedOutcomes[index], [field]: value }
    setObjectiveOutcomes(updatedOutcomes)
  }

  const removeObjectiveOutcome = (index: number) => {
    const updatedOutcomes = objectiveOutcomes.filter((_, i) => i !== index)
    setObjectiveOutcomes(updatedOutcomes)
  }

  const addRecommendation = () => {
    const newRecommendation: Recommendation = {
      type: 'follow_up',
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
    
    if (!formData.treatmentStartDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please select a treatment start date'
      })
      return false
    }
    
    if (!formData.treatmentEndDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please select a treatment end date'
      })
      return false
    }
    
    if (!formData.treatmentSummary.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please enter a treatment summary'
      })
      return false
    }
    
    if (outcomeMeasurements.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please add at least one outcome measurement'
      })
      return false
    }
    
    if (objectiveOutcomes.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please add at least one objective outcome'
      })
      return false
    }
    
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/final-reports', {
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
          outcomeMeasurements,
          objectiveOutcomes,
          recommendations
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create final report')
      }

      toast({
        title: "Success",
        description: 'Final report created successfully'
      })
      if (onReportCreated) {
        onReportCreated(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create final report'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error creating final report:', err)
    } finally {
      setLoading(false)
    }
  }

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'excellent': return 'bg-green-100 text-green-800'
      case 'good': return 'bg-blue-100 text-blue-800'
      case 'fair': return 'bg-yellow-100 text-yellow-800'
      case 'poor': return 'bg-red-100 text-red-800'
      case 'not_applicable': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDischargeStatusColor = (status: string) => {
    switch (status) {
      case 'successful': return 'bg-green-100 text-green-800'
      case 'partial_success': return 'bg-yellow-100 text-yellow-800'
      case 'unsuccessful': return 'bg-red-100 text-red-800'
      case 'transferred': return 'bg-blue-100 text-blue-800'
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
                Create Final Report
              </CardTitle>
              <CardDescription>
                Create a comprehensive final report after treatment completion
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
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="discharge">Discharge</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic information for the final report
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
                  <Label htmlFor="totalSessions">Total Sessions</Label>
                  <Input
                    id="totalSessions"
                    type="number"
                    value={formData.totalSessions}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalSessions: parseInt(e.target.value) || 1 }))}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="treatmentStartDate">Treatment Start Date *</Label>
                  <Input
                    id="treatmentStartDate"
                    type="date"
                    value={formData.treatmentStartDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, treatmentStartDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="treatmentEndDate">Treatment End Date *</Label>
                  <Input
                    id="treatmentEndDate"
                    type="date"
                    value={formData.treatmentEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, treatmentEndDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="treatmentSummary">Treatment Summary *</Label>
                <Textarea
                  id="treatmentSummary"
                  value={formData.treatmentSummary}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatmentSummary: e.target.value }))}
                  placeholder="Provide a comprehensive summary of the treatment"
                  rows={6}
                  maxLength={3000}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {formData.treatmentSummary.length}/3000 characters
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="presentingProblems">Presenting Problems</Label>
                  <Textarea
                    id="presentingProblems"
                    value={formData.presentingProblems}
                    onChange={(e) => setFormData(prev => ({ ...prev, presentingProblems: e.target.value }))}
                    placeholder="Describe the initial presenting problems"
                    rows={4}
                    maxLength={1000}
                  />
                </div>
                <div>
                  <Label htmlFor="treatmentGoals">Treatment Goals</Label>
                  <Textarea
                    id="treatmentGoals"
                    value={formData.treatmentGoals}
                    onChange={(e) => setFormData(prev => ({ ...prev, treatmentGoals: e.target.value }))}
                    placeholder="Describe the treatment goals"
                    rows={4}
                    maxLength={1000}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outcomes Tab */}
        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Outcome Measurements</CardTitle>
                  <CardDescription>
                    Track final outcome measurements and objective achievements
                  </CardDescription>
                </div>
                <Button onClick={addOutcomeMeasurement} disabled={metrics.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Measurement
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {outcomeMeasurements.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Outcome Measurements Added</h3>
                  <p className="text-muted-foreground mb-4">
                    Add outcome measurements to track final results.
                  </p>
                  <Button onClick={addOutcomeMeasurement} disabled={metrics.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Measurement
                  </Button>
                </div>
              ) : (
                outcomeMeasurements.map((measurement, index) => {
                  const metric = metrics.find(m => m.id === measurement.metricId)
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
                          onClick={() => removeOutcomeMeasurement(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div>
                        <Label>Metric</Label>
                        <Select value={measurement.metricId} onValueChange={(value) => updateOutcomeMeasurement(index, 'metricId', value)}>
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Initial Value *</Label>
                          {metric?.type === 'numeric' && (
                            <Input
                              type="number"
                              value={measurement.initialValue as number}
                              onChange={(e) => updateOutcomeMeasurement(index, 'initialValue', parseFloat(e.target.value) || 0)}
                              placeholder="Enter initial value"
                            />
                          )}
                          {metric?.type === 'boolean' && (
                            <Select value={measurement.initialValue as string} onValueChange={(value) => updateOutcomeMeasurement(index, 'initialValue', value === 'true')}>
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
                              value={measurement.initialValue as string}
                              onChange={(e) => updateOutcomeMeasurement(index, 'initialValue', e.target.value)}
                              placeholder="Enter initial value"
                              maxLength={metric?.maxLength || 1000}
                            />
                          )}
                        </div>
                        <div>
                          <Label>Final Value *</Label>
                          {metric?.type === 'numeric' && (
                            <Input
                              type="number"
                              value={measurement.finalValue as number}
                              onChange={(e) => updateOutcomeMeasurement(index, 'finalValue', parseFloat(e.target.value) || 0)}
                              placeholder="Enter final value"
                            />
                          )}
                          {metric?.type === 'boolean' && (
                            <Select value={measurement.finalValue as string} onValueChange={(value) => updateOutcomeMeasurement(index, 'finalValue', value === 'true')}>
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
                              value={measurement.finalValue as string}
                              onChange={(e) => updateOutcomeMeasurement(index, 'finalValue', e.target.value)}
                              placeholder="Enter final value"
                              maxLength={metric?.maxLength || 1000}
                            />
                          )}
                        </div>
                        <div>
                          <Label>Improvement %</Label>
                          <Input
                            type="number"
                            value={measurement.improvementPercentage}
                            onChange={(e) => updateOutcomeMeasurement(index, 'improvementPercentage', parseFloat(e.target.value) || 0)}
                            min="-100"
                            max="1000"
                            placeholder="Enter improvement percentage"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Outcome Notes</Label>
                        <Textarea
                          value={measurement.outcomeNotes || ''}
                          onChange={(e) => updateOutcomeMeasurement(index, 'outcomeNotes', e.target.value)}
                          placeholder="Add notes about this outcome measurement"
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

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Assessment</CardTitle>
              <CardDescription>
                Provide comprehensive clinical assessment and effectiveness evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="overallEffectiveness">Overall Effectiveness</Label>
                  <Select value={formData.overallEffectiveness} onValueChange={(value: any) => setFormData(prev => ({ ...prev, overallEffectiveness: value }))}>
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
                  <Label htmlFor="effectivenessRating">Effectiveness Rating (1-10)</Label>
                  <Input
                    id="effectivenessRating"
                    type="number"
                    value={formData.effectivenessRating}
                    onChange={(e) => setFormData(prev => ({ ...prev, effectivenessRating: parseInt(e.target.value) || 5 }))}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patientSatisfaction">Patient Satisfaction (1-10)</Label>
                  <Input
                    id="patientSatisfaction"
                    type="number"
                    value={formData.patientSatisfaction}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientSatisfaction: parseInt(e.target.value) || 5 }))}
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <Label htmlFor="therapistSatisfaction">Therapist Satisfaction (1-10)</Label>
                  <Input
                    id="therapistSatisfaction"
                    type="number"
                    value={formData.therapistSatisfaction}
                    onChange={(e) => setFormData(prev => ({ ...prev, therapistSatisfaction: parseInt(e.target.value) || 5 }))}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="clinicalAssessment">Clinical Assessment *</Label>
                <Textarea
                  id="clinicalAssessment"
                  value={formData.clinicalAssessment}
                  onChange={(e) => setFormData(prev => ({ ...prev, clinicalAssessment: e.target.value }))}
                  placeholder="Provide comprehensive clinical assessment"
                  rows={6}
                  maxLength={2000}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {formData.clinicalAssessment.length}/2000 characters
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="functionalImprovements">Functional Improvements</Label>
                  <Textarea
                    id="functionalImprovements"
                    value={formData.functionalImprovements}
                    onChange={(e) => setFormData(prev => ({ ...prev, functionalImprovements: e.target.value }))}
                    placeholder="Describe functional improvements"
                    rows={3}
                    maxLength={1000}
                  />
                </div>
                <div>
                  <Label htmlFor="behavioralChanges">Behavioral Changes</Label>
                  <Textarea
                    id="behavioralChanges"
                    value={formData.behavioralChanges}
                    onChange={(e) => setFormData(prev => ({ ...prev, behavioralChanges: e.target.value }))}
                    placeholder="Describe behavioral changes"
                    rows={3}
                    maxLength={1000}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emotionalStability">Emotional Stability</Label>
                  <Textarea
                    id="emotionalStability"
                    value={formData.emotionalStability}
                    onChange={(e) => setFormData(prev => ({ ...prev, emotionalStability: e.target.value }))}
                    placeholder="Describe emotional stability"
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recommendations & Follow-up</CardTitle>
                  <CardDescription>
                    Provide recommendations and follow-up planning
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
                <Label htmlFor="followUpPlan">Follow-up Plan</Label>
                <Textarea
                  id="followUpPlan"
                  value={formData.followUpPlan}
                  onChange={(e) => setFormData(prev => ({ ...prev, followUpPlan: e.target.value }))}
                  placeholder="Describe the follow-up plan"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              
              <div>
                <Label htmlFor="maintenanceRecommendations">Maintenance Recommendations</Label>
                <Textarea
                  id="maintenanceRecommendations"
                  value={formData.maintenanceRecommendations}
                  onChange={(e) => setFormData(prev => ({ ...prev, maintenanceRecommendations: e.target.value }))}
                  placeholder="Describe maintenance recommendations"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Recommendations Added</h3>
                  <p className="text-muted-foreground mb-4">
                    Add recommendations for follow-up, maintenance, or referrals.
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
                            <SelectItem value="follow_up">Follow-up</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="referral">Referral</SelectItem>
                            <SelectItem value="medication">Medication</SelectItem>
                            <SelectItem value="lifestyle">Lifestyle</SelectItem>
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
                        <Label>Timeframe</Label>
                        <Input
                          value={recommendation.timeframe || ''}
                          onChange={(e) => updateRecommendation(index, 'timeframe', e.target.value)}
                          placeholder="e.g., 3 months"
                          maxLength={100}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Responsible Party</Label>
                      <Input
                        value={recommendation.responsibleParty || ''}
                        onChange={(e) => updateRecommendation(index, 'responsibleParty', e.target.value)}
                        placeholder="e.g., Patient, Therapist, Family"
                        maxLength={100}
                      />
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

        {/* Discharge Tab */}
        <TabsContent value="discharge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Discharge Information</CardTitle>
              <CardDescription>
                Complete discharge information and final status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dischargeReason">Discharge Reason</Label>
                  <Select value={formData.dischargeReason} onValueChange={(value: any) => setFormData(prev => ({ ...prev, dischargeReason: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goals_achieved">Goals Achieved</SelectItem>
                      <SelectItem value="patient_request">Patient Request</SelectItem>
                      <SelectItem value="insurance_limit">Insurance Limit</SelectItem>
                      <SelectItem value="therapist_recommendation">Therapist Recommendation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dischargeStatus">Discharge Status</Label>
                  <Select value={formData.dischargeStatus} onValueChange={(value: any) => setFormData(prev => ({ ...prev, dischargeStatus: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="successful">Successful</SelectItem>
                      <SelectItem value="partial_success">Partial Success</SelectItem>
                      <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="dischargeNotes">Discharge Notes</Label>
                <Textarea
                  id="dischargeNotes"
                  value={formData.dischargeNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, dischargeNotes: e.target.value }))}
                  placeholder="Add any additional discharge notes"
                  rows={4}
                  maxLength={1000}
                />
              </div>
              
              <div>
                <Label htmlFor="safetyPlan">Safety Plan</Label>
                <Textarea
                  id="safetyPlan"
                  value={formData.safetyPlan}
                  onChange={(e) => setFormData(prev => ({ ...prev, safetyPlan: e.target.value }))}
                  placeholder="Describe any safety plan or precautions"
                  rows={3}
                  maxLength={1000}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
