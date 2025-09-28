'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { childConcernsSchema, type ChildConcernsFormData } from '@/lib/validations/interview'
import { MessageSquare, ArrowLeft, ArrowRight, Heart, Users, School, Home } from 'lucide-react'

interface ChildConcernsStepProps {
  initialData?: Partial<ChildConcernsFormData>
  onComplete: (data: ChildConcernsFormData) => void
  onPrevious: () => void
  onCancel: () => void
}

export function ChildConcernsStep({ 
  initialData, 
  onComplete, 
  onPrevious, 
  onCancel 
}: ChildConcernsStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChildConcernsFormData>({
    resolver: zodResolver(childConcernsSchema),
    defaultValues: initialData,
  })

  const onSubmit = (data: ChildConcernsFormData) => {
    onComplete(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Child Concerns
        </CardTitle>
        <CardDescription>
          Please tell us about your concerns regarding your child
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Main Concerns */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Main Concerns
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="mainConcerns">What are your main concerns about your child? *</Label>
              <Textarea
                id="mainConcerns"
                {...register('mainConcerns')}
                placeholder="Please describe the main concerns or challenges you've noticed with your child. Include specific examples of behaviors, emotions, or situations that worry you..."
                rows={5}
                className={errors.mainConcerns ? 'border-red-500' : ''}
              />
              {errors.mainConcerns && (
                <p className="text-sm text-red-500">{errors.mainConcerns.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whenConcernsStarted">When did you first notice these concerns? *</Label>
              <Textarea
                id="whenConcernsStarted"
                {...register('whenConcernsStarted')}
                placeholder="Please describe when you first noticed these concerns. Was it gradual or sudden? What was happening around that time?"
                rows={3}
                className={errors.whenConcernsStarted ? 'border-red-500' : ''}
              />
              {errors.whenConcernsStarted && (
                <p className="text-sm text-red-500">{errors.whenConcernsStarted.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="impactOnDailyLife">How do these concerns impact your child's daily life? *</Label>
              <Textarea
                id="impactOnDailyLife"
                {...register('impactOnDailyLife')}
                placeholder="Please describe how these concerns affect your child's daily activities, relationships, school performance, or family life..."
                rows={4}
                className={errors.impactOnDailyLife ? 'border-red-500' : ''}
              />
              {errors.impactOnDailyLife && (
                <p className="text-sm text-red-500">{errors.impactOnDailyLife.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* What Has Been Tried */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What Has Been Tried</h3>
            
            <div className="space-y-2">
              <Label htmlFor="whatHasBeenTried">What have you tried to help with these concerns?</Label>
              <Textarea
                id="whatHasBeenTried"
                {...register('whatHasBeenTried')}
                placeholder="Please describe any strategies, approaches, or interventions you've tried to help your child. What has worked or not worked?"
                rows={4}
                className={errors.whatHasBeenTried ? 'border-red-500' : ''}
              />
              {errors.whatHasBeenTried && (
                <p className="text-sm text-red-500">{errors.whatHasBeenTried.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* School and Behavioral Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <School className="h-4 w-4" />
              School and Behavioral Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="schoolBehavior">How is your child doing at school?</Label>
              <Textarea
                id="schoolBehavior"
                {...register('schoolBehavior')}
                placeholder="Please describe your child's behavior, performance, and relationships at school. Are there any concerns from teachers or other school staff?"
                rows={4}
                className={errors.schoolBehavior ? 'border-red-500' : ''}
              />
              {errors.schoolBehavior && (
                <p className="text-sm text-red-500">{errors.schoolBehavior.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Family Situation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Home className="h-4 w-4" />
              Family Situation
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="familySituation">Tell us about your family situation</Label>
              <Textarea
                id="familySituation"
                {...register('familySituation')}
                placeholder="Please describe your family structure, any recent changes, and how the family is coping with the current situation..."
                rows={4}
                className={errors.familySituation ? 'border-red-500' : ''}
              />
              {errors.familySituation && (
                <p className="text-sm text-red-500">{errors.familySituation.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="additionalInformation">Is there anything else you'd like us to know?</Label>
              <Textarea
                id="additionalInformation"
                {...register('additionalInformation')}
                placeholder="Please share any additional information that might be helpful for us to understand your child's situation better..."
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


