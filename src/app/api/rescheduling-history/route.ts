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
      whereClause.sessionId = sessionId
    } else {
      const sessionWhere: any = {}
      if (patientId) sessionWhere.patientId = patientId
      if (therapistId) sessionWhere.therapistId = therapistId
      
      if (Object.keys(sessionWhere).length > 0) {
        const matchingSessions = await db.patientSession.findMany({
          where: sessionWhere,
          select: { id: true }
        })
        whereClause.sessionId = { in: matchingSessions.map(s => s.id) }
      }
    }

    if (startDate) {
      whereClause.createdAt = { gte: new Date(startDate) }
    }
    
    if (endDate) {
      whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) }
    }

    const history = await db.reschedulingRequest.findMany({
      where: whereClause,
      include: {
        session: {
          include: {
            patient: { select: { firstName: true, lastName: true } },
            therapist: { select: { firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: { history, totalCount: history.length }
    })

  } catch (error) {
    console.error('Error fetching rescheduling history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
