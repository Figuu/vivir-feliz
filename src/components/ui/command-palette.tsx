"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  PersonIcon,
  RocketIcon,
} from "@radix-ui/react-icons"
import { 
  Search,
  Users,
  Home,
  User,
  LogOut,
  Moon,
  Sun,
  Monitor
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useTheme } from "next-themes"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"

interface CommandPaletteProps {
  onOpenChange?: (open: boolean) => void
}

export function CommandPalette({ onOpenChange }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false)
  const { setTheme } = useTheme()
  const { signOut, user } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  React.useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 xl:h-10 xl:w-60 xl:justify-start xl:px-3 xl:py-2"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 xl:mr-2" />
        <span className="hidden xl:inline-flex">Search...</span>
        <span className="sr-only xl:not-sr-only xl:whitespace-nowrap">
          <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 xl:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </span>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard"))}
            >
              <Home className="mr-2 h-4 w-4" />
              <span>Go to Dashboard</span>
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/profile"))}
            >
              <User className="mr-2 h-4 w-4" />
              <span>View Profile</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <CommandItem
                onSelect={() => runCommand(() => router.push("/dashboard/admin/users"))}
              >
                <Users className="mr-2 h-4 w-4" />
                <span>Manage Users</span>
                <CommandShortcut>⌘U</CommandShortcut>
              </CommandItem>
            )}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => runCommand(() => router.push("/"))}
            >
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard"))}
            >
              <RocketIcon className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push("/dashboard/profile"))}
            >
              <PersonIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </CommandItem>
            {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
              <>
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/dashboard/admin/users"))}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>User Management</span>
                </CommandItem>
              </>
            )}
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Settings">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light Theme</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark Theme</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>System Theme</span>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Account">
            <CommandItem
              onSelect={() => runCommand(() => signOut())}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
              <CommandShortcut>⌘Q</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

// Hook for easy integration
export function useCommandPalette() {
  const [open, setOpen] = React.useState(false)
  
  const toggle = React.useCallback(() => setOpen(prev => !prev), [])
  const close = React.useCallback(() => setOpen(false), [])
  const show = React.useCallback(() => setOpen(true), [])
  
  return {
    open,
    setOpen,
    toggle,
    close,
    show,
  }
}