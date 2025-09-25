import { NextRequest, NextResponse } from 'next/server'
import { PaymentTimeoutManager } from '@/lib/payment-timeout-manager'

// POST - Process expired timeouts
export async function POST(request: NextRequest) {
  try {
    // Process expired timeouts
    const result = await PaymentTimeoutManager.processExpiredTimeouts()
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Processed ${result.processed} expired timeouts, cancelled ${result.cancelled} payments`
    })
    
  } catch (error) {
    console.error('Error processing expired timeouts:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process expired timeouts' 
      },
      { status: 500 }
    )
  }
}
