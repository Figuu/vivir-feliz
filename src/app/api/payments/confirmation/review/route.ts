import { NextRequest, NextResponse } from 'next/server'
import { PaymentConfirmationWorkflowManager } from '@/lib/payment-confirmation-workflow'
import { z } from 'zod'

const reviewRequestSchema = z.object({
  confirmationRequestId: z.string().uuid('Invalid confirmation request ID'),
  action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CLARIFICATION', 'ESCALATE', 'HOLD']),
  reviewedBy: z.string().min(1, 'Reviewed by is required'),
  reviewNotes: z.string().max(1000, 'Review notes too long').optional(),
  escalationReason: z.string().max(500, 'Escalation reason too long').optional(),
  holdReason: z.string().max(500, 'Hold reason too long').optional()
})

// POST - Review payment confirmation request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = reviewRequestSchema.safeParse(body)
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
      confirmationRequestId, 
      action, 
      reviewedBy, 
      reviewNotes, 
      escalationReason, 
      holdReason 
    } = validationResult.data
    
    // Validate action-specific requirements
    if (action === 'ESCALATE' && !escalationReason) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Escalation reason is required for escalate action' 
        },
        { status: 400 }
      )
    }
    
    if (action === 'HOLD' && !holdReason) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Hold reason is required for hold action' 
        },
        { status: 400 }
      )
    }
    
    // Review confirmation request
    const result = await PaymentConfirmationWorkflowManager.reviewConfirmationRequest(
      confirmationRequestId,
      action,
      reviewedBy,
      reviewNotes ?? undefined
    )
    
    return NextResponse.json({
      success: true,
      data: result,
      message: `Payment confirmation request ${action.toLowerCase()}d successfully`
    })
    
  } catch (error) {
    console.error('Error reviewing payment confirmation request:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to review payment confirmation request' 
      },
      { status: 500 }
    )
  }
}


