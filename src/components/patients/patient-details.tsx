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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Eye,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Stop,
  Timer,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Star,
  Heart,
  Zap,
  Bell,
  Globe,
  Building,
  Shield,
  BookOpen,
  Settings,
  Info,
  AlertTriangle,
  CheckSquare,
  Square,
  GripVertical,
  Move,
  Copy,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

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

interface PatientDetailsProps {
  patientId: string
  onPatientUpdate?: (patient: Patient) => void
  onSessionSelect?: (session: Session) => void
  onSessionCreate?: () => void
}

export function PatientDetails({
  patientId,
  onPatientUpdate,
  onSessionSelect,
  onSessionCreate
}: PatientDetailsProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [statistics, setStatistics] = useState<PatientStatistics | null>(null)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([])
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Patient>>({})

  // Load patient details
  useEffect(() => {
    if (patientId) {
      loadPatientDetails()
    }
  }, [patientId])

  const loadPatientDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/patients/${patientId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load patient details')
      }

      setPatient(result.data.patient)
      setStatistics(result.data.statistics)
      setRecentSessions(result.data.recentSessions)
      setUpcomingSessions(result.data.upcomingSessions)
      setTherapists(result.data.therapists)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patient details'
      setError(errorMessage)
      console.error('Error loading patient details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setEditing(true)
    setEditData(patient || {})
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update patient')
      }

      setPatient(result.data.patient)
      setEditing(false)
      setEditData({})
      toast.success('Patient updated successfully')
      
      if (onPatientUpdate) {
        onPatientUpdate(result.data.patient)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update patient'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error updating patient:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setEditData({})
  }

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusColor = (status: string) => {
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
  }

  const getSessionStatusColor = (status: string) => {
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
  }

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  if (loading && !patient) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Loading patient details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Patient</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadPatientDetails}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Patient Not Found</h3>
        <p className="text-muted-foreground">
          The requested patient could not be found.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {patient.firstName} {patient.lastName}
                </CardTitle>
                <CardDescription className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {patient.email}
                  </span>
                  <span className="flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {patient.phone}
                  </span>
                  {patient.dateOfBirth && (
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Age: {calculateAge(patient.dateOfBirth)} years
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(patient.status)}>
                {patient.status}
              </Badge>
              {editing ? (
                <div className="flex items-center space-x-2">
                  <Button size="sm" onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.completedSessions}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.completionRate}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.upcomingSessions}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${statistics.totalRevenue}</div>
              <p className="text-xs text-muted-foreground">
                From completed sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Session success rate
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={editData.firstName || ''}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={editData.lastName || ''}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={editData.dateOfBirth || ''}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select
                          value={editData.gender || ''}
                          onValueChange={(value) => handleInputChange('gender', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={editData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={editData.status || patient.status}
                        onValueChange={(value) => handleInputChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">First Name</Label>
                        <div className="text-sm">{patient.firstName}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Last Name</Label>
                        <div className="text-sm">{patient.lastName}</div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <div className="text-sm">{patient.email}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <div className="text-sm">{patient.phone}</div>
                    </div>
                    {patient.dateOfBirth && (
                      <div>
                        <Label className="text-sm font-medium">Date of Birth</Label>
                        <div className="text-sm">{formatDate(patient.dateOfBirth)}</div>
                      </div>
                    )}
                    {patient.gender && (
                      <div>
                        <Label className="text-sm font-medium">Gender</Label>
                        <div className="text-sm capitalize">{patient.gender}</div>
                      </div>
                    )}
                    {patient.address && (
                      <div>
                        <Label className="text-sm font-medium">Address</Label>
                        <div className="text-sm">{patient.address}</div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.emergencyContact ? (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <div className="text-sm">{patient.emergencyContact.name}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone</Label>
                      <div className="text-sm">{patient.emergencyContact.phone}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Relationship</Label>
                      <div className="text-sm">{patient.emergencyContact.relationship}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Emergency Contact</h3>
                    <p className="text-muted-foreground">
                      No emergency contact information has been provided.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Sessions
                </CardTitle>
                <CardDescription>
                  Last 10 therapy sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentSessions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => onSessionSelect?.(session)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${getSessionStatusColor(session.status)}`}>
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {formatDate(session.scheduledDate)} {formatTime(session.scheduledTime)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {session.therapist.firstName} {session.therapist.lastName} • {session.duration}min
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getSessionStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            ${session.revenue}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Recent Sessions</h3>
                    <p className="text-muted-foreground">
                      No therapy sessions have been completed yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription>
                  Scheduled therapy sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        onClick={() => onSessionSelect?.(session)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-blue-100">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {formatDate(session.scheduledDate)} {formatTime(session.scheduledTime)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {session.therapist.firstName} {session.therapist.lastName} • {session.duration}min
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-blue-100 text-blue-800">
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Upcoming Sessions</h3>
                    <p className="text-muted-foreground">
                      No therapy sessions are currently scheduled.
                    </p>
                    <Button className="mt-4" onClick={() => onSessionCreate?.()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Session
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Medical Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient.medicalInfo ? (
                <div className="space-y-4">
                  {patient.medicalInfo.allergies && (
                    <div>
                      <Label className="text-sm font-medium">Allergies</Label>
                      <div className="text-sm p-3 bg-muted rounded">
                        {patient.medicalInfo.allergies}
                      </div>
                    </div>
                  )}
                  {patient.medicalInfo.medications && (
                    <div>
                      <Label className="text-sm font-medium">Current Medications</Label>
                      <div className="text-sm p-3 bg-muted rounded">
                        {patient.medicalInfo.medications}
                      </div>
                    </div>
                  )}
                  {patient.medicalInfo.medicalConditions && (
                    <div>
                      <Label className="text-sm font-medium">Medical Conditions</Label>
                      <div className="text-sm p-3 bg-muted rounded">
                        {patient.medicalInfo.medicalConditions}
                      </div>
                    </div>
                  )}
                  {patient.medicalInfo.insuranceProvider && (
                    <div>
                      <Label className="text-sm font-medium">Insurance Provider</Label>
                      <div className="text-sm">{patient.medicalInfo.insuranceProvider}</div>
                    </div>
                  )}
                  {patient.medicalInfo.insuranceNumber && (
                    <div>
                      <Label className="text-sm font-medium">Insurance Number</Label>
                      <div className="text-sm">{patient.medicalInfo.insuranceNumber}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Medical Information</h3>
                  <p className="text-muted-foreground">
                    No medical information has been provided for this patient.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Patient Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Add notes about this patient..."
                    rows={6}
                  />
                </div>
              ) : (
                <div>
                  {patient.notes ? (
                    <div className="text-sm p-4 bg-muted rounded">
                      {patient.notes}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Notes</h3>
                      <p className="text-muted-foreground">
                        No notes have been added for this patient.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
