import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User } from '@/types'

// Global promise cache to deduplicate requests
let fetchUserDataPromise: Promise<User | null> | null = null

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  
  setUser: (user: User | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  setInitialized: (isInitialized: boolean) => void
  signOut: () => void
  fetchUserData: () => Promise<User | null>
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isLoading: true, // Start as loading
        error: null,
        isInitialized: false,
        
        setUser: (user) => set({ user, error: null }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        setInitialized: (isInitialized) => set({ isInitialized }),
        signOut: () => {
          set({ user: null, error: null, isLoading: false, isInitialized: true })
          // Clear persisted data immediately
          try {
            localStorage.removeItem('auth-storage')
            // Also clear any other potential auth-related localStorage items
            Object.keys(localStorage).forEach(key => {
              if (key.includes('supabase') || key.includes('auth')) {
                localStorage.removeItem(key)
              }
            })
          } catch (error) {
            console.error('Error clearing localStorage:', error)
          }
          // Clear cached promise
          fetchUserDataPromise = null
          
          // Clear any Supabase session storage
          try {
            sessionStorage.clear()
          } catch (error) {
            console.error('Error clearing sessionStorage:', error)
          }
        },
        fetchUserData: async () => {
          // If there's already a request in flight, return it
          if (fetchUserDataPromise) {
            return fetchUserDataPromise
          }

          // Create a new promise and cache it
          fetchUserDataPromise = (async () => {
            try {
              const response = await fetch('/api/user')
              if (!response.ok) return null
              
              const data = await response.json()
              return data.user
            } catch (error) {
              console.error('Failed to fetch user data:', error)
              return null
            } finally {
              // Clear the cache after request completes (success or failure)
              setTimeout(() => {
                fetchUserDataPromise = null
              }, 100) // Small delay to prevent race conditions
            }
          })()

          return fetchUserDataPromise
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user,
          // Store the timestamp to know when data was cached
          cachedAt: new Date().toISOString()
        }),
        onRehydrateStorage: () => (state) => {
          // If we have a persisted user, set initialized to true immediately
          if (state?.user) {
            state.isInitialized = true
            state.isLoading = false
          }
        },
      }
    )
  )
)