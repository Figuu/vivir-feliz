import { db } from '@/lib/db'
import type { User as SupabaseUser } from '@supabase/supabase-js'

/**
 * Ensures a profile exists in our database, creating it if it doesn't exist
 * Profile.id = Supabase Auth user.id (same ID, no separate linking needed)
 */
export async function ensureUserExists(supabaseUser: SupabaseUser) {
  try {
    // Get role from user_metadata if available, otherwise default to 'PARENT'
    const userRole = supabaseUser.user_metadata?.role || 'PARENT'
    
    // Validate that the role is valid
    const validRoles = ['PARENT', 'THERAPIST', 'COORDINATOR', 'ADMIN', 'SUPER_ADMIN']
    const role = validRoles.includes(userRole) ? userRole : 'PARENT'

    // Check if profile already exists (using Supabase Auth ID)
    const existingProfile = await db.profile.findUnique({
      where: { id: supabaseUser.id }
    })

    if (existingProfile) {
      // If role in metadata differs from database, update it (Auth is source of truth)
      if (existingProfile.role !== role) {
        console.log(`Updating profile ${existingProfile.id} role from ${existingProfile.role} to ${role}`)
        const updatedProfile = await db.profile.update({
          where: { id: supabaseUser.id },
          data: { role: role as any }
        })
        return updatedProfile
      }
      return existingProfile
    }

    // Create profile if it doesn't exist (using Supabase Auth ID)
    const newProfile = await db.profile.create({
      data: {
        id: supabaseUser.id, // Use Supabase Auth ID directly
        email: supabaseUser.email || '',
        firstName: supabaseUser.user_metadata?.firstName || 
                   supabaseUser.user_metadata?.name?.split(' ')[0] || '',
        lastName: supabaseUser.user_metadata?.lastName || 
                  supabaseUser.user_metadata?.name?.split(' ')[1] || '',
        phone: supabaseUser.user_metadata?.phone,
        avatar: supabaseUser.user_metadata?.avatar_url,
        role: role as any
      }
    })

    console.log(`Created new profile: ${newProfile.id} with role: ${role}`)
    return newProfile

  } catch (error) {
    console.error('Error ensuring profile exists:', error)
    throw error
  }
}