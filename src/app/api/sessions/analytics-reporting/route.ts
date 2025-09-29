import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const analyticsQuerySchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  therapistId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('day'),
  includeProjections: z.boolean().default(false)
})

const reportQuerySchema = z.object({
  reportType: z.enum(['SCHEDULING_PERFORMANCE', 'UTILIZATION', 'TRENDS', 'COMPARATIVE', 'CUSTOM']),
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  therapistId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
  includeCharts: z.boolean().default(true)
})

const customReportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  metrics: z.array(z.string()),
  filters: z.record(z.any()),
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime()
  }),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('day')
})

// GET /api/sessions/analytics-reporting - Get analytics and reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'overview'

    switch (action) {
      case 'overview':
        return await handleGetOverview(searchParams)
      case 'scheduling-performance':
        return await handleGetSchedulingPerformance(searchParams)
      case 'utilization':
        return await handleGetUtilization(searchParams)
      case 'trends':
        return await handleGetTrends(searchParams)
      case 'comparative':
        return await handleGetComparative(searchParams)
      case 'export':
        return await handleExportReport(searchParams)
      case 'custom-reports':
        return await handleGetCustomReports(searchParams)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: overview, scheduling-performance, utilization, trends, comparative, export, or custom-reports' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in analytics-reporting API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/analytics-reporting - Generate reports and analytics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'generate-report'

    switch (action) {
      case 'generate-report':
        return await handleGenerateReport(body)
      case 'create-custom-report':
        return await handleCreateCustomReport(body)
      case 'schedule-report':
        return await handleScheduleReport(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: generate-report, create-custom-report, or schedule-report' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in analytics-reporting API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleGetOverview(searchParams: URLSearchParams) {
  try {
    const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const dateTo = searchParams.get('dateTo') || new Date().toISOString()

    // Get overview statistics
    const [
      totalSessions,
      totalTherapists,
      totalServices,
      schedulingMetrics,
      utilizationMetrics,
      trendData
    ] = await Promise.all([
      getTotalSessions(dateFrom, dateTo),
      getTotalTherapists(),
      getTotalServices(),
      getSchedulingPerformanceMetrics(dateFrom, dateTo),
      getUtilizationMetrics(dateFrom, dateTo),
      getTrendData(dateFrom, dateTo, 'day')
    ])

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalSessions,
          totalTherapists,
          totalServices,
          dateRange: { from: dateFrom, to: dateTo }
        },
        scheduling: schedulingMetrics,
        utilization: utilizationMetrics,
        trends: trendData
      }
    })

  } catch (error) {
    console.error('Error getting overview:', error)
    return NextResponse.json(
      { error: 'Failed to get overview' },
      { status: 500 }
    )
  }
}

async function handleGetSchedulingPerformance(searchParams: URLSearchParams) {
  try {
    const validation = analyticsQuerySchema.safeParse({
      dateFrom: searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo: searchParams.get('dateTo') || new Date().toISOString(),
      therapistId: searchParams.get('therapistId'),
      serviceId: searchParams.get('serviceId'),
      groupBy: searchParams.get('groupBy') || 'day',
      includeProjections: searchParams.get('includeProjections') === 'true'
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { dateFrom, dateTo, therapistId, serviceId, groupBy, includeProjections } = validation.data

    const performance = await getSchedulingPerformanceAnalysis(dateFrom, dateTo, {
      therapistId,
      serviceId,
      groupBy,
      includeProjections
    })

    return NextResponse.json({
      success: true,
      data: performance
    })

  } catch (error) {
    console.error('Error getting scheduling performance:', error)
    return NextResponse.json(
      { error: 'Failed to get scheduling performance' },
      { status: 500 }
    )
  }
}

async function handleGetUtilization(searchParams: URLSearchParams) {
  try {
    const validation = analyticsQuerySchema.safeParse({
      dateFrom: searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo: searchParams.get('dateTo') || new Date().toISOString(),
      therapistId: searchParams.get('therapistId'),
      serviceId: searchParams.get('serviceId'),
      groupBy: searchParams.get('groupBy') || 'day',
      includeProjections: searchParams.get('includeProjections') === 'true'
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { dateFrom, dateTo, therapistId, serviceId, groupBy, includeProjections } = validation.data

    const utilization = await getUtilizationAnalysis(dateFrom, dateTo, {
      therapistId,
      serviceId,
      groupBy,
      includeProjections
    })

    return NextResponse.json({
      success: true,
      data: utilization
    })

  } catch (error) {
    console.error('Error getting utilization:', error)
    return NextResponse.json(
      { error: 'Failed to get utilization' },
      { status: 500 }
    )
  }
}

async function handleGetTrends(searchParams: URLSearchParams) {
  try {
    const validation = analyticsQuerySchema.safeParse({
      dateFrom: searchParams.get('dateFrom') || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo: searchParams.get('dateTo') || new Date().toISOString(),
      therapistId: searchParams.get('therapistId'),
      serviceId: searchParams.get('serviceId'),
      groupBy: searchParams.get('groupBy') || 'week',
      includeProjections: searchParams.get('includeProjections') === 'true'
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { dateFrom, dateTo, therapistId, serviceId, groupBy, includeProjections } = validation.data

    const trends = await getTrendAnalysis(dateFrom, dateTo, {
      therapistId,
      serviceId,
      groupBy,
      includeProjections
    })

    return NextResponse.json({
      success: true,
      data: trends
    })

  } catch (error) {
    console.error('Error getting trends:', error)
    return NextResponse.json(
      { error: 'Failed to get trends' },
      { status: 500 }
    )
  }
}

async function handleGetComparative(searchParams: URLSearchParams) {
  try {
    const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const dateTo = searchParams.get('dateTo') || new Date().toISOString()
    const compareWith = searchParams.get('compareWith') || 'previous-period'

    const comparison = await getComparativeAnalysis(dateFrom, dateTo, compareWith)

    return NextResponse.json({
      success: true,
      data: comparison
    })

  } catch (error) {
    console.error('Error getting comparative analysis:', error)
    return NextResponse.json(
      { error: 'Failed to get comparative analysis' },
      { status: 500 }
    )
  }
}

async function handleExportReport(searchParams: URLSearchParams) {
  try {
    const validation = reportQuerySchema.safeParse({
      reportType: searchParams.get('reportType') || 'SCHEDULING_PERFORMANCE',
      dateFrom: searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      dateTo: searchParams.get('dateTo') || new Date().toISOString(),
      therapistId: searchParams.get('therapistId'),
      serviceId: searchParams.get('serviceId'),
      format: searchParams.get('format') || 'json',
      includeCharts: searchParams.get('includeCharts') === 'true'
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const report = await generateReport(validation.data)

    return NextResponse.json({
      success: true,
      data: report
    })

  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    )
  }
}

async function handleGetCustomReports(searchParams: URLSearchParams) {
  try {
    const reports = await getCustomReports()

    return NextResponse.json({
      success: true,
      data: { reports }
    })

  } catch (error) {
    console.error('Error getting custom reports:', error)
    return NextResponse.json(
      { error: 'Failed to get custom reports' },
      { status: 500 }
    )
  }
}

async function handleGenerateReport(body: any) {
  try {
    const validation = reportQuerySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const report = await generateReport(validation.data)

    return NextResponse.json({
      success: true,
      data: report
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

async function handleCreateCustomReport(body: any) {
  try {
    const validation = customReportSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const report = await createCustomReport(validation.data)

    return NextResponse.json({
      success: true,
      data: { report }
    })

  } catch (error) {
    console.error('Error creating custom report:', error)
    return NextResponse.json(
      { error: 'Failed to create custom report' },
      { status: 500 }
    )
  }
}

async function handleScheduleReport(body: any) {
  try {
    const { reportId, schedule, recipients } = body

    if (!reportId || !schedule || !recipients) {
      return NextResponse.json(
        { error: 'Report ID, schedule, and recipients are required' },
        { status: 400 }
      )
    }

    const scheduledReport = await scheduleReport(reportId, schedule, recipients)

    return NextResponse.json({
      success: true,
      data: { scheduledReport }
    })

  } catch (error) {
    console.error('Error scheduling report:', error)
    return NextResponse.json(
      { error: 'Failed to schedule report' },
      { status: 500 }
    )
  }
}

// Helper functions
async function getTotalSessions(dateFrom: string, dateTo: string): Promise<number> {
  try {
    return await db.patientSession.count({
      where: {
        scheduledDate: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      }
    })
  } catch (error) {
    console.error('Error getting total sessions:', error)
    return 0
  }
}

async function getTotalTherapists(): Promise<number> {
  try {
    return await db.therapist.count({
      where: { isActive: true }
    })
  } catch (error) {
    console.error('Error getting total therapists:', error)
    return 0
  }
}

async function getTotalServices(): Promise<number> {
  try {
    return await db.service.count({
      where: { isActive: true }
    })
  } catch (error) {
    console.error('Error getting total services:', error)
    return 0
  }
}

async function getSchedulingPerformanceMetrics(dateFrom: string, dateTo: string): Promise<any> {
  try {
    const sessions = await db.patientSession.findMany({
      where: {
        scheduledDate: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      }
    })

    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length
    const cancelledSessions = sessions.filter(s => s.status === 'CANCELLED').length
    const noShowSessions = sessions.filter(s => s.status === 'NO_SHOW').length
    const rescheduledSessions = sessions.filter(s => s.status === 'RESCHEDULE_REQUESTED').length

    return {
      totalSessions,
      completedSessions,
      cancelledSessions,
      noShowSessions,
      rescheduledSessions,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      cancellationRate: totalSessions > 0 ? (cancelledSessions / totalSessions) * 100 : 0,
      noShowRate: totalSessions > 0 ? (noShowSessions / totalSessions) * 100 : 0,
      rescheduleRate: totalSessions > 0 ? (rescheduledSessions / totalSessions) * 100 : 0
    }
  } catch (error) {
    console.error('Error getting scheduling performance metrics:', error)
    return {}
  }
}

async function getUtilizationMetrics(dateFrom: string, dateTo: string): Promise<any> {
  try {
    const therapists = await db.therapist.findMany({
      where: { isActive: true },
      include: {
        sessions: {
          where: {
            scheduledDate: {
              gte: new Date(dateFrom),
              lte: new Date(dateTo)
            }
          }
        }
      }
    })

    const utilizationData = therapists.map(therapist => {
      const totalSessions = therapist.sessions.length
      const totalHours = therapist.sessions.reduce((sum, session) => sum + session.duration, 0) / 60
      
      // Get capacity config
      const maxSessionsPerWeek = 40 // Default, should come from capacity config
      const maxHoursPerWeek = 40 // Default, should come from capacity config
      
      const sessionUtilization = (totalSessions / maxSessionsPerWeek) * 100
      const hourUtilization = (totalHours / maxHoursPerWeek) * 100
      const overallUtilization = Math.max(sessionUtilization, hourUtilization)

      return {
        therapistId: therapist.id,
        therapistName: `${therapist.firstName} ${therapist.lastName}`,
        totalSessions,
        totalHours,
        sessionUtilization,
        hourUtilization,
        overallUtilization
      }
    })

    const averageUtilization = utilizationData.reduce((sum, item) => sum + item.overallUtilization, 0) / utilizationData.length
    const maxUtilization = Math.max(...utilizationData.map(item => item.overallUtilization))
    const minUtilization = Math.min(...utilizationData.map(item => item.overallUtilization))

    return {
      averageUtilization,
      maxUtilization,
      minUtilization,
      therapistUtilization: utilizationData,
      totalTherapists: therapists.length,
      overloadedTherapists: utilizationData.filter(item => item.overallUtilization > 90).length,
      underutilizedTherapists: utilizationData.filter(item => item.overallUtilization < 50).length
    }
  } catch (error) {
    console.error('Error getting utilization metrics:', error)
    return {}
  }
}

async function getTrendData(dateFrom: string, dateTo: string, groupBy: string): Promise<any> {
  try {
    const sessions = await db.patientSession.findMany({
      where: {
        scheduledDate: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo)
        }
      },
      orderBy: { scheduledDate: 'asc' }
    })

    // Group sessions by time period
    const groupedData = groupSessionsByPeriod(sessions, groupBy)

    return {
      period: groupBy,
      data: groupedData,
      trends: calculateTrends(groupedData)
    }
  } catch (error) {
    console.error('Error getting trend data:', error)
    return { period: groupBy, data: [], trends: {} }
  }
}

async function getSchedulingPerformanceAnalysis(dateFrom: string, dateTo: string, options: any): Promise<any> {
  try {
    const whereClause: any = {
      scheduledDate: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo)
      }
    }

    if (options.therapistId) {
      whereClause.therapistId = options.therapistId
    }

    if (options.serviceId) {
      whereClause.serviceAssignment = {
        some: {
          serviceId: options.serviceId
        }
      }
    }

    const sessions = await db.patientSession.findMany({
      where: whereClause,
      include: {
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        serviceAssignment: {
          include: {
            service: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { scheduledDate: 'asc' }
    })

    // Group by specified period
    const groupedData = groupSessionsByPeriod(sessions, options.groupBy)

    // Calculate performance metrics for each period
    const performanceData = groupedData.map((period: any) => {
      const periodSessions = period.sessions
      const totalSessions = periodSessions.length
      const completedSessions = periodSessions.filter((s: any) => s.status === 'COMPLETED').length
      const cancelledSessions = periodSessions.filter((s: any) => s.status === 'CANCELLED').length
      const noShowSessions = periodSessions.filter((s: any) => s.status === 'NO_SHOW').length

      return {
        period: period.period,
        totalSessions,
        completedSessions,
        cancelledSessions,
        noShowSessions,
        completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
        cancellationRate: totalSessions > 0 ? (cancelledSessions / totalSessions) * 100 : 0,
        noShowRate: totalSessions > 0 ? (noShowSessions / totalSessions) * 100 : 0
      }
    })

    return {
      groupBy: options.groupBy,
      dateRange: { from: dateFrom, to: dateTo },
      performance: performanceData,
      summary: calculatePerformanceSummary(performanceData)
    }
  } catch (error) {
    console.error('Error getting scheduling performance analysis:', error)
    return { groupBy: options.groupBy, performance: [], summary: {} }
  }
}

async function getUtilizationAnalysis(dateFrom: string, dateTo: string, options: any): Promise<any> {
  try {
    const whereClause: any = {
      scheduledDate: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo)
      }
    }

    if (options.therapistId) {
      whereClause.therapistId = options.therapistId
    }

    if (options.serviceId) {
      whereClause.serviceAssignment = {
        some: {
          serviceId: options.serviceId
        }
      }
    }

    const sessions = await db.patientSession.findMany({
      where: whereClause,
      include: {
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Group by therapist and period
    const therapistUtilization = calculateTherapistUtilization(sessions, options.groupBy)

    return {
      groupBy: options.groupBy,
      dateRange: { from: dateFrom, to: dateTo },
      utilization: therapistUtilization,
      summary: calculateUtilizationSummary(therapistUtilization)
    }
  } catch (error) {
    console.error('Error getting utilization analysis:', error)
    return { groupBy: options.groupBy, utilization: [], summary: {} }
  }
}

async function getTrendAnalysis(dateFrom: string, dateTo: string, options: any): Promise<any> {
  try {
    const whereClause: any = {
      scheduledDate: {
        gte: new Date(dateFrom),
        lte: new Date(dateTo)
      }
    }

    if (options.therapistId) {
      whereClause.therapistId = options.therapistId
    }

    if (options.serviceId) {
      whereClause.serviceAssignment = {
        some: {
          serviceId: options.serviceId
        }
      }
    }

    const sessions = await db.patientSession.findMany({
      where: whereClause,
      orderBy: { scheduledDate: 'asc' }
    })

    const groupedData = groupSessionsByPeriod(sessions, options.groupBy)
    const trends = calculateTrends(groupedData)

    return {
      groupBy: options.groupBy,
      dateRange: { from: dateFrom, to: dateTo },
      trends: trends,
      data: groupedData
    }
  } catch (error) {
    console.error('Error getting trend analysis:', error)
    return { groupBy: options.groupBy, trends: {}, data: [] }
  }
}

async function getComparativeAnalysis(dateFrom: string, dateTo: string, compareWith: string): Promise<any> {
  try {
    const currentPeriod = {
      from: new Date(dateFrom),
      to: new Date(dateTo)
    }

    let comparisonPeriod
    const periodLength = currentPeriod.to.getTime() - currentPeriod.from.getTime()

    switch (compareWith) {
      case 'previous-period':
        comparisonPeriod = {
          from: new Date(currentPeriod.from.getTime() - periodLength),
          to: new Date(currentPeriod.to.getTime() - periodLength)
        }
        break
      case 'same-period-last-year':
        comparisonPeriod = {
          from: new Date(currentPeriod.from.getFullYear() - 1, currentPeriod.from.getMonth(), currentPeriod.from.getDate()),
          to: new Date(currentPeriod.to.getFullYear() - 1, currentPeriod.to.getMonth(), currentPeriod.to.getDate())
        }
        break
      default:
        comparisonPeriod = {
          from: new Date(currentPeriod.from.getTime() - periodLength),
          to: new Date(currentPeriod.to.getTime() - periodLength)
        }
    }

    const [currentData, comparisonData] = await Promise.all([
      getSchedulingPerformanceMetrics(currentPeriod.from.toISOString(), currentPeriod.to.toISOString()),
      getSchedulingPerformanceMetrics(comparisonPeriod.from.toISOString(), comparisonPeriod.to.toISOString())
    ])

    return {
      currentPeriod: {
        from: currentPeriod.from.toISOString(),
        to: currentPeriod.to.toISOString(),
        data: currentData
      },
      comparisonPeriod: {
        from: comparisonPeriod.from.toISOString(),
        to: comparisonPeriod.to.toISOString(),
        data: comparisonData
      },
      comparison: calculateComparison(currentData, comparisonData)
    }
  } catch (error) {
    console.error('Error getting comparative analysis:', error)
    return { currentPeriod: {}, comparisonPeriod: {}, comparison: {} }
  }
}

async function generateReport(reportData: any): Promise<any> {
  try {
    let report

    switch (reportData.reportType) {
      case 'SCHEDULING_PERFORMANCE':
        report = await getSchedulingPerformanceAnalysis(reportData.dateFrom, reportData.dateTo, {
          groupBy: 'week',
          includeProjections: false
        })
        break
      case 'UTILIZATION':
        report = await getUtilizationAnalysis(reportData.dateFrom, reportData.dateTo, {
          groupBy: 'week',
          includeProjections: false
        })
        break
      case 'TRENDS':
        report = await getTrendAnalysis(reportData.dateFrom, reportData.dateTo, {
          groupBy: 'week',
          includeProjections: true
        })
        break
      case 'COMPARATIVE':
        report = await getComparativeAnalysis(reportData.dateFrom, reportData.dateTo, 'previous-period')
        break
      default:
        report = await getSchedulingPerformanceAnalysis(reportData.dateFrom, reportData.dateTo, {
          groupBy: 'week',
          includeProjections: false
        })
    }

    return {
      reportType: reportData.reportType,
      format: reportData.format,
      generatedAt: new Date().toISOString(),
      data: report
    }
  } catch (error) {
    console.error('Error generating report:', error)
    throw error
  }
}

async function getCustomReports(): Promise<any[]> {
  try {
    // In a real implementation, this would fetch from a custom reports table
    return []
  } catch (error) {
    console.error('Error getting custom reports:', error)
    return []
  }
}

async function createCustomReport(reportData: any): Promise<any> {
  try {
    // In a real implementation, this would save to a custom reports table
    return {
      id: `custom-${Date.now()}`,
      ...reportData,
      createdAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error creating custom report:', error)
    throw error
  }
}

async function scheduleReport(reportId: string, schedule: any, recipients: string[]): Promise<any> {
  try {
    // In a real implementation, this would save to a scheduled reports table
    return {
      id: `scheduled-${Date.now()}`,
      reportId,
      schedule,
      recipients,
      createdAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error scheduling report:', error)
    throw error
  }
}

// Utility functions
function groupSessionsByPeriod(sessions: any[], groupBy: string): any[] {
  const groups: any = {}

  sessions.forEach(session => {
    const date = new Date(session.scheduledDate)
    let key

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        key = `${date.getFullYear()}-Q${quarter}`
        break
      case 'year':
        key = date.getFullYear().toString()
        break
      default:
        key = date.toISOString().split('T')[0]
    }

    if (!groups[key]) {
      groups[key] = {
        period: key,
        sessions: []
      }
    }

    groups[key].sessions.push(session)
  })

  return Object.values(groups).sort((a: any, b: any) => a.period.localeCompare(b.period))
}

function calculateTrends(groupedData: any[]): any {
  if (groupedData.length < 2) {
    return { direction: 'stable', percentage: 0 }
  }

  const firstPeriod = groupedData[0]
  const lastPeriod = groupedData[groupedData.length - 1]

  const firstValue = firstPeriod.sessions.length
  const lastValue = lastPeriod.sessions.length

  const percentage = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0
  const direction = percentage > 5 ? 'increasing' : percentage < -5 ? 'decreasing' : 'stable'

  return { direction, percentage: Math.abs(percentage) }
}

function calculatePerformanceSummary(performanceData: any[]): any {
  if (performanceData.length === 0) {
    return {}
  }

  const totalSessions = performanceData.reduce((sum, period) => sum + period.totalSessions, 0)
  const totalCompleted = performanceData.reduce((sum, period) => sum + period.completedSessions, 0)
  const totalCancelled = performanceData.reduce((sum, period) => sum + period.cancelledSessions, 0)
  const totalNoShow = performanceData.reduce((sum, period) => sum + period.noShowSessions, 0)

  return {
    totalSessions,
    totalCompleted,
    totalCancelled,
    totalNoShow,
    averageCompletionRate: totalSessions > 0 ? (totalCompleted / totalSessions) * 100 : 0,
    averageCancellationRate: totalSessions > 0 ? (totalCancelled / totalSessions) * 100 : 0,
    averageNoShowRate: totalSessions > 0 ? (totalNoShow / totalSessions) * 100 : 0
  }
}

function calculateTherapistUtilization(sessions: any[], groupBy: string): any[] {
  const therapistGroups: any = {}

  sessions.forEach(session => {
    const therapistId = session.therapist.id
    const therapistName = `${session.therapist.firstName} ${session.therapist.lastName}`

    if (!therapistGroups[therapistId]) {
      therapistGroups[therapistId] = {
        therapistId,
        therapistName,
        totalSessions: 0,
        totalHours: 0,
        periods: {}
      }
    }

    therapistGroups[therapistId].totalSessions += 1
    therapistGroups[therapistId].totalHours += session.duration / 60

    // Group by period
    const date = new Date(session.scheduledDate)
    let periodKey

    switch (groupBy) {
      case 'day':
        periodKey = date.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        periodKey = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        periodKey = date.toISOString().split('T')[0]
    }

    if (!therapistGroups[therapistId].periods[periodKey]) {
      therapistGroups[therapistId].periods[periodKey] = {
        period: periodKey,
        sessions: 0,
        hours: 0
      }
    }

    therapistGroups[therapistId].periods[periodKey].sessions += 1
    therapistGroups[therapistId].periods[periodKey].hours += session.duration / 60
  })

  return Object.values(therapistGroups).map((therapist: any) => ({
    ...therapist,
    periods: Object.values(therapist.periods).sort((a: any, b: any) => a.period.localeCompare(b.period))
  }))
}

function calculateUtilizationSummary(utilizationData: any[]): any {
  if (utilizationData.length === 0) {
    return {}
  }

  const totalSessions = utilizationData.reduce((sum, therapist) => sum + therapist.totalSessions, 0)
  const totalHours = utilizationData.reduce((sum, therapist) => sum + therapist.totalHours, 0)

  return {
    totalSessions,
    totalHours,
    averageSessionsPerTherapist: totalSessions / utilizationData.length,
    averageHoursPerTherapist: totalHours / utilizationData.length,
    totalTherapists: utilizationData.length
  }
}

function calculateComparison(currentData: any, comparisonData: any): any {
  const metrics = ['totalSessions', 'completedSessions', 'cancelledSessions', 'noShowSessions', 'completionRate', 'cancellationRate', 'noShowRate']

  const comparison: any = {}

  metrics.forEach(metric => {
    const current = currentData[metric] || 0
    const comparison = comparisonData[metric] || 0
    const change = current - comparison
    const percentageChange = comparison > 0 ? (change / comparison) * 100 : 0

    comparison[metric] = {
      current,
      comparison,
      change,
      percentageChange,
      direction: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'stable'
    }
  })

  return comparison
}
