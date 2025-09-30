'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Calendar, DollarSign, Edit } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

export function ConfirmationWorkflowDashboard() {
  const [loading, setLoading] = useState(false)
  const [statistics, setStatistics] = useState<any>(null)
  const [consultations, setConsultations] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [action, setAction] = useState<string>('')
  const [actionData, setActionData] = useState<any>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsRes, consultsRes, paymentsRes] = await Promise.all([
        fetch('/api/confirmation-workflows?action=statistics'),
        fetch('/api/confirmation-workflows?type=consultation&status=pending'),
        fetch('/api/confirmation-workflows?type=payment&status=pending')
      ])

      const [stats, consults, pymnts] = await Promise.all([
        statsRes.json(),
        consultsRes.json(),
        paymentsRes.json()
      ])

      if (statsRes.ok) setStatistics(stats.data)
      if (consultsRes.ok) setConsultations(consults.data.items || [])
      if (paymentsRes.ok) setPayments(pymnts.data.items || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/confirmation-workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedItem.type,
          ...(selectedItem.type === 'consultation' ? {
            consultationId: selectedItem.id,
            action,
            confirmedBy: 'admin-1',
            ...actionData
          } : {
            paymentId: selectedItem.id,
            action,
            confirmedBy: 'admin-1',
            ...actionData
          })
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process confirmation')
      }

      toast({
        title: "Success",
        description: result.message
      })
      setDialogOpen(false)
      setSelectedItem(null)
      setActionData({})
      loadData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process confirmation'
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (item: any, actionType: string) => {
    setSelectedItem(item)
    setAction(actionType)
    setDialogOpen(true)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Consultations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.pendingConsultations}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.pendingPayments}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Confirmed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.confirmedToday}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.overdueConfirmations}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="consultations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="consultations">Consultations ({consultations.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="consultations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Consultation Confirmations</CardTitle>
            </CardHeader>
            <CardContent>
              {consultations.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No pending consultations</p>
              ) : (
                <div className="space-y-3">
                  {consultations.map((consultation) => (
                    <motion.div key={consultation.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{consultation.patient.firstName} {consultation.patient.lastName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {consultation.scheduledDate && new Date(consultation.scheduledDate).toLocaleDateString()} at {consultation.scheduledTime}
                          </p>
                          <p className="text-sm">Therapist: {consultation.therapist?.firstName} {consultation.therapist?.lastName}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" onClick={() => openDialog(consultation, 'confirm')}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openDialog(consultation, 'reschedule')}>
                            <Calendar className="h-4 w-4 mr-1" />
                            Reschedule
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openDialog(consultation, 'cancel')}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payment Confirmations</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No pending payments</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <motion.div key={payment.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{payment.patient.firstName} {payment.patient.lastName}</h4>
                          <p className="text-sm text-muted-foreground">Amount: ${payment.amount?.toFixed(2)}</p>
                          <p className="text-sm">Method: {payment.paymentMethod}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" onClick={() => openDialog(payment, 'confirm')}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openDialog(payment, 'request_correction')}>
                            <Edit className="h-4 w-4 mr-1" />
                            Request Correction
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openDialog(payment, 'reject')}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action.charAt(0).toUpperCase() + action.slice(1)} {selectedItem?.type}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {action === 'reschedule' && (
              <>
                <div>
                  <Label>New Date</Label>
                  <Input
                    type="date"
                    value={actionData.newDate || ''}
                    onChange={(e) => setActionData({ ...actionData, newDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>New Time</Label>
                  <Input
                    type="time"
                    value={actionData.newTime || ''}
                    onChange={(e) => setActionData({ ...actionData, newTime: e.target.value })}
                  />
                </div>
              </>
            )}
            
            {action === 'cancel' && (
              <div>
                <Label>Cancellation Reason *</Label>
                <Textarea
                  value={actionData.cancellationReason || ''}
                  onChange={(e) => setActionData({ ...actionData, cancellationReason: e.target.value })}
                  rows={3}
                  maxLength={500}
                />
              </div>
            )}
            
            {action === 'confirm' && selectedItem?.type === 'payment' && (
              <>
                <div>
                  <Label>Confirmed Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={actionData.confirmedAmount || selectedItem.amount}
                    onChange={(e) => setActionData({ ...actionData, confirmedAmount: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Transaction Reference</Label>
                  <Input
                    value={actionData.transactionReference || ''}
                    onChange={(e) => setActionData({ ...actionData, transactionReference: e.target.value })}
                    maxLength={100}
                  />
                </div>
              </>
            )}
            
            {action === 'reject' && (
              <div>
                <Label>Rejection Reason *</Label>
                <Textarea
                  value={actionData.rejectionReason || ''}
                  onChange={(e) => setActionData({ ...actionData, rejectionReason: e.target.value })}
                  rows={3}
                  maxLength={500}
                />
              </div>
            )}
            
            {action === 'request_correction' && (
              <div>
                <Label>Correction Notes *</Label>
                <Textarea
                  value={actionData.correctionNotes || ''}
                  onChange={(e) => setActionData({ ...actionData, correctionNotes: e.target.value })}
                  rows={4}
                  maxLength={1000}
                />
              </div>
            )}
            
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={actionData.notes || ''}
                onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                rows={2}
                maxLength={1000}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAction} disabled={loading}>
              {loading ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
