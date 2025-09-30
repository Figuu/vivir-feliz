import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const parentPortalQuerySchema = z.object({
  parentId: z.string().uuid('Invalid parent ID'),
  patientId: z.string().uuid('Invalid patient ID').optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    const validation = parentPortalQuerySchema.safeParse({
      parentId: searchParams.get('parentId'),
      patientId: searchParams.get('patientId')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { parentId, patientId } = validation.data

    if (action === 'dashboard') {
      // Get parent's patients
      const patients = await db.patient.findMany({
        where: patientId ? { id: patientId } : {},
        include: {
          user: { select: { email: true } }
        }
      })

      // Get sessions for all patients
      const patientIds = patients.map(p => p.id)
      
      const [upcomingSessions, recentProgress, pendingPayments] = await Promise.all([
        db.patientSession.findMany({
          where: {
            patientId: { in: patientIds },
            scheduledDate: { gte: new Date() },
            status: { in: ['scheduled', 'confirmed'] }
          },
          include: {
            therapist: { select: { firstName: true, lastName: true } },
            patient: { select: { firstName: true, lastName: true } }
          },
          orderBy: { scheduledDate: 'asc' },
          take: 10
        }),
        db.patientProgress.findMany({
          where: { patientId: { in: patientIds } },
          include: {
            therapist: { select: { firstName: true, lastName: true } }
          },
          orderBy: { entryDate: 'desc' },
          take: 5
        }),
        db.payment.findMany({
          where: {
            patientId: { in: patientIds },
            status: { in: ['pending', 'correction_requested'] }
          },
          orderBy: { createdAt: 'desc' }
        })
      ])

      return NextResponse.json({
        success: true,
        data: {
          patients,
          upcomingSessions,
          recentProgress,
          pendingPayments,
          statistics: {
            totalPatients: patients.length,
            upcomingSessionsCount: upcomingSessions.length,
            recentProgressCount: recentProgress.length,
            pendingPaymentsCount: pendingPayments.length
          }
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error fetching parent portal data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
