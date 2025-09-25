import { NextRequest, NextResponse } from 'next/server'
import { PaymentStatusTracker, PaymentStatus } from '@/lib/payment-status-tracker'
import { z } from 'zod'

const updateStatusSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  newStatus: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED']),
  updatedBy: z.string().min(1, 'Updated by is required'),
  reason: z.string().max(500, 'Reason too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  metadata: z.record(z.any()).optional()
})

// POST - Update payment status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
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
    
    const { paymentId, newStatus, updatedBy, reason, notes, metadata } = validationResult.data
    
    // Update payment status
    const statusUpdate = await PaymentStatusTracker.updatePaymentStatus(
      paymentId,
      newStatus,
      updatedBy,
      reason,
      notes,
      metadata
    )
    
    return NextResponse.json({
      success: true,
      data: statusUpdate,
      message: `Payment status updated from ${statusUpdate.fromStatus} to ${statusUpdate.toStatus}`
    })
    
  } catch (error) {
    console.error('Error updating payment status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update payment status' 
      },
      { status: 500 }
    )
  }
}

// GET - Get payment status information and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')
    const status = searchParams.get('status') as PaymentStatus
    const action = searchParams.get('action')
    
    // Get status information for specific payment
    if (paymentId && action === 'info') {
      const statusInfo = await PaymentStatusTracker.getPaymentStatusInfo(paymentId)
      return NextResponse.json({
        success: true,
        data: statusInfo
      })
    }
    
    // Get status history for specific payment
    if (paymentId && action === 'history') {
      const statusHistory = await PaymentStatusTracker.getPaymentStatusHistory(paymentId)
      return NextResponse.json({
        success: true,
        data: statusHistory
      })
    }
    
    // Get payments by status
    if (status && action === 'list') {
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')
      
      const result = await PaymentStatusTracker.getPaymentsByStatus(status, limit, offset)
      return NextResponse.json({
        success: true,
        data: result
      })
    }
    
    // Get payments requiring attention
    if (action === 'attention') {
      const payments = await PaymentStatusTracker.getPaymentsRequiringAttention()
      return NextResponse.json({
        success: true,
        data: payments
      })
    }
    
    // Get status statistics
    if (action === 'statistics') {
      const startDate = searchParams.get('startDate')
      const endDate = searchParams.get('endDate')
      
      let dateRange
      if (startDate && endDate) {
        dateRange = {
          start: new Date(startDate),
          end: new Date(endDate)
        }
      }
      
      const statistics = await PaymentStatusTracker.getPaymentStatusStatistics(dateRange)
      return NextResponse.json({
        success: true,
        data: statistics
      })
    }
    
    // Get possible transitions for a status
    if (status && action === 'transitions') {
      const transitions = PaymentStatusTracker.getPossibleTransitions(status)
      const description = PaymentStatusTracker.getStatusDescription(status)
      const color = PaymentStatusTracker.getStatusColor(status)
      const priority = PaymentStatusTracker.getStatusPriority(status)
      
      return NextResponse.json({
        success: true,
        data: {
          currentStatus: status,
          description,
          color,
          priority,
          possibleTransitions: transitions
        }
      })
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid action or missing parameters' 
      },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Error getting payment status information:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payment status information' 
      },
      { status: 500 }
    )
  }
}
