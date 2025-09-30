import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get profile from Prisma to check role
  const dbUser = await db.profile.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch profiles from database
  const profiles = await db.profile.findMany({
    include: {
      therapist: true,
      parent: true,
      admin: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return NextResponse.json({ 
    users: profiles.map(profile => ({
      id: profile.id,
      email: profile.email,
      name: `${profile.firstName} ${profile.lastName}`,
      avatar: profile.avatar,
      role: profile.role,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        therapist: profile.therapist,
        parent: profile.parent,
        admin: profile.admin,
      }
    }))
  })
}