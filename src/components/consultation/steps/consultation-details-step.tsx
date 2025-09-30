'use client'

import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { consultationDetailsSchema, type ConsultationDetailsFormData } from '@/lib/validations/consultation'
import { Calendar, Clock, ArrowLeft, ArrowRight, AlertTriangle, Shield, Phone } from 'lucide-react'

interface ConsultationDetailsStepProps {
  initialData?: Partial<ConsultationDetailsFormData>
  onComplete: (data: ConsultationDetailsFormData) => void
  onPrevious: () => void
  onCancel: () => void
}

export function ConsultationDetailsStep({ 
  initialData, 
  onComplete, 
  onPrevious, 
  onCancel 
}: ConsultationDetailsStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ConsultationDetailsFormData>({
    resolver: zodResolver(consultationDetailsSchema),
    defaultValues: initialData,
  })

  const currentTherapy = watch('currentTherapy')

  // Fetch consultation reasons from API
  const { data: consultationReasonsData, isLoading: reasonsLoading } = useQuery({
    queryKey: ['consultation-reasons'],
    queryFn: async () => {
      const response = await fetch('/api/consultation-reasons')
      if (!response.ok) throw new Error('Failed to fetch consultation reasons')
      return response.json()
    }
  })

  // Fetch specialties from API
  const { data: specialtiesData, isLoading: specialtiesLoading } = useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const response = await fetch('/api/specialties')
      if (!response.ok) throw new Error('Failed to fetch specialties')
      return response.json()
    }
  })

  const consultationReasons = consultationReasonsData?.consultationReasons || []
  const specialties = specialtiesData?.specialties || []

  const urgencyLevels = [
    { value: 'low', label: 'Low', description: 'Can wait 2-4 weeks' },
    { value: 'medium', label: 'Medium', description: 'Would like within 1-2 weeks' },
    { value: 'high', label: 'High', description: 'Needs attention within a few days' },
    { value: 'urgent', label: 'Urgent', description: 'Requires immediate attention' }
  ]

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ]

  const onSubmit = (data: ConsultationDetailsFormData) => {
    onComplete(data)
  }

  const isLoading = reasonsLoading || specialtiesLoading

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Consultation Details
        </CardTitle>
        <CardDescription>
          Tell us about your consultation preferences and current situation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Consultation Reason */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Consultation Reason</h3>
            
            <div className="space-y-2">
              <Label htmlFor="consultationReason">Primary Reason for Consultation *</Label>
              <Select onValueChange={(value) => setValue('consultationReason', value)}>
                <SelectTrigger className={errors.consultationReason ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select the main reason for consultation" />
                </SelectTrigger>
                <SelectContent>
                  {consultationReasons.map((reason: any) => (
                    <SelectItem key={reason.id} value={reason.name}>
                      {reason.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.consultationReason && (
                <p className="text-sm text-red-500">{errors.consultationReason.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgencyLevel">Urgency Level *</Label>
              <Select onValueChange={(value) => setValue('urgencyLevel', value as any)}>
                <SelectTrigger className={errors.urgencyLevel ? 'border-red-500' : ''}>
                  <SelectValue placeholder="How urgent is this consultation?" />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{level.label}</div>
                          <div className="text-sm text-muted-foreground">{level.description}</div>
                        </div>
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

          {/* Specialty and Therapist Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Specialty Preferences</h3>
            
            <div className="space-y-2">
              <Label htmlFor="preferredSpecialty">Preferred Specialty *</Label>
              <Select onValueChange={(value) => setValue('preferredSpecialty', value)}>
                <SelectTrigger className={errors.preferredSpecialty ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select preferred specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((specialty: any) => (
                    <SelectItem key={specialty.id} value={specialty.name}>
                      {specialty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.preferredSpecialty && (
                <p className="text-sm text-red-500">{errors.preferredSpecialty.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredTherapist">Preferred Therapist (Optional)</Label>
              <Input
                id="preferredTherapist"
                {...register('preferredTherapist')}
                placeholder="Enter therapist name if you have a preference"
              />
            </div>
          </div>

          <Separator />

          {/* Scheduling Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Scheduling Preferences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferredDate">Preferred Date *</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  {...register('preferredDate')}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.preferredDate ? 'border-red-500' : ''}
                />
                {errors.preferredDate && (
                  <p className="text-sm text-red-500">{errors.preferredDate.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preferredTime">Preferred Time *</Label>
                <Select onValueChange={(value) => setValue('preferredTime', value)}>
                  <SelectTrigger className={errors.preferredTime ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select preferred time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.preferredTime && (
                  <p className="text-sm text-red-500">{errors.preferredTime.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Current Therapy Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Therapy Information</h3>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="currentTherapy"
                checked={currentTherapy}
                onCheckedChange={(checked) => setValue('currentTherapy', !!checked)}
              />
              <Label htmlFor="currentTherapy">
                Child is currently receiving therapy services
              </Label>
            </div>

            {currentTherapy && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
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
                
                <div className="space-y-2">
                  <Label htmlFor="currentTherapistPhone">Therapist Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="currentTherapistPhone"
                      type="tel"
                      {...register('currentTherapistPhone')}
                      placeholder="(555) 123-4567"
                      className={`pl-10 ${errors.currentTherapistPhone ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.currentTherapistPhone && (
                    <p className="text-sm text-red-500">{errors.currentTherapistPhone.message}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Insurance Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Insurance Information (Optional)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                <Input
                  id="insuranceProvider"
                  {...register('insuranceProvider')}
                  placeholder="Enter insurance provider name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
                <Input
                  id="insurancePolicyNumber"
                  {...register('insurancePolicyNumber')}
                  placeholder="Enter policy number"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Emergency Contact</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                <Input
                  id="emergencyContactName"
                  {...register('emergencyContactName')}
                  placeholder="Enter emergency contact name"
                  className={errors.emergencyContactName ? 'border-red-500' : ''}
                />
                {errors.emergencyContactName && (
                  <p className="text-sm text-red-500">{errors.emergencyContactName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    {...register('emergencyContactPhone')}
                    placeholder="(555) 123-4567"
                    className={`pl-10 ${errors.emergencyContactPhone ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.emergencyContactPhone && (
                  <p className="text-sm text-red-500">{errors.emergencyContactPhone.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergencyContactRelationship">Relationship *</Label>
                <Input
                  id="emergencyContactRelationship"
                  {...register('emergencyContactRelationship')}
                  placeholder="e.g., Grandmother, Uncle"
                  className={errors.emergencyContactRelationship ? 'border-red-500' : ''}
                />
                {errors.emergencyContactRelationship && (
                  <p className="text-sm text-red-500">{errors.emergencyContactRelationship.message}</p>
                )}
              </div>
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


