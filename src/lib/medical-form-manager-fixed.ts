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
          patientId,
          filledByParent: true,
          filledByTherapist: false,
          isCompleted: false,
          // Store form data in JSON fields
          birthComplications: JSON.stringify({}),
          developmentalMilestones: {},
          medicalConditions: JSON.stringify({}),
          allergies: JSON.stringify({}),
          currentMedications: JSON.stringify({}),
          previousSurgeries: JSON.stringify({}),
          familyMedicalHistory: JSON.stringify({}),
          familyStructure: JSON.stringify({}),
          familyDynamics: JSON.stringify({}),
          parentalConcerns: JSON.stringify({}),
          behavioralConcerns: JSON.stringify({}),
          socialSkills: JSON.stringify({}),
          communicationSkills: JSON.stringify({}),
          learningDifficulties: JSON.stringify({}),
          academicPerformance: JSON.stringify({}),
          schoolBehavior: JSON.stringify({}),
          teacherReports: JSON.stringify({}),
          sleepPatterns: JSON.stringify({}),
          eatingHabits: JSON.stringify({}),
          dailyRoutines: JSON.stringify({}),
          stressFactors: JSON.stringify({})
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

      // Map step data to database fields
      const updateData = this.mapStepDataToDbFields(step, validationResult.data)

      // Update form
      const updatedForm = await db.medicalForm.update({
        where: { id: formId },
        data: {
          ...updateData,
          updatedAt: new Date(),
          isCompleted: step === 6 // Mark as completed when last step is updated
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

      // Map step data to database fields (no validation for auto-save)
      const updateData = this.mapStepDataToDbFields(currentStep, stepData)

      await db.medicalForm.update({
        where: { id: formId },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      })

      return {
        formId,
        consultationRequestId: form.consultationRequestId!,
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
        validationResult.error.errors.forEach(error => {
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

      // Calculate progress based on completed fields
      const progressPercentage = this.calculateProgressPercentage(form)
      const estimatedTimeRemaining = this.calculateEstimatedTimeRemaining(form)

      return {
        formId: form.id,
        currentStep: 1, // Default step
        completedSteps: [], // Would need to track this separately
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

      if (!form.isCompleted) {
        throw new Error('Form must be completed before submission')
      }

      const updatedForm = await db.medicalForm.update({
        where: { id: formId },
        data: {
          isCompleted: true,
          completedAt: new Date(),
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

      if (!form.isCompleted) {
        throw new Error('Form must be completed before approval')
      }

      const updatedForm = await db.medicalForm.update({
        where: { id: formId },
        data: {
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
        draftForms
      ] = await Promise.all([
        db.medicalForm.count({ where: whereClause }),
        db.medicalForm.count({ where: { ...whereClause, isCompleted: true } }),
        db.medicalForm.count({ where: { ...whereClause, isCompleted: false } })
      ])

      // Calculate step completion rates (simplified)
      const stepCompletionRates: Record<FormStep, number> = {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
      }

      // Calculate average completion time
      const completedFormsWithTime = await db.medicalForm.findMany({
        where: {
          ...whereClause,
          isCompleted: true,
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
        inProgressForms: 0, // Not tracked in current schema
        reviewedForms: 0, // Not tracked in current schema
        approvedForms: 0, // Not tracked in current schema
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

      await db.medicalForm.delete({
        where: { id: formId }
      })

      return true

    } catch (error) {
      console.error('Error deleting medical form:', error)
      throw error
    }
  }

  /**
   * List medical forms with pagination and filtering
   */
  static async listMedicalForms(params: {
    consultationRequestId?: string
    parentId?: string
    patientId?: string
    status?: string
    startDate?: Date
    endDate?: Date
    page?: number
    limit?: number
  }): Promise<{
    forms: MedicalForm[]
    totalCount: number
    pagination: {
      page: number
      limit: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }> {
    try {
      const {
        consultationRequestId,
        parentId,
        patientId,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 20
      } = params

      const whereClause: any = {}

      if (consultationRequestId) {
        whereClause.consultationRequestId = consultationRequestId
      }

      if (parentId) {
        whereClause.consultationRequest = {
          parentId
        }
      }

      if (patientId) {
        whereClause.patientId = patientId
      }

      if (status) {
        if (status === 'COMPLETED') {
          whereClause.isCompleted = true
        } else if (status === 'DRAFT') {
          whereClause.isCompleted = false
        }
      }

      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: startDate,
          lte: endDate
        }
      }

      const [forms, totalCount] = await Promise.all([
        db.medicalForm.findMany({
          where: whereClause,
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
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        db.medicalForm.count({ where: whereClause })
      ])

      const formattedForms = forms.map(form => this.formatFormData(form))

      return {
        forms: formattedForms,
        totalCount,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        }
      }

    } catch (error) {
      console.error('Error listing medical forms:', error)
      throw error
    }
  }

  // Helper methods
  private static formatFormData(form: any): MedicalForm {
    return {
      formId: form.id,
      consultationRequestId: form.consultationRequestId,
      patientId: form.patientId,
      parentId: form.consultationRequest?.parent?.id,
      parentInfo: this.parseJsonField(form.birthComplications) || {},
      childInfo: this.parseJsonField(form.developmentalMilestones) || {},
      medicalHistory: this.parseJsonField(form.medicalConditions) || {},
      currentConcerns: this.parseJsonField(form.behavioralConcerns) || {},
      familyInfo: this.parseJsonField(form.familyStructure) || {},
      goalsExpectations: this.parseJsonField(form.parentalConcerns) || {},
      status: form.isCompleted ? 'COMPLETED' : 'DRAFT',
      currentStep: 1,
      completedSteps: [],
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      completedAt: form.completedAt,
      reviewedAt: null,
      approvedAt: null,
      reviewedBy: null,
      approvedBy: null,
      reviewNotes: null,
      approvalNotes: null
    }
  }

  private static parseFormData(form: any): any {
    return {
      parentInfo: this.parseJsonField(form.birthComplications) || {},
      childInfo: this.parseJsonField(form.developmentalMilestones) || {},
      medicalHistory: this.parseJsonField(form.medicalConditions) || {},
      currentConcerns: this.parseJsonField(form.behavioralConcerns) || {},
      familyInfo: this.parseJsonField(form.familyStructure) || {},
      goalsExpectations: this.parseJsonField(form.parentalConcerns) || {}
    }
  }

  private static parseJsonField(field: any): any {
    if (!field) return null
    if (typeof field === 'string') {
      try {
        return JSON.parse(field)
      } catch {
        return null
      }
    }
    return field
  }

  private static mapStepDataToDbFields(step: FormStep, stepData: any): any {
    const updateData: any = {}

    switch (step) {
      case 1: // Parent Info
        updateData.birthComplications = JSON.stringify(stepData)
        break
      case 2: // Child Info
        updateData.developmentalMilestones = stepData
        break
      case 3: // Medical History
        updateData.medicalConditions = JSON.stringify(stepData)
        break
      case 4: // Current Concerns
        updateData.behavioralConcerns = JSON.stringify(stepData)
        break
      case 5: // Family Info
        updateData.familyStructure = JSON.stringify(stepData)
        break
      case 6: // Goals & Expectations
        updateData.parentalConcerns = JSON.stringify(stepData)
        break
    }

    return updateData
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
    if (!formData.parentInfo?.occupation) {
      stepValidation[1].warnings.push('Occupation is recommended for better assessment')
    }
    
    if (!formData.childInfo?.allergies || formData.childInfo.allergies.length === 0) {
      stepValidation[2].warnings.push('Please confirm if child has any allergies')
    }
    
    if (!formData.medicalHistory?.birthHistory?.complications) {
      stepValidation[3].warnings.push('Birth complications information is recommended')
    }
    
    if (!formData.currentConcerns?.previousInterventions || formData.currentConcerns.previousInterventions.length === 0) {
      stepValidation[4].warnings.push('Previous interventions information is helpful')
    }
    
    if (!formData.familyInfo?.culturalBackground?.religion) {
      stepValidation[5].warnings.push('Religious background information is recommended')
    }
    
    if (!formData.goalsExpectations?.additionalInfo?.questions) {
      stepValidation[6].warnings.push('Any additional questions or concerns?')
    }
  }

  private static calculateProgressPercentage(form: any): number {
    // Calculate progress based on filled fields
    const fields = [
      form.birthComplications,
      form.developmentalMilestones,
      form.medicalConditions,
      form.behavioralConcerns,
      form.familyStructure,
      form.parentalConcerns
    ]

    const filledFields = fields.filter(field => {
      if (!field) return false
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field)
          return Object.keys(parsed).length > 0
        } catch {
          return false
        }
      }
      return Object.keys(field).length > 0
    }).length

    return (filledFields / fields.length) * 100
  }

  private static calculateEstimatedTimeRemaining(form: any): number {
    // Calculate estimated time remaining based on completed fields
    const progressPercentage = this.calculateProgressPercentage(form)
    const remainingPercentage = 100 - progressPercentage
    
    // Average time per step (in minutes)
    const averageTimePerStep = 15
    const remainingSteps = Math.ceil(remainingPercentage / (100 / 6))
    
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
