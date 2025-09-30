import { db } from './db'
import { 
  medicalFormSchema, 
  autoSaveSchema, 
  formProgressSchema,
  stepSchemas,
  type MedicalForm,
  type AutoSaveData,
  type FormProgress,
  type ParentInfo,
  type ChildInfo,
  type MedicalHistory,
  type CurrentConcerns,
  type FamilyInfo,
  type GoalsExpectations
} from './validations/medical-form'

export type FormStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED' | 'APPROVED'
export type FormStep = 1 | 2 | 3 | 4 | 5 | 6

export interface FormStepData {
  step: FormStep
  data: any
  isValid: boolean
  errors: string[]
  completedAt?: Date
}

export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  stepValidation: Record<FormStep, {
    isValid: boolean
    errors: string[]
    warnings: string[]
  }>
}

export interface FormStatistics {
  totalForms: number
  completedForms: number
  draftForms: number
  inProgressForms: number
  reviewedForms: number
  approvedForms: number
  averageCompletionTime: number
  stepCompletionRates: Record<FormStep, number>
  commonIssues: Array<{
    step: FormStep
    field: string
    issue: string
    count: number
  }>
}

export class MedicalFormManager {
  /**
   * Create a new medical form
   */
  static async createMedicalForm(
    consultationRequestId: string,
    parentId?: string,
    patientId?: string
  ): Promise<MedicalForm> {
    try {
      // Validate consultation request exists
      const consultationRequest = await db.consultationRequest.findUnique({
        where: { id: consultationRequestId },
        select: { id: true, status: true }
      })

      if (!consultationRequest) {
        throw new Error('Consultation request not found')
      }

      if (consultationRequest.status !== 'SCHEDULED' && consultationRequest.status !== 'PENDING') {
        throw new Error('Cannot create form for consultation request with status: ' + consultationRequest.status)
      }

      // Check if form already exists
      const existingForm = await db.medicalForm.findUnique({
        where: { consultationRequestId }
      })

      if (existingForm) {
        throw new Error('Medical form already exists for this consultation request')
      }

      // Create empty form with default values
      const formData = {
        consultationRequestId,
        parentId,
        patientId,
        status: 'DRAFT' as FormStatus,
        currentStep: 1,
        completedSteps: [],
        parentInfo: {},
        childInfo: {},
        medicalHistory: {},
        currentConcerns: {},
        familyInfo: {},
        goalsExpectations: {}
      }

      const form = await db.medicalForm.create({
        data: {
          consultationRequestId,
          parentId,
          patientId,
          status: 'DRAFT',
          currentStep: 1,
          completedSteps: [],
          parentInfo: JSON.stringify(formData.parentInfo),
          childInfo: JSON.stringify(formData.childInfo),
          medicalHistory: JSON.stringify(formData.medicalHistory),
          currentConcerns: JSON.stringify(formData.currentConcerns),
          familyInfo: JSON.stringify(formData.familyInfo),
          goalsExpectations: JSON.stringify(formData.goalsExpectations)
        }
      })

      return this.formatFormData(form)

    } catch (error) {
      console.error('Error creating medical form:', error)
      throw error
    }
  }

  /**
   * Get medical form by ID
   */
  static async getMedicalForm(formId: string): Promise<MedicalForm | null> {
    try {
      const form = await db.medicalForm.findUnique({
        where: { id: formId },
        include: {
          consultationRequest: {
            select: {
              id: true,
              status: true,
              patient: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
              parent: {
                select: {
                  firstName: true,
                  lastName: true
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
      console.error('Error getting medical form:', error)
      throw error
    }
  }

  /**
   * Get medical form by consultation request ID
   */
  static async getMedicalFormByConsultationRequest(consultationRequestId: string): Promise<MedicalForm | null> {
    try {
      const form = await db.medicalForm.findUnique({
        where: { consultationRequestId },
        include: {
          consultationRequest: {
            select: {
              id: true,
              status: true,
              patient: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
              parent: {
                select: {
                  firstName: true,
                  lastName: true
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
      console.error('Error getting medical form by consultation request:', error)
      throw error
    }
  }

  /**
   * Update medical form step
   */
  static async updateFormStep(
    formId: string,
    step: FormStep,
    stepData: any,
    userId?: string
  ): Promise<MedicalForm> {
    try {
      const form = await db.medicalForm.findUnique({
        where: { id: formId }
      })

      if (!form) {
        throw new Error('Medical form not found')
      }

      // Validate step data
      const stepSchema = stepSchemas[step]
      const validationResult = stepSchema.safeParse(stepData)

      if (!validationResult.success) {
        throw new Error(`Validation failed for step ${step}: ${validationResult.error.message}`)
      }

      // Update form data
      const updatedFormData = { ...this.parseFormData(form) }
      const stepKey = this.getStepKey(step)
      updatedFormData[stepKey] = validationResult.data

      // Update completed steps if this step is now complete
      const completedSteps = [...form.completedSteps]
      if (!completedSteps.includes(step)) {
        completedSteps.push(step)
      }

      // Update current step if this is the next step
      const currentStep = step > form.currentStep ? step : form.currentStep

      // Update status
      let status = form.status
      if (completedSteps.length === 6) {
        status = 'COMPLETED'
      } else if (completedSteps.length > 0) {
        status = 'IN_PROGRESS'
      }

      const updatedForm = await db.medicalForm.update({
        where: { id: formId },
        data: {
          [stepKey]: JSON.stringify(validationResult.data),
          currentStep,
          completedSteps,
          status,
          updatedAt: new Date(),
          completedAt: completedSteps.length === 6 ? new Date() : form.completedAt
        }
      })

      return this.formatFormData(updatedForm)

    } catch (error) {
      console.error('Error updating form step:', error)
      throw error
    }
  }

  /**
   * Auto-save form data
   */
  static async autoSaveForm(
    formId: string,
    currentStep: FormStep,
    stepData: any,
    completedSteps: number[]
  ): Promise<AutoSaveData> {
    try {
      const form = await db.medicalForm.findUnique({
        where: { id: formId }
      })

      if (!form) {
        throw new Error('Medical form not found')
      }

      // Update form with auto-save data (no validation)
      const stepKey = this.getStepKey(currentStep)
      const updatedFormData = { ...this.parseFormData(form) }
      updatedFormData[stepKey] = stepData

      await db.medicalForm.update({
        where: { id: formId },
        data: {
          [stepKey]: JSON.stringify(stepData),
          currentStep,
          completedSteps,
          status: 'DRAFT',
          updatedAt: new Date()
        }
      })

      return {
        formId,
        consultationRequestId: form.consultationRequestId,
        currentStep,
        completedSteps,
        data: stepData,
        status: 'DRAFT'
      }

    } catch (error) {
      console.error('Error auto-saving form:', error)
      throw error
    }
  }

  /**
   * Validate complete form
   */
  static async validateForm(formId: string): Promise<FormValidationResult> {
    try {
      const form = await db.medicalForm.findUnique({
        where: { id: formId }
      })

      if (!form) {
        throw new Error('Medical form not found')
      }

      const formData = this.parseFormData(form)
      const validationResult = medicalFormSchema.safeParse(formData)

      const errors: Record<string, string[]> = {}
      const warnings: Record<string, string[]> = {}
      const stepValidation: Record<FormStep, { isValid: boolean; errors: string[]; warnings: string[] }> = {
        1: { isValid: true, errors: [], warnings: [] },
        2: { isValid: true, errors: [], warnings: [] },
        3: { isValid: true, errors: [], warnings: [] },
        4: { isValid: true, errors: [], warnings: [] },
        5: { isValid: true, errors: [], warnings: [] },
        6: { isValid: true, errors: [], warnings: [] }
      }

      if (!validationResult.success) {
        // Parse validation errors by step
        validationResult.error.issues.forEach((error: any) => {
          const path = error.path.join('.')
          const step = this.getStepFromPath(path)
          
          if (step) {
            stepValidation[step].isValid = false
            stepValidation[step].errors.push(error.message)
          }
          
          errors[path] = errors[path] || []
          errors[path].push(error.message)
        })
      }

      // Add warnings for incomplete optional fields
      this.addWarnings(formData, warnings, stepValidation)

      return {
        isValid: validationResult.success,
        errors,
        warnings,
        stepValidation
      }

    } catch (error) {
      console.error('Error validating form:', error)
      throw error
    }
  }

  /**
   * Get form progress
   */
  static async getFormProgress(formId: string): Promise<FormProgress> {
    try {
      const form = await db.medicalForm.findUnique({
        where: { id: formId }
      })

      if (!form) {
        throw new Error('Medical form not found')
      }

      const progressPercentage = (form.completedSteps.length / 6) * 100
      const estimatedTimeRemaining = this.calculateEstimatedTimeRemaining(form)

      return {
        formId: form.id,
        currentStep: form.currentStep as FormStep,
        completedSteps: form.completedSteps,
        totalSteps: 6,
        progressPercentage,
        lastSavedAt: form.updatedAt,
        estimatedTimeRemaining
      }

    } catch (error) {
      console.error('Error getting form progress:', error)
      throw error
    }
  }

  /**
   * Submit form for review
   */
  static async submitFormForReview(formId: string, submittedBy: string): Promise<MedicalForm> {
    try {
      const form = await db.medicalForm.findUnique({
        where: { id: formId }
      })

      if (!form) {
        throw new Error('Medical form not found')
      }

      if (form.status !== 'COMPLETED') {
        throw new Error('Form must be completed before submission')
      }

      const updatedForm = await db.medicalForm.update({
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
   * Approve form
   */
  static async approveForm(
    formId: string,
    approvedBy: string,
    approvalNotes?: string
  ): Promise<MedicalForm> {
    try {
      const form = await db.medicalForm.findUnique({
        where: { id: formId }
      })

      if (!form) {
        throw new Error('Medical form not found')
      }

      if (form.status !== 'REVIEWED') {
        throw new Error('Form must be reviewed before approval')
      }

      const updatedForm = await db.medicalForm.update({
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
      console.error('Error approving form:', error)
      throw error
    }
  }

  /**
   * Get form statistics
   */
  static async getFormStatistics(dateRange?: { start: Date; end: Date }): Promise<FormStatistics> {
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
        db.medicalForm.count({ where: whereClause }),
        db.medicalForm.count({ where: { ...whereClause, status: 'COMPLETED' } }),
        db.medicalForm.count({ where: { ...whereClause, status: 'DRAFT' } }),
        db.medicalForm.count({ where: { ...whereClause, status: 'IN_PROGRESS' } }),
        db.medicalForm.count({ where: { ...whereClause, status: 'REVIEWED' } }),
        db.medicalForm.count({ where: { ...whereClause, status: 'APPROVED' } })
      ])

      // Calculate step completion rates
      const stepCompletionRates: Record<FormStep, number> = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
      }

      for (let step = 1; step <= 6; step++) {
        const stepCount = await db.medicalForm.count({
          where: {
            ...whereClause,
            completedSteps: { has: step }
          }
        })
        stepCompletionRates[step as FormStep] = totalForms > 0 ? (stepCount / totalForms) * 100 : 0
      }

      // Calculate average completion time
      const completedFormsWithTime = await db.medicalForm.findMany({
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

      // Get common issues (simplified implementation)
      const commonIssues = await this.getCommonIssues(whereClause)

      return {
        totalForms,
        completedForms,
        draftForms,
        inProgressForms,
        reviewedForms,
        approvedForms,
        averageCompletionTime,
        stepCompletionRates,
        commonIssues
      }

    } catch (error) {
      console.error('Error getting form statistics:', error)
      throw error
    }
  }

  /**
   * Delete medical form
   */
  static async deleteMedicalForm(formId: string): Promise<boolean> {
    try {
      const form = await db.medicalForm.findUnique({
        where: { id: formId }
      })

      if (!form) {
        throw new Error('Medical form not found')
      }

      if (form.status === 'APPROVED') {
        throw new Error('Cannot delete approved form')
      }

      await db.medicalForm.delete({
        where: { id: formId }
      })

      return true

    } catch (error) {
      console.error('Error deleting medical form:', error)
      throw error
    }
  }

  // Helper methods
  private static formatFormData(form: any): MedicalForm {
    return {
      formId: form.id,
      consultationRequestId: form.consultationRequestId,
      patientId: form.patientId,
      parentId: form.parentId,
      parentInfo: JSON.parse(form.parentInfo || '{}'),
      childInfo: JSON.parse(form.childInfo || '{}'),
      medicalHistory: JSON.parse(form.medicalHistory || '{}'),
      currentConcerns: JSON.parse(form.currentConcerns || '{}'),
      familyInfo: JSON.parse(form.familyInfo || '{}'),
      goalsExpectations: JSON.parse(form.goalsExpectations || '{}'),
      status: form.status,
      currentStep: form.currentStep,
      completedSteps: form.completedSteps,
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

  private static parseFormData(form: any): any {
    return {
      parentInfo: JSON.parse(form.parentInfo || '{}'),
      childInfo: JSON.parse(form.childInfo || '{}'),
      medicalHistory: JSON.parse(form.medicalHistory || '{}'),
      currentConcerns: JSON.parse(form.currentConcerns || '{}'),
      familyInfo: JSON.parse(form.familyInfo || '{}'),
      goalsExpectations: JSON.parse(form.goalsExpectations || '{}')
    }
  }

  private static getStepKey(step: FormStep): string {
    const stepKeys = {
      1: 'parentInfo',
      2: 'childInfo',
      3: 'medicalHistory',
      4: 'currentConcerns',
      5: 'familyInfo',
      6: 'goalsExpectations'
    }
    return stepKeys[step]
  }

  private static getStepFromPath(path: string): FormStep | null {
    if (path.startsWith('parentInfo')) return 1
    if (path.startsWith('childInfo')) return 2
    if (path.startsWith('medicalHistory')) return 3
    if (path.startsWith('currentConcerns')) return 4
    if (path.startsWith('familyInfo')) return 5
    if (path.startsWith('goalsExpectations')) return 6
    return null
  }

  private static addWarnings(
    formData: any,
    warnings: Record<string, string[]>,
    stepValidation: Record<FormStep, { isValid: boolean; errors: string[]; warnings: string[] }>
  ): void {
    // Add warnings for incomplete optional fields
    // This is a simplified implementation
    if (!formData.parentInfo.occupation) {
      stepValidation[1].warnings.push('Occupation is recommended for better assessment')
    }
    
    if (!formData.childInfo.allergies || formData.childInfo.allergies.length === 0) {
      stepValidation[2].warnings.push('Please confirm if child has any allergies')
    }
    
    if (!formData.medicalHistory.birthHistory.complications) {
      stepValidation[3].warnings.push('Birth complications information is recommended')
    }
    
    if (!formData.currentConcerns.previousInterventions || formData.currentConcerns.previousInterventions.length === 0) {
      stepValidation[4].warnings.push('Previous interventions information is helpful')
    }
    
    if (!formData.familyInfo.culturalBackground.religion) {
      stepValidation[5].warnings.push('Religious background information is recommended')
    }
    
    if (!formData.goalsExpectations.additionalInfo.questions) {
      stepValidation[6].warnings.push('Any additional questions or concerns?')
    }
  }

  private static calculateEstimatedTimeRemaining(form: any): number {
    // Calculate estimated time remaining based on completed steps
    const completedSteps = form.completedSteps.length
    const totalSteps = 6
    const remainingSteps = totalSteps - completedSteps
    
    // Average time per step (in minutes)
    const averageTimePerStep = 15
    
    return remainingSteps * averageTimePerStep
  }

  private static async getCommonIssues(whereClause: any): Promise<Array<{
    step: FormStep
    field: string
    issue: string
    count: number
  }>> {
    // This is a simplified implementation
    // In a real system, you would analyze form data for common validation issues
    return [
      { step: 1, field: 'email', issue: 'Invalid email format', count: 5 },
      { step: 2, field: 'dateOfBirth', issue: 'Future date not allowed', count: 3 },
      { step: 3, field: 'birthHistory', issue: 'Missing birth weight', count: 8 },
      { step: 4, field: 'primaryConcerns', issue: 'No concerns specified', count: 2 },
      { step: 5, field: 'familyStructure', issue: 'Missing primary caregivers', count: 4 },
      { step: 6, field: 'treatmentGoals', issue: 'No goals specified', count: 1 }
    ]
  }
}


