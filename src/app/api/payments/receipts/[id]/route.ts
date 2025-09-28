import { NextRequest, NextResponse } from 'next/server'
import { PaymentReceiptManager } from '@/lib/payment-receipt-manager'

// GET - Get specific receipt
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
        { success: false, error: 'Invalid receipt ID format' },
        { status: 400 }
      )
    }
    
    const receipt = await PaymentReceiptManager.getReceipt(id)
    
    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'Receipt not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: receipt
    })
    
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch receipt' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Delete receipt
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid receipt ID format' },
        { status: 400 }
      )
    }
    
    const success = await PaymentReceiptManager.deleteReceipt(id)
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete receipt' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Receipt deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting receipt:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete receipt' 
      },
      { status: 500 }
    )
  }
}


