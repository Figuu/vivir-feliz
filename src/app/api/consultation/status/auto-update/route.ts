import { NextRequest, NextResponse } from 'next/server'
import { ConsultationStatusTracker } from '@/lib/consultation-status-tracker'

// POST - Trigger automatic status updates
export async function POST(request: NextRequest) {
  try {
    // Perform automatic status updates
    const result = await ConsultationStatusTracker.autoUpdateStatuses()
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Auto-update completed. Updated ${result.updated} consultations.`
    })
    
  } catch (error) {
    console.error('Error in automatic status update:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform automatic status updates' 
      },
      { status: 500 }
    )
  }
}

// GET - Get consultations that need status updates
export async function GET(request: NextRequest) {
  try {
    const consultations = await ConsultationStatusTracker.getConsultationsNeedingUpdates()
    
    return NextResponse.json({
      success: true,
      data: consultations
    })
    
  } catch (error) {
    console.error('Error getting consultations needing updates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get consultations needing updates' 
      },
      { status: 500 }
    )
  }
}
