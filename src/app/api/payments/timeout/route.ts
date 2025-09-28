import { NextRequest, NextResponse } from 'next/server'
import { PaymentTimeoutManager, PaymentCancellationRequest, CancellationReason } from '@/lib/payment-timeout-manager'
import { z } from 'zod'

const createTimeoutSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID format'),
  timeoutMinutes: z.number().positive('Timeout minutes must be positive').max(1440, 'Timeout cannot exceed 24 hours').optional(),
  config: z.object({
    defaultTimeoutMinutes: z.number().positive().max(1440).optional(),
    warningThresholdMinutes: z.number().positive().max(60).optional(),
    extensionAllowed: z.boolean().optional(),
    maxExtensions: z.number().min(0).max(10).optional(),
    extensionMinutes: z.number().positive().max(1440).optional(),
    autoCancelEnabled: z.boolean().optional(),
    notificationEnabled: z.boolean().optional()
  }).optional()
})

const extendTimeoutSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID format'),
  extensionMinutes: z.number().positive('Extension minutes must be positive').max(1440, 'Extension cannot exceed 24 hours').optional(),
  notes: z.string().max(500, 'Notes too long').optional()
})

const cancelPaymentSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID format'),
  reason: z.enum(['USER_REQUEST', 'TIMEOUT', 'ADMIN_CANCELLATION', 'PAYMENT_FAILED', 'DUPLICATE_PAYMENT', 'INVALID_AMOUNT', 'SYSTEM_ERROR', 'OTHER']),
  notes: z.string().max(500, 'Notes too long').optional(),
  refundRequired: z.boolean().optional(),
  refundAmount: z.number().positive('Refund amount must be positive').optional(),
  refundReason: z.string().max(200, 'Refund reason too long').optional()
})

const getTimeoutsQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'WARNING', 'EXPIRED', 'CANCELLED', 'EXTENDED']).optional(),
  paymentId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20)
})

// POST - Create payment timeout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = createTimeoutSchema.safeParse(body)
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
    
    const { paymentId, timeoutMinutes, config } = validationResult.data
    
    // Get user ID from headers (in a real app, this would come from authentication)
    const userId = request.headers.get('x-user-id') || 'system'
    
    // Create timeout
    const timeout = await PaymentTimeoutManager.createPaymentTimeout(paymentId, timeoutMinutes, config)
    
    return NextResponse.json({
      success: true,
      data: timeout,
      message: 'Payment timeout created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating payment timeout:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create payment timeout' 
      },
      { status: 500 }
    )
  }
}

// GET - Get payment timeouts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = getTimeoutsQuerySchema.safeParse(queryParams)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }
    
    const { status, paymentId, startDate, endDate, page, limit } = validationResult.data
    
    let timeouts: any[] = []
    
    if (paymentId) {
      // Get specific payment timeout
      const timeout = await PaymentTimeoutManager.getPaymentTimeout(paymentId)
      timeouts = timeout ? [timeout] : []
    } else if (status === 'ACTIVE') {
      // Get active timeouts
      timeouts = await PaymentTimeoutManager.getActiveTimeouts()
    } else if (status === 'EXPIRED') {
      // Get expired timeouts
      timeouts = await PaymentTimeoutManager.getExpiredTimeouts()
    } else {
      // Get all timeouts (implement pagination if needed)
      timeouts = await PaymentTimeoutManager.getActiveTimeouts()
    }
    
    // Apply date filtering if provided
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      timeouts = timeouts.filter(timeout => 
        timeout.createdAt >= start && timeout.createdAt <= end
      )
    }
    
    // Apply pagination
    const offset = (page - 1) * limit
    const paginatedTimeouts = timeouts.slice(offset, offset + limit)
    
    return NextResponse.json({
      success: true,
      data: {
        timeouts: paginatedTimeouts,
        totalCount: timeouts.length,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(timeouts.length / limit),
          hasNextPage: page < Math.ceil(timeouts.length / limit),
          hasPrevPage: page > 1
        }
      }
    })
    
  } catch (error) {
    console.error('Error getting payment timeouts:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payment timeouts' 
      },
      { status: 500 }
    )
  }
}

// PUT - Extend payment timeout
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = extendTimeoutSchema.safeParse(body)
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
    
    const { paymentId, extensionMinutes, notes } = validationResult.data
    
    // Get user ID from headers (in a real app, this would come from authentication)
    const userId = request.headers.get('x-user-id') || 'system'
    
    // Extend timeout
    const timeout = await PaymentTimeoutManager.extendPaymentTimeout(paymentId, userId, extensionMinutes, notes)
    
    return NextResponse.json({
      success: true,
      data: timeout,
      message: 'Payment timeout extended successfully'
    })
    
  } catch (error) {
    console.error('Error extending payment timeout:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to extend payment timeout' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Cancel payment
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = cancelPaymentSchema.safeParse(body)
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
    
    const { paymentId, reason, notes, refundRequired, refundAmount, refundReason } = validationResult.data
    
    // Get user ID from headers (in a real app, this would come from authentication)
    const userId = request.headers.get('x-user-id') || 'system'
    
    // Create cancellation request
    const cancellationRequest: PaymentCancellationRequest = {
      paymentId,
      reason,
      notes,
      cancelledBy: userId,
      refundRequired,
      refundAmount,
      refundReason
    }
    
    // Cancel payment
    const timeout = await PaymentTimeoutManager.cancelPaymentManually(cancellationRequest)
    
    return NextResponse.json({
      success: true,
      data: timeout,
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


