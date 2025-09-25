import { NextResponse } from 'next/server'
import { SessionManager } from '@/lib/session-manager'

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
// It can also be protected with an API key for security
export async function POST() {
  try {
    // Clean up expired and inactive sessions
    const cleanedCount = await SessionManager.cleanExpiredSessions()
    
    console.log(`Cleaned up ${cleanedCount} expired sessions`)

    return NextResponse.json({
      message: `Successfully cleaned up ${cleanedCount} expired sessions`,
      cleanedCount,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Error cleaning up sessions:', error)
    return NextResponse.json({ 
      error: 'Failed to clean up sessions' 
    }, { status: 500 })
  }
}