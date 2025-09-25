'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, CheckCircle, User, Calendar, MessageSquare, Gift } from 'lucide-react'
import { therapyConfig } from '@/lib/config'
import type { BasicInfoFormData, InterviewPreferencesFormData, ChildConcernsFormData } from '@/lib/validations/interview'

interface InterviewSummaryProps {
  formData: {
    basicInfo?: BasicInfoFormData
    interviewPreferences?: InterviewPreferencesFormData
    childConcerns?: ChildConcernsFormData
  }
  onSubmit: () => void
  onPrevious: () => void
  onCancel: () => void
}

export function InterviewSummary({ formData, onSubmit, onPrevious, onCancel }: InterviewSummaryProps) {
  const { basicInfo, interviewPreferences, childConcerns } = formData

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

  const formatDays = (days: string[]) => {
    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Review Your Interview Request
          </CardTitle>
          <CardDescription>
            Please review all the information below before submitting your free interview request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Free Interview</span>
              </div>
              <Badge variant="secondary" className="text-lg bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                No Cost
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{therapyConfig.defaultInterviewDuration} minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information Summary */}
      {basicInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Parent/Guardian</h4>
                <p className="text-lg">{basicInfo.parentFirstName} {basicInfo.parentLastName}</p>
                <p className="text-sm text-muted-foreground">{basicInfo.parentEmail}</p>
                <p className="text-sm text-muted-foreground">{basicInfo.parentPhone}</p>
                <p className="text-sm text-muted-foreground">
                  Relationship: {basicInfo.relationshipToChild === 'other' 
                    ? basicInfo.otherRelationship 
                    : basicInfo.relationshipToChild}
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Child</h4>
                <p className="text-lg">{basicInfo.childFirstName} {basicInfo.childLastName}</p>
                <p className="text-sm text-muted-foreground">
                  Age: {calculateAge(basicInfo.childDateOfBirth)} years old
                </p>
                <p className="text-sm text-muted-foreground">
                  Gender: {basicInfo.childGender}
                </p>
                <p className="text-sm text-muted-foreground">
                  Born: {formatDate(basicInfo.childDateOfBirth)}
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Location</h4>
              <p className="text-sm">
                {basicInfo.city}, {basicInfo.state}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interview Preferences Summary */}
      {interviewPreferences && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Interview Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Reason for Interview</h4>
              <p className="text-sm">{interviewPreferences.reasonForInterview}</p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Scheduling Preferences</h4>
                <p className="text-sm">Time: {interviewPreferences.preferredTimeOfDay}</p>
                <p className="text-sm">Days: {formatDays(interviewPreferences.preferredDays)}</p>
                <Badge variant="outline" className="mt-1">
                  {interviewPreferences.urgencyLevel} priority
                </Badge>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground">Contact Preferences</h4>
                <p className="text-sm">Method: {interviewPreferences.preferredContactMethod}</p>
                <p className="text-sm">Best time: {interviewPreferences.bestTimeToContact}</p>
              </div>
            </div>
            
            {interviewPreferences.currentlyReceivingTherapy && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Current Therapy</h4>
                  <p className="text-sm">
                    Currently seeing: {interviewPreferences.currentTherapistName}
                  </p>
                </div>
              </>
            )}
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">What You Hope to Learn</h4>
              <p className="text-sm">{interviewPreferences.whatHopingToLearn}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Child Concerns Summary */}
      {childConcerns && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Child Concerns Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Main Concerns</h4>
              <p className="text-sm">{childConcerns.mainConcerns}</p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">When Concerns Started</h4>
              <p className="text-sm">{childConcerns.whenConcernsStarted}</p>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground">Impact on Daily Life</h4>
              <p className="text-sm">{childConcerns.impactOnDailyLife}</p>
            </div>
            
            {childConcerns.whatHasBeenTried && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">What Has Been Tried</h4>
                  <p className="text-sm">{childConcerns.whatHasBeenTried}</p>
                </div>
              </>
            )}
            
            {(childConcerns.schoolBehavior || childConcerns.familySituation) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Additional Information</h4>
                  {childConcerns.schoolBehavior && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-muted-foreground">School Behavior:</p>
                      <p className="text-sm">{childConcerns.schoolBehavior}</p>
                    </div>
                  )}
                  {childConcerns.familySituation && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Family Situation:</p>
                      <p className="text-sm">{childConcerns.familySituation}</p>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {childConcerns.additionalInformation && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground">Additional Information</h4>
                  <p className="text-sm">{childConcerns.additionalInformation}</p>
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
                <p className="text-sm text-muted-foreground">Interview cost</p>
                <p className="text-2xl font-bold text-green-600">Free</p>
              </div>
              <Button onClick={onSubmit} size="lg" className="min-w-[200px]">
                <CheckCircle className="mr-2 h-4 w-4" />
                Submit Request
              </Button>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Next Steps:</strong> After submitting your request, our team will review your information 
              and contact you within 24 hours to schedule your free interview. This is a no-obligation conversation 
              to help you understand your options and answer any questions you may have.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
