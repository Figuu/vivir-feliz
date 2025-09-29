import { NextRequest, NextResponse } from 'next/server'
import { MedicalFormManager } from '@/lib/medical-form-manager-fixed'

// GET - Get form progress
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
    
    const progress = await MedicalFormManager.getFormProgress(id)
    
    return NextResponse.json({
      success: true,
      data: progress
    })
    
  } catch (error) {
    console.error('Error getting form progress:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get form progress' 
      },
      { status: 500 }
    )
  }
}


