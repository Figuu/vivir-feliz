'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, CheckCircle, User, Calendar, MessageSquare } from 'lucide-react'
import {
  basicInfoSchema,
  interviewPreferencesSchema,
  childConcernsSchema,
  type BasicInfoFormData,
  type InterviewPreferencesFormData,
  type ChildConcernsFormData,
} from '@/lib/validations/interview'
import { BasicInfoStep } from './steps/basic-info-step'
import { InterviewPreferencesStep } from './steps/interview-preferences-step'
import { ChildConcernsStep } from './steps/child-concerns-step'
import { InterviewSummary } from './steps/interview-summary'

type FormStep = 'basicInfo' | 'interviewPreferences' | 'childConcerns' | 'summary'

interface InterviewFormProps {
  onComplete: (data: any) => void
  onCancel: () => void
}

export function InterviewForm({ onComplete, onCancel }: InterviewFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('basicInfo')
  const [formData, setFormData] = useState<{
    basicInfo?: BasicInfoFormData
    interviewPreferences?: InterviewPreferencesFormData
    childConcerns?: ChildConcernsFormData
  }>({})

  const steps: { key: FormStep; title: string; description: string; icon: React.ReactNode }[] = [
    {
      key: 'basicInfo',
      title: 'Basic Information',
      description: 'Contact and child details',
      icon: <User className="h-5 w-5" />
    },
    {
      key: 'interviewPreferences',
      title: 'Interview Preferences',
      description: 'Scheduling and contact preferences',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      key: 'childConcerns',
      title: 'Child Concerns',
      description: 'Tell us about your concerns',
      icon: <MessageSquare className="h-5 w-5" />
    },
    {
      key: 'summary',
      title: 'Review & Submit',
      description: 'Confirm your information',
      icon: <CheckCircle className="h-5 w-5" />
    }
  ]

  const currentStepIndex = steps.findIndex(step => step.key === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const handleStepComplete = (step: FormStep, data: any) => {
    setFormData(prev => ({ ...prev, [step]: data }))
    
    if (step === 'childConcerns') {
      setCurrentStep('summary')
    } else {
      const nextStepIndex = currentStepIndex + 1
      setCurrentStep(steps[nextStepIndex].key)
    }
  }

  const handlePrevious = () => {
    const prevStepIndex = currentStepIndex - 1
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex].key)
    }
  }

  const handleSubmit = () => {
    onComplete(formData)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'basicInfo':
        return (
          <BasicInfoStep
            initialData={formData.basicInfo}
            onComplete={(data) => handleStepComplete('basicInfo', data)}
            onCancel={onCancel}
          />
        )
      case 'interviewPreferences':
        return (
          <InterviewPreferencesStep
            initialData={formData.interviewPreferences}
            onComplete={(data) => handleStepComplete('interviewPreferences', data)}
            onPrevious={handlePrevious}
            onCancel={onCancel}
          />
        )
      case 'childConcerns':
        return (
          <ChildConcernsStep
            initialData={formData.childConcerns}
            onComplete={(data) => handleStepComplete('childConcerns', data)}
            onPrevious={handlePrevious}
            onCancel={onCancel}
          />
        )
      case 'summary':
        return (
          <InterviewSummary
            formData={formData}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            onCancel={onCancel}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Schedule Your Free Interview</h1>
          <Badge variant="outline" className="text-sm">
            Step {currentStepIndex + 1} of {steps.length}
          </Badge>
        </div>
        
        <Progress value={progress} className="h-2 mb-4" />
        
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`flex items-center gap-2 ${
                index <= currentStepIndex ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`p-2 rounded-full ${
                index <= currentStepIndex 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                {step.icon}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
