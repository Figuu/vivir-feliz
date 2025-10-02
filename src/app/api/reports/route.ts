import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { db } from '@/lib/db'
import { ReportingEngine, FilterValue } from '@/lib/reporting/engine'
import { auditLog } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database to check permissions
    const dbUser = await db.profile.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check view reports permission
    if (!hasPermission(dbUser.role, PERMISSIONS.REPORTS_VIEW)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // Get available report templates
    if (action === 'templates') {
      const templates = ReportingEngine.getReportTemplates()
      return NextResponse.json({ templates })
    }

    // Execute a specific report template
    if (action === 'execute') {
      const templateId = searchParams.get('templateId')
      const filtersParam = searchParams.get('filters')
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '100')

      if (!templateId) {
        return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
      }

      // Parse filters
      let filters: FilterValue[] = []
      if (filtersParam) {
        try {
          filters = JSON.parse(filtersParam)
        } catch {
          return NextResponse.json({ error: 'Invalid filters format' }, { status: 400 })
        }
      }

      // Create report config from template
      const reportConfig = ReportingEngine.createReportFromTemplate(
        templateId,
        `${templateId} Report`,
        user.id
      )

      // Execute the report
      const result = await ReportingEngine.executeReport(
        reportConfig,
        filters,
        { page, limit }
      )

      // Log the report execution
      await auditLog({
        action: 'AUDIT_LOG_VIEW',
        resource: 'reports',
        resourceId: templateId,
        userId: user.id,
        metadata: {
          templateId,
          filtersCount: filters.length,
          resultCount: result.data.length,
          executionTime: result.executionTime
        },
        endpoint: request.url,
        method: 'GET',
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      })

      return NextResponse.json({
        success: true,
        result
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Reports API error:', error)
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

    // Get user from database to check permissions
    const dbUser = await db.profile.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check create reports permission (admin only for now)
    if (!hasPermission(dbUser.role, PERMISSIONS.ADMIN_ACCESS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { action, reportConfig, filters, pagination } = body

    switch (action) {
      case 'execute_custom':
        if (!reportConfig) {
          return NextResponse.json({ error: 'Report configuration required' }, { status: 400 })
        }

        // Execute custom report
        const result = await ReportingEngine.executeReport(
          reportConfig,
          filters || [],
          pagination
        )

        // Log the report execution
        await auditLog({
          action: 'AUDIT_LOG_VIEW',
          resource: 'reports',
          resourceId: reportConfig.id,
          userId: user.id,
          metadata: {
            reportName: reportConfig.name,
            dataSource: reportConfig.dataSource,
            filtersCount: filters?.length || 0,
            resultCount: result.data.length,
            executionTime: result.executionTime
          },
          endpoint: request.url,
          method: 'POST',
          userAgent: request.headers.get('user-agent') || undefined,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        })

        return NextResponse.json({
          success: true,
          result
        })

      case 'create_from_template':
        const { templateId, name, customizations } = body
        
        if (!templateId || !name) {
          return NextResponse.json({ 
            error: 'Template ID and name required' 
          }, { status: 400 })
        }

        const newReport = ReportingEngine.createReportFromTemplate(
          templateId,
          name,
          user.id,
          customizations
        )

        // In a real implementation, you would save this to a database
        // For now, we'll return the created report configuration

        await auditLog({
          action: 'USER_CREATE',
          resource: 'reports',
          resourceId: newReport.id,
          userId: user.id,
          metadata: {
            reportName: name,
            templateId,
            dataSource: newReport.dataSource
          },
          endpoint: request.url,
          method: 'POST',
          userAgent: request.headers.get('user-agent') || undefined,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        })

        return NextResponse.json({
          success: true,
          report: newReport
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}