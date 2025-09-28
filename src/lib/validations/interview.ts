import { z } from "zod"

// Helper functions for validation (reusing from consultation)
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

// Step 1: Basic Information (simplified from consultation)
export const basicInfoSchema = z.object({
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
    required_error: "Please select your relationship to the child"
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
    required_error: "Please select the child's gender"
  }),
  
  // Basic Address Information
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
}).refine((data) => {
  if (data.relationshipToChild === 'other' && !data.otherRelationship) {
    return false
  }
  return true
}, {
  message: "Please specify your relationship to the child",
  path: ["otherRelationship"]
})

// Step 2: Interview Preferences (simplified)
export const interviewPreferencesSchema = z.object({
  // Basic reason for interview
  reasonForInterview: z.string()
    .min(10, "Please provide at least 10 characters describing your reason for the interview")
    .max(500, "Reason must be less than 500 characters"),
  
  // Preferred time slots (more flexible than consultation)
  preferredTimeOfDay: z.enum(['morning', 'afternoon', 'evening', 'any'], {
    required_error: "Please select your preferred time of day"
  }),
  
  preferredDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']))
    .min(1, "Please select at least one preferred day")
    .max(7, "Please select no more than 7 days"),
  
  // Contact preferences
  preferredContactMethod: z.enum(['phone', 'email', 'either'], {
    required_error: "Please select your preferred contact method"
  }),
  
  bestTimeToContact: z.string()
    .min(1, "Please specify the best time to contact you"),
  
  // Basic urgency
  urgencyLevel: z.enum(['low', 'medium', 'high'], {
    required_error: "Please select the urgency level"
  }),
  
  // Current situation
  currentlyReceivingTherapy: z.boolean(),
  
  currentTherapistName: z.string().optional(),
  
  // Goals
  whatHopingToLearn: z.string()
    .min(10, "Please provide at least 10 characters describing what you hope to learn")
    .max(1000, "Response must be less than 1000 characters"),
}).refine((data) => {
  if (data.currentlyReceivingTherapy && !data.currentTherapistName) {
    return false
  }
  return true
}, {
  message: "Please provide the current therapist's name",
  path: ["currentTherapistName"]
})

// Step 3: Child Concerns (simplified)
export const childConcernsSchema = z.object({
  // Main concerns
  mainConcerns: z.string()
    .min(20, "Please provide at least 20 characters describing your main concerns")
    .max(1500, "Main concerns must be less than 1500 characters"),
  
  // When did concerns start
  whenConcernsStarted: z.string()
    .min(1, "Please specify when the concerns started"),
  
  // Impact on daily life
  impactOnDailyLife: z.string()
    .min(10, "Please describe how this impacts daily life")
    .max(1000, "Impact description must be less than 1000 characters"),
  
  // What has been tried
  whatHasBeenTried: z.string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  
  // School/behavioral information
  schoolBehavior: z.string()
    .max(1000, "School behavior description must be less than 1000 characters")
    .optional(),
  
  // Family situation
  familySituation: z.string()
    .max(1000, "Family situation description must be less than 1000 characters")
    .optional(),
  
  // Additional information
  additionalInformation: z.string()
    .max(1000, "Additional information must be less than 1000 characters")
    .optional(),
})

// Complete interview form schema
export const interviewFormSchema = z.object({
  basicInfo: basicInfoSchema,
  interviewPreferences: interviewPreferencesSchema,
  childConcerns: childConcernsSchema,
})

// Individual step schemas for multi-step form
export const interviewStepSchemas = {
  basicInfo: basicInfoSchema,
  interviewPreferences: interviewPreferencesSchema,
  childConcerns: childConcernsSchema,
}

// Type exports
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>
export type InterviewPreferencesFormData = z.infer<typeof interviewPreferencesSchema>
export type ChildConcernsFormData = z.infer<typeof childConcernsSchema>
export type InterviewFormData = z.infer<typeof interviewFormSchema>

// Validation helper functions
export const validateInterviewStep = (step: keyof typeof interviewStepSchemas, data: any) => {
  try {
    const schema = interviewStepSchemas[step]
    const result = schema.parse(data)
    return { success: true, data: result, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, data: null, errors: error.flatten().fieldErrors }
    }
    return { success: false, data: null, errors: { general: ['An unexpected error occurred'] } }
  }
}

export const validateCompleteInterviewForm = (data: any) => {
  try {
    const result = interviewFormSchema.parse(data)
    return { success: true, data: result, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, data: null, errors: error.flatten().fieldErrors }
    }
    return { success: false, data: null, errors: { general: ['An unexpected error occurred'] } }
  }
}


