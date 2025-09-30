import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { AuditLogger } from '@/lib/audit-logger'
import { AuditAction, AuditSeverity } from '@/lib/audit-types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user from database
    const currentUser = await db.profile.findUnique({
      where: { id: user.id },
      select: { role: true, email: true, firstName: true, lastName: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to export audit logs
    if (!hasPermission(currentUser.role, PERMISSIONS.AUDIT_LOGS_EXPORT)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'json'
    const profileId = searchParams.get('profileId') || undefined
    const action = searchParams.get('action') as AuditAction || undefined
    const resource = searchParams.get('resource') || undefined
    const category = searchParams.get('category') || undefined
    const success = searchParams.get('success') === 'true' ? true : 
                   searchParams.get('success') === 'false' ? false : undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    // Get audit logs for export (no pagination limit)
    const result = await AuditLogger.getLogs({
      userId: profileId,
      action,
      resource,
      category,
      success,
      startDate,
      endDate,
      page: 1,
      limit: 10000, // Large limit for export
    })

    // Log the export action
    await AuditLogger.logAdminAction({
      action: AuditAction.READ,
      userId: user.id,
      request,
      metadata: {
        exportType: 'audit_logs',
        format,
        filters: {
          profileId,
          action,
          resource,
          category,
          success,
          startDate,
          endDate,
        },
        recordCount: result.logs.length,
      },
    })

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'ID',
        'Timestamp',
        'Action',
        'Resource',
        'Resource ID',
        'Profile ID',
        'User Email',
        'User Name',
        'IP Address',
        'User Agent',
        'Category',
        'Success',
        'Error Message',
      ]

      const csvRows = result.logs.map((log: any) => [
        log.id,
        log.createdAt.toISOString(),
        log.action,
        log.resource,
        log.resourceId || '',
        log.profileId || '',
        log.profile?.email || '',
        log.profile ? `${log.profile.firstName} ${log.profile.lastName}` : '',
        log.ipAddress || '',
        log.userAgent || '',
        log.category || '',
        log.success.toString(),
        log.errorMessage || '',
      ])

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => 
          row.map(cell => 
            typeof cell === 'string' && cell.includes(',') 
              ? `"${cell.replace(/"/g, '""')}"` 
              : cell
          ).join(',')
        )
      ].join('\n')

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`,
        },
      })
    }

    // Default to JSON format
    return NextResponse.json(result, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.json`,
      },
    })

  } catch (error) {
    console.error('Error exporting audit logs:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}