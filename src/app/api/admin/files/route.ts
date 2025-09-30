import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database to check permissions
    const dbUser = await db.profile.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only SUPER_ADMIN can view all files
    if (dbUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket') || 'files'
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // List files in bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list('', {
        limit,
        offset,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (listError) {
      console.error('Error listing files:', listError)
      return NextResponse.json({ 
        error: 'Failed to list files' 
      }, { status: 500 })
    }

    // Generate signed URLs for each file
    const filesWithUrls = await Promise.all(
      files.map(async (file) => {
        const { data: signedUrl, error: urlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(file.name, 60 * 60) // 1 hour expiry for admin viewing

        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          mimeType: file.metadata?.mimetype || 'unknown',
          createdAt: file.created_at,
          updatedAt: file.updated_at,
          url: urlError ? null : signedUrl?.signedUrl,
          bucket
        }
      })
    )

    return NextResponse.json({
      files: filesWithUrls,
      bucket,
      total: files.length,
      hasMore: files.length === limit
    })

  } catch (error) {
    console.error('Admin files API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createAdminClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database to check permissions
    const dbUser = await db.profile.findUnique({
      where: { id: user.id },
      select: { role: true }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only SUPER_ADMIN can delete files
    if (dbUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { bucket, filePath } = await request.json()

    if (!bucket || !filePath) {
      return NextResponse.json({ 
        error: 'Bucket and file path are required' 
      }, { status: 400 })
    }

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (deleteError) {
      console.error('Error deleting file:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete file' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'File deleted successfully' 
    })

  } catch (error) {
    console.error('Admin delete file API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}