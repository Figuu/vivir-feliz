'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Github, BarChart3, Users, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { motion } from 'framer-motion'

export function Hero() {
  const { user } = useAuth()
  return (
    <section className="w-full px-8">
      <div className="mx-auto max-w-[64rem] space-y-8 py-8 md:py-12 lg:py-32">
        <div className="flex flex-col items-center gap-4 text-center">
          {user ? (
            <>
              <div className="rounded-2xl bg-green-100 px-4 py-1.5 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                Welcome back, {user.name || user.email?.split('@')[0] || 'User'}!
              </div>
              <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
                Your{' '}
                <span className="text-gradient_indigo-purple bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Dashboard
                </span>
                {' '}awaits
              </h1>
              <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                You&apos;re all set up and ready to go! Access your dashboard to manage your account, 
                view analytics, and explore all the features we&apos;ve built for you.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button size="lg" asChild>
                    <Link href="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/dashboard/profile">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile & Settings
                    </Link>
                  </Button>
                </motion.div>
              </div>
              
              {/* Quick actions for logged-in users */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Link 
                  href="/dashboard"
                  className="group flex flex-col items-center gap-2 rounded-lg border p-6 transition-colors hover:bg-muted/50"
                >
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                  <h3 className="font-semibold">Analytics</h3>
                  <p className="text-center text-sm text-muted-foreground">
                    View your stats and insights
                  </p>
                </Link>
                <Link 
                  href="/dashboard/admin/users"
                  className="group flex flex-col items-center gap-2 rounded-lg border p-6 transition-colors hover:bg-muted/50"
                >
                  <Users className="h-8 w-8 text-green-500" />
                  <h3 className="font-semibold">User Management</h3>
                  <p className="text-center text-sm text-muted-foreground">
                    Manage users and permissions
                  </p>
                </Link>
                <Link 
                  href="/dashboard/profile"
                  className="group flex flex-col items-center gap-2 rounded-lg border p-6 transition-colors hover:bg-muted/50"
                >
                  <Settings className="h-8 w-8 text-purple-500" />
                  <h3 className="font-semibold">Settings</h3>
                  <p className="text-center text-sm text-muted-foreground">
                    Customize your experience
                  </p>
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link
                href="https://github.com/yourusername/boring-skale-next"
                className="rounded-2xl bg-muted px-4 py-1.5 text-sm font-medium"
                target="_blank"
              >
                Follow along on GitHub
              </Link>
              <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
                Build faster with the{' '}
                <span className="text-gradient_indigo-purple bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Boring Stack
                </span>
              </h1>
              <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
                A production-ready full-stack template with Next.js 15, Supabase, Prisma, shadcn/ui, and more. 
                Stop reinventing the wheel and start shipping.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button size="lg" asChild>
                    <Link href="/signup">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button variant="outline" size="lg" asChild>
                    <Link 
                      href="https://github.com/yourusername/boring-skale-next" 
                      target="_blank"
                    >
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}