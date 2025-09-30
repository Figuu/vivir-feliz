import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const approvalSchema = z.object({
  requestId: z.string().uuid('Invalid request ID'),
  action: z.enum(['approve', 'reject', 'suggest_alternative']),
  approvedBy: z.string().uuid('Invalid user ID'),
  comments: z.string().max(1000).optional(),
  suggestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(val => new Date(val)).optional(),
  suggestedTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = approvalSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    const rescheduleRequest = await db.reschedulingRequest.findUnique({
      where: { id: data.requestId },
      include: { session: true }
    })

    if (!rescheduleRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (data.action === 'approve') {
      // Update session
      await db.patientSession.update({
        where: { id: rescheduleRequest.sessionId },
        data: {
          scheduledDate: rescheduleRequest.requestedDate,
          scheduledTime: rescheduleRequest.requestedTime,
          status: 'rescheduled',
          rescheduledReason: rescheduleRequest.reason,
          rescheduledBy: data.approvedBy,
          rescheduledAt: new Date()
        }
      })

      // Update request
      await db.reschedulingRequest.update({
        where: { id: data.requestId },
        data: {
          status: 'approved',
          approvedBy: data.approvedBy,
          approvedAt: new Date(),
          comments: data.comments
        }
      })
    } else if (data.action === 'reject') {
      await db.reschedulingRequest.update({
        where: { id: data.requestId },
        data: {
          status: 'rejected',
          rejectedBy: data.approvedBy,
          rejectedAt: new Date(),
          comments: data.comments
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Rescheduling request ${data.action}d successfully`
    })

  } catch (error) {
    console.error('Error processing approval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
