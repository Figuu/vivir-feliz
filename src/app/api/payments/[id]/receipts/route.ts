import { NextRequest, NextResponse } from 'next/server'
import { PaymentReceiptManager, ReceiptUploadRequest, FileType } from '@/lib/payment-receipt-manager'
import { z } from 'zod'

const uploadReceiptSchema = z.object({
  receiptNumber: z.string().min(1, 'Receipt number is required').max(100, 'Receipt number too long'),
  fileSize: z.number().positive('File size must be positive').max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
  fileType: z.enum(['PDF', 'JPG', 'JPEG', 'PNG', 'DOC', 'DOCX', 'TXT']),
  fileData: z.string().min(1, 'File data is required'),
  generatedBy: z.string().optional()
})

const getReceiptsQuerySchema = z.object({
  // Pagination
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
  
  // Filtering
  generatedBy: z.string().optional(),
  fileType: z.enum(['PDF', 'JPG', 'JPEG', 'PNG', 'DOC', 'DOCX', 'TXT']).optional(),
  searchTerm: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
})

// POST - Upload receipt for a payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment ID format' },
        { status: 400 }
      )
    }
    
    // Validate request body
    const validationResult = uploadReceiptSchema.safeParse(body)
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
    
    const { 
      receiptNumber,
      fileSize, 
      fileType, 
      fileData, 
      generatedBy
    } = validationResult.data
    
    // Create receipt upload request
    const receiptRequest: ReceiptUploadRequest = {
      paymentId: id,
      receiptNumber,
      fileSize,
      fileType,
      fileData,
      generatedBy
    }
    
    // Upload receipt
    const receipt = await PaymentReceiptManager.uploadReceipt(receiptRequest)
    
    return NextResponse.json({
      success: true,
      data: receipt,
      message: 'Receipt uploaded successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error uploading receipt:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload receipt' 
      },
      { status: 500 }
    )
  }
}

// GET - Get receipts for a payment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment ID format' },
        { status: 400 }
      )
    }
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = getReceiptsQuerySchema.safeParse(queryParams)
    
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
      generatedBy,
      fileType,
      searchTerm,
      startDate,
      endDate
    } = validationResult.data
    
    // Build filters
    const filters: any = {
      paymentId: id
    }
    
    if (generatedBy) filters.generatedBy = generatedBy
    if (fileType) filters.fileType = fileType
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
    
    // Get receipts
    const result = await PaymentReceiptManager.getReceipts(filters, { page, limit })
    
    return NextResponse.json({
      success: true,
      data: result
    })
    
  } catch (error) {
    console.error('Error getting receipts:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get receipts' 
      },
      { status: 500 }
    )
  }
}


