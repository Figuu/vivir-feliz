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
  Eye,
  Search,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'
import { PaymentPlanManager } from '@/components/payment/payment-plan-manager'
import { usePaymentPlanManagement, PaymentPlanStatus, PaymentPlanType, PaymentPlanFrequency } from '@/hooks/use-payment-plan-management'

export default function TestPaymentPlanManagementPage() {
  const [activeTab, setActiveTab] = useState('manager')
  const [paymentPlans, setPaymentPlans] = useState<any[]>([])
  const [paymentPlanStatistics, setPaymentPlanStatistics] = useState<any>(null)
  const [overduePayments, setOverduePayments] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)

  const { 
    getPaymentPlans,
    getPaymentPlanStatistics,
    getOverduePayments,
    getPaymentPlan,
    loading, 
    error 
  } = usePaymentPlanManagement()

  const handleFetchPaymentPlans = async () => {
    try {
      const result = await getPaymentPlans({
        page: 1,
        limit: 20
      })
      setPaymentPlans(result.plans)
    } catch (err) {
      console.error('Failed to fetch payment plans:', err)
    }
  }

  const handleFetchStatistics = async () => {
    try {
      const result = await getPaymentPlanStatistics()
      setPaymentPlanStatistics(result)
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
    }
  }

  const handleFetchOverduePayments = async () => {
    try {
      const result = await getOverduePayments()
      setOverduePayments(result)
    } catch (err) {
      console.error('Failed to fetch overdue payments:', err)
    }
  }

  const handleViewPlanDetails = async (planId: string) => {
    try {
      const result = await getPaymentPlan(planId)
      setSelectedPlan(result)
      setActiveTab('plan-details')
    } catch (err) {
      console.error('Failed to fetch plan details:', err)
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payment Plan Management Test</h1>
          <p className="text-muted-foreground">
            Test the monthly payment plan management system
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="manager">Plan Manager</TabsTrigger>
            <TabsTrigger value="plans">All Plans</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="plan-details">Plan Details</TabsTrigger>
          </TabsList>

          {/* Plan Manager Tab */}
          <TabsContent value="manager" className="space-y-6">
            <PaymentPlanManager
              onPlanCreated={(planId) => {
                alert(`Payment plan created successfully! Plan ID: ${planId}`)
                handleFetchPaymentPlans()
              }}
              showCreateForm={true}
              showPlansList={true}
            />
          </TabsContent>

          {/* All Plans Tab */}
          <TabsContent value="plans" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  All Payment Plans
                </CardTitle>
                <CardDescription>
                  View and manage all payment plans
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleFetchPaymentPlans} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading Plans...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Fetch Payment Plans
                    </>
                  )}
                </Button>

                <Separator />

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
                                <p>Therapist: {plan.therapist?.firstName} {plan.therapist?.lastName}</p>
                                <p>Total: {formatCurrency(plan.totalAmount)}</p>
                                <p>Progress: {plan.paidInstallments}/{plan.totalInstallments} installments</p>
                                <p>Next Payment: {formatDate(plan.nextPaymentDate)}</p>
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

          {/* Overdue Tab */}
          <TabsContent value="overdue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Overdue Payments
                </CardTitle>
                <CardDescription>
                  View payments that are overdue and need attention
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleFetchOverduePayments} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Check Overdue Payments
                    </>
                  )}
                </Button>

                {overduePayments && (
                  <div className="space-y-4">
                    {/* Overdue Plans */}
                    {overduePayments.overduePlans.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            Overdue Plans ({overduePayments.overduePlans.length})
                          </CardTitle>
                          <CardDescription>
                            Payment plans with overdue next payments
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {overduePayments.overduePlans.map((plan: any) => (
                              <div key={plan.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <span className="font-medium">{plan.planName}</span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    {plan.patient?.firstName} {plan.patient?.lastName}
                                  </span>
                                </div>
                                <Badge variant="destructive">Overdue</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Overdue Installments */}
                    {overduePayments.overdueInstallments.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            Overdue Installments ({overduePayments.overdueInstallments.length})
                          </CardTitle>
                          <CardDescription>
                            Individual installments that are overdue
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {overduePayments.overdueInstallments.map((installment: any) => (
                              <div key={installment.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <span className="font-medium">
                                    {installment.paymentPlan?.patient?.firstName} {installment.paymentPlan?.patient?.lastName}
                                  </span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    Installment #{installment.installmentNumber} - {formatCurrency(installment.amount)}
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

          {/* Statistics Tab */}
          <TabsContent value="statistics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Payment Plan Statistics
                </CardTitle>
                <CardDescription>
                  View payment plan statistics and analytics
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

                {paymentPlanStatistics && (
                  <div className="space-y-6">
                    {/* Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{paymentPlanStatistics.totalPlans}</div>
                            <div className="text-sm text-muted-foreground">Total Plans</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {paymentPlanStatistics.activePlans}
                            </div>
                            <div className="text-sm text-muted-foreground">Active Plans</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {paymentPlanStatistics.completedPlans}
                            </div>
                            <div className="text-sm text-muted-foreground">Completed Plans</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {paymentPlanStatistics.overduePlans}
                            </div>
                            <div className="text-sm text-muted-foreground">Overdue Plans</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Revenue */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {formatCurrency(paymentPlanStatistics.totalRevenue)}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Revenue</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {formatCurrency(paymentPlanStatistics.pendingRevenue)}
                            </div>
                            <div className="text-sm text-muted-foreground">Pending Revenue</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {formatCurrency(paymentPlanStatistics.averagePlanValue)}
                            </div>
                            <div className="text-sm text-muted-foreground">Average Plan Value</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Performance */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">
                            {paymentPlanStatistics.completionRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Completion Rate</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plan Details Tab */}
          <TabsContent value="plan-details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Plan Details
                </CardTitle>
                <CardDescription>
                  Detailed view of a specific payment plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedPlan ? (
                  <div className="space-y-6">
                    {/* Plan Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Plan Name</Label>
                        <p className="text-sm text-muted-foreground">{selectedPlan.planName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-1">
                          {getStatusBadge(selectedPlan.status)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Total Amount</Label>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(selectedPlan.totalAmount)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Frequency</Label>
                        <p className="text-sm text-muted-foreground">{selectedPlan.frequency}</p>
                      </div>
                    </div>

                    {/* Patient Information */}
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3">Patient Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Patient</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedPlan.patient?.firstName} {selectedPlan.patient?.lastName}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Therapist</Label>
                          <p className="text-sm text-muted-foreground">
                            {selectedPlan.therapist?.firstName} {selectedPlan.therapist?.lastName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Installments */}
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3">Installment Schedule</h4>
                      <div className="space-y-2">
                        {selectedPlan.installments?.map((installment: any) => (
                          <div key={installment.id} className="flex items-center justify-between p-2 border rounded">
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
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Plan Selected</h3>
                    <p className="text-muted-foreground">
                      Select a plan from the All Plans tab to view details
                    </p>
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
