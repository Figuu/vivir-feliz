import { NextRequest, NextResponse } from 'next/server'
import { PaymentStatusTracker } from '@/lib/payment-status-tracker'

// POST - Trigger automatic payment status updates
export async function POST(request: NextRequest) {
  try {
    // Perform automatic payment status updates
    const result = await PaymentStatusTracker.autoUpdatePaymentStatuses()
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Auto-update completed. Updated ${result.updated} payments.`
    })
    
  } catch (error) {
    console.error('Error in automatic payment status update:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to perform automatic payment status updates' 
      },
      { status: 500 }
    )
  }
}

// GET - Get payments that need status updates
export async function GET(request: NextRequest) {
  try {
    const payments = await PaymentStatusTracker.getPaymentsRequiringAttention()
    
    return NextResponse.json({
      success: true,
      data: payments
    })
    
  } catch (error) {
    console.error('Error getting payments needing updates:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payments needing updates' 
      },
      { status: 500 }
    )
  }
}
