import { NextRequest, NextResponse } from 'next/server'
import { PaymentAnalyticsManager, AnalyticsPeriod } from '@/lib/payment-analytics-manager'
import { z } from 'zod'

const trendsQuerySchema = z.object({
  period: z.enum(['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'LAST_30_DAYS', 'LAST_90_DAYS', 'THIS_MONTH', 'LAST_MONTH', 'THIS_YEAR', 'LAST_YEAR', 'CUSTOM']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// GET - Get payment trends
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = trendsQuerySchema.safeParse(queryParams)
    
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
    
    const { period, startDate, endDate } = validationResult.data
    
    // Validate custom period
    if (period === 'CUSTOM') {
      if (!startDate || !endDate) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Start date and end date are required for custom period' 
          },
          { status: 400 }
        )
      }
    }
    
    // Get payment trends
    const trends = await PaymentAnalyticsManager.getPaymentTrends(
      period as AnalyticsPeriod,
      startDate && endDate ? { start: new Date(startDate), end: new Date(endDate) } : undefined
    )
    
    return NextResponse.json({
      success: true,
      data: trends
    })
    
  } catch (error) {
    console.error('Error getting payment trends:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payment trends' 
      },
      { status: 500 }
    )
  }
}