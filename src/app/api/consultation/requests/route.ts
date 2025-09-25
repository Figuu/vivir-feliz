import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TherapistAssignment } from '@/lib/therapist-assignment'
import { z } from 'zod'

// Validation schemas
const consultationRequestSchema = z.object({
  // Patient information
  patientFirstName: z.string().min(1, 'Patient first name is required').max(50, 'First name too long'),
  patientLastName: z.string().min(1, 'Patient last name is required').max(50, 'Last name too long'),
  patientDateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  patientGender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  
  // Parent/Guardian information
  parentFirstName: z.string().min(1, 'Parent first name is required').max(50, 'First name too long'),
  parentLastName: z.string().min(1, 'Parent last name is required').max(50, 'Last name too long'),
  parentEmail: z.string().email('Invalid email format'),
  parentPhone: z.string().regex(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, 'Invalid phone format'),
  parentRelationship: z.enum(['MOTHER', 'FATHER', 'GUARDIAN', 'OTHER']),
  
  // Address information
  address: z.string().min(5, 'Address is required').max(200, 'Address too long'),
  city: z.string().min(2, 'City is required').max(50, 'City name too long'),
  state: z.string().min(2, 'State is required').max(50, 'State name too long'),
  zipCode: z.string().regex(/^\d{5}(?:[-\s]\d{4})?$/, 'Invalid ZIP code format'),
  
  // Consultation details
  consultationType: z.enum(['CONSULTATION', 'INTERVIEW']),
  specialtyId: z.string().uuid('Invalid specialty ID'),
  consultationReasonId: z.string().uuid('Invalid consultation reason ID'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  
  // Scheduling
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  preferredTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(480, 'Duration cannot exceed 480 minutes').default(60),
  
  // Additional information
  additionalNotes: z.string().max(1000, 'Notes too long').optional(),
  previousTherapy: z.boolean().default(false),
  previousTherapyDetails: z.string().max(500, 'Previous therapy details too long').optional(),
  
  // Assignment preferences
  preferredTherapistId: z.string().uuid('Invalid therapist ID').optional(),
  excludeTherapistIds: z.array(z.string().uuid('Invalid therapist ID')).optional(),
  
  // Insurance information
  hasInsurance: z.boolean().default(false),
  insuranceProvider: z.string().max(100, 'Insurance provider name too long').optional(),
  insurancePolicyNumber: z.string().max(50, 'Policy number too long').optional(),
  
  // Emergency contact
  emergencyContactName: z.string().min(1, 'Emergency contact name is required').max(100, 'Name too long'),
  emergencyContactPhone: z.string().regex(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, 'Invalid phone format'),
  emergencyContactRelationship: z.string().min(1, 'Emergency contact relationship is required').max(50, 'Relationship too long')
})

const updateConsultationRequestSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  scheduledTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  duration: z.number().min(15).max(480).optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  cancellationReason: z.string().max(500, 'Cancellation reason too long').optional()
})

// GET - Fetch consultation requests with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const offset = (page - 1) * limit
    
    // Filtering
    const status = searchParams.get('status')
    const specialtyId = searchParams.get('specialtyId')
    const therapistId = searchParams.get('therapistId')
    const consultationType = searchParams.get('consultationType')
    const urgency = searchParams.get('urgency')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Build where clause
    const whereClause: any = {}
    
    if (status) {
      whereClause.status = status
    }
    
    if (specialtyId) {
      whereClause.specialtyId = specialtyId
    }
    
    if (therapistId) {
      whereClause.therapistId = therapistId
    }
    
    if (consultationType) {
      whereClause.consultationType = consultationType
    }
    
    if (urgency) {
      whereClause.urgency = urgency
    }
    
    if (startDate || endDate) {
      whereClause.scheduledDate = {}
      if (startDate) {
        whereClause.scheduledDate.gte = new Date(startDate)
      }
      if (endDate) {
        whereClause.scheduledDate.lte = new Date(endDate)
      }
    }
    
    // Build orderBy clause
    const orderBy: any = {}
    orderBy[sortBy] = sortOrder
    
    // Fetch consultation requests
    const [consultationRequests, totalCount] = await Promise.all([
      db.consultationRequest.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true
            }
          },
          parent: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          therapist: {
            select: {
              firstName: true,
              lastName: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          specialty: {
            select: {
              name: true
            }
          },
          consultationReason: {
            select: {
              name: true
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      db.consultationRequest.count({ where: whereClause })
    ])
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1
    
    return NextResponse.json({
      success: true,
      data: {
        consultationRequests,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching consultation requests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch consultation requests' },
      { status: 500 }
    )
  }
}

// POST - Create new consultation request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = consultationRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }
    
    const validatedData = validationResult.data
    
    // Check if date is in the past
    const appointmentDate = new Date(validatedData.preferredDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (appointmentDate < today) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot schedule appointments in the past' 
        },
        { status: 400 }
      )
    }
    
    // Check if patient age is valid
    const patientAge = Math.floor(
      (new Date().getTime() - new Date(validatedData.patientDateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)
    )
    
    if (patientAge < 0 || patientAge > 18) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Patient age must be between 0 and 18 years' 
        },
        { status: 400 }
      )
    }
    
    // Verify specialty and consultation reason exist
    const [specialty, consultationReason] = await Promise.all([
      db.specialty.findUnique({ where: { id: validatedData.specialtyId } }),
      db.consultationReason.findUnique({ where: { id: validatedData.consultationReasonId } })
    ])
    
    if (!specialty) {
      return NextResponse.json(
        { success: false, error: 'Invalid specialty ID' },
        { status: 400 }
      )
    }
    
    if (!consultationReason) {
      return NextResponse.json(
        { success: false, error: 'Invalid consultation reason ID' },
        { status: 400 }
      )
    }
    
    // Check if consultation reason belongs to the specialty
    if (consultationReason.specialtyId !== validatedData.specialtyId) {
      return NextResponse.json(
        { success: false, error: 'Consultation reason does not match selected specialty' },
        { status: 400 }
      )
    }
    
    // Use transaction to create consultation request with automatic therapist assignment
    const result = await db.$transaction(async (tx) => {
      // Create patient
      const patient = await tx.patient.create({
        data: {
          firstName: validatedData.patientFirstName,
          lastName: validatedData.patientLastName,
          dateOfBirth: new Date(validatedData.patientDateOfBirth),
          gender: validatedData.patientGender
        }
      })
      
      // Create parent/guardian
      const parent = await tx.parent.create({
        data: {
          firstName: validatedData.parentFirstName,
          lastName: validatedData.parentLastName,
          email: validatedData.parentEmail,
          phone: validatedData.parentPhone,
          relationship: validatedData.parentRelationship,
          address: validatedData.address,
          city: validatedData.city,
          state: validatedData.state,
          zipCode: validatedData.zipCode,
          emergencyContactName: validatedData.emergencyContactName,
          emergencyContactPhone: validatedData.emergencyContactPhone,
          emergencyContactRelationship: validatedData.emergencyContactRelationship
        }
      })
      
      // Link patient to parent
      await tx.patient.update({
        where: { id: patient.id },
        data: { parentId: parent.id }
      })
      
      // Create consultation request
      const consultationRequest = await tx.consultationRequest.create({
        data: {
          consultationType: validatedData.consultationType,
          specialtyId: validatedData.specialtyId,
          consultationReasonId: validatedData.consultationReasonId,
          urgency: validatedData.urgency,
          preferredDate: new Date(validatedData.preferredDate),
          preferredTime: validatedData.preferredTime,
          duration: validatedData.duration,
          additionalNotes: validatedData.additionalNotes,
          previousTherapy: validatedData.previousTherapy,
          previousTherapyDetails: validatedData.previousTherapyDetails,
          hasInsurance: validatedData.hasInsurance,
          insuranceProvider: validatedData.insuranceProvider,
          insurancePolicyNumber: validatedData.insurancePolicyNumber,
          patientId: patient.id,
          parentId: parent.id,
          status: 'PENDING'
        }
      })
      
      // Attempt automatic therapist assignment
      let assignedTherapist = null
      if (validatedData.preferredDate && validatedData.preferredTime) {
        try {
          const assignmentResult = await TherapistAssignment.assignTherapist({
            specialtyId: validatedData.specialtyId,
            date: validatedData.preferredDate,
            time: validatedData.preferredTime,
            duration: validatedData.duration,
            patientAge: patientAge,
            patientGender: validatedData.patientGender,
            urgency: validatedData.urgency,
            preferredTherapistId: validatedData.preferredTherapistId,
            excludeTherapistIds: validatedData.excludeTherapistIds,
            maxWorkload: 8
          })
          
          if (assignmentResult.assignedTherapist) {
            // Update consultation request with assigned therapist
            await tx.consultationRequest.update({
              where: { id: consultationRequest.id },
              data: {
                therapistId: assignmentResult.assignedTherapist.therapistId,
                scheduledDate: new Date(validatedData.preferredDate),
                scheduledTime: validatedData.preferredTime,
                status: 'CONFIRMED'
              }
            })
            
            assignedTherapist = assignmentResult.assignedTherapist
          }
        } catch (assignmentError) {
          console.error('Therapist assignment failed:', assignmentError)
          // Continue without assignment - request remains PENDING
        }
      }
      
      return {
        consultationRequest,
        patient,
        parent,
        assignedTherapist
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        consultationRequest: result.consultationRequest,
        patient: result.patient,
        parent: result.parent,
        assignedTherapist: result.assignedTherapist,
        message: result.assignedTherapist 
          ? 'Consultation request created and therapist assigned successfully'
          : 'Consultation request created successfully. Therapist assignment pending.'
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating consultation request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create consultation request' },
      { status: 500 }
    )
  }
}
