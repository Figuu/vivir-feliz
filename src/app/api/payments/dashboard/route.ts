import { NextRequest, NextResponse } from 'next/server'
import { PaymentAnalyticsManager } from '@/lib/payment-analytics-manager'

// GET - Get real-time dashboard data
export async function GET(request: NextRequest) {
  try {
    // Get real-time dashboard data
    const dashboard = await PaymentAnalyticsManager.getRealTimeDashboard()
    
    return NextResponse.json({
      success: true,
      data: dashboard
    })
    
  } catch (error) {
    console.error('Error getting real-time dashboard:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get real-time dashboard data' 
      },
      { status: 500 }
    )
  }
}
