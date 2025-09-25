import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ensureUserExists } from '@/lib/user-utils'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')
  const type = searchParams.get('type')
  const verified = searchParams.get('verified')
  
  // Handle different auth flows
  if (type === 'recovery') {
    // Password reset flow - redirect to update-password page
    if (code) {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        return NextResponse.redirect(`${origin}/update-password`)
      } else {
        // Redirect to update-password with error
        return NextResponse.redirect(`${origin}/update-password?error=invalid_recovery_link&error_description=${encodeURIComponent(error.message)}`)
      }
    }
    return NextResponse.redirect(`${origin}/update-password?error=missing_code`)
  }
  
  // Default flow (login, signup, etc.)
  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Ensure user exists in our database
      try {
        await ensureUserExists(data.user)
      } catch (dbError) {
        console.error('Failed to create user in database:', dbError)
        // Continue with redirect even if database operation fails
      }
      let redirectTo = next || '/dashboard'
      
      // If this is a new user verification, add welcome parameters
      if (verified === 'true') {
        const url = new URL(redirectTo, origin)
        url.searchParams.set('welcome', 'true')
        url.searchParams.set('verified', 'true')
        redirectTo = url.pathname + url.search
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectTo}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`)
      } else {
        return NextResponse.redirect(`${origin}${redirectTo}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_error`)
}