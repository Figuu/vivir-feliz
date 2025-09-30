import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const patientRegistrationSchema = z.object({
  // Personal Information
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .transform(val => val.trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')),
  
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .transform(val => val.trim().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')),
  
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
    .transform(val => new Date(val)),
  
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  
  // Contact Information
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .transform(val => val.trim())
    .optional(),
  
  phone: z.string()
    .regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format')
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional(),
  
  address: z.object({
    street: z.string().max(200, 'Street cannot exceed 200 characters'),
    city: z.string().max(100, 'City cannot exceed 100 characters'),
    state: z.string().max(50, 'State cannot exceed 50 characters'),
    zipCode: z.string().max(20, 'Zip code cannot exceed 20 characters'),
    country: z.string().max(50, 'Country cannot exceed 50 characters').default('USA')
  }),
  
  // Parent/Guardian Information
  parentGuardian: z.object({
    firstName: z.string()
      .min(2, 'Parent first name must be at least 2 characters')
      .max(50, 'Parent first name cannot exceed 50 characters')
      .transform(val => val.trim().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')),
    
    lastName: z.string()
      .min(2, 'Parent last name must be at least 2 characters')
      .max(50, 'Parent last name cannot exceed 50 characters')
      .transform(val => val.trim().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')),
    
    email: z.string()
      .email('Invalid parent email address')
      .toLowerCase()
      .transform(val => val.trim()),
    
    phone: z.string()
      .regex(/^\+?[\d\s-()]+$/, 'Invalid parent phone number format')
      .max(20, 'Parent phone number cannot exceed 20 characters'),
    
    relationship: z.enum(['parent', 'guardian', 'caregiver', 'other']).default('parent'),
    
    occupation: z.string().max(100, 'Occupation cannot exceed 100 characters').optional(),
    
    workPhone: z.string()
      .regex(/^\+?[\d\s-()]+$/, 'Invalid work phone number format')
      .max(20, 'Work phone number cannot exceed 20 characters')
      .optional()
  }),
  
  // Emergency Contact
  emergencyContact: z.object({
    name: z.string()
      .min(2, 'Emergency contact name must be at least 2 characters')
      .max(100, 'Emergency contact name cannot exceed 100 characters')
      .transform(val => val.trim().split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')),
    
    relationship: z.string().max(50, 'Relationship cannot exceed 50 characters'),
    
    phone: z.string()
      .regex(/^\+?[\d\s-()]+$/, 'Invalid emergency phone number format')
      .max(20, 'Emergency phone number cannot exceed 20 characters'),
    
    alternativePhone: z.string()
      .regex(/^\+?[\d\s-()]+$/, 'Invalid alternative phone number format')
      .max(20, 'Alternative phone number cannot exceed 20 characters')
      .optional()
  }),
  
  // Medical Information
  medicalInfo: z.object({
    allergies: z.array(z.string().max(200, 'Allergy description cannot exceed 200 characters')).optional().default([]),
    medications: z.array(z.string().max(200, 'Medication description cannot exceed 200 characters')).optional().default([]),
    medicalConditions: z.array(z.string().max(200, 'Medical condition cannot exceed 200 characters')).optional().default([]),
    primaryPhysician: z.string().max(100, 'Primary physician name cannot exceed 100 characters').optional(),
    primaryPhysicianPhone: z.string()
      .regex(/^\+?[\d\s-()]+$/, 'Invalid physician phone number format')
      .max(20, 'Physician phone cannot exceed 20 characters')
      .optional(),
    insuranceProvider: z.string().max(100, 'Insurance provider cannot exceed 100 characters').optional(),
    insurancePolicyNumber: z.string().max(50, 'Policy number cannot exceed 50 characters').optional()
  }).optional(),
  
  // Educational Information
  educationalInfo: z.object({
    schoolName: z.string().max(100, 'School name cannot exceed 100 characters').optional(),
    gradeLevel: z.string().max(50, 'Grade level cannot exceed 50 characters').optional(),
    specialEducationServices: z.boolean().default(false),
    iepStatus: z.enum(['none', 'active', 'pending', 'completed']).default('none')
  }).optional(),
  
  // Consultation Reason
  consultationReason: z.string()
    .min(10, 'Consultation reason must be at least 10 characters')
    .max(1000, 'Consultation reason cannot exceed 1000 characters')
    .transform(val => val.trim()),
  
  referralSource: z.string().max(100, 'Referral source cannot exceed 100 characters').optional(),
  
  // Consent and Agreements
  consentToTreatment: z.boolean().refine(val => val === true, 'Consent to treatment is required'),
  
  consentToDataSharing: z.boolean().default(false),
  
  privacyPolicyAccepted: z.boolean().refine(val => val === true, 'Privacy policy must be accepted'),
  
  // Administrative
  preferredLanguage: z.enum(['en', 'es', 'fr', 'other']).default('en'),
  
  preferredContactMethod: z.enum(['email', 'phone', 'sms', 'any']).default('any'),
  
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
  
  registeredBy: z.string().uuid('Invalid registrar ID')
})

// POST /api/patient-registration - Register new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = patientRegistrationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if registrar exists
    const registrar = await db.user.findUnique({
      where: { id: validatedData.registeredBy }
    })

    if (!registrar) {
      return NextResponse.json(
        { error: 'Registrar not found' },
        { status: 404 }
      )
    }

    // Validate age
    const age = Math.floor((new Date().getTime() - validatedData.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    
    if (age < 0 || age > 120) {
      return NextResponse.json(
        { error: 'Invalid date of birth' },
        { status: 400 }
      )
    }

    // Check for duplicate patient (same name and DOB)
    const existingPatient = await db.patient.findFirst({
      where: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        dateOfBirth: validatedData.dateOfBirth
      }
    })

    if (existingPatient) {
      return NextResponse.json(
        { error: 'A patient with the same name and date of birth already exists. Please verify the information or contact support.' },
        { status: 409 }
      )
    }

    // Check for duplicate parent email
    if (validatedData.parentGuardian.email) {
      const existingParentUser = await db.user.findUnique({
        where: { email: validatedData.parentGuardian.email }
      })

      // Create parent user if doesn't exist
      if (!existingParentUser) {
        const tempPassword = generateTemporaryPassword()
        const hashedPassword = Buffer.from(tempPassword).toString('base64')
        
        const parentUser = await db.user.create({
          data: {
            email: validatedData.parentGuardian.email,
            password: hashedPassword,
            firstName: validatedData.parentGuardian.firstName,
            lastName: validatedData.parentGuardian.lastName,
            phone: validatedData.parentGuardian.phone,
            role: 'parent',
            status: 'active',
            emailVerified: false,
            createdBy: validatedData.registeredBy
          }
        })

        // TODO: Send welcome email with temporary password
        console.log(`Parent user created with temp password: ${tempPassword}`)
      }
    }

    // Create patient user if email provided
    let patientUserId = null
    if (validatedData.email) {
      const existingPatientUser = await db.user.findUnique({
        where: { email: validatedData.email }
      })

      if (existingPatientUser) {
        patientUserId = existingPatientUser.id
      } else {
        const tempPassword = generateTemporaryPassword()
        const hashedPassword = Buffer.from(tempPassword).toString('base64')
        
        const patientUser = await db.user.create({
          data: {
            email: validatedData.email,
            password: hashedPassword,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            phone: validatedData.phone,
            role: 'patient',
            dateOfBirth: validatedData.dateOfBirth,
            address: `${validatedData.address.street}, ${validatedData.address.city}, ${validatedData.address.state}`,
            emergencyContact: validatedData.emergencyContact,
            status: 'active',
            emailVerified: false,
            createdBy: validatedData.registeredBy
          }
        })

        patientUserId = patientUser.id

        // TODO: Send welcome email
        console.log(`Patient user created with temp password: ${tempPassword}`)
      }
    }

    // Create patient record
    const patient = await db.patient.create({
      data: {
        userId: patientUserId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        dateOfBirth: validatedData.dateOfBirth,
        gender: validatedData.gender,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
        parentGuardian: validatedData.parentGuardian,
        emergencyContact: validatedData.emergencyContact,
        medicalInfo: validatedData.medicalInfo || {},
        educationalInfo: validatedData.educationalInfo || {},
        consultationReason: validatedData.consultationReason,
        referralSource: validatedData.referralSource,
        consentToTreatment: validatedData.consentToTreatment,
        consentToDataSharing: validatedData.consentToDataSharing,
        privacyPolicyAccepted: validatedData.privacyPolicyAccepted,
        preferredLanguage: validatedData.preferredLanguage,
        preferredContactMethod: validatedData.preferredContactMethod,
        status: 'active',
        registrationStatus: 'pending',
        notes: validatedData.notes
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Patient registered successfully',
      data: patient
    }, { status: 201 })

  } catch (error) {
    console.error('Error registering patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate temporary password
function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '@$!%*?&'
  
  let password = ''
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
  password += numbers.charAt(Math.floor(Math.random() * numbers.length))
  password += special.charAt(Math.floor(Math.random() * special.length))
  
  const allChars = uppercase + lowercase + numbers + special
  for (let i = 0; i < 8; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length))
  }
  
  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
