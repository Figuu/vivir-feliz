'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users,
  UserPlus,
  UserEdit,
  UserX,
  Search,
  Filter,
  RefreshCw,
  Settings,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Eye,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  Download,
  Upload,
  Lock,
  Unlock,
  Mail,
  Phone,
  Calendar,
  Award,
  BookOpen,
  FileText,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Copy,
  ExternalLink,
  Key,
  UserCheck,
  UserCog,
  Database,
  Server,
  Code,
  Zap,
  Target,
  Activity,
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  Square,
  Clock,
  Globe,
  Building,
  MapPin,
  Star,
  Heart,
  Flame,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  licenseNumber: string
  licenseExpiry: string
  bio?: string
  languages: string[]
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  isVerified: boolean
  specialties: Array<{
    id: string
    name: string
    category: string
    description: string
  }>
  certifications: Array<{
    id: string
    name: string
    organization: string
    expiryDate: string
  }>
  stats: {
    totalSessions: number
    totalPatients: number
  }
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

interface TherapistApiManagementProps {
  onTherapistUpdate?: (therapist: Therapist) => void
  onTherapistDelete?: (therapistId: string) => void
}

export function TherapistApiManagement({
  onTherapistUpdate,
  onTherapistDelete
}: TherapistApiManagementProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)
  const [activeTab, setActiveTab] = useState('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showSpecialtiesForm, setShowSpecialtiesForm] = useState(false)
  const [showCertificationsForm, setShowCertificationsForm] = useState(false)
  
  // Form states
  const [therapistForm, setTherapistForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseExpiry: '',
    bio: '',
    languages: [] as string[],
    status: 'pending' as 'active' | 'inactive' | 'suspended' | 'pending',
    isVerified: false,
    password: ''
  })
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Load therapists
  useEffect(() => {
    loadTherapists()
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder])

  const loadTherapists = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', '10')
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const response = await fetch(`/api/therapist?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load therapists')
      }

      setTherapists(result.data.therapists)
      setTotalPages(result.data.pagination.totalPages)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load therapists'
      setError(errorMessage)
      console.error('Error loading therapists:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTherapist = async () => {
    if (!therapistForm.firstName || !therapistForm.lastName || !therapistForm.email || !therapistForm.password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please fill in all required fields'
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(therapistForm)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create therapist')
      }

      toast({
        title: "Success",
        description: 'Therapist created successfully'
      })
      setShowCreateForm(false)
      setTherapistForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        licenseNumber: '',
        licenseExpiry: '',
        bio: '',
        languages: [],
        status: 'pending',
        isVerified: false,
        password: ''
      })
      loadTherapists()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create therapist'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error creating therapist:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTherapist = async () => {
    if (!selectedTherapist) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist/${selectedTherapist.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(therapistForm)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update therapist')
      }

      toast({
        title: "Success",
        description: 'Therapist updated successfully'
      })
      setShowEditForm(false)
      if (onTherapistUpdate) {
        onTherapistUpdate(result.data)
      }
      loadTherapists()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update therapist'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error updating therapist:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTherapist = async (therapistId: string) => {
    if (!confirm('Are you sure you want to deactivate this therapist?')) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist/${therapistId}`, {
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
      if (onTherapistDelete) {
        onTherapistDelete(therapistId)
      }
      loadTherapists()
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

  const handleChangePassword = async () => {
    if (!selectedTherapist) return

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Passwords do not match'
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/therapist/${selectedTherapist.id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordForm)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password')
      }

      toast({
        title: "Success",
        description: 'Password changed successfully'
      })
      setShowPasswordForm(false)
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error changing password:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading && !therapists.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Loading therapists...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Therapists</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadTherapists}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Therapist API Management
              </CardTitle>
              <CardDescription>
                Comprehensive therapist management with API validation
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadTherapists}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreateForm(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Therapist
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search therapists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="firstName">First Name</SelectItem>
                  <SelectItem value="lastName">Last Name</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="createdAt">Created Date</SelectItem>
                  <SelectItem value="lastLogin">Last Login</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortOrder">Order</Label>
              <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Therapist List</TabsTrigger>
          <TabsTrigger value="details">Therapist Details</TabsTrigger>
          <TabsTrigger value="features">API Features</TabsTrigger>
        </TabsList>

        {/* Therapist List Tab */}
        <TabsContent value="list" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {therapists.map((therapist) => (
              <Card key={therapist.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-blue-100">
                        <UserCog className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {therapist.firstName} {therapist.lastName}
                        </h3>
                        <p className="text-muted-foreground">{therapist.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(therapist.status)}>
                            {therapist.status}
                          </Badge>
                          {therapist.isVerified && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTherapist(therapist)
                          setTherapistForm({
                            firstName: therapist.firstName,
                            lastName: therapist.lastName,
                            email: therapist.email,
                            phone: therapist.phone,
                            licenseNumber: therapist.licenseNumber,
                            licenseExpiry: therapist.licenseExpiry,
                            bio: therapist.bio || '',
                            languages: therapist.languages,
                            status: therapist.status,
                            isVerified: therapist.isVerified,
                            password: ''
                          })
                          setActiveTab('details')
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTherapist(therapist)
                          setTherapistForm({
                            firstName: therapist.firstName,
                            lastName: therapist.lastName,
                            email: therapist.email,
                            phone: therapist.phone,
                            licenseNumber: therapist.licenseNumber,
                            licenseExpiry: therapist.licenseExpiry,
                            bio: therapist.bio || '',
                            languages: therapist.languages,
                            status: therapist.status,
                            isVerified: therapist.isVerified,
                            password: ''
                          })
                          setShowEditForm(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTherapist(therapist.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Deactivate
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">License</div>
                      <div className="text-sm">{therapist.licenseNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Specialties</div>
                      <div className="text-sm">{therapist.specialties.length} specialties</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Stats</div>
                      <div className="text-sm">{therapist.stats.totalSessions} sessions, {therapist.stats.totalPatients} patients</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Therapist Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {selectedTherapist ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCog className="h-5 w-5 mr-2" />
                    Therapist Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <div className="text-sm">{selectedTherapist.firstName} {selectedTherapist.lastName}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <div className="text-sm">{selectedTherapist.email}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <div className="text-sm">{selectedTherapist.phone}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">License Number</Label>
                      <div className="text-sm">{selectedTherapist.licenseNumber}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">License Expiry</Label>
                      <div className="text-sm">{formatDate(selectedTherapist.licenseExpiry)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge className={getStatusColor(selectedTherapist.status)}>
                        {selectedTherapist.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Specialties & Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Specialties</Label>
                      <div className="space-y-1">
                        {selectedTherapist.specialties.map((specialty) => (
                          <Badge key={specialty.id} variant="outline" className="mr-1">
                            {specialty.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Certifications</Label>
                      <div className="space-y-1">
                        {selectedTherapist.certifications.map((cert) => (
                          <div key={cert.id} className="text-sm">
                            {cert.name} - {cert.organization}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <UserCog className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Therapist Selected</h3>
                <p className="text-muted-foreground">
                  Select a therapist from the list to view their details.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* API Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Validation Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Input validation and sanitization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Email format validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Phone number validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>License number validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Password strength validation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  API Operations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>CRUD operations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Bulk operations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Search and filtering</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Pagination support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Sorting capabilities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Security Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Rate limiting</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Password hashing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Duplicate prevention</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Error handling</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Data validation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Therapist Form */}
      {showCreateForm && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader>
            <CardTitle>Create New Therapist</CardTitle>
            <CardDescription>
              Add a new therapist with comprehensive validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={therapistForm.firstName}
                    onChange={(e) => setTherapistForm(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={therapistForm.lastName}
                    onChange={(e) => setTherapistForm(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={therapistForm.email}
                  onChange={(e) => setTherapistForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={therapistForm.password}
                  onChange={(e) => setTherapistForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                />
              </div>
              
              <div className="flex items-center justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTherapist} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Therapist
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Therapist Form */}
      {showEditForm && selectedTherapist && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader>
            <CardTitle>Edit Therapist</CardTitle>
            <CardDescription>
              Update therapist information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={therapistForm.firstName}
                    onChange={(e) => setTherapistForm(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={therapistForm.lastName}
                    onChange={(e) => setTherapistForm(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={therapistForm.email}
                  onChange={(e) => setTherapistForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div className="flex items-center justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowEditForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateTherapist} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Update Therapist
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
