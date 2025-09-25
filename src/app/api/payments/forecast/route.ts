import { NextRequest, NextResponse } from 'next/server'
import { PaymentAnalyticsManager } from '@/lib/payment-analytics-manager'
import { z } from 'zod'

const forecastQuerySchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  historicalMonths: z.string().optional().transform(val => val ? parseInt(val) : 12)
})

// POST - Generate payment forecast
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = forecastQuerySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }
    
    const { startDate, endDate, historicalMonths } = validationResult.data
    
    // Generate payment forecast
    const forecast = await PaymentAnalyticsManager.generatePaymentForecast(
      { start: new Date(startDate), end: new Date(endDate) },
      historicalMonths
    )
    
    return NextResponse.json({
      success: true,
      data: forecast,
      message: 'Payment forecast generated successfully'
    })
    
  } catch (error) {
    console.error('Error generating payment forecast:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate payment forecast' 
      },
      { status: 500 }
    )
  }
}
