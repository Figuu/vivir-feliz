"use client"

import * as React from "react"
import { useDropzone, FileRejection } from "react-dropzone"
import { Upload, X, File, Image, FileText, Video, Music, AlertCircle, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface FileUploadFile extends File {
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
  url?: string
}

interface FileUploadProps {
  onFilesChange?: (files: FileUploadFile[]) => void
  onFileUpload?: (file: File) => Promise<{ url: string; id: string }>
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number // in bytes
  multiple?: boolean
  disabled?: boolean
  className?: string
}

const DEFAULT_ACCEPT = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'text/*': ['.txt', '.csv'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

function getFileIcon(file: File) {
  const type = file.type.split('/')[0]
  switch (type) {
    case 'image':
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      return <Image className="h-4 w-4" />
    case 'video':
      return <Video className="h-4 w-4" />
    case 'audio':
      return <Music className="h-4 w-4" />
    case 'text':
    case 'application':
      return <FileText className="h-4 w-4" />
    default:
      return <File className="h-4 w-4" />
  }
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function FileUpload({
  onFilesChange,
  onFileUpload,
  accept = DEFAULT_ACCEPT,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true,
  disabled = false,
  className
}: FileUploadProps) {
  const [files, setFiles] = React.useState<FileUploadFile[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [fileToDelete, setFileToDelete] = React.useState<string | null>(null)

  const uploadFile = React.useCallback(async (file: FileUploadFile) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f
      ))

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === file.id && f.progress < 90) {
            return { ...f, progress: f.progress + 10 }
          }
          return f
        }))
      }, 200)

      if (onFileUpload) {
        const result = await onFileUpload(file)
        clearInterval(progressInterval)
        
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'completed', progress: 100, url: result.url }
            : f
        ))
      } else {
        // Simulate upload completion
        setTimeout(() => {
          clearInterval(progressInterval)
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'completed', progress: 100 }
              : f
          ))
        }, 1000)
      }
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed' 
            }
          : f
      ))
    }
  }, [onFileUpload])

  const onDrop = React.useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    if (disabled) return

    // Handle rejected files
    if (fileRejections.length > 0) {
      console.log('Rejected files:', fileRejections)
    }

    // Create file upload objects
    const newFiles: FileUploadFile[] = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending' as const,
    }))

    setFiles(prev => {
      const combined = [...prev, ...newFiles]
      const limited = multiple ? combined.slice(0, maxFiles) : [newFiles[0]]
      onFilesChange?.(limited)
      return limited
    })

    // Start uploading files
    newFiles.forEach(file => {
      uploadFile(file)
    })
  }, [disabled, multiple, maxFiles, onFilesChange, uploadFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled,
  })

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId)
      onFilesChange?.(updated)
      return updated
    })
    setDeleteDialogOpen(false)
    setFileToDelete(null)
  }

  const retryUpload = (fileId: string) => {
    const file = files.find(f => f.id === fileId)
    if (file) {
      uploadFile({ ...file, status: 'pending', error: undefined })
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop files here...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              Maximum {maxFiles} files, up to {formatFileSize(maxSize)} each
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Files ({files.length})</h4>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center space-x-3 p-3 border rounded-lg"
            >
              <div className="flex-shrink-0">
                {file.status === 'completed' ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : file.status === 'error' ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  getFileIcon(file)
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <Badge variant={
                    file.status === 'completed' ? 'default' :
                    file.status === 'error' ? 'destructive' :
                    file.status === 'uploading' ? 'secondary' : 'outline'
                  }>
                    {file.status === 'uploading' ? `${file.progress}%` : file.status}
                  </Badge>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
                
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="mt-1 h-1" />
                )}
                
                {file.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">{file.error}</p>
                )}
              </div>

              <div className="flex items-center space-x-1">
                {file.status === 'error' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retryUpload(file.id)}
                  >
                    Retry
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFileToDelete(file.id)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the file from your upload queue. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => fileToDelete && removeFile(fileToDelete)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}