import { z } from "zod"

// Helper functions for validation
const capitalizeName = (name: string) => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const formatPhoneNumber = (phone: string) => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  
  // Return original if not 10 digits
  return phone
}

// Step 1: Personal Information
export const personalInfoSchema = z.object({
  // Parent/Guardian Information
  parentFirstName: z.string()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "First name can only contain letters and spaces")
    .transform(capitalizeName),
  
  parentLastName: z.string()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Last name can only contain letters and spaces")
    .transform(capitalizeName),
  
  parentEmail: z.string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .max(100, "Email must be less than 100 characters"),
  
  parentPhone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 characters")
    .regex(/^[\d\s\(\)\-\+]+$/, "Phone number can only contain digits, spaces, parentheses, hyphens, and plus signs")
    .transform(formatPhoneNumber),
  
  relationshipToChild: z.enum(['parent', 'guardian', 'grandparent', 'other'], {
    message: "Please select your relationship to the child"
  }),
  
  otherRelationship: z.string().optional(),
  
  // Child Information
  childFirstName: z.string()
    .min(2, "Child's first name must be at least 2 characters")
    .max(50, "Child's first name must be less than 50 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Child's first name can only contain letters and spaces")
    .transform(capitalizeName),
  
  childLastName: z.string()
    .min(2, "Child's last name must be at least 2 characters")
    .max(50, "Child's last name must be less than 50 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Child's last name can only contain letters and spaces")
    .transform(capitalizeName),
  
  childDateOfBirth: z.string()
    .min(1, "Child's date of birth is required")
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 0 && age <= 18
    }, "Child must be between 0 and 18 years old"),
  
  childGender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    message: "Please select the child's gender"
  }),
  
  // Address Information
  address: z.string()
    .min(10, "Address must be at least 10 characters")
    .max(200, "Address must be less than 200 characters"),
  
  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City must be less than 50 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "City can only contain letters and spaces")
    .transform(capitalizeName),
  
  state: z.string()
    .min(2, "State must be at least 2 characters")
    .max(50, "State must be less than 50 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "State can only contain letters and spaces")
    .transform(capitalizeName),
  
  zipCode: z.string()
    .min(5, "ZIP code must be at least 5 digits")
    .max(10, "ZIP code must be less than 10 characters")
    .regex(/^\d{5}(-\d{4})?$/, "ZIP code must be in format 12345 or 12345-6789"),
  
  country: z.string()
    .min(2, "Country must be at least 2 characters")
    .max(50, "Country must be less than 50 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Country can only contain letters and spaces")
    .transform(capitalizeName),
}).refine((data) => {
  if (data.relationshipToChild === 'other' && !data.otherRelationship) {
    return false
  }
  return true
}, {
  message: "Please specify your relationship to the child",
  path: ["otherRelationship"]
})

// Step 2: Consultation Details
export const consultationDetailsSchema = z.object({
  consultationReason: z.string()
    .min(1, "Please select a consultation reason"),
  
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent'], {
    message: "Please select the urgency level"
  }),
  
  preferredSpecialty: z.string()
    .min(1, "Please select a preferred specialty"),
  
  preferredTherapist: z.string().optional(),
  
  preferredDate: z.string()
    .min(1, "Please select a preferred date"),
  
  preferredTime: z.string()
    .min(1, "Please select a preferred time"),
  
  alternativeDates: z.array(z.string()).optional(),
  
  alternativeTimes: z.array(z.string()).optional(),
  
  // Additional Information
  currentTherapy: z.boolean(),
  
  currentTherapistName: z.string().optional(),
  
  currentTherapistPhone: z.string().optional(),
  
  insuranceProvider: z.string().optional(),
  
  insurancePolicyNumber: z.string().optional(),
  
  // Emergency Contact
  emergencyContactName: z.string()
    .min(2, "Emergency contact name must be at least 2 characters")
    .max(100, "Emergency contact name must be less than 100 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Emergency contact name can only contain letters and spaces")
    .transform(capitalizeName),
  
  emergencyContactPhone: z.string()
    .min(10, "Emergency contact phone must be at least 10 digits")
    .max(15, "Emergency contact phone must be less than 15 characters")
    .regex(/^[\d\s\(\)\-\+]+$/, "Emergency contact phone can only contain digits, spaces, parentheses, hyphens, and plus signs")
    .transform(formatPhoneNumber),
  
  emergencyContactRelationship: z.string()
    .min(2, "Emergency contact relationship must be at least 2 characters")
    .max(50, "Emergency contact relationship must be less than 50 characters")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Emergency contact relationship can only contain letters and spaces")
    .transform(capitalizeName),
}).refine((data) => {
  if (data.currentTherapy && !data.currentTherapistName) {
    return false
  }
  return true
}, {
  message: "Please provide the current therapist's name",
  path: ["currentTherapistName"]
}).refine((data) => {
  if (data.currentTherapy && !data.currentTherapistPhone) {
    return false
  }
  return true
}, {
  message: "Please provide the current therapist's phone number",
  path: ["currentTherapistPhone"]
})

// Step 3: Child's Information
export const childInfoSchema = z.object({
  // Medical Information
  medicalConditions: z.string()
    .max(1000, "Medical conditions description must be less than 1000 characters")
    .optional(),
  
  medications: z.string()
    .max(1000, "Medications description must be less than 1000 characters")
    .optional(),
  
  allergies: z.string()
    .max(500, "Allergies description must be less than 500 characters")
    .optional(),
  
  // Developmental Information
  developmentalMilestones: z.string()
    .max(1000, "Developmental milestones description must be less than 1000 characters")
    .optional(),
  
  schoolInformation: z.string()
    .max(1000, "School information must be less than 1000 characters")
    .optional(),
  
  // Behavioral Information
  behavioralConcerns: z.string()
    .min(10, "Please provide at least 10 characters describing behavioral concerns")
    .max(2000, "Behavioral concerns description must be less than 2000 characters"),
  
  triggers: z.string()
    .max(1000, "Triggers description must be less than 1000 characters")
    .optional(),
  
  copingStrategies: z.string()
    .max(1000, "Coping strategies description must be less than 1000 characters")
    .optional(),
  
  // Family Information
  familyHistory: z.string()
    .max(1000, "Family history description must be less than 1000 characters")
    .optional(),
  
  familyChanges: z.string()
    .max(1000, "Family changes description must be less than 1000 characters")
    .optional(),
  
  // Goals and Expectations
  therapyGoals: z.string()
    .min(10, "Please provide at least 10 characters describing therapy goals")
    .max(1500, "Therapy goals description must be less than 1500 characters"),
  
  expectations: z.string()
    .max(1000, "Expectations description must be less than 1000 characters")
    .optional(),
  
  // Additional Information
  additionalInformation: z.string()
    .max(2000, "Additional information must be less than 2000 characters")
    .optional(),
})

// Complete consultation form schema
export const consultationFormSchema = z.object({
  personalInfo: personalInfoSchema,
  consultationDetails: consultationDetailsSchema,
  childInfo: childInfoSchema,
})

// Individual step schemas for multi-step form
export const consultationStepSchemas = {
  personalInfo: personalInfoSchema,
  consultationDetails: consultationDetailsSchema,
  childInfo: childInfoSchema,
}

// Type exports
export type PersonalInfoFormData = z.infer<typeof personalInfoSchema>
export type ConsultationDetailsFormData = z.infer<typeof consultationDetailsSchema>
export type ChildInfoFormData = z.infer<typeof childInfoSchema>
export type ConsultationFormData = z.infer<typeof consultationFormSchema>

// Validation helper functions
export const validateConsultationStep = (step: keyof typeof consultationStepSchemas, data: any) => {
  try {
    const schema = consultationStepSchemas[step]
    const result = schema.parse(data)
    return { success: true, data: result, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, data: null, errors: error.flatten().fieldErrors }
    }
    return { success: false, data: null, errors: { general: ['An unexpected error occurred'] } }
  }
}

export const validateCompleteConsultationForm = (data: any) => {
  try {
    const result = consultationFormSchema.parse(data)
    return { success: true, data: result, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, data: null, errors: error.flatten().fieldErrors }
    }
    return { success: false, data: null, errors: { general: ['An unexpected error occurred'] } }
  }
}


