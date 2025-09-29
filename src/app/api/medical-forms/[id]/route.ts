import { NextRequest, NextResponse } from 'next/server'
import { MedicalFormManager } from '@/lib/medical-form-manager-fixed'

// GET - Get specific medical form
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
    
    const form = await MedicalFormManager.getMedicalForm(id)
    
    if (!form) {
      return NextResponse.json(
        { success: false, error: 'Medical form not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: form
    })
    
  } catch (error) {
    console.error('Error fetching medical form:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch medical form' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete medical form
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
    
    const success = await MedicalFormManager.deleteMedicalForm(id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete medical form' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Medical form deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting medical form:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete medical form' 
      },
      { status: 500 }
    )
  }
}


