'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { interviewPreferencesSchema, type InterviewPreferencesFormData } from '@/lib/validations/interview'
import { Calendar, Clock, ArrowLeft, ArrowRight, MessageSquare, Phone, Mail, AlertTriangle } from 'lucide-react'

interface InterviewPreferencesStepProps {
  initialData?: Partial<InterviewPreferencesFormData>
  onComplete: (data: InterviewPreferencesFormData) => void
  onPrevious: () => void
  onCancel: () => void
}

export function InterviewPreferencesStep({ 
  initialData, 
  onComplete, 
  onPrevious, 
  onCancel 
}: InterviewPreferencesStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<InterviewPreferencesFormData>({
    resolver: zodResolver(interviewPreferencesSchema),
    defaultValues: initialData,
  })

  const currentlyReceivingTherapy = watch('currentlyReceivingTherapy')
  const preferredDays = watch('preferredDays') || []

  const onSubmit = (data: InterviewPreferencesFormData) => {
    onComplete(data)
  }

  const handleDayToggle = (day: string) => {
    const currentDays = preferredDays
    if (currentDays.includes(day as any)) {
      setValue('preferredDays', currentDays.filter(d => d !== day))
    } else {
      setValue('preferredDays', [...currentDays, day as any])
    }
  }

  const timeOfDayOptions = [
    { value: 'morning', label: 'Morning (9 AM - 12 PM)', icon: '🌅' },
    { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)', icon: '☀️' },
    { value: 'evening', label: 'Evening (5 PM - 8 PM)', icon: '🌆' },
    { value: 'any', label: 'Any time works', icon: '⏰' }
  ]

  const urgencyLevels = [
    { value: 'low', label: 'Low', description: 'No rush, just exploring options' },
    { value: 'medium', label: 'Medium', description: 'Would like to schedule within a few weeks' },
    { value: 'high', label: 'High', description: 'Need to schedule soon' }
  ]

  const daysOfWeek = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Interview Preferences
        </CardTitle>
        <CardDescription>
          Tell us about your scheduling preferences and what you hope to learn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Reason for Interview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reason for Interview</h3>
            
            <div className="space-y-2">
              <Label htmlFor="reasonForInterview">What brings you to seek an interview? *</Label>
              <Textarea
                id="reasonForInterview"
                {...register('reasonForInterview')}
                placeholder="Please tell us what concerns or questions you have about your child that led you to seek this interview..."
                rows={4}
                className={errors.reasonForInterview ? 'border-red-500' : ''}
              />
              {errors.reasonForInterview && (
                <p className="text-sm text-red-500">{errors.reasonForInterview.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Scheduling Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduling Preferences
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="preferredTimeOfDay">Preferred Time of Day *</Label>
              <Select onValueChange={(value) => setValue('preferredTimeOfDay', value as any)}>
                <SelectTrigger className={errors.preferredTimeOfDay ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select your preferred time of day" />
                </SelectTrigger>
                <SelectContent>
                  {timeOfDayOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.preferredTimeOfDay && (
                <p className="text-sm text-red-500">{errors.preferredTimeOfDay.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Preferred Days *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.value}
                      checked={preferredDays.includes(day.value as any)}
                      onCheckedChange={() => handleDayToggle(day.value)}
                    />
                    <Label htmlFor={day.value} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.preferredDays && (
                <p className="text-sm text-red-500">{errors.preferredDays.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Contact Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Preferences</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferredContactMethod">Preferred Contact Method *</Label>
                <Select onValueChange={(value) => setValue('preferredContactMethod', value as any)}>
                  <SelectTrigger className={errors.preferredContactMethod ? 'border-red-500' : ''}>
                    <SelectValue placeholder="How would you like us to contact you?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="phone">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>Phone call</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="either">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>Either phone or email</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.preferredContactMethod && (
                  <p className="text-sm text-red-500">{errors.preferredContactMethod.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bestTimeToContact">Best Time to Contact You *</Label>
                <Input
                  id="bestTimeToContact"
                  {...register('bestTimeToContact')}
                  placeholder="e.g., Weekdays after 5 PM, Weekends anytime"
                  className={errors.bestTimeToContact ? 'border-red-500' : ''}
                />
                {errors.bestTimeToContact && (
                  <p className="text-sm text-red-500">{errors.bestTimeToContact.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Urgency Level */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Urgency Level
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="urgencyLevel">How urgent is this interview? *</Label>
              <Select onValueChange={(value) => setValue('urgencyLevel', value as any)}>
                <SelectTrigger className={errors.urgencyLevel ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select urgency level" />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium">{level.label}</div>
                        <div className="text-sm text-muted-foreground">{level.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.urgencyLevel && (
                <p className="text-sm text-red-500">{errors.urgencyLevel.message}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Current Therapy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Therapy</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="currentlyReceivingTherapy"
                checked={currentlyReceivingTherapy}
                onCheckedChange={(checked) => setValue('currentlyReceivingTherapy', !!checked)}
              />
              <Label htmlFor="currentlyReceivingTherapy">
                Child is currently receiving therapy services
              </Label>
            </div>

            {currentlyReceivingTherapy && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="currentTherapistName">Current Therapist Name *</Label>
                <Input
                  id="currentTherapistName"
                  {...register('currentTherapistName')}
                  placeholder="Enter therapist name"
                  className={errors.currentTherapistName ? 'border-red-500' : ''}
                />
                {errors.currentTherapistName && (
                  <p className="text-sm text-red-500">{errors.currentTherapistName.message}</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Goals */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What You Hope to Learn</h3>
            
            <div className="space-y-2">
              <Label htmlFor="whatHopingToLearn">What are you hoping to learn from this interview? *</Label>
              <Textarea
                id="whatHopingToLearn"
                {...register('whatHopingToLearn')}
                placeholder="Please describe what you hope to gain from this interview, what questions you have, or what information you're looking for..."
                rows={4}
                className={errors.whatHopingToLearn ? 'border-red-500' : ''}
              />
              {errors.whatHopingToLearn && (
                <p className="text-sm text-red-500">{errors.whatHopingToLearn.message}</p>
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


