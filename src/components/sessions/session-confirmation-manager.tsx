'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  Send,
  RefreshCw,
  AlertTriangle,
  Calendar,
  User,
  Phone,
  Edit,
  X,
  Eye,
  Filter,
  Search,
  Download,
  Bell,
  BellOff,
  Settings,
  BarChart3,
  Users,
  Timer,
  CheckSquare,
  Square,
  AlertCircle,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface Session {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: string
  patient: {
    id: string
    firstName: string
    lastName: string
    parent: {
      id: string
      firstName: string
      lastName: string
      email: string
      phone: string
    }
  }
  therapist: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  serviceAssignment: {
    service: {
      id: string
      name: string
      type: string
    }
  }
}

interface ConfirmationStats {
  total: number
  confirmed: number
  pending: number
  cancelled: number
  noShow: number
}

interface SessionConfirmationManagerProps {
  therapistId?: string
  patientId?: string
  onConfirmationSent?: (result: any) => void
  onSessionConfirmed?: (result: any) => void
}

export function SessionConfirmationManager({
  therapistId,
  patientId,
  onConfirmationSent,
  onSessionConfirmed
}: SessionConfirmationManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [stats, setStats] = useState<ConfirmationStats>({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
    noShow: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  })

  // Form state for sending confirmations
  const [confirmationForm, setConfirmationForm] = useState({
    confirmationType: 'EMAIL' as 'EMAIL' | 'SMS' | 'BOTH',
    reminderHours: [24, 2],
    customMessage: ''
  })

  // Load sessions and confirmation data
  useEffect(() => {
    loadConfirmationData()
  }, [therapistId, patientId, filters])

  const loadConfirmationData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (therapistId) params.append('therapistId', therapistId)
      if (patientId) params.append('patientId', patientId)
      if (filters.status) params.append('status', filters.status)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      const response = await fetch(`/api/sessions/confirmation?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load confirmation data')
      }

      setSessions(result.data.sessions)
      setStats(result.data.stats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load confirmation data'
      setError(errorMessage)
      console.error('Error loading confirmation data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendConfirmation = async (sessionId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/confirmation?action=send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          ...confirmationForm
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send confirmation')
      }

      toast.success('Confirmation sent successfully')
      
      if (onConfirmationSent) {
        onConfirmationSent(result.data)
      }

      // Reload data to reflect changes
      loadConfirmationData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send confirmation'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error sending confirmation:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkSendConfirmation = async () => {
    if (selectedSessions.length === 0) {
      toast.error('Please select sessions to send confirmations')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const promises = selectedSessions.map(sessionId => 
        fetch('/api/sessions/confirmation?action=send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            ...confirmationForm
          })
        })
      )

      const results = await Promise.allSettled(promises)
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length

      if (successful > 0) {
        toast.success(`${successful} confirmations sent successfully`)
      }
      if (failed > 0) {
        toast.error(`${failed} confirmations failed to send`)
      }

      setSelectedSessions([])
      loadConfirmationData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send bulk confirmations'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Error sending bulk confirmations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSessionAction = async (sessionId: string, action: string, data?: any) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/confirmation?action=${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          ...data
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} session`)
      }

      toast.success(`Session ${action}ed successfully`)
      
      if (onSessionConfirmed && action === 'confirm') {
        onSessionConfirmed(result.data)
      }

      loadConfirmationData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action} session`
      setError(errorMessage)
      toast.error(errorMessage)
      console.error(`Error ${action}ing session:`, err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    )
  }

  const selectAllSessions = () => {
    const pendingSessions = sessions.filter(s => s.status === 'SCHEDULED')
    setSelectedSessions(pendingSessions.map(s => s.id))
  }

  const clearSelection = () => {
    setSelectedSessions([])
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'RESCHEDULE_REQUESTED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredSessions = sessions.filter(session => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const patientName = `${session.patient.firstName} ${session.patient.lastName}`.toLowerCase()
      const therapistName = `${session.therapist.firstName} ${session.therapist.lastName}`.toLowerCase()
      const serviceName = session.serviceAssignment.service.name.toLowerCase()
      
      if (!patientName.includes(searchTerm) && 
          !therapistName.includes(searchTerm) && 
          !serviceName.includes(searchTerm)) {
        return false
      }
    }
    return true
  })

  if (loading && sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading confirmation data...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Session Confirmation System
          </CardTitle>
          <CardDescription>
            Manage session confirmations and track confirmation status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium">Total Sessions:</span> {stats.total}
              </div>
              <div className="text-sm">
                <span className="font-medium">Pending:</span> {stats.pending}
              </div>
              <div className="text-sm">
                <span className="font-medium">Confirmed:</span> {stats.confirmed}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={loadConfirmationData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All scheduled sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Confirmation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">
              Confirmed sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
            <p className="text-xs text-muted-foreground">
              Cancelled sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="send">Send Confirmations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search sessions..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="NO_SHOW">No Show</SelectItem>
                      <SelectItem value="RESCHEDULE_REQUESTED">Reschedule Requested</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sessions</CardTitle>
                <div className="flex items-center space-x-2">
                  {selectedSessions.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkSendConfirmation}
                      disabled={loading}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send to {selectedSessions.length} sessions
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllSessions}
                  >
                    Select All Pending
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`p-4 ${selectedSessions.includes(session.id) ? 'ring-2 ring-blue-500' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedSessions.includes(session.id)}
                              onChange={() => toggleSessionSelection(session.id)}
                              className="rounded"
                            />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                              <div>
                                <div className="font-medium">
                                  {session.patient.firstName} {session.patient.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {session.serviceAssignment.service.name}
                                </div>
                              </div>
                              
                              <div className="text-sm">
                                <div className="font-medium">
                                  {new Date(session.scheduledDate).toLocaleDateString()}
                                </div>
                                <div className="text-muted-foreground">
                                  {formatTime(session.scheduledTime)}
                                </div>
                              </div>
                              
                              <div className="text-sm">
                                <div className="font-medium">
                                  {session.therapist.firstName} {session.therapist.lastName}
                                </div>
                                <div className="text-muted-foreground">
                                  Therapist
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(session.status)}>
                                {session.status.replace('_', ' ')}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {session.duration} minutes
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {session.status === 'SCHEDULED' && (
                            <Button
                              size="sm"
                              onClick={() => handleSendConfirmation(session.id)}
                              disabled={loading}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send Confirmation
                            </Button>
                          )}
                          
                          {session.status === 'CONFIRMED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSessionAction(session.id, 'cancel', { 
                                reason: 'Cancelled by admin',
                                cancelledBy: 'admin'
                              })}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          )}
                          
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                
                {filteredSessions.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
                    <p className="text-muted-foreground">
                      No sessions match your current filters.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Confirmations Tab */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Send Confirmations
              </CardTitle>
              <CardDescription>
                Configure and send confirmation requests to patients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="confirmationType">Confirmation Type</Label>
                  <Select 
                    value={confirmationForm.confirmationType} 
                    onValueChange={(value: any) => setConfirmationForm(prev => ({ ...prev, confirmationType: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">Email Only</SelectItem>
                      <SelectItem value="SMS">SMS Only</SelectItem>
                      <SelectItem value="BOTH">Email & SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Reminder Hours</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[1, 2, 6, 12, 24, 48].map((hours) => (
                      <Button
                        key={hours}
                        variant={confirmationForm.reminderHours.includes(hours) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setConfirmationForm(prev => ({
                            ...prev,
                            reminderHours: prev.reminderHours.includes(hours)
                              ? prev.reminderHours.filter(h => h !== hours)
                              : [...prev.reminderHours, hours]
                          }))
                        }}
                      >
                        {hours}h
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="customMessage">Custom Message (Optional)</Label>
                <Textarea
                  id="customMessage"
                  placeholder="Add a custom message to include with the confirmation..."
                  value={confirmationForm.customMessage}
                  onChange={(e) => setConfirmationForm(prev => ({ ...prev, customMessage: e.target.value }))}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleBulkSendConfirmation}
                  disabled={loading || selectedSessions.length === 0}
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send to {selectedSessions.length} Selected Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Confirmation Settings
              </CardTitle>
              <CardDescription>
                Configure default confirmation settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Settings Panel</h3>
                <p className="text-muted-foreground">
                  Configure default confirmation settings, email templates, and notification preferences.
                </p>
              </div>
            </CardContent>
          </Card>
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
