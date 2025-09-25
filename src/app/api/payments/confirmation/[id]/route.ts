import { NextRequest, NextResponse } from 'next/server'
import { PaymentConfirmationWorkflow } from '@/lib/payment-confirmation-workflow'

// GET - Get confirmation request details
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
        { success: false, error: 'Invalid confirmation request ID format' },
        { status: 400 }
      )
    }
    
    const confirmationRequest = await PaymentConfirmationWorkflow.getConfirmationRequestDetails(id)
    
    return NextResponse.json({
      success: true,
      data: confirmationRequest
    })
    
  } catch (error) {
    console.error('Error fetching confirmation request details:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch confirmation request details' 
      },
      { status: 500 }
    )
  }
}
