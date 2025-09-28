'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  BarChart3,
  Clock,
  Save,
  Play,
  Pause,
  Settings,
  Eye,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Database,
  TestTube
} from 'lucide-react'
import { motion } from 'framer-motion'
import { ProgressTracker } from '@/components/form-progress/progress-tracker'
import { useFormProgress, type FormType } from '@/hooks/use-form-progress'

export default function TestFormProgressPage() {
  const [activeTab, setActiveTab] = useState('component')
  const [formType, setFormType] = useState<FormType>('MEDICAL_FORM')
  const [formId, setFormId] = useState('550e8400-e29b-41d4-a716-446655440001')
  const [userId, setUserId] = useState('550e8400-e29b-41d4-a716-446655440002')
  const [totalSteps, setTotalSteps] = useState(6)
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [validationState, setValidationState] = useState({
    isValid: false,
    errors: {},
    warnings: {},
    stepValidation: {},
    lastValidatedAt: new Date()
  })

  const {
    initializeProgress,
    getProgress,
    updateProgress,
    markStepCompleted,
    resetProgress,
    deleteProgress,
    startAutoSave,
    stopAutoSave,
    triggerAutoSave,
    debouncedAutoSave,
    updateAutoSaveConfig,
    getProgressSnapshots,
    getProgressAnalytics,
    progress,
    autoSaveState,
    loading,
    error
  } = useFormProgress()

  const handleInitializeProgress = async () => {
    try {
      const progressData = await initializeProgress(
        formType,
        formId,
        userId,
        totalSteps,
        {
          enabled: true,
          interval: 30000
        }
      )
      console.log('Progress initialized:', progressData)
    } catch (err) {
      console.error('Failed to initialize progress:', err)
    }
  }

  const handleGetProgress = async () => {
    try {
      const progressData = await getProgress(formType, formId, userId)
      console.log('Progress retrieved:', progressData)
    } catch (err) {
      console.error('Failed to get progress:', err)
    }
  }

  const handleUpdateProgress = async () => {
    try {
      const progressData = await updateProgress(
        formType,
        formId,
        userId,
        currentStep,
        completedSteps,
        validationState
      )
      console.log('Progress updated:', progressData)
    } catch (err) {
      console.error('Failed to update progress:', err)
    }
  }

  const handleMarkStepCompleted = async () => {
    try {
      const progressData = await markStepCompleted(
        formType,
        formId,
        userId,
        currentStep,
        validationState
      )
      console.log('Step marked as completed:', progressData)
      setCompletedSteps(prev => [...prev, currentStep])
    } catch (err) {
      console.error('Failed to mark step as completed:', err)
    }
  }

  const handleResetProgress = async () => {
    try {
      const progressData = await resetProgress(formType, formId, userId)
      console.log('Progress reset:', progressData)
      setCurrentStep(1)
      setCompletedSteps([])
    } catch (err) {
      console.error('Failed to reset progress:', err)
    }
  }

  const handleDeleteProgress = async () => {
    try {
      const success = await deleteProgress(formType, formId, userId)
      console.log('Progress deleted:', success)
    } catch (err) {
      console.error('Failed to delete progress:', err)
    }
  }

  const handleGetSnapshots = async () => {
    try {
      const snapshots = await getProgressSnapshots(formType, formId, userId)
      console.log('Progress snapshots:', snapshots)
    } catch (err) {
      console.error('Failed to get snapshots:', err)
    }
  }

  const handleGetAnalytics = async () => {
    try {
      const analytics = await getProgressAnalytics(formType)
      console.log('Progress analytics:', analytics)
    } catch (err) {
      console.error('Failed to get analytics:', err)
    }
  }

  const handleStartAutoSave = () => {
    startAutoSave({
      formType,
      formId,
      userId,
      currentStep,
      completedSteps,
      validationState,
      formData: {}
    })
  }

  const handleStopAutoSave = () => {
    stopAutoSave()
  }

  const handleTriggerAutoSave = async () => {
    try {
      const success = await triggerAutoSave({
        formType,
        formId,
        userId,
        currentStep,
        completedSteps,
        validationState,
        formData: {}
      })
      console.log('Auto-save triggered:', success)
    } catch (err) {
      console.error('Failed to trigger auto-save:', err)
    }
  }

  const handleUpdateAutoSaveConfig = () => {
    updateAutoSaveConfig({
      interval: 15000, // 15 seconds
      maxRetries: 5
    })
  }

  const handleStepChange = (step: number) => {
    setCurrentStep(step)
  }

  const handleProgressUpdate = (progressData: any) => {
    console.log('Progress updated:', progressData)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'NOT_STARTED': { color: 'bg-gray-100 text-gray-800', icon: Clock },
      'IN_PROGRESS': { color: 'bg-blue-100 text-blue-800', icon: Loader2 },
      'COMPLETED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'VALIDATED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'APPROVED': { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.NOT_STARTED
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Form Progress Tracking Test</h1>
          <p className="text-muted-foreground">
            Test the comprehensive form progress tracking and auto-save system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Component Test */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Progress Tracker Component
                </CardTitle>
                <CardDescription>
                  Interactive progress tracking with auto-save functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProgressTracker
                  formType={formType}
                  formId={formId}
                  userId={userId}
                  totalSteps={totalSteps}
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  validationState={validationState}
                  onProgressUpdate={handleProgressUpdate}
                  onStepChange={handleStepChange}
                  showControls={true}
                  showAnalytics={true}
                  autoSaveEnabled={true}
                  autoSaveInterval={30000}
                />
              </CardContent>
            </Card>

            {/* Form Simulation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Form Simulation
                </CardTitle>
                <CardDescription>
                  Simulate form interactions to test progress tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentStep">Current Step</Label>
                    <Input
                      id="currentStep"
                      type="number"
                      min="1"
                      max={totalSteps}
                      value={currentStep}
                      onChange={(e) => setCurrentStep(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalSteps">Total Steps</Label>
                    <Input
                      id="totalSteps"
                      type="number"
                      min="1"
                      max="20"
                      value={totalSteps}
                      onChange={(e) => setTotalSteps(parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Completed Steps</Label>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: totalSteps }, (_, index) => {
                      const step = index + 1
                      const isCompleted = completedSteps.includes(step)
                      return (
                        <Button
                          key={step}
                          variant={isCompleted ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (isCompleted) {
                              setCompletedSteps(prev => prev.filter(s => s !== step))
                            } else {
                              setCompletedSteps(prev => [...prev, step])
                            }
                          }}
                        >
                          Step {step}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Validation State</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={validationState.isValid ? "default" : "outline"}
                      size="sm"
                      onClick={() => setValidationState(prev => ({ ...prev, isValid: !prev.isValid }))}
                    >
                      {validationState.isValid ? "Valid" : "Invalid"}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {validationState.isValid ? "Form is valid" : "Form has errors"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Test Panel */}
          <div className="space-y-6">
            {/* Progress Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Progress Operations
                </CardTitle>
                <CardDescription>
                  Test progress tracking API operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleInitializeProgress} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Initialize Progress
                    </>
                  )}
                </Button>

                <Button onClick={handleGetProgress} disabled={loading} variant="outline" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Get Progress
                    </>
                  )}
                </Button>

                <Button onClick={handleUpdateProgress} disabled={loading} variant="outline" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update Progress
                    </>
                  )}
                </Button>

                <Button onClick={handleMarkStepCompleted} disabled={loading} variant="outline" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Step Complete
                    </>
                  )}
                </Button>

                <Separator />

                <Button onClick={handleResetProgress} disabled={loading} variant="outline" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset Progress
                    </>
                  )}
                </Button>

                <Button onClick={handleDeleteProgress} disabled={loading} variant="outline" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Progress
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Auto-save Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Save className="h-5 w-5" />
                  Auto-save Operations
                </CardTitle>
                <CardDescription>
                  Test auto-save functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleStartAutoSave} disabled={loading} className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Start Auto-save
                </Button>

                <Button onClick={handleStopAutoSave} disabled={loading} variant="outline" className="w-full">
                  <Pause className="mr-2 h-4 w-4" />
                  Stop Auto-save
                </Button>

                <Button onClick={handleTriggerAutoSave} disabled={loading} variant="outline" className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Trigger Auto-save
                </Button>

                <Button onClick={handleUpdateAutoSaveConfig} disabled={loading} variant="outline" className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Update Config
                </Button>
              </CardContent>
            </Card>

            {/* Analytics Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="h-5 w-5" />
                  Analytics Operations
                </CardTitle>
                <CardDescription>
                  Test progress analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleGetSnapshots} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Get Snapshots
                    </>
                  )}
                </Button>

                <Button onClick={handleGetAnalytics} disabled={loading} variant="outline" className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Get Analytics
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Current Progress Status */}
            {progress && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Current Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      {getStatusBadge(progress.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress:</span>
                      <span className="text-sm">{Math.round(progress.progressPercentage)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Step:</span>
                      <span className="text-sm">{progress.currentStep}/{progress.totalSteps}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Completed Steps:</span>
                      <span className="text-sm">{progress.completedSteps.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Est. Time Remaining:</span>
                      <span className="text-sm">{progress.estimatedTimeRemaining} min</span>
                    </div>
                  </div>

                  {progress.lastSavedAt && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        Last saved: {new Date(progress.lastSavedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Auto-save Status */}
            {autoSaveState && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Save className="h-5 w-5" />
                    Auto-save Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={autoSaveState.isActive ? "default" : "outline"}>
                      {autoSaveState.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pending Changes:</span>
                    <Badge variant={autoSaveState.pendingChanges ? "default" : "outline"}>
                      {autoSaveState.pendingChanges ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {autoSaveState.lastSaved && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Saved:</span>
                      <span className="text-sm">{new Date(autoSaveState.lastSaved).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {autoSaveState.nextSave && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Next Save:</span>
                      <span className="text-sm">{new Date(autoSaveState.nextSave).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {autoSaveState.error && (
                    <div className="text-xs text-red-600">
                      Error: {autoSaveState.error}
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
                  Available progress tracking API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">POST</Badge>
                    <code className="text-xs">/api/form-progress</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/form-progress</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">PUT</Badge>
                    <code className="text-xs">/api/form-progress</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">PATCH</Badge>
                    <code className="text-xs">/api/form-progress</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/form-progress/snapshots</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">GET</Badge>
                    <code className="text-xs">/api/form-progress/analytics</code>
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

