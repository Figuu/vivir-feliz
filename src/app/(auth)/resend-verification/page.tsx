'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedAlert } from '@/components/ui/enhanced-alert'
import { SuccessTransition } from '@/components/ui/form-transition'
import { useToast } from '@/hooks/use-toast'
import { mapAuthError, type AuthError } from '@/lib/auth-errors'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ResendFormData = z.infer<typeof resendSchema>

export default function ResendVerificationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [success, setSuccess] = useState(false)
  const { resendVerification } = useAuth()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResendFormData>({
    resolver: zodResolver(resendSchema),
  })

  const onSubmit = async (data: ResendFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const { error } = await resendVerification(data.email)

    if (error) {
      const mappedError = mapAuthError(error)
      setError(mappedError)
    } else {
      setSuccess(true)
      toast({
        title: 'Verification email sent!',
        description: 'Check your email for a new verification link.',
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
              We&apos;ve sent you a new verification link. Please check your email and click the link to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <Link href="/login" className="text-sm underline block">
                Back to login
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSuccess(false)}
              >
                Send another email
              </Button>
            </div>
          </CardContent>
        </Card>
      </SuccessTransition>
    )
  }

  return (
    <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Resend verification</CardTitle>
          <CardDescription>
            Enter your email address to receive a new verification link
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
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend verification email'
              )}
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            Remember your password?{' '}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
  )
}