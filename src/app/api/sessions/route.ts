import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionManager } from '@/lib/session-manager'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's active sessions
    const sessions = await SessionManager.getUserSessions(user.id)
    
    // Get session statistics
    const stats = await SessionManager.getSessionStats(user.id)

    return NextResponse.json({
      sessions,
      stats,
    })

  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const action = searchParams.get('action') // 'single' or 'all'

    if (action === 'all') {
      // Revoke all sessions except current one
      const revokedCount = await SessionManager.revokeAllUserSessions(
        user.id, 
        sessionId || undefined // Exclude current session if provided
      )

      return NextResponse.json({
        message: `Successfully revoked ${revokedCount} sessions`,
        revokedCount,
      })
    } else if (sessionId) {
      // Revoke specific session
      await SessionManager.revokeSession(sessionId, user.id)

      return NextResponse.json({
        message: 'Session revoked successfully',
      })
    } else {
      return NextResponse.json({ 
        error: 'Session ID or action required' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error revoking sessions:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}