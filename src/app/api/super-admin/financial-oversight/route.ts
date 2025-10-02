import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { PaymentStatus } from '@prisma/client'

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
        { error: 'Invalid parameters', details: validation.error.issues },
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
        where: { ...whereClause, status: PaymentStatus.COMPLETED },
        _sum: { amount: true }
      }),
      
      // Total pending amount
      db.payment.aggregate({
        where: { ...whereClause, status: PaymentStatus.PENDING },
        _sum: { amount: true }
      }),
      
      // Total overdue amount
      db.payment.aggregate({
        where: { 
          ...whereClause, 
          status: PaymentStatus.PENDING,
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
        by: ['serviceAssignmentId'],
        where: {
          ...whereClause,
          status: 'COMPLETED'
        },
        _count: true
      }),
      
      // Payment plan statistics
      db.paymentPlan.aggregate({
        where: whereClause,
        _count: true,
        _sum: { 
          totalAmount: true
        }
      }),
      
      // Recent payments (last 10)
      db.payment.findMany({
        where: whereClause,
        include: {
          consultationRequest: {
            select: {
              patientId: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      
      // Top paying patients
      db.payment.groupBy({
        by: ['parentId'],
        where: { ...whereClause, status: PaymentStatus.COMPLETED },
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
    const collectionRate = Number(revenue) > 0 ? (Number(paid) / Number(revenue)) * 100 : 0

    // Payment plan metrics
    const plansTotalAmount = paymentPlans._sum.totalAmount || 0
    const plansPaidAmount = 0 // Since paidAmount doesn't exist in PaymentPlan model
    const plansCompletionRate = 0 // Placeholder since we can't calculate without paidAmount

    // Get parent details for top patients (since payments are linked to parents, not patients directly)
    const topParentIds = topPatients.map(p => p.parentId)
    const parentDetails = await db.parent.findMany({
      where: { id: { in: topParentIds } },
      select: {
        id: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    const topPatientsWithDetails = topPatients.map(tp => {
      const parent = parentDetails.find(pd => pd.id === tp.parentId)
      return {
        parentId: tp.parentId,
        parentName: parent ? `${parent.profile?.firstName} ${parent.profile?.lastName}` : 'Unknown',
        parentEmail: parent?.profile?.email,
        totalPaid: tp._sum.amount || 0,
        paymentCount: tp._count
      }
    })

    // Get service details for revenue breakdown
    const serviceIds = revenueByService.map(r => r.serviceAssignmentId).filter(Boolean)
    const serviceAssignments = await db.serviceAssignment.findMany({
      where: { id: { in: serviceIds as string[] } },
      include: {
        service: {
          select: { id: true, name: true }
        }
      }
    })

    const revenueByServiceWithNames = revenueByService.map(rbs => {
      const serviceAssignment = serviceAssignments.find(sa => sa.id === rbs.serviceAssignmentId)
      return {
        serviceId: rbs.serviceAssignmentId,
        serviceName: serviceAssignment?.service.name || 'Unknown',
        sessionCount: rbs._count,
        totalRevenue: 0 // Since cost is not directly available in PatientSession
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
          outstandingBalance: Number(pending) + Number(overdue)
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
          remainingAmount: Number(plansTotalAmount) - Number(plansPaidAmount),
          completionRate: plansCompletionRate.toFixed(2)
        },
        recentPayments: recentPayments.map(p => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          patientName: 'Unknown Patient',
          dueDate: p.dueDate,
          paymentDate: p.paymentDate,
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
