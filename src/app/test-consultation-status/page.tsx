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
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  History,
  TrendingUp,
  RefreshCw,
  Loader2,
  Calendar,
  User,
  Search,
  Play,
  Pause,
  Square
} from 'lucide-react'
import { motion } from 'framer-motion'
import { ConsultationStatusManager } from '@/components/consultation/consultation-status-manager'
import { useConsultationStatus, ConsultationStatus } from '@/hooks/use-consultation-status'

export default function TestConsultationStatusPage() {
  const [activeTab, setActiveTab] = useState('status-manager')
  const [consultationRequestId, setConsultationRequestId] = useState('')
  const [currentStatus, setCurrentStatus] = useState<ConsultationStatus>('PENDING')
  const [consultationsByStatus, setConsultationsByStatus] = useState<any[]>([])
  const [statusStatistics, setStatusStatistics] = useState<any>(null)
  const [consultationsNeedingUpdates, setConsultationsNeedingUpdates] = useState<any>(null)

  const { 
    getConsultationsByStatus,
    getStatusStatistics,
    getConsultationsNeedingUpdates,
    triggerAutoUpdate,
    loading, 
    error 
  } = useConsultationStatus()

  const handleFetchConsultationsByStatus = async (status: ConsultationStatus) => {
    try {
      const result = await getConsultationsByStatus(status, 20, 0)
      setConsultationsByStatus(result.consultations)
    } catch (err) {
      console.error('Failed to fetch consultations by status:', err)
    }
  }

  const handleFetchStatistics = async () => {
    try {
      const result = await getStatusStatistics()
      setStatusStatistics(result)
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
    }
  }

  const handleFetchNeedingUpdates = async () => {
    try {
      const result = await getConsultationsNeedingUpdates()
      setConsultationsNeedingUpdates(result)
    } catch (err) {
      console.error('Failed to fetch consultations needing updates:', err)
    }
  }

  const handleTriggerAutoUpdate = async () => {
    try {
      const result = await triggerAutoUpdate()
      alert(`Auto-update completed. Updated ${result.updated} consultations. Errors: ${result.errors.length}`)
    } catch (err) {
      console.error('Failed to trigger auto-update:', err)
    }
  }

  const getStatusBadge = (status: ConsultationStatus) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: AlertCircle },
      'CONFIRMED': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: CheckCircle },
      'IN_PROGRESS': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: Clock },
      'COMPLETED': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      'CANCELLED': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      'NO_SHOW': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: XCircle }
    }
    
    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Consultation Status Tracking Test</h1>
          <p className="text-muted-foreground">
            Test the consultation status tracking and update system
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status-manager">Status Manager</TabsTrigger>
            <TabsTrigger value="by-status">By Status</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="auto-update">Auto Update</TabsTrigger>
          </TabsList>

          {/* Status Manager Tab */}
          <TabsContent value="status-manager" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Status Manager Test
                </CardTitle>
                <CardDescription>
                  Test the consultation status manager component
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="consultationId">Consultation Request ID</Label>
                    <Input
                      id="consultationId"
                      value={consultationRequestId}
                      onChange={(e) => setConsultationRequestId(e.target.value)}
                      placeholder="Enter consultation request ID"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentStatus">Current Status</Label>
                    <Select value={currentStatus} onValueChange={(value: ConsultationStatus) => setCurrentStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        <SelectItem value="NO_SHOW">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {consultationRequestId && (
                  <ConsultationStatusManager
                    consultationRequestId={consultationRequestId}
                    currentStatus={currentStatus}
                    onStatusUpdate={(newStatus) => setCurrentStatus(newStatus)}
                    showHistory={true}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Status Tab */}
          <TabsContent value="by-status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Consultations by Status
                </CardTitle>
                <CardDescription>
                  View consultations filtered by status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as ConsultationStatus[]).map((status) => (
                    <Button
                      key={status}
                      variant="outline"
                      size="sm"
                      onClick={() => handleFetchConsultationsByStatus(status)}
                      disabled={loading}
                    >
                      {getStatusBadge(status)}
                    </Button>
                  ))}
                </div>

                <Separator />

                <div className="space-y-4">
                  {consultationsByStatus.map((consultation) => (
                    <motion.div
                      key={consultation.id}
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
                                  {consultation.patient?.firstName} {consultation.patient?.lastName}
                                </h4>
                                {getStatusBadge(consultation.status)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p>Parent: {consultation.parent?.firstName} {consultation.parent?.lastName}</p>
                                <p>Specialty: {consultation.specialty?.name}</p>
                                <p>Created: {formatDate(consultation.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setConsultationRequestId(consultation.id)
                                  setCurrentStatus(consultation.status)
                                  setActiveTab('status-manager')
                                }}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
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

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Status Statistics
                </CardTitle>
                <CardDescription>
                  View consultation status statistics and analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleFetchStatistics} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Statistics...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Fetch Statistics
                    </>
                  )}
                </Button>

                {statusStatistics && (
                  <div className="space-y-6">
                    {/* Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{statusStatistics.totalConsultations}</div>
                            <div className="text-sm text-muted-foreground">Total Consultations</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {Math.round(statusStatistics.statusDistribution.COMPLETED / statusStatistics.totalConsultations * 100)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Completion Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {Math.round(statusStatistics.statusDistribution.CANCELLED / statusStatistics.totalConsultations * 100)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Cancellation Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-600">
                              {Math.round(statusStatistics.statusDistribution.NO_SHOW / statusStatistics.totalConsultations * 100)}%
                            </div>
                            <div className="text-sm text-muted-foreground">No-Show Rate</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Status Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Status Distribution</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {Object.entries(statusStatistics.statusDistribution).map(([status, count]) => (
                            <div key={status} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(status as ConsultationStatus)}
                                <span className="text-sm text-muted-foreground">
                                  {Math.round((count as number) / statusStatistics.totalConsultations * 100)}%
                                </span>
                              </div>
                              <span className="font-medium">{count as number}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auto Update Tab */}
          <TabsContent value="auto-update" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Auto Update System
                </CardTitle>
                <CardDescription>
                  Manage automatic status updates and view consultations needing updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={handleFetchNeedingUpdates} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Check for Updates
                      </>
                    )}
                  </Button>
                  <Button onClick={handleTriggerAutoUpdate} disabled={loading} variant="outline">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Trigger Auto Update
                      </>
                    )}
                  </Button>
                </div>

                {consultationsNeedingUpdates && (
                  <div className="space-y-4">
                    {/* To In Progress */}
                    {consultationsNeedingUpdates.toInProgress.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Play className="h-5 w-5 text-blue-500" />
                            Ready to Start ({consultationsNeedingUpdates.toInProgress.length})
                          </CardTitle>
                          <CardDescription>
                            Consultations that should be marked as in progress
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {consultationsNeedingUpdates.toInProgress.map((consultation: any) => (
                              <div key={consultation.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <span className="font-medium">
                                    {consultation.patient?.firstName} {consultation.patient?.lastName}
                                  </span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    Scheduled: {formatDate(consultation.scheduledDate)}
                                  </span>
                                </div>
                                <Badge variant="outline">Ready to Start</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* To Completed */}
                    {consultationsNeedingUpdates.toCompleted.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Square className="h-5 w-5 text-green-500" />
                            Ready to Complete ({consultationsNeedingUpdates.toCompleted.length})
                          </CardTitle>
                          <CardDescription>
                            Consultations that should be marked as completed
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {consultationsNeedingUpdates.toCompleted.map((consultation: any) => (
                              <div key={consultation.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <span className="font-medium">
                                    {consultation.patient?.firstName} {consultation.patient?.lastName}
                                  </span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    Started: {formatDate(consultation.scheduledDate)}
                                  </span>
                                </div>
                                <Badge variant="outline">Ready to Complete</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Overdue */}
                    {consultationsNeedingUpdates.overdue.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            Overdue ({consultationsNeedingUpdates.overdue.length})
                          </CardTitle>
                          <CardDescription>
                            Consultations that are overdue and need attention
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {consultationsNeedingUpdates.overdue.map((consultation: any) => (
                              <div key={consultation.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <span className="font-medium">
                                    {consultation.patient?.firstName} {consultation.patient?.lastName}
                                  </span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    Scheduled: {formatDate(consultation.scheduledDate)}
                                  </span>
                                </div>
                                <Badge variant="destructive">Overdue</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
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


