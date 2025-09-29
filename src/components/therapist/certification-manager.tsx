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
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  GraduationCap,
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
  Upload,
  Globe,
  Building,
  Clock,
  Award,
  Shield
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// Validation schema
const certificationSchema = z.object({
  name: z.string()
    .min(2, 'Certification name must be at least 2 characters')
    .max(100, 'Certification name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-&()]+$/, 'Certification name can only contain letters, numbers, spaces, hyphens, ampersands, and parentheses'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  issuingOrganization: z.string()
    .min(2, 'Issuing organization must be at least 2 characters')
    .max(100, 'Issuing organization must be less than 100 characters'),
  category: z.string()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must be less than 50 characters'),
  expiryRequired: z.boolean().default(false),
  validityPeriod: z.number()
    .min(1, 'Validity period must be at least 1 year')
    .max(10, 'Validity period cannot exceed 10 years')
    .optional(),
  requirements: z.string()
    .max(1000, 'Requirements must be less than 1000 characters')
    .optional(),
  website: z.string()
    .url('Website must be a valid URL')
    .optional()
    .or(z.literal('')),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color code')
    .optional()
})

type CertificationFormData = z.infer<typeof certificationSchema>

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

interface CertificationManagerProps {
  onCertificationSelect?: (certification: Certification) => void
  onCertificationUpdate?: (certification: Certification) => void
  onCertificationDelete?: (certification: Certification) => void
}

export function CertificationManager({
  onCertificationSelect,
  onCertificationUpdate,
  onCertificationDelete
}: CertificationManagerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null)
  const [activeTab, setActiveTab] = useState('list')
  const [showForm, setShowForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    issuingOrganization: '',
    expiryRequired: '',
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
  const [organizations, setOrganizations] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CertificationFormData>({
    resolver: zodResolver(certificationSchema),
    defaultValues: {
      expiryRequired: false,
      color: '#8B5CF6'
    }
  })

  const expiryRequired = watch('expiryRequired')

  // Load certifications
  useEffect(() => {
    loadCertifications()
  }, [filters, pagination.page, pagination.limit])

  const loadCertifications = async () => {
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
      if (filters.issuingOrganization) params.append('issuingOrganization', filters.issuingOrganization)
      if (filters.expiryRequired) params.append('expiryRequired', filters.expiryRequired)
      if (filters.isActive) params.append('isActive', filters.isActive)

      const response = await fetch(`/api/certifications?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load certifications')
      }

      setCertifications(result.data.certifications)
      setCategories(result.data.categories)
      setOrganizations(result.data.organizations)
      setPagination(prev => ({
        ...prev,
        total: result.data.pagination.total,
        pages: result.data.pagination.pages
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load certifications'
      setError(errorMessage)
      console.error('Error loading certifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CertificationFormData) => {
    try {
      setLoading(true)
      setError(null)

      const url = editMode 
        ? '/api/certifications'
        : '/api/certifications'
      
      const method = editMode ? 'PUT' : 'POST'
      const body = editMode ? { id: selectedCertification?.id, ...data } : data

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save certification')
      }

      toast.success(editMode ? 'Certification updated successfully' : 'Certification created successfully')
      
      if (editMode && onCertificationUpdate) {
        onCertificationUpdate(result.data.certification)
      } else if (!editMode && onCertificationSelect) {
        onCertificationSelect(result.data.certification)
      }

      loadCertifications()
      setShowForm(false)
      setEditMode(false)
      reset()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save certification'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error saving certification:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCertificationSelect = (certification: Certification) => {
    setSelectedCertification(certification)
    if (onCertificationSelect) {
      onCertificationSelect(certification)
    }
  }

  const handleEditCertification = (certification: Certification) => {
    setSelectedCertification(certification)
    setEditMode(true)
    setShowForm(true)
    setActiveTab('form')
    
    // Populate form with existing data
    setValue('name', certification.name)
    setValue('description', certification.description)
    setValue('issuingOrganization', certification.issuingOrganization)
    setValue('category', certification.category)
    setValue('expiryRequired', certification.expiryRequired)
    setValue('validityPeriod', certification.validityPeriod || undefined)
    setValue('requirements', certification.requirements || '')
    setValue('website', certification.website || '')
    setValue('color', certification.color || '#8B5CF6')
  }

  const handleDeleteCertification = async (certification: Certification) => {
    if (!confirm(`Are you sure you want to deactivate "${certification.name}"?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/certifications?id=${certification.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete certification')
      }

      toast.success('Certification deactivated successfully')
      loadCertifications()
      
      if (onCertificationDelete) {
        onCertificationDelete(certification)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete certification'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error deleting certification:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewCertification = () => {
    setSelectedCertification(null)
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
    'Professional Certification',
    'Continuing Education',
    'Specialized Training',
    'Licensing',
    'Assessment',
    'Treatment',
    'Research',
    'Administrative',
    'Technology',
    'Safety'
  ]

  const commonOrganizations = [
    'American Speech-Language-Hearing Association',
    'American Occupational Therapy Association',
    'American Physical Therapy Association',
    'Behavior Analyst Certification Board',
    'National Board for Certified Counselors',
    'American Psychological Association',
    'Centers for Disease Control and Prevention',
    'World Health Organization',
    'State Licensing Board',
    'Professional Development Institute'
  ]

  const commonColors = [
    '#8B5CF6', '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            Certification Management
          </CardTitle>
          <CardDescription>
            Manage therapy certifications and credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search certifications..."
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
                value={filters.issuingOrganization} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, issuingOrganization: value }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Organizations</SelectItem>
                  {organizations.map((organization) => (
                    <SelectItem key={organization} value={organization}>
                      {organization}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.expiryRequired} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, expiryRequired: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Expiry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="true">Expires</SelectItem>
                  <SelectItem value="false">No Expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadCertifications}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={handleNewCertification}>
                <Plus className="h-4 w-4 mr-2" />
                New Certification
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Certification List</TabsTrigger>
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Certification List Tab */}
        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading certifications...</span>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certifications.map((certification) => (
                <motion.div
                  key={certification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`cursor-pointer transition-all ${
                    selectedCertification?.id === certification.id ? 'ring-2 ring-primary' : ''
                  }`} onClick={() => handleCertificationSelect(certification)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: certification.color || '#8B5CF6' }}
                          />
                          <CardTitle className="text-lg">{certification.name}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Badge variant={certification.isActive ? "default" : "secondary"}>
                            {certification.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {certification.expiryRequired && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Expires
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription>{certification.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="truncate">{certification.issuingOrganization}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {certification.description}
                        </p>
                        {certification.expiryRequired && certification.validityPeriod && (
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Valid for {certification.validityPeriod} years</span>
                          </div>
                        )}
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{certification._count.therapists} therapists</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Created: {formatDate(certification.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            {certification.category}
                          </Badge>
                          {certification.website && (
                            <Badge variant="outline" className="text-xs">
                              <Globe className="h-3 w-3 mr-1" />
                              Website
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCertification(certification)
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCertification(certification)
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
                  <GraduationCap className="h-5 w-5 mr-2" />
                  {editMode ? 'Edit Certification' : 'Create New Certification'}
                </CardTitle>
                <CardDescription>
                  {editMode 
                    ? 'Update certification information and settings'
                    : 'Create a new therapy certification with detailed information'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name">Certification Name *</Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Enter certification name"
                        className="mt-1"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="issuingOrganization">Issuing Organization *</Label>
                      <Select {...register('issuingOrganization')}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {commonOrganizations.map((organization) => (
                            <SelectItem key={organization} value={organization}>
                              {organization}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.issuingOrganization && (
                        <p className="text-sm text-red-600 mt-1">{errors.issuingOrganization.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        {...register('website')}
                        placeholder="https://example.com"
                        className="mt-1"
                      />
                      {errors.website && (
                        <p className="text-sm text-red-600 mt-1">{errors.website.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Enter detailed description of the certification"
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
                      placeholder="Enter any specific requirements for this certification"
                      className="mt-1"
                      rows={3}
                    />
                    {errors.requirements && (
                      <p className="text-sm text-red-600 mt-1">{errors.requirements.message}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="expiryRequired"
                        {...register('expiryRequired')}
                      />
                      <Label htmlFor="expiryRequired">This certification expires</Label>
                    </div>

                    {expiryRequired && (
                      <div>
                        <Label htmlFor="validityPeriod">Validity Period (years)</Label>
                        <Input
                          id="validityPeriod"
                          type="number"
                          min="1"
                          max="10"
                          {...register('validityPeriod', { valueAsNumber: true })}
                          placeholder="Enter validity period in years"
                          className="mt-1"
                        />
                        {errors.validityPeriod && (
                          <p className="text-sm text-red-600 mt-1">{errors.validityPeriod.message}</p>
                        )}
                      </div>
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
                      {editMode ? 'Update Certification' : 'Create Certification'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Form Selected</h3>
                <p className="text-muted-foreground">
                  Click "New Certification" to create a new certification or select a certification to edit.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {selectedCertification ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Certification Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: selectedCertification.color || '#8B5CF6' }}
                    />
                    <div>
                      <div className="font-medium">{selectedCertification.name}</div>
                      <div className="text-sm text-muted-foreground">{selectedCertification.category}</div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Issuing Organization</Label>
                    <p className="text-sm mt-1">{selectedCertification.issuingOrganization}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm mt-1">{selectedCertification.description}</p>
                  </div>
                  
                  {selectedCertification.requirements && (
                    <div>
                      <Label className="text-sm font-medium">Requirements</Label>
                      <p className="text-sm mt-1">{selectedCertification.requirements}</p>
                    </div>
                  )}
                  
                  {selectedCertification.website && (
                    <div>
                      <Label className="text-sm font-medium">Website</Label>
                      <a 
                        href={selectedCertification.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline mt-1 block"
                      >
                        {selectedCertification.website}
                      </a>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <div className="mt-1">
                        <Badge variant={selectedCertification.isActive ? "default" : "secondary"}>
                          {selectedCertification.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Therapists</Label>
                      <p className="text-sm mt-1">{selectedCertification._count.therapists} assigned</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Expiry Required</Label>
                      <div className="mt-1">
                        <Badge variant={selectedCertification.expiryRequired ? "default" : "outline"}>
                          {selectedCertification.expiryRequired ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                    {selectedCertification.expiryRequired && selectedCertification.validityPeriod && (
                      <div>
                        <Label className="text-sm font-medium">Validity Period</Label>
                        <p className="text-sm mt-1">{selectedCertification.validityPeriod} years</p>
                      </div>
                    )}
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
                    <p className="text-sm mt-1">{formatDate(selectedCertification.createdAt)}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <p className="text-sm mt-1">{formatDate(selectedCertification.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Certification Selected</h3>
                <p className="text-muted-foreground">
                  Select a certification from the list to view its detailed information.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
