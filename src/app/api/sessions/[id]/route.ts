import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { SessionStatus } from '@prisma/client'

// Validation schemas
const updateSessionSchema = z.object({
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional(),
  duration: z.number().min(15).max(480).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  therapistNotes: z.string().optional(),
  rescheduleReason: z.string().optional()
})

const startSessionSchema = z.object({
  startedAt: z.string().datetime().optional()
})

const completeSessionSchema = z.object({
  duration: z.number().min(1).optional(),
  therapistNotes: z.string().optional()
})

// Helper function to check therapist availability (same as in route.ts)
async function checkTherapistAvailability(
  therapistId: string, 
  date: Date, 
  time: string, 
  duration: number,
  excludeSessionId?: string
): Promise<{ available: boolean; reason?: string }> {
  // Check therapist schedule for the day
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const therapistSchedule = await db.therapistSchedule.findFirst({
    where: {
      therapistId,
      dayOfWeek: dayOfWeek as any,
      isActive: true
    }
  })

  if (!therapistSchedule) {
    return { available: false, reason: 'Therapist not available on this day' }
  }

  // Parse times
  const [startHour, startMinute] = therapistSchedule.startTime.split(':').map(Number)
  const [endHour, endMinute] = therapistSchedule.endTime.split(':').map(Number)
  const [sessionHour, sessionMinute] = time.split(':').map(Number)

  const scheduleStart = startHour * 60 + startMinute
  const scheduleEnd = endHour * 60 + endMinute
  const sessionStart = sessionHour * 60 + sessionMinute
  const sessionEnd = sessionStart + duration

  // Check if session is within working hours
  if (sessionStart < scheduleStart || sessionEnd > scheduleEnd) {
    return { available: false, reason: 'Session outside working hours' }
  }

  // Check for break time conflicts
  if (therapistSchedule.breakStart && therapistSchedule.breakEnd) {
    const [breakStartHour, breakStartMinute] = therapistSchedule.breakStart.split(':').map(Number)
    const [breakEndHour, breakEndMinute] = therapistSchedule.breakEnd.split(':').map(Number)
    const breakStart = breakStartHour * 60 + breakStartMinute
    const breakEnd = breakEndHour * 60 + breakEndMinute

    if ((sessionStart < breakEnd && sessionEnd > breakStart)) {
      return { available: false, reason: 'Session conflicts with break time' }
    }
  }

  // Check for existing sessions (excluding current session if updating)
  const whereClause: any = {
    therapistId,
    scheduledDate: {
      gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    },
    status: {
      in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS]
    }
  }

  if (excludeSessionId) {
    whereClause.id = { not: excludeSessionId }
  }

  const existingSessions = await db.patientSession.findMany({
    where: whereClause
  })

  for (const session of existingSessions) {
    const [existingHour, existingMinute] = session.scheduledTime.split(':').map(Number)
    const existingStart = existingHour * 60 + existingMinute
    const existingEnd = existingStart + session.duration

    if ((sessionStart < existingEnd && sessionEnd > existingStart)) {
      return { available: false, reason: 'Time slot already booked' }
    }
  }

  return { available: true }
}

// GET /api/sessions/[id] - Get specific session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await db.patientSession.findUnique({
      where: { id: params.id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            parent: {
              select: {
                id: true
              }
            }
          }
        },
        therapist: {
          select: {
            id: true
          }
        },
        serviceAssignment: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                type: true,
                sessionDuration: true
              }
            },
            proposalService: {
              include: {
                therapeuticProposal: {
                  select: {
                    id: true,
                    patientId: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ session })

  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/sessions/[id] - Update session
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = updateSessionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const updateData = validation.data

    // Get existing session
    const existingSession = await db.patientSession.findUnique({
      where: { id: params.id },
      include: {
        serviceAssignment: {
          include: {
            therapist: true
          }
        }
      }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if session can be modified
    if (existingSession.status === SessionStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Cannot modify completed session' },
        { status: 400 }
      )
    }

    // If rescheduling, check availability
    if (updateData.scheduledDate || updateData.scheduledTime || updateData.duration) {
      const scheduledDate = updateData.scheduledDate ? new Date(updateData.scheduledDate) : existingSession.scheduledDate
      const scheduledTime = updateData.scheduledTime || existingSession.scheduledTime
      const duration = updateData.duration || existingSession.duration

      const availability = await checkTherapistAvailability(
        existingSession.therapistId,
        scheduledDate,
        scheduledTime,
        duration,
        params.id
      )

      if (!availability.available) {
        return NextResponse.json(
          { error: `Cannot reschedule: ${availability.reason}` },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updatePayload: any = { ...updateData }

    // Handle rescheduling
    if (updateData.scheduledDate || updateData.scheduledTime) {
      // Since originalDate doesn't exist in the current schema, skip this field
      updatePayload.rescheduledAt = new Date()
      updatePayload.rescheduledBy = 'system' // In real app, get from auth context
    }

    // Update session
    const updatedSession = await db.patientSession.update({
      where: { id: params.id },
      data: updatePayload,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        therapist: {
          select: {
            id: true
          }
        },
        serviceAssignment: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      session: updatedSession,
      message: 'Session updated successfully'
    })

  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/[id]/start - Start session
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validation = startSessionSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { startedAt } = validation.data

    // Get existing session
    const existingSession = await db.patientSession.findUnique({
      where: { id: params.id }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (existingSession.status !== SessionStatus.SCHEDULED) {
      return NextResponse.json(
        { error: 'Session is not in scheduled status' },
        { status: 400 }
      )
    }

    // Start session
    const updatedSession = await db.patientSession.update({
      where: { id: params.id },
      data: {
        status: SessionStatus.IN_PROGRESS,
        startedAt: startedAt ? new Date(startedAt) : new Date()
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        therapist: {
          select: {
            id: true
          }
        },
        serviceAssignment: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      session: updatedSession,
      message: 'Session started successfully'
    })

  } catch (error) {
    console.error('Error starting session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Note: Complete session functionality should be in /api/sessions/[id]/complete/route.ts
// This file only handles GET, PATCH, and DELETE for the main session resource

// DELETE /api/sessions/[id] - Cancel session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get existing session
    const existingSession = await db.patientSession.findUnique({
      where: { id: params.id }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (existingSession.status === SessionStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Cannot cancel completed session' },
        { status: 400 }
      )
    }

    // Cancel session
    const updatedSession = await db.patientSession.update({
      where: { id: params.id },
      data: {
        status: SessionStatus.CANCELLED
      }
    })

    return NextResponse.json({
      message: 'Session cancelled successfully'
    })

  } catch (error) {
    console.error('Error cancelling session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
