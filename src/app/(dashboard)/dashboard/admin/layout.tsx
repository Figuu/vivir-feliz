'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isInitialized } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!isInitialized || !user) return

    // Check role after a short delay to allow for role updates
    const timer = setTimeout(() => {
      if (!['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        router.replace('/unauthorized')
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [user, isInitialized, router])

  // Optimistically render children to avoid loading screen flash
  return <>{children}</>
}