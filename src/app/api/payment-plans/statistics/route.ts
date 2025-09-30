import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get payment plan statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Validate date range if provided
    let dateFilter: any = {}
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
      
      dateFilter = {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    }
    
    // Get payment plan statistics
    const [
      totalPlans,
      activePlans,
      totalRevenue
    ] = await Promise.all([
      db.paymentPlan.count({ where: dateFilter }),
      db.paymentPlan.count({ where: { ...dateFilter, isActive: true } }),
      db.paymentPlan.aggregate({
        where: { ...dateFilter, isActive: true },
        _sum: { totalAmount: true }
      })
    ])

    const averagePlanValue = totalPlans > 0 ? ((totalRevenue._sum.totalAmount?.toNumber() || 0) / totalPlans) : 0

    const statistics = {
      totalPlans,
      activePlans,
      totalRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0,
      averagePlanValue
    }
    
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


