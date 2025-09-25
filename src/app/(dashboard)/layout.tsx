'use client'

import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { Header } from '@/components/dashboard/header'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { ScaleTransition } from '@/components/ui/page-transition'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { useAuth } from '@/hooks/use-auth'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isInitialized } = useAuth()
  const isLoading = useAuthStore((state) => state.isLoading)
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (isInitialized && !user && !isSigningOut) {
      router.replace('/login')
    }
  }, [user, isInitialized, router, isSigningOut])

  // Detect when user is signing out
  useEffect(() => {
    if (isLoading && user && isInitialized) {
      setIsSigningOut(true)
    } else if (!isLoading) {
      setIsSigningOut(false)
    }
  }, [isLoading, user, isInitialized])

  // Show loading screen while auth is being initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingOverlay 
          isLoading={true} 
          message="Loading..." 
        />
      </div>
    )
  }

  // If user is not authenticated, don't render dashboard (redirect handled by useEffect)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingOverlay 
          isLoading={true} 
          message="Redirecting to login..." 
        />
      </div>
    )
  }

  // Render the dashboard for authenticated users
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <ScaleTransition>
            {children}
          </ScaleTransition>
        </div>
      </SidebarInset>
      <LoadingOverlay 
        isLoading={isSigningOut} 
        message="Signing out..." 
      />
    </SidebarProvider>
  )
}