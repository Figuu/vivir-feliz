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
import { Progress } from '@/components/ui/progress'
import { 
  Calendar,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Play,
  User,
  FileText,
  TrendingUp,
  Loader2,
  Plus,
  Edit,
  Eye
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePaymentPlanManagement, PaymentPlanStatus, PaymentPlanType, PaymentPlanFrequency } from '@/hooks/use-payment-plan-management'

interface PaymentPlanManagerProps {
  patientId?: string
  therapistId?: string
  onPlanCreated?: (planId: string) => void
  showCreateForm?: boolean
  showPlansList?: boolean
}

export function PaymentPlanManager({
  patientId,
  therapistId,
  onPlanCreated,
  showCreateForm = true,
  showPlansList = true
}: PaymentPlanManagerProps) {
  const [activeTab, setActiveTab] = useState('create')
  const [paymentPlans, setPaymentPlans] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [showPlanDetails, setShowPlanDetails] = useState(false)
  
  const [createForm, setCreateForm] = useState({
    patientId: patientId || '',
    therapistId: therapistId || '',
    serviceId: '',
    planName: '',
    planType: 'MONTHLY' as PaymentPlanType,
    frequency: 'MONTHLY' as PaymentPlanFrequency,
    totalAmount: 0,
    startDate: '',
    autoPay: false,
    description: ''
  })

  const { 
    createPaymentPlan,
    getPaymentPlans,
    getPaymentPlan,
    updatePaymentPlanStatus,
    loading, 
    error 
  } = usePaymentPlanManagement()

  // Load payment plans
  const loadPaymentPlans = async () => {
    try {
      const filters: any = {}
      if (patientId) filters.patientId = patientId
      if (therapistId) filters.therapistId = therapistId
      
      const result = await getPaymentPlans(filters)
      setPaymentPlans(result.plans)
    } catch (err) {
      console.error('Failed to load payment plans:', err)
    }
  }

  useEffect(() => {
    if (showPlansList) {
      loadPaymentPlans()
    }
  }, [patientId, therapistId, showPlansList])

  const handleCreatePaymentPlan = async () => {
    try {
      const result = await createPaymentPlan({
        ...createForm,
        startDate: createForm.startDate || new Date().toISOString()
      })
      
      // Reset form
      setCreateForm({
        patientId: patientId || '',
        therapistId: therapistId || '',
        serviceId: '',
        planName: '',
        planType: 'MONTHLY',
        frequency: 'MONTHLY',
        totalAmount: 0,
        startDate: '',
        autoPay: false,
        description: ''
      })
      
      // Reload plans
      await loadPaymentPlans()
      
      // Notify parent
      onPlanCreated?.(result.id)
    } catch (err) {
      console.error('Failed to create payment plan:', err)
    }
  }

  const handleViewPlanDetails = async (planId: string) => {
    try {
      const plan = await getPaymentPlan(planId)
      setSelectedPlan(plan)
      setShowPlanDetails(true)
    } catch (err) {
      console.error('Failed to load plan details:', err)
    }
  }

  const handleUpdatePlanStatus = async (planId: string, status: PaymentPlanStatus) => {
    try {
      await updatePaymentPlanStatus({
        paymentPlanId: planId,
        status,
        reason: `Status updated to ${status.toLowerCase()}`
      })
      
      // Reload plans
      await loadPaymentPlans()
      
      // Update selected plan if it's the same
      if (selectedPlan && selectedPlan.id === planId) {
        setSelectedPlan(prev => ({ ...prev, status }))
      }
    } catch (err) {
      console.error('Failed to update plan status:', err)
    }
  }

  const getStatusBadge = (status: PaymentPlanStatus) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: Play },
      'PAUSED': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Pause },
      'COMPLETED': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: CheckCircle },
      'CANCELLED': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      'OVERDUE': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200', icon: AlertCircle }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date))
  }

  const getProgressPercentage = (paid: number, total: number) => {
    return total > 0 ? (paid / total) * 100 : 0
  }

  return (
    <div className="space-y-6">
      {/* Create Payment Plan Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create Payment Plan
            </CardTitle>
            <CardDescription>
              Create a new payment plan for therapy services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planName">Plan Name *</Label>
                <Input
                  id="planName"
                  value={createForm.planName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, planName: e.target.value }))}
                  placeholder="e.g., Monthly Speech Therapy"
                />
              </div>
              <div>
                <Label htmlFor="totalAmount">Total Amount *</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={createForm.totalAmount}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="planType">Plan Type</Label>
                <Select value={createForm.planType} onValueChange={(value: PaymentPlanType) => setCreateForm(prev => ({ ...prev, planType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="SEMESTER">Semester</SelectItem>
                    <SelectItem value="ANNUAL">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="frequency">Payment Frequency</Label>
                <Select value={createForm.frequency} onValueChange={(value: PaymentPlanFrequency) => setCreateForm(prev => ({ ...prev, frequency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description for the payment plan"
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoPay"
                checked={createForm.autoPay}
                onChange={(e) => setCreateForm(prev => ({ ...prev, autoPay: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="autoPay">Enable Auto Pay</Label>
            </div>

            <Button
              onClick={handleCreatePaymentPlan}
              disabled={loading || !createForm.planName || createForm.totalAmount <= 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Plan...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Payment Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Plans List */}
      {showPlansList && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payment Plans
            </CardTitle>
            <CardDescription>
              Manage existing payment plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentPlans.length > 0 ? (
              <div className="space-y-4">
                {paymentPlans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{plan.planName}</h4>
                              {getStatusBadge(plan.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Patient: {plan.patient?.firstName} {plan.patient?.lastName}</p>
                              <p>Total: {formatCurrency(plan.totalAmount)}</p>
                              <p>Progress: {plan.paidInstallments}/{plan.totalInstallments} installments</p>
                            </div>
                            <div className="w-full">
                              <Progress value={getProgressPercentage(plan.paidInstallments, plan.totalInstallments)} className="h-2" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPlanDetails(plan.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {plan.status === 'ACTIVE' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdatePlanStatus(plan.id, 'PAUSED')}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            )}
                            {plan.status === 'PAUSED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdatePlanStatus(plan.id, 'ACTIVE')}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payment Plans</h3>
                <p className="text-muted-foreground">
                  No payment plans found for the current filters
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan Details Modal */}
      <AnimatePresence>
        {showPlanDetails && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowPlanDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">{selectedPlan.planName}</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowPlanDetails(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Plan Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Plan Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-1">
                          {getStatusBadge(selectedPlan.status)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Total Amount</Label>
                        <p className="text-lg font-semibold">
                          {formatCurrency(selectedPlan.totalAmount)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Installment Amount</Label>
                        <p className="text-lg font-semibold">
                          {formatCurrency(selectedPlan.installmentAmount)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Frequency</Label>
                        <p className="text-sm">{selectedPlan.frequency}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">
                          {selectedPlan.paidInstallments} of {selectedPlan.totalInstallments} installments
                        </span>
                      </div>
                      <Progress value={getProgressPercentage(selectedPlan.paidInstallments, selectedPlan.totalInstallments)} className="h-3" />
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {selectedPlan.paidInstallments}
                          </div>
                          <div className="text-sm text-muted-foreground">Paid</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedPlan.remainingInstallments}
                          </div>
                          <div className="text-sm text-muted-foreground">Remaining</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(selectedPlan.totalAmount)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Installments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Installment Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedPlan.installments?.map((installment: any) => (
                        <div key={installment.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">
                              #{installment.installmentNumber}
                            </div>
                            <div>
                              <div className="font-medium">
                                {formatCurrency(installment.amount)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Due: {formatDate(installment.dueDate)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {installment.status === 'PAID' ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Paid
                              </Badge>
                            ) : installment.status === 'OVERDUE' ? (
                              <Badge className="bg-red-100 text-red-800">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
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


