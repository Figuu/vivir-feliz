import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'
import { db } from '@/lib/db'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
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

    // Check upload permission
    if (!hasPermission(dbUser.role, PERMISSIONS.FILES_UPLOAD)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` 
      }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'File type not allowed' 
      }, { status: 400 })
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`
    const filePath = `uploads/${fileName}`

    try {
      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Upload to Supabase Storage
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET_FILES || 'files'
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (error) {
        console.error('Supabase storage error:', error)
        return NextResponse.json({ 
          error: 'Failed to upload file to storage' 
        }, { status: 500 })
      }

      // Generate signed URL for private bucket (expires in 1 year)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, 60 * 60 * 24 * 365) // 1 year

      if (signedUrlError) {
        console.error('Failed to create signed URL:', signedUrlError)
        return NextResponse.json({ 
          error: 'Failed to generate file URL' 
        }, { status: 500 })
      }

      // In a real application, you would save file metadata to database
      // For now, just return the URL
      return NextResponse.json({
        id: fileName,
        url: signedUrlData.signedUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        path: filePath
      })

    } catch (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
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

    // Check delete permission
    if (!hasPermission(dbUser.role, PERMISSIONS.FILES_DELETE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')
    
    if (!filePath) {
      return NextResponse.json({ error: 'File path required' }, { status: 400 })
    }

    // Verify file ownership (basic check - file path contains user ID)
    if (!filePath.includes(user.id)) {
      return NextResponse.json({ error: 'Unauthorized to delete this file' }, { status: 403 })
    }

    // Delete from Supabase Storage
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET_FILES || 'files'
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      console.error('Supabase storage delete error:', error)
      return NextResponse.json({ 
        error: 'Failed to delete file' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'File deleted successfully' 
    })

  } catch (error) {
    console.error('Delete API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}