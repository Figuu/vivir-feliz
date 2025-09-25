import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { hasPermission, canManageUser, PERMISSIONS } from '@/lib/permissions'
import { auditUser } from '@/lib/audit-logger'
import { AuditAction } from '@prisma/client'

export async function PATCH(
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
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to manage users
    if (!hasPermission(currentUser.role, PERMISSIONS.USERS_WRITE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get target user
    const targetUser = await db.user.findUnique({
      where: { id },
      select: { role: true, email: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { role } = body

    if (!role || !['USER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if current user can manage the target user's role
    if (!canManageUser(currentUser.role, targetUser.role)) {
      return NextResponse.json({ 
        error: 'Cannot modify user with equal or higher role' 
      }, { status: 403 })
    }

    // Prevent non-super-admins from creating super admins
    if (role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Only super admins can create super admin accounts' 
      }, { status: 403 })
    }

    // Update user role
    const updatedUser = await db.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true
      }
    })

    // Log the role change
    await auditUser({
      action: AuditAction.USER_ROLE_CHANGED,
      userId: user.id,
      targetUserId: id,
      oldData: { role: targetUser.role },
      newData: { role },
      request,
      metadata: {
        targetUserEmail: targetUser.email,
        oldRole: targetUser.role,
        newRole: role,
        reason: 'Admin role update',
      },
    })

    return NextResponse.json({
      message: 'User role updated successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}