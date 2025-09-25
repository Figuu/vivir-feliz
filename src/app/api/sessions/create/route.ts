import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SessionManager } from '@/lib/session-manager'
import { getDeviceInfo } from '@/lib/device-detection'
import { ensureUserExists } from '@/lib/user-utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in our database
    await ensureUserExists(user)

    // Get request body for login method
    const body = await request.json()
    const { loginMethod = 'email' } = body

    // Generate a session token (in a real app, you might use the Supabase session token)
    const sessionToken = `session_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Get device information from request
    const deviceInfo = getDeviceInfo(request)

    // Create session with 30 days expiry
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const session = await SessionManager.createSession({
      userId: user.id,
      token: sessionToken,
      expiresAt,
      deviceInfo,
      loginMethod,
    })

    return NextResponse.json({
      message: 'Session created successfully',
      sessionId: session.id,
    })

  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}