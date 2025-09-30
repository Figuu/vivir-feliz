'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  FileText,
  Plus,
  Minus,
  Save,
  Send,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  X,
  RefreshCw,
  Download,
  Upload,
  ChevronUp,
  ChevronDown,
  GripVertical
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface ReportCompilationInterfaceProps {
  coordinatorId?: string
  patientId?: string
  onCompilationComplete?: (compilation: any) => void
}

interface AvailableReport {
  id: string
  reportType: string
  title: string
  submittedAt: string
  therapist: {
    firstName: string
    lastName: string
  }
}

interface IncludedReport {
  submissionId: string
  reportType: string
  includeInCompilation: boolean
  order: number
  notes?: string
}

export function ReportCompilationInterface({
  coordinatorId,
  patientId,
  onCompilationComplete
}: ReportCompilationInterfaceProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  
  // Data state
  const [availableReports, setAvailableReports] = useState<AvailableReport[]>([])
  const [patients, setPatients] = useState<any[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    patientId: patientId || '',
    coordinatorId: coordinatorId || 'coordinator-1',
    title: '',
    description: '',
    executiveSummary: '',
    overallAssessment: '',
    keyFindings: [''] as string[],
    recommendations: [{
      category: 'treatment' as 'treatment' | 'medication' | 'lifestyle' | 'referral' | 'monitoring' | 'follow_up',
      priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
      description: '',
      responsibleParty: '',
      timeline: ''
    }],
    treatmentOutcomes: {
      initialStatus: '',
      currentStatus: '',
      progressSummary: '',
      achievedGoals: [''] as string[],
      ongoingChallenges: [''] as string[],
      overallImprovement: 0
    },
    clinicalNotes: '',
    includedReports: [] as IncludedReport[],
    tags: [] as string[],
    status: 'draft' as 'draft' | 'under_review' | 'completed' | 'published',
    requiresAdminApproval: false
  })

  const [newTag, setNewTag] = useState('')

  // Load initial data
  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    if (formData.patientId) {
      loadAvailableReports()
    }
  }, [formData.patientId])

  const loadPatients = async () => {
    try {
      const response = await fetch('/api/patients?limit=100')
      const result = await response.json()
      if (response.ok) {
        setPatients(result.data.patients || [])
      }
    } catch (err) {
      console.error('Error loading patients:', err)
    }
  }

  const loadAvailableReports = async () => {
    try {
      const response = await fetch(`/api/final-report-compilation?action=available_reports&patientId=${formData.patientId}`)
      const result = await response.json()
      
      if (response.ok) {
        setAvailableReports(result.data || [])
        
        // Auto-add all available reports to included reports
        const reports = result.data.map((report: AvailableReport, index: number) => ({
          submissionId: report.id,
          reportType: report.reportType,
          includeInCompilation: true,
          order: index,
          notes: ''
        }))
        setFormData(prev => ({ ...prev, includedReports: reports }))
      }
    } catch (err) {
      console.error('Error loading available reports:', err)
    }
  }

  const handleSubmit = async (status: 'draft' | 'completed') => {
    if (!formData.title || !formData.executiveSummary || !formData.overallAssessment) {
      toast.error('Please fill in all required fields')
      return
    }

    if (formData.includedReports.length === 0) {
      toast.error('Please include at least one report')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/final-report-compilation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          status,
          keyFindings: formData.keyFindings.filter(f => f.trim()),
          recommendations: formData.recommendations.filter(r => r.description.trim()),
          treatmentOutcomes: {
            ...formData.treatmentOutcomes,
            achievedGoals: formData.treatmentOutcomes.achievedGoals.filter(g => g.trim()),
            ongoingChallenges: formData.treatmentOutcomes.ongoingChallenges.filter(c => c.trim())
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create compilation')
      }

      toast.success(status === 'draft' ? 'Compilation saved as draft' : 'Compilation completed successfully')
      
      if (onCompilationComplete) {
        onCompilationComplete(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create compilation'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error creating compilation:', err)
    } finally {
      setLoading(false)
    }
  }

  const addKeyFinding = () => {
    setFormData(prev => ({
      ...prev,
      keyFindings: [...prev.keyFindings, '']
    }))
  }

  const removeKeyFinding = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keyFindings: prev.keyFindings.filter((_, i) => i !== index)
    }))
  }

  const updateKeyFinding = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      keyFindings: prev.keyFindings.map((f, i) => i === index ? value : f)
    }))
  }

  const addRecommendation = () => {
    setFormData(prev => ({
      ...prev,
      recommendations: [...prev.recommendations, {
        category: 'treatment' as const,
        priority: 'medium' as const,
        description: '',
        responsibleParty: '',
        timeline: ''
      }]
    }))
  }

  const removeRecommendation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index)
    }))
  }

  const updateRecommendation = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      recommendations: prev.recommendations.map((r, i) => 
        i === index ? { ...r, [field]: value } : r
      )
    }))
  }

  const addAchievedGoal = () => {
    setFormData(prev => ({
      ...prev,
      treatmentOutcomes: {
        ...prev.treatmentOutcomes,
        achievedGoals: [...prev.treatmentOutcomes.achievedGoals, '']
      }
    }))
  }

  const removeAchievedGoal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      treatmentOutcomes: {
        ...prev.treatmentOutcomes,
        achievedGoals: prev.treatmentOutcomes.achievedGoals.filter((_, i) => i !== index)
      }
    }))
  }

  const updateAchievedGoal = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      treatmentOutcomes: {
        ...prev.treatmentOutcomes,
        achievedGoals: prev.treatmentOutcomes.achievedGoals.map((g, i) => i === index ? value : g)
      }
    }))
  }

  const addOngoingChallenge = () => {
    setFormData(prev => ({
      ...prev,
      treatmentOutcomes: {
        ...prev.treatmentOutcomes,
        ongoingChallenges: [...prev.treatmentOutcomes.ongoingChallenges, '']
      }
    }))
  }

  const removeOngoingChallenge = (index: number) => {
    setFormData(prev => ({
      ...prev,
      treatmentOutcomes: {
        ...prev.treatmentOutcomes,
        ongoingChallenges: prev.treatmentOutcomes.ongoingChallenges.filter((_, i) => i !== index)
      }
    }))
  }

  const updateOngoingChallenge = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      treatmentOutcomes: {
        ...prev.treatmentOutcomes,
        ongoingChallenges: prev.treatmentOutcomes.ongoingChallenges.map((c, i) => i === index ? value : c)
      }
    }))
  }

  const toggleReportInclusion = (submissionId: string) => {
    setFormData(prev => ({
      ...prev,
      includedReports: prev.includedReports.map(r =>
        r.submissionId === submissionId ? { ...r, includeInCompilation: !r.includeInCompilation } : r
      )
    }))
  }

  const moveReportUp = (index: number) => {
    if (index === 0) return
    
    setFormData(prev => {
      const reports = [...prev.includedReports]
      const temp = reports[index]
      reports[index] = { ...reports[index - 1], order: index }
      reports[index - 1] = { ...temp, order: index - 1 }
      return { ...prev, includedReports: reports }
    })
  }

  const moveReportDown = (index: number) => {
    if (index === formData.includedReports.length - 1) return
    
    setFormData(prev => {
      const reports = [...prev.includedReports]
      const temp = reports[index]
      reports[index] = { ...reports[index + 1], order: index }
      reports[index + 1] = { ...temp, order: index + 1 }
      return { ...prev, includedReports: reports }
    })
  }

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }))
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Final Report Compilation
          </CardTitle>
          <CardDescription>
            Compile multiple approved reports into a comprehensive final report
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          <TabsTrigger value="reports">Included Reports</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="patient">Patient *</Label>
                <Select value={formData.patientId} onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}>
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
                <Label htmlFor="title">Compilation Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter compilation title"
                  maxLength={200}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter compilation description"
                  rows={3}
                  maxLength={2000}
                />
              </div>
              
              <div>
                <Label>Tags</Label>
                <div className="flex items-center space-x-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    maxLength={50}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compilation Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="executiveSummary">Executive Summary *</Label>
                <Textarea
                  id="executiveSummary"
                  value={formData.executiveSummary}
                  onChange={(e) => setFormData(prev => ({ ...prev, executiveSummary: e.target.value }))}
                  placeholder="Enter executive summary"
                  rows={6}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.executiveSummary.length}/5000 characters
                </p>
              </div>
              
              <div>
                <Label htmlFor="overallAssessment">Overall Assessment *</Label>
                <Textarea
                  id="overallAssessment"
                  value={formData.overallAssessment}
                  onChange={(e) => setFormData(prev => ({ ...prev, overallAssessment: e.target.value }))}
                  placeholder="Enter overall assessment"
                  rows={6}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.overallAssessment.length}/5000 characters
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Key Findings *</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addKeyFinding}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Finding
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.keyFindings.map((finding, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Textarea
                        value={finding}
                        onChange={(e) => updateKeyFinding(index, e.target.value)}
                        placeholder="Enter key finding"
                        rows={2}
                        maxLength={500}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeKeyFinding(index)}
                        disabled={formData.keyFindings.length === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Recommendations *</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addRecommendation}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Recommendation
                  </Button>
                </div>
                <div className="space-y-4">
                  {formData.recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Recommendation {index + 1}</h4>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeRecommendation(index)}
                          disabled={formData.recommendations.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Select 
                            value={rec.category} 
                            onValueChange={(value) => updateRecommendation(index, 'category', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="treatment">Treatment</SelectItem>
                              <SelectItem value="medication">Medication</SelectItem>
                              <SelectItem value="lifestyle">Lifestyle</SelectItem>
                              <SelectItem value="referral">Referral</SelectItem>
                              <SelectItem value="monitoring">Monitoring</SelectItem>
                              <SelectItem value="follow_up">Follow-up</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Priority</Label>
                          <Select 
                            value={rec.priority} 
                            onValueChange={(value) => updateRecommendation(index, 'priority', value)}
                          >
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
                      </div>
                      
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={rec.description}
                          onChange={(e) => updateRecommendation(index, 'description', e.target.value)}
                          placeholder="Enter recommendation description"
                          rows={3}
                          maxLength={1000}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Responsible Party</Label>
                          <Input
                            value={rec.responsibleParty}
                            onChange={(e) => updateRecommendation(index, 'responsibleParty', e.target.value)}
                            placeholder="Who is responsible"
                            maxLength={200}
                          />
                        </div>
                        
                        <div>
                          <Label>Timeline</Label>
                          <Input
                            value={rec.timeline}
                            onChange={(e) => updateRecommendation(index, 'timeline', e.target.value)}
                            placeholder="Expected timeline"
                            maxLength={200}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="clinicalNotes">Clinical Notes</Label>
                <Textarea
                  id="clinicalNotes"
                  value={formData.clinicalNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, clinicalNotes: e.target.value }))}
                  placeholder="Enter additional clinical notes"
                  rows={4}
                  maxLength={5000}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Outcomes Tab - Due to length, simplified */}
        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Outcomes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="initialStatus">Initial Status *</Label>
                <Textarea
                  id="initialStatus"
                  value={formData.treatmentOutcomes.initialStatus}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    treatmentOutcomes: { ...prev.treatmentOutcomes, initialStatus: e.target.value }
                  }))}
                  placeholder="Describe initial patient status"
                  rows={4}
                  maxLength={1000}
                />
              </div>
              
              <div>
                <Label htmlFor="currentStatus">Current Status *</Label>
                <Textarea
                  id="currentStatus"
                  value={formData.treatmentOutcomes.currentStatus}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    treatmentOutcomes: { ...prev.treatmentOutcomes, currentStatus: e.target.value }
                  }))}
                  placeholder="Describe current patient status"
                  rows={4}
                  maxLength={1000}
                />
              </div>
              
              <div>
                <Label htmlFor="progressSummary">Progress Summary *</Label>
                <Textarea
                  id="progressSummary"
                  value={formData.treatmentOutcomes.progressSummary}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    treatmentOutcomes: { ...prev.treatmentOutcomes, progressSummary: e.target.value }
                  }))}
                  placeholder="Summarize treatment progress"
                  rows={4}
                  maxLength={2000}
                />
              </div>
              
              <div>
                <Label htmlFor="overallImprovement">Overall Improvement (%)</Label>
                <Input
                  id="overallImprovement"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.treatmentOutcomes.overallImprovement}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    treatmentOutcomes: { ...prev.treatmentOutcomes, overallImprovement: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Included Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Included Reports ({formData.includedReports.filter(r => r.includeInCompilation).length})</CardTitle>
              <CardDescription>
                Select and order the reports to include in the compilation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableReports.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No approved reports available for this patient. Please ensure reports are approved before compiling.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {formData.includedReports.map((report, index) => {
                    const reportInfo = availableReports.find(r => r.id === report.submissionId)
                    if (!reportInfo) return null
                    
                    return (
                      <div key={report.submissionId} className="flex items-center space-x-2 border rounded-lg p-3">
                        <Checkbox
                          checked={report.includeInCompilation}
                          onCheckedChange={() => toggleReportInclusion(report.submissionId)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{reportInfo.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {reportInfo.reportType.replace('_', ' ')} - {reportInfo.therapist.firstName} {reportInfo.therapist.lastName}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => moveReportUp(index)} disabled={index === 0}>
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => moveReportDown(index)} disabled={index === formData.includedReports.length - 1}>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresAdminApproval"
                checked={formData.requiresAdminApproval}
                onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, requiresAdminApproval: checked }))}
              />
              <Label htmlFor="requiresAdminApproval">Requires Administrator Approval</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => handleSubmit('draft')} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save as Draft'}
              </Button>
              <Button onClick={() => handleSubmit('completed')} disabled={loading}>
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Completing...' : 'Complete Compilation'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
