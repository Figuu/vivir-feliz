'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Award,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Search,
  Filter,
  X,
  Eye,
  EyeOff,
  Users,
  Calendar,
  FileText,
  Settings,
  CheckCircle,
  AlertTriangle,
  Star,
  Heart,
  Zap,
  Target,
  Activity,
  BarChart3,
  Download,
  Upload
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

// Validation schema
const specialtySchema = z.object({
  name: z.string()
    .min(2, 'Specialty name must be at least 2 characters')
    .max(100, 'Specialty name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-&]+$/, 'Specialty name can only contain letters, spaces, hyphens, and ampersands'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  category: z.string()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must be less than 50 characters'),
  requirements: z.string()
    .max(1000, 'Requirements must be less than 1000 characters')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color code')
    .optional()
})

type SpecialtyFormData = z.infer<typeof specialtySchema>

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

interface SpecialtyManagerProps {
  onSpecialtySelect?: (specialty: Specialty) => void
  onSpecialtyUpdate?: (specialty: Specialty) => void
  onSpecialtyDelete?: (specialty: Specialty) => void
}

export function SpecialtyManager({
  onSpecialtySelect,
  onSpecialtyUpdate,
  onSpecialtyDelete
}: SpecialtyManagerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null)
  const [activeTab, setActiveTab] = useState('list')
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    isActive: '',
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [categories, setCategories] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<SpecialtyFormData>({
    resolver: zodResolver(specialtySchema),
    defaultValues: {
      color: '#3B82F6'
    }
  })

  // Load specialties
  useEffect(() => {
    loadSpecialties()
  }, [filters, pagination.page, pagination.limit])

  const loadSpecialties = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      params.append('sortBy', filters.sortBy)
      params.append('sortOrder', filters.sortOrder)
      if (filters.search) params.append('search', filters.search)
      if (filters.category) params.append('category', filters.category)
      if (filters.isActive) params.append('isActive', filters.isActive)

      const response = await fetch(`/api/specialties?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load specialties')
      }

      setSpecialties(result.data.specialties)
      setCategories(result.data.categories)
      setPagination(prev => ({
        ...prev,
        total: result.data.pagination.total,
        pages: result.data.pagination.pages
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load specialties'
      setError(errorMessage)
      console.error('Error loading specialties:', err)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: SpecialtyFormData) => {
    try {
      setLoading(true)
      setError(null)

      const url = editMode 
        ? '/api/specialties'
        : '/api/specialties'
      
      const method = editMode ? 'PUT' : 'POST'
      const body = editMode ? { id: selectedSpecialty?.id, ...data } : data

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save specialty')
      }

      toast({
        title: "Success",
        description: editMode ? 'Specialty updated successfully' : 'Specialty created successfully'
      })
      
      if (editMode && onSpecialtyUpdate) {
        onSpecialtyUpdate(result.data.specialty)
      } else if (!editMode && onSpecialtySelect) {
        onSpecialtySelect(result.data.specialty)
      }

      loadSpecialties()
      setShowForm(false)
      setEditMode(false)
      reset()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save specialty'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error saving specialty:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSpecialtySelect = (specialty: Specialty) => {
    setSelectedSpecialty(specialty)
    if (onSpecialtySelect) {
      onSpecialtySelect(specialty)
    }
  }

  const handleEditSpecialty = (specialty: Specialty) => {
    setSelectedSpecialty(specialty)
    setEditMode(true)
    setShowForm(true)
    setActiveTab('form')
    
    // Populate form with existing data
    setValue('name', specialty.name)
    setValue('description', specialty.description)
    setValue('category', specialty.category)
    setValue('requirements', specialty.requirements || '')
    setValue('color', specialty.color || '#3B82F6')
  }

  const handleDeleteSpecialty = async (specialty: Specialty) => {
    if (!confirm(`Are you sure you want to deactivate "${specialty.name}"?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/specialties?id=${specialty.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete specialty')
      }

      toast({
        title: "Success",
        description: 'Specialty deactivated successfully'
      })
      loadSpecialties()
      
      if (onSpecialtyDelete) {
        onSpecialtyDelete(specialty)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete specialty'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error deleting specialty:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewSpecialty = () => {
    setSelectedSpecialty(null)
    setEditMode(false)
    setShowForm(true)
    setActiveTab('form')
    reset()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const commonCategories = [
    'Speech Therapy',
    'Occupational Therapy',
    'Physical Therapy',
    'Behavioral Therapy',
    'Developmental Therapy',
    'Mental Health',
    'Educational',
    'Medical',
    'Rehabilitation',
    'Assessment'
  ]

  const commonColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Specialty Management
          </CardTitle>
          <CardDescription>
            Manage therapy specialties and categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search specialties..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              
              <Select 
                value={filters.category} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.isActive} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadSpecialties}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={handleNewSpecialty}>
                <Plus className="h-4 w-4 mr-2" />
                New Specialty
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Specialty List</TabsTrigger>
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Specialty List Tab */}
        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading specialties...</span>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialties.map((specialty) => (
                <motion.div
                  key={specialty.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`cursor-pointer transition-all ${
                    selectedSpecialty?.id === specialty.id ? 'ring-2 ring-primary' : ''
                  }`} onClick={() => handleSpecialtySelect(specialty)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: specialty.color || '#3B82F6' }}
                          />
                          <CardTitle className="text-lg">{specialty.name}</CardTitle>
                        </div>
                        <Badge variant={specialty.isActive ? "default" : "secondary"}>
                          {specialty.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <CardDescription>{specialty.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {specialty.description}
                        </p>
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{specialty._count.therapists} therapists</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Created: {formatDate(specialty.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <Badge variant="outline" className="text-xs">
                          {specialty.category}
                        </Badge>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditSpecialty(specialty)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSpecialty(specialty)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Form Tab */}
        <TabsContent value="form" className="space-y-4">
          {showForm ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  {editMode ? 'Edit Specialty' : 'Create New Specialty'}
                </CardTitle>
                <CardDescription>
                  {editMode 
                    ? 'Update specialty information and settings'
                    : 'Create a new therapy specialty with detailed information'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Specialty Name *</Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Enter specialty name"
                        className="mt-1"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select {...register('category')}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Enter detailed description of the specialty"
                      className="mt-1"
                      rows={4}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="requirements">Requirements</Label>
                    <Textarea
                      id="requirements"
                      {...register('requirements')}
                      placeholder="Enter any specific requirements for this specialty"
                      className="mt-1"
                      rows={3}
                    />
                    {errors.requirements && (
                      <p className="text-sm text-red-600 mt-1">{errors.requirements.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="color">Color</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="color"
                        type="color"
                        {...register('color')}
                        className="w-16 h-10"
                      />
                      <div className="flex flex-wrap gap-1">
                        {commonColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: color }}
                            onClick={() => setValue('color', color)}
                          />
                        ))}
                      </div>
                    </div>
                    {errors.color && (
                      <p className="text-sm text-red-600 mt-1">{errors.color.message}</p>
                    )}
                  </div>

                  {/* Error Display */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Form Actions */}
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false)
                        setEditMode(false)
                        setActiveTab('list')
                        reset()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {editMode ? 'Update Specialty' : 'Create Specialty'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Form Selected</h3>
                <p className="text-muted-foreground">
                  Click "New Specialty" to create a new specialty or select a specialty to edit.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {selectedSpecialty ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Specialty Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: selectedSpecialty.color || '#3B82F6' }}
                    />
                    <div>
                      <div className="font-medium">{selectedSpecialty.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedSpecialty.category}</div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm mt-1">{selectedSpecialty.description}</p>
                  </div>
                  
                  {selectedSpecialty.requirements && (
                    <div>
                      <Label className="text-sm font-medium">Requirements</Label>
                      <p className="text-sm mt-1">{selectedSpecialty.requirements}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">
                        <Badge variant={selectedSpecialty.isActive ? "default" : "secondary"}>
                          {selectedSpecialty.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Therapists</Label>
                      <p className="text-sm mt-1">{selectedSpecialty._count.therapists} assigned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm mt-1">{formatDate(selectedSpecialty.createdAt)}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <p className="text-sm mt-1">{formatDate(selectedSpecialty.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Specialty Selected</h3>
                <p className="text-muted-foreground">
                  Select a specialty from the list to view its detailed information.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
