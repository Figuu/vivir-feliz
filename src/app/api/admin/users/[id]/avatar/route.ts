import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const supabase = await createAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user from database to check permissions
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only SUPER_ADMIN and ADMIN can view user avatars
    if (!['ADMIN', 'SUPER_ADMIN'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get target user's avatar
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { avatar: true, name: true, email: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    if (!targetUser.avatar) {
      return NextResponse.json({ 
        error: 'User has no avatar',
        hasAvatar: false 
      }, { status: 404 })
    }

    // Extract file path from avatar URL and generate new signed URL for admin viewing
    let filePath = ''
    const avatarUrl = targetUser.avatar

    if (avatarUrl.includes('/storage/v1/object/sign/')) {
      const urlParts = avatarUrl.split('/storage/v1/object/sign/')[1]
      const pathParts = urlParts.split('?')[0]
      filePath = pathParts.split('/').slice(1).join('/')
    } else if (avatarUrl.includes('/storage/v1/object/public/')) {
      const urlParts = avatarUrl.split('/storage/v1/object/public/')[1]
      const pathParts = urlParts.split('/')
      filePath = pathParts.slice(1).join('/')
    } else {
      // Return existing URL if it's not a standard Supabase URL
      return NextResponse.json({
        avatarUrl: avatarUrl,
        hasAvatar: true,
        user: {
          name: targetUser.name,
          email: targetUser.email
        }
      })
    }

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET_AVATARS || 'avatars'

    // Generate signed URL for admin viewing (1 hour expiry)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 60) // 1 hour

    if (signedUrlError) {
      console.error('Failed to create signed URL:', signedUrlError)
      return NextResponse.json({ 
        error: 'Failed to generate avatar URL',
        hasAvatar: true 
      }, { status: 500 })
    }

    return NextResponse.json({
      avatarUrl: signedUrlData.signedUrl,
      hasAvatar: true,
      user: {
        name: targetUser.name,
        email: targetUser.email
      },
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    })

  } catch (error) {
    console.error('Error getting user avatar:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}