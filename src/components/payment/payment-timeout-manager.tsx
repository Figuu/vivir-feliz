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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  BarChart3,
  Settings,
  Trash2,
  Edit,
  Eye,
  Loader2,
  Timer,
  Calendar,
  User,
  FileText,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Shield,
  Bell,
  AlertCircle,
  Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePaymentTimeout, PaymentTimeoutStatus, CancellationReason, PaymentTimeoutConfig } from '@/hooks/use-payment-timeout'

interface PaymentTimeoutManagerProps {
  paymentId?: string
  showCreateForm?: boolean
  showActiveTimeouts?: boolean
  showExpiredTimeouts?: boolean
  showStatistics?: boolean
}

export function PaymentTimeoutManager({
  paymentId,
  showCreateForm = true,
  showActiveTimeouts = true,
  showExpiredTimeouts = true,
  showStatistics = true
}: PaymentTimeoutManagerProps) {
  const [activeTab, setActiveTab] = useState('create')
  const [activeTimeouts, setActiveTimeouts] = useState<any[]>([])
  const [expiredTimeouts, setExpiredTimeouts] = useState<any[]>([])
  const [timeoutStatistics, setTimeoutStatistics] = useState<any>(null)
  const [selectedTimeout, setSelectedTimeout] = useState<any>(null)
  const [showTimeoutDetails, setShowTimeoutDetails] = useState(false)
  
  const [createForm, setCreateForm] = useState({
    paymentId: paymentId || '',
    timeoutMinutes: 30,
    config: {
      defaultTimeoutMinutes: 30,
      warningThresholdMinutes: 5,
      extensionAllowed: true,
      maxExtensions: 2,
      extensionMinutes: 15,
      autoCancelEnabled: true,
      notificationEnabled: true
    }
  })
  
  const [extendForm, setExtendForm] = useState({
    paymentId: '',
    extensionMinutes: 15,
    notes: ''
  })
  
  const [cancelForm, setCancelForm] = useState({
    paymentId: '',
    reason: 'USER_REQUEST' as CancellationReason,
    notes: '',
    refundRequired: false,
    refundAmount: 0,
    refundReason: ''
  })

  const { 
    createTimeout,
    extendTimeout,
    cancelPayment,
    getPaymentTimeout,
    getActiveTimeouts,
    getExpiredTimeouts,
    processExpiredTimeouts,
    getTimeoutStatistics,
    loading, 
    error 
  } = usePaymentTimeout()

  // Load timeouts
  const loadActiveTimeouts = async () => {
    try {
      const result = await getActiveTimeouts()
      setActiveTimeouts(result)
    } catch (err) {
      console.error('Failed to load active timeouts:', err)
    }
  }

  const loadExpiredTimeouts = async () => {
    try {
      const result = await getExpiredTimeouts()
      setExpiredTimeouts(result)
    } catch (err) {
      console.error('Failed to load expired timeouts:', err)
    }
  }

  const loadTimeoutStatistics = async () => {
    try {
      const result = await getTimeoutStatistics()
      setTimeoutStatistics(result)
    } catch (err) {
      console.error('Failed to load timeout statistics:', err)
    }
  }

  useEffect(() => {
    if (showActiveTimeouts) {
      loadActiveTimeouts()
    }
  }, [showActiveTimeouts])

  useEffect(() => {
    if (showExpiredTimeouts) {
      loadExpiredTimeouts()
    }
  }, [showExpiredTimeouts])

  useEffect(() => {
    if (showStatistics) {
      loadTimeoutStatistics()
    }
  }, [showStatistics])

  const handleCreateTimeout = async () => {
    try {
      const result = await createTimeout(
        createForm.paymentId,
        createForm.timeoutMinutes,
        createForm.config
      )
      
      alert(`Timeout created successfully! Timeout ID: ${result.id}`)
      
      // Reset form
      setCreateForm(prev => ({
        ...prev,
        paymentId: paymentId || '',
        timeoutMinutes: 30
      }))
      
      // Reload timeouts
      await loadActiveTimeouts()
    } catch (err) {
      console.error('Failed to create timeout:', err)
    }
  }

  const handleExtendTimeout = async () => {
    try {
      const result = await extendTimeout(
        extendForm.paymentId,
        extendForm.extensionMinutes,
        extendForm.notes
      )
      
      alert(`Timeout extended successfully! New timeout: ${new Date(result.timeoutAt).toLocaleString()}`)
      
      // Reset form
      setExtendForm({
        paymentId: '',
        extensionMinutes: 15,
        notes: ''
      })
      
      // Reload timeouts
      await loadActiveTimeouts()
    } catch (err) {
      console.error('Failed to extend timeout:', err)
    }
  }

  const handleCancelPayment = async () => {
    try {
      const result = await cancelPayment({
        paymentId: cancelForm.paymentId,
        reason: cancelForm.reason,
        notes: cancelForm.notes,
        cancelledBy: 'user',
        refundRequired: cancelForm.refundRequired,
        refundAmount: cancelForm.refundAmount,
        refundReason: cancelForm.refundReason
      })
      
      alert(`Payment cancelled successfully! Reason: ${cancelForm.reason}`)
      
      // Reset form
      setCancelForm({
        paymentId: '',
        reason: 'USER_REQUEST',
        notes: '',
        refundRequired: false,
        refundAmount: 0,
        refundReason: ''
      })
      
      // Reload timeouts
      await loadActiveTimeouts()
      await loadExpiredTimeouts()
    } catch (err) {
      console.error('Failed to cancel payment:', err)
    }
  }

  const handleProcessExpiredTimeouts = async () => {
    try {
      const result = await processExpiredTimeouts()
      alert(`Processed ${result.processed} expired timeouts, cancelled ${result.cancelled} payments`)
      
      // Reload timeouts
      await loadActiveTimeouts()
      await loadExpiredTimeouts()
    } catch (err) {
      console.error('Failed to process expired timeouts:', err)
    }
  }

  const handleViewTimeoutDetails = async (timeoutId: string) => {
    try {
      const timeout = activeTimeouts.find(t => t.id === timeoutId) || 
                     expiredTimeouts.find(t => t.id === timeoutId)
      if (timeout) {
        setSelectedTimeout(timeout)
        setShowTimeoutDetails(true)
      }
    } catch (err) {
      console.error('Failed to load timeout details:', err)
    }
  }

  const getStatusBadge = (status: PaymentTimeoutStatus) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: Clock },
      'WARNING': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: AlertTriangle },
      'EXPIRED': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: Trash2 },
      'EXTENDED': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Timer }
    }
    
    const config = statusConfig[status] || statusConfig.ACTIVE
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getCancellationReasonBadge = (reason: CancellationReason) => {
    const reasonConfig = {
      'USER_REQUEST': { color: 'bg-blue-100 text-blue-800', icon: User },
      'TIMEOUT': { color: 'bg-red-100 text-red-800', icon: Clock },
      'ADMIN_CANCELLATION': { color: 'bg-purple-100 text-purple-800', icon: Shield },
      'PAYMENT_FAILED': { color: 'bg-orange-100 text-orange-800', icon: XCircle },
      'DUPLICATE_PAYMENT': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      'INVALID_AMOUNT': { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      'SYSTEM_ERROR': { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
      'OTHER': { color: 'bg-gray-100 text-gray-800', icon: Info }
    }
    
    const config = reasonConfig[reason] || reasonConfig.OTHER
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {reason.replace('_', ' ')}
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours}h ${remainingMinutes}m`
    }
  }

  const getTimeRemaining = (timeoutAt: Date) => {
    const now = new Date()
    const diff = timeoutAt.getTime() - now.getTime()
    
    if (diff <= 0) {
      return 'Expired'
    }
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else {
      return `${minutes}m`
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Timeout</TabsTrigger>
          <TabsTrigger value="active">Active Timeouts</TabsTrigger>
          <TabsTrigger value="expired">Expired Timeouts</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Create Timeout Tab */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Create Payment Timeout
              </CardTitle>
              <CardDescription>
                Set up timeout and cancellation rules for payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentId">Payment ID *</Label>
                  <Input
                    id="paymentId"
                    value={createForm.paymentId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, paymentId: e.target.value }))}
                    placeholder="Payment UUID"
                  />
                </div>
                <div>
                  <Label htmlFor="timeoutMinutes">Timeout (minutes) *</Label>
                  <Input
                    id="timeoutMinutes"
                    type="number"
                    value={createForm.timeoutMinutes}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, timeoutMinutes: parseInt(e.target.value) || 30 }))}
                    min="1"
                    max="1440"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-semibold">Timeout Configuration</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="warningThreshold">Warning Threshold (minutes)</Label>
                    <Input
                      id="warningThreshold"
                      type="number"
                      value={createForm.config.warningThresholdMinutes}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        config: { ...prev.config, warningThresholdMinutes: parseInt(e.target.value) || 5 }
                      }))}
                      min="1"
                      max="60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxExtensions">Max Extensions</Label>
                    <Input
                      id="maxExtensions"
                      type="number"
                      value={createForm.config.maxExtensions}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        config: { ...prev.config, maxExtensions: parseInt(e.target.value) || 2 }
                      }))}
                      min="0"
                      max="10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="extensionMinutes">Extension Duration (minutes)</Label>
                    <Input
                      id="extensionMinutes"
                      type="number"
                      value={createForm.config.extensionMinutes}
                      onChange={(e) => setCreateForm(prev => ({
                        ...prev,
                        config: { ...prev.config, extensionMinutes: parseInt(e.target.value) || 15 }
                      }))}
                      min="1"
                      max="1440"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={createForm.config.extensionAllowed}
                          onChange={(e) => setCreateForm(prev => ({
                            ...prev,
                            config: { ...prev.config, extensionAllowed: e.target.checked }
                          }))}
                        />
                        <span className="text-sm">Allow Extensions</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={createForm.config.autoCancelEnabled}
                          onChange={(e) => setCreateForm(prev => ({
                            ...prev,
                            config: { ...prev.config, autoCancelEnabled: e.target.checked }
                          }))}
                        />
                        <span className="text-sm">Auto Cancel</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={createForm.config.notificationEnabled}
                          onChange={(e) => setCreateForm(prev => ({
                            ...prev,
                            config: { ...prev.config, notificationEnabled: e.target.checked }
                          }))}
                        />
                        <span className="text-sm">Notifications</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleCreateTimeout}
                disabled={loading || !createForm.paymentId}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Timeout...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Create Timeout
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Extend Timeout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Extend Timeout
              </CardTitle>
              <CardDescription>
                Extend an existing payment timeout
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="extendPaymentId">Payment ID *</Label>
                  <Input
                    id="extendPaymentId"
                    value={extendForm.paymentId}
                    onChange={(e) => setExtendForm(prev => ({ ...prev, paymentId: e.target.value }))}
                    placeholder="Payment UUID"
                  />
                </div>
                <div>
                  <Label htmlFor="extensionMinutes">Extension (minutes) *</Label>
                  <Input
                    id="extensionMinutes"
                    type="number"
                    value={extendForm.extensionMinutes}
                    onChange={(e) => setExtendForm(prev => ({ ...prev, extensionMinutes: parseInt(e.target.value) || 15 }))}
                    min="1"
                    max="1440"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="extendNotes">Notes</Label>
                <Textarea
                  id="extendNotes"
                  value={extendForm.notes}
                  onChange={(e) => setExtendForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes for the extension"
                  rows={2}
                />
              </div>
              <Button
                onClick={handleExtendTimeout}
                disabled={loading || !extendForm.paymentId}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extending Timeout...
                  </>
                ) : (
                  <>
                    <Timer className="mr-2 h-4 w-4" />
                    Extend Timeout
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Cancel Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Cancel Payment
              </CardTitle>
              <CardDescription>
                Manually cancel a payment with reason
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cancelPaymentId">Payment ID *</Label>
                  <Input
                    id="cancelPaymentId"
                    value={cancelForm.paymentId}
                    onChange={(e) => setCancelForm(prev => ({ ...prev, paymentId: e.target.value }))}
                    placeholder="Payment UUID"
                  />
                </div>
                <div>
                  <Label htmlFor="cancelReason">Cancellation Reason *</Label>
                  <Select value={cancelForm.reason} onValueChange={(value: CancellationReason) => setCancelForm(prev => ({ ...prev, reason: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER_REQUEST">User Request</SelectItem>
                      <SelectItem value="TIMEOUT">Timeout</SelectItem>
                      <SelectItem value="ADMIN_CANCELLATION">Admin Cancellation</SelectItem>
                      <SelectItem value="PAYMENT_FAILED">Payment Failed</SelectItem>
                      <SelectItem value="DUPLICATE_PAYMENT">Duplicate Payment</SelectItem>
                      <SelectItem value="INVALID_AMOUNT">Invalid Amount</SelectItem>
                      <SelectItem value="SYSTEM_ERROR">System Error</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="cancelNotes">Notes</Label>
                <Textarea
                  id="cancelNotes"
                  value={cancelForm.notes}
                  onChange={(e) => setCancelForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes for the cancellation"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={cancelForm.refundRequired}
                    onChange={(e) => setCancelForm(prev => ({ ...prev, refundRequired: e.target.checked }))}
                  />
                  <span className="text-sm">Refund Required</span>
                </label>
                {cancelForm.refundRequired && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="refundAmount">Refund Amount</Label>
                      <Input
                        id="refundAmount"
                        type="number"
                        value={cancelForm.refundAmount}
                        onChange={(e) => setCancelForm(prev => ({ ...prev, refundAmount: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <Label htmlFor="refundReason">Refund Reason</Label>
                      <Input
                        id="refundReason"
                        value={cancelForm.refundReason}
                        onChange={(e) => setCancelForm(prev => ({ ...prev, refundReason: e.target.value }))}
                        placeholder="Reason for refund"
                      />
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={handleCancelPayment}
                disabled={loading || !cancelForm.paymentId}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling Payment...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Payment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Timeouts Tab */}
        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Active Timeouts
              </CardTitle>
              <CardDescription>
                Monitor active payment timeouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={loadActiveTimeouts} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Active Timeouts...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Active Timeouts
                  </>
                )}
              </Button>

              <Separator />

              <div className="space-y-4">
                {activeTimeouts.map((timeout) => (
                  <motion.div
                    key={timeout.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Payment: {timeout.paymentId}</span>
                              {getStatusBadge(timeout.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Timeout: {formatDate(timeout.timeoutAt)}</p>
                              <p>Time Remaining: {getTimeRemaining(timeout.timeoutAt)}</p>
                              <p>Extensions: {timeout.extensionCount}/{timeout.maxExtensions}</p>
                              {timeout.extendedAt && <p>Last Extended: {formatDate(timeout.extendedAt)}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTimeoutDetails(timeout.id)}
                            >
                              <Eye className="h-4 w-4" />
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

        {/* Expired Timeouts Tab */}
        <TabsContent value="expired" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Expired Timeouts
              </CardTitle>
              <CardDescription>
                Manage expired payment timeouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={loadExpiredTimeouts} disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Expired Timeouts...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Expired Timeouts
                    </>
                  )}
                </Button>
                <Button onClick={handleProcessExpiredTimeouts} disabled={loading} variant="outline">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Process Expired
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                {expiredTimeouts.map((timeout) => (
                  <motion.div
                    key={timeout.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Payment: {timeout.paymentId}</span>
                              {getStatusBadge(timeout.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Expired: {formatDate(timeout.timeoutAt)}</p>
                              <p>Extensions: {timeout.extensionCount}/{timeout.maxExtensions}</p>
                              {timeout.cancellationReason && (
                                <div className="flex items-center gap-2">
                                  <span>Reason:</span>
                                  {getCancellationReasonBadge(timeout.cancellationReason)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTimeoutDetails(timeout.id)}
                            >
                              <Eye className="h-4 w-4" />
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
                <BarChart3 className="h-5 w-5" />
                Timeout Statistics
              </CardTitle>
              <CardDescription>
                View timeout and cancellation analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={loadTimeoutStatistics} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Statistics...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Refresh Statistics
                  </>
                )}
              </Button>

              <Separator />

              {timeoutStatistics && (
                <div className="space-y-6">
                  {/* Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{timeoutStatistics.totalTimeouts}</div>
                          <div className="text-sm text-muted-foreground">Total Timeouts</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{timeoutStatistics.activeTimeouts}</div>
                          <div className="text-sm text-muted-foreground">Active</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{timeoutStatistics.expiredTimeouts}</div>
                          <div className="text-sm text-muted-foreground">Expired</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-600">{timeoutStatistics.cancelledTimeouts}</div>
                          <div className="text-sm text-muted-foreground">Cancelled</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Average Duration */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Average Timeout Duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {formatDuration(Math.round(timeoutStatistics.averageTimeoutDuration))}
                        </div>
                        <div className="text-sm text-muted-foreground">Average duration before cancellation</div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cancellation Reasons */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cancellation Reasons</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(timeoutStatistics.cancellationReasons).map(([reason, count]: [string, any]) => (
                          <div key={reason} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getCancellationReasonBadge(reason as CancellationReason)}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{count}</div>
                              <div className="text-sm text-muted-foreground">cancellations</div>
                            </div>
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
      </Tabs>

      {/* Timeout Details Modal */}
      <AnimatePresence>
        {showTimeoutDetails && selectedTimeout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowTimeoutDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Timeout Details</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowTimeoutDetails(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Timeout ID</Label>
                    <p className="text-sm text-muted-foreground">{selectedTimeout.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedTimeout.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Payment ID</Label>
                    <p className="text-sm text-muted-foreground">{selectedTimeout.paymentId}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Timeout At</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedTimeout.timeoutAt)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Warning At</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedTimeout.warningAt)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Extensions</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedTimeout.extensionCount}/{selectedTimeout.maxExtensions}
                    </p>
                  </div>
                </div>

                {selectedTimeout.extendedAt && (
                  <div>
                    <Label className="text-sm font-medium">Last Extended</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedTimeout.extendedAt)}</p>
                  </div>
                )}

                {selectedTimeout.cancellationReason && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Cancellation Reason</Label>
                      <div className="mt-1">
                        {getCancellationReasonBadge(selectedTimeout.cancellationReason)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Cancelled By</Label>
                      <p className="text-sm text-muted-foreground">{selectedTimeout.cancelledBy || 'System'}</p>
                    </div>
                  </div>
                )}

                {selectedTimeout.cancelledAt && (
                  <div>
                    <Label className="text-sm font-medium">Cancelled At</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedTimeout.cancelledAt)}</p>
                  </div>
                )}

                {selectedTimeout.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm text-muted-foreground">{selectedTimeout.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
