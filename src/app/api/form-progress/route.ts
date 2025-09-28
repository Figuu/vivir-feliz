import { NextRequest, NextResponse } from 'next/server'
import { FormProgressTracker, type FormType } from '@/lib/form-progress-tracker'
import { z } from 'zod'

const initializeProgressSchema = z.object({
  formType: z.enum(['MEDICAL_FORM', 'THERAPIST_FORM']),
  formId: z.string().uuid('Invalid form ID format'),
  userId: z.string().uuid('Invalid user ID format'),
  totalSteps: z.number().min(1, 'Total steps must be at least 1').max(20, 'Total steps cannot exceed 20'),
  autoSaveEnabled: z.boolean().optional().default(true),
  autoSaveInterval: z.number().min(5000, 'Auto-save interval must be at least 5 seconds').max(300000, 'Auto-save interval cannot exceed 5 minutes').optional().default(30000)
})

const updateProgressSchema = z.object({
  formType: z.enum(['MEDICAL_FORM', 'THERAPIST_FORM']),
  formId: z.string().uuid('Invalid form ID format'),
  userId: z.string().uuid('Invalid user ID format'),
  currentStep: z.number().min(1, 'Current step must be at least 1').max(20, 'Current step cannot exceed 20'),
  completedSteps: z.array(z.number().min(1).max(20), 'Invalid completed steps'),
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

const autoSaveProgressSchema = z.object({
  formType: z.enum(['MEDICAL_FORM', 'THERAPIST_FORM']),
  formId: z.string().uuid('Invalid form ID format'),
  userId: z.string().uuid('Invalid user ID format'),
  currentStep: z.number().min(1, 'Current step must be at least 1').max(20, 'Current step cannot exceed 20'),
  completedSteps: z.array(z.number().min(1).max(20), 'Invalid completed steps'),
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

const markStepCompletedSchema = z.object({
  formType: z.enum(['MEDICAL_FORM', 'THERAPIST_FORM']),
  formId: z.string().uuid('Invalid form ID format'),
  userId: z.string().uuid('Invalid user ID format'),
  step: z.number().min(1, 'Step must be at least 1').max(20, 'Step cannot exceed 20'),
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

const getProgressQuerySchema = z.object({
  formType: z.enum(['MEDICAL_FORM', 'THERAPIST_FORM']),
  formId: z.string().uuid('Invalid form ID format'),
  userId: z.string().uuid('Invalid user ID format')
})

const getProgressSnapshotsQuerySchema = z.object({
  formType: z.enum(['MEDICAL_FORM', 'THERAPIST_FORM']),
  formId: z.string().uuid('Invalid form ID format'),
  userId: z.string().uuid('Invalid user ID format')
})

const resetProgressSchema = z.object({
  formType: z.enum(['MEDICAL_FORM', 'THERAPIST_FORM']),
  formId: z.string().uuid('Invalid form ID format'),
  userId: z.string().uuid('Invalid user ID format')
})

const deleteProgressSchema = z.object({
  formType: z.enum(['MEDICAL_FORM', 'THERAPIST_FORM']),
  formId: z.string().uuid('Invalid form ID format'),
  userId: z.string().uuid('Invalid user ID format')
})

// POST - Initialize progress tracking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = initializeProgressSchema.safeParse(body)
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
    
    const { formType, formId, userId, totalSteps, autoSaveEnabled, autoSaveInterval } = validationResult.data
    
    // Initialize progress tracking
    const progress = await FormProgressTracker.initializeProgress(
      formType as FormType,
      formId,
      userId,
      totalSteps,
      autoSaveEnabled,
      autoSaveInterval
    )
    
    return NextResponse.json({
      success: true,
      data: progress,
      message: 'Progress tracking initialized successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error initializing progress tracking:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to initialize progress tracking' 
      },
      { status: 500 }
    )
  }
}

// GET - Get form progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = getProgressQuerySchema.safeParse(queryParams)
    
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
    
    const { formType, formId, userId } = validationResult.data
    
    // Get form progress
    const progress = await FormProgressTracker.getProgress(
      formType as FormType,
      formId,
      userId
    )
    
    if (!progress) {
      return NextResponse.json(
        { success: false, error: 'Progress tracking not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: progress
    })
    
  } catch (error) {
    console.error('Error getting form progress:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get form progress' 
      },
      { status: 500 }
    )
  }
}

// PUT - Update form progress
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = updateProgressSchema.safeParse(body)
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
    
    const { formType, formId, userId, currentStep, completedSteps, validationState } = validationResult.data
    
    // Update form progress
    const progress = await FormProgressTracker.updateProgress(
      formType as FormType,
      formId,
      userId,
      currentStep,
      completedSteps,
      validationState
    )
    
    return NextResponse.json({
      success: true,
      data: progress,
      message: 'Form progress updated successfully'
    })
    
  } catch (error) {
    console.error('Error updating form progress:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update form progress' 
      },
      { status: 500 }
    )
  }
}

// PATCH - Auto-save form progress
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = autoSaveProgressSchema.safeParse(body)
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
    
    const { formType, formId, userId, currentStep, completedSteps, validationState } = validationResult.data
    
    // Auto-save form progress
    const progress = await FormProgressTracker.autoSaveProgress(
      formType as FormType,
      formId,
      userId,
      currentStep,
      completedSteps,
      validationState
    )
    
    return NextResponse.json({
      success: true,
      data: progress,
      message: 'Form progress auto-saved successfully'
    })
    
  } catch (error) {
    console.error('Error auto-saving form progress:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to auto-save form progress' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Reset or delete form progress
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if it's a reset or delete operation
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'reset'
    
    if (action === 'reset') {
      // Reset progress
      const validationResult = resetProgressSchema.safeParse(body)
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
      
      const { formType, formId, userId } = validationResult.data
      
      // Reset form progress
      const progress = await FormProgressTracker.resetProgress(
        formType as FormType,
        formId,
        userId
      )
      
      return NextResponse.json({
        success: true,
        data: progress,
        message: 'Form progress reset successfully'
      })
      
    } else if (action === 'delete') {
      // Delete progress
      const validationResult = deleteProgressSchema.safeParse(body)
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
      
      const { formType, formId, userId } = validationResult.data
      
      // Delete form progress
      const success = await FormProgressTracker.deleteProgress(
        formType as FormType,
        formId,
        userId
      )
      
      return NextResponse.json({
        success,
        message: success ? 'Form progress deleted successfully' : 'Form progress not found'
      })
      
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "reset" or "delete"' },
        { status: 400 }
      )
    }
    
  } catch (error) {
    console.error('Error with form progress operation:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to perform form progress operation' 
      },
      { status: 500 }
    )
  }
}

