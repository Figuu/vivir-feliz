import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { AuditLogger } from '@/lib/audit-logger'
import { AuditAction, AuditSeverity } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user from database
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true, email: true, name: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to view audit logs
    if (!hasPermission(currentUser.role, PERMISSIONS.AUDIT_LOGS_VIEW)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('userId') || undefined
    const action = searchParams.get('action') as AuditAction || undefined
    const resource = searchParams.get('resource') || undefined
    const severity = searchParams.get('severity') as AuditSeverity || undefined
    const category = searchParams.get('category') || undefined
    const success = searchParams.get('success') === 'true' ? true : 
                   searchParams.get('success') === 'false' ? false : undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined

    // Get audit logs with filtering
    const result = await AuditLogger.getLogs({
      userId,
      action,
      resource,
      severity,
      category,
      success,
      startDate,
      endDate,
      page,
      limit,
    })

    // Log the audit log viewing action
    await AuditLogger.logAdminAction({
      action: AuditAction.AUDIT_LOG_VIEWED,
      userId: user.id,
      request,
      metadata: {
        filters: {
          userId,
          action,
          resource,
          severity,
          category,
          success,
          startDate,
          endDate,
        },
        pagination: { page, limit },
      },
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user from database
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true, email: true, name: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to create audit logs (for testing/admin purposes)
    if (!hasPermission(currentUser.role, PERMISSIONS.AUDIT_LOGS_MANAGE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      action,
      resource,
      resourceId,
      oldData,
      newData,
      metadata,
      severity,
      category,
      success,
      errorMessage,
    } = body

    // Validate required fields
    if (!action || !resource) {
      return NextResponse.json({ 
        error: 'Missing required fields: action, resource' 
      }, { status: 400 })
    }

    // Create audit log entry
    const requestInfo = AuditLogger.extractRequestInfo(request)
    await AuditLogger.log({
      action,
      resource,
      resourceId,
      userId: user.id,
      oldData,
      newData,
      metadata,
      severity,
      category,
      success,
      errorMessage,
      endpoint: requestInfo.endpoint,
      method: requestInfo.method,
      userAgent: requestInfo.userAgent || undefined,
      ipAddress: requestInfo.ipAddress,
    })

    return NextResponse.json({ 
      message: 'Audit log created successfully' 
    })

  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}