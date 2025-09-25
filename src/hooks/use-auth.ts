import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useCallback } from 'react'
import { createSession } from '@/lib/session-client'
import { getAppUrl } from '@/lib/config'

export function useAuth() {
  const { user, isInitialized, setUser, setLoading, setError, setInitialized, signOut: storeSignOut, fetchUserData } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    let supabase
    let isMounted = true
    
    try {
      supabase = createClient()
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error)
      if (isMounted) {
        setError('Supabase is not configured. Please set up your environment variables.')
        setLoading(false)
        setInitialized(true)
      }
      return
    }

    // Get initial session
    const getSession = async () => {
      if (!isMounted) return
      
      setLoading(true)
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (!isMounted) return
      
      if (error) {
        setError(error.message)
        setUser(null)
      } else if (session?.user) {
        // Check if we have cached user data from localStorage first
        const cachedUser = useAuthStore.getState().user
        
        if (cachedUser && cachedUser.id === session.user.id) {
          // Use cached data immediately if available for same user
          if (isMounted) {
            setUser(cachedUser)
            setLoading(false)
            setInitialized(true)
          }
          
          // Still fetch fresh data in background but don't show loading
          fetchUserData().then((userData) => {
            if (isMounted && userData && userData.role !== cachedUser.role) {
              setUser(userData)
            }
          })
        } else {
          // No cached data or different user - fetch from API first
          const userData = await fetchUserData()
          if (isMounted) {
            setUser(userData)
            setLoading(false)
            setInitialized(true)
          }
        }
      } else {
        setUser(null)
        if (isMounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    }

    getSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        if (event === 'SIGNED_OUT') {
          setUser(null)
          // Don't auto-redirect on sign out as it's handled by the signOut function
        } else if (session?.user) {
          // Fetch complete user data from our API
          const userData = await fetchUserData()
          if (isMounted) {
            setUser(userData)
          }
        } else {
          setUser(null)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [setUser, setLoading, setError, setInitialized, router, fetchUserData])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return { error }
      }

      // Fetch complete user data from our API
      const userData = await fetchUserData()
      setUser(userData)
      
      // Create session tracking
      if (data.user) {
        createSession('email')
      }
      
      setLoading(false)
      return { data }
    } catch (error) {
      setError('Failed to sign in. Please check your Supabase configuration.')
      setLoading(false)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${getAppUrl()}/api/auth/callback?next=/dashboard?welcome=true&verified=true`,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return { error }
      }

      setLoading(false)
      return { data }
    } catch (error) {
      setError('Failed to sign up. Please check your Supabase configuration.')
      setLoading(false)
      return { error }
    }
  }

  const signOut = useCallback(async () => {
    const currentUser = useAuthStore.getState().user
    
    // Set loading state immediately
    setLoading(true)
    
    try {
      const supabase = createClient()
      
      // Sign out from Supabase first and wait for it
      await supabase.auth.signOut()
      
      // Log the logout attempt after successful Supabase signout
      if (currentUser) {
        try {
          await fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'LOGOUT',
              resource: 'auth',
              success: true,
              category: 'authentication'
            })
          })
        } catch (auditError) {
          console.error('Failed to log logout:', auditError)
        }
      }
      
      // Clear local state after successful operations
      storeSignOut()
      
      // Use router.push first to start navigation
      router.push('/login')
      
      // Fallback with window.location after a short delay if needed
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }, 500)
      
      return { error: null }
    } catch (error) {
      console.error('Supabase sign out error:', error)
      
      // Log failed logout attempt
      if (currentUser) {
        try {
          await fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'LOGOUT',
              resource: 'auth',
              success: false,
              errorMessage: error instanceof Error ? error.message : 'Unknown logout error',
              category: 'authentication'
            })
          })
        } catch (auditError) {
          console.error('Failed to log logout error:', auditError)
        }
      }
      
      // Even if Supabase sign out fails, clear local state and redirect
      storeSignOut()
      
      // Use router.push first to start navigation
      router.push('/login')
      
      // Fallback with window.location after a short delay if needed
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }, 500)
      
      return { error: null }
    }
  }, [storeSignOut, setLoading, router])

  const resetPassword = async (email: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getAppUrl()}/update-password`,
      })

      if (error) {
        setError(error.message)
      }
      
      setLoading(false)
      return { error }
    } catch (error) {
      setError('Failed to reset password. Please check your Supabase configuration.')
      setLoading(false)
      return { error }
    }
  }

  const signInWithMagicLink = async (email: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      console.log('Attempting magic link sign in for:', email)
      console.log('Redirect URL:', `${getAppUrl()}/dashboard`)
      
      const { error, data } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${getAppUrl()}/api/auth/callback`,
          shouldCreateUser: true,
        },
      })

      if (error) {
        console.error('Supabase OTP error:', error)
        // More specific error messages
        if (error.message.includes('Failed to fetch')) {
          setError('Unable to connect to authentication service. Please check your internet connection and try again.')
        } else if (error.message.includes('Email provider')) {
          setError('Email authentication is not configured. Please contact support or use another sign-in method.')
        } else {
          setError(error.message)
        }
      } else {
        console.log('Magic link sent successfully', data)
        // Create session tracking for magic link login
        createSession('magic-link')
      }
      
      setLoading(false)
      return { error }
    } catch (error: unknown) {
      console.error('Magic link catch error:', error)
      let errorMessage = 'Failed to send magic link.'
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to authentication service. Please check your internet connection and try again.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
      setLoading(false)
      return { error: errorMessage }
    }
  }

  const resendVerification = async (email: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${getAppUrl()}/api/auth/callback?next=/dashboard?welcome=true&verified=true`,
        }
      })

      if (error) {
        setError(error.message)
      }
      
      setLoading(false)
      return { error }
    } catch (error) {
      setError('Failed to resend verification email. Please try again later.')
      setLoading(false)
      return { error }
    }
  }

  const refreshUser = async () => {
    const userData = await fetchUserData()
    if (userData) {
      setUser(userData)
    }
    return userData
  }

  return {
    user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithMagicLink,
    resendVerification,
    refreshUser,
    isInitialized,
  }
}