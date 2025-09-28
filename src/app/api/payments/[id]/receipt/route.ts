import { NextRequest, NextResponse } from 'next/server'
import { PaymentProcessor } from '@/lib/payment-processor'

// POST - Upload receipt for payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment ID format' },
        { status: 400 }
      )
    }
    
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('receipt') as File
    const uploadedBy = formData.get('uploadedBy') as string
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No receipt file provided' },
        { status: 400 }
      )
    }
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Upload receipt
    const result = await PaymentProcessor.uploadReceipt(
      id,
      {
        name: file.name,
        size: file.size,
        type: file.type,
        data: buffer
      },
      uploadedBy
    )
    
    return NextResponse.json({
      success: true,
      data: result,
      message: 'Receipt uploaded successfully'
    })
    
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

// GET - Get receipt information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment ID format' },
        { status: 400 }
      )
    }
    
    const payment = await PaymentProcessor.getPayment(id)
    
    if (!payment.receiptUrl) {
      return NextResponse.json(
        { success: false, error: 'No receipt found for this payment' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        receiptUrl: payment.receiptUrl,
        receiptUploadedAt: payment.receiptUploadedAt,
        receiptUploadedBy: payment.receiptUploadedBy
      }
    })
    
  } catch (error) {
    console.error('Error getting receipt:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get receipt information' },
      { status: 500 }
    )
  }
}


