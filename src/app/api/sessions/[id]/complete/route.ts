import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { SessionStatus } from '@prisma/client'

// Validation schemas
const sessionCompleteSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  endTime: z.string().optional(), // ISO timestamp, defaults to now
  actualDuration: z.number().min(1, 'Duration must be at least 1 minute').max(300, 'Duration cannot exceed 300 minutes').optional(),
  sessionNotes: z.string().max(2000, 'Session notes cannot exceed 2000 characters').optional(),
  therapistComments: z.string().max(2000, 'Therapist comments cannot exceed 2000 characters').optional(),
  patientProgress: z.string().max(1000, 'Patient progress notes cannot exceed 1000 characters').optional(),
  nextSessionRecommendations: z.string().max(1000, 'Next session recommendations cannot exceed 1000 characters').optional(),
  sessionOutcome: z.enum(['successful', 'partial', 'challenging', 'cancelled_early']).optional(),
  patientSatisfaction: z.number().min(1).max(5).optional(),
  therapistSatisfaction: z.number().min(1).max(5).optional()
})

// POST /api/sessions/[id]/complete - Complete a therapy session
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
    const validation = sessionCompleteSchema.safeParse({
      sessionId,
      ...body
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { 
      endTime, 
      actualDuration, 
      sessionNotes, 
      therapistComments, 
      patientProgress,
      nextSessionRecommendations,
      sessionOutcome,
      patientSatisfaction,
      therapistSatisfaction
    } = validation.data

    // Check if session exists and is in progress
    const existingSession = await db.patientSession.findUnique({
      where: { id: sessionId },
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
                type: true,
                costPerSession: true
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

    if (existingSession.status !== SessionStatus.IN_PROGRESS) {
      return NextResponse.json(
        { error: `Cannot complete session with status: ${existingSession.status}` },
        { status: 409 }
      )
    }

    // Calculate actual duration if not provided
    const actualEndTime = endTime ? new Date(endTime) : new Date()
    const startTime = existingSession.startedAt || new Date(`${existingSession.scheduledDate.toISOString().split('T')[0]}T${existingSession.scheduledTime}`)
    const calculatedDuration = Math.round((actualEndTime.getTime() - startTime.getTime()) / (1000 * 60)) // in minutes
    const finalDuration = actualDuration || calculatedDuration

    // Validate duration is reasonable (between 1 and 300 minutes)
    if (finalDuration < 1 || finalDuration > 300) {
      return NextResponse.json(
        { error: 'Session duration must be between 1 and 300 minutes' },
        { status: 400 }
      )
    }

    // Complete the session
    const session = await db.patientSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        completedAt: actualEndTime,
        therapistNotes: sessionNotes || therapistComments,
        updatedAt: new Date()
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
                type: true,
                costPerSession: true
              }
            }
          }
        }
      }
    })

    // Calculate session summary
    const sessionSummary = {
      id: session.id,
      scheduledDate: session.scheduledDate,
      scheduledTime: session.scheduledTime,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      duration: session.duration,
      status: session.status,
      therapistNotes: session.therapistNotes,
      // observations doesn't exist in the current schema
      patient: session.patient,
      therapist: session.therapist,
      service: session.serviceAssignment?.service,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      revenue: 0 // Since revenue doesn't exist in the current schema
    }

    return NextResponse.json({
      success: true,
      message: 'Session completed successfully',
      data: { 
        session: sessionSummary,
        endTime: actualEndTime.toISOString(),
        duration: finalDuration,
        summary: {
          scheduledDuration: session.duration,
          actualDuration: finalDuration,
          durationDifference: finalDuration - session.duration,
          revenue: sessionSummary.revenue
        }
      }
    })

  } catch (error) {
    console.error('Error completing session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
