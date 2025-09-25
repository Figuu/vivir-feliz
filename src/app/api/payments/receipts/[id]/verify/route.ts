import { NextRequest, NextResponse } from 'next/server'
import { PaymentReceiptManager } from '@/lib/payment-receipt-manager'
import { z } from 'zod'

const verifyReceiptSchema = z.object({
  isApproved: z.boolean(),
  comments: z.string().max(500, 'Comments too long').optional()
})

// POST - Verify receipt
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid receipt ID format' },
        { status: 400 }
      )
    }
    
    // Validate request body
    const validationResult = verifyReceiptSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }
    
    const { isApproved, comments } = validationResult.data
    
    // Get verified by from request headers (in a real app, this would come from authentication)
    const verifiedBy = request.headers.get('x-user-id') || 'system'
    
    // Verify receipt
    const receipt = await PaymentReceiptManager.verifyReceipt(id, verifiedBy, isApproved, comments)
    
    return NextResponse.json({
      success: true,
      data: receipt,
      message: `Receipt ${isApproved ? 'approved' : 'rejected'} successfully`
    })
    
  } catch (error) {
    console.error('Error verifying receipt:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to verify receipt' 
      },
      { status: 500 }
    )
  }
}
