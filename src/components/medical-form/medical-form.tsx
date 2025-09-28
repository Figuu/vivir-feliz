'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  Baby,
  Heart,
  Brain,
  Users,
  Target,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  Download
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMedicalForm, type MedicalForm, type FormStep, type FormStatus } from '@/hooks/use-medical-form'
import { ParentInfoStep } from './steps/parent-info-step'
import { type ParentInfo, type ChildInfo, type MedicalHistory, type CurrentConcerns, type FamilyInfo, type GoalsExpectations } from '@/lib/validations/medical-form'

interface MedicalFormProps {
  consultationRequestId: string
  parentId?: string
  patientId?: string
  initialForm?: MedicalForm
  onComplete?: (form: MedicalForm) => void
  onSave?: (form: MedicalForm) => void
  readOnly?: boolean
  showProgress?: boolean
  autoSave?: boolean
  autoSaveInterval?: number
}

const stepTitles = {
  1: 'Parent/Guardian Information',
  2: 'Child Information',
  3: 'Medical History',
  4: 'Current Concerns',
  5: 'Family Information',
  6: 'Goals & Expectations'
}

const stepIcons = {
  1: User,
  2: Baby,
  3: Heart,
  4: Brain,
  5: Users,
  6: Target
}

export function MedicalFormComponent({
  consultationRequestId,
  parentId,
  patientId,
  initialForm,
  onComplete,
  onSave,
  readOnly = false,
  showProgress = true,
  autoSave = true,
  autoSaveInterval = 30000
}: MedicalFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>(1)
  const [form, setForm] = useState<MedicalForm | null>(initialForm || null)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})
  const [validationWarnings, setValidationWarnings] = useState<Record<string, string[]>>({})

  const {
    createForm,
    getForm,
    updateFormStep,
    autoSaveForm,
    validateForm,
    getFormProgress,
    submitFormForReview,
    loading,
    error
  } = useMedicalForm()

  // Initialize form
  useEffect(() => {
    const initializeForm = async () => {
      if (initialForm) {
        setForm(initialForm)
        setCurrentStep(initialForm.currentStep)
        setCompletedSteps(initialForm.completedSteps)
        return
      }

      try {
        // Try to get existing form first
        const existingForm = await getForm(consultationRequestId)
        if (existingForm) {
          setForm(existingForm)
          setCurrentStep(existingForm.currentStep)
          setCompletedSteps(existingForm.completedSteps)
        } else {
          // Create new form
          const newForm = await createForm(consultationRequestId, parentId, patientId)
          setForm(newForm)
          setCurrentStep(newForm.currentStep)
          setCompletedSteps(newForm.completedSteps)
        }
      } catch (err) {
        console.error('Failed to initialize form:', err)
      }
    }

    initializeForm()
  }, [consultationRequestId, parentId, patientId, initialForm])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !form || readOnly) return

    const interval = setInterval(async () => {
      if (form && currentStep) {
        setIsAutoSaving(true)
        try {
          await autoSaveForm(form.formId!, currentStep, getCurrentStepData(), completedSteps)
          setLastSaved(new Date())
        } catch (err) {
          console.error('Auto-save failed:', err)
        } finally {
          setIsAutoSaving(false)
        }
      }
    }, autoSaveInterval)

    return () => clearInterval(interval)
  }, [autoSave, form, currentStep, completedSteps, autoSaveInterval, readOnly])

  const getCurrentStepData = (): any => {
    if (!form) return {}
    
    switch (currentStep) {
      case 1: return form.parentInfo
      case 2: return form.childInfo
      case 3: return form.medicalHistory
      case 4: return form.currentConcerns
      case 5: return form.familyInfo
      case 6: return form.goalsExpectations
      default: return {}
    }
  }

  const handleStepComplete = useCallback(async (step: FormStep, stepData: any) => {
    if (!form || readOnly) return

    try {
      const updatedForm = await updateFormStep(form.formId!, step, stepData)
      setForm(updatedForm)
      setCompletedSteps(updatedForm.completedSteps)
      
      if (onSave) {
        onSave(updatedForm)
      }

      // Move to next step
      if (step < 6) {
        setCurrentStep((step + 1) as FormStep)
      } else {
        // Form is complete
        if (onComplete) {
          onComplete(updatedForm)
        }
      }
    } catch (err) {
      console.error('Failed to update step:', err)
    }
  }, [form, readOnly, onSave, onComplete])

  const handleStepSave = useCallback(async (step: FormStep, stepData: any) => {
    if (!form || readOnly) return

    try {
      await autoSaveForm(form.formId!, step, stepData, completedSteps)
      setLastSaved(new Date())
    } catch (err) {
      console.error('Failed to save step:', err)
    }
  }, [form, readOnly, completedSteps])

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as FormStep)
    }
  }

  const handleNextStep = () => {
    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as FormStep)
    }
  }

  const handleStepClick = (step: FormStep) => {
    if (readOnly || completedSteps.includes(step) || step <= currentStep) {
      setCurrentStep(step)
    }
  }

  const getStepStatus = (step: FormStep) => {
    if (completedSteps.includes(step)) return 'completed'
    if (step === currentStep) return 'current'
    if (step < currentStep) return 'available'
    return 'locked'
  }

  const getProgressPercentage = () => {
    return (completedSteps.length / 6) * 100
  }

  const renderStepContent = () => {
    if (!form) return null

    const stepData = getCurrentStepData()
    const commonProps = {
      data: stepData,
      onNext: (data: any) => handleStepComplete(currentStep, data),
      onPrevious: currentStep > 1 ? handlePreviousStep : undefined,
      onSave: (data: any) => handleStepSave(currentStep, data),
      loading,
      errors: validationErrors,
      warnings: validationWarnings
    }

    switch (currentStep) {
      case 1:
        return <ParentInfoStep {...commonProps} />
      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Child Information</CardTitle>
              <CardDescription>Step 2 of 6 - Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This step will be implemented in the next task.</p>
            </CardContent>
          </Card>
        )
      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
              <CardDescription>Step 3 of 6 - Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This step will be implemented in the next task.</p>
            </CardContent>
          </Card>
        )
      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Current Concerns</CardTitle>
              <CardDescription>Step 4 of 6 - Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This step will be implemented in the next task.</p>
            </CardContent>
          </Card>
        )
      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Family Information</CardTitle>
              <CardDescription>Step 5 of 6 - Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This step will be implemented in the next task.</p>
            </CardContent>
          </Card>
        )
      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Goals & Expectations</CardTitle>
              <CardDescription>Step 6 of 6 - Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This step will be implemented in the next task.</p>
            </CardContent>
          </Card>
        )
      default:
        return null
    }
  }

  if (!form) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading medical form...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Medical Form
              </CardTitle>
              <CardDescription>
                Complete the medical form for your consultation
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={form.status === 'COMPLETED' ? 'default' : 'secondary'}>
                {form.status}
              </Badge>
              {isAutoSaving && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showProgress && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{completedSteps.length} of 6 steps completed</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
              {lastSaved && (
                <p className="text-xs text-muted-foreground">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Form Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((step) => {
              const status = getStepStatus(step as FormStep)
              const Icon = stepIcons[step as FormStep]
              const title = stepTitles[step as FormStep]
              
              return (
                <motion.button
                  key={step}
                  onClick={() => handleStepClick(step as FormStep)}
                  disabled={status === 'locked'}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 text-left
                    ${status === 'completed' ? 'border-green-500 bg-green-50 text-green-700' : ''}
                    ${status === 'current' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}
                    ${status === 'available' ? 'border-gray-300 bg-white text-gray-700 hover:border-gray-400' : ''}
                    ${status === 'locked' ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
                  `}
                  whileHover={status !== 'locked' ? { scale: 1.02 } : {}}
                  whileTap={status !== 'locked' ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-5 w-5" />
                    {status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {status === 'current' && <Clock className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="text-sm font-medium">{title}</div>
                  <div className="text-xs opacity-75">Step {step}</div>
                </motion.button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

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
  )
}


