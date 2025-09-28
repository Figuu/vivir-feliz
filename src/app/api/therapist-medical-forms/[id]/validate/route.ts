import { NextRequest, NextResponse } from 'next/server'
import { TherapistMedicalFormManager } from '@/lib/therapist-medical-form-manager'

// GET - Validate therapist medical form
export async function GET(
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
    
    const validationResult = await TherapistMedicalFormManager.validateTherapistForm(id)
    
    return NextResponse.json({
      success: true,
      data: validationResult
    })
    
  } catch (error) {
    console.error('Error validating therapist medical form:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate therapist medical form' 
      },
      { status: 500 }
    )
  }
}


