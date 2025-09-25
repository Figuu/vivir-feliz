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

    // Ensure user exists in our database and get their complete profile
    await ensureUserExists(supabaseUser)
    
    const user = await db.user.findUnique({
      where: { id: supabaseUser.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            bio: true,
            phone: true,
            company: true,
            website: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
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
    const { name, avatar, bio, phone, company, website } = body

    // Prepare updates for database
    const dbUpdates: Record<string, unknown> = {}
    if (name !== undefined) dbUpdates.name = name
    if (avatar !== undefined) dbUpdates.avatar = avatar

    // Prepare updates for auth metadata (for compatibility)
    const authUpdates: Record<string, unknown> = {}
    if (name !== undefined) authUpdates.name = name
    if (avatar !== undefined) authUpdates.avatar = avatar

    // Update database first
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: dbUpdates,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            bio: true,
            phone: true,
            company: true,
            website: true,
          }
        }
      }
    })

    // Update profile if bio, phone, company, or website provided
    if (bio !== undefined || phone !== undefined || company !== undefined || website !== undefined) {
      const profileUpdates: Record<string, unknown> = {}
      if (bio !== undefined) profileUpdates.bio = bio
      if (phone !== undefined) profileUpdates.phone = phone
      if (company !== undefined) profileUpdates.company = company
      if (website !== undefined) profileUpdates.website = website

      await db.profile.upsert({
        where: { userId: user.id },
        update: profileUpdates,
        create: {
          userId: user.id,
          ...profileUpdates
        }
      })

      // Refetch user with updated profile
      const userWithProfile = await db.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              bio: true,
              phone: true,
              company: true,
              website: true,
            }
          }
        }
      })

      if (userWithProfile) {
        return NextResponse.json({ user: userWithProfile })
      }
    }

    // Update auth metadata for compatibility (optional)
    if (Object.keys(authUpdates).length > 0) {
      await supabase.auth.updateUser({
        data: authUpdates
      })
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}