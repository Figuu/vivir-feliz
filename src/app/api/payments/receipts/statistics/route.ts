import { NextRequest, NextResponse } from 'next/server'
import { PaymentReceiptManager, ReceiptSearchFilters } from '@/lib/payment-receipt-manager'
import { z } from 'zod'

const receiptStatisticsQuerySchema = z.object({
  // Filtering
  paymentId: z.string().uuid().optional(),
  receiptType: z.enum(['PAYMENT_RECEIPT', 'BANK_STATEMENT', 'TRANSACTION_PROOF', 'INVOICE', 'OTHER']).optional(),
  status: z.enum(['PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED', 'EXPIRED']).optional(),
  uploadedBy: z.string().optional(),
  fileType: z.enum(['PDF', 'JPG', 'JPEG', 'PNG', 'DOC', 'DOCX', 'TXT']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// GET - Get receipt statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = receiptStatisticsQuerySchema.safeParse(queryParams)
    
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
      paymentId,
      receiptType,
      status,
      uploadedBy,
      fileType,
      startDate,
      endDate
    } = validationResult.data
    
    // Build filters
    const filters: ReceiptSearchFilters = {}
    
    if (paymentId) filters.paymentId = paymentId
    if (receiptType) filters.receiptType = receiptType
    if (status) filters.status = status
    if (uploadedBy) filters.uploadedBy = uploadedBy
    if (fileType) filters.fileType = fileType
    
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
    
    // Get receipt statistics
    const statistics = await PaymentReceiptManager.getReceiptStatistics(filters)
    
    return NextResponse.json({
      success: true,
      data: statistics
    })
    
  } catch (error) {
    console.error('Error getting receipt statistics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get receipt statistics' 
      },
      { status: 500 }
    )
  }
}


