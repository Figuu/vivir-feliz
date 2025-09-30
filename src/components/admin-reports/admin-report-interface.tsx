'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  FileText,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Share,
  Search,
  Filter,
  Plus,
  Minus,
  User,
  Users,
  Calendar,
  Clock,
  BarChart3
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface AdminReportInterfaceProps {
  adminId?: string
}

interface Report {
  id: string
  title: string
  description: string
  status: string
  reportType: 'submission' | 'compilation'
  patient: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  therapist?: {
    firstName: string
    lastName: string
  }
  coordinator?: {
    firstName: string
    lastName: string
  }
  requiresAdminApproval: boolean
  distributions?: Array<{
    id: string
    distributedAt: string
    recipients: any
  }>
  createdAt: string
  updatedAt: string
}

interface Statistics {
  totalSubmissions: number
  totalCompilations: number
  pendingApproval: number
  distributed: number
  recentActivity: number
}

export function AdminReportInterface({ adminId }: AdminReportInterfaceProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  
  // Data state
  const [reports, setReports] = useState<Report[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  
  // Filter state
  const [filters, setFilters] = useState({
    reportType: 'all',
    status: '',
    search: '',
    requiresApproval: false
  })

  // Distribution state
  const [distributionDialog, setDistributionDialog] = useState(false)
  const [distributionRecipients, setDistributionRecipients] = useState([{
    recipientId: '',
    recipientType: 'patient' as 'patient' | 'parent' | 'therapist' | 'coordinator' | 'external',
    email: '',
    accessLevel: 'view' as 'view' | 'download' | 'full',
    expiresAt: ''
  }])
  const [distributionMessage, setDistributionMessage] = useState('')

  // Approval state
  const [approvalDialog, setApprovalDialog] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  const [approvalComments, setApprovalComments] = useState('')

  // Load initial data
  useEffect(() => {
    loadReports()
    loadStatistics()
  }, [filters, activeTab])

  const loadReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (activeTab === 'pending') {
        params.append('requiresApproval', 'true')
      } else if (activeTab === 'distributed') {
        // Filter by reports that have distributions
      }
      
      if (filters.reportType !== 'all') params.append('reportType', filters.reportType)
      if (filters.status) params.append('status', filters.status)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/admin-reports?${params}`)
      const result = await response.json()

      if (response.ok) {
        setReports(result.data.reports || [])
      } else {
        setError(result.error || 'Failed to load reports')
      }
    } catch (err) {
      setError('Failed to load reports')
      console.error('Error loading reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/admin-reports?action=statistics')
      const result = await response.json()

      if (response.ok) {
        setStatistics(result.data)
      }
    } catch (err) {
      console.error('Error loading statistics:', err)
    }
  }

  const handleDistribute = async () => {
    if (!selectedReport) return

    const validRecipients = distributionRecipients.filter(r => r.email && r.recipientType)
    if (validRecipients.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please add at least one recipient'
      })
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/admin-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'distribute',
          reportId: selectedReport.id,
          reportType: selectedReport.reportType,
          recipients: validRecipients,
          message: distributionMessage,
          notifyRecipients: true,
          distributedBy: adminId || 'admin-1'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to distribute report')
      }

      toast({
        title: "Success",
        description: 'Report distributed successfully'
      })
      setDistributionDialog(false)
      setSelectedReport(null)
      setDistributionRecipients([{
        recipientId: '',
        recipientType: 'patient',
        email: '',
        accessLevel: 'view',
        expiresAt: ''
      }])
      setDistributionMessage('')
      loadReports()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to distribute report'
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error distributing report:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async () => {
    if (!selectedReport) return

    try {
      setLoading(true)
      const response = await fetch('/api/admin-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: approvalAction,
          reportId: selectedReport.id,
          reportType: selectedReport.reportType,
          comments: approvalComments,
          approvedBy: adminId || 'admin-1'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${approvalAction} report`)
      }

      toast({
        title: "Success",
        description: `Report ${approvalAction}d successfully`
      })
      setApprovalDialog(false)
      setSelectedReport(null)
      setApprovalComments('')
      loadReports()
      loadStatistics()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${approvalAction} report`
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error with approval:', err)
    } finally {
      setLoading(false)
    }
  }

  const openDistributionDialog = (report: Report) => {
    setSelectedReport(report)
    // Pre-fill patient email
    setDistributionRecipients([{
      recipientId: report.patient.id,
      recipientType: 'patient',
      email: report.patient.email,
      accessLevel: 'download',
      expiresAt: ''
    }])
    setDistributionDialog(true)
  }

  const openApprovalDialog = (report: Report, action: 'approve' | 'reject') => {
    setSelectedReport(report)
    setApprovalAction(action)
    setApprovalDialog(true)
  }

  const addRecipient = () => {
    setDistributionRecipients([...distributionRecipients, {
      recipientId: '',
      recipientType: 'patient',
      email: '',
      accessLevel: 'view',
      expiresAt: ''
    }])
  }

  const removeRecipient = (index: number) => {
    setDistributionRecipients(distributionRecipients.filter((_, i) => i !== index))
  }

  const updateRecipient = (index: number, field: string, value: any) => {
    setDistributionRecipients(distributionRecipients.map((r, i) => 
      i === index ? { ...r, [field]: value } : r
    ))
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
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Statistics Dashboard */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">Total reports</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Compilations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalCompilations}</div>
              <p className="text-xs text-muted-foreground">Final reports</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.pendingApproval}</div>
              <p className="text-xs text-muted-foreground">Requires action</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Distributed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.distributed}</div>
              <p className="text-xs text-muted-foreground">Sent to recipients</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.recentActivity}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <Button size="sm" variant="outline" onClick={loadReports}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Report Type</Label>
              <Select value={filters.reportType} onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="submission">Submissions</SelectItem>
                  <SelectItem value="compilation">Compilations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval ({statistics?.pendingApproval || 0})</TabsTrigger>
          <TabsTrigger value="distributed">Distributed</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'distributed'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {tab === 'all' && 'All Reports'}
                  {tab === 'pending' && 'Reports Pending Approval'}
                  {tab === 'distributed' && 'Distributed Reports'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">Loading reports...</p>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
                    <p className="text-muted-foreground">
                      {tab === 'pending' && 'No reports pending approval'}
                      {tab === 'distributed' && 'No distributed reports found'}
                      {tab === 'all' && 'No reports found for the selected filters'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold">{report.title}</h3>
                              <Badge className={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                              <Badge variant="outline">
                                {report.reportType}
                              </Badge>
                              {report.requiresAdminApproval && (
                                <Badge variant="secondary">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Requires Approval
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground">{report.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <Label className="text-xs font-medium">Patient</Label>
                                <div>{report.patient.firstName} {report.patient.lastName}</div>
                              </div>
                              {report.therapist && (
                                <div>
                                  <Label className="text-xs font-medium">Therapist</Label>
                                  <div>{report.therapist.firstName} {report.therapist.lastName}</div>
                                </div>
                              )}
                              {report.coordinator && (
                                <div>
                                  <Label className="text-xs font-medium">Coordinator</Label>
                                  <div>{report.coordinator.firstName} {report.coordinator.lastName}</div>
                                </div>
                              )}
                              <div>
                                <Label className="text-xs font-medium">Updated</Label>
                                <div>{new Date(report.updatedAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                            
                            {report.distributions && report.distributions.length > 0 && (
                              <div className="text-sm">
                                <Label className="text-xs font-medium">Distributions</Label>
                                <div>{report.distributions.length} distribution(s)</div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <Button size="sm" variant="outline" onClick={() => openDistributionDialog(report)}>
                              <Share className="h-4 w-4 mr-1" />
                              Distribute
                            </Button>
                            {report.requiresAdminApproval && (report.status === 'approved' || report.status === 'completed') && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => openApprovalDialog(report, 'approve')}>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openApprovalDialog(report, 'reject')}>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Distribution Dialog */}
      <Dialog open={distributionDialog} onOpenChange={setDistributionDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Distribute Report</DialogTitle>
            <DialogDescription>
              {selectedReport && `${selectedReport.title} - ${selectedReport.reportType}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Recipients</Label>
                <Button type="button" size="sm" variant="outline" onClick={addRecipient}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Recipient
                </Button>
              </div>
              
              <div className="space-y-3">
                {distributionRecipients.map((recipient, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Recipient {index + 1}</h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRecipient(index)}
                        disabled={distributionRecipients.length === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Type</Label>
                        <Select 
                          value={recipient.recipientType} 
                          onValueChange={(value) => updateRecipient(index, 'recipientType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="patient">Patient</SelectItem>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="therapist">Therapist</SelectItem>
                            <SelectItem value="coordinator">Coordinator</SelectItem>
                            <SelectItem value="external">External</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Access Level</Label>
                        <Select 
                          value={recipient.accessLevel} 
                          onValueChange={(value) => updateRecipient(index, 'accessLevel', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">View Only</SelectItem>
                            <SelectItem value="download">Download</SelectItem>
                            <SelectItem value="full">Full Access</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={recipient.email}
                        onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                        placeholder="recipient@example.com"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <Label>Message (Optional)</Label>
              <Textarea
                value={distributionMessage}
                onChange={(e) => setDistributionMessage(e.target.value)}
                placeholder="Enter a message to include with the distribution"
                rows={3}
                maxLength={1000}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDistributionDialog(false)}>Cancel</Button>
            <Button onClick={handleDistribute} disabled={loading}>
              {loading ? 'Distributing...' : 'Distribute Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onOpenChange={setApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Report' : 'Reject Report'}
            </DialogTitle>
            <DialogDescription>
              {selectedReport && `${selectedReport.title} - ${selectedReport.reportType}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Comments</Label>
              <Textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder={approvalAction === 'approve' ? 'Enter approval comments (optional)' : 'Enter rejection reason (optional)'}
                rows={4}
                maxLength={2000}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialog(false)}>Cancel</Button>
            <Button onClick={handleApproval} disabled={loading}>
              {loading ? 'Processing...' : approvalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
