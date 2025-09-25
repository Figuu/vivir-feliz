import { NextRequest, NextResponse } from 'next/server'
import { PaymentApiManager } from '@/lib/payment-api-manager'

// POST - Process payment
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
        { success: false, error: 'Invalid payment ID format' },
        { status: 400 }
      )
    }
    
    // Process payment
    const result = await PaymentApiManager.processPayment(id)
    
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.message,
          details: result.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Payment processed successfully'
    })
    
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process payment' 
      },
      { status: 500 }
    )
  }
}
