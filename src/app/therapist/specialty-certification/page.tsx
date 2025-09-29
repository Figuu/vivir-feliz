'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Award,
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
  Bell,
  Globe,
  Building,
  Clock,
  Shield,
  BookOpen,
  TrendingUp,
  PieChart
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SpecialtyManager } from '@/components/therapist/specialty-manager'
import { CertificationManager } from '@/components/therapist/certification-manager'
import { useSpecialtyCertification } from '@/hooks/use-specialty-certification'

export default function SpecialtyCertificationPage() {
  const [activeTab, setActiveTab] = useState('specialties')
  const [selectedSpecialty, setSelectedSpecialty] = useState<any>(null)
  const [selectedCertification, setSelectedCertification] = useState<any>(null)
  
  const { 
    loading, 
    error, 
    specialties,
    certifications,
    specialtyCategories,
    certificationCategories,
    getSpecialties,
    getCertifications,
    clearError 
  } = useSpecialtyCertification()

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      await Promise.all([
        getSpecialties({
          page: 1,
          limit: 10,
          sortBy: 'name',
          sortOrder: 'asc'
        }),
        getCertifications({
          page: 1,
          limit: 10,
          sortBy: 'name',
          sortOrder: 'asc'
        })
      ])
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const handleSpecialtySelect = (specialty: any) => {
    console.log('Specialty selected:', specialty)
    setSelectedSpecialty(specialty)
  }

  const handleSpecialtyUpdate = (specialty: any) => {
    console.log('Specialty updated:', specialty)
    setSelectedSpecialty(specialty)
  }

  const handleSpecialtyDelete = (specialty: any) => {
    console.log('Specialty deleted:', specialty)
    if (selectedSpecialty?.id === specialty.id) {
      setSelectedSpecialty(null)
    }
  }

  const handleCertificationSelect = (certification: any) => {
    console.log('Certification selected:', certification)
    setSelectedCertification(certification)
  }

  const handleCertificationUpdate = (certification: any) => {
    console.log('Certification updated:', certification)
    setSelectedCertification(certification)
  }

  const handleCertificationDelete = (certification: any) => {
    console.log('Certification deleted:', certification)
    if (selectedCertification?.id === certification.id) {
      setSelectedCertification(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getActiveSpecialties = () => {
    return specialties.filter(s => s.isActive)
  }

  const getActiveCertifications = () => {
    return certifications.filter(c => c.isActive)
  }

  const getExpiringCertifications = () => {
    return certifications.filter(c => c.expiryRequired)
  }

  const getTotalTherapistAssignments = () => {
    const specialtyAssignments = specialties.reduce((sum, s) => sum + s._count.therapists, 0)
    const certificationAssignments = certifications.reduce((sum, c) => sum + c._count.therapists, 0)
    return specialtyAssignments + certificationAssignments
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Specialty & Certification Management</h1>
          <p className="text-muted-foreground">
            Manage therapy specialties and certifications with comprehensive validation
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Specialties</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{specialties.length}</div>
            <p className="text-xs text-muted-foreground">
              {getActiveSpecialties().length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Certifications</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{certifications.length}</div>
            <p className="text-xs text-muted-foreground">
              {getActiveCertifications().length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Certifications</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {getExpiringCertifications().length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require renewal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {getTotalTherapistAssignments()}
            </div>
            <p className="text-xs text-muted-foreground">
              Therapist assignments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="specialties">Specialties</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="specialties" className="space-y-4">
          <SpecialtyManager
            onSpecialtySelect={handleSpecialtySelect}
            onSpecialtyUpdate={handleSpecialtyUpdate}
            onSpecialtyDelete={handleSpecialtyDelete}
          />
        </TabsContent>

        <TabsContent value="certifications" className="space-y-4">
          <CertificationManager
            onCertificationSelect={handleCertificationSelect}
            onCertificationUpdate={handleCertificationUpdate}
            onCertificationDelete={handleCertificationDelete}
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Specialties Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Specialties Overview
                </CardTitle>
                <CardDescription>
                  Current therapy specialties and their usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {specialtyCategories.slice(0, 5).map((category) => {
                    const categorySpecialties = specialties.filter(s => s.category === category)
                    const totalAssignments = categorySpecialties.reduce((sum, s) => sum + s._count.therapists, 0)
                    
                    return (
                      <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{category}</div>
                          <div className="text-sm text-muted-foreground">
                            {categorySpecialties.length} specialties
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{totalAssignments}</div>
                          <div className="text-sm text-muted-foreground">assignments</div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {specialtyCategories.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground">
                      +{specialtyCategories.length - 5} more categories
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Certifications Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Certifications Overview
                </CardTitle>
                <CardDescription>
                  Current certifications and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {certificationCategories.slice(0, 5).map((category) => {
                    const categoryCertifications = certifications.filter(c => c.category === category)
                    const totalAssignments = categoryCertifications.reduce((sum, c) => sum + c._count.therapists, 0)
                    const expiringCount = categoryCertifications.filter(c => c.expiryRequired).length
                    
                    return (
                      <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{category}</div>
                          <div className="text-sm text-muted-foreground">
                            {categoryCertifications.length} certifications
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{totalAssignments}</div>
                          <div className="text-sm text-muted-foreground">
                            {expiringCount > 0 && (
                              <span className="text-yellow-600">{expiringCount} expire</span>
                            )}
                            {expiringCount === 0 && 'assignments'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {certificationCategories.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground">
                      +{certificationCategories.length - 5} more categories
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest specialty and certification updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...specialties, ...certifications]
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 10)
                  .map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        'issuingOrganization' in item ? 'bg-purple-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {'issuingOrganization' in item ? 'Certification' : 'Specialty'} • 
                          Updated {formatDate(item.updatedAt)}
                        </div>
                      </div>
                      <Badge variant={item.isActive ? "default" : "secondary"}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Specialty Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Category-based organization</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Color-coded identification</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Requirements documentation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Therapist assignment tracking</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-2" />
              Certification Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Expiry date tracking</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Issuing organization management</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Website links and resources</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Validity period configuration</span>
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
                <span>Name format validation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Duplicate prevention</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>URL validation</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Required field validation</span>
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
