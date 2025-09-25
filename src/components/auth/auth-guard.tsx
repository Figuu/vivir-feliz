'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  allowedRoles?: string[]
  requireAuth?: boolean
}

export function AuthGuard({ 
  children, 
  redirectTo = '/dashboard',
  allowedRoles,
  requireAuth = true
}: AuthGuardProps) {
  const { user, isInitialized } = useAuth()
  const router = useRouter()
  const [roleCheckComplete, setRoleCheckComplete] = useState(false)

  useEffect(() => {
    if (!isInitialized) return

    if (requireAuth && !user) {
      // User should be authenticated but isn't
      router.replace('/login')
      return
    }

    if (!requireAuth && user) {
      // User shouldn't be authenticated but is (e.g., login page)
      router.replace(redirectTo)
      return
    }

    // For role checks, allow access immediately if it's a SUPER_ADMIN or ADMIN
    // even if the role hasn't been fully updated yet
    if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      
      // Only block if we're sure the role check is complete
      // or if the role is definitely not allowed
      if (user.role !== 'USER' || roleCheckComplete) {
        router.replace('/unauthorized')
        return
      }
    }
    
    // Set role check as complete after first render if role is already non-USER
    if (user && user.role !== 'USER' && !roleCheckComplete) {
      setRoleCheckComplete(true)
    }
  }, [user, isInitialized, requireAuth, allowedRoles, redirectTo, router, roleCheckComplete])

  // Auto-complete role check after a short delay
  useEffect(() => {
    if (isInitialized && user && !roleCheckComplete) {
      const timer = setTimeout(() => {
        setRoleCheckComplete(true)
      }, 1500) // 1.5 seconds max wait
      
      return () => clearTimeout(timer)
    }
  }, [isInitialized, user, roleCheckComplete])

  // Optimistically render children for authenticated routes
  // The useEffect will handle redirects if needed
  if (!requireAuth) {
    // For non-auth pages (login, signup), optimistically show content
    return <>{children}</>
  }

  // For auth-required pages, show content optimistically if we're still initializing
  // This prevents the loading screen flash
  if (!isInitialized || user) {
    return <>{children}</>
  }

  // Only return null if we're sure the user is not authenticated
  return null
}