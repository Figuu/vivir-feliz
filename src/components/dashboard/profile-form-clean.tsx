'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/validations/user'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { Camera, Loader2, User, Mail, Phone, FileText, Shield, Lock, Settings, Building, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ChangePasswordDialog } from './change-password-dialog'

export function ProfileFormClean() {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      bio: user?.profile?.bio || '',
      phone: user?.profile?.phone || '',
      company: user?.profile?.company || '',
      website: user?.profile?.website || '',
    },
  })

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        bio: user.profile?.bio || '',
        phone: user.profile?.phone || '',
        company: user.profile?.company || '',
        website: user.profile?.website || '',
      })
    }
  }, [user, reset])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (JPG, PNG, GIF, WebP)',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      })
      return
    }

    setIsUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      // Use avatar-specific endpoint
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload avatar')
      }
      
      const result = await response.json()
      
      // Update user avatar
      const updateResponse = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ avatar: result.url }),
      })

      if (!updateResponse.ok) {
        const updateError = await updateResponse.json()
        throw new Error(updateError.error || 'Failed to update avatar')
      }

      await refreshUser()
      
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully.',
      })
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload avatar',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingAvatar(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const resetForm = () => {
    reset({
      name: user?.name || '',
      bio: user?.profile?.bio || '',
      phone: user?.profile?.phone || '',
      company: user?.profile?.company || '',
      website: user?.profile?.website || '',
    })
  }

  const onSubmit = async (data: UpdateProfileFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          bio: data.bio,
          phone: data.phone,
          company: data.company,
          website: data.website,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      await refreshUser()

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'destructive'
      case 'ADMIN': return 'default'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={user?.avatar || ''} alt={user?.name || 'User'} />
              <AvatarFallback className="text-2xl">
                {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <label 
              htmlFor="avatar-upload" 
              className={`absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full ${
                isUploadingAvatar ? 'cursor-not-allowed opacity-100' : 'cursor-pointer'
              }`}
            >
              {isUploadingAvatar ? (
                <>
                  <Loader2 className="h-6 w-6 text-white animate-spin mb-1" />
                  <span className="text-xs text-white font-medium">Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="h-6 w-6 text-white mb-1" />
                  <span className="text-xs text-white font-medium">Change Photo</span>
                </>
              )}
            </label>
            {/* Persistent edit indicator */}
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg pointer-events-none">
              <Camera className="h-3.5 w-3.5" />
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
            />
          </div>
          
          <div className="flex-1 space-y-1">
            <h2 className="text-2xl font-bold">{user?.name || 'Unnamed User'}</h2>
            <p className="text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {user?.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Badge variant={getRoleBadgeVariant(user?.role || 'USER')}>
                {user?.role?.replace('_', ' ') || 'USER'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="flex flex-col gap-2">
          <ChangePasswordDialog>
            <Button variant="outline" size="sm">
              <Lock className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          </ChangePasswordDialog>
        </div>
      </div>

      <Separator />

      {/* Personal Information Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Personal Information
          </h3>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </Label>
                <Input
                  {...register('name')}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  {...register('phone')}
                  placeholder="+1 (555) 000-0000"
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company
                </Label>
                <Input
                  {...register('company')}
                  placeholder="Your company name"
                  disabled={isLoading}
                />
                {errors.company && (
                  <p className="text-sm text-red-600">{errors.company.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <Input
                  {...register('website')}
                  placeholder="https://yourwebsite.com"
                  disabled={isLoading}
                />
                {errors.website && (
                  <p className="text-sm text-red-600">{errors.website.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Bio
              </Label>
              <Textarea
                {...register('bio')}
                placeholder="Tell us about yourself..."
                disabled={isLoading}
                rows={4}
                className="resize-none"
              />
              {errors.bio && (
                <p className="text-sm text-red-600">{errors.bio.message}</p>
              )}
            </div>
          </div>
        </div>

        {isDirty && (
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              disabled={isLoading}
              onClick={resetForm}
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
    </div>
  )
}