'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  FileText,
  User,
  Baby,
  Heart,
  Brain,
  Users,
  Target,
  Plus,
  Eye,
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  TestTube
} from 'lucide-react'
import { motion } from 'framer-motion'
import { MedicalFormComponent } from '@/components/medical-form/medical-form'
import { useMedicalForm, type MedicalForm, type FormStep, type FormStatus } from '@/hooks/use-medical-form'

export default function TestMedicalFormPage() {
  const [activeTab, setActiveTab] = useState('component')
  const [form, setForm] = useState<MedicalForm | null>(null)
  const [forms, setForms] = useState<MedicalForm[]>([])
  const [statistics, setStatistics] = useState<any>(null)

  const {
    createForm,
    getForm,
    getFormByConsultationRequest,
    updateFormStep,
    autoSaveForm,
    validateForm,
    getFormProgress,
    submitFormForReview,
    approveForm,
    deleteForm,
    getFormStatistics,
    loading,
    error
  } = useMedicalForm()

  const handleCreateForm = async () => {
    try {
      const consultationRequestId = '550e8400-e29b-41d4-a716-446655440001'
      const newForm = await createForm(consultationRequestId, 'parent-id', 'patient-id')
      setForm(newForm)
    } catch (err) {
      console.error('Failed to create form:', err)
    }
  }

  const handleGetForm = async () => {
    try {
      if (form?.formId) {
        const fetchedForm = await getForm(form.formId)
        setForm(fetchedForm)
      }
    } catch (err) {
      console.error('Failed to get form:', err)
    }
  }

  const handleGetFormByConsultationRequest = async () => {
    try {
      const consultationRequestId = '550e8400-e29b-41d4-a716-446655440001'
      const fetchedForm = await getFormByConsultationRequest(consultationRequestId)
      setForm(fetchedForm)
    } catch (err) {
      console.error('Failed to get form by consultation request:', err)
    }
  }

  const handleValidateForm = async () => {
    try {
      if (form?.formId) {
        const validation = await validateForm(form.formId)
        console.log('Validation result:', validation)
      }
    } catch (err) {
      console.error('Failed to validate form:', err)
    }
  }

  const handleGetFormProgress = async () => {
    try {
      if (form?.formId) {
        const progress = await getFormProgress(form.formId)
        console.log('Form progress:', progress)
      }
    } catch (err) {
      console.error('Failed to get form progress:', err)
    }
  }

  const handleSubmitForReview = async () => {
    try {
      if (form?.formId) {
        const submittedForm = await submitFormForReview(form.formId, 'user-id')
        setForm(submittedForm)
      }
    } catch (err) {
      console.error('Failed to submit form for review:', err)
    }
  }

  const handleApproveForm = async () => {
    try {
      if (form?.formId) {
        const approvedForm = await approveForm(form.formId, 'user-id', 'Form approved for consultation')
        setForm(approvedForm)
      }
    } catch (err) {
      console.error('Failed to approve form:', err)
    }
  }

  const handleGetStatistics = async () => {
    try {
      const stats = await getFormStatistics()
      setStatistics(stats)
    } catch (err) {
      console.error('Failed to get statistics:', err)
    }
  }

  const handleFormComplete = (completedForm: MedicalForm) => {
    console.log('Form completed:', completedForm)
    setForm(completedForm)
  }

  const handleFormSave = (savedForm: MedicalForm) => {
    console.log('Form saved:', savedForm)
    setForm(savedForm)
  }

  const getStatusBadge = (status: FormStatus) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', icon: FileText },
      'IN_PROGRESS': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'COMPLETED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'REVIEWED': { color: 'bg-yellow-100 text-yellow-800', icon: Eye },
      'APPROVED': { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
    
    const config = statusConfig[status] || statusConfig.DRAFT
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getStepIcon = (step: FormStep) => {
    const stepIcons = {
      1: User,
      2: Baby,
      3: Heart,
      4: Brain,
      5: Users,
      6: Target
    }
    return stepIcons[step]
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Medical Form Management Test</h1>
          <p className="text-muted-foreground">
            Test the comprehensive medical form management system with multi-step forms and validation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Component Test */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Medical Form Component
                </CardTitle>
                <CardDescription>
                  Interactive medical form with multi-step validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MedicalFormComponent
                  consultationRequestId="550e8400-e29b-41d4-a716-446655440001"
                  parentId="parent-id"
                  patientId="patient-id"
                  initialForm={form || undefined}
                  onComplete={handleFormComplete}
                  onSave={handleFormSave}
                  showProgress={true}
                  autoSave={true}
                  autoSaveInterval={30000}
                />
              </CardContent>
            </Card>
          </div>

          {/* API Test Panel */}
          <div className="space-y-6">
            {/* Form Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Form Operations
                </CardTitle>
                <CardDescription>
                  Test medical form API operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleCreateForm} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Form
                    </>
                  )}
                </Button>

                <Button onClick={handleGetForm} disabled={loading || !form} variant="outline" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Get Form
                    </>
                  )}
                </Button>

                <Button onClick={handleGetFormByConsultationRequest} disabled={loading} variant="outline" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Get by Consultation
                    </>
                  )}
                </Button>

                <Separator />

                <Button onClick={handleValidateForm} disabled={loading || !form} variant="outline" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Validate Form
                    </>
                  )}
                </Button>

                <Button onClick={handleGetFormProgress} disabled={loading || !form} variant="outline" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Get Progress
                    </>
                  )}
                </Button>

                <Separator />

                <Button onClick={handleSubmitForReview} disabled={loading || !form} variant="outline" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Submit for Review
                    </>
                  )}
                </Button>

                <Button onClick={handleApproveForm} disabled={loading || !form} variant="outline" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve Form
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Form Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Form Statistics
                </CardTitle>
                <CardDescription>
                  View form completion statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleGetStatistics} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Get Statistics
                    </>
                  )}
                </Button>

                {statistics && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-center p-2 border rounded">
                        <div className="font-semibold">{statistics.totalForms}</div>
                        <div className="text-muted-foreground">Total Forms</div>
                      </div>
                      <div className="text-center p-2 border rounded">
                        <div className="font-semibold">{statistics.completedForms}</div>
                        <div className="text-muted-foreground">Completed</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-center p-2 border rounded">
                        <div className="font-semibold">{statistics.draftForms}</div>
                        <div className="text-muted-foreground">Drafts</div>
                      </div>
                      <div className="text-center p-2 border rounded">
                        <div className="font-semibold">{statistics.inProgressForms}</div>
                        <div className="text-muted-foreground">In Progress</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Form Status */}
            {form && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Current Form
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      {getStatusBadge(form.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Step:</span>
                      <div className="flex items-center gap-1">
                        {getStepIcon(form.currentStep)}
                        <span className="text-sm">Step {form.currentStep}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Completed Steps:</span>
                      <span className="text-sm">{form.completedSteps.length}/6</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress:</span>
                      <span className="text-sm">{Math.round((form.completedSteps.length / 6) * 100)}%</span>
                    </div>
                  </div>

                  {form.createdAt && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(form.createdAt).toLocaleString()}
                      </div>
                      {form.updatedAt && (
                        <div className="text-xs text-muted-foreground">
                          Updated: {new Date(form.updatedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* API Endpoints Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  API Endpoints
                </CardTitle>
                <CardDescription>
                  Available medical form API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">POST</Badge>
                    <code className="text-xs">/api/medical-forms</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/medical-forms</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">PUT</Badge>
                    <code className="text-xs">/api/medical-forms</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">PATCH</Badge>
                    <code className="text-xs">/api/medical-forms</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/medical-forms/[id]</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/medical-forms/[id]/validate</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/medical-forms/[id]/progress</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">POST</Badge>
                    <code className="text-xs">/api/medical-forms/[id]/approve</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/medical-forms/statistics</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


