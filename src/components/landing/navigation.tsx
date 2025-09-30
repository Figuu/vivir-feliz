'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Menu, User, Settings, LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useAuth } from '@/hooks/use-auth'
import { motion } from 'framer-motion'
import { ConsultationModal } from './consultation-modal'
import { Calendar } from 'lucide-react'
export function Navigation() {
  const [open, setOpen] = useState(false)
  const { user, signOut, isInitialized } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-[64rem] px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-lg">Vivir Feliz</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="#features"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Features
              </Link>
            </nav>
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="flex md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0">
                <Link
                  href="/"
                  className="flex items-center"
                  onClick={() => setOpen(false)}
                >
                  <span className="font-bold">Vivir Feliz</span>
                </Link>
                <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
                  <div className="flex flex-col space-y-3">
                    <Link
                      href="#features"
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setOpen(false)}
                    >
                      Features
                    </Link>
                    <Link
                      href="#pricing"
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setOpen(false)}
                    >
                      Pricing
                    </Link>
                    <Link
                      href="/docs"
                      className="transition-colors hover:text-foreground/80 text-foreground/60"
                      onClick={() => setOpen(false)}
                    >
                      Docs
                    </Link>
                    {isInitialized && !user && (
                      <ConsultationModal>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => setOpen(false)}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Book Consultation
                        </Button>
                      </ConsultationModal>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Mobile Logo */}
          <Link href="/" className="flex items-center md:hidden">
            <span className="font-bold text-lg">Vivir Feliz</span>
          </Link>

          {/* Right side actions */}
          <nav className="flex items-center gap-2">
            <ThemeToggle />
            {isInitialized && !user && (
              <ConsultationModal>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Consultation
                  </Button>
                </motion.div>
              </ConsultationModal>
            )}
            {isInitialized && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar || ''} alt={user.name || user.email || ''} />
                      <AvatarFallback>
                        {user.name 
                          ? user.name.charAt(0).toUpperCase()
                          : user.email?.charAt(0).toUpperCase() || 'U'
                        }
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile & Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="flex items-center cursor-pointer"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isInitialized && (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                    <Link href="/login">Login</Link>
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button size="sm" asChild>
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </motion.div>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}