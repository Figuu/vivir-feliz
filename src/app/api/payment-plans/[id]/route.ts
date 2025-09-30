import { NextRequest, NextResponse } from 'next/server'
import { PaymentPlanManager } from '@/lib/payment-plan-manager'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'OVERDUE']),
  reason: z.string().max(500, 'Reason too long').optional()
})

// GET - Get specific payment plan
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
        { success: false, error: 'Invalid payment plan ID format' },
        { status: 400 }
      )
    }
    
    const paymentPlan = await PaymentPlanManager.getPaymentPlan(id)
    
    return NextResponse.json({
      success: true,
      data: paymentPlan
    })
    
  } catch (error) {
    console.error('Error fetching payment plan:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch payment plan' 
      },
      { status: 500 }
    )
  }
}

// PUT - Update payment plan status
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
        { success: false, error: 'Invalid payment plan ID format' },
        { status: 400 }
      )
    }
    
    // Validate request body
    const validationResult = updateStatusSchema.safeParse(body)
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
    
    const { status, reason } = validationResult.data
    
    // Update payment plan with status in metadata
    const paymentPlan = await db.paymentPlan.findUnique({
      where: { id }
    })
    
    if (!paymentPlan) {
      return NextResponse.json(
        { success: false, error: 'Payment plan not found' },
        { status: 404 }
      )
    }
    
    const updatedPlan = await db.paymentPlan.update({
      where: { id },
      data: {
        isActive: status === 'ACTIVE',
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        id: updatedPlan.id,
        name: updatedPlan.name,
        planType: updatedPlan.planType,
        totalAmount: updatedPlan.totalAmount.toNumber(),
        installments: updatedPlan.installments,
        isActive: updatedPlan.isActive,
        status,
        reason,
        updatedAt: updatedPlan.updatedAt
      },
      message: `Payment plan status updated to ${status.toLowerCase()}`
    })
    
  } catch (error) {
    console.error('Error updating payment plan:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update payment plan' 
      },
      { status: 500 }
    )
  }
}


