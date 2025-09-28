import { NextRequest, NextResponse } from 'next/server'
import { TherapistMedicalFormManager } from '@/lib/therapist-medical-form-manager'
import { z } from 'zod'

const createTherapistFormSchema = z.object({
  medicalFormId: z.string().uuid('Invalid medical form ID format'),
  therapistId: z.string().uuid('Invalid therapist ID format')
})

const updateTherapistFormSchema = z.object({
  formId: z.string().uuid('Invalid form ID format'),
  assessment: z.record(z.any(), 'Assessment data must be an object'),
  userId: z.string().uuid('Invalid user ID format').optional()
})

const completeTherapistFormSchema = z.object({
  formId: z.string().uuid('Invalid form ID format'),
  assessment: z.record(z.any(), 'Assessment data must be an object'),
  completedBy: z.string().uuid('Invalid user ID format')
})

const submitForReviewSchema = z.object({
  formId: z.string().uuid('Invalid form ID format'),
  submittedBy: z.string().uuid('Invalid user ID format')
})

const getTherapistFormsQuerySchema = z.object({
  medicalFormId: z.string().uuid().optional(),
  therapistId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'APPROVED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20)
})

// POST - Create therapist medical form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = createTherapistFormSchema.safeParse(body)
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
    
    const { medicalFormId, therapistId } = validationResult.data
    
    // Create therapist medical form
    const form = await TherapistMedicalFormManager.createTherapistForm(medicalFormId, therapistId)
    
    return NextResponse.json({
      success: true,
      data: form,
      message: 'Therapist medical form created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating therapist medical form:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create therapist medical form' 
      },
      { status: 500 }
    )
  }
}

// GET - Get therapist medical forms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = getTherapistFormsQuerySchema.safeParse(queryParams)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }
    
    const {
      medicalFormId,
      therapistId,
      status,
      startDate,
      endDate,
      page,
      limit
    } = validationResult.data
    
    // For now, return mock data since we don't have a list method in the manager
    // In a real implementation, you would add a list method to TherapistMedicalFormManager
    const mockForms = [
      {
        formId: '550e8400-e29b-41d4-a716-446655440000',
        medicalFormId: medicalFormId || '550e8400-e29b-41d4-a716-446655440001',
        therapistId: therapistId || '550e8400-e29b-41d4-a716-446655440002',
        status: status || 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    // Apply filters
    let filteredForms = mockForms
    
    if (medicalFormId) {
      filteredForms = filteredForms.filter(form => form.medicalFormId === medicalFormId)
    }
    
    if (therapistId) {
      filteredForms = filteredForms.filter(form => form.therapistId === therapistId)
    }
    
    if (status) {
      filteredForms = filteredForms.filter(form => form.status === status)
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      filteredForms = filteredForms.filter(form => 
        form.createdAt >= start && form.createdAt <= end
      )
    }
    
    // Apply pagination
    const offset = (page - 1) * limit
    const paginatedForms = filteredForms.slice(offset, offset + limit)
    
    return NextResponse.json({
      success: true,
      data: {
        forms: paginatedForms,
        totalCount: filteredForms.length,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(filteredForms.length / limit),
          hasNextPage: page < Math.ceil(filteredForms.length / limit),
          hasPrevPage: page > 1
        }
      }
    })
    
  } catch (error) {
    console.error('Error getting therapist medical forms:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get therapist medical forms' 
      },
      { status: 500 }
    )
  }
}

// PUT - Update therapist form
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = updateTherapistFormSchema.safeParse(body)
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
    
    const { formId, assessment, userId } = validationResult.data
    
    // Update therapist form
    const form = await TherapistMedicalFormManager.updateTherapistForm(formId, assessment, userId)
    
    return NextResponse.json({
      success: true,
      data: form,
      message: 'Therapist form updated successfully'
    })
    
  } catch (error) {
    console.error('Error updating therapist form:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update therapist form' 
      },
      { status: 500 }
    )
  }
}

// PATCH - Complete therapist form
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = completeTherapistFormSchema.safeParse(body)
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
    
    const { formId, assessment, completedBy } = validationResult.data
    
    // Complete therapist form
    const form = await TherapistMedicalFormManager.completeTherapistForm(formId, assessment, completedBy)
    
    return NextResponse.json({
      success: true,
      data: form,
      message: 'Therapist form completed successfully'
    })
    
  } catch (error) {
    console.error('Error completing therapist form:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to complete therapist form' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Submit form for review
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = submitForReviewSchema.safeParse(body)
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
    
    const { formId, submittedBy } = validationResult.data
    
    // Submit form for review
    const form = await TherapistMedicalFormManager.submitFormForReview(formId, submittedBy)
    
    return NextResponse.json({
      success: true,
      data: form,
      message: 'Form submitted for review successfully'
    })
    
  } catch (error) {
    console.error('Error submitting form for review:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit form for review' 
      },
      { status: 500 }
    )
  }
}


