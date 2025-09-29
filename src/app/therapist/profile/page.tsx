'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Upload,
  Bell,
  Heart,
  Zap,
  Target
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TherapistProfileManager } from '@/components/therapist/therapist-profile-manager'
import { useTherapistProfile } from '@/hooks/use-therapist-profile'

export default function TherapistProfilePage() {
  const [activeTab, setActiveTab] = useState('manager')
  const [selectedTherapist, setSelectedTherapist] = useState<any>(null)
  
  const { 
    loading, 
    error, 
    therapists,
    getTherapists,
    clearError 
  } = useTherapistProfile()

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      await getTherapists({
        page: 1,
        limit: 10,
        sortBy: 'firstName',
        sortOrder: 'asc'
      })
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const handleTherapistSelect = (therapist: any) => {
    console.log('Therapist selected:', therapist)
    setSelectedTherapist(therapist)
  }

  const handleTherapistUpdate = (therapist: any) => {
    console.log('Therapist updated:', therapist)
    setSelectedTherapist(therapist)
  }

  const handleTherapistDelete = (therapist: any) => {
    console.log('Therapist deleted:', therapist)
    if (selectedTherapist?.id === therapist.id) {
      setSelectedTherapist(null)
    }
  }

  const getLicenseStatusColor = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)
    
    if (expiry < now) {
      return 'bg-red-100 text-red-800 border-red-200'
    } else if (expiry <= thirtyDaysFromNow) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    } else {
      return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  const getLicenseStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)
    
    if (expiry < now) {
      return 'Expired'
    } else if (expiry <= thirtyDaysFromNow) {
      return 'Expiring Soon'
    } else {
      return 'Valid'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Therapist Management</h1>
          <p className="text-muted-foreground">
            Register and manage therapist profiles with comprehensive validation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadInitialData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {therapists.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Therapists</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{therapists.length}</div>
              <p className="text-xs text-muted-foreground">
                Registered therapists
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Therapists</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {therapists.filter(t => t.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Licenses</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {therapists.filter(t => new Date(t.licenseExpiry) < new Date()).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Need renewal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {therapists.filter(t => {
                  const expiry = new Date(t.licenseExpiry)
                  const thirtyDaysFromNow = new Date()
                  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
                  return expiry <= thirtyDaysFromNow && expiry > new Date()
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Next 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manager">Profile Manager</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="manager" className="space-y-4">
          <TherapistProfileManager
            onTherapistSelect={handleTherapistSelect}
            onTherapistUpdate={handleTherapistUpdate}
            onTherapistDelete={handleTherapistDelete}
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {therapists.map((therapist) => (
              <motion.div
                key={therapist.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`cursor-pointer transition-all ${
                  selectedTherapist?.id === therapist.id ? 'ring-2 ring-primary' : ''
                }`} onClick={() => setSelectedTherapist(therapist)}>
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
                        <Badge className={getLicenseStatusColor(therapist.licenseExpiry)}>
                          {getLicenseStatus(therapist.licenseExpiry)}
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
                    
                    <div className="flex flex-wrap gap-1 mt-3">
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
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Validation Features
                </CardTitle>
                <CardDescription>
                  Comprehensive validation for therapist registration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Name Capitalization</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically capitalizes first and last names properly
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Email Format Validation</div>
                      <div className="text-sm text-muted-foreground">
                        Validates email format and checks for duplicates
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Phone Number Validation</div>
                      <div className="text-sm text-muted-foreground">
                        Validates phone number format and length
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">License Number Validation</div>
                      <div className="text-sm text-muted-foreground">
                        Validates license format and checks for duplicates
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">License Expiry Tracking</div>
                      <div className="text-sm text-muted-foreground">
                        Tracks license expiry dates and alerts for renewals
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Profile Management
                </CardTitle>
                <CardDescription>
                  Complete profile management capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Multi-step Registration</div>
                      <div className="text-sm text-muted-foreground">
                        3-step registration process for better UX
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Specialty Management</div>
                      <div className="text-sm text-muted-foreground">
                        Select and manage therapist specialties
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Certification Tracking</div>
                      <div className="text-sm text-muted-foreground">
                        Track certifications and expiry dates
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Language Support</div>
                      <div className="text-sm text-muted-foreground">
                        Select multiple languages spoken
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Profile Editing</div>
                      <div className="text-sm text-muted-foreground">
                        Full profile editing with validation
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Registration Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Multi-step registration form</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Real-time validation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Name capitalization</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Phone number formatting</span>
              </li>
            </ul>
          </CardContent>
        </Card>

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
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Email format validation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>License number validation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Duplicate checking</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Expiry date tracking</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Management Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Profile editing</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Search and filtering</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>License status tracking</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Soft delete functionality</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
