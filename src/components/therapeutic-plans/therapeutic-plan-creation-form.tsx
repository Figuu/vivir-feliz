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
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface TherapeuticPlanCreationFormProps {
  patientId?: string
  therapistId?: string
  sessionId?: string
  onPlanCreated?: (plan: any) => void
  onCancel?: () => void
}

interface Objective {
  id?: string
  title: string
  description: string
  category: 'behavioral' | 'emotional' | 'cognitive' | 'social' | 'physical' | 'other'
  priority: 'low' | 'medium' | 'high' | 'critical'
  targetDate: string
  metrics: Metric[]
}

interface Metric {
  id?: string
  name: string
  description: string
  type: 'numeric' | 'scale' | 'boolean' | 'text' | 'percentage'
  minValue?: number
  maxValue?: number
  targetValue?: number
  currentValue?: number
  scaleMin?: number
  scaleMax?: number
  maxLength?: number
  isPositive?: boolean
  unit?: string
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'as-needed'
  isRequired: boolean
}

export function TherapeuticPlanCreationForm({
  patientId,
  therapistId,
  sessionId,
  onPlanCreated,
  onCancel
}: TherapeuticPlanCreationFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [activeTab, setActiveTab] = useState('basic')
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    treatmentApproach: '',
    estimatedDuration: 12,
    frequency: 'weekly' as 'weekly' | 'bi-weekly' | 'monthly' | 'as-needed',
    riskFactors: [] as string[],
    safetyPlan: '',
    collaborationNotes: '',
    reviewSchedule: 'monthly' as 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly',
    nextReviewDate: ''
  })
  
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [newRiskFactor, setNewRiskFactor] = useState('')
  const [patients, setPatients] = useState<any[]>([])
  const [therapists, setTherapists] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

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

      // Load sessions if patientId is provided
      if (patientId) {
        const sessionsResponse = await fetch(`/api/sessions?patientId=${patientId}&limit=100`)
        const sessionsResult = await sessionsResponse.json()
        if (sessionsResponse.ok) {
          setSessions(sessionsResult.data.sessions || [])
        }
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const addObjective = () => {
    const newObjective: Objective = {
      title: '',
      description: '',
      category: 'behavioral',
      priority: 'medium',
      targetDate: '',
      metrics: []
    }
    setObjectives([...objectives, newObjective])
  }

  const updateObjective = (index: number, field: keyof Objective, value: any) => {
    const updatedObjectives = [...objectives]
    updatedObjectives[index] = { ...updatedObjectives[index], [field]: value }
    setObjectives(updatedObjectives)
  }

  const removeObjective = (index: number) => {
    const updatedObjectives = objectives.filter((_, i) => i !== index)
    setObjectives(updatedObjectives)
  }

  const addMetric = (objectiveIndex: number) => {
    const newMetric: Metric = {
      name: '',
      description: '',
      type: 'numeric',
      frequency: 'weekly',
      isRequired: false
    }
    const updatedObjectives = [...objectives]
    updatedObjectives[objectiveIndex].metrics.push(newMetric)
    setObjectives(updatedObjectives)
  }

  const updateMetric = (objectiveIndex: number, metricIndex: number, field: keyof Metric, value: any) => {
    const updatedObjectives = [...objectives]
    updatedObjectives[objectiveIndex].metrics[metricIndex] = {
      ...updatedObjectives[objectiveIndex].metrics[metricIndex],
      [field]: value
    }
    setObjectives(updatedObjectives)
  }

  const removeMetric = (objectiveIndex: number, metricIndex: number) => {
    const updatedObjectives = [...objectives]
    updatedObjectives[objectiveIndex].metrics = updatedObjectives[objectiveIndex].metrics.filter((_, i) => i !== metricIndex)
    setObjectives(updatedObjectives)
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

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please enter a plan title'
      })
      return false
    }
    
    if (!formData.description.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please enter a plan description'
      })
      return false
    }
    
    if (!formData.treatmentApproach.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please enter a treatment approach'
      })
      return false
    }
    
    if (objectives.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please add at least one objective'
      })
      return false
    }
    
    for (let i = 0; i < objectives.length; i++) {
      const objective = objectives[i]
      
      if (!objective.title.trim()) {
        toast({
        variant: "destructive",
        title: "Error",
        description: `Please enter a title for objective ${i + 1}`
      })
        return false
      }
      
      if (!objective.description.trim()) {
        toast({
        variant: "destructive",
        title: "Error",
        description: `Please enter a description for objective ${i + 1}`
      })
        return false
      }
      
      if (!objective.targetDate) {
        toast({
        variant: "destructive",
        title: "Error",
        description: `Please select a target date for objective ${i + 1}`
      })
        return false
      }
      
      if (objective.metrics.length === 0) {
        toast({
        variant: "destructive",
        title: "Error",
        description: `Please add at least one metric for objective ${i + 1}`
      })
        return false
      }
      
      for (let j = 0; j < objective.metrics.length; j++) {
        const metric = objective.metrics[j]
        
        if (!metric.name.trim()) {
          toast({
        variant: "destructive",
        title: "Error",
        description: `Please enter a name for metric ${j + 1} in objective ${i + 1}`
      })
          return false
        }
        
        if (!metric.description.trim()) {
          toast({
        variant: "destructive",
        title: "Error",
        description: `Please enter a description for metric ${j + 1} in objective ${i + 1}`
      })
          return false
        }
        
        // Validate numeric metrics
        if (metric.type === 'numeric') {
          if (metric.minValue !== undefined && metric.maxValue !== undefined) {
            if (metric.minValue >= metric.maxValue) {
              toast({
        variant: "destructive",
        title: "Error",
        description: `Metric "${metric.name}": minValue must be less than maxValue`
      })
              return false
            }
          }
        }
        
        // Validate scale metrics
        if (metric.type === 'scale') {
          if (metric.scaleMin !== undefined && metric.scaleMax !== undefined) {
            if (metric.scaleMin >= metric.scaleMax) {
              toast({
        variant: "destructive",
        title: "Error",
        description: `Metric "${metric.name}": scaleMin must be less than scaleMax`
      })
              return false
            }
          }
        }
        
        // Validate text metrics
        if (metric.type === 'text' && !metric.maxLength) {
          toast({
        variant: "destructive",
        title: "Error",
        description: `Metric "${metric.name}": maxLength is required for text type`
      })
          return false
        }
      }
    }
    
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapeutic-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          therapistId,
          sessionId,
          ...formData,
          objectives
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create therapeutic plan')
      }

      toast({
        title: "Success",
        description: 'Therapeutic plan created successfully'
      })
      if (onPlanCreated) {
        onPlanCreated(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create therapeutic plan'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error creating therapeutic plan:', err)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'behavioral': return 'bg-blue-100 text-blue-800'
      case 'emotional': return 'bg-purple-100 text-purple-800'
      case 'cognitive': return 'bg-green-100 text-green-800'
      case 'social': return 'bg-pink-100 text-pink-800'
      case 'physical': return 'bg-orange-100 text-orange-800'
      case 'other': return 'bg-gray-100 text-gray-800'
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
                Create Therapeutic Plan
              </CardTitle>
              <CardDescription>
                Create a comprehensive therapeutic plan after the first session
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Plan'}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="objectives">Objectives</TabsTrigger>
          <TabsTrigger value="treatment">Treatment</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic information for the therapeutic plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Plan Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter plan title"
                  maxLength={100}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {formData.title.length}/100 characters
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter plan description"
                  rows={4}
                  maxLength={1000}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {formData.description.length}/1000 characters
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedDuration">Estimated Duration (weeks)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 12 }))}
                    min="1"
                    max="104"
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Session Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="as-needed">As Needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Objectives Tab */}
        <TabsContent value="objectives" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Objectives & Metrics</CardTitle>
                  <CardDescription>
                    Define therapeutic objectives and their measurement metrics
                  </CardDescription>
                </div>
                <Button onClick={addObjective}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Objective
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {objectives.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Objectives Added</h3>
                  <p className="text-muted-foreground mb-4">
                    Add objectives to define the goals of the therapeutic plan.
                  </p>
                  <Button onClick={addObjective}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Objective
                  </Button>
                </div>
              ) : (
                objectives.map((objective, objectiveIndex) => (
                  <motion.div
                    key={objectiveIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(objective.priority)}>
                          {objective.priority}
                        </Badge>
                        <Badge className={getCategoryColor(objective.category)}>
                          {objective.category}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeObjective(objectiveIndex)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Objective Title *</Label>
                        <Input
                          value={objective.title}
                          onChange={(e) => updateObjective(objectiveIndex, 'title', e.target.value)}
                          placeholder="Enter objective title"
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <Label>Target Date *</Label>
                        <Input
                          type="date"
                          value={objective.targetDate}
                          onChange={(e) => updateObjective(objectiveIndex, 'targetDate', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>Description *</Label>
                      <Textarea
                        value={objective.description}
                        onChange={(e) => updateObjective(objectiveIndex, 'description', e.target.value)}
                        placeholder="Enter objective description"
                        rows={3}
                        maxLength={500}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Category</Label>
                        <Select value={objective.category} onValueChange={(value: any) => updateObjective(objectiveIndex, 'category', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="behavioral">Behavioral</SelectItem>
                            <SelectItem value="emotional">Emotional</SelectItem>
                            <SelectItem value="cognitive">Cognitive</SelectItem>
                            <SelectItem value="social">Social</SelectItem>
                            <SelectItem value="physical">Physical</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Select value={objective.priority} onValueChange={(value: any) => updateObjective(objectiveIndex, 'priority', value)}>
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
                    </div>
                    
                    {/* Metrics */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Metrics</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addMetric(objectiveIndex)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Metric
                        </Button>
                      </div>
                      
                      {objective.metrics.map((metric, metricIndex) => (
                        <div key={metricIndex} className="border rounded p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{metric.type}</Badge>
                              {metric.isRequired && <Badge variant="destructive">Required</Badge>}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMetric(objectiveIndex, metricIndex)}
                              className="text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Metric Name *</Label>
                              <Input
                                value={metric.name}
                                onChange={(e) => updateMetric(objectiveIndex, metricIndex, 'name', e.target.value)}
                                placeholder="Enter metric name"
                                maxLength={50}
                              />
                            </div>
                            <div>
                              <Label>Type</Label>
                              <Select value={metric.type} onValueChange={(value: any) => updateMetric(objectiveIndex, metricIndex, 'type', value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="numeric">Numeric</SelectItem>
                                  <SelectItem value="scale">Scale (1-10)</SelectItem>
                                  <SelectItem value="boolean">Yes/No</SelectItem>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="percentage">Percentage</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Description *</Label>
                            <Input
                              value={metric.description}
                              onChange={(e) => updateMetric(objectiveIndex, metricIndex, 'description', e.target.value)}
                              placeholder="Enter metric description"
                              maxLength={200}
                            />
                          </div>
                          
                          {/* Metric-specific fields */}
                          {metric.type === 'numeric' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label>Min Value</Label>
                                <Input
                                  type="number"
                                  value={metric.minValue || ''}
                                  onChange={(e) => updateMetric(objectiveIndex, metricIndex, 'minValue', parseFloat(e.target.value) || undefined)}
                                />
                              </div>
                              <div>
                                <Label>Max Value</Label>
                                <Input
                                  type="number"
                                  value={metric.maxValue || ''}
                                  onChange={(e) => updateMetric(objectiveIndex, metricIndex, 'maxValue', parseFloat(e.target.value) || undefined)}
                                />
                              </div>
                              <div>
                                <Label>Target Value</Label>
                                <Input
                                  type="number"
                                  value={metric.targetValue || ''}
                                  onChange={(e) => updateMetric(objectiveIndex, metricIndex, 'targetValue', parseFloat(e.target.value) || undefined)}
                                />
                              </div>
                            </div>
                          )}
                          
                          {metric.type === 'scale' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <Label>Scale Min</Label>
                                <Input
                                  type="number"
                                  value={metric.scaleMin || ''}
                                  onChange={(e) => updateMetric(objectiveIndex, metricIndex, 'scaleMin', parseInt(e.target.value) || undefined)}
                                  min="1"
                                />
                              </div>
                              <div>
                                <Label>Scale Max</Label>
                                <Input
                                  type="number"
                                  value={metric.scaleMax || ''}
                                  onChange={(e) => updateMetric(objectiveIndex, metricIndex, 'scaleMax', parseInt(e.target.value) || undefined)}
                                  max="10"
                                />
                              </div>
                            </div>
                          )}
                          
                          {metric.type === 'text' && (
                            <div>
                              <Label>Max Length</Label>
                              <Input
                                type="number"
                                value={metric.maxLength || ''}
                                onChange={(e) => updateMetric(objectiveIndex, metricIndex, 'maxLength', parseInt(e.target.value) || undefined)}
                                min="1"
                                max="1000"
                              />
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Frequency</Label>
                              <Select value={metric.frequency} onValueChange={(value: any) => updateMetric(objectiveIndex, metricIndex, 'frequency', value)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily</SelectItem>
                                  <SelectItem value="weekly">Weekly</SelectItem>
                                  <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="as-needed">As Needed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`required-${objectiveIndex}-${metricIndex}`}
                                checked={metric.isRequired}
                                onChange={(e) => updateMetric(objectiveIndex, metricIndex, 'isRequired', e.target.checked)}
                                className="rounded"
                              />
                              <Label htmlFor={`required-${objectiveIndex}-${metricIndex}`}>Required</Label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatment Tab */}
        <TabsContent value="treatment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Approach</CardTitle>
              <CardDescription>
                Define the treatment approach and risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="treatmentApproach">Treatment Approach *</Label>
                <Textarea
                  id="treatmentApproach"
                  value={formData.treatmentApproach}
                  onChange={(e) => setFormData(prev => ({ ...prev, treatmentApproach: e.target.value }))}
                  placeholder="Describe the treatment approach and methodology"
                  rows={6}
                  maxLength={1000}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {formData.treatmentApproach.length}/1000 characters
                </div>
              </div>
              
              <div>
                <Label htmlFor="safetyPlan">Safety Plan</Label>
                <Textarea
                  id="safetyPlan"
                  value={formData.safetyPlan}
                  onChange={(e) => setFormData(prev => ({ ...prev, safetyPlan: e.target.value }))}
                  placeholder="Describe any safety considerations and emergency procedures"
                  rows={4}
                  maxLength={1000}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {formData.safetyPlan.length}/1000 characters
                </div>
              </div>
              
              <div>
                <Label htmlFor="collaborationNotes">Collaboration Notes</Label>
                <Textarea
                  id="collaborationNotes"
                  value={formData.collaborationNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, collaborationNotes: e.target.value }))}
                  placeholder="Notes for collaboration with other healthcare providers"
                  rows={4}
                  maxLength={1000}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {formData.collaborationNotes.length}/1000 characters
                </div>
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
                      <Badge key={index} variant="outline" className="flex items-center space-x-1">
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review & Approval</CardTitle>
              <CardDescription>
                Set up review schedule and finalize the plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reviewSchedule">Review Schedule</Label>
                  <Select value={formData.reviewSchedule} onValueChange={(value: any) => setFormData(prev => ({ ...prev, reviewSchedule: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nextReviewDate">Next Review Date *</Label>
                  <Input
                    id="nextReviewDate"
                    type="date"
                    value={formData.nextReviewDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextReviewDate: e.target.value }))}
                  />
                </div>
              </div>
              
              {/* Plan Summary */}
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Plan Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Title:</span> {formData.title || 'Not specified'}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {formData.estimatedDuration} weeks
                  </div>
                  <div>
                    <span className="font-medium">Frequency:</span> {formData.frequency}
                  </div>
                  <div>
                    <span className="font-medium">Objectives:</span> {objectives.length}
                  </div>
                  <div>
                    <span className="font-medium">Total Metrics:</span> {objectives.reduce((sum, obj) => sum + obj.metrics.length, 0)}
                  </div>
                  <div>
                    <span className="font-medium">Risk Factors:</span> {formData.riskFactors.length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
