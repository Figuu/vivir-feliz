import { z } from 'zod'
import { 
  enhancedMedicalFormSchema,
  enhancedStepSchemas,
  enhancedAutoSaveSchema,
  enhancedFormProgressSchema,
  type EnhancedMedicalForm,
  type EnhancedAutoSaveData,
  type EnhancedFormProgress
} from './validations/medical-form-enhanced'

export interface MedicalFormDataStructure {
  // Core form data
  formData: EnhancedMedicalForm
  // Validation state
  validationState: {
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
  // Progress tracking
  progress: EnhancedFormProgress
  // Auto-save state
  autoSaveState: {
    isEnabled: boolean
    isActive: boolean
    lastSaved: Date | null
    nextSave: Date | null
    pendingChanges: boolean
    error: string | null
  }
  // Form metadata
  metadata: {
    formId: string
    consultationRequestId: string
    patientId?: string
    parentId?: string
    createdAt: Date
    updatedAt: Date
    version: number
    createdBy: string
    lastModifiedBy: string
  }
}

export interface StepData {
  stepNumber: number
  stepName: string
  data: any
  isValid: boolean
  errors: string[]
  warnings: string[]
  completedAt?: Date
  required: boolean
  optional: boolean
}

export interface FormValidationResult {
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
  validationTime: number
}

export interface FormProgressData {
  currentStep: number
  completedSteps: number[]
  totalSteps: number
  progressPercentage: number
  estimatedTimeRemaining: number
  lastSavedAt: Date
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED' | 'APPROVED'
}

export class MedicalFormDataStructureManager {
  private formData: EnhancedMedicalForm
  private validationState: FormValidationResult
  private progress: FormProgressData
  private autoSaveState: any
  private metadata: any

  constructor(
    consultationRequestId: string,
    formId?: string,
    patientId?: string,
    parentId?: string
  ) {
    this.formData = this.initializeFormData(consultationRequestId, formId, patientId, parentId)
    this.validationState = this.initializeValidationState()
    this.progress = this.initializeProgress()
    this.autoSaveState = this.initializeAutoSaveState()
    this.metadata = this.initializeMetadata(consultationRequestId, formId, patientId, parentId)
  }

  /**
   * Initialize form data structure
   */
  private initializeFormData(
    consultationRequestId: string,
    formId?: string,
    patientId?: string,
    parentId?: string
  ): EnhancedMedicalForm {
    return {
      formId: formId || crypto.randomUUID(),
      consultationRequestId,
      patientId,
      parentId,
      parentInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: 'PREFER_NOT_TO_SAY',
        maritalStatus: 'OTHER',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'United States'
        },
        emergencyContact: {
          name: '',
          relationship: '',
          phone: '',
          email: ''
        },
        medicalInfo: {
          allergies: [],
          medications: [],
          medicalConditions: [],
          insuranceInfo: {}
        },
        occupation: '',
        employer: '',
        preferredLanguage: 'English',
        howDidYouHearAboutUs: '',
        consent: {
          dataCollection: false,
          treatmentAuthorization: false,
          emergencyTreatment: false,
          communicationPreferences: {
            email: true,
            phone: true,
            sms: false,
            mail: false
          },
          marketingConsent: false,
          researchParticipation: false
        }
      },
      childInfo: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'PREFER_NOT_TO_SAY',
        placeOfBirth: '',
        physicalInfo: {
          blockSize: 0,
          weight: 0,
          bloodType: 'UNKNOWN',
          eyeColor: '',
          hairColor: '',
          distinguishingMarks: ''
        },
        school: {
          name: '',
          grade: '',
          teacherName: '',
          schoolPhone: '',
          schoolAddress: {
            street: '',
            city: '',
            state: '',
            zipCode: ''
          },
          iep504: false,
          accommodations: '',
          specialServices: []
        },
        siblings: [],
        medicalInfo: {
          allergies: [],
          medications: [],
          medicalConditions: [],
          immunizations: []
        },
        preferredName: '',
        nickname: '',
        specialNeeds: '',
        dietaryRestrictions: []
      },
      medicalHistory: {
        birthHistory: {
          gestationalAge: undefined,
          birthWeight: undefined,
          birthLength: undefined,
          deliveryMethod: undefined,
          complications: '',
          apgarScore: {
            oneMinute: undefined,
            fiveMinute: undefined
          },
          birthLocation: '',
          attendingPhysician: ''
        },
        developmentalMilestones: {
          firstSmile: '',
          firstSit: '',
          firstCrawl: '',
          firstWalk: '',
          firstWords: '',
          toiletTraining: '',
          concerns: '',
          delays: []
        },
        medicalConditions: {
          currentConditions: [],
          pastConditions: [],
          hospitalizations: [],
          surgeries: []
        },
        familyHistory: {
          mentalHealthConditions: [],
          physicalConditions: [],
          geneticConditions: [],
          substanceAbuse: [],
          other: ''
        }
      },
      currentConcerns: {
        primaryConcerns: [],
        behavioralConcerns: {
          aggression: {
            present: false,
            frequency: undefined,
            triggers: '',
            description: '',
            severity: undefined,
            targets: []
          },
          anxiety: {
            present: false,
            frequency: undefined,
            triggers: '',
            description: '',
            severity: undefined,
            symptoms: []
          },
          depression: {
            present: false,
            frequency: undefined,
            triggers: '',
            description: '',
            severity: undefined,
            symptoms: []
          },
          attentionIssues: {
            present: false,
            frequency: undefined,
            triggers: '',
            description: '',
            severity: undefined,
            impact: undefined
          },
          sleepIssues: {
            present: false,
            frequency: undefined,
            triggers: '',
            description: '',
            severity: undefined,
            duration: ''
          },
          eatingIssues: {
            present: false,
            frequency: undefined,
            triggers: '',
            description: '',
            severity: undefined,
            type: undefined
          },
          socialIssues: {
            present: false,
            frequency: undefined,
            triggers: '',
            description: '',
            severity: undefined,
            impact: undefined
          },
          other: ''
        },
        academicPerformance: {
          currentGrade: '',
          subjects: [],
          attendance: undefined,
          homework: undefined,
          teacherConcerns: '',
          iep504: false,
          accommodations: '',
          specialServices: []
        },
        previousInterventions: []
      },
      familyInfo: {
        familyStructure: {
          livingArrangement: 'OTHER',
          primaryCaregivers: [],
          otherAdults: [],
          pets: []
        },
        familyDynamics: {
          communication: 'FAIR',
          conflictResolution: 'FAIR',
          discipline: 'SOMEWHAT_CONSISTENT',
          routines: 'FLEXIBLE',
          stressLevel: 'MODERATE',
          supportSystem: 'MODERATE',
          challenges: '',
          strengths: '',
          recentChanges: []
        },
        parentInfo: {
          education: undefined,
          employment: undefined,
          income: undefined,
          healthInsurance: undefined,
          mentalHealthHistory: [],
          substanceUse: undefined,
          criminalHistory: false,
          domesticViolence: false,
          notes: ''
        },
        culturalBackground: {
          ethnicity: '',
          religion: '',
          language: 'English',
          culturalPractices: '',
          religiousPractices: '',
          dietaryRestrictions: [],
          culturalConsiderations: ''
        }
      },
      goalsExpectations: {
        treatmentGoals: [],
        parentExpectations: {
          therapyDuration: 'UNSURE',
          sessionFrequency: 'WEEKLY',
          parentInvolvement: 'MODERATE',
          communication: 'REGULAR',
          homework: false,
          familySessions: false,
          groupTherapy: false,
          expectations: '',
          concerns: '',
          previousExperience: '',
          specificRequests: ''
        },
        childPreferences: {
          therapistGender: undefined,
          sessionTime: undefined,
          sessionLength: undefined,
          therapyType: [],
          specialRequests: '',
          fears: [],
          interests: []
        },
        additionalInfo: {
          transportation: undefined,
          schedulingConstraints: '',
          financialConcerns: '',
          otherServices: [],
          questions: '',
          emergencyContacts: []
        }
      },
      status: 'DRAFT',
      currentStep: 1,
      completedSteps: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: undefined,
      reviewedAt: undefined,
      approvedAt: undefined,
      reviewedBy: undefined,
      approvedBy: undefined,
      reviewNotes: '',
      approvalNotes: '',
      validationState: undefined
    }
  }

  /**
   * Initialize validation state
   */
  private initializeValidationState(): FormValidationResult {
    return {
      isValid: false,
      errors: {},
      warnings: {},
      stepValidation: {},
      lastValidatedAt: new Date(),
      validationTime: 0
    }
  }

  /**
   * Initialize progress tracking
   */
  private initializeProgress(): FormProgressData {
    return {
      currentStep: 1,
      completedSteps: [],
      totalSteps: 6,
      progressPercentage: 0,
      estimatedTimeRemaining: 90, // 90 minutes estimated
      lastSavedAt: new Date(),
      status: 'DRAFT'
    }
  }

  /**
   * Initialize auto-save state
   */
  private initializeAutoSaveState() {
    return {
      isEnabled: true,
      isActive: false,
      lastSaved: null,
      nextSave: null,
      pendingChanges: false,
      error: null
    }
  }

  /**
   * Initialize metadata
   */
  private initializeMetadata(
    consultationRequestId: string,
    formId?: string,
    patientId?: string,
    parentId?: string
  ) {
    return {
      formId: formId || crypto.randomUUID(),
      consultationRequestId,
      patientId,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      createdBy: 'system',
      lastModifiedBy: 'system'
    }
  }

  /**
   * Update form data for a specific step
   */
  updateStepData(stepNumber: number, data: any): boolean {
    try {
      const stepSchema = enhancedStepSchemas[stepNumber as keyof typeof enhancedStepSchemas]
      if (!stepSchema) {
        throw new Error(`Invalid step number: ${stepNumber}`)
      }

      // Validate step data
      const validationResult = stepSchema.safeParse(data)
      if (!validationResult.success) {
        console.error('Step validation failed:', validationResult.error)
        return false
      }

      // Update form data based on step
      switch (stepNumber) {
        case 1:
          this.formData.parentInfo = validationResult.data as any
          break
        case 2:
          this.formData.childInfo = validationResult.data as any
          break
        case 3:
          this.formData.medicalHistory = validationResult.data as any
          break
        case 4:
          this.formData.currentConcerns = validationResult.data as any
          break
        case 5:
          this.formData.familyInfo = validationResult.data as any
          break
        case 6:
          this.formData.goalsExpectations = validationResult.data as any
          break
        default:
          throw new Error(`Invalid step number: ${stepNumber}`)
      }

      // Update metadata
      this.metadata.updatedAt = new Date()
      this.metadata.lastModifiedBy = 'user'
      this.metadata.version++

      // Update progress
      this.updateProgress(stepNumber)

      // Validate the updated form
      this.validateForm()

      return true
    } catch (error) {
      console.error('Error updating step data:', error)
      return false
    }
  }

  /**
   * Get step data
   */
  getStepData(stepNumber: number): StepData | null {
    try {
      let data: any
      let stepName: string

      switch (stepNumber) {
        case 1:
          data = this.formData.parentInfo
          stepName = 'Parent Information'
          break
        case 2:
          data = this.formData.childInfo
          stepName = 'Child Information'
          break
        case 3:
          data = this.formData.medicalHistory
          stepName = 'Medical History'
          break
        case 4:
          data = this.formData.currentConcerns
          stepName = 'Current Concerns'
          break
        case 5:
          data = this.formData.familyInfo
          stepName = 'Family Information'
          break
        case 6:
          data = this.formData.goalsExpectations
          stepName = 'Goals & Expectations'
          break
        default:
          return null
      }

      const stepValidation = this.validationState.stepValidation[stepNumber] || {
        isValid: false,
        errors: [],
        warnings: [],
        completedAt: undefined
      }

      return {
        stepNumber,
        stepName,
        data,
        isValid: stepValidation.isValid,
        errors: stepValidation.errors,
        warnings: stepValidation.warnings,
        completedAt: stepValidation.completedAt,
        required: true,
        optional: false
      }
    } catch (error) {
      console.error('Error getting step data:', error)
      return null
    }
  }

  /**
   * Validate the entire form
   */
  validateForm(): FormValidationResult {
    const startTime = Date.now()

    try {
      const validationResult = enhancedMedicalFormSchema.safeParse(this.formData)
      
      const result: FormValidationResult = {
        isValid: validationResult.success,
        errors: {},
        warnings: {},
        stepValidation: {},
        lastValidatedAt: new Date(),
        validationTime: Date.now() - startTime
      }

      if (!validationResult.success) {
        // Process validation errors
        const errors = validationResult.error.flatten().fieldErrors
        result.errors = errors

        // Map errors to steps
        for (const [field, fieldErrors] of Object.entries(errors)) {
          const stepNumber = this.getStepNumberForField(field)
          if (stepNumber) {
            if (!result.stepValidation[stepNumber]) {
              result.stepValidation[stepNumber] = {
                isValid: false,
                errors: [],
                warnings: []
              }
            }
            result.stepValidation[stepNumber].errors.push(...fieldErrors)
          }
        }
      } else {
        // Form is valid, mark all steps as valid
        for (let i = 1; i <= 6; i++) {
          result.stepValidation[i] = {
            isValid: true,
            errors: [],
            warnings: [],
            completedAt: this.progress.completedSteps.includes(i) ? new Date() : undefined
          }
        }
      }

      // Update validation state
      this.validationState = result
      this.formData.validationState = {
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
        stepValidation: result.stepValidation,
        lastValidatedAt: result.lastValidatedAt
      }

      return result
    } catch (error) {
      console.error('Error validating form:', error)
      return {
        isValid: false,
        errors: { general: ['Validation error occurred'] },
        warnings: {},
        stepValidation: {},
        lastValidatedAt: new Date(),
        validationTime: Date.now() - startTime
      }
    }
  }

  /**
   * Update progress tracking
   */
  private updateProgress(stepNumber: number): void {
    // Update current step
    this.progress.currentStep = stepNumber

    // Add to completed steps if not already there
    if (!this.progress.completedSteps.includes(stepNumber)) {
      this.progress.completedSteps.push(stepNumber)
    }

    // Calculate progress percentage
    this.progress.progressPercentage = (this.progress.completedSteps.length / this.progress.totalSteps) * 100

    // Update estimated time remaining
    const remainingSteps = this.progress.totalSteps - this.progress.completedSteps.length
    this.progress.estimatedTimeRemaining = remainingSteps * 15 // 15 minutes per step

    // Update status
    if (this.progress.completedSteps.length === this.progress.totalSteps) {
      this.progress.status = 'COMPLETED'
      this.formData.completedAt = new Date()
    } else if (this.progress.completedSteps.length > 0) {
      this.progress.status = 'IN_PROGRESS'
    }

    // Update last saved
    this.progress.lastSavedAt = new Date()
  }

  /**
   * Get step number for a field
   */
  private getStepNumberForField(field: string): number | null {
    const fieldStepMap: Record<string, number> = {
      'parentInfo': 1,
      'childInfo': 2,
      'medicalHistory': 3,
      'currentConcerns': 4,
      'familyInfo': 5,
      'goalsExpectations': 6
    }

    const rootField = field.split('.')[0]
    return fieldStepMap[rootField] || null
  }

  /**
   * Get complete form data structure
   */
  getFormDataStructure(): MedicalFormDataStructure {
    return {
      formData: this.formData,
      validationState: this.validationState,
      progress: {
        formId: this.formData.formId!,
        currentStep: this.progress.currentStep,
        completedSteps: this.progress.completedSteps,
        totalSteps: this.progress.totalSteps,
        progressPercentage: this.progress.progressPercentage,
        lastSavedAt: this.progress.lastSavedAt,
        validationState: this.validationState,
        estimatedTimeRemaining: this.progress.estimatedTimeRemaining
      },
      autoSaveState: this.autoSaveState,
      metadata: this.metadata
    }
  }

  /**
   * Get form data for auto-save
   */
  getAutoSaveData(): EnhancedAutoSaveData {
    return {
      formId: this.formData.formId,
      consultationRequestId: this.formData.consultationRequestId,
      currentStep: this.progress.currentStep,
      completedSteps: this.progress.completedSteps,
      data: this.formData,
      status: this.progress.status as 'DRAFT' | 'IN_PROGRESS',
      validationState: this.validationState
    }
  }

  /**
   * Get form progress data
   */
  getFormProgress(): EnhancedFormProgress {
    return {
      formId: this.formData.formId!,
      currentStep: this.progress.currentStep,
      completedSteps: this.progress.completedSteps,
      totalSteps: this.progress.totalSteps,
      progressPercentage: this.progress.progressPercentage,
      lastSavedAt: this.progress.lastSavedAt,
      estimatedTimeRemaining: this.progress.estimatedTimeRemaining,
      validationState: this.validationState
    }
  }

  /**
   * Reset form data
   */
  resetForm(): void {
    this.formData = this.initializeFormData(
      this.formData.consultationRequestId,
      this.formData.formId,
      this.formData.patientId,
      this.formData.parentId
    )
    this.validationState = this.initializeValidationState()
    this.progress = this.initializeProgress()
    this.autoSaveState = this.initializeAutoSaveState()
    this.metadata = this.initializeMetadata(
      this.formData.consultationRequestId,
      this.formData.formId,
      this.formData.patientId,
      this.formData.parentId
    )
  }

  /**
   * Export form data
   */
  exportFormData(): string {
    return JSON.stringify(this.getFormDataStructure(), null, 2)
  }

  /**
   * Import form data
   */
  importFormData(data: string): boolean {
    try {
      const importedData = JSON.parse(data)
      const validationResult = enhancedMedicalFormSchema.safeParse(importedData.formData)
      
      if (!validationResult.success) {
        console.error('Imported data validation failed:', validationResult.error)
        return false
      }

      this.formData = validationResult.data
      this.validationState = importedData.validationState || this.initializeValidationState()
      this.progress = importedData.progress || this.initializeProgress()
      this.autoSaveState = importedData.autoSaveState || this.initializeAutoSaveState()
      this.metadata = importedData.metadata || this.initializeMetadata(
        this.formData.consultationRequestId,
        this.formData.formId,
        this.formData.patientId,
        this.formData.parentId
      )

      return true
    } catch (error) {
      console.error('Error importing form data:', error)
      return false
    }
  }
}
