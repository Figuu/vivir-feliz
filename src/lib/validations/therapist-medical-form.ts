import { z } from 'zod'

// Medical terminology validation schemas
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

// Numeric validation schemas
const vitalSignSchema = z.number()
  .positive('Vital sign must be positive')
  .max(1000, 'Vital sign value too high')
  .multipleOf(0.1, 'Vital sign must have at most 1 decimal place')

const labValueSchema = z.number()
  .positive('Lab value must be positive')
  .max(10000, 'Lab value too high')
  .multipleOf(0.01, 'Lab value must have at most 2 decimal places')

const scoreSchema = z.number()
  .min(0, 'Score cannot be negative')
  .max(100, 'Score cannot exceed 100')
  .multipleOf(0.1, 'Score must have at most 1 decimal place')

// Date consistency validation
const dateConsistencySchema = z.string()
  .min(1, 'Date is required')
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(date => {
    const parsedDate = new Date(date)
    const today = new Date()
    return parsedDate <= today
  }, 'Date cannot be in the future')

const ageConsistencySchema = z.object({
  dateOfBirth: z.string(),
  age: z.number()
}).refine(data => {
  const birthDate = new Date(data.dateOfBirth)
  const today = new Date()
  const calculatedAge = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
  return Math.abs(calculatedAge - data.age) <= 1
}, 'Age must be consistent with date of birth')

// Therapist Assessment Schema
export const therapistAssessmentSchema = z.object({
  // Clinical Observations
  clinicalObservations: z.object({
    physicalAppearance: z.object({
      generalAppearance: z.enum(['WELL_APPEARING', 'MILDLY_ILL', 'MODERATELY_ILL', 'SEVERELY_ILL']),
      hygiene: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
      grooming: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']),
      clothing: z.enum(['APPROPRIATE', 'SOMEWHAT_INAPPROPRIATE', 'INAPPROPRIATE']),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    }),
    
    behaviorObservations: z.object({
      eyeContact: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'AVOIDANT']),
      socialInteraction: z.enum(['APPROPRIATE', 'SOMEWHAT_INAPPROPRIATE', 'INAPPROPRIATE']),
      activityLevel: z.enum(['HYPERACTIVE', 'NORMAL', 'SLOW', 'LEthargic']),
      mood: z.enum(['EUPHORIC', 'ELEVATED', 'NORMAL', 'DEPRESSED', 'IRRITABLE', 'ANXIOUS']),
      affect: z.enum(['CONGRUENT', 'INCONGRUENT', 'FLAT', 'BLUNTED', 'LABILE']),
      speech: z.enum(['NORMAL', 'RAPID', 'SLOW', 'PRESSURED', 'MUTED']),
      thoughtProcess: z.enum(['LOGICAL', 'TANGENTIAL', 'CIRCUMSTANTIAL', 'FLIGHT_OF_IDEAS', 'LOOSE_ASSOCIATIONS']),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    }),
    
    cognitiveAssessment: z.object({
      orientation: z.object({
        person: z.boolean(),
        place: z.boolean(),
        time: z.boolean(),
        situation: z.boolean()
      }),
      attention: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'SEVERELY_IMPAIRED']),
      concentration: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'SEVERELY_IMPAIRED']),
      memory: z.object({
        immediate: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'SEVERELY_IMPAIRED']),
        shortTerm: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'SEVERELY_IMPAIRED']),
        longTerm: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'SEVERELY_IMPAIRED'])
      }),
      insight: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'ABSENT']),
      judgment: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'SEVERELY_IMPAIRED']),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    })
  }),
  
  // Vital Signs and Measurements
  vitalSigns: z.object({
    height: vitalSignSchema.optional(),
    weight: vitalSignSchema.optional(),
    bloodPressure: z.object({
      systolic: z.number().min(50, 'Systolic pressure too low').max(250, 'Systolic pressure too high').optional(),
      diastolic: z.number().min(30, 'Diastolic pressure too low').max(150, 'Diastolic pressure too high').optional()
    }).optional(),
    heartRate: z.number().min(30, 'Heart rate too low').max(200, 'Heart rate too high').optional(),
    temperature: z.number().min(95, 'Temperature too low').max(110, 'Temperature too high').multipleOf(0.1).optional(),
    respiratoryRate: z.number().min(8, 'Respiratory rate too low').max(40, 'Respiratory rate too high').optional(),
    oxygenSaturation: z.number().min(70, 'Oxygen saturation too low').max(100, 'Oxygen saturation too high').optional(),
    painScale: z.number().min(0, 'Pain scale cannot be negative').max(10, 'Pain scale cannot exceed 10').optional(),
    notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
  }),
  
  // Medical History Review
  medicalHistoryReview: z.object({
    currentMedications: z.array(z.object({
      name: medicationSchema,
      dosage: dosageSchema,
      frequency: frequencySchema,
      prescribedBy: z.string().max(100, 'Prescriber name cannot exceed 100 characters').optional(),
      startDate: dateConsistencySchema.optional(),
      effectiveness: z.enum(['VERY_EFFECTIVE', 'SOMEWHAT_EFFECTIVE', 'NEUTRAL', 'SOMEWHAT_INEFFECTIVE', 'INEFFECTIVE']).optional(),
      sideEffects: z.string().max(500, 'Side effects cannot exceed 500 characters').optional(),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    })).optional(),
    
    allergies: z.array(z.object({
      allergen: z.string().min(1, 'Allergen is required').max(100, 'Allergen cannot exceed 100 characters'),
      reaction: z.string().min(1, 'Reaction is required').max(200, 'Reaction cannot exceed 200 characters'),
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING']),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    })).optional(),
    
    pastMedicalHistory: z.array(z.object({
      condition: medicalTermSchema,
      diagnosisDate: dateConsistencySchema.optional(),
      treatment: z.string().max(200, 'Treatment cannot exceed 200 characters').optional(),
      outcome: z.enum(['RESOLVED', 'IMPROVED', 'STABLE', 'WORSENED', 'ONGOING']).optional(),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    })).optional(),
    
    familyHistory: z.array(z.object({
      condition: medicalTermSchema,
      relationship: z.string().min(1, 'Relationship is required').max(50, 'Relationship cannot exceed 50 characters'),
      ageOfOnset: z.number().min(0, 'Age of onset cannot be negative').max(120, 'Age of onset cannot exceed 120').optional(),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    })).optional()
  }),
  
  // Mental Health Assessment
  mentalHealthAssessment: z.object({
    moodDisorders: z.object({
      depression: z.object({
        present: z.boolean(),
        severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
        duration: z.string().max(100, 'Duration cannot exceed 100 characters').optional(),
        symptoms: z.array(z.string().max(100, 'Symptom cannot exceed 100 characters')).optional(),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
      }),
      anxiety: z.object({
        present: z.boolean(),
        severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
        duration: z.string().max(100, 'Duration cannot exceed 100 characters').optional(),
        symptoms: z.array(z.string().max(100, 'Symptom cannot exceed 100 characters')).optional(),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
      }),
      bipolar: z.object({
        present: z.boolean(),
        type: z.enum(['TYPE_I', 'TYPE_II', 'CYCLOTHYMIC']).optional(),
        severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
      })
    }),
    
    anxietyDisorders: z.object({
      generalizedAnxiety: z.object({
        present: z.boolean(),
        severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
        duration: z.string().max(100, 'Duration cannot exceed 100 characters').optional(),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
      }),
      panicDisorder: z.object({
        present: z.boolean(),
        frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
        severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
      }),
      socialAnxiety: z.object({
        present: z.boolean(),
        severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
        impact: z.enum(['MINIMAL', 'SOME', 'SIGNIFICANT', 'SEVERE']).optional(),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
      })
    }),
    
    behavioralDisorders: z.object({
      adhd: z.object({
        present: z.boolean(),
        type: z.enum(['INATTENTIVE', 'HYPERACTIVE_IMPULSIVE', 'COMBINED']).optional(),
        severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
        symptoms: z.array(z.string().max(100, 'Symptom cannot exceed 100 characters')).optional(),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
      }),
      odd: z.object({
        present: z.boolean(),
        severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
        duration: z.string().max(100, 'Duration cannot exceed 100 characters').optional(),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
      }),
      conductDisorder: z.object({
        present: z.boolean(),
        severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
        behaviors: z.array(z.string().max(100, 'Behavior cannot exceed 100 characters')).optional(),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
      })
    }),
    
    developmentalDisorders: z.object({
      autism: z.object({
        present: z.boolean(),
        severity: z.enum(['LEVEL_1', 'LEVEL_2', 'LEVEL_3']).optional(),
        symptoms: z.array(z.string().max(100, 'Symptom cannot exceed 100 characters')).optional(),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
      }),
      learningDisabilities: z.array(z.object({
        type: z.string().min(1, 'Type is required').max(100, 'Type cannot exceed 100 characters'),
        severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
        accommodations: z.string().max(200, 'Accommodations cannot exceed 200 characters').optional(),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
      })).optional(),
      intellectualDisability: z.object({
        present: z.boolean(),
        severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'PROFOUND']).optional(),
        iqRange: z.string().max(50, 'IQ range cannot exceed 50 characters').optional(),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
      })
    })
  }),
  
  // Risk Assessment
  riskAssessment: z.object({
    suicideRisk: z.object({
      present: z.boolean(),
      severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'IMMINENT']).optional(),
      ideation: z.boolean().optional(),
      plan: z.boolean().optional(),
      means: z.boolean().optional(),
      intent: z.boolean().optional(),
      protectiveFactors: z.array(z.string().max(100, 'Protective factor cannot exceed 100 characters')).optional(),
      riskFactors: z.array(z.string().max(100, 'Risk factor cannot exceed 100 characters')).optional(),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    }),
    
    selfHarm: z.object({
      present: z.boolean(),
      severity: z.enum(['LOW', 'MODERATE', 'HIGH']).optional(),
      methods: z.array(z.string().max(100, 'Method cannot exceed 100 characters')).optional(),
      frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    }),
    
    violenceRisk: z.object({
      present: z.boolean(),
      severity: z.enum(['LOW', 'MODERATE', 'HIGH']).optional(),
      targets: z.array(z.string().max(100, 'Target cannot exceed 100 characters')).optional(),
      triggers: z.array(z.string().max(100, 'Trigger cannot exceed 100 characters')).optional(),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    }),
    
    substanceUse: z.object({
      present: z.boolean(),
      substances: z.array(z.object({
        substance: z.string().min(1, 'Substance is required').max(50, 'Substance cannot exceed 50 characters'),
        frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'RARELY']).optional(),
        amount: z.string().max(50, 'Amount cannot exceed 50 characters').optional(),
        lastUsed: dateConsistencySchema.optional(),
        notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
      })).optional(),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    })
  }),
  
  // Clinical Impressions
  clinicalImpressions: z.object({
    primaryDiagnosis: z.array(z.object({
      diagnosis: diagnosisSchema,
      code: z.string().max(20, 'Diagnosis code cannot exceed 20 characters').optional(),
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    })).min(1, 'At least one primary diagnosis is required'),
    
    differentialDiagnoses: z.array(z.object({
      diagnosis: diagnosisSchema,
      probability: z.enum(['HIGH', 'MODERATE', 'LOW']).optional(),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    })).optional(),
    
    comorbidities: z.array(z.object({
      condition: diagnosisSchema,
      severity: z.enum(['MILD', 'MODERATE', 'SEVERE']).optional(),
      impact: z.enum(['MINIMAL', 'SOME', 'SIGNIFICANT', 'SEVERE']).optional(),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    })).optional(),
    
    functionalImpairment: z.object({
      social: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE']),
      occupational: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE']),
      academic: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE']),
      dailyLiving: z.enum(['NONE', 'MILD', 'MODERATE', 'SEVERE']),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    }),
    
    prognosis: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'GUARDED']),
    treatmentRecommendations: z.array(z.object({
      treatment: z.string().min(1, 'Treatment is required').max(200, 'Treatment cannot exceed 200 characters'),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      duration: z.string().max(100, 'Duration cannot exceed 100 characters').optional(),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    })).min(1, 'At least one treatment recommendation is required'),
    
    followUpPlan: z.object({
      frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'AS_NEEDED']),
      duration: z.string().max(100, 'Duration cannot exceed 100 characters').optional(),
      goals: z.array(z.string().max(200, 'Goal cannot exceed 200 characters')).optional(),
      notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
    }),
    
    additionalNotes: z.string().max(2000, 'Additional notes cannot exceed 2000 characters').optional()
  })
})

// Complete Therapist Medical Form Schema
export const therapistMedicalFormSchema = z.object({
  // Form Metadata
  formId: z.string().uuid().optional(),
  medicalFormId: z.string().uuid(),
  therapistId: z.string().uuid(),
  
  // Assessment Data
  assessment: therapistAssessmentSchema,
  
  // Form Status
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'APPROVED']).default('DRAFT'),
  
  // Timestamps
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  completedAt: z.date().optional(),
  reviewedAt: z.date().optional(),
  approvedAt: z.date().optional(),
  
  // Review Information
  reviewedBy: z.string().uuid().optional(),
  approvedBy: z.string().uuid().optional(),
  reviewNotes: z.string().max(1000, 'Review notes cannot exceed 1000 characters').optional(),
  approvalNotes: z.string().max(1000, 'Approval notes cannot exceed 1000 characters').optional()
})

export type TherapistAssessment = z.infer<typeof therapistAssessmentSchema>
export type TherapistMedicalForm = z.infer<typeof therapistMedicalFormSchema>


