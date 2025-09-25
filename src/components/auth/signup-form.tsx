'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupFormData } from '@/lib/validations/auth'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedAlert } from '@/components/ui/enhanced-alert'
import { PasswordStrength } from '@/components/ui/password-strength'
import { SuccessTransition } from '@/components/ui/form-transition'
import { useToast } from '@/hooks/use-toast'
import { mapAuthError, type AuthError } from '@/lib/auth-errors'
import { Loader2 } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export function SignupForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('')
  const [showPasswordStrength, setShowPasswordStrength] = useState(false)
  const [hasPasswordInteraction, setHasPasswordInteraction] = useState(false)
  const [isReadonly, setIsReadonly] = useState(true)
  const { signUp } = useAuth()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  // Watch password field for real-time validation
  const watchedPassword = watch('password', '')

  // Prevent autofill on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsReadonly(false)
    }, 100) // Remove readonly after brief delay to prevent autofill
    
    return () => clearTimeout(timer)
  }, [])

  // Update local password state when form password changes
  React.useEffect(() => {
    const newPassword = watchedPassword || ''
    setPassword(newPassword)
    
    // Use a small delay to distinguish between user typing and autofill
    // Autofill happens immediately on page load, user typing happens after interaction
    if (hasPasswordInteraction && newPassword.length > 0) {
      const timer = setTimeout(() => {
        setShowPasswordStrength(true)
      }, 100) // Small delay to avoid autofill jitter
      
      return () => clearTimeout(timer)
    } else if (!hasPasswordInteraction || newPassword.length === 0) {
      setShowPasswordStrength(false)
    }
  }, [watchedPassword, hasPasswordInteraction])

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const { error } = await signUp(data.email, data.password, data.name)

    if (error) {
      const mappedError = mapAuthError(error)
      setError(mappedError)
    } else {
      setSuccess(true)
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      })
    }

    setIsLoading(false)
  }

  if (success) {
    return (
      <SuccessTransition>
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent you a verification link. Please check your email and click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Link href="/login" className="text-sm underline">
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </SuccessTransition>
    )
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <EnhancedAlert
              type={error.type}
              title={error.title}
              message={error.message}
              action={error.action}
              closeable
              onClose={() => setError(null)}
            />
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              {...register('name')}
              placeholder="John Doe"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              {...register('email')}
              type="email"
              placeholder="m@example.com"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              {...register('password', {
                onChange: () => setHasPasswordInteraction(true)
              })}
              disabled={isLoading}
              placeholder="Enter your password"
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
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <PasswordInput
              {...register('confirmPassword')}
              disabled={isLoading}
              placeholder="Confirm your password"
              autoComplete="new-password"
              data-lpignore="true"
              data-form-type="other"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </Button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </>
  )
}