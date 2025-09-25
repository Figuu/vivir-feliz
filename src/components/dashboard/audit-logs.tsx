"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { 
  Shield, 
  Download, 
  Filter, 
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle
} from "lucide-react"
import { AuditAction, AuditSeverity } from "@prisma/client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable, SortableHeader } from "@/components/ui/data-table"
import { useToast } from "@/hooks/use-toast"

interface AuditLog {
  id: string
  action: AuditAction
  resource: string
  resourceId?: string
  userId?: string
  user?: {
    id: string
    email: string
    name?: string
    role: string
  }
  endpoint?: string
  method?: string
  userAgent?: string
  ipAddress?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  metadata?: Record<string, unknown>
  severity: AuditSeverity
  category?: string
  success: boolean
  errorMessage?: string
  createdAt: string
}

interface AuditStats {
  totalLogs: number
  successfulActions: number
  failedActions: number
  successRate: number
  actionsByType: Array<{ action: string; _count: number }>
  severityDistribution: Array<{ severity: string; _count: number }>
}

export function AuditLogs() {
  const [filters, setFilters] = React.useState({
    userId: '',
    action: '',
    resource: '',
    severity: '',
    category: '',
    success: '',
    startDate: '',
    endDate: '',
    search: '',
  })
  const [page, setPage] = React.useState(1)
  const [startDate, setStartDate] = React.useState<Date>()
  const [endDate, setEndDate] = React.useState<Date>()
  const { toast } = useToast()

  // Build query params
  const queryParams = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) queryParams.append(key, value)
  })
  if (startDate) queryParams.append('startDate', startDate.toISOString())
  if (endDate) queryParams.append('endDate', endDate.toISOString())
  queryParams.append('page', page.toString())
  queryParams.append('limit', '50')

  // Fetch audit logs
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-logs', queryParams.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/audit?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs')
      }
      return response.json()
    },
  })

  // Fetch audit stats
  const { data: stats } = useQuery({
    queryKey: ['audit-stats', filters.userId, startDate, endDate],
    queryFn: async () => {
      const statsParams = new URLSearchParams()
      if (filters.userId) statsParams.append('userId', filters.userId)
      if (startDate) statsParams.append('startDate', startDate.toISOString())
      if (endDate) statsParams.append('endDate', endDate.toISOString())
      
      const response = await fetch(`/api/audit/stats?${statsParams.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch audit stats')
      }
      const data = await response.json()
      return data as AuditStats
    },
  })

  const logs = auditData?.logs || []
  const pagination = auditData?.pagination

  // Handle export
  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const exportParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) exportParams.append(key, value)
      })
      if (startDate) exportParams.append('startDate', startDate.toISOString())
      if (endDate) exportParams.append('endDate', endDate.toISOString())
      exportParams.append('format', format)

      const response = await fetch(`/api/audit/export?${exportParams.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to export audit logs')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${format === 'csv' ? 'csv' : 'json'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Export successful',
        description: `Audit logs exported as ${format.toUpperCase()}`,
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export audit logs',
        variant: 'destructive',
      })
    }
  }

  // Clear filters
  const clearFilters = () => {
    setFilters({
      userId: '',
      action: '',
      resource: '',
      severity: '',
      category: '',
      success: '',
      startDate: '',
      endDate: '',
      search: '',
    })
    setStartDate(undefined)
    setEndDate(undefined)
    setPage(1)
  }

  // Get severity icon and color
  const getSeverityDisplay = (severity: AuditSeverity) => {
    switch (severity) {
      case AuditSeverity.CRITICAL:
        return { icon: AlertTriangle, color: 'bg-red-500 text-white' }
      case AuditSeverity.HIGH:
        return { icon: AlertCircle, color: 'bg-orange-500 text-white' }
      case AuditSeverity.WARNING:
        return { icon: AlertTriangle, color: 'bg-yellow-500 text-black' }
      case AuditSeverity.INFO:
        return { icon: Info, color: 'bg-blue-500 text-white' }
      case AuditSeverity.LOW:
        return { icon: Info, color: 'bg-gray-500 text-white' }
      default:
        return { icon: Info, color: 'bg-gray-500 text-white' }
    }
  }

  // Table columns
  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column}>Timestamp</SortableHeader>
      ),
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.getValue("createdAt")), "MMM dd, yyyy HH:mm:ss")}
        </div>
      ),
      size: 150,
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => {
        const severity = row.getValue("severity") as AuditSeverity
        const { icon: Icon, color } = getSeverityDisplay(severity)
        return (
          <Badge className={`${color} text-xs`}>
            <Icon className="w-3 h-3 mr-1" />
            {severity}
          </Badge>
        )
      },
      size: 100,
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {row.getValue("action")}
        </Badge>
      ),
      size: 150,
    },
    {
      accessorKey: "resource",
      header: "Resource",
      cell: ({ row }) => (
        <span className="text-sm font-mono">
          {row.getValue("resource")}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => {
        const user = row.getValue("user") as AuditLog['user']
        if (!user) return <span className="text-muted-foreground">System</span>
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user.name || user.email}</span>
            <span className="text-xs text-muted-foreground">{user.role}</span>
          </div>
        )
      },
      size: 150,
    },
    {
      accessorKey: "endpoint",
      header: "Endpoint",
      cell: ({ row }) => {
        const endpoint = row.getValue("endpoint") as string
        const method = row.original.method
        if (!endpoint) return <span className="text-muted-foreground">-</span>
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {method}
            </Badge>
            <span className="text-sm font-mono">{endpoint}</span>
          </div>
        )
      },
      size: 200,
    },
    {
      accessorKey: "ipAddress",
      header: "IP Address",
      cell: ({ row }) => (
        <span className="text-sm font-mono">
          {row.getValue("ipAddress") || "-"}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "success",
      header: "Status",
      cell: ({ row }) => {
        const success = row.getValue("success") as boolean
        return (
          <Badge variant={success ? "default" : "destructive"} className="text-xs">
            {success ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Success
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Failed
              </>
            )}
          </Badge>
        )
      },
      size: 100,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="w-8 h-8" />
          Audit Logs
        </h1>
        <p className="text-muted-foreground">
          Monitor all system activities and security events
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.successfulActions} successful / {stats.failedActions} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Action</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {stats.actionsByType[0]?.action || 'None'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.actionsByType[0]?._count || 0} occurrences
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.severityDistribution.find(s => s.severity === 'CRITICAL')?._count || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter and search audit logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <Input
              placeholder="User ID..."
              value={filters.userId}
              onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
            />

            <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Actions</SelectItem>
                {Object.values(AuditAction).map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.resource} onValueChange={(value) => setFilters(prev => ({ ...prev, resource: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Resources</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="users">Users</SelectItem>
                <SelectItem value="files">Files</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="security">Security</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Severities</SelectItem>
                {Object.values(AuditSeverity).map(severity => (
                  <SelectItem key={severity} value={severity}>{severity}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="Start date"
              value={startDate ? startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setStartDate(e.target.value ? new Date(e.target.value) : undefined)}
            />

            <Input
              type="date"
              placeholder="End date"
              value={endDate ? endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setEndDate(e.target.value ? new Date(e.target.value) : undefined)}
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
            <div className="flex-1" />
            <Button onClick={() => handleExport('csv')} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => handleExport('json')} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Log Entries</CardTitle>
          <CardDescription>
            {pagination && (
              <>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} entries
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={logs}
            loading={isLoading}
          />
          
          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}