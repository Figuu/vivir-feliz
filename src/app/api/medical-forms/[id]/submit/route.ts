import { NextRequest, NextResponse } from 'next/server'
import { MedicalFormManager } from '@/lib/medical-form-manager-fixed'
import { z } from 'zod'

const submitFormSchema = z.object({
  submittedBy: z.string().uuid('Invalid user ID format'),
  submissionNotes: z.string().max(1000, 'Submission notes cannot exceed 1000 characters').optional()
})

// POST - Submit medical form for review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid form ID format' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    // Validate request body
    const validationResult = submitFormSchema.safeParse(body)
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
    
    const { submittedBy, submissionNotes } = validationResult.data
    
    // Submit form for review
    const form = await MedicalFormManager.submitFormForReview(id, submittedBy)
    
    return NextResponse.json({
      success: true,
      data: form,
      message: 'Medical form submitted for review successfully'
    })
    
  } catch (error) {
    console.error('Error submitting medical form:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit medical form' 
      },
      { status: 500 }
    )
  }
}
