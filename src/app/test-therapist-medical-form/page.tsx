'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  FileText,
  User,
  Brain,
  Heart,
  Shield,
  Target,
  Plus,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  TestTube,
  Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { ClinicalObservationsSection } from '@/components/therapist-form/sections/clinical-observations-section'
import { useTherapistMedicalForm, type TherapistMedicalForm, type TherapistFormStatus } from '@/hooks/use-therapist-medical-form'

export default function TestTherapistMedicalFormPage() {
  const [activeTab, setActiveTab] = useState('component')
  const [form, setForm] = useState<TherapistMedicalForm | null>(null)
  const [forms, setForms] = useState<TherapistMedicalForm[]>([])
  const [statistics, setStatistics] = useState<any>(null)

  const {
    createTherapistForm,
    getTherapistForm,
    getTherapistFormByMedicalForm,
    updateTherapistForm,
    completeTherapistForm,
    validateTherapistForm,
    submitFormForReview,
    approveTherapistForm,
    deleteTherapistForm,
    getTherapistFormStatistics,
    loading,
    error
  } = useTherapistMedicalForm()

  const handleCreateForm = async () => {
    try {
      const medicalFormId = '550e8400-e29b-41d4-a716-446655440001'
      const therapistId = '550e8400-e29b-41d4-a716-446655440002'
      const newForm = await createTherapistForm(medicalFormId, therapistId)
      setForm(newForm)
    } catch (err) {
      console.error('Failed to create form:', err)
    }
  }

  const handleGetForm = async () => {
    try {
      if (form?.formId) {
        const fetchedForm = await getTherapistForm(form.formId)
        setForm(fetchedForm)
      }
    } catch (err) {
      console.error('Failed to get form:', err)
    }
  }

  const handleGetFormByMedicalForm = async () => {
    try {
      const medicalFormId = '550e8400-e29b-41d4-a716-446655440001'
      const therapistId = '550e8400-e29b-41d4-a716-446655440002'
      const fetchedForm = await getTherapistFormByMedicalForm(medicalFormId, therapistId)
      setForm(fetchedForm)
    } catch (err) {
      console.error('Failed to get form by medical form:', err)
    }
  }

  const handleValidateForm = async () => {
    try {
      if (form?.formId) {
        const validation = await validateTherapistForm(form.formId)
        console.log('Validation result:', validation)
      }
    } catch (err) {
      console.error('Failed to validate form:', err)
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
        const approvedForm = await approveTherapistForm(form.formId, 'user-id', 'Form approved for consultation')
        setForm(approvedForm)
      }
    } catch (err) {
      console.error('Failed to approve form:', err)
    }
  }

  const handleGetStatistics = async () => {
    try {
      const stats = await getTherapistFormStatistics()
      setStatistics(stats)
    } catch (err) {
      console.error('Failed to get statistics:', err)
    }
  }

  const handleUpdateAssessment = (assessmentData: any) => {
    console.log('Assessment updated:', assessmentData)
    if (form) {
      setForm({
        ...form,
        assessment: {
          ...form.assessment,
          clinicalObservations: assessmentData
        }
      })
    }
  }

  const handleSaveAssessment = (assessmentData: any) => {
    console.log('Assessment saved:', assessmentData)
    if (form) {
      setForm({
        ...form,
        assessment: {
          ...form.assessment,
          clinicalObservations: assessmentData
        }
      })
    }
  }

  const getStatusBadge = (status: TherapistFormStatus) => {
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

  const getSectionIcon = (section: string) => {
    const sectionIcons = {
      'clinicalObservations': User,
      'vitalSigns': Heart,
      'medicalHistoryReview': FileText,
      'mentalHealthAssessment': Brain,
      'riskAssessment': Shield,
      'clinicalImpressions': Target
    }
    return sectionIcons[section as keyof typeof sectionIcons] || FileText
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Therapist Medical Form Test</h1>
          <p className="text-muted-foreground">
            Test the therapist interface for completing medical forms with specialized validation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Component Test */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Clinical Observations Section
                </CardTitle>
                <CardDescription>
                  Therapist interface for clinical observations with medical validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClinicalObservationsSection
                  data={form?.assessment?.clinicalObservations || {}}
                  onUpdate={handleUpdateAssessment}
                  onSave={handleSaveAssessment}
                  loading={loading}
                  errors={{}}
                  warnings={{}}
                  readOnly={false}
                />
              </CardContent>
            </Card>

            {/* Additional Sections Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Additional Assessment Sections
                </CardTitle>
                <CardDescription>
                  Other assessment sections will be implemented in subsequent tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Vital Signs', icon: Heart, status: 'Coming Soon' },
                    { name: 'Medical History', icon: FileText, status: 'Coming Soon' },
                    { name: 'Mental Health', icon: Brain, status: 'Coming Soon' },
                    { name: 'Risk Assessment', icon: Shield, status: 'Coming Soon' },
                    { name: 'Clinical Impressions', icon: Target, status: 'Coming Soon' }
                  ].map((section, index) => {
                    const Icon = section.icon
                    return (
                      <motion.div
                        key={index}
                        className="p-4 border rounded-lg text-center"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <h3 className="font-medium">{section.name}</h3>
                        <p className="text-sm text-muted-foreground">{section.status}</p>
                      </motion.div>
                    )
                  })}
                </div>
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
                  Test therapist medical form API operations
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

                <Button onClick={handleGetFormByMedicalForm} disabled={loading} variant="outline" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Get by Medical Form
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
                  View therapist form completion statistics
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
                      <span className="text-sm font-medium">Medical Form ID:</span>
                      <span className="text-sm font-mono">{form.medicalFormId.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Therapist ID:</span>
                      <span className="text-sm font-mono">{form.therapistId.slice(0, 8)}...</span>
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
                  Available therapist medical form API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">POST</Badge>
                    <code className="text-xs">/api/therapist-medical-forms</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/therapist-medical-forms</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">PUT</Badge>
                    <code className="text-xs">/api/therapist-medical-forms</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">PATCH</Badge>
                    <code className="text-xs">/api/therapist-medical-forms</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/therapist-medical-forms/[id]</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/therapist-medical-forms/[id]/validate</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">POST</Badge>
                    <code className="text-xs">/api/therapist-medical-forms/[id]/approve</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/therapist-medical-forms/statistics</code>
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


