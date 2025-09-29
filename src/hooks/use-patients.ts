import { useState, useCallback } from 'react'

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  gender?: string
  address?: string
  status: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  medicalInfo?: {
    allergies?: string
    medications?: string
    medicalConditions?: string
    insuranceProvider?: string
    insuranceNumber?: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
  lastSession?: {
    id: string
    scheduledDate: string
    scheduledTime: string
    status: string
    therapist: {
      id: string
      firstName: string
      lastName: string
    }
  }
  totalSessions: number
  recentSessions: Array<{
    id: string
    scheduledDate: string
    scheduledTime: string
    status: string
    therapist: {
      id: string
      firstName: string
      lastName: string
    }
  }>
}

interface Session {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: string
  sessionNotes?: string
  therapistComments?: string
  therapist: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  services: Array<{
    id: string
    name: string
    description: string
    price: number
  }>
  revenue: number
}

interface PatientStatistics {
  totalSessions: number
  completedSessions: number
  upcomingSessions: number
  totalRevenue: number
  completionRate: number
  sessionStats: {
    scheduled: number
    completed: number
    cancelled: number
    'no-show': number
    'in-progress': number
  }
}

interface Therapist {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface PatientDetails {
  patient: Patient
  statistics: PatientStatistics
  recentSessions: Session[]
  upcomingSessions: Session[]
  therapists: Therapist[]
}

interface PatientQuery {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive' | 'archived'
  therapistId?: string
  sortBy?: 'firstName' | 'lastName' | 'createdAt' | 'lastSession'
  sortOrder?: 'asc' | 'desc'
}

interface PatientCreateData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  address?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  medicalInfo?: {
    allergies?: string
    medications?: string
    medicalConditions?: string
    insuranceProvider?: string
    insuranceNumber?: string
  }
  notes?: string
}

interface PatientUpdateData {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  address?: string
  status?: 'active' | 'inactive' | 'archived'
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  medicalInfo?: {
    allergies?: string
    medications?: string
    medicalConditions?: string
    insuranceProvider?: string
    insuranceNumber?: string
  }
  notes?: string
}

interface UsePatientsReturn {
  loading: boolean
  error: string | null
  
  // Data
  patients: Patient[]
  totalCount: number
  currentPage: number
  totalPages: number
  
  // Operations
  loadPatients: (query?: PatientQuery) => Promise<{ patients: Patient[]; pagination: any }>
  loadPatientDetails: (patientId: string) => Promise<PatientDetails>
  createPatient: (patientData: PatientCreateData) => Promise<Patient>
  updatePatient: (patientId: string, patientData: PatientUpdateData) => Promise<Patient>
  deletePatient: (patientId: string) => Promise<void>
  
  // Utility functions
  formatDate: (dateString: string) => string
  formatTime: (timeString: string) => string
  getStatusColor: (status: string) => string
  getSessionStatusColor: (status: string) => string
  calculateAge: (dateOfBirth?: string) => number | null
  getPatientFullName: (patient: Patient) => string
  getPatientInitials: (patient: Patient) => string
  getPatientDisplayInfo: (patient: Patient) => { name: string; subtitle: string; status: string }
  filterPatientsByStatus: (patients: Patient[], status: string) => Patient[]
  searchPatients: (patients: Patient[], searchTerm: string) => Patient[]
  sortPatients: (patients: Patient[], sortBy: string, sortOrder: string) => Patient[]
  getPatientStatistics: (patient: Patient) => { totalSessions: number; lastSession: string | null; status: string }
  getRecentPatients: (patients: Patient[], limit?: number) => Patient[]
  getActivePatients: (patients: Patient[]) => Patient[]
  getInactivePatients: (patients: Patient[]) => Patient[]
  getArchivedPatients: (patients: Patient[]) => Patient[]
  
  // State management
  clearError: () => void
  setCurrentPage: (page: number) => void
}

export function usePatients(): UsePatientsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadPatients = useCallback(async (query: PatientQuery = {}): Promise<{ patients: Patient[]; pagination: any }> => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (query.page) params.append('page', query.page.toString())
      if (query.limit) params.append('limit', query.limit.toString())
      if (query.search) params.append('search', query.search)
      if (query.status) params.append('status', query.status)
      if (query.therapistId) params.append('therapistId', query.therapistId)
      if (query.sortBy) params.append('sortBy', query.sortBy)
      if (query.sortOrder) params.append('sortOrder', query.sortOrder)

      const response = await fetch(`/api/patients?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load patients')
      }

      setPatients(result.data.patients)
      setTotalCount(result.data.pagination.totalCount)
      setCurrentPage(result.data.pagination.page)
      setTotalPages(result.data.pagination.totalPages)
      
      return {
        patients: result.data.patients,
        pagination: result.data.pagination
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patients'
      setError(errorMessage)
      console.error('Error loading patients:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const loadPatientDetails = useCallback(async (patientId: string): Promise<PatientDetails> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/patients/${patientId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load patient details')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patient details'
      setError(errorMessage)
      console.error('Error loading patient details:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createPatient = useCallback(async (patientData: PatientCreateData): Promise<Patient> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create patient')
      }

      return result.data.patient
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create patient'
      setError(errorMessage)
      console.error('Error creating patient:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePatient = useCallback(async (patientId: string, patientData: PatientUpdateData): Promise<Patient> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update patient')
      }

      return result.data.patient
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update patient'
      setError(errorMessage)
      console.error('Error updating patient:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deletePatient = useCallback(async (patientId: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete patient')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete patient'
      setError(errorMessage)
      console.error('Error deleting patient:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // Utility functions
  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  const formatTime = useCallback((timeString: string): string => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }, [])

  const getStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }, [])

  const getSessionStatusColor = useCallback((status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'no-show':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const calculateAge = useCallback((dateOfBirth?: string): number | null => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }, [])

  const getPatientFullName = useCallback((patient: Patient): string => {
    return `${patient.firstName} ${patient.lastName}`
  }, [])

  const getPatientInitials = useCallback((patient: Patient): string => {
    return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase()
  }, [])

  const getPatientDisplayInfo = useCallback((patient: Patient): { name: string; subtitle: string; status: string } => {
    return {
      name: getPatientFullName(patient),
      subtitle: patient.email,
      status: patient.status
    }
  }, [getPatientFullName])

  const filterPatientsByStatus = useCallback((patients: Patient[], status: string): Patient[] => {
    return patients.filter(patient => patient.status === status)
  }, [])

  const searchPatients = useCallback((patients: Patient[], searchTerm: string): Patient[] => {
    if (!searchTerm) return patients
    
    const term = searchTerm.toLowerCase()
    return patients.filter(patient => 
      patient.firstName.toLowerCase().includes(term) ||
      patient.lastName.toLowerCase().includes(term) ||
      patient.email.toLowerCase().includes(term) ||
      patient.phone.includes(term)
    )
  }, [])

  const sortPatients = useCallback((patients: Patient[], sortBy: string, sortOrder: string): Patient[] => {
    return [...patients].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case 'firstName':
          aValue = a.firstName
          bValue = b.firstName
          break
        case 'lastName':
          aValue = a.lastName
          bValue = b.lastName
          break
        case 'createdAt':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case 'lastSession':
          aValue = a.lastSession ? new Date(a.lastSession.scheduledDate) : new Date(0)
          bValue = b.lastSession ? new Date(b.lastSession.scheduledDate) : new Date(0)
          break
        default:
          aValue = a.lastName
          bValue = b.lastName
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [])

  const getPatientStatistics = useCallback((patient: Patient): { totalSessions: number; lastSession: string | null; status: string } => {
    return {
      totalSessions: patient.totalSessions,
      lastSession: patient.lastSession ? formatDate(patient.lastSession.scheduledDate) : null,
      status: patient.status
    }
  }, [formatDate])

  const getRecentPatients = useCallback((patients: Patient[], limit: number = 10): Patient[] => {
    return patients
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }, [])

  const getActivePatients = useCallback((patients: Patient[]): Patient[] => {
    return filterPatientsByStatus(patients, 'active')
  }, [filterPatientsByStatus])

  const getInactivePatients = useCallback((patients: Patient[]): Patient[] => {
    return filterPatientsByStatus(patients, 'inactive')
  }, [filterPatientsByStatus])

  const getArchivedPatients = useCallback((patients: Patient[]): Patient[] => {
    return filterPatientsByStatus(patients, 'archived')
  }, [filterPatientsByStatus])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    patients,
    totalCount,
    currentPage,
    totalPages,
    loadPatients,
    loadPatientDetails,
    createPatient,
    updatePatient,
    deletePatient,
    formatDate,
    formatTime,
    getStatusColor,
    getSessionStatusColor,
    calculateAge,
    getPatientFullName,
    getPatientInitials,
    getPatientDisplayInfo,
    filterPatientsByStatus,
    searchPatients,
    sortPatients,
    getPatientStatistics,
    getRecentPatients,
    getActivePatients,
    getInactivePatients,
    getArchivedPatients,
    clearError,
    setCurrentPage
  }
}
