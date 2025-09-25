'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CheckCircle, User, Calendar, FileText, DollarSign, Clock } from 'lucide-react'
import { therapyConfig } from '@/lib/config'
import type { PersonalInfoFormData, ConsultationDetailsFormData, ChildInfoFormData } from '@/lib/validations/consultation'

interface FormSummaryProps {
  formData: {
    personalInfo?: PersonalInfoFormData
    consultationDetails?: ConsultationDetailsFormData
    childInfo?: ChildInfoFormData
  }
  onSubmit: () => void
  onPrevious: () => void
  onCancel: () => void
}

export function FormSummary({ formData, onSubmit, onPrevious, onCancel }: FormSummaryProps) {
  const { personalInfo, consultationDetails, childInfo } = formData

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Review Your Consultation Request
          </CardTitle>
          <CardDescription>
            Please review all the information below before submitting your consultation request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">Consultation Fee</span>
              </div>
              <Badge variant="secondary" className="text-lg">
                ${therapyConfig.defaultConsultationPrice}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{therapyConfig.defaultConsultationDuration} minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Summary */}
      {personalInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Parent/Guardian</h4>
                <p className="text-lg">{personalInfo.parentFirstName} {personalInfo.parentLastName}</p>
                <p className="text-sm text-muted-foreground">{personalInfo.parentEmail}</p>
                <p className="text-sm text-muted-foreground">{personalInfo.parentPhone}</p>
                <p className="text-sm text-muted-foreground">
                  Relationship: {personalInfo.relationshipToChild === 'other' 
                    ? personalInfo.otherRelationship 
                    : personalInfo.relationshipToChild}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Child</h4>
                <p className="text-lg">{personalInfo.childFirstName} {personalInfo.childLastName}</p>
                <p className="text-sm text-muted-foreground">
                  Age: {calculateAge(personalInfo.childDateOfBirth)} years old
                </p>
                <p className="text-sm text-muted-foreground">
                  Gender: {personalInfo.childGender}
                </p>
                <p className="text-sm text-muted-foreground">
                  Born: {formatDate(personalInfo.childDateOfBirth)}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Address</h4>
              <p className="text-sm">
                {personalInfo.address}<br />
                {personalInfo.city}, {personalInfo.state} {personalInfo.zipCode}<br />
                {personalInfo.country}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Consultation Details Summary */}
      {consultationDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Consultation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Reason & Urgency</h4>
                <p className="text-sm">{consultationDetails.consultationReason}</p>
                <Badge variant="outline" className="mt-1">
                  {consultationDetails.urgencyLevel} priority
                </Badge>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Specialty & Scheduling</h4>
                <p className="text-sm">Preferred: {consultationDetails.preferredSpecialty}</p>
                <p className="text-sm">
                  {formatDate(consultationDetails.preferredDate)} at {consultationDetails.preferredTime}
                </p>
                {consultationDetails.preferredTherapist && (
                  <p className="text-sm">Therapist: {consultationDetails.preferredTherapist}</p>
                )}
              </div>
            </div>
            
            {consultationDetails.currentTherapy && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Current Therapy</h4>
                  <p className="text-sm">
                    Currently seeing: {consultationDetails.currentTherapistName}
                  </p>
                  <p className="text-sm">Phone: {consultationDetails.currentTherapistPhone}</p>
                </div>
              </>
            )}
            
            {(consultationDetails.insuranceProvider || consultationDetails.insurancePolicyNumber) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Insurance</h4>
                  {consultationDetails.insuranceProvider && (
                    <p className="text-sm">Provider: {consultationDetails.insuranceProvider}</p>
                  )}
                  {consultationDetails.insurancePolicyNumber && (
                    <p className="text-sm">Policy: {consultationDetails.insurancePolicyNumber}</p>
                  )}
                </div>
              </>
            )}
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Emergency Contact</h4>
              <p className="text-sm">
                {consultationDetails.emergencyContactName} ({consultationDetails.emergencyContactRelationship})
              </p>
              <p className="text-sm">{consultationDetails.emergencyContactPhone}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Child Information Summary */}
      {childInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Child Information Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {childInfo.medicalConditions && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Medical Conditions</h4>
                <p className="text-sm">{childInfo.medicalConditions}</p>
              </div>
            )}
            
            {childInfo.medications && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Medications</h4>
                <p className="text-sm">{childInfo.medications}</p>
              </div>
            )}
            
            {childInfo.allergies && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Allergies</h4>
                <p className="text-sm">{childInfo.allergies}</p>
              </div>
            )}
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Primary Concerns</h4>
              <p className="text-sm">{childInfo.behavioralConcerns}</p>
            </div>
            
            {childInfo.therapyGoals && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Therapy Goals</h4>
                <p className="text-sm">{childInfo.therapyGoals}</p>
              </div>
            )}
            
            {(childInfo.developmentalMilestones || childInfo.schoolInformation) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Development & School</h4>
                  {childInfo.developmentalMilestones && (
                    <p className="text-sm mb-2">{childInfo.developmentalMilestones}</p>
                  )}
                  {childInfo.schoolInformation && (
                    <p className="text-sm">{childInfo.schoolInformation}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onPrevious}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total consultation fee</p>
                <p className="text-2xl font-bold">${therapyConfig.defaultConsultationPrice}</p>
              </div>
              <Button onClick={onSubmit} size="lg" className="min-w-[200px]">
                <CheckCircle className="mr-2 h-4 w-4" />
                Submit Request
              </Button>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Next Steps:</strong> After submitting your request, our team will review your information 
              and contact you within 24 hours to confirm your consultation appointment and provide payment instructions.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
