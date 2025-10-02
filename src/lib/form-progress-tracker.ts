export type FormType = 'MEDICAL_FORM' | 'THERAPIST_FORM'

export interface ValidationState {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  stepValidation: Record<number, {
    isValid: boolean
    errors: string[]
    warnings: string[]
    completedAt?: Date
  }>
  lastValidatedAt: Date
}

export interface FormProgress {
  id: string
  formType: FormType
  formId: string
  userId: string
  currentStep: number
  completedSteps: number[]
  totalSteps: number
  validationState: ValidationState
  progressPercentage: number
  lastSavedAt: Date
  createdAt: Date
  updatedAt: Date
}

export class FormProgressTracker {
  static async initializeProgress(
    formId: string,
    totalSteps: number
  ): Promise<FormProgress> {
    // Mock implementation - replace with actual database operations
    return {
      id: `progress_${Date.now()}`,
      formType: 'MEDICAL_FORM',
      formId,
      userId: 'user_123',
      currentStep: 1,
      completedSteps: [],
      totalSteps,
      validationState: {
        isValid: false,
        errors: {},
        warnings: {},
        stepValidation: {},
        lastValidatedAt: new Date()
      },
      progressPercentage: 0,
      lastSavedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  static async getProgress(
    formType: FormType,
    formId: string,
    userId: string
  ): Promise<FormProgress | null> {
    // Mock implementation - replace with actual database operations
    return null
  }

  static async updateProgress(
    formType: FormType,
    formId: string,
    userId: string,
    currentStep: number,
    completedSteps: number[],
    validationState: ValidationState
  ): Promise<FormProgress> {
    // Mock implementation - replace with actual database operations
    return {
      id: `progress_${Date.now()}`,
      formType,
      formId,
      userId,
      currentStep,
      completedSteps,
      totalSteps: 6,
      validationState,
      progressPercentage: (completedSteps.length / 6) * 100,
      lastSavedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  static async autoSaveProgress(
    formType: FormType,
    formId: string,
    userId: string,
    currentStep: number,
    completedSteps: number[],
    validationState: ValidationState
  ): Promise<FormProgress> {
    // Mock implementation - replace with actual database operations
    return this.updateProgress(formType, formId, userId, currentStep, completedSteps, validationState)
  }

  static async resetProgress(
    formType: FormType,
    formId: string,
    userId: string
  ): Promise<FormProgress> {
    // Mock implementation - replace with actual database operations
    return {
      id: `progress_${Date.now()}`,
      formType,
      formId,
      userId,
      currentStep: 1,
      completedSteps: [],
      totalSteps: 6,
      validationState: {
        isValid: false,
        errors: {},
        warnings: {},
        stepValidation: {},
        lastValidatedAt: new Date()
      },
      progressPercentage: 0,
      lastSavedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  static async deleteProgress(
    formType: FormType,
    formId: string,
    userId: string
  ): Promise<boolean> {
    // Mock implementation - replace with actual database operations
    return true
  }
}