/**
 * File Storage Configuration and Utilities
 * Centralized file storage management for the application
 */

// Storage Configuration
export const STORAGE_CONFIG = {
  buckets: {
    avatars: 'avatars',
    files: 'files',
    documents: 'documents',
    reports: 'reports'
  },
  limits: {
    avatar: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    },
    document: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    },
    report: {
      maxSize: 20 * 1024 * 1024, // 20MB
      allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    }
  },
  urlExpiry: {
    avatar: 365 * 24 * 60 * 60, // 1 year
    document: 7 * 24 * 60 * 60, // 7 days
    report: 30 * 24 * 60 * 60, // 30 days
    temporary: 60 * 60 // 1 hour
  }
}

// File validation utilities
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

export function generateFileName(userId: string, originalName: string): string {
  const extension = originalName.split('.').pop()
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(7)
  return `${userId}/${timestamp}-${randomStr}.${extension}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`
}

export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.includes('word')) return 'document'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet'
  if (mimeType.startsWith('text/')) return 'text'
  return 'other'
}

// Storage path utilities
export function getUserStoragePath(userId: string, bucket: string): string {
  return `${userId}/`
}

export function getDocumentPath(userId: string, category: string, filename: string): string {
  return `${userId}/${category}/${filename}`
}

export function getReportPath(patientId: string, reportType: string, filename: string): string {
  return `reports/${patientId}/${reportType}/${filename}`
}

// Validation error messages
export const VALIDATION_ERRORS = {
  FILE_TOO_LARGE: (maxSize: number) => `File size exceeds maximum of ${formatFileSize(maxSize)}`,
  INVALID_TYPE: 'File type is not allowed',
  NO_FILE: 'No file provided',
  UPLOAD_FAILED: 'Failed to upload file',
  DELETE_FAILED: 'Failed to delete file',
  NOT_FOUND: 'File not found'
}

// File metadata interface
export interface FileMetadata {
  id: string
  name: string
  originalName: string
  size: number
  mimeType: string
  category: string
  bucket: string
  path: string
  url?: string
  userId: string
  uploadedAt: Date
  expiresAt?: Date
}
