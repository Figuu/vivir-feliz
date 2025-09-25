import { NextRequest, NextResponse } from 'next/server'
import { PaymentPlanManager, PaymentPlanType, PaymentPlanFrequency } from '@/lib/payment-plan-manager'
import { z } from 'zod'

const createPaymentPlanSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  therapistId: z.string().uuid('Invalid therapist ID'),
  serviceId: z.string().uuid('Invalid service ID'),
  planName: z.string().min(1, 'Plan name is required').max(100, 'Plan name too long'),
  planType: z.enum(['MONTHLY', 'QUARTERLY', 'SEMESTER', 'ANNUAL']),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY']),
  totalAmount: z.number().positive('Total amount must be positive'),
  startDate: z.string().datetime('Invalid start date format'),
  autoPay: z.boolean().optional(),
  description: z.string().max(500, 'Description too long').optional(),
  metadata: z.record(z.any()).optional()
})

// POST - Create a new payment plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = createPaymentPlanSchema.safeParse(body)
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
      serviceId, 
      planName, 
      planType, 
      frequency, 
      totalAmount, 
      startDate, 
      autoPay, 
      description, 
      metadata 
    } = validationResult.data
    
    // Create payment plan
    const paymentPlan = await PaymentPlanManager.createPaymentPlan(
      patientId,
      therapistId,
      serviceId,
      {
        planName,
        planType,
        frequency,
        totalAmount,
        startDate: new Date(startDate),
        autoPay,
        description,
        metadata
      }
    )
    
    return NextResponse.json({
      success: true,
      data: paymentPlan,
      message: 'Payment plan created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating payment plan:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create payment plan' 
      },
      { status: 500 }
    )
  }
}

// GET - Get payment plans with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    
    // Filtering
    const patientId = searchParams.get('patientId')
    const therapistId = searchParams.get('therapistId')
    const status = searchParams.get('status')
    const planType = searchParams.get('planType')
    const frequency = searchParams.get('frequency')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Build filters
    const filters: any = {
      page,
      limit
    }
    
    if (patientId) filters.patientId = patientId
    if (therapistId) filters.therapistId = therapistId
    if (status) filters.status = status
    if (planType) filters.planType = planType
    if (frequency) filters.frequency = frequency
    
    if (startDate || endDate) {
      if (!startDate || !endDate) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Both start date and end date are required for date filtering' 
          },
          { status: 400 }
        )
      }
      
      filters.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      }
    }
    
    // Get payment plans
    const result = await PaymentPlanManager.getPaymentPlans(filters)
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error('Error getting payment plans:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payment plans' 
      },
      { status: 500 }
    )
  }
}
