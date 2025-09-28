import { NextRequest, NextResponse } from 'next/server'
import { PaymentAnalyticsManager, PaymentAnalyticsFilters, PaymentStatus, PaymentMethod } from '@/lib/payment-analytics-manager'
import { z } from 'zod'

const analyticsQuerySchema = z.object({
  // Date filtering
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  
  // Status filtering
  paymentStatus: z.string().optional().transform(val => 
    val ? val.split(',').map(s => s.trim() as PaymentStatus) : undefined
  ),
  
  // Method filtering
  paymentMethod: z.string().optional().transform(val => 
    val ? val.split(',').map(s => s.trim() as PaymentMethod) : undefined
  ),
  
  // Entity filtering
  therapistId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  specialtyId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  
  // Amount filtering
  minAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined)
})

// GET - Get payment analytics
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
    
    const {
      startDate,
      endDate,
      paymentStatus,
      paymentMethod,
      therapistId,
      patientId,
      specialtyId,
      serviceId,
      minAmount,
      maxAmount
    } = validationResult.data
    
    // Build filters
    const filters: PaymentAnalyticsFilters = {}
    
    if (startDate || endDate) {
      if (!startDate || !endDate) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Both start date and end date are required for date filtering' 
          },
          { status: 400 }
        )
      }
      
      filters.startDate = new Date(startDate)
      filters.endDate = new Date(endDate)
    }
    
    if (paymentStatus) filters.paymentStatus = paymentStatus
    if (paymentMethod) filters.paymentMethod = paymentMethod
    if (therapistId) filters.therapistId = therapistId
    if (patientId) filters.patientId = patientId
    if (specialtyId) filters.specialtyId = specialtyId
    if (serviceId) filters.serviceId = serviceId
    if (minAmount !== undefined) filters.minAmount = minAmount
    if (maxAmount !== undefined) filters.maxAmount = maxAmount
    
    // Get payment analytics
    const analytics = await PaymentAnalyticsManager.getPaymentAnalytics(filters)
    
    return NextResponse.json({
      success: true,
      data: analytics
    })
    
  } catch (error) {
    console.error('Error getting payment analytics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payment analytics' 
      },
      { status: 500 }
    )
  }
}


