import { NextRequest, NextResponse } from 'next/server'
import { PaymentPlanManager } from '@/lib/payment-plan-manager'

// GET - Get payment plan statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Validate date range if provided
    let dateRange
    if (startDate || endDate) {
      if (!startDate || !endDate) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Both start date and end date are required' 
          },
          { status: 400 }
        )
      }
      
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid date format. Use YYYY-MM-DD' 
          },
          { status: 400 }
        )
      }
      
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (start > end) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Start date must be before end date' 
          },
          { status: 400 }
        )
      }
      
      // Check if date range is not too large (max 1 year)
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      if (daysDiff > 365) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Date range cannot exceed 365 days' 
          },
          { status: 400 }
        )
      }
      
      dateRange = { start, end }
    }
    
    // Get payment plan statistics
    const statistics = await PaymentPlanManager.getPaymentPlanStatistics(dateRange)
    
    return NextResponse.json({
      success: true,
      data: statistics
    })
    
  } catch (error) {
    console.error('Error getting payment plan statistics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payment plan statistics' 
      },
      { status: 500 }
    )
  }
}
