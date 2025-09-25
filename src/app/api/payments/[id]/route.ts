import { NextRequest, NextResponse } from 'next/server'
import { PaymentApiManager, PaymentRequest } from '@/lib/payment-api-manager'
import { z } from 'zod'

const updatePaymentSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0').max(100000, 'Amount cannot exceed $100,000').optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'CHECK', 'DEBIT_CARD', 'PAYPAL', 'STRIPE']).optional(),
  paymentType: z.enum(['CONSULTATION', 'SESSION', 'EVALUATION', 'TREATMENT', 'PLAN_INSTALLMENT', 'REFUND']).optional(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  reference: z.string().max(100, 'Reference cannot exceed 100 characters').optional(),
  metadata: z.record(z.any()).optional(),
  dueDate: z.string().datetime('Invalid due date format').optional()
})

// GET - Get specific payment
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
        { success: false, error: 'Invalid payment ID format' },
        { status: 400 }
      )
    }
    
    const payment = await PaymentApiManager.getPayment(id)
    
    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: payment
    })
    
  } catch (error) {
    console.error('Error fetching payment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch payment' 
      },
      { status: 500 }
    )
  }
}

// PUT - Update payment
export async function PUT(
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
        { success: false, error: 'Invalid payment ID format' },
        { status: 400 }
      )
    }
    
    // Validate request body
    const validationResult = updatePaymentSchema.safeParse(body)
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
    
    const { 
      amount, 
      paymentMethod, 
      paymentType, 
      description, 
      reference, 
      metadata, 
      dueDate 
    } = validationResult.data
    
    // Build update object
    const updates: Partial<PaymentRequest> = {}
    
    if (amount !== undefined) updates.amount = amount
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod
    if (paymentType !== undefined) updates.paymentType = paymentType
    if (description !== undefined) updates.description = description
    if (reference !== undefined) updates.reference = reference
    if (metadata !== undefined) updates.metadata = metadata
    if (dueDate !== undefined) updates.dueDate = new Date(dueDate)
    
    // Update payment
    const updatedPayment = await PaymentApiManager.updatePayment(id, updates)
    
    return NextResponse.json({
      success: true,
      data: updatedPayment,
      message: 'Payment updated successfully'
    })
    
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update payment' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Cancel payment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json().catch(() => ({}))
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment ID format' },
        { status: 400 }
      )
    }
    
    const { reason } = body
    
    // Cancel payment
    const result = await PaymentApiManager.cancelPayment(id, reason)
    
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
      message: 'Payment cancelled successfully'
    })
    
  } catch (error) {
    console.error('Error cancelling payment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel payment' 
      },
      { status: 500 }
    )
  }
}