'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Clock,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2,
  Eye,
  BarChart3,
  RefreshCw,
  Trash2,
  Play,
  Pause,
  Settings
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFormProgress, type FormType, type ProgressStatus } from '@/hooks/use-form-progress'

interface ProgressTrackerProps {
  formType: FormType
  formId: string
  userId: string
  totalSteps: number
  currentStep: number
  completedSteps: number[]
  validationState: any
  onProgressUpdate?: (progress: any) => void
  onStepChange?: (step: number) => void
  showControls?: boolean
  showAnalytics?: boolean
  autoSaveEnabled?: boolean
  autoSaveInterval?: number
}

export function ProgressTracker({
  formType,
  formId,
  userId,
  totalSteps,
  currentStep,
  completedSteps,
  validationState,
  onProgressUpdate,
  onStepChange,
  showControls = true,
  showAnalytics = false,
  autoSaveEnabled = true,
  autoSaveInterval = 30000
}: ProgressTrackerProps) {
  const [progress, setProgress] = useState<any>(null)
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [showSnapshots, setShowSnapshots] = useState(false)
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false)

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
    autoSaveState,
    loading,
    error
  } = useFormProgress()

  // Initialize progress tracking
  useEffect(() => {
    const initProgress = async () => {
      try {
        const progressData = await initializeProgress(
          formType,
          formId,
          userId,
          totalSteps,
          {
            enabled: autoSaveEnabled,
            interval: autoSaveInterval
          }
        )
        setProgress(progressData)
        onProgressUpdate?.(progressData)
      } catch (err) {
        console.error('Failed to initialize progress:', err)
      }
    }

    initProgress()
  }, [formType, formId, userId, totalSteps, autoSaveEnabled, autoSaveInterval])

  // Update progress when current step or completed steps change
  useEffect(() => {
    const updateProgressData = async () => {
      if (progress) {
        try {
          const updatedProgress = await updateProgress(
            formType,
            formId,
            userId,
            currentStep,
            completedSteps,
            validationState
          )
          setProgress(updatedProgress)
          onProgressUpdate?.(updatedProgress)

          // Trigger auto-save
          if (autoSaveEnabled) {
            debouncedAutoSave({
              formType,
              formId,
              userId,
              currentStep,
              completedSteps,
              validationState,
              formData: {}
            })
          }
        } catch (err) {
          console.error('Failed to update progress:', err)
        }
      }
    }

    updateProgressData()
  }, [currentStep, completedSteps, validationState])

  // Start auto-save when progress is initialized
  useEffect(() => {
    if (progress && autoSaveEnabled) {
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

    return () => {
      stopAutoSave()
    }
  }, [progress, autoSaveEnabled])

  const handleStepClick = (step: number) => {
    if (onStepChange && (completedSteps.includes(step) || step <= currentStep)) {
      onStepChange(step)
    }
  }

  const handleMarkStepCompleted = async (step: number) => {
    try {
      const updatedProgress = await markStepCompleted(
        formType,
        formId,
        userId,
        step,
        validationState
      )
      setProgress(updatedProgress)
      onProgressUpdate?.(updatedProgress)
    } catch (err) {
      console.error('Failed to mark step as completed:', err)
    }
  }

  const handleResetProgress = async () => {
    try {
      const resetProgressData = await resetProgress(formType, formId, userId)
      setProgress(resetProgressData)
      onProgressUpdate?.(resetProgressData)
    } catch (err) {
      console.error('Failed to reset progress:', err)
    }
  }

  const handleDeleteProgress = async () => {
    try {
      await deleteProgress(formType, formId, userId)
      setProgress(null)
    } catch (err) {
      console.error('Failed to delete progress:', err)
    }
  }

  const handleGetSnapshots = async () => {
    try {
      const snapshotData = await getProgressSnapshots(formType, formId, userId)
      setSnapshots(snapshotData)
      setShowSnapshots(true)
    } catch (err) {
      console.error('Failed to get snapshots:', err)
    }
  }

  const handleGetAnalytics = async () => {
    try {
      const analyticsData = await getProgressAnalytics(formType)
      setAnalytics(analyticsData)
      setShowAnalyticsPanel(true)
    } catch (err) {
      console.error('Failed to get analytics:', err)
    }
  }

  const getStatusBadge = (status: ProgressStatus) => {
    const statusConfig = {
      'NOT_STARTED': { color: 'bg-gray-100 text-gray-800', icon: Clock },
      'IN_PROGRESS': { color: 'bg-blue-100 text-blue-800', icon: Loader2 },
      'COMPLETED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'VALIDATED': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'APPROVED': { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
    
    const config = statusConfig[status] || statusConfig.NOT_STARTED
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getStepStatus = (step: number) => {
    if (completedSteps.includes(step)) return 'completed'
    if (step === currentStep) return 'current'
    if (step < currentStep) return 'available'
    return 'locked'
  }

  if (!progress) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading progress tracking...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Form Progress
              </CardTitle>
              <CardDescription>
                Track your progress through the form
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(progress.status)}
              {autoSaveState?.isActive && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {autoSaveState.pendingChanges ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3" />
                      Auto-save
                    </>
                  )}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{completedSteps.length} of {totalSteps} steps completed</span>
            </div>
            <Progress value={progress.progressPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress.progressPercentage)}% complete</span>
              <span>Est. {progress.estimatedTimeRemaining} min remaining</span>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Steps</Label>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: totalSteps }, (_, index) => {
                const step = index + 1
                const status = getStepStatus(step)
                
                return (
                  <motion.button
                    key={step}
                    onClick={() => handleStepClick(step)}
                    disabled={status === 'locked'}
                    className={`
                      p-3 rounded-lg border-2 transition-all duration-200 text-center
                      ${status === 'completed' ? 'border-green-500 bg-green-50 text-green-700' : ''}
                      ${status === 'current' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}
                      ${status === 'available' ? 'border-gray-300 bg-white text-gray-700 hover:border-gray-400' : ''}
                      ${status === 'locked' ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
                    `}
                    whileHover={status !== 'locked' ? { scale: 1.02 } : {}}
                    whileTap={status !== 'locked' ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center justify-center mb-1">
                      {status === 'completed' && <CheckCircle className="h-4 w-4" />}
                      {status === 'current' && <Loader2 className="h-4 w-4 animate-spin" />}
                      {status === 'available' && <Clock className="h-4 w-4" />}
                      {status === 'locked' && <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div className="text-xs font-medium">Step {step}</div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Last Saved */}
          {progress.lastSavedAt && (
            <div className="text-xs text-muted-foreground">
              Last saved: {new Date(progress.lastSavedAt).toLocaleString()}
            </div>
          )}

          {/* Auto-save Status */}
          {autoSaveState && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Auto-save</span>
                <div className="flex items-center gap-2">
                  {autoSaveState.isActive ? (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Pause className="h-3 w-3" />
                      Paused
                    </Badge>
                  )}
                </div>
              </div>
              
              {autoSaveState.nextSave && (
                <div className="text-xs text-muted-foreground">
                  Next save: {new Date(autoSaveState.nextSave).toLocaleTimeString()}
                </div>
              )}
              
              {autoSaveState.error && (
                <div className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {autoSaveState.error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      {showControls && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkStepCompleted(currentStep)}
                disabled={loading || completedSteps.includes(currentStep)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetSnapshots}
                disabled={loading}
              >
                <Eye className="h-4 w-4 mr-2" />
                Snapshots
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetProgress}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteProgress}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>

            {showAnalytics && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleGetAnalytics}
                  disabled={loading}
                  className="w-full"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

