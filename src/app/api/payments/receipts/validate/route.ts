import { NextRequest, NextResponse } from 'next/server'
import { PaymentReceiptManager, ReceiptUploadRequest } from '@/lib/payment-receipt-manager'
import { z } from 'zod'

const validateReceiptSchema = z.object({
  paymentId: z.string().uuid('Invalid payment ID format'),
  receiptType: z.enum(['PAYMENT_RECEIPT', 'BANK_STATEMENT', 'TRANSACTION_PROOF', 'INVOICE', 'OTHER']),
  fileName: z.string().min(1, 'File name is required').max(255, 'File name too long'),
  fileSize: z.number().positive('File size must be positive').max(10 * 1024 * 1024, 'File size cannot exceed 10MB'),
  fileType: z.enum(['PDF', 'JPG', 'JPEG', 'PNG', 'DOC', 'DOCX', 'TXT']),
  fileData: z.string().min(1, 'File data is required'),
  description: z.string().max(500, 'Description too long').optional(),
  metadata: z.record(z.string(), z.any()).optional()
})

// POST - Validate receipt upload request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = validateReceiptSchema.safeParse(body)
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
      paymentId, 
      receiptType, 
      fileName, 
      fileSize, 
      fileType, 
      fileData, 
      description, 
      metadata 
    } = validationResult.data
    
    // Create receipt upload request for validation
    const receiptRequest: ReceiptUploadRequest = {
      paymentId,
      receiptType,
      fileName,
      fileSize,
      fileType,
      fileData,
      description,
      metadata
    }
    
    // Validate receipt upload request
    const validation = await PaymentReceiptManager.validateReceiptUpload(receiptRequest)
    
    return NextResponse.json({
      success: true,
      data: validation,
      message: validation.isValid ? 'Receipt upload request is valid' : 'Receipt upload request validation failed'
    })
    
  } catch (error) {
    console.error('Error validating receipt upload:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to validate receipt upload request' 
      },
      { status: 500 }
    )
  }
}


