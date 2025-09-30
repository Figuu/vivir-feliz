import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const paymentStatisticsQuerySchema = z.object({
  // Filtering
  parentId: z.string().uuid().optional(),
  paymentMethod: z.string().optional(),
  type: z.enum(['CONSULTATION', 'SESSION', 'EVALUATION', 'TREATMENT', 'PLAN_INSTALLMENT', 'REFUND']).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined)
})

// GET - Get payment statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = paymentStatisticsQuerySchema.safeParse(queryParams)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }
    
    const {
      parentId,
      paymentMethod,
      type,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = validationResult.data

    // Build where clause
    const whereClause: any = {}

    if (parentId) whereClause.parentId = parentId
    if (paymentMethod) whereClause.paymentMethod = paymentMethod
    if (type) whereClause.type = type
    if (status) whereClause.status = status
    
    if (startDate || endDate) {
      if (!startDate || !endDate) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Both start date and end date are required for date filtering' 
          },
          { status: 400 }
        )
      }
      
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
    
    if (minAmount !== undefined || maxAmount !== undefined) {
      whereClause.amount = {
        gte: minAmount || 0,
        lte: maxAmount || Number.MAX_SAFE_INTEGER
      }
    }
    
    // Get comprehensive statistics
    const [
      totalPayments,
      totalAmount,
      averageAmount,
      paymentMethods,
      paymentTypes,
      statusBreakdown,
      monthlyTrends,
      topParents
    ] = await Promise.all([
      // Total payments
      db.payment.count({ where: whereClause }),
      
      // Total amount
      db.payment.aggregate({
        where: whereClause,
        _sum: { amount: true }
      }),
      
      // Average amount
      db.payment.aggregate({
        where: whereClause,
        _avg: { amount: true }
      }),
      
      // Payment methods breakdown
      db.payment.groupBy({
        by: ['paymentMethod'],
        where: whereClause,
        _count: { paymentMethod: true },
        _sum: { amount: true }
      }),
      
      // Payment types breakdown
      db.payment.groupBy({
        by: ['type'],
        where: whereClause,
        _count: { type: true },
        _sum: { amount: true }
      }),
      
      // Status breakdown
      db.payment.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true }
      }),
      
      // Monthly trends (last 12 months)
      getMonthlyTrends(whereClause),

      // Top parents
      getTopParents(whereClause)
    ])
    
    // Format payment methods
    const paymentMethodsFormatted: Record<string, { count: number; total: number }> = {}
    paymentMethods.forEach(method => {
      paymentMethodsFormatted[method.paymentMethod || 'UNKNOWN'] = {
        count: method._count.paymentMethod,
        total: method._sum.amount?.toNumber() || 0
      }
    })

    // Format payment types
    const paymentTypesFormatted: Record<string, { count: number; total: number }> = {}
    paymentTypes.forEach(type => {
      paymentTypesFormatted[type.type] = {
        count: type._count.type,
        total: type._sum.amount?.toNumber() || 0
      }
    })
    
    // Format status breakdown
    const statusBreakdownFormatted: Record<string, number> = {}
    statusBreakdown.forEach(status => {
      statusBreakdownFormatted[status.status] = status._count.status
    })
    
    const statistics = {
      totalPayments,
      totalAmount: totalAmount._sum.amount?.toNumber() || 0,
      averageAmount: averageAmount._avg.amount?.toNumber() || 0,
      paymentMethods: paymentMethodsFormatted,
      paymentTypes: paymentTypesFormatted,
      statusBreakdown: statusBreakdownFormatted,
      monthlyTrends,
      topParents
    }
    
    return NextResponse.json({
      success: true,
      data: statistics
    })
    
  } catch (error) {
    console.error('Error getting payment statistics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payment statistics' 
      },
      { status: 500 }
    )
  }
}

// Helper function to get monthly trends
async function getMonthlyTrends(whereClause: any): Promise<Array<{
  month: string
  count: number
  total: number
}>> {
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const monthlyData = await db.payment.groupBy({
    by: ['createdAt'],
    where: {
      ...whereClause,
      createdAt: {
        gte: twelveMonthsAgo
      }
    },
    _count: { createdAt: true },
    _sum: { amount: true }
  })

  // Group by month
  const monthlyTrends: Record<string, { count: number; total: number }> = {}
  
  monthlyData.forEach(item => {
    const month = new Date(item.createdAt).toISOString().substring(0, 7) // YYYY-MM
    if (!monthlyTrends[month]) {
      monthlyTrends[month] = { count: 0, total: 0 }
    }
    monthlyTrends[month].count += item._count.createdAt
    monthlyTrends[month].total += item._sum.amount?.toNumber() || 0
  })

  return Object.entries(monthlyTrends).map(([month, data]) => ({
    month,
    count: data.count,
    total: data.total
  })).sort((a, b) => a.month.localeCompare(b.month))
}

// Helper function to get top parents
async function getTopParents(whereClause: any): Promise<Array<{
  parentId: string
  parentName: string
  totalPaid: number
  paymentCount: number
}>> {
  const parentData = await db.payment.groupBy({
    by: ['parentId'],
    where: whereClause,
    _count: { parentId: true },
    _sum: { amount: true },
    orderBy: {
      _sum: {
        amount: 'desc'
      }
    },
    take: 10
  })

  const parentIds = parentData.map(p => p.parentId)
  const parents = await db.parent.findMany({
    where: { id: { in: parentIds } },
    include: {
      profile: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  })

  const parentMap = new Map(parents.map(p => [p.id, p]))

  return parentData.map(data => {
    const parent = parentMap.get(data.parentId)
    return {
      parentId: data.parentId,
      parentName: parent ? `${parent.profile.firstName} ${parent.profile.lastName}` : 'Unknown',
      totalPaid: data._sum.amount?.toNumber() || 0,
      paymentCount: data._count.parentId
    }
  })
}