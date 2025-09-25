'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
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
  MessageSquare,
  Eye,
  AlertTriangle,
  Play,
  Pause,
  Square
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePaymentStatusTracking, PaymentStatus, PaymentStatusHistory, PaymentStatusInfo } from '@/hooks/use-payment-status-tracking'

interface PaymentStatusManagerProps {
  paymentId: string
  currentStatus: PaymentStatus
  onStatusUpdate?: (newStatus: PaymentStatus) => void
  showHistory?: boolean
  showStatistics?: boolean
}

export function PaymentStatusManager({
  paymentId,
  currentStatus,
  onStatusUpdate,
  showHistory = true,
  showStatistics = false
}: PaymentStatusManagerProps) {
  const [statusInfo, setStatusInfo] = useState<PaymentStatusInfo | null>(null)
  const [statusHistory, setStatusHistory] = useState<PaymentStatusHistory[]>([])
  const [possibleTransitions, setPossibleTransitions] = useState<PaymentStatus[]>([])
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [updateForm, setUpdateForm] = useState({
    newStatus: '' as PaymentStatus,
    reason: '',
    notes: '',
    updatedBy: 'user' // This would come from auth context
  })

  const { 
    updatePaymentStatus, 
    getPaymentStatusInfo, 
    getPaymentStatusHistory, 
    getPossibleTransitions,
    loading, 
    error 
  } = usePaymentStatusTracking()

  // Load status information
  const loadStatusInfo = async () => {
    try {
      const [info, history, transitions] = await Promise.all([
        getPaymentStatusInfo(paymentId),
        getPaymentStatusHistory(paymentId),
        getPossibleTransitions(currentStatus)
      ])
      
      setStatusInfo(info)
      setStatusHistory(history)
      setPossibleTransitions(transitions.possibleTransitions)
    } catch (err) {
      console.error('Failed to load payment status information:', err)
    }
  }

  useEffect(() => {
    loadStatusInfo()
  }, [paymentId, currentStatus])

  const handleStatusUpdate = async () => {
    try {
      await updatePaymentStatus({
        paymentId,
        newStatus: updateForm.newStatus,
        updatedBy: updateForm.updatedBy,
        reason: updateForm.reason || undefined,
        notes: updateForm.notes || undefined
      })

      // Reload status information
      await loadStatusInfo()
      
      // Reset form
      setUpdateForm({
        newStatus: '' as PaymentStatus,
        reason: '',
        notes: '',
        updatedBy: 'user'
      })
      setShowUpdateForm(false)
      
      // Notify parent component
      onStatusUpdate?.(updateForm.newStatus)
    } catch (err) {
      console.error('Failed to update payment status:', err)
    }
  }

  const getStatusBadge = (status: PaymentStatus) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: AlertCircle },
      'PROCESSING': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Loader2 },
      'COMPLETED': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      'FAILED': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: XCircle },
      'REFUNDED': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: AlertCircle }
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

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'PENDING':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-gray-500" />
      case 'REFUNDED':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
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
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Payment Status
          </CardTitle>
          <CardDescription>
            Current payment status and information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusInfo ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusBadge(statusInfo.currentStatus)}
                  {statusInfo.requiresAttention && (
                    <Badge variant="destructive" className="animate-pulse">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Requires Attention
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Last updated: {formatDate(statusInfo.lastUpdated)}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpdateForm(!showUpdateForm)}
                  disabled={possibleTransitions.length === 0}
                >
                  Update Status
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Updated by: {statusInfo.lastUpdatedBy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>In status: {formatDuration(statusInfo.timeInCurrentStatus)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Total: {formatDuration(statusInfo.totalDuration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>Transitions: {statusInfo.statusHistory.length}</span>
                </div>
              </div>

              {statusInfo.nextAction && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Next Action: {statusInfo.nextAction}
                    </span>
                  </div>
                </div>
              )}

              {possibleTransitions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Possible Transitions:</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {possibleTransitions.map((status) => (
                      <Badge key={status} variant="outline" className="text-xs">
                        {status.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 text-muted-foreground mx-auto mb-2 animate-spin" />
              <p className="text-sm text-muted-foreground">Loading payment status information...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Form */}
      <AnimatePresence>
        {showUpdateForm && (
          <motion.div
            initial={{ opacity: 0, blockSize: 0 }}
            animate={{ opacity: 1, blockSize: 'auto' }}
            exit={{ opacity: 0, blockSize: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Update Payment Status
                </CardTitle>
                <CardDescription>
                  Change the payment status with optional notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newStatus">New Status *</Label>
                  <Select 
                    value={updateForm.newStatus} 
                    onValueChange={(value: PaymentStatus) => setUpdateForm(prev => ({ ...prev, newStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {possibleTransitions.map((status) => (
                        <SelectItem key={status} value={status}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status)}
                            {status.replace('_', ' ')}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Input
                    id="reason"
                    value={updateForm.reason}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Reason for status change"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={updateForm.notes}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about the status change"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={loading || !updateForm.newStatus}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Update Status
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowUpdateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status History */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Status History
            </CardTitle>
            <CardDescription>
              Complete history of payment status changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusHistory.length > 0 ? (
              <div className="space-y-4">
                {statusHistory.map((history, index) => (
                  <motion.div
                    key={history.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getStatusBadge(history.status)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {history.status.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(history.updatedAt)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Updated by: {history.updatedBy}
                        </div>
                        {history.reason && (
                          <div className="text-sm">
                            <span className="font-medium">Reason:</span> {history.reason}
                          </div>
                        )}
                        {history.notes && (
                          <div className="text-sm">
                            <span className="font-medium">Notes:</span> {history.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Status History</h3>
                <p className="text-muted-foreground">
                  No status changes have been recorded yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
  )
}
