import { z } from 'zod'

// Common validation schemas
const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name cannot exceed 100 characters')
  .regex(/^[A-Za-zÀ-ÿ\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform(name => name.trim().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' '))

const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email cannot exceed 255 characters')
  .toLowerCase()

const phoneSchema = z.string()
  .min(1, 'Phone number is required')
  .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
  .max(20, 'Phone number cannot exceed 20 characters')

const dateSchema = z.string()
  .min(1, 'Date is required')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(date => {
    const parsedDate = new Date(date)
    const today = new Date()
    return parsedDate <= today
  }, 'Date cannot be in the future')

const ageSchema = z.number()
  .int('Age must be a whole number')
  .min(0, 'Age cannot be negative')
  .max(120, 'Age cannot exceed 120 years')

const weightSchema = z.number()
  .positive('Weight must be positive')
  .max(1000, 'Weight cannot exceed 1000 kg')
  .multipleOf(0.1, 'Weight must have at most 1 decimal place')

const heightSchema = z.number()
  .positive('Height must be positive')
  .max(300, 'Height cannot exceed 300 cm')
  .multipleOf(0.1, 'Height must have at most 1 decimal place')

const textAreaSchema = z.string()
  .max(2000, 'Text cannot exceed 2000 characters')
  .optional()

const requiredTextAreaSchema = z.string()
  .min(1, 'This field is required')
  .max(2000, 'Text cannot exceed 2000 characters')

// Step 1: Parent/Guardian Information
export const parentInfoSchema = z.object({
  // Personal Information
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  alternatePhone: phoneSchema.optional(),
  dateOfBirth: dateSchema,
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'OTHER']),
  
  // Address Information
  address: z.object({
    street: z.string().min(1, 'Street address is required').max(200, 'Street address cannot exceed 200 characters'),
    city: nameSchema,
    state: nameSchema,
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
    country: z.string().min(1, 'Country is required').max(100, 'Country cannot exceed 100 characters')
  }),
  
  // Emergency Contact
  emergencyContact: z.object({
    name: nameSchema,
    relationship: z.string().min(1, 'Relationship is required').max(50, 'Relationship cannot exceed 50 characters'),
    phone: phoneSchema,
    email: emailSchema.optional()
  }),
  
  // Additional Information
  occupation: z.string().max(100, 'Occupation cannot exceed 100 characters').optional(),
  employer: z.string().max(100, 'Employer cannot exceed 100 characters').optional(),
  preferredLanguage: z.string().min(1, 'Preferred language is required').max(50, 'Language cannot exceed 50 characters'),
  howDidYouHearAboutUs: z.string().max(200, 'Response cannot exceed 200 characters').optional()
})

// Step 2: Child Information
export const childInfoSchema = z.object({
  // Personal Information
  firstName: nameSchema,
  lastName: nameSchema,
  dateOfBirth: dateSchema,
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  placeOfBirth: z.string().min(1, 'Place of birth is required').max(100, 'Place of birth cannot exceed 100 characters'),
  
  // Physical Information
  height: heightSchema,
  weight: weightSchema,
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN']).optional(),
  
  // School Information
  school: z.object({
    name: z.string().max(200, 'School name cannot exceed 200 characters').optional(),
    grade: z.string().max(20, 'Grade cannot exceed 20 characters').optional(),
    teacherName: z.string().max(100, 'Teacher name cannot exceed 100 characters').optional(),
    schoolPhone: phoneSchema.optional()
  }),
  
  // Siblings Information
  siblings: z.array(z.object({
    name: nameSchema,
    age: ageSchema,
    relationship: z.enum(['BROTHER', 'SISTER', 'HALF_BROTHER', 'HALF_SISTER', 'STEP_BROTHER', 'STEP_SISTER']),
    livesWithChild: z.boolean()
  })).optional(),
  
  // Additional Information
  preferredName: z.string().max(50, 'Preferred name cannot exceed 50 characters').optional(),
  nickname: z.string().max(50, 'Nickname cannot exceed 50 characters').optional(),
  allergies: z.array(z.string().max(100, 'Allergy cannot exceed 100 characters')).optional(),
  medications: z.array(z.object({
    name: z.string().min(1, 'Medication name is required').max(100, 'Medication name cannot exceed 100 characters'),
    dosage: z.string().max(50, 'Dosage cannot exceed 50 characters').optional(),
    frequency: z.string().max(50, 'Frequency cannot exceed 50 characters').optional(),
    prescribedBy: z.string().max(100, 'Prescriber name cannot exceed 100 characters').optional()
  })).optional()
})

// Step 3: Medical History
export const medicalHistorySchema = z.object({
  // Birth Information
  birthHistory: z.object({
    gestationalAge: z.number().min(20, 'Gestational age must be at least 20 weeks').max(45, 'Gestational age cannot exceed 45 weeks').optional(),
    birthWeight: weightSchema.optional(),
    birthLength: heightSchema.optional(),
    deliveryMethod: z.enum(['VAGINAL', 'CESAREAN', 'VACUUM_ASSISTED', 'FORCEPS_ASSISTED', 'OTHER']).optional(),
    complications: textAreaSchema,
    apgarScore: z.object({
      oneMinute: z.number().min(0, 'APGAR score cannot be negative').max(10, 'APGAR score cannot exceed 10').optional(),
      fiveMinute: z.number().min(0, 'APGAR score cannot be negative').max(10, 'APGAR score cannot exceed 10').optional()
    }).optional()
  }),
  
  // Developmental Milestones
  developmentalMilestones: z.object({
    firstSmile: z.string().max(50, 'Response cannot exceed 50 characters').optional(),
    firstSit: z.string().max(50, 'Response cannot exceed 50 characters').optional(),
    firstCrawl: z.string().max(50, 'Response cannot exceed 50 characters').optional(),
    firstWalk: z.string().max(50, 'Response cannot exceed 50 characters').optional(),
    firstWords: z.string().max(50, 'Response cannot exceed 50 characters').optional(),
    toiletTraining: z.string().max(50, 'Response cannot exceed 50 characters').optional(),
    concerns: textAreaSchema
  }),
  
  // Medical Conditions
  medicalConditions: z.object({
    currentConditions: z.array(z.string().max(100, 'Condition cannot exceed 100 characters')).optional(),
    pastConditions: z.array(z.string().max(100, 'Condition cannot exceed 100 characters')).optional(),
    hospitalizations: z.array(z.object({
      date: dateSchema,
      reason: z.string().min(1, 'Reason is required').max(200, 'Reason cannot exceed 200 characters'),
      duration: z.string().max(50, 'Duration cannot exceed 50 characters').optional(),
      hospital: z.string().max(100, 'Hospital name cannot exceed 100 characters').optional()
    })).optional(),
    surgeries: z.array(z.object({
      date: dateSchema,
      procedure: z.string().min(1, 'Procedure is required').max(200, 'Procedure cannot exceed 200 characters'),
      surgeon: z.string().max(100, 'Surgeon name cannot exceed 100 characters').optional(),
      hospital: z.string().max(100, 'Hospital name cannot exceed 100 characters').optional()
    })).optional()
  }),
  
  // Family Medical History
  familyHistory: z.object({
    mentalHealthConditions: z.array(z.string().max(100, 'Condition cannot exceed 100 characters')).optional(),
    physicalConditions: z.array(z.string().max(100, 'Condition cannot exceed 100 characters')).optional(),
    geneticConditions: z.array(z.string().max(100, 'Condition cannot exceed 100 characters')).optional(),
    substanceAbuse: z.array(z.string().max(100, 'Substance cannot exceed 100 characters')).optional(),
    other: textAreaSchema
  })
})

// Step 4: Current Concerns
export const currentConcernsSchema = z.object({
  // Primary Concerns
  primaryConcerns: z.array(z.object({
    concern: requiredTextAreaSchema,
    duration: z.string().min(1, 'Duration is required').max(100, 'Duration cannot exceed 100 characters'),
    severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
    impact: z.enum(['MINIMAL', 'SOME', 'SIGNIFICANT', 'SEVERE']),
    triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
    copingStrategies: z.string().max(500, 'Coping strategies cannot exceed 500 characters').optional()
  })).min(1, 'At least one primary concern is required'),
  
  // Behavioral Concerns
  behavioralConcerns: z.object({
    aggression: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: textAreaSchema
    }),
    anxiety: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: textAreaSchema
    }),
    depression: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: textAreaSchema
    }),
    attentionIssues: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: textAreaSchema
    }),
    sleepIssues: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: textAreaSchema
    }),
    eatingIssues: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: textAreaSchema
    }),
    socialIssues: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: textAreaSchema
    }),
    other: textAreaSchema
  }),
  
  // Academic Performance
  academicPerformance: z.object({
    currentGrade: z.string().max(20, 'Grade cannot exceed 20 characters').optional(),
    subjects: z.array(z.object({
      subject: z.string().min(1, 'Subject is required').max(50, 'Subject cannot exceed 50 characters'),
      performance: z.enum(['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE', 'POOR']),
      challenges: z.string().max(500, 'Challenges cannot exceed 500 characters').optional()
    })).optional(),
    attendance: z.enum(['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR']).optional(),
    homework: z.enum(['ALWAYS_COMPLETE', 'USUALLY_COMPLETE', 'SOMETIMES_COMPLETE', 'RARELY_COMPLETE', 'NEVER_COMPLETE']).optional(),
    teacherConcerns: textAreaSchema,
    iep504: z.boolean().optional(),
    accommodations: textAreaSchema
  }),
  
  // Previous Interventions
  previousInterventions: z.array(z.object({
    type: z.enum(['THERAPY', 'MEDICATION', 'COUNSELING', 'TUTORING', 'SPECIAL_EDUCATION', 'OTHER']),
    provider: z.string().min(1, 'Provider is required').max(100, 'Provider cannot exceed 100 characters'),
    duration: z.string().min(1, 'Duration is required').max(100, 'Duration cannot exceed 100 characters'),
    effectiveness: z.enum(['VERY_EFFECTIVE', 'SOMEWHAT_EFFECTIVE', 'NEUTRAL', 'SOMEWHAT_INEFFECTIVE', 'INEFFECTIVE']),
    notes: textAreaSchema
  })).optional()
})

// Step 5: Family Information
export const familyInfoSchema = z.object({
  // Family Structure
  familyStructure: z.object({
    livingArrangement: z.enum(['BOTH_PARENTS', 'SINGLE_PARENT', 'BLENDED_FAMILY', 'EXTENDED_FAMILY', 'FOSTER_CARE', 'OTHER']),
    primaryCaregivers: z.array(z.string().max(100, 'Caregiver name cannot exceed 100 characters')).min(1, 'At least one primary caregiver is required'),
    otherAdults: z.array(z.string().max(100, 'Adult name cannot exceed 100 characters')).optional(),
    pets: z.array(z.object({
      type: z.string().min(1, 'Pet type is required').max(50, 'Pet type cannot exceed 50 characters'),
      name: z.string().max(50, 'Pet name cannot exceed 50 characters').optional(),
      age: ageSchema.optional()
    })).optional()
  }),
  
  // Family Dynamics
  familyDynamics: z.object({
    communication: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
    conflictResolution: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
    discipline: z.enum(['CONSISTENT', 'SOMEWHAT_CONSISTENT', 'INCONSISTENT', 'VERY_INCONSISTENT']),
    routines: z.enum(['VERY_STRUCTURED', 'SOMEWHAT_STRUCTURED', 'FLEXIBLE', 'VERY_FLEXIBLE']),
    stressLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'VERY_HIGH']),
    supportSystem: z.enum(['STRONG', 'MODERATE', 'WEAK', 'NONE']),
    challenges: textAreaSchema,
    strengths: textAreaSchema
  }),
  
  // Parent Information
  parentInfo: z.object({
    education: z.enum(['LESS_THAN_HIGH_SCHOOL', 'HIGH_SCHOOL', 'SOME_COLLEGE', 'BACHELORS', 'MASTERS', 'DOCTORATE', 'OTHER']).optional(),
    employment: z.enum(['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED', 'HOMEMAKER', 'OTHER']).optional(),
    income: z.enum(['UNDER_25000', '25000_50000', '50000_75000', '75000_100000', '100000_150000', 'OVER_150000', 'PREFER_NOT_TO_SAY']).optional(),
    healthInsurance: z.enum(['PRIVATE', 'MEDICAID', 'CHIP', 'UNINSURED', 'OTHER']).optional(),
    mentalHealthHistory: z.array(z.string().max(100, 'Condition cannot exceed 100 characters')).optional(),
    substanceUse: z.enum(['NEVER', 'PAST', 'CURRENT', 'PREFER_NOT_TO_SAY']).optional()
  }),
  
  // Cultural Background
  culturalBackground: z.object({
    ethnicity: z.string().max(100, 'Ethnicity cannot exceed 100 characters').optional(),
    religion: z.string().max(100, 'Religion cannot exceed 100 characters').optional(),
    language: z.string().min(1, 'Primary language is required').max(50, 'Language cannot exceed 50 characters'),
    culturalPractices: textAreaSchema,
    religiousPractices: textAreaSchema,
    dietaryRestrictions: z.array(z.string().max(100, 'Restriction cannot exceed 100 characters')).optional()
  })
})

// Step 6: Goals and Expectations
export const goalsExpectationsSchema = z.object({
  // Treatment Goals
  treatmentGoals: z.array(z.object({
    goal: requiredTextAreaSchema,
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    timeframe: z.string().min(1, 'Timeframe is required').max(100, 'Timeframe cannot exceed 100 characters'),
    measurable: z.boolean(),
    description: textAreaSchema
  })).min(1, 'At least one treatment goal is required'),
  
  // Parent Expectations
  parentExpectations: z.object({
    therapyDuration: z.enum(['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'UNSURE']),
    sessionFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'AS_NEEDED']),
    parentInvolvement: z.enum(['HIGH', 'MODERATE', 'LOW', 'MINIMAL']),
    communication: z.enum(['FREQUENT', 'REGULAR', 'OCCASIONAL', 'MINIMAL']),
    homework: z.boolean(),
    familySessions: z.boolean(),
    groupTherapy: z.boolean(),
    expectations: textAreaSchema,
    concerns: textAreaSchema
  }),
  
  // Child Preferences
  childPreferences: z.object({
    therapistGender: z.enum(['MALE', 'FEMALE', 'NO_PREFERENCE']).optional(),
    sessionTime: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'NO_PREFERENCE']).optional(),
    sessionLength: z.enum(['30_MINUTES', '45_MINUTES', '60_MINUTES', 'NO_PREFERENCE']).optional(),
    therapyType: z.array(z.enum(['INDIVIDUAL', 'FAMILY', 'GROUP', 'PLAY_THERAPY', 'COGNITIVE_BEHAVIORAL', 'OTHER'])).optional(),
    specialRequests: textAreaSchema
  }),
  
  // Additional Information
  additionalInfo: z.object({
    transportation: z.enum(['PARENT', 'BUS', 'WALKING', 'OTHER']).optional(),
    schedulingConstraints: textAreaSchema,
    financialConcerns: textAreaSchema,
    otherServices: z.array(z.string().max(100, 'Service cannot exceed 100 characters')).optional(),
    questions: textAreaSchema
  })
})

// Complete Medical Form Schema
export const medicalFormSchema = z.object({
  // Form Metadata
  formId: z.string().uuid().optional(),
  consultationRequestId: z.string().uuid(),
  patientId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  
  // Form Steps
  parentInfo: parentInfoSchema,
  childInfo: childInfoSchema,
  medicalHistory: medicalHistorySchema,
  currentConcerns: currentConcernsSchema,
  familyInfo: familyInfoSchema,
  goalsExpectations: goalsExpectationsSchema,
  
  // Form Status
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'APPROVED']).default('DRAFT'),
  currentStep: z.number().min(1).max(6).default(1),
  completedSteps: z.array(z.number()).default([]),
  
  // Timestamps
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  completedAt: z.date().optional(),
  reviewedAt: z.date().optional(),
  approvedAt: z.date().optional(),
  
  // Review Information
  reviewedBy: z.string().uuid().optional(),
  approvedBy: z.string().uuid().optional(),
  reviewNotes: textAreaSchema,
  approvalNotes: textAreaSchema
})

// Step-by-step validation schemas
export const stepSchemas = {
  1: parentInfoSchema,
  2: childInfoSchema,
  3: medicalHistorySchema,
  4: currentConcernsSchema,
  5: familyInfoSchema,
  6: goalsExpectationsSchema
}

// Auto-save schema (partial validation)
export const autoSaveSchema = z.object({
  formId: z.string().uuid().optional(),
  consultationRequestId: z.string().uuid(),
  currentStep: z.number().min(1).max(6),
  completedSteps: z.array(z.number()),
  data: z.record(z.any()), // Flexible data structure for partial saves
  status: z.enum(['DRAFT', 'IN_PROGRESS']).default('DRAFT')
})

// Form progress validation
export const formProgressSchema = z.object({
  formId: z.string().uuid(),
  currentStep: z.number().min(1).max(6),
  completedSteps: z.array(z.number()),
  totalSteps: z.number().default(6),
  progressPercentage: z.number().min(0).max(100),
  lastSavedAt: z.date(),
  estimatedTimeRemaining: z.number().optional() // in minutes
})

export type ParentInfo = z.infer<typeof parentInfoSchema>
export type ChildInfo = z.infer<typeof childInfoSchema>
export type MedicalHistory = z.infer<typeof medicalHistorySchema>
export type CurrentConcerns = z.infer<typeof currentConcernsSchema>
export type FamilyInfo = z.infer<typeof familyInfoSchema>
export type GoalsExpectations = z.infer<typeof goalsExpectationsSchema>
export type MedicalForm = z.infer<typeof medicalFormSchema>
export type AutoSaveData = z.infer<typeof autoSaveSchema>
export type FormProgress = z.infer<typeof formProgressSchema>


