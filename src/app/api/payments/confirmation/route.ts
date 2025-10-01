import { NextRequest, NextResponse } from 'next/server'
import { PaymentConfirmationWorkflowManager, PaymentConfirmationStatus } from '@/lib/payment-confirmation-workflow'
import { z } from 'zod'

const createConfirmationRequestSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID'),
  requestedBy: z.string().min(1, 'Requested by is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional()
})

const reviewConfirmationRequestSchema = z.object({
  confirmationRequestId: z.string().uuid('Invalid confirmation request ID'),
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CLARIFICATION', 'ESCALATE', 'HOLD']),
  reviewedBy: z.string().min(1, 'Reviewed by is required'),
  reviewNotes: z.string().max(1000, 'Review notes too long').optional(),
  escalationReason: z.string().max(500, 'Escalation reason too long').optional(),
  holdReason: z.string().max(500, 'Hold reason too long').optional()
})

// POST - Create payment confirmation request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = createConfirmationRequestSchema.safeParse(body)
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
    
    const { paymentId, requestedBy, priority } = validationResult.data
    
    // Create confirmation request
    const confirmationRequest = await PaymentConfirmationWorkflowManager.createConfirmationRequest(
      paymentId,
      requestedBy,
      priority || 'MEDIUM'
    )
    
    return NextResponse.json({
      success: true,
      data: confirmationRequest,
      message: 'Payment confirmation request created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating payment confirmation request:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create payment confirmation request' 
      },
      { status: 500 }
    )
  }
}

// GET - Get payment confirmation requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    
    // Filtering
    const status = searchParams.get('status') as PaymentConfirmationStatus
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Build filters
    const filters: any = {
      page,
      limit
    }
    
    if (status) filters.status = status
    if (priority) filters.priority = priority
    if (assignedTo) filters.assignedTo = assignedTo
    
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
    
    // Get confirmation requests
    const result = await PaymentConfirmationWorkflowManager.getConfirmationRequests(filters)
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error('Error getting payment confirmation requests:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payment confirmation requests' 
      },
      { status: 500 }
    )
  }
}


