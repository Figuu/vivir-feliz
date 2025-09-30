'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  GraduationCap,
  Globe,
  Languages,
  Award,
  Star,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Search,
  Filter,
  Plus,
  X,
  Eye,
  EyeOff,
  Shield,
  Clock,
  MapPin,
  Users,
  Activity,
  TrendingUp,
  BarChart3,
  Settings,
  Download,
  Upload
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'
import { TherapistRegistrationForm } from './therapist-registration-form'

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

interface TherapistProfileManagerProps {
  onTherapistSelect?: (therapist: Therapist) => void
  onTherapistUpdate?: (therapist: Therapist) => void
  onTherapistDelete?: (therapist: Therapist) => void
}

export function TherapistProfileManager({
  onTherapistSelect,
  onTherapistUpdate,
  onTherapistDelete
}: TherapistProfileManagerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)
  const [activeTab, setActiveTab] = useState('list')
  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    specialty: '',
    isActive: '',
    sortBy: 'firstName',
    sortOrder: 'asc'
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  // Load therapists
  useEffect(() => {
    loadTherapists()
  }, [filters, pagination.page, pagination.limit])

  const loadTherapists = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      params.append('sortBy', filters.sortBy)
      params.append('sortOrder', filters.sortOrder)
      if (filters.search) params.append('search', filters.search)
      if (filters.specialty) params.append('specialty', filters.specialty)
      if (filters.isActive) params.append('isActive', filters.isActive)

      const response = await fetch(`/api/therapist/profile?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load therapists')
      }

      setTherapists(result.data.therapists)
      setPagination(prev => ({
        ...prev,
        total: result.data.pagination.total,
        pages: result.data.pagination.pages
      }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load therapists'
      setError(errorMessage)
      console.error('Error loading therapists:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTherapistSelect = (therapist: Therapist) => {
    setSelectedTherapist(therapist)
    if (onTherapistSelect) {
      onTherapistSelect(therapist)
    }
  }

  const handleTherapistUpdate = (updatedTherapist: Therapist) => {
    setTherapists(prev => prev.map(t => 
      t.id === updatedTherapist.id ? updatedTherapist : t
    ))
    setSelectedTherapist(updatedTherapist)
    setShowRegistrationForm(false)
    setEditMode(false)
    
    if (onTherapistUpdate) {
      onTherapistUpdate(updatedTherapist)
    }
  }

  const handleTherapistDelete = async (therapist: Therapist) => {
    if (!confirm(`Are you sure you want to deactivate ${therapist.firstName} ${therapist.lastName}?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist/profile?id=${therapist.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete therapist')
      }

      toast({
        title: "Success",
        description: 'Therapist deactivated successfully'
      })
      loadTherapists()
      
      if (onTherapistDelete) {
        onTherapistDelete(therapist)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete therapist'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error deleting therapist:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditTherapist = (therapist: Therapist) => {
    setSelectedTherapist(therapist)
    setEditMode(true)
    setShowRegistrationForm(true)
    setActiveTab('form')
  }

  const handleNewTherapist = () => {
    setSelectedTherapist(null)
    setEditMode(false)
    setShowRegistrationForm(true)
    setActiveTab('form')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isLicenseExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  const isLicenseExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    return expiry <= thirtyDaysFromNow && expiry > new Date()
  }

  const getLicenseStatus = (expiryDate: string) => {
    if (isLicenseExpired(expiryDate)) {
      return { status: 'expired', color: 'bg-red-100 text-red-800 border-red-200' }
    }
    if (isLicenseExpiringSoon(expiryDate)) {
      return { status: 'expiring', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    }
    return { status: 'valid', color: 'bg-green-100 text-green-800 border-green-200' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Therapist Management
          </CardTitle>
          <CardDescription>
            Manage therapist profiles, credentials, and information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search therapists..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              
              <Select 
                value={filters.specialty} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, specialty: value }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Specialties</SelectItem>
                  <SelectItem value="specialty-1">Speech Therapy</SelectItem>
                  <SelectItem value="specialty-2">Occupational Therapy</SelectItem>
                  <SelectItem value="specialty-3">Physical Therapy</SelectItem>
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
              <Button variant="outline" size="sm" onClick={loadTherapists}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={handleNewTherapist}>
                <Plus className="h-4 w-4 mr-2" />
                New Therapist
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Therapist List</TabsTrigger>
          <TabsTrigger value="form">Registration Form</TabsTrigger>
          <TabsTrigger value="details">Profile Details</TabsTrigger>
        </TabsList>

        {/* Therapist List Tab */}
        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading therapists...</span>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {therapists.map((therapist) => {
                const licenseStatus = getLicenseStatus(therapist.licenseExpiry)
                return (
                  <motion.div
                    key={therapist.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`cursor-pointer transition-all ${
                      selectedTherapist?.id === therapist.id ? 'ring-2 ring-primary' : ''
                    }`} onClick={() => handleTherapistSelect(therapist)}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {therapist.firstName} {therapist.lastName}
                            </CardTitle>
                            <CardDescription>{therapist.email}</CardDescription>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Badge variant={therapist.isActive ? "default" : "secondary"}>
                              {therapist.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge className={licenseStatus.color}>
                              {licenseStatus.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{therapist.phone}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{therapist.licenseNumber}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Expires: {formatDate(therapist.licenseExpiry)}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Award className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{therapist.specialties.length} specialties</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex flex-wrap gap-1">
                            {therapist.specialties.slice(0, 2).map((specialty) => (
                              <Badge key={specialty.id} variant="outline" className="text-xs">
                                {specialty.name}
                              </Badge>
                            ))}
                            {therapist.specialties.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{therapist.specialties.length - 2}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditTherapist(therapist)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTherapistDelete(therapist)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
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

        {/* Registration Form Tab */}
        <TabsContent value="form" className="space-y-4">
          {showRegistrationForm ? (
            <TherapistRegistrationForm
              editMode={editMode}
              therapistId={selectedTherapist?.id}
              initialData={selectedTherapist ? {
                firstName: selectedTherapist.firstName,
                lastName: selectedTherapist.lastName,
                email: selectedTherapist.email,
                phone: selectedTherapist.phone,
                licenseNumber: selectedTherapist.licenseNumber,
                licenseExpiry: selectedTherapist.licenseExpiry,
                specialties: selectedTherapist.specialties.map(s => s.id),
                certifications: selectedTherapist.certifications.map(c => c.id),
                bio: selectedTherapist.bio,
                experience: selectedTherapist.experience,
                education: selectedTherapist.education,
                languages: selectedTherapist.languages,
                timezone: selectedTherapist.timezone
              } : undefined}
              onSuccess={handleTherapistUpdate}
              onCancel={() => {
                setShowRegistrationForm(false)
                setEditMode(false)
                setActiveTab('list')
              }}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Form Selected</h3>
                <p className="text-muted-foreground">
                  Click "New Therapist" to register a new therapist or select a therapist to edit.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Profile Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {selectedTherapist ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">First Name</Label>
                      <p className="text-sm">{selectedTherapist.firstName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Name</Label>
                      <p className="text-sm">{selectedTherapist.lastName}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{selectedTherapist.email}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-sm">{selectedTherapist.phone}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">License Number</Label>
                      <p className="text-sm">{selectedTherapist.licenseNumber}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">License Expiry</Label>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm">{formatDate(selectedTherapist.licenseExpiry)}</p>
                        <Badge className={getLicenseStatus(selectedTherapist.licenseExpiry).color}>
                          {getLicenseStatus(selectedTherapist.licenseExpiry).status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Specialties</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedTherapist.specialties.map((specialty) => (
                        <Badge key={specialty.id} variant="outline">
                          {specialty.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Certifications</Label>
                    <div className="space-y-2 mt-1">
                      {selectedTherapist.certifications.map((certification) => (
                        <div key={certification.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="text-sm font-medium">{certification.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Obtained: {formatDate(certification.obtainedAt)}
                            </p>
                          </div>
                          {certification.expiryDate && (
                            <Badge variant="outline" className="text-xs">
                              Expires: {formatDate(certification.expiryDate)}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {selectedTherapist.experience && (
                    <div>
                      <Label className="text-sm font-medium">Experience</Label>
                      <p className="text-sm">{selectedTherapist.experience} years</p>
                    </div>
                  )}
                  
                  {selectedTherapist.education && (
                    <div>
                      <Label className="text-sm font-medium">Education</Label>
                      <p className="text-sm">{selectedTherapist.education}</p>
                    </div>
                  )}
                  
                  {selectedTherapist.languages && selectedTherapist.languages.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Languages</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTherapist.languages.map((language) => (
                          <Badge key={language} variant="secondary" className="text-xs">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedTherapist.bio && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Bio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedTherapist.bio}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Therapist Selected</h3>
                <p className="text-muted-foreground">
                  Select a therapist from the list to view their detailed profile.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
