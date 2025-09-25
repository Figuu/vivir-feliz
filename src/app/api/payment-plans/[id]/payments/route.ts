import { NextRequest, NextResponse } from 'next/server'
import { PaymentPlanManager } from '@/lib/payment-plan-manager'
import { z } from 'zod'

const recordPaymentSchema = z.object({
  installmentNumber: z.number().int().positive('Installment number must be positive'),
  paymentId: z.string().uuid('Invalid payment ID'),
  paidDate: z.string().datetime('Invalid paid date format'),
  notes: z.string().max(500, 'Notes too long').optional()
})

// POST - Record payment for an installment
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
        { success: false, error: 'Invalid payment plan ID format' },
        { status: 400 }
      )
    }
    
    // Validate request body
    const validationResult = recordPaymentSchema.safeParse(body)
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
    
    const { installmentNumber, paymentId, paidDate, notes } = validationResult.data
    
    // Record payment
    const result = await PaymentPlanManager.recordPayment(
      id,
      installmentNumber,
      paymentId,
      new Date(paidDate),
      notes
    )
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Payment recorded successfully'
    })
    
  } catch (error) {
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to record payment' 
      },
      { status: 500 }
    )
  }
}
