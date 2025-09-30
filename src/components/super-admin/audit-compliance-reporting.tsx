'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
  RefreshCw,
  Search,
  Filter,
  Activity,
  Lock,
  Database,
  User
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId: string | null
  userId: string | null
  userName: string | null
  userEmail: string | null
  userRole: string | null
  severity: string
  success: boolean
  errorMessage: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

interface ComplianceCheck {
  status: string
  recommendation: string
  [key: string]: any
}

interface ComplianceData {
  overallStatus: string
  checks: {
    dataRetention?: ComplianceCheck
    accessControl?: ComplianceCheck
    auditTrail?: ComplianceCheck
  }
  summary: {
    totalChecks: number
    compliant: number
    reviewNeeded: number
    nonCompliant: number
  }
}

export function AuditComplianceReporting() {
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const [filters, setFilters] = useState({
    severity: '',
    resource: '',
    userId: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('audit')

  useEffect(() => {
    loadAuditLogs()
  }, [dateRange, filters])

  useEffect(() => {
    if (activeTab === 'compliance') {
      runComplianceCheck()
    }
  }, [activeTab])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)
      if (filters.severity) params.append('severity', filters.severity)
      if (filters.resource) params.append('resource', filters.resource)
      if (filters.userId) params.append('userId', filters.userId)

      const response = await fetch(`/api/super-admin/audit-compliance?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load audit logs')
      }

      const result = await response.json()
      setLogs(result.data.logs)
      setStatistics(result.data.statistics)
    } catch (err) {
      console.error('Error loading audit logs:', err)
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const runComplianceCheck = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/super-admin/audit-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkType: 'all',
          generateReport: false
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to run compliance check')
      }

      const result = await response.json()
      setComplianceData(result.data)
    } catch (err) {
      console.error('Error running compliance check:', err)
      toast.error('Failed to run compliance check')
    } finally {
      setLoading(false)
    }
  }

  const handleExportAuditLog = () => {
    if (logs.length === 0) return

    const csv = [
      ['Timestamp', 'User', 'Role', 'Action', 'Resource', 'Severity', 'Success', 'IP Address'].join(','),
      ...logs.map(log => [
        new Date(log.createdAt).toLocaleString(),
        log.userName || 'System',
        log.userRole || 'N/A',
        log.action,
        log.resource,
        log.severity,
        log.success ? 'Yes' : 'No',
        log.ipAddress || 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success('Audit log exported successfully')
  }

  const handleExportComplianceReport = () => {
    if (!complianceData) return

    const report = `
COMPLIANCE REPORT
Generated: ${new Date().toLocaleString()}

OVERALL STATUS: ${complianceData.overallStatus.toUpperCase()}
===============

SUMMARY
-------
Total Checks: ${complianceData.summary.totalChecks}
Compliant: ${complianceData.summary.compliant}
Review Needed: ${complianceData.summary.reviewNeeded}
Non-Compliant: ${complianceData.summary.nonCompliant}

DETAILED CHECKS
===============

${Object.entries(complianceData.checks).map(([checkName, check]) => `
${checkName.toUpperCase().replace(/_/g, ' ')}
Status: ${check.status}
Recommendation: ${check.recommendation}
${Object.entries(check).filter(([key]) => !['status', 'recommendation'].includes(key)).map(([key, value]) => 
  `${key}: ${value}`
).join('\n')}
`).join('\n')}
    `.trim()

    const blob = new Blob([report], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `compliance-report-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success('Compliance report exported successfully')
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'WARNING': return 'bg-yellow-100 text-yellow-800'
      case 'INFO': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800'
      case 'review_needed': return 'bg-yellow-100 text-yellow-800'
      case 'non_compliant': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'review_needed': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'non_compliant': return <XCircle className="h-5 w-5 text-red-500" />
      default: return <Shield className="h-5 w-5 text-gray-500" />
    }
  }

  const filteredLogs = logs.filter(log =>
    searchTerm === '' ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.userName && log.userName.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              System Audit & Compliance Reporting
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={activeTab === 'audit' ? loadAuditLogs : runComplianceCheck}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Logs</p>
                      <p className="text-3xl font-bold">{statistics.totalCount}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Successful</p>
                      <p className="text-3xl font-bold text-green-600">{statistics.successfulActions}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Failed</p>
                      <p className="text-3xl font-bold text-red-600">{statistics.failedActions}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                      <p className="text-3xl font-bold">{statistics.successRate}%</p>
                    </div>
                    <Activity className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleExportAuditLog} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs List */}
          {loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading audit logs...</p>
              </CardContent>
            </Card>
          ) : filteredLogs.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Audit Logs</h3>
                <p className="text-muted-foreground">No audit logs found for the selected filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getSeverityColor(log.severity)}>
                              {log.severity}
                            </Badge>
                            <Badge variant="outline">
                              {log.action}
                            </Badge>
                            {log.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <p className="text-muted-foreground">Resource</p>
                              <p className="font-medium">{log.resource}</p>
                            </div>
                            {log.userName && (
                              <div>
                                <p className="text-muted-foreground">User</p>
                                <p className="font-medium">{log.userName}</p>
                              </div>
                            )}
                            {log.userRole && (
                              <div>
                                <p className="text-muted-foreground">Role</p>
                                <p className="font-medium">{log.userRole}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground">Timestamp</p>
                              <p className="font-medium text-xs">{new Date(log.createdAt).toLocaleString()}</p>
                            </div>
                          </div>

                          {log.errorMessage && (
                            <Alert variant="destructive" className="mt-2">
                              <AlertDescription className="text-sm">
                                Error: {log.errorMessage}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Running compliance checks...</p>
              </CardContent>
            </Card>
          ) : complianceData ? (
            <>
              {/* Overall Status */}
              <Card className={
                complianceData.overallStatus === 'non_compliant' ? 'border-red-500' :
                complianceData.overallStatus === 'review_needed' ? 'border-yellow-500' :
                'border-green-500'
              }>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getComplianceIcon(complianceData.overallStatus)}
                      <div>
                        <h3 className="text-2xl font-bold">Compliance Status</h3>
                        <Badge className={getComplianceStatusColor(complianceData.overallStatus)}>
                          {complianceData.overallStatus.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <Button onClick={handleExportComplianceReport} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Total Checks</p>
                    <p className="text-3xl font-bold">{complianceData.summary.totalChecks}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Compliant</p>
                    <p className="text-3xl font-bold text-green-600">{complianceData.summary.compliant}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Review Needed</p>
                    <p className="text-3xl font-bold text-yellow-600">{complianceData.summary.reviewNeeded}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Non-Compliant</p>
                    <p className="text-3xl font-bold text-red-600">{complianceData.summary.nonCompliant}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Compliance Checks */}
              <div className="grid grid-cols-1 gap-4">
                {Object.entries(complianceData.checks).map(([checkName, check]) => (
                  <Card key={checkName}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-base capitalize">
                          {checkName === 'dataRetention' && <Database className="h-5 w-5 mr-2" />}
                          {checkName === 'accessControl' && <Lock className="h-5 w-5 mr-2" />}
                          {checkName === 'auditTrail' && <Activity className="h-5 w-5 mr-2" />}
                          {checkName.replace(/([A-Z])/g, ' $1').trim()}
                        </CardTitle>
                        <Badge className={getComplianceStatusColor(check.status)}>
                          {check.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Recommendation</p>
                          <p className="text-sm text-muted-foreground">{check.recommendation}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {Object.entries(check)
                            .filter(([key]) => !['status', 'recommendation'].includes(key))
                            .map(([key, value]) => (
                              <div key={key}>
                                <p className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <p className="font-medium">{String(value)}</p>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
