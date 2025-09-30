import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const globalScheduleQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').transform(val => new Date(val)),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').transform(val => new Date(val)),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled']).optional(),
  view: z.enum(['day', 'week', 'month']).optional().default('week')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'overview') {
      const validation = globalScheduleQuerySchema.safeParse({
        startDate: searchParams.get('startDate') || new Date().toISOString().split('T')[0],
        endDate: searchParams.get('endDate') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        therapistId: searchParams.get('therapistId'),
        patientId: searchParams.get('patientId'),
        status: searchParams.get('status'),
        view: searchParams.get('view')
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid parameters', details: validation.error.errors },
          { status: 400 }
        )
      }

      const { startDate, endDate, therapistId, patientId, status } = validation.data

      const whereClause: any = {
        scheduledDate: {
          gte: startDate,
          lte: endDate
        }
      }

      if (therapistId) whereClause.therapistId = therapistId
      if (patientId) whereClause.patientId = patientId
      if (status) whereClause.status = status

      const [sessions, therapists, patients, stats] = await Promise.all([
        db.patientSession.findMany({
          where: whereClause,
          include: {
            therapist: { select: { firstName: true, lastName: true } },
            patient: { select: { firstName: true, lastName: true } }
          },
          orderBy: { scheduledDate: 'asc' }
        }),
        db.therapist.findMany({ select: { id: true, firstName: true, lastName: true } }),
        db.patient.findMany({ select: { id: true, firstName: true, lastName: true } }),
        db.patientSession.groupBy({
          by: ['status'],
          where: whereClause,
          _count: true
        })
      ])

      return NextResponse.json({
        success: true,
        data: {
          sessions,
          therapists,
          patients,
          statistics: stats.reduce((acc: any, s) => {
            acc[s.status] = s._count
            return acc
          }, {})
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error fetching global schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
