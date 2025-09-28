import { NextRequest, NextResponse } from 'next/server'
import { FormProgressTracker, type FormType } from '@/lib/form-progress-tracker'
import { z } from 'zod'

const analyticsQuerySchema = z.object({
  formType: z.enum(['MEDICAL_FORM', 'THERAPIST_FORM']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// GET - Get progress analytics
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
    
    const { formType, startDate, endDate } = validationResult.data
    
    // Build date range
    const dateRange = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : undefined
    
    // Get progress analytics
    const analytics = await FormProgressTracker.getProgressAnalytics(
      formType as FormType,
      dateRange
    )
    
    return NextResponse.json({
      success: true,
      data: analytics
    })
    
  } catch (error) {
    console.error('Error getting progress analytics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get progress analytics' 
      },
      { status: 500 }
    )
  }
}

