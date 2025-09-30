import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { hasPermission, canManageUser, PERMISSIONS } from '@/lib/permissions'
import { auditUser } from '@/lib/audit-logger'
import { AuditAction } from '@/lib/audit-types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if user has impersonation permission
    if (!hasPermission(currentUser.role, PERMISSIONS.USERS_IMPERSONATE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get target user to impersonate
    const targetUser = await db.profile.findUnique({
      where: { id },
      select: { 
        id: true,
        email: true, 
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Prevent impersonating users with equal or higher roles
    if (!canManageUser(currentUser.role, targetUser.role)) {
      return NextResponse.json({ 
        error: 'Cannot impersonate user with equal or higher role' 
      }, { status: 403 })
    }

    // Prevent self-impersonation
    if (currentUser.email === targetUser.email) {
      return NextResponse.json({ 
        error: 'Cannot impersonate yourself' 
      }, { status: 400 })
    }

    // Log the impersonation attempt
    await auditUser({
      action: AuditAction.USER_IMPERSONATE,
      userId: user.id,
      targetUserId: targetUser.id,
      request,
      metadata: {
        targetUserEmail: targetUser.email,
        targetUserRole: targetUser.role,
        reason: 'Admin impersonation initiated',
      },
    })

    console.log(`User ${currentUser.email} (${currentUser.role}) is impersonating ${targetUser.email} (${targetUser.role})`)

    // For now, return the target user data that can be used on the frontend
    return NextResponse.json({
      message: 'Impersonation initiated',
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: `${targetUser.firstName} ${targetUser.lastName}`,
        avatar: targetUser.avatar,
        role: targetUser.role,
        createdAt: targetUser.createdAt,
        updatedAt: targetUser.updatedAt
      },
      originalUser: {
        id: user.id,
        email: currentUser.email,
        name: `${currentUser.firstName} ${currentUser.lastName}`,
        role: currentUser.role
      }
    })

  } catch (error) {
    console.error('Error initiating impersonation:', error)
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

    // Log the end of impersonation
    await auditUser({
      action: AuditAction.LOGOUT, // Using LOGOUT as the closest equivalent
      userId: user.id,
      request,
      metadata: {
        reason: 'Admin ended impersonation',
      },
    })

    // End impersonation - restore original session
    console.log(`Ending impersonation for user ${user.email}`)

    return NextResponse.json({
      message: 'Impersonation ended successfully'
    })

  } catch (error) {
    console.error('Error ending impersonation:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}