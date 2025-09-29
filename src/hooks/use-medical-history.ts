import { useState, useEffect, useCallback } from 'react'

interface PatientMedicalHistory {
  id: string
  patientInfo: {
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
  }
  medicalHistory: {
    birthHistory: any
    developmentalMilestones: any
    medicalConditions: any
    familyHistory: any
  }
  createdAt: string
  completedAt?: string
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED' | 'APPROVED'
}

interface MedicalHistoryFilters {
  searchTerm?: string
  status?: string
  gender?: string
  ageGroup?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

interface UseMedicalHistoryOptions {
  initialData?: PatientMedicalHistory[]
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useMedicalHistory(options: UseMedicalHistoryOptions = {}) {
  const {
    initialData = [],
    autoRefresh = false,
    refreshInterval = 30000 // 30 seconds
  } = options

  const [data, setData] = useState<PatientMedicalHistory[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<MedicalHistoryFilters>({})

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // In a real application, this would be an API call
      // const response = await fetch('/api/medical-forms')
      // const result = await response.json()
      
      // For now, return the initial data
      setData(initialData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }, [initialData])

  // Filter data based on current filters
  const filteredData = data.filter(item => {
    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      const matchesSearch = 
        item.patientInfo.firstName.toLowerCase().includes(searchLower) ||
        item.patientInfo.lastName.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      if (item.status !== filters.status) return false
    }

    // Gender filter
    if (filters.gender && filters.gender !== 'all') {
      if (item.patientInfo.gender !== filters.gender) return false
    }

    // Age group filter
    if (filters.ageGroup && filters.ageGroup !== 'all') {
      const ageInMonths = calculateAgeInMonths(item.patientInfo.dateOfBirth)
      const ageGroup = getAgeGroup(ageInMonths)
      if (ageGroup !== filters.ageGroup) return false
    }

    // Date range filter
    if (filters.dateRange) {
      const itemDate = new Date(item.createdAt)
      if (itemDate < filters.dateRange.start || itemDate > filters.dateRange.end) {
        return false
      }
    }

    return true
  })

  // Calculate statistics
  const statistics = {
    total: data.length,
    filtered: filteredData.length,
    completed: data.filter(item => item.status === 'COMPLETED').length,
    inProgress: data.filter(item => item.status === 'IN_PROGRESS').length,
    draft: data.filter(item => item.status === 'DRAFT').length,
    approved: data.filter(item => item.status === 'APPROVED').length,
    completionRate: data.length > 0 ? (data.filter(item => item.status === 'COMPLETED').length / data.length) * 100 : 0
  }

  // Get patient by ID
  const getPatientById = useCallback((id: string) => {
    return data.find(patient => patient.id === id)
  }, [data])

  // Update patient data
  const updatePatient = useCallback((id: string, updates: Partial<PatientMedicalHistory>) => {
    setData(prev => prev.map(patient => 
      patient.id === id ? { ...patient, ...updates } : patient
    ))
  }, [])

  // Add new patient
  const addPatient = useCallback((patient: PatientMedicalHistory) => {
    setData(prev => [patient, ...prev])
  }, [])

  // Remove patient
  const removePatient = useCallback((id: string) => {
    setData(prev => prev.filter(patient => patient.id !== id))
  }, [])

  // Export data
  const exportData = useCallback((exportData: PatientMedicalHistory[] = filteredData) => {
    const csvContent = generateCSV(exportData)
    downloadCSV(csvContent, 'medical-history-export.csv')
  }, [filteredData])

  // Set filters
  const setFilter = useCallback((key: keyof MedicalHistoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({})
  }, [])

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, fetchData])

  // Initial data load
  useEffect(() => {
    if (initialData.length > 0) {
      setData(initialData)
    } else {
      fetchData()
    }
  }, [initialData, fetchData])

  return {
    data: filteredData,
    allData: data,
    loading,
    error,
    filters,
    statistics,
    getPatientById,
    updatePatient,
    addPatient,
    removePatient,
    exportData,
    setFilter,
    clearFilters,
    refresh: fetchData
  }
}

// Helper functions
function calculateAgeInMonths(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth)
  const now = new Date()
  return (now.getFullYear() - birthDate.getFullYear()) * 12 + 
         (now.getMonth() - birthDate.getMonth())
}

function getAgeGroup(ageInMonths: number): string {
  if (ageInMonths < 12) return 'infant'
  if (ageInMonths < 24) return 'toddler'
  if (ageInMonths < 60) return 'preschool'
  if (ageInMonths < 120) return 'school'
  return 'adolescent'
}

function generateCSV(data: PatientMedicalHistory[]): string {
  const headers = [
    'ID',
    'Nombre',
    'Apellido',
    'Fecha de Nacimiento',
    'Género',
    'Estado',
    'Fecha de Creación',
    'Fecha de Completado',
    'Condiciones Actuales',
    'Hospitalizaciones',
    'Cirugías',
    'Complicaciones al Nacer'
  ]

  const rows = data.map(patient => [
    patient.id,
    patient.patientInfo.firstName,
    patient.patientInfo.lastName,
    patient.patientInfo.dateOfBirth,
    patient.patientInfo.gender,
    patient.status,
    patient.createdAt,
    patient.completedAt || '',
    patient.medicalHistory.medicalConditions?.currentConditions?.join('; ') || '',
    patient.medicalHistory.medicalConditions?.hospitalizations?.length || 0,
    patient.medicalHistory.medicalConditions?.surgeries?.length || 0,
    patient.medicalHistory.birthHistory?.complications || ''
  ])

  return [headers, ...rows].map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n')
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
