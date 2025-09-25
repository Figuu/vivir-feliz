"use client"

import * as React from "react"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Shield, Crown } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function AdminSetup() {
  const user = useAuthStore((state) => state.user)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)

  // Only show this component if user is not already an admin
  if (!user || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return null
  }

  const handleMakeAdmin = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ makeAdmin: true }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to promote to admin')
      }

      const result = await response.json()
      
      toast({
        title: "Success!",
        description: result.message,
      })

      // Refresh the page to update user role
      window.location.reload()

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to promote to admin",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Admin Setup Required
        </CardTitle>
        <CardDescription>
          It looks like you&apos;re the first user! Would you like to become an administrator?
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          As an administrator, you&apos;ll have access to:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 mb-4">
          <li>• User management and role assignment</li>
          <li>• File upload and management</li>
          <li>• System analytics and monitoring</li>
          <li>• Advanced dashboard features</li>
        </ul>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isLoading}>
              <Shield className="mr-2 h-4 w-4" />
              {isLoading ? "Setting up..." : "Become Admin"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Become Administrator?</AlertDialogTitle>
              <AlertDialogDescription>
                This will promote your account to Super Administrator with full access to all features.
                This action is only available for the first user or when no administrators exist.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleMakeAdmin}>
                Yes, Make me Admin
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}