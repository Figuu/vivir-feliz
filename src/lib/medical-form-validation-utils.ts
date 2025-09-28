import { z } from 'zod'
import { 
  enhancedMedicalFormSchema,
  enhancedStepSchemas,
  type EnhancedMedicalForm,
  type EnhancedParentInfo,
  type EnhancedChildInfo,
  type EnhancedMedicalHistory,
  type EnhancedCurrentConcerns,
  type EnhancedFamilyInfo,
  type EnhancedGoalsExpectations
} from './validations/medical-form-enhanced'

export interface ValidationRule {
  field: string
  rule: string
  message: string
  severity: 'error' | 'warning' | 'info'
  condition?: (data: any) => boolean
}

export interface ValidationContext {
  formData: EnhancedMedicalForm
  stepNumber: number
  fieldPath: string
  currentValue: any
  previousValue?: any
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  info: Record<string, string[]>
  suggestions: Record<string, string[]>
  validationTime: number
  validatedAt: Date
}

export interface FieldValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
  suggestions: string[]
  fieldPath: string
  fieldType: string
  validationRules: ValidationRule[]
}

export class MedicalFormValidationUtils {
  private static validationRules: ValidationRule[] = [
    // Name validation rules
    {
      field: 'firstName',
      rule: 'required',
      message: 'First name is required',
      severity: 'error'
    },
    {
      field: 'firstName',
      rule: 'minLength',
      message: 'First name must be at least 2 characters',
      severity: 'error',
      condition: (data) => data.firstName && data.firstName.length < 2
    },
    {
      field: 'firstName',
      rule: 'maxLength',
      message: 'First name cannot exceed 50 characters',
      severity: 'error',
      condition: (data) => data.firstName && data.firstName.length > 50
    },
    {
      field: 'firstName',
      rule: 'format',
      message: 'First name can only contain letters, spaces, hyphens, and apostrophes',
      severity: 'error',
      condition: (data) => data.firstName && !/^[A-Za-zÀ-ÿ\s'-]+$/.test(data.firstName)
    },

    // Email validation rules
    {
      field: 'email',
      rule: 'required',
      message: 'Email is required',
      severity: 'error'
    },
    {
      field: 'email',
      rule: 'format',
      message: 'Invalid email format',
      severity: 'error',
      condition: (data) => data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    },
    {
      field: 'email',
      rule: 'domain',
      message: 'Please use a valid email address',
      severity: 'warning',
      condition: (data) => {
        if (!data.email) return false
        const domain = data.email.split('@')[1]
        const medicalDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com']
        return !medicalDomains.includes(domain) && !domain.includes('.edu') && !domain.includes('.gov')
      }
    },

    // Phone validation rules
    {
      field: 'phone',
      rule: 'required',
      message: 'Phone number is required',
      severity: 'error'
    },
    {
      field: 'phone',
      rule: 'format',
      message: 'Invalid phone number format',
      severity: 'error',
      condition: (data) => data.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.replace(/\D/g, ''))
    },

    // Date validation rules
    {
      field: 'dateOfBirth',
      rule: 'required',
      message: 'Date of birth is required',
      severity: 'error'
    },
    {
      field: 'dateOfBirth',
      rule: 'format',
      message: 'Date must be in YYYY-MM-DD format',
      severity: 'error',
      condition: (data) => data.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(data.dateOfBirth)
    },
    {
      field: 'dateOfBirth',
      rule: 'range',
      message: 'Date must be between 1900 and today',
      severity: 'error',
      condition: (data) => {
        if (!data.dateOfBirth) return false
        const date = new Date(data.dateOfBirth)
        const today = new Date()
        const minDate = new Date('1900-01-01')
        return date < minDate || date > today
      }
    },

    // Age validation rules
    {
      field: 'age',
      rule: 'range',
      message: 'Age must be between 0 and 120 years',
      severity: 'error',
      condition: (data) => data.age && (data.age < 0 || data.age > 120)
    },

    // Weight validation rules
    {
      field: 'weight',
      rule: 'range',
      message: 'Weight must be between 0.1 and 1000 kg',
      severity: 'error',
      condition: (data) => data.weight && (data.weight < 0.1 || data.weight > 1000)
    },
    {
      field: 'weight',
      rule: 'precision',
      message: 'Weight must have at most 1 decimal place',
      severity: 'warning',
      condition: (data) => data.weight && data.weight.toString().split('.')[1]?.length > 1
    },

    // Height validation rules
    {
      field: 'height',
      rule: 'range',
      message: 'Height must be between 10 and 300 cm',
      severity: 'error',
      condition: (data) => data.height && (data.height < 10 || data.height > 300)
    },
    {
      field: 'height',
      rule: 'precision',
      message: 'Height must have at most 1 decimal place',
      severity: 'warning',
      condition: (data) => data.height && data.height.toString().split('.')[1]?.length > 1
    },

    // Medical term validation rules
    {
      field: 'medicalTerm',
      rule: 'format',
      message: 'Medical term contains invalid characters',
      severity: 'error',
      condition: (data) => data.medicalTerm && !/^[A-Za-zÀ-ÿ\s\-\.\(\)\/\d]+$/.test(data.medicalTerm)
    },

    // Diagnosis validation rules
    {
      field: 'diagnosis',
      rule: 'format',
      message: 'Diagnosis contains invalid characters',
      severity: 'error',
      condition: (data) => data.diagnosis && !/^[A-Za-zÀ-ÿ\s\-\.\(\)\/\d,]+$/.test(data.diagnosis)
    },

    // Medication validation rules
    {
      field: 'medication',
      rule: 'format',
      message: 'Medication name contains invalid characters',
      severity: 'error',
      condition: (data) => data.medication && !/^[A-Za-zÀ-ÿ\s\-\.\(\)\/\d]+$/.test(data.medication)
    },

    // Dosage validation rules
    {
      field: 'dosage',
      rule: 'format',
      message: 'Invalid dosage format',
      severity: 'error',
      condition: (data) => data.dosage && !/^[\d\.\-\/\s]+[A-Za-z]*$/.test(data.dosage)
    },

    // Frequency validation rules
    {
      field: 'frequency',
      rule: 'format',
      message: 'Invalid frequency format',
      severity: 'error',
      condition: (data) => data.frequency && !/^[\d\s]+[A-Za-z\s]*$/.test(data.frequency)
    },

    // ZIP code validation rules
    {
      field: 'zipCode',
      rule: 'format',
      message: 'Invalid ZIP code format',
      severity: 'error',
      condition: (data) => data.zipCode && !/^\d{5}(-\d{4})?$/.test(data.zipCode)
    },

    // Consent validation rules
    {
      field: 'consent.dataCollection',
      rule: 'required',
      message: 'Data collection consent is required',
      severity: 'error',
      condition: (data) => data.consent && data.consent.dataCollection !== true
    },
    {
      field: 'consent.treatmentAuthorization',
      rule: 'required',
      message: 'Treatment authorization is required',
      severity: 'error',
      condition: (data) => data.consent && data.consent.treatmentAuthorization !== true
    },
    {
      field: 'consent.emergencyTreatment',
      rule: 'required',
      message: 'Emergency treatment consent is required',
      severity: 'error',
      condition: (data) => data.consent && data.consent.emergencyTreatment !== true
    },

    // Primary concerns validation rules
    {
      field: 'primaryConcerns',
      rule: 'required',
      message: 'At least one primary concern is required',
      severity: 'error',
      condition: (data) => !data.primaryConcerns || data.primaryConcerns.length === 0
    },

    // Treatment goals validation rules
    {
      field: 'treatmentGoals',
      rule: 'required',
      message: 'At least one treatment goal is required',
      severity: 'error',
      condition: (data) => !data.treatmentGoals || data.treatmentGoals.length === 0
    }
  ]

  /**
   * Validate a specific field
   */
  static validateField(
    fieldPath: string,
    value: any,
    context: ValidationContext
  ): FieldValidationResult {
    const startTime = Date.now()
    
    const result: FieldValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      info: [],
      suggestions: [],
      fieldPath,
      fieldType: typeof value,
      validationRules: []
    }

    // Get applicable validation rules for this field
    const applicableRules = this.validationRules.filter(rule => 
      rule.field === fieldPath || fieldPath.endsWith(rule.field)
    )

    result.validationRules = applicableRules

    // Apply validation rules
    for (const rule of applicableRules) {
      if (rule.condition && rule.condition(context.formData)) {
        switch (rule.severity) {
          case 'error':
            result.errors.push(rule.message)
            result.isValid = false
            break
          case 'warning':
            result.warnings.push(rule.message)
            break
          case 'info':
            result.info.push(rule.message)
            break
        }
      }
    }

    // Add field-specific suggestions
    this.addFieldSuggestions(fieldPath, value, result)

    return result
  }

  /**
   * Validate a complete step
   */
  static validateStep(
    stepNumber: number,
    stepData: any,
    formData: EnhancedMedicalForm
  ): ValidationResult {
    const startTime = Date.now()
    
    const result: ValidationResult = {
      isValid: true,
      errors: {},
      warnings: {},
      info: {},
      suggestions: {},
      validationTime: 0,
      validatedAt: new Date()
    }

    try {
      // Get step schema
      const stepSchema = enhancedStepSchemas[stepNumber as keyof typeof enhancedStepSchemas]
      if (!stepSchema) {
        result.errors.general = ['Invalid step number']
        result.isValid = false
        return result
      }

      // Validate against schema
      const schemaValidation = stepSchema.safeParse(stepData)
      if (!schemaValidation.success) {
        const errors = schemaValidation.error.flatten().fieldErrors
        result.errors = errors
        result.isValid = false
      }

      // Apply custom validation rules
      this.applyCustomValidationRules(stepNumber, stepData, formData, result)

      // Add step-specific suggestions
      this.addStepSuggestions(stepNumber, stepData, result)

      result.validationTime = Date.now() - startTime
      return result

    } catch (error) {
      console.error('Error validating step:', error)
      result.errors.general = ['Validation error occurred']
      result.isValid = false
      result.validationTime = Date.now() - startTime
      return result
    }
  }

  /**
   * Validate the complete form
   */
  static validateForm(formData: EnhancedMedicalForm): ValidationResult {
    const startTime = Date.now()
    
    const result: ValidationResult = {
      isValid: true,
      errors: {},
      warnings: {},
      info: {},
      suggestions: {},
      validationTime: 0,
      validatedAt: new Date()
    }

    try {
      // Validate against complete schema
      const schemaValidation = enhancedMedicalFormSchema.safeParse(formData)
      if (!schemaValidation.success) {
        const errors = schemaValidation.error.flatten().fieldErrors
        result.errors = errors
        result.isValid = false
      }

      // Apply cross-step validation rules
      this.applyCrossStepValidationRules(formData, result)

      // Add form-wide suggestions
      this.addFormSuggestions(formData, result)

      result.validationTime = Date.now() - startTime
      return result

    } catch (error) {
      console.error('Error validating form:', error)
      result.errors.general = ['Validation error occurred']
      result.isValid = false
      result.validationTime = Date.now() - startTime
      return result
    }
  }

  /**
   * Apply custom validation rules
   */
  private static applyCustomValidationRules(
    stepNumber: number,
    stepData: any,
    formData: EnhancedMedicalForm,
    result: ValidationResult
  ): void {
    switch (stepNumber) {
      case 1: // Parent Information
        this.validateParentInfo(stepData, result)
        break
      case 2: // Child Information
        this.validateChildInfo(stepData, result)
        break
      case 3: // Medical History
        this.validateMedicalHistory(stepData, result)
        break
      case 4: // Current Concerns
        this.validateCurrentConcerns(stepData, result)
        break
      case 5: // Family Information
        this.validateFamilyInfo(stepData, result)
        break
      case 6: // Goals & Expectations
        this.validateGoalsExpectations(stepData, result)
        break
    }
  }

  /**
   * Validate parent information
   */
  private static validateParentInfo(data: EnhancedParentInfo, result: ValidationResult): void {
    // Check for duplicate emergency contact
    if (data.emergencyContact.name === `${data.firstName} ${data.lastName}`) {
      result.warnings.emergencyContact = ['Emergency contact should be different from parent']
    }

    // Check for valid emergency contact phone
    if (data.emergencyContact.phone === data.phone) {
      result.warnings.emergencyContact = ['Emergency contact phone should be different from parent phone']
    }

    // Check for valid emergency contact email
    if (data.emergencyContact.email === data.email) {
      result.warnings.emergencyContact = ['Emergency contact email should be different from parent email']
    }

    // Check for required consents
    if (!data.consent.dataCollection) {
      result.errors.consent = ['Data collection consent is required']
      result.isValid = false
    }

    if (!data.consent.treatmentAuthorization) {
      result.errors.consent = ['Treatment authorization is required']
      result.isValid = false
    }

    if (!data.consent.emergencyTreatment) {
      result.errors.consent = ['Emergency treatment consent is required']
      result.isValid = false
    }
  }

  /**
   * Validate child information
   */
  private static validateChildInfo(data: EnhancedChildInfo, result: ValidationResult): void {
    // Check for valid birth date
    const birthDate = new Date(data.dateOfBirth)
    const today = new Date()
    const ageInYears = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    if (ageInYears > 18) {
      result.warnings.dateOfBirth = ['Child appears to be over 18 years old']
    }

    if (ageInYears < 0) {
      result.errors.dateOfBirth = ['Birth date cannot be in the future']
      result.isValid = false
    }

    // Check for valid height/weight ratio
    if (data.physicalInfo.height > 0 && data.physicalInfo.weight > 0) {
      const bmi = data.physicalInfo.weight / Math.pow(data.physicalInfo.height / 100, 2)
      if (bmi < 10 || bmi > 50) {
        result.warnings.physicalInfo = ['Height/weight ratio appears unusual']
      }
    }

    // Check for required school information for school-age children
    if (ageInYears >= 5 && ageInYears <= 18) {
      if (!data.school.name) {
        result.warnings.school = ['School information is recommended for school-age children']
      }
    }
  }

  /**
   * Validate medical history
   */
  private static validateMedicalHistory(data: EnhancedMedicalHistory, result: ValidationResult): void {
    // Check for valid gestational age
    if (data.birthHistory.gestationalAge && (data.birthHistory.gestationalAge < 20 || data.birthHistory.gestationalAge > 45)) {
      result.warnings.birthHistory = ['Gestational age appears unusual']
    }

    // Check for valid APGAR scores
    if (data.birthHistory.apgarScore) {
      const { oneMinute, fiveMinute } = data.birthHistory.apgarScore
      if (oneMinute && (oneMinute < 0 || oneMinute > 10)) {
        result.errors.birthHistory = ['APGAR score must be between 0 and 10']
        result.isValid = false
      }
      if (fiveMinute && (fiveMinute < 0 || fiveMinute > 10)) {
        result.errors.birthHistory = ['APGAR score must be between 0 and 10']
        result.isValid = false
      }
      if (oneMinute && fiveMinute && fiveMinute < oneMinute) {
        result.warnings.birthHistory = ['5-minute APGAR score is typically higher than 1-minute score']
      }
    }

    // Check for valid birth weight
    if (data.birthHistory.birthWeight && (data.birthHistory.birthWeight < 0.5 || data.birthHistory.birthWeight > 8)) {
      result.warnings.birthHistory = ['Birth weight appears unusual']
    }

    // Check for valid birth length
    if (data.birthHistory.birthLength && (data.birthHistory.birthLength < 30 || data.birthHistory.birthLength > 70)) {
      result.warnings.birthHistory = ['Birth length appears unusual']
    }
  }

  /**
   * Validate current concerns
   */
  private static validateCurrentConcerns(data: EnhancedCurrentConcerns, result: ValidationResult): void {
    // Check for at least one primary concern
    if (!data.primaryConcerns || data.primaryConcerns.length === 0) {
      result.errors.primaryConcerns = ['At least one primary concern is required']
      result.isValid = false
    }

    // Check for valid concern severity
    data.primaryConcerns?.forEach((concern, index) => {
      if (concern.severity === 'SEVERE' && concern.impact === 'MINIMAL') {
        result.warnings.primaryConcerns = [`Concern ${index + 1}: Severe concerns typically have significant impact`]
      }
    })

    // Check for valid behavioral concerns
    const behavioralConcerns = data.behavioralConcerns
    const presentConcerns = Object.entries(behavioralConcerns)
      .filter(([_, concern]) => concern.present)
      .map(([key, _]) => key)

    if (presentConcerns.length === 0) {
      result.info.behavioralConcerns = ['No behavioral concerns reported']
    }
  }

  /**
   * Validate family information
   */
  private static validateFamilyInfo(data: EnhancedFamilyInfo, result: ValidationResult): void {
    // Check for at least one primary caregiver
    if (!data.familyStructure.primaryCaregivers || data.familyStructure.primaryCaregivers.length === 0) {
      result.errors.familyStructure = ['At least one primary caregiver is required']
      result.isValid = false
    }

    // Check for valid family dynamics
    if (data.familyDynamics.stressLevel === 'VERY_HIGH' && data.familyDynamics.supportSystem === 'NONE') {
      result.warnings.familyDynamics = ['High stress with no support system may impact treatment']
    }

    // Check for recent changes
    if (data.familyDynamics.recentChanges && data.familyDynamics.recentChanges.length > 3) {
      result.warnings.familyDynamics = ['Multiple recent changes may impact treatment stability']
    }
  }

  /**
   * Validate goals and expectations
   */
  private static validateGoalsExpectations(data: EnhancedGoalsExpectations, result: ValidationResult): void {
    // Check for at least one treatment goal
    if (!data.treatmentGoals || data.treatmentGoals.length === 0) {
      result.errors.treatmentGoals = ['At least one treatment goal is required']
      result.isValid = false
    }

    // Check for measurable goals
    const nonMeasurableGoals = data.treatmentGoals?.filter(goal => !goal.measurable) || []
    if (nonMeasurableGoals.length > 0) {
      result.warnings.treatmentGoals = ['Consider making goals more measurable for better tracking']
    }

    // Check for realistic timeframes
    data.treatmentGoals?.forEach((goal, index) => {
      if (goal.priority === 'HIGH' && goal.timeframe.includes('year')) {
        result.warnings.treatmentGoals = [`Goal ${index + 1}: High priority goals typically have shorter timeframes`]
      }
    })
  }

  /**
   * Apply cross-step validation rules
   */
  private static applyCrossStepValidationRules(
    formData: EnhancedMedicalForm,
    result: ValidationResult
  ): void {
    // Check for consistent parent-child information
    if (formData.parentInfo && formData.childInfo) {
      // Check for same last name
      if (formData.parentInfo.lastName !== formData.childInfo.lastName) {
        result.warnings.consistency = ['Parent and child have different last names']
      }

      // Check for valid parent age
      const parentAge = this.calculateAge(formData.parentInfo.dateOfBirth)
      const childAge = this.calculateAge(formData.childInfo.dateOfBirth)
      
      if (parentAge < 18) {
        result.errors.consistency = ['Parent must be at least 18 years old']
        result.isValid = false
      }

      if (parentAge - childAge < 13) {
        result.warnings.consistency = ['Parent appears to be very young relative to child']
      }
    }

    // Check for consistent medical information
    if (formData.childInfo && formData.medicalHistory) {
      // Check for consistent birth information
      if (formData.childInfo.dateOfBirth !== formData.medicalHistory.birthHistory.complications) {
        // This would need more specific validation based on actual data structure
      }
    }
  }

  /**
   * Add field-specific suggestions
   */
  private static addFieldSuggestions(
    fieldPath: string,
    value: any,
    result: FieldValidationResult
  ): void {
    switch (fieldPath) {
      case 'email':
        if (value && !value.includes('@')) {
          result.suggestions.push('Email should contain @ symbol')
        }
        break
      case 'phone':
        if (value && value.length < 10) {
          result.suggestions.push('Phone number should be at least 10 digits')
        }
        break
      case 'dateOfBirth':
        if (value) {
          const age = this.calculateAge(value)
          if (age > 100) {
            result.suggestions.push('Please verify birth date')
          }
        }
        break
    }
  }

  /**
   * Add step-specific suggestions
   */
  private static addStepSuggestions(
    stepNumber: number,
    stepData: any,
    result: ValidationResult
  ): void {
    switch (stepNumber) {
      case 1: // Parent Information
        if (!stepData.occupation) {
          result.suggestions.parentInfo = ['Occupation information helps with treatment planning']
        }
        break
      case 2: // Child Information
        if (!stepData.preferredName) {
          result.suggestions.childInfo = ['Preferred name helps with personalized care']
        }
        break
      case 3: // Medical History
        if (!stepData.birthHistory.complications) {
          result.suggestions.medicalHistory = ['Birth complications information is valuable for treatment']
        }
        break
      case 4: // Current Concerns
        if (!stepData.previousInterventions || stepData.previousInterventions.length === 0) {
          result.suggestions.currentConcerns = ['Previous intervention information helps avoid repetition']
        }
        break
      case 5: // Family Information
        if (!stepData.culturalBackground.culturalPractices) {
          result.suggestions.familyInfo = ['Cultural practices information helps with culturally sensitive care']
        }
        break
      case 6: // Goals & Expectations
        if (!stepData.additionalInfo.questions) {
          result.suggestions.goalsExpectations = ['Questions help clarify expectations and concerns']
        }
        break
    }
  }

  /**
   * Add form-wide suggestions
   */
  private static addFormSuggestions(
    formData: EnhancedMedicalForm,
    result: ValidationResult
  ): void {
    // Check for completeness
    const completedSteps = formData.completedSteps?.length || 0
    if (completedSteps < 6) {
      result.suggestions.completeness = ['Complete all sections for comprehensive assessment']
    }

    // Check for emergency contact
    if (!formData.parentInfo.emergencyContact.name) {
      result.suggestions.emergency = ['Emergency contact information is important for safety']
    }

    // Check for insurance information
    if (!formData.parentInfo.medicalInfo.insuranceInfo?.provider) {
      result.suggestions.insurance = ['Insurance information helps with treatment planning']
    }
  }

  /**
   * Calculate age from date of birth
   */
  private static calculateAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    return Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  }

  /**
   * Get validation rules for a specific field
   */
  static getValidationRules(fieldPath: string): ValidationRule[] {
    return this.validationRules.filter(rule => 
      rule.field === fieldPath || fieldPath.endsWith(rule.field)
    )
  }

  /**
   * Get all validation rules
   */
  static getAllValidationRules(): ValidationRule[] {
    return [...this.validationRules]
  }

  /**
   * Add custom validation rule
   */
  static addValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule)
  }

  /**
   * Remove validation rule
   */
  static removeValidationRule(field: string, rule: string): void {
    this.validationRules = this.validationRules.filter(r => 
      !(r.field === field && r.rule === rule)
    )
  }
}

