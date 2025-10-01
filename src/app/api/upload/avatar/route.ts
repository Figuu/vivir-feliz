import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { auditFile } from '@/lib/audit-logger'
import { AuditAction } from '@/lib/audit-types'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB for avatars
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
        error: 'Only image files are allowed for avatars' 
      }, { status: 400 })
    }

    // Generate unique filename with user ID folder structure for RLS policy
    const fileExtension = file.name.split('.').pop()
    const fileName = `avatar-${Date.now()}.${fileExtension}`
    // RLS policy requires path to start with user ID
    const filePath = `${user.id}/${fileName}`
    
    console.log('Uploading avatar with path:', filePath)
    console.log('User ID:', user.id)

    try {
      // First, try to delete any existing avatar files for this user
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET_AVATARS || 'avatars'
      
      // List existing files in user's folder
      const { data: existingFiles, error: listError } = await supabase.storage
        .from(bucketName)
        .list(user.id, {
          limit: 100,
          offset: 0
        })
      
      if (listError) {
        console.log('Could not list existing files:', listError)
      }
      
      // Delete old avatar files if they exist
      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(file => `${user.id}/${file.name}`)
        const { error: deleteError } = await supabase.storage
          .from(bucketName)
          .remove(filesToDelete)
        
        if (deleteError) {
          console.log('Could not delete old files:', deleteError)
        }
      }
      // Convert file to buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Upload to Supabase Storage avatars bucket
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Supabase storage error:', uploadError)
        console.error('Upload details:', {
          bucketName,
          filePath,
          userId: user.id,
          fileType: file.type,
          fileSize: file.size
        })
        return NextResponse.json({ 
          error: `Failed to upload avatar: ${uploadError.message}` 
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

      // Log successful avatar upload
      await auditFile({
        action: AuditAction.FILE_UPLOAD,
        userId: user.id,
        fileId: fileName,
        fileName: file.name,
        fileSize: file.size,
        request,
        metadata: {
          fileType: file.type,
          filePath,
          bucketName,
        },
      })

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
        error: 'Failed to upload avatar' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Avatar upload API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}