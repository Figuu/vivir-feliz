'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  ArrowRight,
  Circle,
  CheckCircle2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface StatusTrackingDashboardProps {
  reportId?: string
  reportType?: string
  patientId?: string
  therapistId?: string
}

export function StatusTrackingDashboard({
  reportId,
  reportType: initialReportType,
  patientId,
  therapistId
}: StatusTrackingDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('tracking')
  
  // Data state
  const [statusData, setStatusData] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [workflowData, setWorkflowData] = useState<any>(null)
  const [reportType, setReportType] = useState(initialReportType || 'submission')

  // Load data
  useEffect(() => {
    if (reportId && reportType) {
      loadStatusTracking()
    }
  }, [reportId, reportType])

  useEffect(() => {
    loadDashboard()
  }, [patientId, therapistId])

  const loadStatusTracking = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('reportId', reportId!)
      params.append('reportType', reportType)
      params.append('includeTimeline', 'true')
      params.append('includeWorkflow', 'true')
      params.append('includeMetrics', 'true')

      const response = await fetch(`/api/report-status-workflow?${params}`)
      const result = await response.json()

      if (response.ok) {
        setStatusData(result.data)
      } else {
        setError(result.error || 'Failed to load status tracking')
      }
    } catch (err) {
      setError('Failed to load status tracking')
      console.error('Error loading status tracking:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDashboard = async () => {
    try {
      const params = new URLSearchParams()
      params.append('action', 'dashboard')
      if (patientId) params.append('patientId', patientId)
      if (therapistId) params.append('therapistId', therapistId)

      const response = await fetch(`/api/report-status-workflow?${params}`)
      const result = await response.json()

      if (response.ok) {
        setDashboardData(result.data)
      }
    } catch (err) {
      console.error('Error loading dashboard:', err)
    }
  }

  const loadWorkflowDefinition = async (type: string, status: string) => {
    try {
      const params = new URLSearchParams()
      params.append('action', 'workflow_definition')
      params.append('reportType', type)
      params.append('startStatus', status)

      const response = await fetch(`/api/report-status-workflow?${params}`)
      const result = await response.json()

      if (response.ok) {
        setWorkflowData(result.data)
      }
    } catch (err) {
      console.error('Error loading workflow:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'published': return 'bg-purple-100 text-purple-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'revision_requested': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve': return 'bg-green-100 text-green-800'
      case 'reject': return 'bg-red-100 text-red-800'
      case 'request_revision': return 'bg-orange-100 text-orange-800'
      case 'delegate': return 'bg-blue-100 text-blue-800'
      case 'escalate': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day${days > 1 ? 's' : ''}`
    }
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`
    }
    return `${minutes} min${minutes > 1 ? 's' : ''}`
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Report Status Tracking & Workflow
              </CardTitle>
              <CardDescription>
                Track report status changes and workflow progression
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => { loadStatusTracking(); loadDashboard(); }}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tracking">Status Tracking</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        {/* Status Tracking Tab */}
        <TabsContent value="tracking" className="space-y-4">
          {statusData ? (
            <div className="space-y-4">
              {/* Current Status */}
              {statusData.currentStatus && (
                <Card>
                  <CardHeader>
                    <CardTitle>Current Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{statusData.currentStatus.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Last updated: {new Date(statusData.currentStatus.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(statusData.currentStatus.status)} className="text-lg px-4 py-2">
                        {statusData.currentStatus.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timeline */}
              {statusData.timeline && statusData.timeline.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Status Timeline</CardTitle>
                    <CardDescription>
                      Complete history of status changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statusData.timeline.map((entry: any, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start space-x-4"
                        >
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              index === 0 ? 'bg-green-500' : 'bg-blue-500'
                            }`}>
                              {index === 0 ? (
                                <CheckCircle2 className="h-5 w-5 text-white" />
                              ) : (
                                <Circle className="h-5 w-5 text-white" />
                              )}
                            </div>
                            {index < statusData.timeline.length - 1 && (
                              <div className="w-0.5 h-16 bg-gray-300"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 pb-8">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge className={getActionColor(entry.action)}>
                                {entry.action.replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline">{entry.role}</Badge>
                            </div>
                            
                            <p className="text-sm font-medium mb-1">
                              {entry.actor}
                            </p>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {new Date(entry.timestamp).toLocaleString()}
                              {entry.duration && ` • ${formatDuration(entry.duration)} since previous action`}
                            </p>
                            
                            {entry.comments && (
                              <p className="text-sm bg-gray-50 p-2 rounded">
                                {entry.comments}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metrics */}
              {statusData.metrics && (
                <Card>
                  <CardHeader>
                    <CardTitle>Status Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Total Actions</Label>
                        <div className="text-2xl font-bold">{statusData.metrics.totalActions}</div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Avg Review Time</Label>
                        <div className="text-2xl font-bold">
                          {statusData.metrics.averageReviewTime > 0 ? 
                            `${Math.round(statusData.metrics.averageReviewTime)} min` : 
                            'N/A'
                          }
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Total Duration</Label>
                        <div className="text-2xl font-bold">
                          {formatDuration(statusData.metrics.totalDuration)}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="text-2xl font-bold">
                          {statusData.currentStatus?.status || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Status Data</h3>
                <p className="text-muted-foreground">
                  Select a report to view its status tracking information.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Visualization</CardTitle>
              <CardDescription>
                View the complete workflow for this report type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Report Type</Label>
                <Select 
                  value={reportType} 
                  onValueChange={(value) => {
                    setReportType(value)
                    loadWorkflowDefinition(value, 'draft')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submission">Submission</SelectItem>
                    <SelectItem value="compilation">Compilation</SelectItem>
                    <SelectItem value="therapeutic_plan">Therapeutic Plan</SelectItem>
                    <SelectItem value="progress_report">Progress Report</SelectItem>
                    <SelectItem value="final_report">Final Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {statusData?.workflow && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Workflow Progress</Label>
                    <div className="space-y-2">
                      <Progress value={statusData.workflow.completionPercentage} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        {statusData.workflow.completionPercentage}% complete
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-3 block">Workflow Steps</Label>
                    <div className="space-y-3">
                      {statusData.workflow.definition.map((step: any, index: number) => {
                        const isCurrent = step.status === statusData.workflow.currentStatus
                        const isPast = statusData.workflow.definition.findIndex((s: any) => s.status === statusData.workflow.currentStatus) > index
                        
                        return (
                          <div key={step.status} className="flex items-start space-x-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isCurrent ? 'bg-blue-500' : isPast ? 'bg-green-500' : 'bg-gray-300'
                            }`}>
                              {isPast ? (
                                <CheckCircle className="h-5 w-5 text-white" />
                              ) : (
                                <span className="text-white text-sm">{index + 1}</span>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-semibold">{step.label}</h4>
                                {isCurrent && <Badge variant="secondary">Current</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {statusData.workflow.nextSteps && statusData.workflow.nextSteps.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Possible Next Steps</Label>
                      <div className="flex flex-wrap gap-2">
                        {statusData.workflow.nextSteps.map((nextStep: string) => (
                          <Badge key={nextStep} variant="outline" className="flex items-center space-x-1">
                            <ArrowRight className="h-3 w-3" />
                            <span>{nextStep}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {dashboardData ? (
            <div className="space-y-4">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Submissions by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(dashboardData.submissions.byStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <Badge className={getStatusColor(status)}>{status}</Badge>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t flex items-center justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold">{dashboardData.submissions.total}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Compilations by Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(dashboardData.compilations.byStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <Badge className={getStatusColor(status)}>{status}</Badge>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t flex items-center justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold">{dashboardData.compilations.total}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {dashboardData.recentActivity.slice(0, 10).map((activity: any, index: number) => (
                        <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getActionColor(activity.action)}>
                              {activity.action.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm">{activity.approver.firstName} {activity.approver.lastName}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Dashboard Data</h3>
                <p className="text-muted-foreground">
                  Loading dashboard data...
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
