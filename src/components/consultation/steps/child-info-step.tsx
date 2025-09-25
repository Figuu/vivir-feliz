'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { childInfoSchema, type ChildInfoFormData } from '@/lib/validations/consultation'
import { FileText, ArrowLeft, ArrowRight, Heart, Brain, Users, Target } from 'lucide-react'

interface ChildInfoStepProps {
  initialData?: Partial<ChildInfoFormData>
  onComplete: (data: ChildInfoFormData) => void
  onPrevious: () => void
  onCancel: () => void
}

export function ChildInfoStep({ 
  initialData, 
  onComplete, 
  onPrevious, 
  onCancel 
}: ChildInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChildInfoFormData>({
    resolver: zodResolver(childInfoSchema),
    defaultValues: initialData,
  })

  const onSubmit = (data: ChildInfoFormData) => {
    onComplete(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Child Information
        </CardTitle>
        <CardDescription>
          Please provide detailed information about your child's medical history, development, and current concerns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Medical Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="medicalConditions">Medical Conditions</Label>
              <Textarea
                id="medicalConditions"
                {...register('medicalConditions')}
                placeholder="Please describe any medical conditions, diagnoses, or health concerns your child has..."
                rows={4}
                className={errors.medicalConditions ? 'border-red-500' : ''}
              />
              {errors.medicalConditions && (
                <p className="text-sm text-red-500">{errors.medicalConditions.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">Current Medications</Label>
              <Textarea
                id="medications"
                {...register('medications')}
                placeholder="Please list any medications your child is currently taking, including dosages if known..."
                rows={3}
                className={errors.medications ? 'border-red-500' : ''}
              />
              {errors.medications && (
                <p className="text-sm text-red-500">{errors.medications.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                {...register('allergies')}
                placeholder="Please list any allergies your child has (food, medication, environmental, etc.)..."
                rows={3}
                className={errors.allergies ? 'border-red-500' : ''}
              />
              {errors.allergies && (
                <p className="text-sm text-red-500">{errors.allergies.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Developmental Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Developmental Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="developmentalMilestones">Developmental Milestones</Label>
              <Textarea
                id="developmentalMilestones"
                {...register('developmentalMilestones')}
                placeholder="Please describe your child's developmental milestones (walking, talking, potty training, etc.) and any delays or concerns..."
                rows={4}
                className={errors.developmentalMilestones ? 'border-red-500' : ''}
              />
              {errors.developmentalMilestones && (
                <p className="text-sm text-red-500">{errors.developmentalMilestones.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="schoolInformation">School Information</Label>
              <Textarea
                id="schoolInformation"
                {...register('schoolInformation')}
                placeholder="Please provide information about your child's school experience, grade level, any IEP/504 plans, academic performance, and social interactions..."
                rows={4}
                className={errors.schoolInformation ? 'border-red-500' : ''}
              />
              {errors.schoolInformation && (
                <p className="text-sm text-red-500">{errors.schoolInformation.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Behavioral Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Behavioral Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="behavioralConcerns">Primary Behavioral Concerns *</Label>
              <Textarea
                id="behavioralConcerns"
                {...register('behavioralConcerns')}
                placeholder="Please describe the main behavioral concerns that led you to seek consultation. Include specific examples, frequency, and impact on daily life..."
                rows={5}
                className={errors.behavioralConcerns ? 'border-red-500' : ''}
              />
              {errors.behavioralConcerns && (
                <p className="text-sm text-red-500">{errors.behavioralConcerns.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="triggers">Known Triggers</Label>
              <Textarea
                id="triggers"
                {...register('triggers')}
                placeholder="What situations, events, or circumstances tend to trigger challenging behaviors or emotional responses?"
                rows={3}
                className={errors.triggers ? 'border-red-500' : ''}
              />
              {errors.triggers && (
                <p className="text-sm text-red-500">{errors.triggers.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="copingStrategies">Current Coping Strategies</Label>
              <Textarea
                id="copingStrategies"
                {...register('copingStrategies')}
                placeholder="What strategies or techniques have you tried to help your child cope with challenges? What has worked or not worked?"
                rows={3}
                className={errors.copingStrategies ? 'border-red-500' : ''}
              />
              {errors.copingStrategies && (
                <p className="text-sm text-red-500">{errors.copingStrategies.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Family Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Family Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="familyHistory">Family History</Label>
              <Textarea
                id="familyHistory"
                {...register('familyHistory')}
                placeholder="Please describe any relevant family history, including mental health, developmental, or behavioral concerns in family members..."
                rows={3}
                className={errors.familyHistory ? 'border-red-500' : ''}
              />
              {errors.familyHistory && (
                <p className="text-sm text-red-500">{errors.familyHistory.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="familyChanges">Recent Family Changes</Label>
              <Textarea
                id="familyChanges"
                {...register('familyChanges')}
                placeholder="Have there been any recent significant changes in your family (moves, divorce, new siblings, deaths, etc.) that might be affecting your child?"
                rows={3}
                className={errors.familyChanges ? 'border-red-500' : ''}
              />
              {errors.familyChanges && (
                <p className="text-sm text-red-500">{errors.familyChanges.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Goals and Expectations */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Goals and Expectations
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="therapyGoals">Therapy Goals *</Label>
              <Textarea
                id="therapyGoals"
                {...register('therapyGoals')}
                placeholder="What are your main goals for therapy? What would you like to see improve in your child's behavior, emotions, or daily functioning?"
                rows={4}
                className={errors.therapyGoals ? 'border-red-500' : ''}
              />
              {errors.therapyGoals && (
                <p className="text-sm text-red-500">{errors.therapyGoals.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectations">Expectations</Label>
              <Textarea
                id="expectations"
                {...register('expectations')}
                placeholder="What are your expectations for the consultation and potential therapy? How do you envision the process working?"
                rows={3}
                className={errors.expectations ? 'border-red-500' : ''}
              />
              {errors.expectations && (
                <p className="text-sm text-red-500">{errors.expectations.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="additionalInformation">Additional Information</Label>
              <Textarea
                id="additionalInformation"
                {...register('additionalInformation')}
                placeholder="Is there anything else you'd like us to know about your child or family situation that might be relevant to the consultation?"
                rows={4}
                className={errors.additionalInformation ? 'border-red-500' : ''}
              />
              {errors.additionalInformation && (
                <p className="text-sm text-red-500">{errors.additionalInformation.message}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-6">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onPrevious}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
