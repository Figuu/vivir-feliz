import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const manualRescheduleSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  newDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .transform(val => new Date(val)),
  newTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason cannot exceed 500 characters'),
  newTherapistId: z.string().uuid('Invalid therapist ID').optional(),
  notifyPatient: z.boolean().default(true),
  notifyTherapist: z.boolean().default(true),
  rescheduledBy: z.string().uuid('Invalid user ID')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = manualRescheduleSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Get existing session
    const session = await db.patientSession.findUnique({
      where: { id: data.sessionId },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
        therapist: { select: { firstName: true, lastName: true, email: true } }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Validate new date is not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (data.newDate < today) {
      return NextResponse.json({ error: 'Cannot reschedule to a past date' }, { status: 400 })
    }

    // Check therapist availability
    const therapistId = data.newTherapistId || session.therapistId
    const conflicts = await db.patientSession.findFirst({
      where: {
        therapistId,
        scheduledDate: data.newDate,
        scheduledTime: data.newTime,
        status: { notIn: ['cancelled', 'completed'] },
        id: { not: data.sessionId }
      }
    })

    if (conflicts) {
      return NextResponse.json({ error: 'Time slot not available' }, { status: 409 })
    }

    // Update session
    const updated = await db.patientSession.update({
      where: { id: data.sessionId },
      data: {
        scheduledDate: data.newDate,
        scheduledTime: data.newTime,
        therapistId,
        status: 'rescheduled',
        rescheduledReason: data.reason,
        rescheduledBy: data.rescheduledBy,
        rescheduledAt: new Date()
      },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
        therapist: { select: { firstName: true, lastName: true, email: true } }
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: data.rescheduledBy,
        action: 'update',
        entityType: 'PatientSession',
        entityId: data.sessionId,
        changes: {
          from: { date: session.scheduledDate, time: session.scheduledTime },
          to: { date: data.newDate, time: data.newTime }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Session rescheduled successfully',
      data: updated
    })

  } catch (error) {
    console.error('Error rescheduling session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
