import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Simplified validation schema
const analyticsQuerySchema = z.object({
  patientId: z.string().uuid('Invalid patient ID').optional(),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format')
    .transform(val => new Date(val))
    .optional(),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format')
    .transform(val => new Date(val))
    .optional(),
  analyticsType: z.enum(['overview', 'trends', 'comparative']).optional().default('overview')
})

// GET /api/progress-analytics - Get progress analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const validation = analyticsQuerySchema.safeParse({
      patientId: searchParams.get('patientId'),
      therapistId: searchParams.get('therapistId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      analyticsType: searchParams.get('analyticsType')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const params = validation.data

    // Set default date range if not provided
    const endDate = params.endDate || new Date()
    const startDate = params.startDate || new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days ago

    // Build where clause
    const whereClause: any = {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    if (params.patientId) {
      whereClause.patientId = params.patientId
    }

    if (params.therapistId) {
      whereClause.therapistId = params.therapistId
    }

    // Fetch progress reports
    const progressReports = await db.progressReport.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        therapist: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        therapeuticPlan: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Generate analytics based on type
    let analytics: any = {}

    switch (params.analyticsType) {
      case 'overview':
        analytics = generateOverviewAnalytics(progressReports)
        break
      case 'trends':
        analytics = generateTrendAnalytics(progressReports)
        break
      case 'comparative':
        analytics = generateComparativeAnalytics(progressReports)
        break
      default:
        analytics = generateOverviewAnalytics(progressReports)
    }

    // Add metadata
    analytics.metadata = {
      generatedAt: new Date().toISOString(),
      parameters: params,
      dataRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalReports: progressReports.length
      }
    }

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error) {
    console.error('Error generating progress analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate overview analytics
function generateOverviewAnalytics(progressReports: any[]) {
  const totalReports = progressReports.length
  
  // Calculate status distribution
  const statusDistribution: any = {}
  progressReports.forEach(report => {
    statusDistribution[report.status] = (statusDistribution[report.status] || 0) + 1
  })

  // Calculate progress distribution (based on progress field)
  const progressDistribution = {
    '0-20': 0,
    '21-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0
  }
  
  progressReports.forEach(report => {
    if (report.progress) {
      const progress = parseFloat(report.progress)
    if (progress <= 20) progressDistribution['0-20']++
    else if (progress <= 40) progressDistribution['21-40']++
    else if (progress <= 60) progressDistribution['41-60']++
    else if (progress <= 80) progressDistribution['61-80']++
    else progressDistribution['81-100']++
    }
  })

  return {
    overview: {
      totalReports,
      statusDistribution,
      progressDistribution
    },
    insights: generateBasicInsights(progressReports)
  }
}

// Helper function to generate trend analytics
function generateTrendAnalytics(progressReports: any[]) {
  // Group reports by month
  const monthlyTrends: any = {}
  
  progressReports.forEach(report => {
    const date = new Date(report.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyTrends[monthKey]) {
      monthlyTrends[monthKey] = {
        month: monthKey,
        count: 0,
        reports: []
      }
    }
    
    monthlyTrends[monthKey].count++
    monthlyTrends[monthKey].reports.push(report)
  })

  return {
    trends: Object.values(monthlyTrends),
    insights: ['Monthly trend analysis shows progress report patterns']
  }
}

// Helper function to generate comparative analytics
function generateComparativeAnalytics(progressReports: any[]) {
  // Simple comparison between first half and second half of reports
  const sortedReports = [...progressReports].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
  
  const midPoint = Math.floor(sortedReports.length / 2)
  const firstHalf = sortedReports.slice(0, midPoint)
  const secondHalf = sortedReports.slice(midPoint)
  
  const firstHalfCount = firstHalf.length
  const secondHalfCount = secondHalf.length

  return {
    comparison: {
      firstHalf: { count: firstHalfCount },
      secondHalf: { count: secondHalfCount },
      change: secondHalfCount - firstHalfCount,
      changePercent: firstHalfCount > 0 ? ((secondHalfCount - firstHalfCount) / firstHalfCount) * 100 : 0
    },
    insights: ['Comparative analysis shows changes over time']
  }
}

// Helper function to generate basic insights
function generateBasicInsights(progressReports: any[]) {
  const insights = []
  
  if (progressReports.length === 0) {
    insights.push('No progress reports available for the selected period')
    return insights
  }

  const draftCount = progressReports.filter(r => r.status === 'DRAFT').length
  const submittedCount = progressReports.filter(r => r.status === 'SUBMITTED').length
  const approvedCount = progressReports.filter(r => r.status === 'APPROVED').length

  insights.push(`Total of ${progressReports.length} progress reports`)
  
  if (draftCount > 0) {
    insights.push(`${draftCount} reports are still in draft status`)
  }
  
  if (submittedCount > 0) {
    insights.push(`${submittedCount} reports have been submitted for review`)
  }
  
  if (approvedCount > 0) {
    insights.push(`${approvedCount} reports have been approved`)
  }

  return insights
}