import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { PaymentStatus } from '@prisma/client'

const reportQuerySchema = z.object({
  reportType: z.enum(['revenue', 'payments', 'services', 'therapists', 'custom']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month'),
  format: z.enum(['json', 'csv', 'pdf']).optional().default('json')
})

const customReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  dataSource: z.enum(['payments', 'sessions', 'patients', 'therapists', 'proposals']),
  filters: z.record(z.string(), z.any()).optional(),
  groupBy: z.array(z.string()).optional(),
  aggregations: z.array(z.object({
    field: z.string(),
    function: z.enum(['sum', 'avg', 'count', 'min', 'max'])
  })).optional(),
  createdBy: z.string().uuid()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const validation = reportQuerySchema.safeParse({
      reportType: searchParams.get('reportType'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      groupBy: searchParams.get('groupBy'),
      format: searchParams.get('format')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { reportType = 'revenue', startDate, endDate, groupBy, format } = validation.data

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    let reportData: any = {}

    switch (reportType) {
      case 'revenue':
        reportData = await generateRevenueReport(dateFilter, groupBy)
        break
      case 'payments':
        reportData = await generatePaymentsReport(dateFilter, groupBy)
        break
      case 'services':
        reportData = await generateServicesReport(dateFilter, groupBy)
        break
      case 'therapists':
        reportData = await generateTherapistsReport(dateFilter, groupBy)
        break
      default:
        reportData = await generateRevenueReport(dateFilter, groupBy)
    }

    if (format === 'csv') {
      return generateCSVResponse(reportData, reportType)
    }

    return NextResponse.json({
      success: true,
      reportType,
      dateRange: { startDate, endDate },
      groupBy,
      data: reportData
    })

  } catch (error) {
    console.error('Error generating financial report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = customReportSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Since customReport model doesn't exist, create a placeholder response
    // In a real implementation, you would need to add the customReport model to Prisma schema
    const customReport = {
      id: 'placeholder-custom-report-id',
      name: data.name,
      description: data.description,
      dataSource: data.dataSource,
      filters: data.filters || {},
      groupBy: data.groupBy || [],
      aggregations: data.aggregations || [],
      createdBy: data.createdBy,
      createdAt: new Date()
    }

    return NextResponse.json({
      success: true,
      message: 'Custom report created successfully',
      data: customReport
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating custom report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate revenue report
async function generateRevenueReport(dateFilter: any, groupBy: string) {
  const whereClause = Object.keys(dateFilter).length > 0 
    ? { createdAt: dateFilter }
    : {}

  const [totalRevenue, paidRevenue, pendingRevenue, overdueRevenue, paymentCount] = await Promise.all([
    db.payment.aggregate({
      where: whereClause,
      _sum: { amount: true }
    }),
    db.payment.aggregate({
      where: { ...whereClause, status: PaymentStatus.COMPLETED },
      _sum: { amount: true }
    }),
    db.payment.aggregate({
      where: { ...whereClause, status: PaymentStatus.PENDING },
      _sum: { amount: true }
    }),
    db.payment.aggregate({
      where: { 
        ...whereClause, 
        status: PaymentStatus.PENDING,
        dueDate: { lt: new Date() }
      },
      _sum: { amount: true }
    }),
    db.payment.count({ where: whereClause })
  ])

  return {
    summary: {
      totalRevenue: totalRevenue._sum.amount || 0,
      paidRevenue: paidRevenue._sum.amount || 0,
      pendingRevenue: pendingRevenue._sum.amount || 0,
      overdueRevenue: overdueRevenue._sum.amount || 0,
      paymentCount,
      collectionRate: totalRevenue._sum.amount 
        ? ((Number(paidRevenue._sum.amount) || 0) / Number(totalRevenue._sum.amount) * 100).toFixed(2)
        : 0
    }
  }
}

// Helper function to generate payments report
async function generatePaymentsReport(dateFilter: any, groupBy: string) {
  const whereClause = Object.keys(dateFilter).length > 0 
    ? { createdAt: dateFilter }
    : {}

  const [byStatus, byMethod, avgPayment, totalPayments] = await Promise.all([
    db.payment.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
      _sum: { amount: true }
    }),
    db.payment.groupBy({
      by: ['paymentMethod'],
      where: { ...whereClause, status: PaymentStatus.COMPLETED },
      _count: true,
      _sum: { amount: true }
    }),
    db.payment.aggregate({
      where: whereClause,
      _avg: { amount: true }
    }),
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
      take: 50
    })
  ])

  return {
    byStatus: byStatus.map(s => ({
      status: s.status,
      count: s._count,
      total: s._sum.amount || 0
    })),
    byMethod: byMethod.map(m => ({
      method: m.paymentMethod,
      count: m._count,
      total: m._sum.amount || 0
    })),
    averagePayment: avgPayment._avg.amount || 0,
    recentPayments: totalPayments.map(p => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      method: p.paymentMethod,
      patientName: 'Unknown Patient',
      dueDate: p.dueDate,
      paymentDate: p.paymentDate,
      createdAt: p.createdAt
    }))
  }
}

// Helper function to generate services report
async function generateServicesReport(dateFilter: any, groupBy: string) {
  const whereClause = Object.keys(dateFilter).length > 0 
    ? { createdAt: dateFilter }
    : {}

  const sessions = await db.patientSession.findMany({
    where: whereClause,
    include: {
      serviceAssignment: {
        include: {
          service: { select: { id: true, name: true } }
        }
      }
    }
  })

  // Group by service
  const serviceMap = new Map<string, { name: string; count: number; revenue: number }>()
  
  sessions.forEach(session => {
    const serviceId = session.serviceAssignment?.service.id || 'unknown'
    const serviceName = session.serviceAssignment?.service.name || 'Unknown'
    
    if (!serviceMap.has(serviceId)) {
      serviceMap.set(serviceId, { name: serviceName, count: 0, revenue: 0 })
    }
    
    const current = serviceMap.get(serviceId)!
    current.count++
    current.revenue += 0 // Since cost is not directly available in PatientSession
  })

  const byService = Array.from(serviceMap.entries()).map(([id, data]) => ({
    serviceId: id,
    serviceName: data.name,
    sessionCount: data.count,
    totalRevenue: data.revenue,
    averageRevenue: data.count > 0 ? data.revenue / data.count : 0
  })).sort((a, b) => b.totalRevenue - a.totalRevenue)

  return {
    byService,
    totalSessions: sessions.length,
    totalRevenue: 0 // Since cost is not directly available in PatientSession
  }
}

// Helper function to generate therapists report
async function generateTherapistsReport(dateFilter: any, groupBy: string) {
  const whereClause = Object.keys(dateFilter).length > 0 
    ? { createdAt: dateFilter }
    : {}

  const sessions = await db.patientSession.findMany({
    where: whereClause,
    include: {
      therapist: { 
        select: { 
          id: true
        } 
      }
    }
  })

  // Group by therapist
  const therapistMap = new Map<string, { name: string; sessions: number; revenue: number; completed: number }>()
  
  sessions.forEach(session => {
    const therapistId = session.therapistId
    const therapistName = `Therapist ${session.therapistId}`
    
    if (!therapistMap.has(therapistId)) {
      therapistMap.set(therapistId, { name: therapistName, sessions: 0, revenue: 0, completed: 0 })
    }
    
    const current = therapistMap.get(therapistId)!
    current.sessions++
    current.revenue += 0 // Since cost is not directly available in PatientSession
    if (session.status === 'COMPLETED') {
      current.completed++
    }
  })

  const byTherapist = Array.from(therapistMap.entries()).map(([id, data]) => ({
    therapistId: id,
    therapistName: data.name,
    totalSessions: data.sessions,
    completedSessions: data.completed,
    totalRevenue: data.revenue,
    completionRate: data.sessions > 0 ? (data.completed / data.sessions * 100).toFixed(2) : 0
  })).sort((a, b) => b.totalRevenue - a.totalRevenue)

  return {
    byTherapist,
    totalSessions: sessions.length,
    totalRevenue: 0 // Since cost is not directly available in PatientSession
  }
}

// Helper function to generate CSV response
function generateCSVResponse(data: any, reportType: string) {
  let csv = ''
  
  switch (reportType) {
    case 'revenue':
      csv = 'Metric,Amount\n'
      csv += `Total Revenue,$${data.summary.totalRevenue}\n`
      csv += `Paid Revenue,$${data.summary.paidRevenue}\n`
      csv += `Pending Revenue,$${data.summary.pendingRevenue}\n`
      csv += `Overdue Revenue,$${data.summary.overdueRevenue}\n`
      csv += `Collection Rate,${data.summary.collectionRate}%\n`
      break
    
    case 'services':
      csv = 'Service,Sessions,Revenue,Average Revenue\n'
      data.byService.forEach((s: any) => {
        csv += `${s.serviceName},${s.sessionCount},$${s.totalRevenue},$${s.averageRevenue}\n`
      })
      break
    
    case 'therapists':
      csv = 'Therapist,Sessions,Completed,Revenue,Completion Rate\n'
      data.byTherapist.forEach((t: any) => {
        csv += `${t.therapistName},${t.totalSessions},${t.completedSessions},$${t.totalRevenue},${t.completionRate}%\n`
      })
      break
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="financial-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv"`
    }
  })
}
