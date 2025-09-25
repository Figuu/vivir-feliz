import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const paymentStatisticsQuerySchema = z.object({
  // Filtering
  patientId: z.string().uuid().optional(),
  therapistId: z.string().uuid().optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'CHECK', 'DEBIT_CARD', 'PAYPAL', 'STRIPE']).optional(),
  paymentType: z.enum(['CONSULTATION', 'SESSION', 'EVALUATION', 'TREATMENT', 'PLAN_INSTALLMENT', 'REFUND']).optional(),
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
      patientId,
      therapistId,
      paymentMethod,
      paymentType,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = validationResult.data
    
    // Build where clause
    const whereClause: any = {}
    
    if (patientId) whereClause.patientId = patientId
    if (therapistId) whereClause.therapistId = therapistId
    if (paymentMethod) whereClause.paymentMethod = paymentMethod
    if (paymentType) whereClause.paymentType = paymentType
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
      topPatients,
      topTherapists
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
        by: ['paymentType'],
        where: whereClause,
        _count: { paymentType: true },
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
      
      // Top patients
      getTopPatients(whereClause),
      
      // Top therapists
      getTopTherapists(whereClause)
    ])
    
    // Format payment methods
    const paymentMethodsFormatted: Record<string, { count: number; total: number }> = {}
    paymentMethods.forEach(method => {
      paymentMethodsFormatted[method.paymentMethod] = {
        count: method._count.paymentMethod,
        total: method._sum.amount || 0
      }
    })
    
    // Format payment types
    const paymentTypesFormatted: Record<string, { count: number; total: number }> = {}
    paymentTypes.forEach(type => {
      paymentTypesFormatted[type.paymentType] = {
        count: type._count.paymentType,
        total: type._sum.amount || 0
      }
    })
    
    // Format status breakdown
    const statusBreakdownFormatted: Record<string, number> = {}
    statusBreakdown.forEach(status => {
      statusBreakdownFormatted[status.status] = status._count.status
    })
    
    const statistics = {
      totalPayments,
      totalAmount: totalAmount._sum.amount || 0,
      averageAmount: averageAmount._avg.amount || 0,
      paymentMethods: paymentMethodsFormatted,
      paymentTypes: paymentTypesFormatted,
      statusBreakdown: statusBreakdownFormatted,
      monthlyTrends,
      topPatients,
      topTherapists
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
    monthlyTrends[month].total += item._sum.amount || 0
  })

  return Object.entries(monthlyTrends).map(([month, data]) => ({
    month,
    count: data.count,
    total: data.total
  })).sort((a, b) => a.month.localeCompare(b.month))
}

// Helper function to get top patients
async function getTopPatients(whereClause: any): Promise<Array<{
  patientId: string
  patientName: string
  totalPaid: number
  paymentCount: number
}>> {
  const patientData = await db.payment.groupBy({
    by: ['patientId'],
    where: whereClause,
    _count: { patientId: true },
    _sum: { amount: true },
    orderBy: {
      _sum: {
        amount: 'desc'
      }
    },
    take: 10
  })

  const patientIds = patientData.map(p => p.patientId)
  const patients = await db.patient.findMany({
    where: { id: { in: patientIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true
    }
  })

  const patientMap = new Map(patients.map(p => [p.id, p]))

  return patientData.map(data => {
    const patient = patientMap.get(data.patientId)
    return {
      patientId: data.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
      totalPaid: data._sum.amount || 0,
      paymentCount: data._count.patientId
    }
  })
}

// Helper function to get top therapists
async function getTopTherapists(whereClause: any): Promise<Array<{
  therapistId: string
  therapistName: string
  totalReceived: number
  paymentCount: number
}>> {
  const therapistData = await db.payment.groupBy({
    by: ['therapistId'],
    where: whereClause,
    _count: { therapistId: true },
    _sum: { amount: true },
    orderBy: {
      _sum: {
        amount: 'desc'
      }
    },
    take: 10
  })

  const therapistIds = therapistData.map(t => t.therapistId)
  const therapists = await db.therapist.findMany({
    where: { id: { in: therapistIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true
    }
  })

  const therapistMap = new Map(therapists.map(t => [t.id, t]))

  return therapistData.map(data => {
    const therapist = therapistMap.get(data.therapistId)
    return {
      therapistId: data.therapistId,
      therapistName: therapist ? `${therapist.firstName} ${therapist.lastName}` : 'Unknown',
      totalReceived: data._sum.amount || 0,
      paymentCount: data._count.therapistId
    }
  })
}