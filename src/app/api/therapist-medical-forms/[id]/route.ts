import { NextRequest, NextResponse } from 'next/server'
import { TherapistMedicalFormManager } from '@/lib/therapist-medical-form-manager'

// GET - Get specific therapist medical form
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
    
    const form = await TherapistMedicalFormManager.getTherapistForm(id)
    
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Therapist medical form not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: form
    })
    
  } catch (error) {
    console.error('Error fetching therapist medical form:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch therapist medical form' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete therapist medical form
export async function DELETE(
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
    
    const success = await TherapistMedicalFormManager.deleteTherapistForm(id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete therapist medical form' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Therapist medical form deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting therapist medical form:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete therapist medical form' 
      },
      { status: 500 }
    )
  }
}


