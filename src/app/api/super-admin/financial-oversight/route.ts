import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const financialQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const validation = financialQuerySchema.safeParse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      groupBy: searchParams.get('groupBy')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { startDate, endDate, groupBy } = validation.data

    // Build where clause for date filtering
    const whereClause: any = {}
    if (startDate) {
      whereClause.createdAt = { gte: new Date(startDate) }
    }
    if (endDate) {
      whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) }
    }

    // Fetch comprehensive financial data
    const [
      totalRevenue,
      totalPaid,
      totalPending,
      totalOverdue,
      paymentsByStatus,
      revenueByService,
      paymentPlans,
      recentPayments,
      topPatients
    ] = await Promise.all([
      // Total revenue (all payments)
      db.payment.aggregate({
        where: whereClause,
        _sum: { amount: true }
      }),
      
      // Total paid amount
      db.payment.aggregate({
        where: { ...whereClause, status: 'paid' },
        _sum: { amount: true }
      }),
      
      // Total pending amount
      db.payment.aggregate({
        where: { ...whereClause, status: 'pending' },
        _sum: { amount: true }
      }),
      
      // Total overdue amount
      db.payment.aggregate({
        where: { 
          ...whereClause, 
          status: 'pending',
          dueDate: { lt: new Date() }
        },
        _sum: { amount: true }
      }),
      
      // Payments by status
      db.payment.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
        _sum: { amount: true }
      }),
      
      // Revenue by service (via sessions)
      db.patientSession.groupBy({
        by: ['serviceId'],
        where: {
          ...whereClause,
          status: 'completed'
        },
        _count: true,
        _sum: { cost: true }
      }),
      
      // Payment plan statistics
      db.paymentPlan.aggregate({
        where: whereClause,
        _count: true,
        _sum: { 
          totalAmount: true,
          paidAmount: true
        }
      }),
      
      // Recent payments (last 10)
      db.payment.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Top paying patients
      db.payment.groupBy({
        by: ['patientId'],
        where: { ...whereClause, status: 'paid' },
        _sum: { amount: true },
        _count: true,
        orderBy: {
          _sum: {
            amount: 'desc'
          }
        },
        take: 10
      })
    ])

    // Calculate key metrics
    const revenue = totalRevenue._sum.amount || 0
    const paid = totalPaid._sum.amount || 0
    const pending = totalPending._sum.amount || 0
    const overdue = totalOverdue._sum.amount || 0
    const collectionRate = revenue > 0 ? (paid / revenue) * 100 : 0

    // Payment plan metrics
    const plansTotalAmount = paymentPlans._sum.totalAmount || 0
    const plansPaidAmount = paymentPlans._sum.paidAmount || 0
    const plansCompletionRate = plansTotalAmount > 0 ? (plansPaidAmount / plansTotalAmount) * 100 : 0

    // Get patient details for top patients
    const topPatientIds = topPatients.map(p => p.patientId)
    const patientDetails = await db.patient.findMany({
      where: { id: { in: topPatientIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    })

    const topPatientsWithDetails = topPatients.map(tp => {
      const patient = patientDetails.find(pd => pd.id === tp.patientId)
      return {
        patientId: tp.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        patientEmail: patient?.email,
        totalPaid: tp._sum.amount || 0,
        paymentCount: tp._count
      }
    })

    // Get service details for revenue breakdown
    const serviceIds = revenueByService.map(r => r.serviceId).filter(Boolean)
    const services = await db.service.findMany({
      where: { id: { in: serviceIds as string[] } },
      select: { id: true, name: true }
    })

    const revenueByServiceWithNames = revenueByService.map(rbs => {
      const service = services.find(s => s.id === rbs.serviceId)
      return {
        serviceId: rbs.serviceId,
        serviceName: service?.name || 'Unknown',
        sessionCount: rbs._count,
        totalRevenue: rbs._sum.cost || 0
      }
    }).sort((a, b) => b.totalRevenue - a.totalRevenue)

    // Format response
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalRevenue: revenue,
          totalPaid: paid,
          totalPending: pending,
          totalOverdue: overdue,
          collectionRate: collectionRate.toFixed(2),
          outstandingBalance: pending + overdue
        },
        paymentStatus: {
          byStatus: paymentsByStatus.map(ps => ({
            status: ps.status,
            count: ps._count,
            amount: ps._sum.amount || 0
          })),
          distribution: {
            paid: paid,
            pending: pending,
            overdue: overdue
          }
        },
        revenueByService: revenueByServiceWithNames,
        paymentPlans: {
          totalPlans: paymentPlans._count,
          totalAmount: plansTotalAmount,
          paidAmount: plansPaidAmount,
          remainingAmount: plansTotalAmount - plansPaidAmount,
          completionRate: plansCompletionRate.toFixed(2)
        },
        recentPayments: recentPayments.map(p => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          patientName: `${p.patient.firstName} ${p.patient.lastName}`,
          dueDate: p.dueDate,
          paidDate: p.paidDate,
          createdAt: p.createdAt
        })),
        topPatients: topPatientsWithDetails,
        dateRange: {
          start: startDate || null,
          end: endDate || null,
          groupBy: groupBy
        }
      }
    })

  } catch (error) {
    console.error('Error fetching financial oversight data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
