import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const dbUser = await db.profile.findUnique({
      where: { id: user.id },
      select: { avatar: true }
    })

    if (!dbUser || !dbUser.avatar) {
      return NextResponse.json(
        { error: 'No avatar found' },
        { status: 404 }
      )
    }

    // Extract file path from existing avatar URL
    // Assuming the avatar is stored as a signed URL, we need to extract the path
    const avatarUrl = dbUser.avatar
    let filePath = ''

    // If it's already a signed URL, extract the path
    if (avatarUrl.includes('/storage/v1/object/sign/')) {
      const urlParts = avatarUrl.split('/storage/v1/object/sign/')[1]
      const pathParts = urlParts.split('?')[0] // Remove query params
      filePath = pathParts.split('/').slice(1).join('/') // Remove bucket name
    } else if (avatarUrl.includes('/storage/v1/object/public/')) {
      // Handle public URL format
      const urlParts = avatarUrl.split('/storage/v1/object/public/')[1]
      const pathParts = urlParts.split('/')
      filePath = pathParts.slice(1).join('/') // Remove bucket name
    } else {
      return NextResponse.json(
        { error: 'Invalid avatar URL format' },
        { status: 400 }
      )
    }

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET_AVATARS || 'avatars'

    // Generate new signed URL (expires in 1 year)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 year

    if (signedUrlError) {
      console.error('Failed to create signed URL:', signedUrlError)
      return NextResponse.json(
        { error: 'Failed to refresh avatar URL' },
        { status: 500 }
      )
    }

    // Update user avatar with new signed URL
    await db.profile.update({
      where: { id: user.id },
      data: { avatar: signedUrlData.signedUrl }
    })

    return NextResponse.json({
      success: true,
      avatarUrl: signedUrlData.signedUrl
    })

  } catch (error) {
    console.error('Error refreshing avatar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}