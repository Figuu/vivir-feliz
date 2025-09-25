import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user from Prisma to check role
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })

  if (!dbUser || (dbUser.role !== 'ADMIN' && dbUser.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch users from database with their profiles
  const users = await db.user.findMany({
    include: {
      profile: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return NextResponse.json({ 
    users: users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile
    }))
  })
}