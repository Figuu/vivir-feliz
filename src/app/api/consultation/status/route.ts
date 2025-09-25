import { NextRequest, NextResponse } from 'next/server'
import { ConsultationStatusTracker, ConsultationStatus } from '@/lib/consultation-status-tracker'
import { z } from 'zod'

const updateStatusSchema = z.object({
  consultationRequestId: z.string().uuid('Invalid consultation request ID'),
  newStatus: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  updatedBy: z.string().min(1, 'Updated by is required'),
  reason: z.string().max(500, 'Reason too long').optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
  metadata: z.record(z.any()).optional()
})

// POST - Update consultation status
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
    
    const { consultationRequestId, newStatus, updatedBy, reason, notes, metadata } = validationResult.data
    
    // Update consultation status
    const statusUpdate = await ConsultationStatusTracker.updateStatus(
      consultationRequestId,
      newStatus,
      updatedBy,
      reason,
      notes,
      metadata
    )
    
    return NextResponse.json({
      success: true,
      data: statusUpdate,
      message: `Status updated from ${statusUpdate.fromStatus} to ${statusUpdate.toStatus}`
    })
    
  } catch (error) {
    console.error('Error updating consultation status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update consultation status' 
      },
      { status: 500 }
    )
  }
}

// GET - Get status information and statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const consultationRequestId = searchParams.get('consultationRequestId')
    const status = searchParams.get('status') as ConsultationStatus
    const action = searchParams.get('action')
    
    // Get status information for specific consultation
    if (consultationRequestId && action === 'info') {
      const statusInfo = await ConsultationStatusTracker.getStatusInfo(consultationRequestId)
      return NextResponse.json({
        success: true,
        data: statusInfo
      })
    }
    
    // Get status history for specific consultation
    if (consultationRequestId && action === 'history') {
      const statusHistory = await ConsultationStatusTracker.getStatusHistory(consultationRequestId)
      return NextResponse.json({
        success: true,
        data: statusHistory
      })
    }
    
    // Get consultations by status
    if (status && action === 'list') {
      const limit = parseInt(searchParams.get('limit') || '50')
      const offset = parseInt(searchParams.get('offset') || '0')
      
      const result = await ConsultationStatusTracker.getConsultationsByStatus(status, limit, offset)
      return NextResponse.json({
        success: true,
        data: result
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
      
      const statistics = await ConsultationStatusTracker.getStatusStatistics(dateRange)
      return NextResponse.json({
        success: true,
        data: statistics
      })
    }
    
    // Get consultations needing updates
    if (action === 'needing-updates') {
      const consultations = await ConsultationStatusTracker.getConsultationsNeedingUpdates()
      return NextResponse.json({
        success: true,
        data: consultations
      })
    }
    
    // Get possible transitions for a status
    if (status && action === 'transitions') {
      const transitions = ConsultationStatusTracker.getPossibleTransitions(status)
      const description = ConsultationStatusTracker.getStatusDescription(status)
      const color = ConsultationStatusTracker.getStatusColor(status)
      
      return NextResponse.json({
        success: true,
        data: {
          currentStatus: status,
          description,
          color,
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
    console.error('Error getting consultation status information:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get consultation status information' 
      },
      { status: 500 }
    )
  }
}
