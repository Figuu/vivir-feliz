import { NextRequest, NextResponse } from 'next/server'
import { PaymentHistoryManager, PaymentHistoryFilter, PaymentHistorySort } from '@/lib/payment-history-manager'
import { z } from 'zod'

const paymentHistoryQuerySchema = z.object({
  // Pagination
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
  
  // Filtering
  patientId: z.string().uuid().optional(),
  therapistId: z.string().uuid().optional(),
  paymentMethod: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  searchTerm: z.string().optional(),
  
  // Sorting
  sortField: z.enum(['date', 'amount', 'status', 'method']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional()
})

// GET - Get payment history with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = paymentHistoryQuerySchema.safeParse(queryParams)
    
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
      page,
      limit,
      patientId,
      therapistId,
      paymentMethod,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      searchTerm,
      sortField,
      sortDirection
    } = validationResult.data
    
    // Build filters
    const filters: PaymentHistoryFilter = {}
    
    if (patientId) filters.patientId = patientId
    if (therapistId) filters.therapistId = therapistId
    if (paymentMethod) filters.paymentMethod = paymentMethod
    if (status) filters.status = status
    if (searchTerm) filters.searchTerm = searchTerm
    
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
      
      filters.dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      }
    }
    
    if (minAmount !== undefined || maxAmount !== undefined) {
      filters.amountRange = {
        min: minAmount || 0,
        max: maxAmount || Number.MAX_SAFE_INTEGER
      }
    }
    
    // Build sort
    const sort: PaymentHistorySort | undefined = sortField ? {
      field: sortField,
      direction: sortDirection || 'desc'
    } : undefined
    
    // Get payment history
    const result = await PaymentHistoryManager.getPaymentHistory(
      filters,
      sort,
      { page, limit }
    )
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error('Error getting payment history:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get payment history' 
      },
      { status: 500 }
    )
  }
}
