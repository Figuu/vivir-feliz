import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { PaymentStatus, SessionStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const financialQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(val => new Date(val)),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).transform(val => new Date(val)),
  therapistId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'dashboard') {
      const validation = financialQuerySchema.safeParse({
        startDate: searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: searchParams.get('endDate') || new Date().toISOString().split('T')[0],
        therapistId: searchParams.get('therapistId'),
        patientId: searchParams.get('patientId'),
        groupBy: searchParams.get('groupBy')
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid parameters', details: validation.error.issues },
          { status: 400 }
        )
      }

      const { startDate, endDate, therapistId, patientId, groupBy } = validation.data

      const whereClause: any = {
        createdAt: { gte: startDate, lte: endDate }
      }

      if (therapistId) whereClause.therapistId = therapistId
      if (patientId) whereClause.patientId = patientId

      const [payments, sessions, proposals] = await Promise.all([
        db.payment.findMany({
          where: { ...whereClause, status: PaymentStatus.CONFIRMED },
          include: {
            parent: {
              select: {
                profile: {
                  select: { firstName: true, lastName: true }
                }
              }
            }
          }
        }),
        db.patientSession.findMany({
          where: whereClause,
          include: {
            therapist: {
              select: {
                profile: {
                  select: { firstName: true, lastName: true }
                }
              }
            },
            patient: { select: { firstName: true, lastName: true } }
          }
        }),
        db.therapeuticProposal.findMany({
          where: whereClause,
          include: {
            patient: { select: { firstName: true, lastName: true } },
            services: true
          }
        })
      ])

      const totalRevenue = payments.reduce((sum, p) => {
        const amount = p.amount instanceof Decimal ? p.amount.toNumber() : Number(p.amount)
        return sum + amount
      }, 0)
      const totalSessions = sessions.length
      const completedSessions = sessions.filter(s => s.status === SessionStatus.COMPLETED).length
      const avgSessionRevenue = completedSessions > 0 ? totalRevenue / completedSessions : 0

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalPayments: payments.length,
            totalSessions,
            completedSessions,
            averageSessionRevenue: Math.round(avgSessionRevenue * 100) / 100,
            totalProposals: proposals.length
          },
          payments,
          sessions,
          proposals
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error fetching financial data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
