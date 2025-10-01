import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { auditAuth } from '@/lib/audit-logger'
import { AuditAction } from '@/lib/audit-types'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = changePasswordSchema.parse(body)

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validatedData.currentPassword,
    })

    if (signInError) {
      // Log failed password change attempt
      await auditAuth({
        action: AuditAction.PASSWORD_CHANGE,
        userId: user.id,
        success: false,
        errorMessage: 'Current password is incorrect',
        request,
      })
      
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.newPassword
    })

    if (updateError) {
      console.error('Error updating password:', updateError)
      
      // Log failed password update
      await auditAuth({
        action: AuditAction.PASSWORD_CHANGE,
        userId: user.id,
        success: false,
        errorMessage: updateError.message,
        request,
      })
      
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      )
    }

    // Log successful password change
    await auditAuth({
      action: AuditAction.PASSWORD_CHANGE,
      userId: user.id,
      success: true,
      request,
    })

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Error changing password:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}