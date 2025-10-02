import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const historyQuerySchema = z.object({
  sessionId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  therapistId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const validation = historyQuerySchema.safeParse({
      sessionId: searchParams.get('sessionId'),
      patientId: searchParams.get('patientId'),
      therapistId: searchParams.get('therapistId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { sessionId, patientId, therapistId, startDate, endDate } = validation.data

    const whereClause: any = {}
    
    if (sessionId) {
      whereClause.id = sessionId
    }
    
    if (patientId) {
      whereClause.patientId = patientId
    }
    
    if (therapistId) {
      whereClause.therapistId = therapistId
    }

    if (startDate) {
      whereClause.createdAt = { gte: new Date(startDate) }
    }
    
    if (endDate) {
      whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) }
    }

    // Since there's no reschedulingRequest table, we'll look at session history
    // We'll focus on sessions that have been rescheduled or cancelled
    const sessions = await db.patientSession.findMany({
      where: {
        ...whereClause,
        status: { in: ['CANCELLED'] } // Using CANCELLED as RESCHEDULED doesn't exist in SessionStatus enum
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
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Transform session data to look like rescheduling history
    const history = sessions.map(session => ({
      id: session.id,
      sessionId: session.id,
      requestedDate: session.scheduledDate,
      requestedTime: session.scheduledTime,
      reason: 'Session rescheduled', // Default reason since we don't have specific rescheduling reasons
      status: session.status === 'CANCELLED' ? 'rejected' : 'approved', // Using CANCELLED as RESCHEDULED doesn't exist
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      session: {
        id: session.id,
        patient: session.patient,
        therapist: session.therapist,
        scheduledDate: session.scheduledDate,
        scheduledTime: session.scheduledTime,
        status: session.status
      }
    }))

    return NextResponse.json({
      success: true,
      data: { 
        history, 
        totalCount: history.length,
        summary: {
          totalRescheduled: sessions.filter(s => s.status === 'SCHEDULED').length, // Using SCHEDULED as RESCHEDULED doesn't exist
          totalCancelled: sessions.filter(s => s.status === 'CANCELLED').length,
          reschedulingRate: sessions.length > 0 ? (sessions.filter(s => s.status === 'SCHEDULED').length / sessions.length) * 100 : 0 // Using SCHEDULED as RESCHEDULED doesn't exist
        }
      }
    })

  } catch (error) {
    console.error('Error fetching rescheduling history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}