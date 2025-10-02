import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Service {
  id: string
  code: string
  name: string
  description: string
  categoryId: string
  category: {
    id: string
    name: string
    color: string
    icon: string
  }
  type: 'EVALUATION' | 'TREATMENT' | 'CONSULTATION' | 'FOLLOW_UP' | 'ASSESSMENT'
  duration: number
  price: number
  currency: string
  isActive: boolean
  requiresApproval: boolean
  maxSessions?: number
  minSessions?: number
  ageRange?: {
    min: number
    max: number
  }
  prerequisites?: string[]
  outcomes?: string[]
  tags: string[]
  metadata: {
    createdBy: string
    createdAt: string
    updatedAt: string
    usageCount: number
    averageRating?: number
  }
}

interface ServiceCategory {
  id: string
  name: string
  description: string
  icon?: string
  color?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface ServicesResponse {
  services: Service[]
  categories: ServiceCategory[]
  total: number
  page: number
  limit: number
}

interface ServicesFilters {
  categoryId?: string
  type?: string
  isActive?: boolean
  search?: string
  page?: number
  limit?: number
}

// Fetch services from API
const fetchServices = async (filters: ServicesFilters = {}): Promise<ServicesResponse> => {
  const params = new URLSearchParams()
  
  if (filters.categoryId) params.append('categoryId', filters.categoryId)
  if (filters.type) params.append('type', filters.type)
  if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString())
  if (filters.search) params.append('search', filters.search)
  if (filters.page) params.append('page', filters.page.toString())
  if (filters.limit) params.append('limit', filters.limit.toString())

  const response = await fetch(`/api/services?${params.toString()}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch services')
  }
  
  return response.json()
}

// Fetch service categories
const fetchCategories = async (): Promise<ServiceCategory[]> => {
  const response = await fetch('/api/services/categories')
  
  if (!response.ok) {
    throw new Error('Failed to fetch categories')
  }
  
  return response.json()
}

// Fetch single service
const fetchService = async (id: string): Promise<Service> => {
  const response = await fetch(`/api/services/${id}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch service')
  }
  
  return response.json()
}

// Create service
const createService = async (service: Partial<Service>): Promise<Service> => {
  const response = await fetch('/api/services', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(service),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create service')
  }
  
  return response.json()
}

// Update service
const updateService = async (id: string, service: Partial<Service>): Promise<Service> => {
  const response = await fetch(`/api/services/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(service),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update service')
  }
  
  return response.json()
}

// Delete service
const deleteService = async (id: string): Promise<void> => {
  const response = await fetch(`/api/services/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete service')
  }
}

// Create category
const createCategory = async (category: Partial<ServiceCategory>): Promise<ServiceCategory> => {
  const response = await fetch('/api/services/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(category),
  })
  
  if (!response.ok) {
    throw new Error('Failed to create category')
  }
  
  return response.json()
}

// Update category
const updateCategory = async (id: string, category: Partial<ServiceCategory>): Promise<ServiceCategory> => {
  const response = await fetch(`/api/services/categories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(category),
  })
  
  if (!response.ok) {
    throw new Error('Failed to update category')
  }
  
  return response.json()
}

// Delete category
const deleteCategory = async (id: string): Promise<void> => {
  const response = await fetch(`/api/services/categories/${id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete category')
  }
}

// Custom hook for services
export function useServices(filters: ServicesFilters = {}) {
  return useQuery({
    queryKey: ['services', filters],
    queryFn: () => fetchServices(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Custom hook for service categories
export function useServiceCategories() {
  return useQuery({
    queryKey: ['service-categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Custom hook for single service
export function useService(id: string) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: () => fetchService(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Custom hook for service mutations
export function useServiceMutations() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['service-categories'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, service }: { id: string; service: Partial<Service> }) =>
      updateService(id, service),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      queryClient.invalidateQueries({ queryKey: ['service', data.id] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })

  return {
    createService: createMutation.mutate,
    updateService: updateMutation.mutate,
    deleteService: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  }
}

// Custom hook for category mutations
export function useCategoryMutations() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, category }: { id: string; category: Partial<ServiceCategory> }) =>
      updateCategory(id, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-categories'] })
      queryClient.invalidateQueries({ queryKey: ['services'] })
    },
  })

  return {
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  }
}

// Custom hook for filtered services (for proposal creation)
export function useFilteredServices(filters: {
  categoryId?: string
  type?: string
  search?: string
  isActive?: boolean
}) {
  const { data, isLoading, error } = useServices({
    ...filters,
    isActive: filters.isActive ?? true, // Default to active services only
  })

  return {
    services: (data as ServicesResponse)?.services || [],
    categories: (data as ServicesResponse)?.categories || [],
    isLoading,
    error,
    total: (data as ServicesResponse)?.total || 0,
  }
}

// Custom hook for service statistics
export function useServiceStatistics() {
  const { data: servicesData } = useServices({ limit: 1000 }) // Get all services for stats
  const { data: categoriesData } = useServiceCategories()

  const services = (servicesData as ServicesResponse)?.services || []
  const categories = (categoriesData as ServiceCategory[]) || []

  const statistics = {
    totalServices: services.length,
    activeServices: services.filter((s: Service) => s.isActive).length,
    totalCategories: categories.length,
    servicesByType: services.reduce((acc: Record<string, number>, service: Service) => {
      acc[service.type] = (acc[service.type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    servicesByCategory: services.reduce((acc: Record<string, number>, service: Service) => {
      const categoryName = service.category.name
      acc[categoryName] = (acc[categoryName] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    totalRevenue: services.reduce((sum: number, service: Service) => sum + (service.price * service.metadata.usageCount), 0),
    averagePrice: services.length > 0 ? services.reduce((sum: number, service: Service) => sum + service.price, 0) / services.length : 0,
    mostUsedService: services.length > 0 ? services.reduce((max: Service, service: Service) => 
      service.metadata.usageCount > max.metadata.usageCount ? service : max, 
      services[0]
    ) : null,
    averageRating: services.length > 0 ? 
      services.reduce((sum: number, service: Service) => sum + (service.metadata.averageRating || 0), 0) / services.length : 0,
  }

  return {
    statistics,
    isLoading: !servicesData || !categoriesData,
  }
}

// Utility functions
export const getServiceTypeIcon = (type: string) => {
  switch (type) {
    case 'EVALUATION': return 'UserCheck'
    case 'TREATMENT': return 'Heart'
    case 'CONSULTATION': return 'Users'
    case 'FOLLOW_UP': return 'Calendar'
    case 'ASSESSMENT': return 'Brain'
    default: return 'Package'
  }
}

export const getServiceTypeColor = (type: string) => {
  switch (type) {
    case 'EVALUATION': return 'bg-blue-100 text-blue-800'
    case 'TREATMENT': return 'bg-green-100 text-green-800'
    case 'CONSULTATION': return 'bg-purple-100 text-purple-800'
    case 'FOLLOW_UP': return 'bg-yellow-100 text-yellow-800'
    case 'ASSESSMENT': return 'bg-orange-100 text-orange-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${mins}m`
}

export const formatPrice = (price: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price)
}

export const getAgeRangeText = (ageRange?: { min: number; max: number }) => {
  if (!ageRange) return 'Sin restricción de edad'
  return `${ageRange.min}-${ageRange.max} años`
}

export const getSessionRangeText = (minSessions?: number, maxSessions?: number) => {
  if (!minSessions && !maxSessions) return 'Sin límite'
  if (!minSessions) return `Máximo ${maxSessions} sesiones`
  if (!maxSessions) return `Mínimo ${minSessions} sesiones`
  return `${minSessions}-${maxSessions} sesiones`
}

// Export types
export type { Service, ServiceCategory, ServicesResponse, ServicesFilters }
