import { useState, useCallback } from 'react'

interface Specialty {
  id: string
  name: string
  description: string
  category: string
  requirements?: string
  isActive: boolean
  color?: string
  createdAt: string
  updatedAt: string
  _count: {
    therapists: number
  }
}

interface Certification {
  id: string
  name: string
  description: string
  issuingOrganization: string
  category: string
  expiryRequired: boolean
  validityPeriod?: number
  requirements?: string
  website?: string
  isActive: boolean
  color?: string
  createdAt: string
  updatedAt: string
  _count: {
    therapists: number
  }
}

interface SpecialtyQuery {
  page?: number
  limit?: number
  search?: string
  category?: string
  isActive?: boolean
  sortBy?: 'name' | 'category' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

interface CertificationQuery {
  page?: number
  limit?: number
  search?: string
  category?: string
  issuingOrganization?: string
  expiryRequired?: boolean
  isActive?: boolean
  sortBy?: 'name' | 'category' | 'issuingOrganization' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

interface SpecialtyData {
  name: string
  description: string
  category: string
  requirements?: string
  color?: string
}

interface CertificationData {
  name: string
  description: string
  issuingOrganization: string
  category: string
  expiryRequired: boolean
  validityPeriod?: number
  requirements?: string
  website?: string
  color?: string
}

interface UseSpecialtyCertificationReturn {
  loading: boolean
  error: string | null
  
  // Specialty data
  specialties: Specialty[]
  specialtyCategories: string[]
  specialtyPagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  
  // Certification data
  certifications: Certification[]
  certificationCategories: string[]
  certificationOrganizations: string[]
  certificationPagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  
  // Specialty operations
  getSpecialties: (query?: SpecialtyQuery) => Promise<{
    specialties: Specialty[]
    categories: string[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }>
  
  createSpecialty: (data: SpecialtyData) => Promise<Specialty>
  
  updateSpecialty: (id: string, data: Partial<SpecialtyData>) => Promise<Specialty>
  
  deleteSpecialty: (id: string) => Promise<void>
  
  // Certification operations
  getCertifications: (query?: CertificationQuery) => Promise<{
    certifications: Certification[]
    categories: string[]
    organizations: string[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }>
  
  createCertification: (data: CertificationData) => Promise<Certification>
  
  updateCertification: (id: string, data: Partial<CertificationData>) => Promise<Certification>
  
  deleteCertification: (id: string) => Promise<void>
  
  // Utility functions
  validateSpecialtyName: (name: string) => boolean
  validateCertificationName: (name: string) => boolean
  validateWebsite: (url: string) => boolean
  formatSpecialtyName: (name: string) => string
  formatCertificationName: (name: string) => string
  
  // State management
  clearError: () => void
}

export function useSpecialtyCertification(): UseSpecialtyCertificationReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Specialty state
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [specialtyCategories, setSpecialtyCategories] = useState<string[]>([])
  const [specialtyPagination, setSpecialtyPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  // Certification state
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [certificationCategories, setCertificationCategories] = useState<string[]>([])
  const [certificationOrganizations, setCertificationOrganizations] = useState<string[]>([])
  const [certificationPagination, setCertificationPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Specialty operations
  const getSpecialties = useCallback(async (query: SpecialtyQuery = {}): Promise<{
    specialties: Specialty[]
    categories: string[]
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
      params.append('sortBy', query.sortBy || 'name')
      params.append('sortOrder', query.sortOrder || 'asc')
      if (query.search) params.append('search', query.search)
      if (query.category) params.append('category', query.category)
      if (query.isActive !== undefined) params.append('isActive', query.isActive.toString())

      const response = await fetch(`/api/specialties?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get specialties')
      }

      setSpecialties(result.data.specialties)
      setSpecialtyCategories(result.data.categories)
      setSpecialtyPagination(result.data.pagination)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get specialties'
      setError(errorMessage)
      console.error('Error getting specialties:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createSpecialty = useCallback(async (data: SpecialtyData): Promise<Specialty> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/specialties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create specialty')
      }

      // Update local state
      setSpecialties(prev => [result.data.specialty, ...prev])
      return result.data.specialty
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create specialty'
      setError(errorMessage)
      console.error('Error creating specialty:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateSpecialty = useCallback(async (id: string, data: Partial<SpecialtyData>): Promise<Specialty> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/specialties', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update specialty')
      }

      // Update local state
      setSpecialties(prev => prev.map(s => 
        s.id === id ? result.data.specialty : s
      ))
      return result.data.specialty
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update specialty'
      setError(errorMessage)
      console.error('Error updating specialty:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSpecialty = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/specialties?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete specialty')
      }

      // Update local state
      setSpecialties(prev => prev.map(s => 
        s.id === id ? { ...s, isActive: false } : s
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete specialty'
      setError(errorMessage)
      console.error('Error deleting specialty:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Certification operations
  const getCertifications = useCallback(async (query: CertificationQuery = {}): Promise<{
    certifications: Certification[]
    categories: string[]
    organizations: string[]
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
      params.append('sortBy', query.sortBy || 'name')
      params.append('sortOrder', query.sortOrder || 'asc')
      if (query.search) params.append('search', query.search)
      if (query.category) params.append('category', query.category)
      if (query.issuingOrganization) params.append('issuingOrganization', query.issuingOrganization)
      if (query.expiryRequired !== undefined) params.append('expiryRequired', query.expiryRequired.toString())
      if (query.isActive !== undefined) params.append('isActive', query.isActive.toString())

      const response = await fetch(`/api/certifications?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get certifications')
      }

      setCertifications(result.data.certifications)
      setCertificationCategories(result.data.categories)
      setCertificationOrganizations(result.data.organizations)
      setCertificationPagination(result.data.pagination)
      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get certifications'
      setError(errorMessage)
      console.error('Error getting certifications:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createCertification = useCallback(async (data: CertificationData): Promise<Certification> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/certifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create certification')
      }

      // Update local state
      setCertifications(prev => [result.data.certification, ...prev])
      return result.data.certification
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create certification'
      setError(errorMessage)
      console.error('Error creating certification:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateCertification = useCallback(async (id: string, data: Partial<CertificationData>): Promise<Certification> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/certifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update certification')
      }

      // Update local state
      setCertifications(prev => prev.map(c => 
        c.id === id ? result.data.certification : c
      ))
      return result.data.certification
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update certification'
      setError(errorMessage)
      console.error('Error updating certification:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteCertification = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/certifications?id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete certification')
      }

      // Update local state
      setCertifications(prev => prev.map(c => 
        c.id === id ? { ...c, isActive: false } : c
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete certification'
      setError(errorMessage)
      console.error('Error deleting certification:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Utility functions
  const validateSpecialtyName = useCallback((name: string): boolean => {
    return /^[a-zA-Z\s\-&]+$/.test(name) && name.length >= 2 && name.length <= 100
  }, [])

  const validateCertificationName = useCallback((name: string): boolean => {
    return /^[a-zA-Z0-9\s\-&()]+$/.test(name) && name.length >= 2 && name.length <= 100
  }, [])

  const validateWebsite = useCallback((url: string): boolean => {
    if (!url) return true // Optional field
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, [])

  const formatSpecialtyName = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }, [])

  const formatCertificationName = useCallback((name: string): string => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    specialties,
    specialtyCategories,
    specialtyPagination,
    certifications,
    certificationCategories,
    certificationOrganizations,
    certificationPagination,
    getSpecialties,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
    getCertifications,
    createCertification,
    updateCertification,
    deleteCertification,
    validateSpecialtyName,
    validateCertificationName,
    validateWebsite,
    formatSpecialtyName,
    formatCertificationName,
    clearError
  }
}
