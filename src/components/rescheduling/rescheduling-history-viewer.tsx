'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  History, 
  Calendar,
  Clock,
  User,
  Filter,
  Download,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface ReschedulingHistoryViewerProps {
  sessionId?: string
  patientId?: string
  therapistId?: string
}

interface HistoryEntry {
  id: string
  sessionId: string
  session: {
    scheduledDate: string
    scheduledTime: string
    patient: {
      firstName: string
      lastName: string
    }
    therapist: {
      firstName: string
      lastName: string
    }
  }
  requestedDate: string
  requestedTime: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  requestedBy: string
  comments?: string
  createdAt: string
  approvedAt?: string
  rejectedAt?: string
}

export function ReschedulingHistoryViewer({ 
  sessionId, 
  patientId, 
  therapistId 
}: ReschedulingHistoryViewerProps) {
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [filteredHistory, setFilteredHistory] = useState<HistoryEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>('all')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    loadHistory()
  }, [sessionId, patientId, therapistId, dateRange])

  useEffect(() => {
    applyFilters()
  }, [history, searchTerm, statusFilter])

  const loadHistory = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (sessionId) params.append('sessionId', sessionId)
      if (patientId) params.append('patientId', patientId)
      if (therapistId) params.append('therapistId', therapistId)
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`/api/rescheduling-history?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to load history')
      }

      const data = await response.json()
      setHistory(data.data.history || [])
    } catch (err) {
      console.error('Error loading history:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to load rescheduling history'
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...history]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => entry.status === statusFilter)
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.session.patient.firstName.toLowerCase().includes(search) ||
        entry.session.patient.lastName.toLowerCase().includes(search) ||
        entry.session.therapist.firstName.toLowerCase().includes(search) ||
        entry.session.therapist.lastName.toLowerCase().includes(search) ||
        entry.reason.toLowerCase().includes(search)
      )
    }

    setFilteredHistory(filtered)
  }

  const handleExport = () => {
    try {
      const csv = [
        ['Date', 'Patient', 'Therapist', 'Original Date', 'Original Time', 'Requested Date', 'Requested Time', 'Status', 'Reason'].join(','),
        ...filteredHistory.map(entry => [
          new Date(entry.createdAt).toLocaleDateString(),
          `${entry.session.patient.firstName} ${entry.session.patient.lastName}`,
          `${entry.session.therapist.firstName} ${entry.session.therapist.lastName}`,
          new Date(entry.session.scheduledDate).toLocaleDateString(),
          entry.session.scheduledTime,
          new Date(entry.requestedDate).toLocaleDateString(),
          entry.requestedTime,
          entry.status,
          `"${entry.reason.replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rescheduling-history-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: 'History exported successfully'
      })
    } catch (err) {
      console.error('Error exporting history:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to export history'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'rejected': return <XCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const stats = {
    total: history.length,
    approved: history.filter(h => h.status === 'approved').length,
    rejected: history.filter(h => h.status === 'rejected').length,
    pending: history.filter(h => h.status === 'pending').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Rescheduling History & Tracking
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredHistory.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <History className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patient, therapist, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border rounded-md px-3 py-2 flex-1"
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading history...</p>
          </CardContent>
        </Card>
      ) : filteredHistory.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No History Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || dateRange.startDate || dateRange.endDate
                ? 'Try adjusting your filters'
                : 'No rescheduling requests have been made yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredHistory.length} of {history.length} entries
          </div>
          <div className="grid grid-cols-1 gap-4">
            {filteredHistory.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(entry.status)}>
                              {getStatusIcon(entry.status)}
                              <span className="ml-1">{entry.status}</span>
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {new Date(entry.createdAt).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1">Patient</p>
                              <p className="font-medium">{entry.session.patient.firstName} {entry.session.patient.lastName}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Therapist</p>
                              <p className="font-medium">{entry.session.therapist.firstName} {entry.session.therapist.lastName}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Original Schedule</p>
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{new Date(entry.session.scheduledDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm mt-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{entry.session.scheduledTime}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Requested Schedule</p>
                          <div className="flex items-center space-x-2 text-sm text-blue-600">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(entry.requestedDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-blue-600 mt-1">
                            <Clock className="h-4 w-4" />
                            <span>{entry.requestedTime}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Reason</p>
                        <p className="text-sm">{entry.reason}</p>
                      </div>

                      {entry.comments && (
                        <div className="pt-3 border-t bg-gray-50 -mx-6 -mb-6 px-6 py-3 rounded-b-lg">
                          <p className="text-xs text-muted-foreground mb-1">Coordinator Comments</p>
                          <p className="text-sm">{entry.comments}</p>
                        </div>
                      )}

                      {(entry.approvedAt || entry.rejectedAt) && (
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          {entry.approvedAt && `Approved: ${new Date(entry.approvedAt).toLocaleString()}`}
                          {entry.rejectedAt && `Rejected: ${new Date(entry.rejectedAt).toLocaleString()}`}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
