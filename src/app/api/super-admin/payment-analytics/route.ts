import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { PaymentStatus } from '@prisma/client'

const analyticsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month'),
  compareWith: z.enum(['previous_period', 'previous_year', 'none']).optional().default('none')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const validation = analyticsQuerySchema.safeParse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      groupBy: searchParams.get('groupBy'),
      compareWith: searchParams.get('compareWith')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { startDate, endDate, groupBy, compareWith } = validation.data

    // Build date filter for current period
    const currentPeriodFilter: any = {}
    if (startDate) currentPeriodFilter.gte = new Date(startDate)
    if (endDate) currentPeriodFilter.lte = new Date(endDate)

    const whereClause = Object.keys(currentPeriodFilter).length > 0 
      ? { createdAt: currentPeriodFilter }
      : {}

    // Fetch current period data
    const [
      totalPayments,
      paidPayments,
      pendingPayments,
      overduePayments,
      failedPayments,
      avgPaymentTime,
      paymentTrends,
      methodDistribution,
      statusDistribution,
      largestPayments,
      recentActivity
    ] = await Promise.all([
      // Total payments
      db.payment.aggregate({
        where: whereClause,
        _count: true,
        _sum: { amount: true },
        _avg: { amount: true }
      }),
      
      // Paid payments
      db.payment.aggregate({
        where: { ...whereClause, status: PaymentStatus.COMPLETED },
        _count: true,
        _sum: { amount: true }
      }),
      
      // Pending payments
      db.payment.aggregate({
        where: { ...whereClause, status: PaymentStatus.PENDING },
        _count: true,
        _sum: { amount: true }
      }),
      
      // Overdue payments
      db.payment.aggregate({
        where: { 
          ...whereClause, 
          status: PaymentStatus.PENDING,
          dueDate: { lt: new Date() }
        },
        _count: true,
        _sum: { amount: true }
      }),
      
      // Failed payments
      db.payment.aggregate({
        where: { ...whereClause, status: PaymentStatus.FAILED },
        _count: true,
        _sum: { amount: true }
      }),
      
      // Average payment processing time (for paid payments)
      db.payment.findMany({
        where: { 
          ...whereClause, 
          status: PaymentStatus.COMPLETED,
          paymentDate: { not: null }
        },
        select: {
          createdAt: true,
          paymentDate: true
        }
      }),
      
      // Payment trends over time
      db.payment.groupBy({
        by: ['createdAt'],
        where: whereClause,
        _count: true,
        _sum: { amount: true }
      }),
      
      // Distribution by payment method
      db.payment.groupBy({
        by: ['paymentMethod'],
        where: { ...whereClause, status: PaymentStatus.COMPLETED },
        _count: true,
        _sum: { amount: true }
      }),
      
      // Distribution by status
      db.payment.groupBy({
        by: ['status'],
        where: whereClause,
        _count: true,
        _sum: { amount: true }
      }),
      
      // Largest payments
      db.payment.findMany({
        where: { ...whereClause, status: PaymentStatus.COMPLETED },
        include: {
          consultationRequest: {
            select: {
              patientId: true
            }
          }
        },
        orderBy: { amount: 'desc' },
        take: 10
      }),
      
      // Recent activity
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
        take: 20
      })
    ])

    // Calculate average payment processing time
    let avgProcessingDays = 0
    if (avgPaymentTime.length > 0) {
      const totalDays = avgPaymentTime.reduce((sum, payment) => {
        if (payment.paymentDate) {
          const days = Math.ceil(
            (payment.paymentDate.getTime() - payment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          )
          return sum + days
        }
        return sum
      }, 0)
      avgProcessingDays = totalDays / avgPaymentTime.length
    }

    // Calculate collection efficiency
    const totalAmount = totalPayments._sum.amount || 0
    const paidAmount = paidPayments._sum.amount || 0
    const collectionRate = Number(totalAmount) > 0 ? (Number(paidAmount) / Number(totalAmount) * 100) : 0

    // Calculate on-time payment rate
    const onTimePayments = await db.payment.count({
      where: {
        ...whereClause,
        status: PaymentStatus.COMPLETED,
        paymentDate: { not: null }
      }
    })
    const onTimeRate = paidPayments._count > 0 ? (onTimePayments / paidPayments._count * 100) : 0

    // Payment velocity (average time to payment)
    const velocityData = {
      averageProcessingDays: avgProcessingDays.toFixed(1),
      fastestPayments: avgPaymentTime.filter(p => {
        if (!p.paymentDate) return false
        const days = (p.paymentDate.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        return days <= 1
      }).length,
      slowPayments: avgPaymentTime.filter(p => {
        if (!p.paymentDate) return false
        const days = (p.paymentDate.getTime() - p.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        return days > 30
      }).length
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalCount: totalPayments._count,
          totalAmount: totalAmount,
          averageAmount: totalPayments._avg.amount || 0,
          paidCount: paidPayments._count,
          paidAmount: paidAmount,
          pendingCount: pendingPayments._count,
          pendingAmount: pendingPayments._sum.amount || 0,
          overdueCount: overduePayments._count,
          overdueAmount: overduePayments._sum.amount || 0,
          failedCount: failedPayments._count,
          failedAmount: failedPayments._sum.amount || 0,
          collectionRate: collectionRate.toFixed(2),
          onTimePaymentRate: onTimeRate.toFixed(2)
        },
        velocity: velocityData,
        trends: {
          byDate: paymentTrends.map(t => ({
            date: t.createdAt,
            count: t._count,
            amount: t._sum.amount || 0
          }))
        },
        distribution: {
          byMethod: methodDistribution.map(m => ({
            method: m.paymentMethod || 'Not Specified',
            count: m._count,
            amount: m._sum.amount || 0,
            percentage: Number(totalAmount) > 0 ? ((Number(m._sum.amount) || 0) / Number(totalAmount) * 100).toFixed(2) : 0
          })),
          byStatus: statusDistribution.map(s => ({
            status: s.status,
            count: s._count,
            amount: s._sum.amount || 0,
            percentage: Number(totalAmount) > 0 ? ((Number(s._sum.amount) || 0) / Number(totalAmount) * 100).toFixed(2) : 0
          }))
        },
        topPayments: largestPayments.map(p => ({
          id: p.id,
          amount: p.amount,
          patientName: 'Unknown Patient',
          status: p.status,
          method: p.paymentMethod,
          dueDate: p.dueDate,
          paymentDate: p.paymentDate,
          createdAt: p.createdAt
        })),
        recentActivity: recentActivity.map(p => ({
          id: p.id,
          amount: p.amount,
          patientName: 'Unknown Patient',
          status: p.status,
          method: p.paymentMethod,
          createdAt: p.createdAt
        })),
        dateRange: {
          start: startDate || null,
          end: endDate || null,
          groupBy
        }
      }
    })

  } catch (error) {
    console.error('Error generating payment analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
