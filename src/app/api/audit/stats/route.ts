import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { AuditLogger } from '@/lib/audit-logger'

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

    // Check if user has permission to view audit logs
    if (!hasPermission(currentUser.role, PERMISSIONS.AUDIT_LOGS_VIEW)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const profileId = searchParams.get('profileId') || undefined

    // Get audit statistics
    const stats = await AuditLogger.getStats({
      startDate,
      endDate,
      userId: profileId,
    })

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching audit stats:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}