import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const reassignmentSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  newTherapistId: z.string().uuid('Invalid therapist ID'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  maintainSchedule: z.boolean().default(true),
  reassignedBy: z.string().uuid('Invalid user ID')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = reassignmentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    const session = await db.patientSession.findUnique({
      where: { id: data.sessionId }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Validate new therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: data.newTherapistId }
    })

    if (!therapist) {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 })
    }

    // Check availability if maintaining schedule
    if (data.maintainSchedule) {
      const conflict = await db.patientSession.findFirst({
        where: {
          therapistId: data.newTherapistId,
          scheduledDate: session.scheduledDate,
          scheduledTime: session.scheduledTime,
          status: { notIn: ['cancelled', 'completed'] },
          id: { not: data.sessionId }
        }
      })

      if (conflict) {
        return NextResponse.json({ error: 'New therapist not available at this time' }, { status: 409 })
      }
    }

    // Update session
    const updated = await db.patientSession.update({
      where: { id: data.sessionId },
      data: {
        therapistId: data.newTherapistId,
        reassignmentReason: data.reason,
        reassignedBy: data.reassignedBy,
        reassignedAt: new Date()
      },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        therapist: { select: { firstName: true, lastName: true } }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Therapist reassigned successfully',
      data: updated
    })

  } catch (error) {
    console.error('Error reassigning therapist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
