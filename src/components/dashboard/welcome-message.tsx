'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export function WelcomeMessage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const welcome = searchParams.get('welcome')
  const verified = searchParams.get('verified')

  useEffect(() => {
    if (welcome === 'true') {
      // Show toast immediately - no setTimeout needed
      if (verified === 'true') {
        toast({
          title: '🎉 Welcome to the platform!',
          description: 'Your email has been verified and you\'re all set to get started.',
          duration: 5000,
        })
      } else {
        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in to your account.',
          duration: 4000,
        })
      }
      
      // Clean up URL parameters after showing the message
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('welcome')
      newUrl.searchParams.delete('verified')
      router.replace(newUrl.pathname + newUrl.search, { scroll: false })
    }
  }, [welcome, verified, toast, router])

  // No card component - only toast
  return null
}