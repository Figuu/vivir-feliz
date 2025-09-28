import { z } from 'zod'

// Enhanced validation schemas with medical-specific rules
const medicalNameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name cannot exceed 100 characters')
  .regex(/^[A-Za-zÀ-ÿ\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
  .transform(name => name.trim().split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' '))

const medicalEmailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email cannot exceed 255 characters')
  .toLowerCase()
  .refine(email => {
    // Medical domain validation
    const medicalDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com']
    const domain = email.split('@')[1]
    return medicalDomains.includes(domain) || domain.includes('.edu') || domain.includes('.gov')
  }, 'Please use a valid email address')

const medicalPhoneSchema = z.string()
  .min(1, 'Phone number is required')
  .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
  .max(20, 'Phone number cannot exceed 20 characters')
  .transform(phone => {
    // Format phone number for medical records
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  })

const medicalDateSchema = z.string()
  .min(1, 'Date is required')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(date => {
    const parsedDate = new Date(date)
    const today = new Date()
    const minDate = new Date('1900-01-01')
    return parsedDate >= minDate && parsedDate <= today
  }, 'Date must be between 1900 and today')

const medicalAgeSchema = z.number()
  .int('Age must be a whole number')
  .min(0, 'Age cannot be negative')
  .max(120, 'Age cannot exceed 120 years')
  .refine(age => age >= 0 && age <= 120, 'Age must be between 0 and 120 years')

const medicalWeightSchema = z.number()
  .positive('Weight must be positive')
  .max(1000, 'Weight cannot exceed 1000 kg')
  .multipleOf(0.1, 'Weight must have at most 1 decimal place')
  .refine(weight => weight >= 0.1 && weight <= 1000, 'Weight must be between 0.1 and 1000 kg')

const medicalHeightSchema = z.number()
  .positive('Height must be positive')
  .max(300, 'Height cannot exceed 300 cm')
  .multipleOf(0.1, 'Height must have at most 1 decimal place')
  .refine(height => height >= 10 && height <= 300, 'Height must be between 10 and 300 cm')

const medicalTextSchema = z.string()
  .max(2000, 'Text cannot exceed 2000 characters')
  .optional()

const requiredMedicalTextSchema = z.string()
  .min(1, 'This field is required')
  .max(2000, 'Text cannot exceed 2000 characters')

const medicalTermSchema = z.string()
  .min(1, 'Medical term is required')
  .max(200, 'Medical term cannot exceed 200 characters')
  .regex(/^[A-Za-zÀ-ÿ\s\-\.\(\)\/\d]+$/, 'Medical term contains invalid characters')

const diagnosisSchema = z.string()
  .min(1, 'Diagnosis is required')
  .max(500, 'Diagnosis cannot exceed 500 characters')
  .regex(/^[A-Za-zÀ-ÿ\s\-\.\(\)\/\d,]+$/, 'Diagnosis contains invalid characters')

const medicationSchema = z.string()
  .min(1, 'Medication name is required')
  .max(100, 'Medication name cannot exceed 100 characters')
  .regex(/^[A-Za-zÀ-ÿ\s\-\.\(\)\/\d]+$/, 'Medication name contains invalid characters')

const dosageSchema = z.string()
  .min(1, 'Dosage is required')
  .max(50, 'Dosage cannot exceed 50 characters')
  .regex(/^[\d\.\-\/\s]+[A-Za-z]*$/, 'Invalid dosage format')

const frequencySchema = z.string()
  .min(1, 'Frequency is required')
  .max(50, 'Frequency cannot exceed 50 characters')
  .regex(/^[\d\s]+[A-Za-z\s]*$/, 'Invalid frequency format')

// Enhanced Parent/Guardian Information Schema
export const enhancedParentInfoSchema = z.object({
  // Personal Information
  firstName: medicalNameSchema,
  lastName: medicalNameSchema,
  email: medicalEmailSchema,
  phone: medicalPhoneSchema,
  alternatePhone: medicalPhoneSchema.optional(),
  dateOfBirth: medicalDateSchema,
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'OTHER']),
  
  // Address Information
  address: z.object({
    street: z.string().min(1, 'Street address is required').max(200, 'Street address cannot exceed 200 characters'),
    city: medicalNameSchema,
    state: medicalNameSchema,
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
    country: z.string().min(1, 'Country is required').max(100, 'Country cannot exceed 100 characters')
  }),
  
  // Emergency Contact
  emergencyContact: z.object({
    name: medicalNameSchema,
    relationship: z.string().min(1, 'Relationship is required').max(50, 'Relationship cannot exceed 50 characters'),
    phone: medicalPhoneSchema,
    email: medicalEmailSchema.optional()
  }),
  
  // Medical Information
  medicalInfo: z.object({
    allergies: z.array(z.string().max(100, 'Allergy cannot exceed 100 characters')).optional(),
    medications: z.array(z.object({
      name: medicationSchema,
      dosage: dosageSchema,
      frequency: frequencySchema,
      prescribedBy: z.string().max(100, 'Prescriber name cannot exceed 100 characters').optional(),
      startDate: medicalDateSchema.optional(),
      effectiveness: z.enum(['VERY_EFFECTIVE', 'SOMEWHAT_EFFECTIVE', 'NEUTRAL', 'SOMEWHAT_INEFFECTIVE', 'INEFFECTIVE']).optional(),
      sideEffects: z.string().max(500, 'Side effects cannot exceed 500 characters').optional(),
      notes: medicalTextSchema
    })).optional(),
    medicalConditions: z.array(z.string().max(100, 'Condition cannot exceed 100 characters')).optional(),
    insuranceInfo: z.object({
      provider: z.string().max(100, 'Insurance provider cannot exceed 100 characters').optional(),
      policyNumber: z.string().max(50, 'Policy number cannot exceed 50 characters').optional(),
      groupNumber: z.string().max(50, 'Group number cannot exceed 50 characters').optional(),
      effectiveDate: medicalDateSchema.optional(),
      expirationDate: medicalDateSchema.optional()
    }).optional()
  }),
  
  // Additional Information
  occupation: z.string().max(100, 'Occupation cannot exceed 100 characters').optional(),
  employer: z.string().max(100, 'Employer cannot exceed 100 characters').optional(),
  preferredLanguage: z.string().min(1, 'Preferred language is required').max(50, 'Language cannot exceed 50 characters'),
  howDidYouHearAboutUs: z.string().max(200, 'Response cannot exceed 200 characters').optional(),
  
  // Consent and Authorization
  consent: z.object({
    dataCollection: z.boolean().refine(val => val === true, 'Data collection consent is required'),
    treatmentAuthorization: z.boolean().refine(val => val === true, 'Treatment authorization is required'),
    emergencyTreatment: z.boolean().refine(val => val === true, 'Emergency treatment consent is required'),
    communicationPreferences: z.object({
      email: z.boolean().default(true),
      phone: z.boolean().default(true),
      sms: z.boolean().default(false),
      mail: z.boolean().default(false)
    }),
    marketingConsent: z.boolean().default(false),
    researchParticipation: z.boolean().default(false)
  })
})

// Enhanced Child Information Schema
export const enhancedChildInfoSchema = z.object({
  // Personal Information
  firstName: medicalNameSchema,
  lastName: medicalNameSchema,
  dateOfBirth: medicalDateSchema,
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),
  placeOfBirth: z.string().min(1, 'Place of birth is required').max(100, 'Place of birth cannot exceed 100 characters'),
  
  // Physical Information
    physicalInfo: z.object({
      blockSize: medicalHeightSchema,
      weight: medicalWeightSchema,
    bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN']).optional(),
    eyeColor: z.string().max(50, 'Eye color cannot exceed 50 characters').optional(),
    hairColor: z.string().max(50, 'Hair color cannot exceed 50 characters').optional(),
    distinguishingMarks: z.string().max(200, 'Distinguishing marks cannot exceed 200 characters').optional()
  }),
  
  // School Information
  school: z.object({
    name: z.string().max(200, 'School name cannot exceed 200 characters').optional(),
    grade: z.string().max(20, 'Grade cannot exceed 20 characters').optional(),
    teacherName: z.string().max(100, 'Teacher name cannot exceed 100 characters').optional(),
    schoolPhone: medicalPhoneSchema.optional(),
    schoolAddress: z.object({
      street: z.string().max(200, 'Street address cannot exceed 200 characters').optional(),
      city: z.string().max(100, 'City cannot exceed 100 characters').optional(),
      state: z.string().max(100, 'State cannot exceed 100 characters').optional(),
      zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format').optional()
    }).optional(),
    iep504: z.boolean().optional(),
    accommodations: z.string().max(500, 'Accommodations cannot exceed 500 characters').optional(),
    specialServices: z.array(z.string().max(100, 'Service cannot exceed 100 characters')).optional()
  }),
  
  // Siblings Information
  siblings: z.array(z.object({
    name: medicalNameSchema,
    age: medicalAgeSchema,
    relationship: z.enum(['BROTHER', 'SISTER', 'HALF_BROTHER', 'HALF_SISTER', 'STEP_BROTHER', 'STEP_SISTER']),
    livesWithChild: z.boolean(),
    medicalConditions: z.array(z.string().max(100, 'Condition cannot exceed 100 characters')).optional(),
    notes: medicalTextSchema
  })).optional(),
  
  // Medical Information
  medicalInfo: z.object({
    allergies: z.array(z.object({
      allergen: z.string().min(1, 'Allergen is required').max(100, 'Allergen cannot exceed 100 characters'),
      reaction: z.string().min(1, 'Reaction is required').max(200, 'Reaction cannot exceed 200 characters'),
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING']),
      notes: medicalTextSchema
    })).optional(),
    medications: z.array(z.object({
      name: medicationSchema,
      dosage: dosageSchema,
      frequency: frequencySchema,
      prescribedBy: z.string().max(100, 'Prescriber name cannot exceed 100 characters').optional(),
      startDate: medicalDateSchema.optional(),
      effectiveness: z.enum(['VERY_EFFECTIVE', 'SOMEWHAT_EFFECTIVE', 'NEUTRAL', 'SOMEWHAT_INEFFECTIVE', 'INEFFECTIVE']).optional(),
      sideEffects: z.string().max(500, 'Side effects cannot exceed 500 characters').optional(),
      notes: medicalTextSchema
    })).optional(),
    medicalConditions: z.array(z.object({
      condition: medicalTermSchema,
      diagnosisDate: medicalDateSchema.optional(),
      treatment: z.string().max(200, 'Treatment cannot exceed 200 characters').optional(),
      outcome: z.enum(['RESOLVED', 'IMPROVED', 'STABLE', 'WORSENED', 'ONGOING']).optional(),
      notes: medicalTextSchema
    })).optional(),
    immunizations: z.array(z.object({
      vaccine: z.string().min(1, 'Vaccine name is required').max(100, 'Vaccine name cannot exceed 100 characters'),
      date: medicalDateSchema,
      provider: z.string().max(100, 'Provider name cannot exceed 100 characters').optional(),
      lotNumber: z.string().max(50, 'Lot number cannot exceed 50 characters').optional(),
      notes: medicalTextSchema
    })).optional()
  }),
  
  // Additional Information
  preferredName: z.string().max(50, 'Preferred name cannot exceed 50 characters').optional(),
  nickname: z.string().max(50, 'Nickname cannot exceed 50 characters').optional(),
  specialNeeds: z.string().max(500, 'Special needs cannot exceed 500 characters').optional(),
  dietaryRestrictions: z.array(z.string().max(100, 'Restriction cannot exceed 100 characters')).optional()
})

// Enhanced Medical History Schema
export const enhancedMedicalHistorySchema = z.object({
  // Birth Information
  birthHistory: z.object({
    gestationalAge: z.number().min(20, 'Gestational age must be at least 20 weeks').max(45, 'Gestational age cannot exceed 45 weeks').optional(),
    birthWeight: medicalWeightSchema.optional(),
    birthLength: medicalHeightSchema.optional(),
    deliveryMethod: z.enum(['VAGINAL', 'CESAREAN', 'VACUUM_ASSISTED', 'FORCEPS_ASSISTED', 'OTHER']).optional(),
    complications: medicalTextSchema,
    apgarScore: z.object({
      oneMinute: z.number().min(0, 'APGAR score cannot be negative').max(10, 'APGAR score cannot exceed 10').optional(),
      fiveMinute: z.number().min(0, 'APGAR score cannot be negative').max(10, 'APGAR score cannot exceed 10').optional()
    }).optional(),
    birthLocation: z.string().max(100, 'Birth location cannot exceed 100 characters').optional(),
    attendingPhysician: z.string().max(100, 'Physician name cannot exceed 100 characters').optional()
  }),
  
  // Developmental Milestones
  developmentalMilestones: z.object({
    firstSmile: z.string().max(50, 'Response cannot exceed 50 characters').optional(),
    firstSit: z.string().max(50, 'Response cannot exceed 50 characters').optional(),
    firstCrawl: z.string().max(50, 'Response cannot exceed 50 characters').optional(),
    firstWalk: z.string().max(50, 'Response cannot exceed 50 characters').optional(),
    firstWords: z.string().max(50, 'Response cannot exceed 50 characters').optional(),
    toiletTraining: z.string().max(50, 'Response cannot exceed 50 characters').optional(),
    concerns: medicalTextSchema,
    delays: z.array(z.object({
      area: z.string().min(1, 'Area is required').max(100, 'Area cannot exceed 100 characters'),
      description: z.string().min(1, 'Description is required').max(200, 'Description cannot exceed 200 characters'),
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
      intervention: z.string().max(200, 'Intervention cannot exceed 200 characters').optional()
    })).optional()
  }),
  
  // Medical Conditions
  medicalConditions: z.object({
    currentConditions: z.array(z.object({
      condition: medicalTermSchema,
      diagnosisDate: medicalDateSchema.optional(),
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
      treatment: z.string().max(200, 'Treatment cannot exceed 200 characters').optional(),
      notes: medicalTextSchema
    })).optional(),
    pastConditions: z.array(z.object({
      condition: medicalTermSchema,
      diagnosisDate: medicalDateSchema.optional(),
      resolutionDate: medicalDateSchema.optional(),
      treatment: z.string().max(200, 'Treatment cannot exceed 200 characters').optional(),
      outcome: z.enum(['RESOLVED', 'IMPROVED', 'STABLE', 'WORSENED']).optional(),
      notes: medicalTextSchema
    })).optional(),
    hospitalizations: z.array(z.object({
      date: medicalDateSchema,
      reason: z.string().min(1, 'Reason is required').max(200, 'Reason cannot exceed 200 characters'),
      duration: z.string().max(50, 'Duration cannot exceed 50 characters').optional(),
      hospital: z.string().max(100, 'Hospital name cannot exceed 100 characters').optional(),
      dischargeSummary: z.string().max(500, 'Discharge summary cannot exceed 500 characters').optional()
    })).optional(),
    surgeries: z.array(z.object({
      date: medicalDateSchema,
      procedure: z.string().min(1, 'Procedure is required').max(200, 'Procedure cannot exceed 200 characters'),
      surgeon: z.string().max(100, 'Surgeon name cannot exceed 100 characters').optional(),
      hospital: z.string().max(100, 'Hospital name cannot exceed 100 characters').optional(),
      complications: z.string().max(500, 'Complications cannot exceed 500 characters').optional(),
      outcome: z.enum(['SUCCESSFUL', 'PARTIAL_SUCCESS', 'UNSUCCESSFUL', 'COMPLICATED']).optional()
    })).optional()
  }),
  
  // Family Medical History
  familyHistory: z.object({
    mentalHealthConditions: z.array(z.object({
      condition: medicalTermSchema,
      relationship: z.string().min(1, 'Relationship is required').max(50, 'Relationship cannot exceed 50 characters'),
      ageOfOnset: medicalAgeSchema.optional(),
      treatment: z.string().max(200, 'Treatment cannot exceed 200 characters').optional(),
      notes: medicalTextSchema
    })).optional(),
    physicalConditions: z.array(z.object({
      condition: medicalTermSchema,
      relationship: z.string().min(1, 'Relationship is required').max(50, 'Relationship cannot exceed 50 characters'),
      ageOfOnset: medicalAgeSchema.optional(),
      treatment: z.string().max(200, 'Treatment cannot exceed 200 characters').optional(),
      notes: medicalTextSchema
    })).optional(),
    geneticConditions: z.array(z.object({
      condition: medicalTermSchema,
      relationship: z.string().min(1, 'Relationship is required').max(50, 'Relationship cannot exceed 50 characters'),
      inheritance: z.enum(['AUTOSOMAL_DOMINANT', 'AUTOSOMAL_RECESSIVE', 'X_LINKED', 'MITOCHONDRIAL', 'UNKNOWN']).optional(),
      notes: medicalTextSchema
    })).optional(),
    substanceAbuse: z.array(z.object({
      substance: z.string().min(1, 'Substance is required').max(100, 'Substance cannot exceed 100 characters'),
      relationship: z.string().min(1, 'Relationship is required').max(50, 'Relationship cannot exceed 50 characters'),
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
      treatment: z.string().max(200, 'Treatment cannot exceed 200 characters').optional(),
      notes: medicalTextSchema
    })).optional(),
    other: medicalTextSchema
  })
})

// Enhanced Current Concerns Schema
export const enhancedCurrentConcernsSchema = z.object({
  // Primary Concerns
  primaryConcerns: z.array(z.object({
    concern: requiredMedicalTextSchema,
    duration: z.string().min(1, 'Duration is required').max(100, 'Duration cannot exceed 100 characters'),
    severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
    impact: z.enum(['MINIMAL', 'SOME', 'SIGNIFICANT', 'SEVERE']),
    triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
    copingStrategies: z.string().max(500, 'Coping strategies cannot exceed 500 characters').optional(),
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
    intensity: z.number().min(1, 'Intensity must be at least 1').max(10, 'Intensity cannot exceed 10').optional(),
    notes: medicalTextSchema
  })).min(1, 'At least one primary concern is required'),
  
  // Behavioral Concerns
  behavioralConcerns: z.object({
    aggression: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: medicalTextSchema,
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
      targets: z.array(z.string().max(100, 'Target cannot exceed 100 characters')).optional()
    }),
    anxiety: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: medicalTextSchema,
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
      symptoms: z.array(z.string().max(100, 'Symptom cannot exceed 100 characters')).optional()
    }),
    depression: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: medicalTextSchema,
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
      symptoms: z.array(z.string().max(100, 'Symptom cannot exceed 100 characters')).optional()
    }),
    attentionIssues: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: medicalTextSchema,
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
      impact: z.enum(['MINIMAL', 'SOME', 'SIGNIFICANT', 'SEVERE']).optional()
    }),
    sleepIssues: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: medicalTextSchema,
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
      duration: z.string().max(100, 'Duration cannot exceed 100 characters').optional()
    }),
    eatingIssues: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: medicalTextSchema,
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
      type: z.enum(['OVER_EATING', 'UNDER_EATING', 'SELECTIVE_EATING', 'BINGE_EATING', 'OTHER']).optional()
    }),
    socialIssues: z.object({
      present: z.boolean(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      triggers: z.string().max(500, 'Triggers cannot exceed 500 characters').optional(),
      description: medicalTextSchema,
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
      impact: z.enum(['MINIMAL', 'SOME', 'SIGNIFICANT', 'SEVERE']).optional()
    }),
    other: medicalTextSchema
  }),
  
  // Academic Performance
  academicPerformance: z.object({
    currentGrade: z.string().max(20, 'Grade cannot exceed 20 characters').optional(),
    subjects: z.array(z.object({
      subject: z.string().min(1, 'Subject is required').max(50, 'Subject cannot exceed 50 characters'),
      performance: z.enum(['EXCELLENT', 'GOOD', 'AVERAGE', 'BELOW_AVERAGE', 'POOR']),
      challenges: z.string().max(500, 'Challenges cannot exceed 500 characters').optional(),
      strengths: z.string().max(500, 'Strengths cannot exceed 500 characters').optional(),
      accommodations: z.string().max(200, 'Accommodations cannot exceed 200 characters').optional()
    })).optional(),
    attendance: z.enum(['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR']).optional(),
    homework: z.enum(['ALWAYS_COMPLETE', 'USUALLY_COMPLETE', 'SOMETIMES_COMPLETE', 'RARELY_COMPLETE', 'NEVER_COMPLETE']).optional(),
    teacherConcerns: medicalTextSchema,
    iep504: z.boolean().optional(),
    accommodations: medicalTextSchema,
    specialServices: z.array(z.string().max(100, 'Service cannot exceed 100 characters')).optional()
  }),
  
  // Previous Interventions
  previousInterventions: z.array(z.object({
    type: z.enum(['THERAPY', 'MEDICATION', 'COUNSELING', 'TUTORING', 'SPECIAL_EDUCATION', 'BEHAVIORAL_INTERVENTION', 'OTHER']),
    provider: z.string().min(1, 'Provider is required').max(100, 'Provider cannot exceed 100 characters'),
    duration: z.string().min(1, 'Duration is required').max(100, 'Duration cannot exceed 100 characters'),
    effectiveness: z.enum(['VERY_EFFECTIVE', 'SOMEWHAT_EFFECTIVE', 'NEUTRAL', 'SOMEWHAT_INEFFECTIVE', 'INEFFECTIVE']),
    startDate: medicalDateSchema.optional(),
    endDate: medicalDateSchema.optional(),
    notes: medicalTextSchema,
    recommendations: z.string().max(500, 'Recommendations cannot exceed 500 characters').optional()
  })).optional()
})

// Enhanced Family Information Schema
export const enhancedFamilyInfoSchema = z.object({
  // Family Structure
  familyStructure: z.object({
    livingArrangement: z.enum(['BOTH_PARENTS', 'SINGLE_PARENT', 'BLENDED_FAMILY', 'EXTENDED_FAMILY', 'FOSTER_CARE', 'OTHER']),
    primaryCaregivers: z.array(z.string().max(100, 'Caregiver name cannot exceed 100 characters')).min(1, 'At least one primary caregiver is required'),
    otherAdults: z.array(z.string().max(100, 'Adult name cannot exceed 100 characters')).optional(),
    pets: z.array(z.object({
      type: z.string().min(1, 'Pet type is required').max(50, 'Pet type cannot exceed 50 characters'),
      name: z.string().max(50, 'Pet name cannot exceed 50 characters').optional(),
      age: medicalAgeSchema.optional(),
      relationship: z.string().max(100, 'Relationship cannot exceed 100 characters').optional()
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
    challenges: medicalTextSchema,
    strengths: medicalTextSchema,
    recentChanges: z.array(z.object({
      change: z.string().min(1, 'Change is required').max(200, 'Change cannot exceed 200 characters'),
      date: medicalDateSchema.optional(),
      impact: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).optional(),
      notes: medicalTextSchema
    })).optional()
  }),
  
  // Parent Information
  parentInfo: z.object({
    education: z.enum(['LESS_THAN_HIGH_SCHOOL', 'HIGH_SCHOOL', 'SOME_COLLEGE', 'BACHELORS', 'MASTERS', 'DOCTORATE', 'OTHER']).optional(),
    employment: z.enum(['FULL_TIME', 'PART_TIME', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED', 'HOMEMAKER', 'OTHER']).optional(),
    income: z.enum(['UNDER_25000', '25000_50000', '50000_75000', '75000_100000', '100000_150000', 'OVER_150000', 'PREFER_NOT_TO_SAY']).optional(),
    healthInsurance: z.enum(['PRIVATE', 'MEDICAID', 'CHIP', 'UNINSURED', 'OTHER']).optional(),
    mentalHealthHistory: z.array(z.string().max(100, 'Condition cannot exceed 100 characters')).optional(),
    substanceUse: z.enum(['NEVER', 'PAST', 'CURRENT', 'PREFER_NOT_TO_SAY']).optional(),
    criminalHistory: z.boolean().optional(),
    domesticViolence: z.boolean().optional(),
    notes: medicalTextSchema
  }),
  
  // Cultural Background
  culturalBackground: z.object({
    ethnicity: z.string().max(100, 'Ethnicity cannot exceed 100 characters').optional(),
    religion: z.string().max(100, 'Religion cannot exceed 100 characters').optional(),
    language: z.string().min(1, 'Primary language is required').max(50, 'Language cannot exceed 50 characters'),
    culturalPractices: medicalTextSchema,
    religiousPractices: medicalTextSchema,
    dietaryRestrictions: z.array(z.string().max(100, 'Restriction cannot exceed 100 characters')).optional(),
    culturalConsiderations: z.string().max(500, 'Cultural considerations cannot exceed 500 characters').optional()
  })
})

// Enhanced Goals and Expectations Schema
export const enhancedGoalsExpectationsSchema = z.object({
  // Treatment Goals
  treatmentGoals: z.array(z.object({
    goal: requiredMedicalTextSchema,
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
    timeframe: z.string().min(1, 'Timeframe is required').max(100, 'Timeframe cannot exceed 100 characters'),
    measurable: z.boolean(),
    description: medicalTextSchema,
    successCriteria: z.string().max(500, 'Success criteria cannot exceed 500 characters').optional(),
    barriers: z.string().max(500, 'Barriers cannot exceed 500 characters').optional()
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
    expectations: medicalTextSchema,
    concerns: medicalTextSchema,
    previousExperience: z.string().max(500, 'Previous experience cannot exceed 500 characters').optional(),
    specificRequests: z.string().max(500, 'Specific requests cannot exceed 500 characters').optional()
  }),
  
  // Child Preferences
  childPreferences: z.object({
    therapistGender: z.enum(['MALE', 'FEMALE', 'NO_PREFERENCE']).optional(),
    sessionTime: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'NO_PREFERENCE']).optional(),
    sessionLength: z.enum(['30_MINUTES', '45_MINUTES', '60_MINUTES', 'NO_PREFERENCE']).optional(),
    therapyType: z.array(z.enum(['INDIVIDUAL', 'FAMILY', 'GROUP', 'PLAY_THERAPY', 'COGNITIVE_BEHAVIORAL', 'OTHER'])).optional(),
    specialRequests: medicalTextSchema,
    fears: z.array(z.string().max(100, 'Fear cannot exceed 100 characters')).optional(),
    interests: z.array(z.string().max(100, 'Interest cannot exceed 100 characters')).optional()
  }),
  
  // Additional Information
  additionalInfo: z.object({
    transportation: z.enum(['PARENT', 'BUS', 'WALKING', 'OTHER']).optional(),
    schedulingConstraints: medicalTextSchema,
    financialConcerns: medicalTextSchema,
    otherServices: z.array(z.string().max(100, 'Service cannot exceed 100 characters')).optional(),
    questions: medicalTextSchema,
    emergencyContacts: z.array(z.object({
      name: medicalNameSchema,
      relationship: z.string().min(1, 'Relationship is required').max(50, 'Relationship cannot exceed 50 characters'),
      phone: medicalPhoneSchema,
      email: medicalEmailSchema.optional(),
      address: z.string().max(200, 'Address cannot exceed 200 characters').optional()
    })).optional()
  })
})

// Complete Enhanced Medical Form Schema
export const enhancedMedicalFormSchema = z.object({
  // Form Metadata
  formId: z.string().uuid().optional(),
  consultationRequestId: z.string().uuid(),
  patientId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  
  // Form Steps
  parentInfo: enhancedParentInfoSchema,
  childInfo: enhancedChildInfoSchema,
  medicalHistory: enhancedMedicalHistorySchema,
  currentConcerns: enhancedCurrentConcernsSchema,
  familyInfo: enhancedFamilyInfoSchema,
  goalsExpectations: enhancedGoalsExpectationsSchema,
  
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
  reviewNotes: medicalTextSchema,
  approvalNotes: medicalTextSchema,
  
  // Validation and Quality
  validationState: z.object({
    isValid: z.boolean(),
    errors: z.record(z.array(z.string())),
    warnings: z.record(z.array(z.string())),
    stepValidation: z.record(z.object({
      isValid: z.boolean(),
      errors: z.array(z.string()),
      warnings: z.array(z.string()),
      completedAt: z.date().optional()
    })),
    lastValidatedAt: z.date()
  }).optional()
})

// Step-by-step validation schemas
export const enhancedStepSchemas = {
  1: enhancedParentInfoSchema,
  2: enhancedChildInfoSchema,
  3: enhancedMedicalHistorySchema,
  4: enhancedCurrentConcernsSchema,
  5: enhancedFamilyInfoSchema,
  6: enhancedGoalsExpectationsSchema
}

// Auto-save schema (partial validation)
export const enhancedAutoSaveSchema = z.object({
  formId: z.string().uuid().optional(),
  consultationRequestId: z.string().uuid(),
  currentStep: z.number().min(1).max(6),
  completedSteps: z.array(z.number()),
  data: z.record(z.any()), // Flexible data structure for partial saves
  status: z.enum(['DRAFT', 'IN_PROGRESS']).default('DRAFT'),
  validationState: z.object({
    isValid: z.boolean(),
    errors: z.record(z.array(z.string())),
    warnings: z.record(z.array(z.string())),
    stepValidation: z.record(z.object({
      isValid: z.boolean(),
      errors: z.array(z.string()),
      warnings: z.array(z.string()),
      completedAt: z.date().optional()
    })),
    lastValidatedAt: z.date()
  }).optional()
})

// Form progress validation
export const enhancedFormProgressSchema = z.object({
  formId: z.string().uuid(),
  currentStep: z.number().min(1).max(6),
  completedSteps: z.array(z.number()),
  totalSteps: z.number().default(6),
  progressPercentage: z.number().min(0).max(100),
  lastSavedAt: z.date(),
  estimatedTimeRemaining: z.number().optional(), // in minutes
  validationState: z.object({
    isValid: z.boolean(),
    errors: z.record(z.array(z.string())),
    warnings: z.record(z.array(z.string())),
    stepValidation: z.record(z.object({
      isValid: z.boolean(),
      errors: z.array(z.string()),
      warnings: z.array(z.string()),
      completedAt: z.date().optional()
    })),
    lastValidatedAt: z.date()
  })
})

export type EnhancedParentInfo = z.infer<typeof enhancedParentInfoSchema>
export type EnhancedChildInfo = z.infer<typeof enhancedChildInfoSchema>
export type EnhancedMedicalHistory = z.infer<typeof enhancedMedicalHistorySchema>
export type EnhancedCurrentConcerns = z.infer<typeof enhancedCurrentConcernsSchema>
export type EnhancedFamilyInfo = z.infer<typeof enhancedFamilyInfoSchema>
export type EnhancedGoalsExpectations = z.infer<typeof enhancedGoalsExpectationsSchema>
export type EnhancedMedicalForm = z.infer<typeof enhancedMedicalFormSchema>
export type EnhancedAutoSaveData = z.infer<typeof enhancedAutoSaveSchema>
export type EnhancedFormProgress = z.infer<typeof enhancedFormProgressSchema>
