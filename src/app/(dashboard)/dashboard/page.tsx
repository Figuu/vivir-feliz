'use client'

import { AnalyticsDashboard } from '@/components/dashboard/analytics-widgets'
import { AdminSetup } from '@/components/dashboard/admin-setup'
import { WelcomeMessage } from '@/components/dashboard/welcome-message'
import { Suspense, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import { LoadingOverlay } from '@/components/ui/loading-overlay'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()

  useEffect(() => {
    if (user?.role) {
      // Redirect therapists to their specific dashboard
      if (user.role === 'THERAPIST') {
        router.replace('/therapist/dashboard')
      }
      // Add more role-specific redirects as needed
      // else if (user.role === 'PARENT') {
      //   router.replace('/parent-portal')
      // }
    }
  }, [user?.role, router])

  // Show loading while redirecting therapists
  if (user?.role === 'THERAPIST') {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingOverlay isLoading={true} message="Redirecting to your dashboard..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your dashboard. Here&apos;s an overview of your application.
        </p>
      </div>

      <Suspense fallback={null}>
        <WelcomeMessage />
      </Suspense>
      
      <AdminSetup />
      <AnalyticsDashboard />
    </div>
  )
}