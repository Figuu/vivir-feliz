'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { personalInfoSchema, type PersonalInfoFormData } from '@/lib/validations/consultation'
import { User, Phone, Mail, MapPin, Calendar, ArrowRight } from 'lucide-react'

interface PersonalInfoStepProps {
  initialData?: Partial<PersonalInfoFormData>
  onComplete: (data: PersonalInfoFormData) => void
  onCancel: () => void
}

export function PersonalInfoStep({ initialData, onComplete, onCancel }: PersonalInfoStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: initialData,
  })

  const relationshipToChild = watch('relationshipToChild')

  const onSubmit = (data: PersonalInfoFormData) => {
    onComplete(data)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Please provide your contact information and details about your child
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Parent/Guardian Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Parent/Guardian Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentFirstName">First Name *</Label>
                <Input
                  id="parentFirstName"
                  {...register('parentFirstName')}
                  placeholder="Enter your first name"
                  className={errors.parentFirstName ? 'border-red-500' : ''}
                />
                {errors.parentFirstName && (
                  <p className="text-sm text-red-500">{errors.parentFirstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parentLastName">Last Name *</Label>
                <Input
                  id="parentLastName"
                  {...register('parentLastName')}
                  placeholder="Enter your last name"
                  className={errors.parentLastName ? 'border-red-500' : ''}
                />
                {errors.parentLastName && (
                  <p className="text-sm text-red-500">{errors.parentLastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentEmail">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="parentEmail"
                    type="email"
                    {...register('parentEmail')}
                    placeholder="your.email@example.com"
                    className={`pl-10 ${errors.parentEmail ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.parentEmail && (
                  <p className="text-sm text-red-500">{errors.parentEmail.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parentPhone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="parentPhone"
                    type="tel"
                    {...register('parentPhone')}
                    placeholder="(555) 123-4567"
                    className={`pl-10 ${errors.parentPhone ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.parentPhone && (
                  <p className="text-sm text-red-500">{errors.parentPhone.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="relationshipToChild">Relationship to Child *</Label>
                <Select onValueChange={(value) => setValue('relationshipToChild', value as any)}>
                  <SelectTrigger className={errors.relationshipToChild ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="grandparent">Grandparent</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.relationshipToChild && (
                  <p className="text-sm text-red-500">{errors.relationshipToChild.message}</p>
                )}
              </div>
              
              {relationshipToChild === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="otherRelationship">Please specify *</Label>
                  <Input
                    id="otherRelationship"
                    {...register('otherRelationship')}
                    placeholder="e.g., Aunt, Uncle, Family Friend"
                    className={errors.otherRelationship ? 'border-red-500' : ''}
                  />
                  {errors.otherRelationship && (
                    <p className="text-sm text-red-500">{errors.otherRelationship.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Child Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Child Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="childFirstName">Child's First Name *</Label>
                <Input
                  id="childFirstName"
                  {...register('childFirstName')}
                  placeholder="Enter child's first name"
                  className={errors.childFirstName ? 'border-red-500' : ''}
                />
                {errors.childFirstName && (
                  <p className="text-sm text-red-500">{errors.childFirstName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="childLastName">Child's Last Name *</Label>
                <Input
                  id="childLastName"
                  {...register('childLastName')}
                  placeholder="Enter child's last name"
                  className={errors.childLastName ? 'border-red-500' : ''}
                />
                {errors.childLastName && (
                  <p className="text-sm text-red-500">{errors.childLastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="childDateOfBirth">Date of Birth *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="childDateOfBirth"
                    type="date"
                    {...register('childDateOfBirth')}
                    className={`pl-10 ${errors.childDateOfBirth ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.childDateOfBirth && (
                  <p className="text-sm text-red-500">{errors.childDateOfBirth.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="childGender">Gender *</Label>
                <Select onValueChange={(value) => setValue('childGender', value as any)}>
                  <SelectTrigger className={errors.childGender ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
                {errors.childGender && (
                  <p className="text-sm text-red-500">{errors.childGender.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address Information
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="123 Main Street, Apt 4B"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Enter city"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="Enter state"
                  className={errors.state ? 'border-red-500' : ''}
                />
                {errors.state && (
                  <p className="text-sm text-red-500">{errors.state.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  {...register('zipCode')}
                  placeholder="12345"
                  className={errors.zipCode ? 'border-red-500' : ''}
                />
                {errors.zipCode && (
                  <p className="text-sm text-red-500">{errors.zipCode.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="Enter country"
                className={errors.country ? 'border-red-500' : ''}
              />
              {errors.country && (
                <p className="text-sm text-red-500">{errors.country.message}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
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
