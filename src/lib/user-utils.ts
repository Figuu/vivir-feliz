import { db } from '@/lib/db'
import type { User as SupabaseUser } from '@supabase/supabase-js'

/**
 * Ensures a user exists in our database, creating them if they don't exist
 */
export async function ensureUserExists(supabaseUser: SupabaseUser) {
  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { id: supabaseUser.id }
    })

    if (existingUser) {
      return existingUser
    }

    // Create user if they don't exist
    const newUser = await db.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || null,
        avatar: supabaseUser.user_metadata?.avatar_url || null,
        role: 'USER'
      }
    })

    console.log('Created new user in database:', newUser.id)
    return newUser

  } catch (error) {
    console.error('Error ensuring user exists:', error)
    throw error
  }
}