import { NextRequest, NextResponse } from 'next/server'
import { MedicalFormManager } from '@/lib/medical-form-manager-fixed'
import { z } from 'zod'

const getByConsultationSchema = z.object({
  consultationRequestId: z.string().uuid('Invalid consultation request ID format')
})

// GET - Get medical form by consultation request ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = getByConsultationSchema.safeParse(queryParams)
    
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
    
    const { consultationRequestId } = validationResult.data
    
    // Get medical form by consultation request
    const form = await MedicalFormManager.getMedicalFormByConsultationRequest(consultationRequestId)
    
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Medical form not found for this consultation request' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: form
    })
    
  } catch (error) {
    console.error('Error getting medical form by consultation request:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get medical form by consultation request' 
      },
      { status: 500 }
    )
  }
}
