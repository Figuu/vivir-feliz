'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Clock, 
  User, 
  Search,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useConsultationRequests, ConsultationRequest, CreateConsultationRequestData } from '@/hooks/use-consultation-requests'

export default function TestConsultationRequestsPage() {
  const [activeTab, setActiveTab] = useState('create')
  const [consultationRequests, setConsultationRequests] = useState<ConsultationRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<ConsultationRequest | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    specialtyId: '',
    consultationType: '',
    urgency: '',
    page: 1,
    limit: 10
  })

  const { 
    createConsultationRequest, 
    getConsultationRequest, 
    updateConsultationRequest, 
    cancelConsultationRequest,
    getConsultationRequests,
    getConsultationRequestStatistics,
    loading, 
    error 
  } = useConsultationRequests()

  const [createForm, setCreateForm] = useState<CreateConsultationRequestData>({
    // Patient information
    patientFirstName: '',
    patientLastName: '',
    patientDateOfBirth: '',
    patientGender: 'MALE',
    
    // Parent/Guardian information
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: '',
    parentRelationship: 'MOTHER',
    
    // Address information
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Consultation details
    consultationType: 'CONSULTATION',
    specialtyId: '',
    consultationReasonId: '',
    urgency: 'MEDIUM',
    
    // Scheduling
    preferredDate: '',
    preferredTime: '',
    duration: 60,
    
    // Additional information
    additionalNotes: '',
    previousTherapy: false,
    previousTherapyDetails: '',
    
    // Insurance information
    hasInsurance: false,
    insuranceProvider: '',
    insurancePolicyNumber: '',
    
    // Emergency contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: ''
  })

  const handleCreateRequest = async () => {
    try {
      const newRequest = await createConsultationRequest(createForm)
      setConsultationRequests(prev => [newRequest, ...prev])
      setActiveTab('list')
      // Reset form
      setCreateForm({
        patientFirstName: '',
        patientLastName: '',
        patientDateOfBirth: '',
        patientGender: 'MALE',
        parentFirstName: '',
        parentLastName: '',
        parentEmail: '',
        parentPhone: '',
        parentRelationship: 'MOTHER',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        consultationType: 'CONSULTATION',
        specialtyId: '',
        consultationReasonId: '',
        urgency: 'MEDIUM',
        preferredDate: '',
        preferredTime: '',
        duration: 60,
        additionalNotes: '',
        previousTherapy: false,
        previousTherapyDetails: '',
        hasInsurance: false,
        insuranceProvider: '',
        insurancePolicyNumber: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: ''
      })
    } catch (err) {
      console.error('Failed to create consultation request:', err)
    }
  }

  const handleFetchRequests = async () => {
    try {
      const result = await getConsultationRequests(filters)
      setConsultationRequests(result.consultationRequests)
    } catch (err) {
      console.error('Failed to fetch consultation requests:', err)
    }
  }

  const handleViewRequest = async (id: string) => {
    try {
      const request = await getConsultationRequest(id)
      setSelectedRequest(request)
      setActiveTab('details')
    } catch (err) {
      console.error('Failed to fetch consultation request:', err)
    }
  }

  const handleUpdateRequest = async (id: string, updates: any) => {
    try {
      const updatedRequest = await updateConsultationRequest(id, updates)
      setConsultationRequests(prev => 
        prev.map(req => req.id === id ? updatedRequest : req)
      )
      if (selectedRequest?.id === id) {
        setSelectedRequest(updatedRequest)
      }
    } catch (err) {
      console.error('Failed to update consultation request:', err)
    }
  }

  const handleCancelRequest = async (id: string) => {
    try {
      const cancelledRequest = await cancelConsultationRequest(id, 'Cancelled by user')
      setConsultationRequests(prev => 
        prev.map(req => req.id === id ? cancelledRequest : req)
      )
      if (selectedRequest?.id === id) {
        setSelectedRequest(cancelledRequest)
      }
    } catch (err) {
      console.error('Failed to cancel consultation request:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: AlertCircle },
      'CONFIRMED': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: CheckCircle },
      'IN_PROGRESS': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: Clock },
      'COMPLETED': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      'CANCELLED': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      'NO_SHOW': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: XCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 3)
    return maxDate.toISOString().split('T')[0]
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Consultation Requests API Test</h1>
          <p className="text-muted-foreground">
            Test the consultation request API endpoints with CRUD operations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">Create Request</TabsTrigger>
            <TabsTrigger value="list">List Requests</TabsTrigger>
            <TabsTrigger value="details">Request Details</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          {/* Create Request Tab */}
          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Consultation Request
                </CardTitle>
                <CardDescription>
                  Create a new consultation request with comprehensive validation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Patient Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Patient Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="patientFirstName">Patient First Name *</Label>
                      <Input
                        id="patientFirstName"
                        value={createForm.patientFirstName}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, patientFirstName: e.target.value }))}
                        placeholder="Enter patient's first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientLastName">Patient Last Name *</Label>
                      <Input
                        id="patientLastName"
                        value={createForm.patientLastName}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, patientLastName: e.target.value }))}
                        placeholder="Enter patient's last name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="patientDateOfBirth">Date of Birth *</Label>
                      <Input
                        id="patientDateOfBirth"
                        type="date"
                        value={createForm.patientDateOfBirth}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, patientDateOfBirth: e.target.value }))}
                        max={getTodayDate()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientGender">Gender *</Label>
                      <Select value={createForm.patientGender} onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, patientGender: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Parent Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Parent/Guardian Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="parentFirstName">Parent First Name *</Label>
                      <Input
                        id="parentFirstName"
                        value={createForm.parentFirstName}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, parentFirstName: e.target.value }))}
                        placeholder="Enter parent's first name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="parentLastName">Parent Last Name *</Label>
                      <Input
                        id="parentLastName"
                        value={createForm.parentLastName}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, parentLastName: e.target.value }))}
                        placeholder="Enter parent's last name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="parentEmail">Email *</Label>
                      <Input
                        id="parentEmail"
                        type="email"
                        value={createForm.parentEmail}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, parentEmail: e.target.value }))}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="parentPhone">Phone *</Label>
                      <Input
                        id="parentPhone"
                        value={createForm.parentPhone}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, parentPhone: e.target.value }))}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Consultation Details */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Consultation Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="consultationType">Consultation Type *</Label>
                      <Select value={createForm.consultationType} onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, consultationType: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONSULTATION">Consultation</SelectItem>
                          <SelectItem value="INTERVIEW">Interview</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="specialtyId">Specialty *</Label>
                      <Select value={createForm.specialtyId} onValueChange={(value) => setCreateForm(prev => ({ ...prev, specialtyId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Psicología Clínica</SelectItem>
                          <SelectItem value="2">Fonoaudiología</SelectItem>
                          <SelectItem value="3">Terapia Ocupacional</SelectItem>
                          <SelectItem value="4">Fisioterapia</SelectItem>
                          <SelectItem value="5">Psicopedagogía</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="urgency">Urgency</Label>
                      <Select value={createForm.urgency} onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, urgency: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Select value={createForm.duration.toString()} onValueChange={(value) => setCreateForm(prev => ({ ...prev, duration: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">60 minutes</SelectItem>
                          <SelectItem value="90">90 minutes</SelectItem>
                          <SelectItem value="120">120 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preferredDate">Preferred Date *</Label>
                      <Input
                        id="preferredDate"
                        type="date"
                        value={createForm.preferredDate}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, preferredDate: e.target.value }))}
                        min={getMinDate()}
                        max={getMaxDate()}
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferredTime">Preferred Time *</Label>
                      <Input
                        id="preferredTime"
                        type="time"
                        value={createForm.preferredTime}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, preferredTime: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                      <Input
                        id="emergencyContactName"
                        value={createForm.emergencyContactName}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                        placeholder="Enter emergency contact name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                      <Input
                        id="emergencyContactPhone"
                        value={createForm.emergencyContactPhone}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleCreateRequest}
                  disabled={loading || !createForm.patientFirstName || !createForm.patientLastName || !createForm.parentEmail}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Request...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Consultation Request
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* List Requests Tab */}
          <TabsContent value="list" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Consultation Requests
                </CardTitle>
                <CardDescription>
                  View and manage consultation requests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="filterStatus">Status</Label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Statuses</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="NO_SHOW">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filterSpecialty">Specialty</Label>
                    <Select value={filters.specialtyId} onValueChange={(value) => setFilters(prev => ({ ...prev, specialtyId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All specialties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Specialties</SelectItem>
                        <SelectItem value="1">Psicología Clínica</SelectItem>
                        <SelectItem value="2">Fonoaudiología</SelectItem>
                        <SelectItem value="3">Terapia Ocupacional</SelectItem>
                        <SelectItem value="4">Fisioterapia</SelectItem>
                        <SelectItem value="5">Psicopedagogía</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filterType">Type</Label>
                    <Select value={filters.consultationType} onValueChange={(value) => setFilters(prev => ({ ...prev, consultationType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        <SelectItem value="CONSULTATION">Consultation</SelectItem>
                        <SelectItem value="INTERVIEW">Interview</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filterUrgency">Urgency</Label>
                    <Select value={filters.urgency} onValueChange={(value) => setFilters(prev => ({ ...prev, urgency: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All urgencies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Urgencies</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleFetchRequests} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Fetch Requests
                    </>
                  )}
                </Button>

                {/* Requests List */}
                <div className="space-y-4">
                  {consultationRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">
                                  {request.patient?.firstName} {request.patient?.lastName}
                                </h4>
                                {getStatusBadge(request.status)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p>Parent: {request.parent?.firstName} {request.parent?.lastName}</p>
                                <p>Type: {request.consultationType} | Specialty: {request.specialty?.name}</p>
                                <p>Preferred: {request.preferredDate} at {request.preferredTime}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewRequest(request.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {request.status === 'PENDING' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateRequest(request.id, { status: 'CONFIRMED' })}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelRequest(request.id)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Request Details Tab */}
          <TabsContent value="details" className="space-y-6">
            {selectedRequest ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Request Details
                  </CardTitle>
                  <CardDescription>
                    Detailed information about the consultation request
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Request ID</Label>
                      <p className="text-sm font-mono">{selectedRequest.id}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Patient</Label>
                      <p className="text-sm">{selectedRequest.patient?.firstName} {selectedRequest.patient?.lastName}</p>
                    </div>
                    <div>
                      <Label>Parent/Guardian</Label>
                      <p className="text-sm">{selectedRequest.parent?.firstName} {selectedRequest.parent?.lastName}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Consultation Type</Label>
                      <p className="text-sm">{selectedRequest.consultationType}</p>
                    </div>
                    <div>
                      <Label>Specialty</Label>
                      <p className="text-sm">{selectedRequest.specialty?.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Preferred Date</Label>
                      <p className="text-sm">{selectedRequest.preferredDate}</p>
                    </div>
                    <div>
                      <Label>Preferred Time</Label>
                      <p className="text-sm">{selectedRequest.preferredTime}</p>
                    </div>
                  </div>
                  {selectedRequest.scheduledDate && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Scheduled Date</Label>
                        <p className="text-sm">{selectedRequest.scheduledDate}</p>
                      </div>
                      <div>
                        <Label>Scheduled Time</Label>
                        <p className="text-sm">{selectedRequest.scheduledTime}</p>
                      </div>
                    </div>
                  )}
                  {selectedRequest.therapist && (
                    <div>
                      <Label>Assigned Therapist</Label>
                      <p className="text-sm">
                        {selectedRequest.therapist.user?.name || 
                         `${selectedRequest.therapist.firstName} ${selectedRequest.therapist.lastName}`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Request Selected</h3>
                  <p className="text-muted-foreground">
                    Select a request from the list to view its details
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Request Statistics
                </CardTitle>
                <CardDescription>
                  View statistics and analytics for consultation requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Statistics Feature</h3>
                  <p className="text-muted-foreground">
                    Statistics functionality would be implemented here with date range selection and various analytics
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}


