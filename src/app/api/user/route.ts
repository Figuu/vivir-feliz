import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ensureUserExists } from '@/lib/user-utils'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()
    
    if (error || !supabaseUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure profile exists in our database and get their complete data
    await ensureUserExists(supabaseUser)
    
    const profile = await db.profile.findUnique({
      where: { id: supabaseUser.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        therapist: {
          select: {
            id: true,
            licenseNumber: true,
            bio: true,
            isCoordinator: true,
            canTakeConsultations: true,
          }
        },
        parent: {
          select: {
            id: true,
            address: true,
            city: true,
            emergencyContact: true,
            emergencyPhone: true,
            relationship: true,
          }
        },
        admin: {
          select: {
            id: true,
            department: true,
            notes: true,
          }
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Return as 'user' for backwards compatibility with frontend
    return NextResponse.json({ user: profile })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { firstName, lastName, avatar, phone } = body

    // Prepare updates for profile
    const profileUpdates: Record<string, unknown> = {}
    if (firstName !== undefined) profileUpdates.firstName = firstName
    if (lastName !== undefined) profileUpdates.lastName = lastName
    if (avatar !== undefined) profileUpdates.avatar = avatar
    if (phone !== undefined) profileUpdates.phone = phone

    // Prepare updates for auth metadata (for compatibility)
    const authUpdates: Record<string, unknown> = {}
    if (firstName !== undefined || lastName !== undefined) {
      authUpdates.name = `${firstName || ''} ${lastName || ''}`.trim()
    }
    if (avatar !== undefined) authUpdates.avatar_url = avatar

    // Update profile in database
    const updatedProfile = await db.profile.update({
      where: { id: user.id },
      data: profileUpdates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        therapist: {
          select: {
            id: true,
            licenseNumber: true,
            bio: true,
            isCoordinator: true,
            canTakeConsultations: true,
          }
        },
        parent: {
          select: {
            id: true,
            address: true,
            city: true,
            emergencyContact: true,
            emergencyPhone: true,
            relationship: true,
          }
        },
        admin: {
          select: {
            id: true,
            department: true,
            notes: true,
          }
        }
      }
    })

    // Update auth metadata for compatibility (optional)
    if (Object.keys(authUpdates).length > 0) {
      await supabase.auth.updateUser({
        data: authUpdates
      })
    }

    // Return as 'user' for backwards compatibility with frontend
    return NextResponse.json({ user: updatedProfile })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}