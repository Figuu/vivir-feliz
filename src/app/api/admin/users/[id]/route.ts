import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN', 'THERAPIST', 'PARENT', 'COORDINATOR']).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const currentUser = await db.profile.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: userId } = await params
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Check if target user exists
    const targetUser = await db.profile.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent non-super-admin from editing super-admin users
    if (targetUser.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot edit Super Admin users' },
        { status: 403 }
      )
    }

    // Check if email is already taken by another user
    if (validatedData.email && validatedData.email !== targetUser.email) {
      const existingUser = await db.profile.findUnique({
        where: { email: validatedData.email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email is already taken' },
          { status: 400 }
        )
      }
    }

    // Update user in database
    const updateData: any = {}
    if (validatedData.email) updateData.email = validatedData.email
    if (validatedData.firstName) updateData.firstName = validatedData.firstName
    if (validatedData.lastName) updateData.lastName = validatedData.lastName
    if (validatedData.role) updateData.role = validatedData.role

    const updatedUser = await db.profile.update({
      where: { id: userId },
      data: updateData,
    })

    // Update user metadata in Supabase if needed
    if (validatedData.firstName || validatedData.lastName || validatedData.role) {
      const supabaseAdmin = createAdminClient()
      const metadataUpdate: Record<string, string> = {}
      if (validatedData.firstName) metadataUpdate.firstName = validatedData.firstName
      if (validatedData.lastName) metadataUpdate.lastName = validatedData.lastName
      if (validatedData.role) metadataUpdate.role = validatedData.role

      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...targetUser,
          ...metadataUpdate
        }
      })
    }

    // Update email in Supabase if changed
    if (validatedData.email && validatedData.email !== targetUser.email) {
      const supabaseAdmin = createAdminClient()
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: validatedData.email
      })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      }
    })

  } catch (error) {
    console.error('Error updating user:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const currentUser = await db.profile.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: userId } = await params

    // Prevent users from deleting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check if target user exists
    const targetUser = await db.profile.findUnique({
      where: { id: userId }
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent non-super-admin from deleting super-admin users
    if (targetUser.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Cannot delete Super Admin users' },
        { status: 403 }
      )
    }

    // Delete user from database first (this will cascade to related records)
    await db.profile.delete({
      where: { id: userId }
    })

    // Delete user from Supabase Auth
    const supabaseAdmin = createAdminClient()
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (deleteError) {
      console.error('Error deleting user from Supabase:', deleteError)
      // Continue anyway as the main deletion was successful
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}