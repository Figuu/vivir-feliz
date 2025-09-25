import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

// This endpoint helps set up the first admin user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const { makeAdmin } = await request.json()

    if (!makeAdmin) {
      return NextResponse.json({ error: 'makeAdmin must be true' }, { status: 400 })
    }

    // Check if this is the first user or if there are no admin users
    const userCount = await db.user.count()
    const adminCount = await db.user.count({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      }
    })

    // Only allow if this is the first user OR there are no admins
    if (userCount > 1 && adminCount > 0) {
      return NextResponse.json({ 
        error: 'Admin setup is only allowed for the first user or when no admins exist' 
      }, { status: 403 })
    }

    // Update user to SUPER_ADMIN
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { role: 'SUPER_ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json({
      message: 'User promoted to Super Admin successfully',
      user: updatedUser
    })

  } catch (error) {
    console.error('Error setting up admin:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}