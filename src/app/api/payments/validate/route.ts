import { NextRequest, NextResponse } from 'next/server'
import { PaymentApiManager, PaymentRequest } from '@/lib/payment-api-manager'
import { z } from 'zod'

const validatePaymentSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  therapistId: z.string().uuid('Invalid therapist ID format'),
  consultationRequestId: z.string().uuid('Invalid consultation request ID format').optional(),
  paymentPlanId: z.string().uuid('Invalid payment plan ID format').optional(),
  amount: z.number().positive('Amount must be greater than 0').max(100000, 'Amount cannot exceed $100,000'),
  paymentMethod: z.enum(['CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'CHECK', 'DEBIT_CARD', 'PAYPAL', 'STRIPE']),
  paymentType: z.enum(['CONSULTATION', 'SESSION', 'EVALUATION', 'TREATMENT', 'PLAN_INSTALLMENT', 'REFUND']),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  reference: z.string().max(100, 'Reference cannot exceed 100 characters').optional(),
  metadata: z.record(z.any()).optional(),
  dueDate: z.string().datetime('Invalid due date format').optional()
})

// POST - Validate payment request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = validatePaymentSchema.safeParse(body)
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
      patientId, 
      therapistId, 
      consultationRequestId, 
      paymentPlanId, 
      amount, 
      paymentMethod, 
      paymentType, 
      description, 
      reference, 
      metadata, 
      dueDate 
    } = validationResult.data
    
    // Create payment request for validation
    const paymentRequest: PaymentRequest = {
      patientId,
      therapistId,
      consultationRequestId,
      paymentPlanId,
      amount,
      paymentMethod,
      paymentType,
      description,
      reference,
      metadata,
      dueDate: dueDate ? new Date(dueDate) : undefined
    }
    
    // Validate payment request
    const validation = await PaymentApiManager.validatePaymentRequest(paymentRequest)
    
    return NextResponse.json({
      success: true,
      data: validation,
      message: validation.isValid ? 'Payment request is valid' : 'Payment request validation failed'
    })
    
  } catch (error) {
    console.error('Error validating payment:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate payment request' 
      },
      { status: 500 }
    )
  }
}


