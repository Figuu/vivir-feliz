import { NextRequest, NextResponse } from 'next/server'
import { MedicalFormManager } from '@/lib/medical-form-manager-fixed'
import { z } from 'zod'

const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional().default('month'),
  includeDetails: z.string().optional().transform(val => val === 'true')
})

// GET - Get medical form analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = analyticsQuerySchema.safeParse(queryParams)
    
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
    
    const { startDate, endDate, groupBy, includeDetails } = validationResult.data
    
    // Build date range
    const dateRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : undefined
    
    // Get basic statistics
    const statistics = await MedicalFormManager.getFormStatistics(dateRange)
    
    // Get additional analytics data
    const analytics = {
      statistics,
      trends: {
        completionRate: statistics.totalForms > 0 
          ? (statistics.completedForms / statistics.totalForms) * 100 
          : 0,
        averageCompletionTime: statistics.averageCompletionTime,
        stepCompletionRates: statistics.stepCompletionRates
      },
      commonIssues: statistics.commonIssues,
      recommendations: generateRecommendations(statistics)
    }
    
    // Add detailed analytics if requested
    if (includeDetails) {
      analytics.detailed = await getDetailedAnalytics(dateRange, groupBy)
    }
    
    return NextResponse.json({
      success: true,
      data: analytics
    })
    
  } catch (error) {
    console.error('Error getting medical form analytics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get medical form analytics' 
      },
      { status: 500 }
    )
  }
}

// Helper function to generate recommendations based on statistics
function generateRecommendations(statistics: any): string[] {
  const recommendations = []
  
  if (statistics.completionRate < 70) {
    recommendations.push('Consider implementing form completion reminders to improve completion rates')
  }
  
  if (statistics.averageCompletionTime > 2) {
    recommendations.push('Forms are taking longer than expected to complete. Consider simplifying the process')
  }
  
  if (statistics.stepCompletionRates[1] < 90) {
    recommendations.push('Step 1 (Parent Information) has low completion rate. Review form design')
  }
  
  if (statistics.commonIssues.length > 0) {
    const topIssue = statistics.commonIssues[0]
    recommendations.push(`Address the most common issue: ${topIssue.issue} in step ${topIssue.step}`)
  }
  
  return recommendations
}

// Helper function to get detailed analytics
async function getDetailedAnalytics(dateRange: any, groupBy: string): Promise<any> {
  // This would contain more detailed analytics like:
  // - Time series data
  // - Completion patterns
  // - User behavior analysis
  // - Performance metrics
  
  return {
    timeSeries: [],
    completionPatterns: {},
    userBehavior: {},
    performanceMetrics: {}
  }
}
