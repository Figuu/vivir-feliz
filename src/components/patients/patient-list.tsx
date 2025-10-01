'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users,
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
  User,
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
import { toast } from '@/hooks/use-toast'

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
  lastSession?: {
    id: string
    scheduledDate: string
    scheduledTime: string
    status: string
    therapist: {
      id: string
      firstName: string
      lastName: string
    }
  }
  totalSessions: number
  recentSessions: Array<{
    id: string
    scheduledDate: string
    scheduledTime: string
    status: string
    therapist: {
      id: string
      firstName: string
      lastName: string
    }
  }>
}

interface PatientListProps {
  therapistId?: string
  onPatientSelect?: (patient: Patient) => void
  onPatientEdit?: (patient: Patient) => void
  onPatientDelete?: (patient: Patient) => void
  onPatientCreate?: () => void
}

export function PatientList({
  therapistId,
  onPatientSelect,
  onPatientEdit,
  onPatientDelete,
  onPatientCreate
}: PatientListProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('lastName')
  const [sortOrder, setSortOrder] = useState<string>('asc')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showPatientDialog, setShowPatientDialog] = useState(false)

  // Load patients
  useEffect(() => {
    loadPatients()
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder, therapistId])

  const loadPatients = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', '20')
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (therapistId) params.append('therapistId', therapistId)
      params.append('sortBy', sortBy)
      params.append('sortOrder', sortOrder)

      const response = await fetch(`/api/patients?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load patients')
      }

      setPatients(result.data.patients)
      setTotalCount(result.data.pagination.totalCount)
      setTotalPages(result.data.pagination.totalPages)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patients'
      setError(errorMessage)
      console.error('Error loading patients:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient)
    setShowPatientDialog(true)
    if (onPatientSelect) {
      onPatientSelect(patient)
    }
  }

  const handlePatientEdit = (patient: Patient) => {
    if (onPatientEdit) {
      onPatientEdit(patient)
    }
  }

  const handlePatientDelete = async (patient: Patient) => {
    if (!confirm(`Are you sure you want to archive ${patient.firstName} ${patient.lastName}?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/patients?patientId=${patient.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to archive patient')
      }

      toast({
        title: "Success",
        description: 'Patient archived successfully'
      })
      loadPatients() // Reload the list
      
      if (onPatientDelete) {
        onPatientDelete(patient)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to archive patient'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error archiving patient:', err)
    } finally {
      setLoading(false)
    }
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

  if (loading && patients.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Loading patients...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Patients</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadPatients}>
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
                Patients ({totalCount})
              </CardTitle>
              <CardDescription>
                Manage your patient list and information
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={loadPatients}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={() => onPatientCreate?.()}>
                <Plus className="h-4 w-4 mr-2" />
                New Patient
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-')
              setSortBy(field)
              setSortOrder(order)
            }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastName-asc">Name (A-Z)</SelectItem>
                <SelectItem value="lastName-desc">Name (Z-A)</SelectItem>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="lastSession-desc">Last Session</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patients Grid */}
      {patients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((patient) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="cursor-pointer"
              onClick={() => handlePatientClick(patient)}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {patient.firstName} {patient.lastName}
                        </CardTitle>
                        <CardDescription>{patient.email}</CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(patient.status)}>
                      {patient.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{patient.phone}</span>
                    </div>
                    {patient.dateOfBirth && (
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Age: {calculateAge(patient.dateOfBirth)} years</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{patient.totalSessions} total sessions</span>
                    </div>
                    {patient.lastSession && (
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Last: {formatDate(patient.lastSession.scheduledDate)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Recent Sessions */}
                  {patient.recentSessions.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Recent Sessions</div>
                      <div className="space-y-1">
                        {patient.recentSessions.slice(0, 2).map((session) => (
                          <div key={session.id} className="flex items-center justify-between text-xs">
                            <span>{formatDate(session.scheduledDate)} {formatTime(session.scheduledTime)}</span>
                            <Badge className={`text-xs ${getSessionStatusColor(session.status)}`}>
                              {session.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-1">
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation()
                        handlePatientEdit(patient)
                      }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation()
                        handlePatientDelete(patient)
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Patients Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter 
                ? 'No patients match your search criteria.' 
                : 'No patients have been added yet.'}
            </p>
            {!searchTerm && !statusFilter && (
              <Button className="mt-4" onClick={() => onPatientCreate?.()}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Patient
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalCount)} of {totalCount} patients
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Details Dialog */}
      <Dialog open={showPatientDialog} onOpenChange={setShowPatientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Patient Details
            </DialogTitle>
            <DialogDescription>
              View and manage patient information
            </DialogDescription>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <div className="text-sm">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedPatient.status)}>
                    {selectedPatient.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="text-sm">{selectedPatient.email}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <div className="text-sm">{selectedPatient.phone}</div>
                </div>
                {selectedPatient.dateOfBirth && (
                  <div>
                    <Label className="text-sm font-medium">Age</Label>
                    <div className="text-sm">{calculateAge(selectedPatient.dateOfBirth)} years</div>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">Total Sessions</Label>
                  <div className="text-sm">{selectedPatient.totalSessions}</div>
                </div>
              </div>

              {/* Contact Info */}
              {selectedPatient.address && (
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <div className="text-sm">{selectedPatient.address}</div>
                </div>
              )}

              {/* Emergency Contact */}
              {selectedPatient.emergencyContact && (
                <div>
                  <Label className="text-sm font-medium">Emergency Contact</Label>
                  <div className="text-sm">
                    {selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.relationship})
                    <br />
                    {selectedPatient.emergencyContact.phone}
                  </div>
                </div>
              )}

              {/* Medical Info */}
              {selectedPatient.medicalInfo && (
                <div>
                  <Label className="text-sm font-medium">Medical Information</Label>
                  <div className="text-sm space-y-1">
                    {selectedPatient.medicalInfo.allergies && (
                      <div><strong>Allergies:</strong> {selectedPatient.medicalInfo.allergies}</div>
                    )}
                    {selectedPatient.medicalInfo.medications && (
                      <div><strong>Medications:</strong> {selectedPatient.medicalInfo.medications}</div>
                    )}
                    {selectedPatient.medicalInfo.medicalConditions && (
                      <div><strong>Conditions:</strong> {selectedPatient.medicalInfo.medicalConditions}</div>
                    )}
                    {selectedPatient.medicalInfo.insuranceProvider && (
                      <div><strong>Insurance:</strong> {selectedPatient.medicalInfo.insuranceProvider}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedPatient.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <div className="text-sm p-3 bg-muted rounded">
                    {selectedPatient.notes}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePatientEdit(selectedPatient)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={() => setShowPatientDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
