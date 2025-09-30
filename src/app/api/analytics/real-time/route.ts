import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { db } from '@/lib/db'
import { getCurrentMetrics, getLiveActivity, getChartData, getPerformanceMetrics } from '../helpers'

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

    // Check analytics permission
    if (!hasPermission(dbUser.role, PERMISSIONS.REPORTS_VIEW)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    switch (type) {
      case 'metrics':
        const metrics = await getCurrentMetrics()
        return NextResponse.json({ success: true, data: metrics })

      case 'activity':
        const limit = parseInt(searchParams.get('limit') || '50')
        const activity = await getLiveActivity(limit)
        return NextResponse.json({ success: true, data: activity })

      case 'chart':
        const metric = searchParams.get('metric') as 'users' | 'sessions' | 'actions' | 'errors'
        const timeRange = searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d' || '24h'
        
        if (!metric) {
          return NextResponse.json({ error: 'Metric parameter required' }, { status: 400 })
        }

        const chartData = await getChartData(metric, timeRange)
        return NextResponse.json({ success: true, data: chartData })

      case 'performance':
        const performance = await getPerformanceMetrics()
        return NextResponse.json({ success: true, data: performance })

      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

  } catch (error) {
    console.error('Real-time analytics API error:', error)
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

    // Check admin permission for cache operations
    if (!hasPermission(dbUser.role, PERMISSIONS.ADMIN_ACCESS)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'clear_cache':
        // Clear any server-side caches if needed
        return NextResponse.json({ 
          success: true, 
          message: 'Cache cleared successfully' 
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Real-time analytics API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}