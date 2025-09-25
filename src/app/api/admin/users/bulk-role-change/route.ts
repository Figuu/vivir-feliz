import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

const bulkRoleChangeSchema = z.object({
  userIds: z.array(z.string().uuid()),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN'])
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user has admin privileges
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userIds, role } = bulkRoleChangeSchema.parse(body)

    // Get users to be updated to check permissions
    const usersToUpdate = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, role: true, email: true }
    })

    // Prevent non-super-admin from modifying super-admin users or creating super-admins
    if (currentUser.role !== 'SUPER_ADMIN') {
      const superAdminUsers = usersToUpdate.filter(user => user.role === 'SUPER_ADMIN')
      if (superAdminUsers.length > 0) {
        return NextResponse.json(
          { error: 'Cannot modify Super Admin users' },
          { status: 403 }
        )
      }

      if (role === 'SUPER_ADMIN') {
        return NextResponse.json(
          { error: 'Cannot assign Super Admin role' },
          { status: 403 }
        )
      }
    }

    // Prevent user from changing their own role
    if (userIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // Update users in database
    const updateResult = await db.user.updateMany({
      where: { id: { in: userIds } },
      data: { role }
    })

    // Update user metadata in Supabase
    const supabaseAdmin = createAdminClient()
    const updatePromises = usersToUpdate.map(async (user) => {
      try {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            role: role
          }
        })
      } catch (error) {
        console.error(`Error updating user ${user.id} in Supabase:`, error)
      }
    })

    await Promise.allSettled(updatePromises)

    return NextResponse.json({
      success: true,
      updatedCount: updateResult.count,
      message: `Successfully updated ${updateResult.count} users to ${role} role`
    })

  } catch (error) {
    console.error('Error bulk updating user roles:', error)
    
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