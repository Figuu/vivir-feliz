import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database to check permissions
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only SUPER_ADMIN can generate signed URLs for any file
    if (dbUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { bucket, filePath, expiresIn = 3600 } = await request.json()

    if (!bucket || !filePath) {
      return NextResponse.json({ 
        error: 'Bucket and file path are required' 
      }, { status: 400 })
    }

    // Generate signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn)

    if (signedUrlError) {
      console.error('Failed to create signed URL:', signedUrlError)
      return NextResponse.json({ 
        error: 'Failed to generate signed URL' 
      }, { status: 500 })
    }

    return NextResponse.json({
      signedUrl: signedUrlData.signedUrl,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
      bucket,
      filePath
    })

  } catch (error) {
    console.error('Admin signed URL API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}