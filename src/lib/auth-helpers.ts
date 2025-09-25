import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types'

export async function transformSupabaseUser(supabaseUser: SupabaseUser | null): Promise<User | null> {
  if (!supabaseUser) return null

  try {
    // Fetch user data from our database
    const response = await fetch('/api/user')
    if (response.ok) {
      const userData = await response.json()
      return userData.user
    }
    
    // Fallback to basic user data from Supabase if database fetch fails
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || null,
      avatar: supabaseUser.user_metadata?.avatar_url || null,
      role: 'USER' as const,
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
    }
  } catch (error) {
    console.error('Error transforming user:', error)
    
    // Fallback to basic user data
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || null,
      avatar: supabaseUser.user_metadata?.avatar_url || null,
      role: 'USER' as const,
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
    }
  }
}

export function createBasicUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name || null,
    avatar: supabaseUser.user_metadata?.avatar_url || null,
    role: 'USER' as const,
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
  }
}