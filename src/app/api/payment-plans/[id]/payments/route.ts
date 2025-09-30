import { NextRequest, NextResponse } from 'next/server'
import { PaymentPlanManager } from '@/lib/payment-plan-manager'
import { db } from '@/lib/db'
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
    
    // Check if payment plan exists
    const paymentPlan = await db.paymentPlan.findUnique({
      where: { id }
    })
    
    if (!paymentPlan) {
      return NextResponse.json(
        { success: false, error: 'Payment plan not found' },
        { status: 404 }
      )
    }
    
    // Record payment - update the payment with plan reference
    const payment = await db.payment.update({
      where: { id: paymentId },
      data: {
        paymentPlanId: id,
        paymentDate: new Date(paidDate),
        notes: notes || null
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: payment.id,
        installmentNumber,
        paymentPlanId: id,
        paymentDate: payment.paymentDate,
        amount: payment.amount.toNumber(),
        status: payment.status,
        notes: payment.notes
      },
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


