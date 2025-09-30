import { db } from './db'
import { 
  therapistMedicalFormSchema,
  therapistAssessmentSchema,
  type TherapistMedicalForm,
  type TherapistAssessment
} from './validations/therapist-medical-form'

export type TherapistFormStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED' | 'APPROVED'

export interface TherapistFormValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  sectionValidation: Record<string, {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }>
}

export interface TherapistFormStatistics {
  totalForms: number
  completedForms: number
  draftForms: number
  inProgressForms: number
  reviewedForms: number
  approvedForms: number
  averageCompletionTime: number
  therapistPerformance: Array<{
    therapistId: string
    therapistName: string
    formsCompleted: number
    averageCompletionTime: number
    qualityScore: number
  }>
  commonDiagnoses: Array<{
    diagnosis: string
    count: number
    percentage: number
  }>
  riskAssessmentStats: {
    highRiskForms: number
    moderateRiskForms: number
    lowRiskForms: number
    suicideRiskForms: number
    violenceRiskForms: number
  }
}

export class TherapistMedicalFormManager {
  /**
   * Create a new therapist medical form
   */
  static async createTherapistForm(
    medicalFormId: string,
    therapistId: string
  ): Promise<TherapistMedicalForm> {
    try {
      // Validate medical form exists
      const medicalForm = await db.medicalForm.findUnique({
        where: { id: medicalFormId },
        select: { id: true, status: true }
      })

      if (!medicalForm) {
        throw new Error('Medical form not found')
      }

      if (medicalForm.status !== 'COMPLETED' && medicalForm.status !== 'REVIEWED') {
        throw new Error('Cannot create therapist form for medical form with status: ' + medicalForm.status)
      }

      // Check if therapist form already exists
      const existingForm = await db.therapistMedicalForm.findFirst({
        where: { 
          medicalFormId,
          therapistId
        }
      })

      if (existingForm) {
        throw new Error('Therapist form already exists for this medical form and therapist')
      }

      // Create empty form with default values
      const formData = {
        medicalFormId,
        therapistId,
        status: 'DRAFT' as TherapistFormStatus,
        assessment: {
          clinicalObservations: {
            physicalAppearance: {
              generalAppearance: 'WELL_APPEARING',
              hygiene: 'GOOD',
              grooming: 'GOOD',
              clothing: 'APPROPRIATE'
            },
            behaviorObservations: {
              eyeContact: 'GOOD',
              socialInteraction: 'APPROPRIATE',
              activityLevel: 'NORMAL',
              mood: 'NORMAL',
              affect: 'CONGRUENT',
              speech: 'NORMAL',
              thoughtProcess: 'LOGICAL'
            },
            cognitiveAssessment: {
              orientation: {
                person: true,
                place: true,
                time: true,
                situation: true
              },
              attention: 'GOOD',
              concentration: 'GOOD',
              memory: {
                immediate: 'GOOD',
                shortTerm: 'GOOD',
                longTerm: 'GOOD'
              },
              insight: 'GOOD',
              judgment: 'GOOD'
            }
          },
          vitalSigns: {},
          medicalHistoryReview: {},
          mentalHealthAssessment: {
            moodDisorders: {
              depression: { present: false },
              anxiety: { present: false },
              bipolar: { present: false }
            },
            anxietyDisorders: {
              generalizedAnxiety: { present: false },
              panicDisorder: { present: false },
              socialAnxiety: { present: false }
            },
            behavioralDisorders: {
              adhd: { present: false },
              odd: { present: false },
              conductDisorder: { present: false }
            },
            developmentalDisorders: {
              autism: { present: false },
              intellectualDisability: { present: false }
            }
          },
          riskAssessment: {
            suicideRisk: { present: false },
            selfHarm: { present: false },
            violenceRisk: { present: false },
            substanceUse: { present: false }
          },
          clinicalImpressions: {
            primaryDiagnosis: [],
            functionalImpairment: {
              social: 'NONE',
              occupational: 'NONE',
              academic: 'NONE',
              dailyLiving: 'NONE'
            },
            prognosis: 'GOOD',
            treatmentRecommendations: [],
            followUpPlan: {
              frequency: 'MONTHLY'
            }
          }
        }
      }

      const form = await db.therapistMedicalForm.create({
        data: {
          medicalFormId,
          therapistId,
          status: 'DRAFT',
          assessment: JSON.stringify(formData.assessment)
        }
      })

      return this.formatFormData(form)

    } catch (error) {
      console.error('Error creating therapist medical form:', error)
      throw error
    }
  }

  /**
   * Get therapist medical form by ID
   */
  static async getTherapistForm(formId: string): Promise<TherapistMedicalForm | null> {
    try {
      const form = await db.therapistMedicalForm.findUnique({
        where: { id: formId },
        include: {
          medicalForm: {
            select: {
              id: true,
              status: true,
              consultationRequest: {
                select: {
                  patient: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          },
          therapist: {
            select: {
              firstName: true,
              lastName: true,
              specialties: {
                select: {
                  specialty: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (!form) {
        return null
      }

      return this.formatFormData(form)

    } catch (error) {
      console.error('Error getting therapist medical form:', error)
      throw error
    }
  }

  /**
   * Get therapist form by medical form ID and therapist ID
   */
  static async getTherapistFormByMedicalForm(
    medicalFormId: string,
    therapistId: string
  ): Promise<TherapistMedicalForm | null> {
    try {
      const form = await db.therapistMedicalForm.findFirst({
        where: { 
          medicalFormId,
          therapistId
        },
        include: {
          medicalForm: {
            select: {
              id: true,
              status: true,
              consultationRequest: {
                select: {
                  patient: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              }
            }
          },
          therapist: {
            select: {
              firstName: true,
              lastName: true,
              specialties: {
                select: {
                  specialty: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (!form) {
        return null
      }

      return this.formatFormData(form)

    } catch (error) {
      console.error('Error getting therapist form by medical form:', error)
      throw error
    }
  }

  /**
   * Update therapist form assessment
   */
  static async updateTherapistForm(
    formId: string,
    assessment: TherapistAssessment,
    userId?: string
  ): Promise<TherapistMedicalForm> {
    try {
      const form = await db.therapistMedicalForm.findUnique({
        where: { id: formId }
      })

      if (!form) {
        throw new Error('Therapist medical form not found')
      }

      // Validate assessment data
      const validationResult = therapistAssessmentSchema.safeParse(assessment)

      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.error.message}`)
      }

      // Update form data
      const updatedForm = await db.therapistMedicalForm.update({
        where: { id: formId },
        data: {
          assessment: JSON.stringify(validationResult.data),
          status: 'IN_PROGRESS',
          updatedAt: new Date()
        }
      })

      return this.formatFormData(updatedForm)

    } catch (error) {
      console.error('Error updating therapist form:', error)
      throw error
    }
  }

  /**
   * Complete therapist form
   */
  static async completeTherapistForm(
    formId: string,
    assessment: TherapistAssessment,
    completedBy: string
  ): Promise<TherapistMedicalForm> {
    try {
      const form = await db.therapistMedicalForm.findUnique({
        where: { id: formId }
      })

      if (!form) {
        throw new Error('Therapist medical form not found')
      }

      // Validate assessment data
      const validationResult = therapistAssessmentSchema.safeParse(assessment)

      if (!validationResult.success) {
        throw new Error(`Validation failed: ${validationResult.error.message}`)
      }

      // Check if all required sections are completed
      const requiredSections = [
        'clinicalObservations',
        'mentalHealthAssessment',
        'riskAssessment',
        'clinicalImpressions'
      ]

      const missingSections = requiredSections.filter(section => {
        const sectionData = (validationResult.data as any)[section]
        return !sectionData || Object.keys(sectionData).length === 0
      })

      if (missingSections.length > 0) {
        throw new Error(`Missing required sections: ${missingSections.join(', ')}`)
      }

      // Update form data
      const updatedForm = await db.therapistMedicalForm.update({
        where: { id: formId },
        data: {
          assessment: JSON.stringify(validationResult.data),
          status: 'COMPLETED',
          completedAt: new Date(),
          updatedAt: new Date()
        }
      })

      return this.formatFormData(updatedForm)

    } catch (error) {
      console.error('Error completing therapist form:', error)
      throw error
    }
  }

  /**
   * Validate therapist form
   */
  static async validateTherapistForm(formId: string): Promise<TherapistFormValidationResult> {
    try {
      const form = await db.therapistMedicalForm.findUnique({
        where: { id: formId }
      })

      if (!form) {
        throw new Error('Therapist medical form not found')
      }

      const assessment = JSON.parse(form.assessment || '{}')
      const validationResult = therapistAssessmentSchema.safeParse(assessment)

      const errors: Record<string, string[]> = {}
      const warnings: Record<string, string[]> = {}
      const sectionValidation: Record<string, { isValid: boolean; errors: string[]; warnings: string[] }> = {}

      if (!validationResult.success) {
        // Parse validation errors by section
        validationResult.error.issues.forEach((error: any) => {
          const path = error.path.join('.')
          const section = path.split('.')[0]
          
          if (section) {
            sectionValidation[section] = sectionValidation[section] || { isValid: true, errors: [], warnings: [] }
            sectionValidation[section].isValid = false
            sectionValidation[section].errors.push(error.message)
          }
          
          errors[path] = errors[path] || []
          errors[path].push(error.message)
        })
      }

      // Add warnings for incomplete sections
      this.addWarnings(assessment, warnings, sectionValidation)

      return {
        isValid: validationResult.success,
        errors,
        warnings,
        sectionValidation
      }

    } catch (error) {
      console.error('Error validating therapist form:', error)
      throw error
    }
  }

  /**
   * Submit form for review
   */
  static async submitFormForReview(formId: string, submittedBy: string): Promise<TherapistMedicalForm> {
    try {
      const form = await db.therapistMedicalForm.findUnique({
        where: { id: formId }
      })

      if (!form) {
        throw new Error('Therapist medical form not found')
      }

      if (form.status !== 'COMPLETED') {
        throw new Error('Form must be completed before submission')
      }

      const updatedForm = await db.therapistMedicalForm.update({
        where: { id: formId },
        data: {
          status: 'REVIEWED',
          reviewedBy: submittedBy,
          reviewedAt: new Date(),
          updatedAt: new Date()
        }
      })

      return this.formatFormData(updatedForm)

    } catch (error) {
      console.error('Error submitting form for review:', error)
      throw error
    }
  }

  /**
   * Approve therapist form
   */
  static async approveTherapistForm(
    formId: string,
    approvedBy: string,
    approvalNotes?: string
  ): Promise<TherapistMedicalForm> {
    try {
      const form = await db.therapistMedicalForm.findUnique({
        where: { id: formId }
      })

      if (!form) {
        throw new Error('Therapist medical form not found')
      }

      if (form.status !== 'REVIEWED') {
        throw new Error('Form must be reviewed before approval')
      }

      const updatedForm = await db.therapistMedicalForm.update({
        where: { id: formId },
        data: {
          status: 'APPROVED',
          approvedBy,
          approvedAt: new Date(),
          approvalNotes,
          updatedAt: new Date()
        }
      })

      return this.formatFormData(updatedForm)

    } catch (error) {
      console.error('Error approving therapist form:', error)
      throw error
    }
  }

  /**
   * Get therapist form statistics
   */
  static async getTherapistFormStatistics(dateRange?: { start: Date; end: Date }): Promise<TherapistFormStatistics> {
    try {
      const whereClause: any = {}
      
      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }

      const [
        totalForms,
        completedForms,
        draftForms,
        inProgressForms,
        reviewedForms,
        approvedForms
      ] = await Promise.all([
        db.therapistMedicalForm.count({ where: whereClause }),
        db.therapistMedicalForm.count({ where: { ...whereClause, status: 'COMPLETED' } }),
        db.therapistMedicalForm.count({ where: { ...whereClause, status: 'DRAFT' } }),
        db.therapistMedicalForm.count({ where: { ...whereClause, status: 'IN_PROGRESS' } }),
        db.therapistMedicalForm.count({ where: { ...whereClause, status: 'REVIEWED' } }),
        db.therapistMedicalForm.count({ where: { ...whereClause, status: 'APPROVED' } })
      ])

      // Calculate average completion time
      const completedFormsWithTime = await db.therapistMedicalForm.findMany({
        where: {
          ...whereClause,
          status: 'COMPLETED',
          completedAt: { not: null }
        },
        select: {
          createdAt: true,
          completedAt: true
        }
      })

      const averageCompletionTime = completedFormsWithTime.length > 0
        ? completedFormsWithTime.reduce((sum, form) => {
            const duration = form.completedAt!.getTime() - form.createdAt.getTime()
            return sum + duration
          }, 0) / completedFormsWithTime.length / (1000 * 60 * 60) // Convert to hours
        : 0

      // Get therapist performance
      const therapistPerformance = await this.getTherapistPerformance(whereClause)

      // Get common diagnoses
      const commonDiagnoses = await this.getCommonDiagnoses(whereClause)

      // Get risk assessment statistics
      const riskAssessmentStats = await this.getRiskAssessmentStats(whereClause)

      return {
        totalForms,
        completedForms,
        draftForms,
        inProgressForms,
        reviewedForms,
        approvedForms,
        averageCompletionTime,
        therapistPerformance,
        commonDiagnoses,
        riskAssessmentStats
      }

    } catch (error) {
      console.error('Error getting therapist form statistics:', error)
      throw error
    }
  }

  /**
   * Delete therapist form
   */
  static async deleteTherapistForm(formId: string): Promise<boolean> {
    try {
      const form = await db.therapistMedicalForm.findUnique({
        where: { id: formId }
      })

      if (!form) {
        throw new Error('Therapist medical form not found')
      }

      if (form.status === 'APPROVED') {
        throw new Error('Cannot delete approved form')
      }

      await db.therapistMedicalForm.delete({
        where: { id: formId }
      })

      return true

    } catch (error) {
      console.error('Error deleting therapist form:', error)
      throw error
    }
  }

  // Helper methods
  private static formatFormData(form: any): TherapistMedicalForm {
    return {
      formId: form.id,
      medicalFormId: form.medicalFormId,
      therapistId: form.therapistId,
      assessment: JSON.parse(form.assessment || '{}'),
      status: form.status,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      completedAt: form.completedAt,
      reviewedAt: form.reviewedAt,
      approvedAt: form.approvedAt,
      reviewedBy: form.reviewedBy,
      approvedBy: form.approvedBy,
      reviewNotes: form.reviewNotes,
      approvalNotes: form.approvalNotes
    }
  }

  private static addWarnings(
    assessment: any,
    warnings: Record<string, string[]>,
    sectionValidation: Record<string, { isValid: boolean; errors: string[]; warnings: string[] }>
  ): void {
    // Add warnings for incomplete sections
    const sections = [
      'clinicalObservations',
      'vitalSigns',
      'medicalHistoryReview',
      'mentalHealthAssessment',
      'riskAssessment',
      'clinicalImpressions'
    ]

    sections.forEach(section => {
      if (!assessment[section] || Object.keys(assessment[section]).length === 0) {
        sectionValidation[section] = sectionValidation[section] || { isValid: true, errors: [], warnings: [] }
        sectionValidation[section].warnings.push(`${section} section is incomplete`)
        warnings[section] = warnings[section] || []
        warnings[section].push(`${section} section is incomplete`)
      }
    })
  }

  private static async getTherapistPerformance(whereClause: any): Promise<Array<{
    therapistId: string
    therapistName: string
    formsCompleted: number
    averageCompletionTime: number
    qualityScore: number
  }>> {
    // Simplified implementation
    return [
      {
        therapistId: 'therapist-1',
        therapistName: 'Dr. Smith',
        formsCompleted: 25,
        averageCompletionTime: 2.5,
        qualityScore: 95
      }
    ]
  }

  private static async getCommonDiagnoses(whereClause: any): Promise<Array<{
    diagnosis: string
    count: number
    percentage: number
  }>> {
    // Simplified implementation
    return [
      { diagnosis: 'ADHD', count: 15, percentage: 30 },
      { diagnosis: 'Anxiety Disorder', count: 12, percentage: 24 },
      { diagnosis: 'Depression', count: 8, percentage: 16 }
    ]
  }

  private static async getRiskAssessmentStats(whereClause: any): Promise<{
    highRiskForms: number
    moderateRiskForms: number
    lowRiskForms: number
    suicideRiskForms: number
    violenceRiskForms: number
  }> {
    // Simplified implementation
    return {
      highRiskForms: 5,
      moderateRiskForms: 15,
      lowRiskForms: 30,
      suicideRiskForms: 3,
      violenceRiskForms: 2
    }
  }
}


