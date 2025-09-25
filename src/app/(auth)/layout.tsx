'use client'

import { AuthTransition } from '@/components/ui/page-transition'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { AuthGuard } from '@/components/auth/auth-guard'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
        {/* Subtle background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 via-transparent to-purple-50/20 dark:from-indigo-900/10 dark:to-purple-900/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(0,0,0,0))]" />
        
        <div className="max-w-md w-full space-y-6 px-4 relative z-10">
          <div className="relative min-h-[500px]">
            {/* Static elements that don't transition */}
            <div className="space-y-8">
              {/* Enhanced Boring Stack Logo */}
              <div className="text-center">
                <Link href="/" className="inline-block group">
                  <span className="font-bold text-3xl md:text-4xl transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-0.5 inline-block filter drop-shadow-sm">
                    Boring{' '}
                    <span className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent group-hover:from-indigo-400 group-hover:via-purple-400 group-hover:to-pink-400 transition-all duration-500">
                      Stack
                    </span>
                  </span>
                </Link>
              </div>

              {/* Auth Card Container */}
              <div className="relative">
                <AuthTransition>
                  <Card className="mx-auto max-w-sm backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                    {children}
                  </Card>
                </AuthTransition>
              </div>

              {/* Enhanced Back to Home Button */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
                >
                  <Link href="/">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}