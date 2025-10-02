import { NextRequest, NextResponse } from 'next/server'
import { PaymentReceiptManager } from '@/lib/payment-receipt-manager'

// GET - Download receipt file
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
    
    // Get receipt file
    const fileData = await PaymentReceiptManager.getReceiptFile(id)
    
    // Set appropriate headers for file download
    const headers = new Headers()
    headers.set('Content-Type', getContentType(fileData.fileType))
    headers.set('Content-Disposition', `attachment; filename="${fileData.fileName}"`)
    headers.set('Content-Length', fileData.fileSize?.toString() ?? '0')
    
    // Return file data
    return new NextResponse(fileData.fileData, {
      status: 200,
      headers
    })
    
  } catch (error) {
    console.error('Error downloading receipt file:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to download receipt file' 
      },
      { status: 500 }
    )
  }
}

// Helper function to get content type based on file type
function getContentType(fileType: string): string {
  const contentTypes: Record<string, string> = {
    'PDF': 'application/pdf',
    'JPG': 'image/jpeg',
    'JPEG': 'image/jpeg',
    'PNG': 'image/png',
    'DOC': 'application/msword',
    'DOCX': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'TXT': 'text/plain'
  }
  return contentTypes[fileType] || 'application/octet-stream'
}


