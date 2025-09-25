"use client"

import * as React from "react"
import { useDropzone } from "react-dropzone"
import { Camera, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

interface AvatarUploadProps {
  currentImageUrl?: string
  fallback?: string
  onImageChange?: (file: File) => Promise<string>
  onImageRemove?: () => Promise<void>
  maxSize?: number
  disabled?: boolean
  className?: string
}

export function AvatarUpload({
  currentImageUrl,
  fallback = "U",
  onImageChange,
  onImageRemove,
  maxSize = 5 * 1024 * 1024, // 5MB
  disabled = false,
  className
}: AvatarUploadProps) {
  const [imageUrl, setImageUrl] = React.useState<string | undefined>(currentImageUrl)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [previewUrl, setPreviewUrl] = React.useState<string | undefined>()
  const { toast } = useToast()

  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    if (disabled || acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    
    // Validate file size
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Please select an image smaller than ${Math.round(maxSize / 1024 / 1024)}MB`,
        variant: "destructive"
      })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      })
      return
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    
    if (onImageChange) {
      try {
        setIsUploading(true)
        setUploadProgress(0)

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return prev
            }
            return prev + 10
          })
        }, 100)

        const newImageUrl = await onImageChange(file)
        
        clearInterval(progressInterval)
        setUploadProgress(100)
        setImageUrl(newImageUrl)
        setPreviewUrl(undefined)
        
        toast({
          title: "Avatar updated",
          description: "Your profile picture has been updated successfully"
        })
      } catch (error) {
        console.error('Upload error:', error)
        setPreviewUrl(undefined)
        toast({
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Failed to upload image",
          variant: "destructive"
        })
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    }
  }, [disabled, maxSize, onImageChange, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    multiple: false,
    disabled: disabled || isUploading,
  })

  const handleRemoveImage = async () => {
    if (onImageRemove) {
      try {
        await onImageRemove()
        setImageUrl(undefined)
        toast({
          title: "Avatar removed",
          description: "Your profile picture has been removed"
        })
      } catch (error) {
        toast({
          title: "Failed to remove avatar",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive"
        })
      }
    }
  }

  React.useEffect(() => {
    setImageUrl(currentImageUrl)
  }, [currentImageUrl])

  const displayImageUrl = previewUrl || imageUrl

  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="relative">
        <div
          {...getRootProps()}
          className={cn(
            "relative group cursor-pointer",
            (disabled || isUploading) && "cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          <Avatar className="h-24 w-24 border-2 border-dashed border-transparent group-hover:border-muted-foreground/50 transition-colors">
            <AvatarImage src={displayImageUrl} alt="Avatar" />
            <AvatarFallback className="text-lg">
              {isUploading ? (
                <div className="flex flex-col items-center justify-center">
                  <Upload className="h-6 w-6 mb-1" />
                  <span className="text-xs">{uploadProgress}%</span>
                </div>
              ) : (
                fallback
              )}
            </AvatarFallback>
          </Avatar>
          
          {!isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Camera className="h-6 w-6 text-white" />
            </div>
          )}
          
          {isDragActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>
        
        {isUploading && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20">
            <Progress value={uploadProgress} className="h-1" />
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = 'image/*'
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (file) {
                onDrop([file])
              }
            }
            input.click()
          }}
          disabled={disabled || isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Change Avatar'}
        </Button>
        
        {displayImageUrl && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRemoveImage}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Drop an image here or click to upload<br />
        Max size: {Math.round(maxSize / 1024 / 1024)}MB
      </p>
    </div>
  )
}