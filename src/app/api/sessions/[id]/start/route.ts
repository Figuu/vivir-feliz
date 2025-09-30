import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const sessionStartSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  startTime: z.string().optional(), // ISO timestamp, defaults to now
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
  therapistComments: z.string().max(1000, 'Therapist comments cannot exceed 1000 characters').optional()
})

// POST /api/sessions/[id]/start - Start a therapy session
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id

    // Validate session ID
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid session ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validation = sessionStartSchema.safeParse({
      sessionId,
      ...body
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { startTime, notes, therapistComments } = validation.data

    // Check if session exists and is in scheduled status
    const existingSession = await db.patientSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        serviceAssignments: {
          include: {
            proposalService: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true
                  }
                }
              }
            }
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

    if (existingSession.status !== 'scheduled') {
      return NextResponse.json(
        { error: `Cannot start session with status: ${existingSession.status}` },
        { status: 409 }
      )
    }

    // Check if session is not too early (more than 30 minutes before scheduled time)
    const scheduledDateTime = new Date(`${existingSession.scheduledDate.toISOString().split('T')[0]}T${existingSession.scheduledTime}`)
    const now = new Date()
    const timeDifference = scheduledDateTime.getTime() - now.getTime()
    const thirtyMinutes = 30 * 60 * 1000

    if (timeDifference > thirtyMinutes) {
      return NextResponse.json(
        { 
          error: 'Cannot start session more than 30 minutes before scheduled time',
          scheduledTime: scheduledDateTime.toISOString(),
          currentTime: now.toISOString()
        },
        { status: 409 }
      )
    }

    // Check if session is not too late (more than 2 hours after scheduled time)
    const twoHours = 2 * 60 * 60 * 1000
    if (timeDifference < -twoHours) {
      return NextResponse.json(
        { 
          error: 'Cannot start session more than 2 hours after scheduled time',
          scheduledTime: scheduledDateTime.toISOString(),
          currentTime: now.toISOString()
        },
        { status: 409 }
      )
    }

    // Start the session
    const actualStartTime = startTime ? new Date(startTime) : now
    const session = await db.patientSession.update({
      where: { id: sessionId },
      data: {
        status: 'in-progress',
        actualStartTime: actualStartTime,
        sessionNotes: notes,
        therapistComments: therapistComments,
        updatedAt: new Date()
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        serviceAssignments: {
          include: {
            proposalService: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Calculate session details
    const sessionDetails = {
      id: session.id,
      scheduledDate: session.scheduledDate,
      scheduledTime: session.scheduledTime,
      actualStartTime: session.actualStartTime,
      duration: session.duration,
      status: session.status,
      sessionNotes: session.sessionNotes,
      therapistComments: session.therapistComments,
      patient: session.patient,
      therapist: session.therapist,
      services: session.serviceAssignments.map(sa => sa.proposalService.service),
      estimatedEndTime: new Date(actualStartTime.getTime() + (session.duration * 60 * 1000)).toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Session started successfully',
      data: { 
        session: sessionDetails,
        startTime: actualStartTime.toISOString(),
        estimatedEndTime: sessionDetails.estimatedEndTime
      }
    })

  } catch (error) {
    console.error('Error starting session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
