import { NextRequest, NextResponse } from 'next/server'
import { TherapistMedicalFormManager } from '@/lib/therapist-medical-form-manager'
import { z } from 'zod'

const approveTherapistFormSchema = z.object({
  approvedBy: z.string().uuid('Invalid user ID format'),
  approvalNotes: z.string().max(1000, 'Approval notes cannot exceed 1000 characters').optional()
})

// POST - Approve therapist medical form
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
    const validationResult = approveTherapistFormSchema.safeParse(body)
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
    
    const { approvedBy, approvalNotes } = validationResult.data
    
    // Approve therapist form
    const form = await TherapistMedicalFormManager.approveTherapistForm(id, approvedBy, approvalNotes)
    
    return NextResponse.json({
      success: true,
      data: form,
      message: 'Therapist medical form approved successfully'
    })
    
  } catch (error) {
    console.error('Error approving therapist medical form:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to approve therapist medical form' 
      },
      { status: 500 }
    )
  }
}


