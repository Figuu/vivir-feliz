'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Send,
  Save,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  X,
  RefreshCw,
  Download,
  Upload,
  Plus,
  Minus,
  Info,
  CheckSquare,
  Calendar,
  User,
  Tag,
  Paperclip,
  File,
  Link as LinkIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface TherapistReportSubmissionProps {
  therapistId?: string
  patientId?: string
  onSubmissionComplete?: (submission: any) => void
}

interface ReportSubmission {
  id: string
  reportType: string
  reportId: string
  title: string
  description: string
  submissionType: 'draft' | 'final'
  status: string
  content: {
    summary?: string
    findings?: string
    recommendations?: string
    attachments: Array<{
      name: string
      url: string
      type: string
      size: number
    }>
    customFields: Record<string, any>
  }
  tags: string[]
  notes?: string
  therapist: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  patient: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  submittedAt?: string
  createdAt: string
  updatedAt: string
}

export function TherapistReportSubmission({
  therapistId,
  patientId,
  onSubmissionComplete
}: TherapistReportSubmissionProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('create')
  
  // Data state
  const [submissions, setSubmissions] = useState<ReportSubmission[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    reportType: 'progress_report',
    reportId: '',
    therapistId: therapistId || '',
    patientId: patientId || '',
    title: '',
    description: '',
    submissionType: 'draft' as 'draft' | 'final',
    content: {
      summary: '',
      findings: '',
      recommendations: '',
      attachments: [] as Array<{name: string, url: string, type: string, size: number}>,
      customFields: {}
    },
    requiresCoordinatorReview: true,
    requiresAdminApproval: false,
    tags: [] as string[],
    notes: '',
    submittedBy: 'user-1' // This should come from auth context
  })

  const [editingSubmission, setEditingSubmission] = useState<ReportSubmission | null>(null)
  const [newTag, setNewTag] = useState('')

  // Load initial data
  useEffect(() => {
    loadInitialData()
    if (therapistId) {
      loadSubmissions()
    }
  }, [])

  useEffect(() => {
    if (formData.patientId && formData.reportType) {
      loadPatientReports()
    }
  }, [formData.patientId, formData.reportType])

  const loadInitialData = async () => {
    try {
      // Load patients
      const patientsResponse = await fetch('/api/patients?limit=100')
      const patientsResult = await patientsResponse.json()
      if (patientsResponse.ok) {
        setPatients(patientsResult.data.patients || [])
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const loadPatientReports = async () => {
    try {
      // Load available reports for the selected patient and report type
      let endpoint = ''
      switch (formData.reportType) {
        case 'therapeutic_plan':
          endpoint = `/api/therapeutic-plans?patientId=${formData.patientId}`
          break
        case 'progress_report':
          endpoint = `/api/progress-reports?patientId=${formData.patientId}`
          break
        case 'final_report':
          endpoint = `/api/final-reports?patientId=${formData.patientId}`
          break
        default:
          return
      }

      const response = await fetch(endpoint)
      const result = await response.json()
      if (response.ok) {
        setReports(result.data || [])
      }
    } catch (err) {
      console.error('Error loading reports:', err)
    }
  }

  const loadSubmissions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (therapistId) params.append('therapistId', therapistId)
      if (patientId) params.append('patientId', patientId)

      const response = await fetch(`/api/report-submission?${params}`)
      const result = await response.json()

      if (response.ok) {
        setSubmissions(result.data.submissions || [])
      } else {
        setError(result.error || 'Failed to load submissions')
      }
    } catch (err) {
      setError('Failed to load submissions')
      console.error('Error loading submissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (submissionType: 'draft' | 'final') => {
    if (!formData.reportId || !formData.title || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const submitData = {
        ...formData,
        submissionType,
        content: {
          ...formData.content,
          customFields: formData.content.customFields || {}
        }
      }

      const endpoint = editingSubmission ? '/api/report-submission' : '/api/report-submission'
      const method = editingSubmission ? 'PUT' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingSubmission ? { ...submitData, id: editingSubmission.id } : submitData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${editingSubmission ? 'update' : 'create'} submission`)
      }

      toast.success(submissionType === 'draft' ? 'Report saved as draft' : 'Report submitted successfully')
      
      // Reset form
      resetForm()
      
      // Reload submissions
      loadSubmissions()

      if (onSubmissionComplete) {
        onSubmissionComplete(result.data)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit report'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error submitting report:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      reportType: 'progress_report',
      reportId: '',
      therapistId: therapistId || '',
      patientId: patientId || '',
      title: '',
      description: '',
      submissionType: 'draft',
      content: {
        summary: '',
        findings: '',
        recommendations: '',
        attachments: [],
        customFields: {}
      },
      requiresCoordinatorReview: true,
      requiresAdminApproval: false,
      tags: [],
      notes: '',
      submittedBy: 'user-1'
    })
    setEditingSubmission(null)
  }

  const handleEdit = (submission: ReportSubmission) => {
    setFormData({
      reportType: submission.reportType as any,
      reportId: submission.reportId,
      therapistId: submission.therapist.id,
      patientId: submission.patient.id,
      title: submission.title,
      description: submission.description,
      submissionType: submission.submissionType,
      content: submission.content,
      requiresCoordinatorReview: true,
      requiresAdminApproval: false,
      tags: submission.tags || [],
      notes: submission.notes || '',
      submittedBy: 'user-1'
    })
    setEditingSubmission(submission)
    setActiveTab('create')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return

    try {
      setLoading(true)
      const response = await fetch(`/api/report-submission?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete draft')
      }

      toast.success('Draft deleted successfully')
      loadSubmissions()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete draft'
      toast.error(errorMessage)
      console.error('Error deleting draft:', err)
    } finally {
      setLoading(false)
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'revision_requested': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit className="h-4 w-4" />
      case 'submitted': return <Send className="h-4 w-4" />
      case 'under_review': return <Clock className="h-4 w-4" />
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <X className="h-4 w-4" />
      case 'revision_requested': return <AlertTriangle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
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
                <FileText className="h-5 w-5 mr-2" />
                Report Submission Workflow
              </CardTitle>
              <CardDescription>
                Submit and manage patient report submissions
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={loadSubmissions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create/Edit Submission</TabsTrigger>
          <TabsTrigger value="submissions">My Submissions</TabsTrigger>
        </TabsList>

        {/* Create/Edit Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{editingSubmission ? 'Edit Submission' : 'Create New Submission'}</CardTitle>
              <CardDescription>
                {editingSubmission ? 'Update your report submission' : 'Submit a new report for review'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportType">Report Type *</Label>
                  <Select 
                    value={formData.reportType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value, reportId: '' }))}
                    disabled={!!editingSubmission}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="therapeutic_plan">Therapeutic Plan</SelectItem>
                      <SelectItem value="progress_report">Progress Report</SelectItem>
                      <SelectItem value="final_report">Final Report</SelectItem>
                      <SelectItem value="session_notes">Session Notes</SelectItem>
                      <SelectItem value="assessment">Assessment</SelectItem>
                      <SelectItem value="evaluation">Evaluation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="patient">Patient *</Label>
                  <Select 
                    value={formData.patientId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value, reportId: '' }))}
                    disabled={!!editingSubmission}
                  >
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
              </div>
              
              <div>
                <Label htmlFor="report">Select Report *</Label>
                <Select 
                  value={formData.reportId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, reportId: value }))}
                  disabled={!formData.patientId || !formData.reportType || !!editingSubmission}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select report" />
                  </SelectTrigger>
                  <SelectContent>
                    {reports.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {report.title || `Report ${report.id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="title">Submission Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter submission title"
                  maxLength={200}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter submission description"
                  rows={3}
                  maxLength={2000}
                />
              </div>
              
              <div>
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  value={formData.content.summary}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, summary: e.target.value }
                  }))}
                  placeholder="Enter report summary"
                  rows={4}
                  maxLength={5000}
                />
              </div>
              
              <div>
                <Label htmlFor="findings">Findings</Label>
                <Textarea
                  id="findings"
                  value={formData.content.findings}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, findings: e.target.value }
                  }))}
                  placeholder="Enter key findings"
                  rows={4}
                  maxLength={5000}
                />
              </div>
              
              <div>
                <Label htmlFor="recommendations">Recommendations</Label>
                <Textarea
                  id="recommendations"
                  value={formData.content.recommendations}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    content: { ...prev.content, recommendations: e.target.value }
                  }))}
                  placeholder="Enter recommendations"
                  rows={4}
                  maxLength={5000}
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
              
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter additional notes"
                  rows={3}
                  maxLength={2000}
                />
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-2">
                  {editingSubmission && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel Edit
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => handleSubmit('draft')}
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => handleSubmit('final')}
                    disabled={loading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? 'Submitting...' : 'Submit for Review'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Submissions</CardTitle>
              <CardDescription>
                View and manage your report submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Submissions Yet</h3>
                  <p className="text-muted-foreground">
                    Create your first report submission to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{submission.title}</h3>
                          <Badge className={getStatusColor(submission.status)}>
                            {getStatusIcon(submission.status)}
                            <span className="ml-1">{submission.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge variant="outline">{submission.reportType.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          {submission.status === 'draft' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleEdit(submission)}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDelete(submission.id)}>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </>
                          )}
                          {(submission.status === 'rejected' || submission.status === 'revision_requested') && (
                            <Button size="sm" variant="outline" onClick={() => handleEdit(submission)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Revise
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {submission.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-xs font-medium">Patient</Label>
                          <div>{submission.patient.firstName} {submission.patient.lastName}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Submitted</Label>
                          <div>{submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'Not submitted'}</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Last Updated</Label>
                          <div>{new Date(submission.updatedAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      
                      {submission.tags && submission.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {submission.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
