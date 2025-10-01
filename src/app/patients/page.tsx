'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users,
  User,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  Video,
  PhoneCall,
  CalendarIcon,
  ClockIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
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
  Shield,
  BookOpen,
  Settings,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square,
  Timer,
  Info,
  AlertTriangle,
  CheckSquare,
  GripVertical,
  Move,
  Copy,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  PieChart,
  LineChart,
  BarChart
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PatientList } from '@/components/patients/patient-list'
import { PatientDetails } from '@/components/patients/patient-details'
import { usePatients } from '@/hooks/use-patients'

export default function PatientsPage() {
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('')
  const [therapists, setTherapists] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('list')
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list')
  
  const { 
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
  } = usePatients()

  // Load therapists list
  useEffect(() => {
    loadTherapists()
  }, [])

  // Load patients when therapist is selected
  useEffect(() => {
    loadPatients({
      page: 1,
      limit: 20,
      therapistId: selectedTherapistId || undefined
    })
  }, [selectedTherapistId, loadPatients])

  const loadTherapists = async () => {
    try {
      const response = await fetch('/api/therapist/profile?limit=100')
      const result = await response.json()
      if (response.ok) {
        setTherapists(result.data.therapists)
        // Auto-select first therapist if available
        if (result.data.therapists.length > 0) {
          setSelectedTherapistId(result.data.therapists[0].id)
        }
      }
    } catch (err) {
      console.error('Error loading therapists:', err)
    }
  }

  const handlePatientSelect = (patient: any) => {
    setSelectedPatientId(patient.id)
    setViewMode('details')
    setActiveTab('details')
  }

  const handlePatientEdit = (patient: any) => {
    console.log('Edit patient:', patient)
    // Handle patient editing (e.g., open edit modal)
  }

  const handlePatientDelete = (patient: any) => {
    console.log('Delete patient:', patient)
    // Handle patient deletion
  }

  const handlePatientCreate = () => {
    console.log('Create new patient')
    // Handle patient creation (e.g., open create modal)
  }

  const handlePatientUpdate = (patient: any) => {
    console.log('Patient updated:', patient)
    // Refresh the patient list
    loadPatients({
      page: currentPage,
      limit: 20,
      therapistId: selectedTherapistId || undefined
    })
  }

  const handleSessionSelect = (session: any) => {
    console.log('Session selected:', session)
    // Handle session selection (e.g., open session details modal)
  }

  const handleSessionCreate = () => {
    console.log('Create new session')
    // Handle session creation (e.g., open session creation modal)
  }

  const handleBackToList = () => {
    setViewMode('list')
    setActiveTab('list')
    setSelectedPatientId('')
  }

  const getGeneralStatistics = () => {
    const activePatients = getActivePatients(patients)
    const inactivePatients = getInactivePatients(patients)
    const archivedPatients = getArchivedPatients(patients)
    const recentPatients = getRecentPatients(patients, 5)

    return {
      total: patients.length,
      active: activePatients.length,
      inactive: inactivePatients.length,
      archived: archivedPatients.length,
      recent: recentPatients.length
    }
  }

  const stats = getGeneralStatistics()

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Management</h1>
          <p className="text-muted-foreground">
            Comprehensive patient list and detailed information views
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => loadPatients({
            page: currentPage,
            limit: 20,
            therapistId: selectedTherapistId || undefined
          })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Therapist Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Select Therapist
          </CardTitle>
          <CardDescription>
            Choose a therapist to view their patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={selectedTherapistId} onValueChange={setSelectedTherapistId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a therapist" />
              </SelectTrigger>
              <SelectContent>
                {therapists.map((therapist) => (
                  <SelectItem key={therapist.id} value={therapist.id}>
                    {therapist.firstName} {therapist.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="text-sm text-muted-foreground">
              {totalCount} patients found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {patients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                All patients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Active patients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">
                Inactive patients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Archived</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.archived}</div>
              <p className="text-xs text-muted-foreground">
                Archived patients
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent}</div>
              <p className="text-xs text-muted-foreground">
                Recently added
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Patient List</TabsTrigger>
          <TabsTrigger value="details" disabled={!selectedPatientId}>Patient Details</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {viewMode === 'list' ? (
            <PatientList
              therapistId={selectedTherapistId}
              onPatientSelect={handlePatientSelect}
              onPatientEdit={handlePatientEdit}
              onPatientDelete={handlePatientDelete}
              onPatientCreate={handlePatientCreate}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={handleBackToList}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Button>
                <h2 className="text-xl font-semibold">Patient Details</h2>
              </div>
              {selectedPatientId && (
                <PatientDetails
                  patientId={selectedPatientId}
                  onPatientUpdate={handlePatientUpdate}
                  onSessionSelect={handleSessionSelect}
                  onSessionCreate={handleSessionCreate}
                />
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {selectedPatientId ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={handleBackToList}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Button>
                <h2 className="text-xl font-semibold">Patient Details</h2>
              </div>
              <PatientDetails
                patientId={selectedPatientId}
                onPatientUpdate={handlePatientUpdate}
                onSessionSelect={handleSessionSelect}
                onSessionCreate={handleSessionCreate}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Patient Selected</h3>
                <p className="text-muted-foreground">
                  Select a patient from the list to view their details.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Patient List Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Search and filter patients</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Sort by various criteria</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Pagination support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Status management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Patient Details Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Comprehensive patient profile</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Session history tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Medical information management</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Emergency contact details</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analytics Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Patient statistics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Session completion rates</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Revenue tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Performance metrics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Feature Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Patient Management Overview
              </CardTitle>
              <CardDescription>
                Comprehensive patient list and detailed information management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Patient List Components</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Search and filter functionality</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Sortable patient grid</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Pagination and navigation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Status-based filtering</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Quick action buttons</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Patient Details Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Comprehensive patient profile</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Session history and tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Medical information management</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Emergency contact details</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Notes and comments system</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
