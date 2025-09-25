import { NextRequest, NextResponse } from 'next/server'
import { PaymentPlanManager } from '@/lib/payment-plan-manager'

// GET - Get overdue payments
export async function GET(request: NextRequest) {
  try {
    const overduePayments = await PaymentPlanManager.getOverduePayments()
    
    return NextResponse.json({
      success: true,
      data: overduePayments
    })
    
  } catch (error) {
    console.error('Error getting overdue payments:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get overdue payments' 
      },
      { status: 500 }
    )
  }
}
