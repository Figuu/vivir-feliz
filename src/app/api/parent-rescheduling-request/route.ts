import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const parentRescheduleRequestSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  requestedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(val => new Date(val)),
  requestedTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  alternativeDates: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(val => new Date(val)),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  })).max(3, 'Maximum 3 alternative dates allowed').optional(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  parentId: z.string().uuid('Invalid parent ID')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = parentRescheduleRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    const session = await db.patientSession.findUnique({
      where: { id: data.sessionId },
      include: { patient: true }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Validate requested date is not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (data.requestedDate < today) {
      return NextResponse.json({ error: 'Cannot request rescheduling to a past date' }, { status: 400 })
    }

    // Create rescheduling request
    const request_record = await db.reschedulingRequest.create({
      data: {
        sessionId: data.sessionId,
        requestedDate: data.requestedDate,
        requestedTime: data.requestedTime,
        alternativeDates: data.alternativeDates || [],
        reason: data.reason,
        requestedBy: data.parentId,
        status: 'pending'
      },
      include: {
        session: {
          include: {
            patient: { select: { firstName: true, lastName: true } },
            therapist: { select: { firstName: true, lastName: true } }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Rescheduling request submitted successfully',
      data: request_record
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating rescheduling request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
