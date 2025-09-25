'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, magicLinkSchema, type LoginFormData, type MagicLinkFormData } from '@/lib/validations/auth'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EnhancedAlert } from '@/components/ui/enhanced-alert'
import { SuccessTransition } from '@/components/ui/form-transition'
import { AnimatePresence } from 'framer-motion'
import { FormContentTransition } from '@/components/ui/page-transition'
import { useToast } from '@/hooks/use-toast'
import { mapAuthError, type AuthError } from '@/lib/auth-errors'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [showMagicLink, setShowMagicLink] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const { signIn, signInWithMagicLink } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const magicLinkForm = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
  })

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    const { error } = await signIn(data.email, data.password)

    if (error) {
      const mappedError = mapAuthError(error)
      setError(mappedError)
    } else {
      // Redirect to dashboard with welcome parameter to show toast there
      router.push('/dashboard?welcome=true')
    }

    setIsLoading(false)
  }

  const switchToMagicLink = () => {
    // Clear validation errors when switching to magic link
    loginForm.clearErrors()
    setError(null)
    setShowMagicLink(true)
  }

  const switchToRegularLogin = () => {
    // Clear magic link form errors when switching back
    magicLinkForm.clearErrors()
    setError(null)
    setShowMagicLink(false)
  }

  const onMagicLinkSubmit = async (data: MagicLinkFormData) => {
    setIsLoading(true)
    setError(null)

    const { error } = await signInWithMagicLink(data.email)

    if (error) {
      const mappedError = mapAuthError(error)
      setError(mappedError)
    } else {
      setMagicLinkSent(true)
      toast({
        title: 'Magic link sent!',
        description: 'Check your email for a magic link to sign in.',
      })
    }

    setIsLoading(false)
  }

  if (magicLinkSent) {
    return (
      <SuccessTransition>
        <Card className="mx-auto max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent you a magic link. Click the link in your email to sign in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                onClick={() => {
                  setMagicLinkSent(false)
                  setShowMagicLink(false)
                  setError(null)
                }}
                variant="outline"
                className="w-full"
              >
                Back to login
              </Button>
            </div>
          </CardContent>
        </Card>
      </SuccessTransition>
    )
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          {showMagicLink 
            ? "Enter your email to receive a magic link"
            : "Enter your credentials to login to your account"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {!showMagicLink ? (
            <FormContentTransition key="regular-login">
              <form 
                onSubmit={loginForm.handleSubmit(onLoginSubmit)} 
                className="space-y-4"
              >
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
                {...loginForm.register('email')}
                type="email"
                placeholder="m@example.com"
                disabled={isLoading}
              />
              {loginForm.formState.errors.email && (
                <p className="text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/reset-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <PasswordInput
                {...loginForm.register('password')}
                disabled={isLoading}
                placeholder="Enter your password"
              />
              {loginForm.formState.errors.password && (
                <p className="text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Login'
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={switchToMagicLink}
              disabled={isLoading}
            >
              Magic Link
            </Button>
              </form>
            </FormContentTransition>
          ) : (
            <FormContentTransition key="magic-link">
              <form 
                onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)} 
                className="space-y-4"
              >
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
                {...magicLinkForm.register('email')}
                type="email"
                placeholder="m@example.com"
                disabled={isLoading}
              />
              {magicLinkForm.formState.errors.email && (
                <p className="text-sm text-red-600">{magicLinkForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending magic link...
                </>
              ) : (
                'Send magic link'
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={switchToRegularLogin}
              disabled={isLoading}
            >
              Back to password login
            </Button>
              </form>
            </FormContentTransition>
          )}
        </AnimatePresence>
        
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </>
  )
}