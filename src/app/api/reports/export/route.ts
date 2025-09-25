import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { db } from '@/lib/db'
import { ReportingEngine } from '@/lib/reporting/engine'
import { auditLog } from '@/lib/audit-logger'

// Export formats
enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  PDF = 'pdf'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database to check permissions
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check export permission
    if (!hasPermission(dbUser.role, PERMISSIONS.REPORTS_VIEW)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { templateId, format, filters, filename } = body

    if (!templateId || !format) {
      return NextResponse.json({ 
        error: 'Template ID and format required' 
      }, { status: 400 })
    }

    if (!Object.values(ExportFormat).includes(format)) {
      return NextResponse.json({ 
        error: 'Invalid export format' 
      }, { status: 400 })
    }

    // Create report config from template
    const reportConfig = ReportingEngine.createReportFromTemplate(
      templateId,
      `${templateId} Export`,
      user.id
    )

    // Execute the report (get all data for export)
    const result = await ReportingEngine.executeReport(
      reportConfig,
      filters || []
      // No pagination for exports - get all data
    )

    // Generate export content based on format
    let content: string
    let contentType: string
    let fileExtension: string

    switch (format) {
      case ExportFormat.CSV:
        content = generateCSV(result.data, result.metadata.columns)
        contentType = 'text/csv'
        fileExtension = 'csv'
        break

      case ExportFormat.JSON:
        content = JSON.stringify({
          metadata: {
            reportName: reportConfig.name,
            generatedAt: result.metadata.generatedAt,
            totalRecords: result.totalCount,
            executionTime: result.executionTime,
            columns: result.metadata.columns
          },
          data: result.data
        }, null, 2)
        contentType = 'application/json'
        fileExtension = 'json'
        break

      case ExportFormat.PDF:
        // For PDF export, we would typically use a library like puppeteer or jsPDF
        // For now, we'll return a placeholder
        content = generatePDFPlaceholder(reportConfig.name, result.data.length)
        contentType = 'application/pdf'
        fileExtension = 'pdf'
        break

      default:
        return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
    }

    // Generate filename if not provided
    const exportFilename = filename || 
      `${templateId}_export_${new Date().toISOString().split('T')[0]}.${fileExtension}`

    // Log the export action
    await auditLog({
      action: 'AUDIT_LOG_EXPORTED',
      resource: 'reports',
      resourceId: templateId,
      userId: user.id,
      metadata: {
        templateId,
        format,
        filename: exportFilename,
        recordCount: result.data.length,
        executionTime: result.executionTime
      },
      endpoint: request.url,
      method: 'POST',
      userAgent: request.headers.get('user-agent') || undefined,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    })

    // Return the export file
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${exportFilename}"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('Report export error:', error)
    return NextResponse.json({ 
      error: 'Failed to export report' 
    }, { status: 500 })
  }
}

/**
 * Generate CSV content from data and column metadata
 */
function generateCSV(data: Record<string, unknown>[], columns: { name: string; label?: string }[]): string {
  if (data.length === 0) {
    return 'No data available'
  }

  // Generate header row
  const headers = columns.map(col => col.label || col.name).join(',')
  
  // Generate data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.name]
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    }).join(',')
  })

  return [headers, ...rows].join('\n')
}

/**
 * Generate PDF placeholder content
 * In a real implementation, this would use a PDF generation library
 */
function generatePDFPlaceholder(reportName: string, recordCount: number): string {
  return `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj

4 0 obj
<<
/Length 100
>>
stream
BT
/F1 12 Tf
50 750 Td
(${reportName}) Tj
0 -20 Td
(Generated: ${new Date().toLocaleString()}) Tj
0 -20 Td
(Records: ${recordCount}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Times-Roman
>>
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000057 00000 n 
0000000114 00000 n 
0000000272 00000 n 
0000000422 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
519
%%EOF`
}