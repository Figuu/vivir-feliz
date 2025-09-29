import { NextRequest, NextResponse } from 'next/server'
import { MedicalFormManager, FormStep } from '@/lib/medical-form-manager-fixed'
import { z } from 'zod'

const createFormSchema = z.object({
  consultationRequestId: z.string().uuid('Invalid consultation request ID format'),
  parentId: z.string().uuid('Invalid parent ID format').optional(),
  patientId: z.string().uuid('Invalid patient ID format').optional()
})

const updateStepSchema = z.object({
  formId: z.string().uuid('Invalid form ID format'),
  step: z.number().min(1, 'Step must be at least 1').max(6, 'Step cannot exceed 6'),
  stepData: z.record(z.any(), 'Step data must be an object'),
  userId: z.string().uuid('Invalid user ID format').optional()
})

const autoSaveSchema = z.object({
  formId: z.string().uuid('Invalid form ID format'),
  currentStep: z.number().min(1, 'Step must be at least 1').max(6, 'Step cannot exceed 6'),
  stepData: z.record(z.any(), 'Step data must be an object'),
  completedSteps: z.array(z.number().min(1).max(6), 'Invalid completed steps')
})

const submitForReviewSchema = z.object({
  formId: z.string().uuid('Invalid form ID format'),
  submittedBy: z.string().uuid('Invalid user ID format')
})

const approveFormSchema = z.object({
  formId: z.string().uuid('Invalid form ID format'),
  approvedBy: z.string().uuid('Invalid user ID format'),
  approvalNotes: z.string().max(1000, 'Approval notes cannot exceed 1000 characters').optional()
})

const getFormsQuerySchema = z.object({
  consultationRequestId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'IN_PROGRESS', 'COMPLETED', 'REVIEWED', 'APPROVED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20)
})

// POST - Create medical form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = createFormSchema.safeParse(body)
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
    
    const { consultationRequestId, parentId, patientId } = validationResult.data
    
    // Create medical form
    const form = await MedicalFormManager.createMedicalForm(consultationRequestId, parentId, patientId)
    
    return NextResponse.json({
      success: true,
      data: form,
      message: 'Medical form created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating medical form:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create medical form' 
      },
      { status: 500 }
    )
  }
}

// GET - Get medical forms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = getFormsQuerySchema.safeParse(queryParams)
    
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
      consultationRequestId,
      parentId,
      patientId,
      status,
      startDate,
      endDate,
      page,
      limit
    } = validationResult.data
    
    // Get medical forms using the manager
    const result = await MedicalFormManager.listMedicalForms({
      consultationRequestId,
      parentId,
      patientId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit
    })
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error('Error getting medical forms:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get medical forms' 
      },
      { status: 500 }
    )
  }
}

// PUT - Update form step
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = updateStepSchema.safeParse(body)
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
    
    const { formId, step, stepData, userId } = validationResult.data
    
    // Update form step
    const form = await MedicalFormManager.updateFormStep(formId, step as FormStep, stepData, userId)
    
    return NextResponse.json({
      success: true,
      data: form,
      message: `Form step ${step} updated successfully`
    })
    
  } catch (error) {
    console.error('Error updating form step:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update form step' 
      },
      { status: 500 }
    )
  }
}

// PATCH - Auto-save form
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = autoSaveSchema.safeParse(body)
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
    
    const { formId, currentStep, stepData, completedSteps } = validationResult.data
    
    // Auto-save form
    const autoSaveData = await MedicalFormManager.autoSaveForm(formId, currentStep as FormStep, stepData, completedSteps)
    
    return NextResponse.json({
      success: true,
      data: autoSaveData,
      message: 'Form auto-saved successfully'
    })
    
  } catch (error) {
    console.error('Error auto-saving form:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to auto-save form' 
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
    const form = await MedicalFormManager.submitFormForReview(formId, submittedBy)
    
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


