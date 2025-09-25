'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, CheckCircle, User, Calendar, FileText } from 'lucide-react'
import {
  personalInfoSchema,
  consultationDetailsSchema,
  childInfoSchema,
  type PersonalInfoFormData,
  type ConsultationDetailsFormData,
  type ChildInfoFormData,
} from '@/lib/validations/consultation'
import { PersonalInfoStep } from './steps/personal-info-step'
import { ConsultationDetailsStep } from './steps/consultation-details-step'
import { ChildInfoStep } from './steps/child-info-step'
import { FormSummary } from './steps/form-summary'

type FormStep = 'personalInfo' | 'consultationDetails' | 'childInfo' | 'summary'

interface ConsultationFormProps {
  onComplete: (data: any) => void
  onCancel: () => void
}

export function ConsultationForm({ onComplete, onCancel }: ConsultationFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('personalInfo')
  const [formData, setFormData] = useState<{
    personalInfo?: PersonalInfoFormData
    consultationDetails?: ConsultationDetailsFormData
    childInfo?: ChildInfoFormData
  }>({})

  const steps: { key: FormStep; title: string; description: string; icon: React.ReactNode }[] = [
    {
      key: 'personalInfo',
      title: 'Personal Information',
      description: 'Parent and child details',
      icon: <User className="h-5 w-5" />
    },
    {
      key: 'consultationDetails',
      title: 'Consultation Details',
      description: 'Appointment preferences',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      key: 'childInfo',
      title: 'Child Information',
      description: 'Medical and behavioral details',
      icon: <FileText className="h-5 w-5" />
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
    
    if (step === 'childInfo') {
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
      case 'personalInfo':
        return (
          <PersonalInfoStep
            initialData={formData.personalInfo}
            onComplete={(data) => handleStepComplete('personalInfo', data)}
            onCancel={onCancel}
          />
        )
      case 'consultationDetails':
        return (
          <ConsultationDetailsStep
            initialData={formData.consultationDetails}
            onComplete={(data) => handleStepComplete('consultationDetails', data)}
            onPrevious={handlePrevious}
            onCancel={onCancel}
          />
        )
      case 'childInfo':
        return (
          <ChildInfoStep
            initialData={formData.childInfo}
            onComplete={(data) => handleStepComplete('childInfo', data)}
            onPrevious={handlePrevious}
            onCancel={onCancel}
          />
        )
      case 'summary':
        return (
          <FormSummary
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
          <h1 className="text-3xl font-bold">Book Your Consultation</h1>
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
