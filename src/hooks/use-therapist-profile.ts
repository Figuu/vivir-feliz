import { useState, useCallback } from 'react'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  specialties: Array<{
    id: string
    name: string
    description: string
  }>
  certifications: Array<{
    id: string
    name: string
    description: string
    expiryRequired: boolean
    obtainedAt: string
    expiryDate?: string
  }>
  bio?: string
  experience?: number
  education?: string
  languages?: string[]
  timezone: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface TherapistQuery {
  page?: number
  limit?: number
  search?: string
  specialty?: string
  isActive?: boolean
  sortBy?: 'firstName' | 'lastName' | 'email' | 'createdAt' | 'licenseExpiry'
  sortOrder?: 'asc' | 'desc'
}

interface TherapistRegistrationData {
  firstName: string
  lastName: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  specialties: string[]
  certifications?: string[]
  bio?: string
  experience?: number
  education?: string
  languages?: string[]
  timezone?: string
}

interface TherapistUpdateData extends Partial<TherapistRegistrationData> {
  id: string
  currentPassword?: string
  newPassword?: string
}

interface UseTherapistProfileReturn {
  loading: boolean
  error: string | null
  
  // Data
  therapists: Therapist[]
  selectedTherapist: Therapist | null
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  
  // CRUD operations
  getTherapists: (query?: TherapistQuery) => Promise<{
    therapists: Therapist[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }>
  
  getTherapist: (id: string) => Promise<Therapist>
  
  createTherapist: (data: TherapistRegistrationData) => Promise<Therapist>
  
  updateTherapist: (data: TherapistUpdateData) => Promise<Therapist>
  
  deleteTherapist: (id: string) => Promise<void>
  
  // Utility functions
  formatPhoneNumber: (phone: string) => string
  formatLicenseNumber: (licenseNumber: string) => string
  capitalizeName: (name: string) => string
  validateEmail: (email: string) => boolean
  validatePhoneNumber: (phone: string) => boolean
  validateLicenseNumber: (licenseNumber: string) => boolean
  isLicenseExpired: (expiryDate: string) => boolean
  isLicenseExpiringSoon: (expiryDate: string) => boolean
  getLicenseStatus: (expiryDate: string) => {
    status: 'valid' | 'expiring' | 'expired'
    color: string
  }
  
  // State management
  setSelectedTherapist: (therapist: Therapist | null) => void
  clearError: () => void
}

export function useTherapistProfile(): UseTherapistProfileReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  const getTherapists = useCallback(async (query: TherapistQuery = {}): Promise<{
    therapists: Therapist[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('page', (query.page || 1).toString())
      params.append('limit', (query.limit || 10).toString())
      params.append('sortBy', query.sortBy || 'firstName')
      params.append('sortOrder', query.sortOrder || 'asc')
      if (query.search) params.append('search', query.search)
      if (query.specialty) params.append('specialty', query.specialty)
      if (query.isActive !== undefined) params.append('isActive', query.isActive.toString())

      const response = await fetch(`/api/therapist/profile?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get therapists')
      }

      setTherapists(result.data.therapists)
      setPagination(result.data.pagination)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get therapists'
      setError(errorMessage)
      console.error('Error getting therapists:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getTherapist = useCallback(async (id: string): Promise<Therapist> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist/profile?id=${id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get therapist')
      }

      return result.data.therapist
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get therapist'
      setError(errorMessage)
      console.error('Error getting therapist:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createTherapist = useCallback(async (data: TherapistRegistrationData): Promise<Therapist> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create therapist')
      }

      // Update local state
      setTherapists(prev => [result.data.therapist, ...prev])
      return result.data.therapist
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create therapist'
      setError(errorMessage)
      console.error('Error creating therapist:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTherapist = useCallback(async (data: TherapistUpdateData): Promise<Therapist> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update therapist')
      }

      // Update local state
      setTherapists(prev => prev.map(t => 
        t.id === data.id ? result.data.therapist : t
      ))
      
      if (selectedTherapist?.id === data.id) {
        setSelectedTherapist(result.data.therapist)
      }

      return result.data.therapist
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update therapist'
      setError(errorMessage)
      console.error('Error updating therapist:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [selectedTherapist])

  const deleteTherapist = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist/profile?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete therapist')
      }

      // Update local state
      setTherapists(prev => prev.map(t => 
        t.id === id ? { ...t, isActive: false } : t
      ))
      
      if (selectedTherapist?.id === id) {
        setSelectedTherapist(null)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete therapist'
      setError(errorMessage)
      console.error('Error deleting therapist:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [selectedTherapist])

  const formatPhoneNumber = useCallback((phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (digits.length >= 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
    
    return phone
  }, [])

  const formatLicenseNumber = useCallback((licenseNumber: string): string => {
    // Convert to uppercase and remove invalid characters
    return licenseNumber.toUpperCase().replace(/[^A-Z0-9\-]/g, '')
  }, [])

  const capitalizeName = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }, [])

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }, [])

  const validatePhoneNumber = useCallback((phone: string): boolean => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // Check if it's a valid length (10-15 digits)
    return digits.length >= 10 && digits.length <= 15
  }, [])

  const validateLicenseNumber = useCallback((licenseNumber: string): boolean => {
    // Check if it contains only uppercase letters, numbers, and hyphens
    return /^[A-Z0-9\-]+$/.test(licenseNumber)
  }, [])

  const isLicenseExpired = useCallback((expiryDate: string): boolean => {
    return new Date(expiryDate) < new Date()
  }, [])

  const isLicenseExpiringSoon = useCallback((expiryDate: string): boolean => {
    const expiry = new Date(expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiry <= thirtyDaysFromNow && expiry > new Date()
  }, [])

  const getLicenseStatus = useCallback((expiryDate: string): {
    status: 'valid' | 'expiring' | 'expired'
    color: string
  } => {
    if (isLicenseExpired(expiryDate)) {
      return { status: 'expired', color: 'bg-red-100 text-red-800 border-red-200' }
    }
    if (isLicenseExpiringSoon(expiryDate)) {
      return { status: 'expiring', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    }
    return { status: 'valid', color: 'bg-green-100 text-green-800 border-green-200' }
  }, [isLicenseExpired, isLicenseExpiringSoon])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    therapists,
    selectedTherapist,
    pagination,
    getTherapists,
    getTherapist,
    createTherapist,
    updateTherapist,
    deleteTherapist,
    formatPhoneNumber,
    formatLicenseNumber,
    capitalizeName,
    validateEmail,
    validatePhoneNumber,
    validateLicenseNumber,
    isLicenseExpired,
    isLicenseExpiringSoon,
    getLicenseStatus,
    setSelectedTherapist,
    clearError
  }
}
