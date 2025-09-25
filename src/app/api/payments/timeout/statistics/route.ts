import { NextRequest, NextResponse } from 'next/server'
import { PaymentTimeoutManager } from '@/lib/payment-timeout-manager'
import { z } from 'zod'

const timeoutStatisticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// GET - Get timeout statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = timeoutStatisticsQuerySchema.safeParse(queryParams)
    
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
    
    const { startDate, endDate } = validationResult.data
    
    // Build date range
    const dateRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : undefined
    
    // Get timeout statistics
    const statistics = await PaymentTimeoutManager.getTimeoutStatistics(dateRange)
    
    return NextResponse.json({
      success: true,
      data: statistics
    })
    
  } catch (error) {
    console.error('Error getting timeout statistics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get timeout statistics' 
      },
      { status: 500 }
    )
  }
}
