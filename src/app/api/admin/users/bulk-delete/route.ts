import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

const bulkDeleteSchema = z.object({
  userIds: z.array(z.string().uuid())
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
    const { userIds } = bulkDeleteSchema.parse(body)

    // Prevent user from deleting themselves
    if (userIds.includes(user.id)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Get users to be deleted to check permissions
    const usersToDelete = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, role: true, email: true }
    })

    // Prevent non-super-admin from deleting super-admin users
    if (currentUser.role !== 'SUPER_ADMIN') {
      const superAdminUsers = usersToDelete.filter(user => user.role === 'SUPER_ADMIN')
      if (superAdminUsers.length > 0) {
        return NextResponse.json(
          { error: 'Cannot delete Super Admin users' },
          { status: 403 }
        )
      }
    }

    // Delete users from database (this will cascade to related records)
    const deleteResult = await db.user.deleteMany({
      where: { id: { in: userIds } }
    })

    // Delete users from Supabase Auth
    const supabaseAdmin = createAdminClient()
    const deletePromises = userIds.map(async (userId) => {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      } catch (error) {
        console.error(`Error deleting user ${userId} from Supabase:`, error)
      }
    })

    await Promise.allSettled(deletePromises)

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} users`
    })

  } catch (error) {
    console.error('Error bulk deleting users:', error)
    
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