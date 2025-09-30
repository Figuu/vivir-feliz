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
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { parentId, patientId } = validation.data

    if (action === 'dashboard') {
      // Get parent's patients
      const patients = await db.patient.findMany({
        where: patientId ? { id: patientId, parentId } : { parentId },
        include: {
          parent: {
            select: {
              profile: {
                select: { email: true, firstName: true, lastName: true }
              }
            }
          }
        }
      })

      // Get sessions for all patients
      const patientIds = patients.map(p => p.id)

      const [upcomingSessions, pendingPayments] = await Promise.all([
        db.patientSession.findMany({
          where: {
            patientId: { in: patientIds },
            scheduledDate: { gte: new Date() },
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
          },
          include: {
            therapist: {
              select: {
                profile: {
                  select: { firstName: true, lastName: true }
                }
              }
            },
            patient: { select: { firstName: true, lastName: true } }
          },
          orderBy: { scheduledDate: 'asc' },
          take: 10
        }),
        db.payment.findMany({
          where: {
            parentId,
            status: { in: ['PENDING', 'PROCESSING'] }
          },
          orderBy: { createdAt: 'desc' }
        })
      ])

      return NextResponse.json({
        success: true,
        data: {
          patients,
          upcomingSessions,
          pendingPayments,
          statistics: {
            totalPatients: patients.length,
            upcomingSessionsCount: upcomingSessions.length,
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
