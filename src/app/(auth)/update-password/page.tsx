'use client'

import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updatePasswordSchema, type UpdatePasswordFormData } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { PasswordStrength } from '@/components/ui/password-strength'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

function UpdatePasswordContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [showPasswordStrength, setShowPasswordStrength] = useState(false)
  const [hasPasswordInteraction, setHasPasswordInteraction] = useState(false)
  const [isReadonly, setIsReadonly] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  })

  // Watch the password field for the strength indicator
  const watchedPassword = watch('password', '')

  // Prevent autofill on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReadonly(false)
    }, 100) // Remove readonly after brief delay to prevent autofill
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const newPassword = watchedPassword || ''
    setPassword(newPassword)
    
    // Use a small delay to distinguish between user typing and autofill
    if (hasPasswordInteraction && newPassword.length > 0) {
      const timer = setTimeout(() => {
        setShowPasswordStrength(true)
      }, 100) // Small delay to avoid autofill jitter
      
      return () => clearTimeout(timer)
    } else if (!hasPasswordInteraction || newPassword.length === 0) {
      setShowPasswordStrength(false)
    }
  }, [watchedPassword, hasPasswordInteraction])

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      
      // Check if we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        // Check if we have error codes in the URL
        const errorCode = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        
        if (errorCode || errorDescription) {
          setError(errorDescription || 'An error occurred during password reset')
        } else {
          setError('Invalid or expired password reset link. Please request a new one.')
        }
      }
    }

    checkSession()
  }, [searchParams])

  const onSubmit = async (data: UpdatePasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // First check if we have a session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('Session expired. Please request a new password reset link.')
        setIsLoading(false)
        return
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        // Sign out the user after password update for security
        await supabase.auth.signOut()
        
        // Redirect to login with success message
        router.push('/login?message=Password updated successfully. Please login with your new password.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Optimistically render the form to avoid loading screen flash
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Update password</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <PasswordInput
              {...register('password', {
                onChange: () => setHasPasswordInteraction(true)
              })}
              disabled={isLoading || !!error?.includes('expired') || !!error?.includes('Invalid')}
              placeholder="Enter your new password"
              onFocus={() => {
                setHasPasswordInteraction(true)
                setIsReadonly(false)
              }}
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
              readOnly={isReadonly}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
            <AnimatePresence>
              {showPasswordStrength && <PasswordStrength password={password} />}
            </AnimatePresence>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <PasswordInput
              {...register('confirmPassword')}
              disabled={isLoading || !!error?.includes('expired') || !!error?.includes('Invalid')}
              placeholder="Confirm your new password"
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          {error?.includes('expired') || error?.includes('Invalid') ? (
            <Button 
              type="button" 
              className="w-full" 
              onClick={() => router.push('/reset-password')}
            >
              Request New Reset Link
            </Button>
          ) : (
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update password'
              )}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

export default function UpdatePasswordPage() {
  return (
    <Suspense>
      <UpdatePasswordContent />
    </Suspense>
  )
}