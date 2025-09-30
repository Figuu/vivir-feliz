'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, CheckCircle, User, Calendar, FileText, AlertTriangle } from 'lucide-react'
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Review & Submit
        </CardTitle>
        <CardDescription>
          Please review your information before submitting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Information */}
        {personalInfo && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
              <div>
                <p className="text-sm text-muted-foreground">Parent Name</p>
                <p className="font-medium">{personalInfo.parentFirstName} {personalInfo.parentLastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{personalInfo.parentEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{personalInfo.parentPhone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Relationship</p>
                <p className="font-medium capitalize">{personalInfo.relationshipToChild === 'other' && personalInfo.otherRelationship ? personalInfo.otherRelationship : personalInfo.relationshipToChild}</p>
              </div>
              {personalInfo.address && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{personalInfo.address}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Consultation Details */}
        {consultationDetails && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold">Consultation Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
              <div>
                <p className="text-sm text-muted-foreground">Consultation Reason</p>
                <p className="font-medium">{consultationDetails.consultationReason}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Urgency Level</p>
                <p className="font-medium capitalize">{consultationDetails.urgencyLevel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Preferred Specialty</p>
                <p className="font-medium">{consultationDetails.preferredSpecialty}</p>
              </div>
              {consultationDetails.preferredTherapist && (
                <div>
                  <p className="text-sm text-muted-foreground">Preferred Therapist</p>
                  <p className="font-medium">{consultationDetails.preferredTherapist}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Preferred Date</p>
                <p className="font-medium">{new Date(consultationDetails.preferredDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Preferred Time</p>
                <p className="font-medium">{consultationDetails.preferredTime}</p>
              </div>
              {consultationDetails.currentTherapy && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Therapist</p>
                    <p className="font-medium">{consultationDetails.currentTherapistName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Therapist Phone</p>
                    <p className="font-medium">{consultationDetails.currentTherapistPhone}</p>
                  </div>
                </>
              )}
              {consultationDetails.insuranceProvider && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Insurance Provider</p>
                    <p className="font-medium">{consultationDetails.insuranceProvider}</p>
                  </div>
                  {consultationDetails.insurancePolicyNumber && (
                    <div>
                      <p className="text-sm text-muted-foreground">Policy Number</p>
                      <p className="font-medium">{consultationDetails.insurancePolicyNumber}</p>
                    </div>
                  )}
                </>
              )}
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Emergency Contact</p>
                <p className="font-medium">
                  {consultationDetails.emergencyContactName} ({consultationDetails.emergencyContactRelationship}) - {consultationDetails.emergencyContactPhone}
                </p>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Child Information */}
        {childInfo && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold">Child Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
              {personalInfo && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Child Name</p>
                    <p className="font-medium">{personalInfo.childFirstName} {personalInfo.childLastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium">{new Date(personalInfo.childDateOfBirth).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{personalInfo.childGender.replace(/_/g, ' ')}</p>
                  </div>
                </>
              )}
              {childInfo.medicalConditions && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Medical Conditions</p>
                  <p className="font-medium">{childInfo.medicalConditions}</p>
                </div>
              )}
              {childInfo.medications && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Current Medications</p>
                  <p className="font-medium">{childInfo.medications}</p>
                </div>
              )}
              {childInfo.allergies && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Allergies</p>
                  <p className="font-medium">{childInfo.allergies}</p>
                </div>
              )}
              {childInfo.behavioralConcerns && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Behavioral Concerns</p>
                  <p className="font-medium">{childInfo.behavioralConcerns}</p>
                </div>
              )}
              {childInfo.therapyGoals && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Therapy Goals</p>
                  <p className="font-medium">{childInfo.therapyGoals}</p>
                </div>
              )}
              {childInfo.developmentalMilestones && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Developmental Milestones</p>
                  <p className="font-medium">{childInfo.developmentalMilestones}</p>
                </div>
              )}
              {childInfo.schoolInformation && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">School Information</p>
                  <p className="font-medium">{childInfo.schoolInformation}</p>
                </div>
              )}
              {childInfo.additionalInformation && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Additional Information</p>
                  <p className="font-medium">{childInfo.additionalInformation}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Warning Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please review all information carefully. You will receive a confirmation email once your consultation request is submitted.
          </AlertDescription>
        </Alert>

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
          <Button type="button" onClick={onSubmit}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Submit Consultation Request
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

