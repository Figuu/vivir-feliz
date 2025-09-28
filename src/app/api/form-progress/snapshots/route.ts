import { NextRequest, NextResponse } from 'next/server'
import { FormProgressTracker, type FormType } from '@/lib/form-progress-tracker'
import { z } from 'zod'

const getSnapshotsQuerySchema = z.object({
  formType: z.enum(['MEDICAL_FORM', 'THERAPIST_FORM']),
  formId: z.string().uuid('Invalid form ID format'),
  userId: z.string().uuid('Invalid user ID format')
})

// GET - Get progress snapshots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = getSnapshotsQuerySchema.safeParse(queryParams)
    
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
    
    // Get progress snapshots
    const snapshots = await FormProgressTracker.getProgressSnapshots(
      formType as FormType,
      formId,
      userId
    )
    
    return NextResponse.json({
      success: true,
      data: snapshots
    })
    
  } catch (error) {
    console.error('Error getting progress snapshots:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get progress snapshots' 
      },
      { status: 500 }
    )
  }
}

