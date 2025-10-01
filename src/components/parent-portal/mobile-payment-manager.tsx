'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Eye,
  CreditCard
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface MobilePaymentManagerProps {
  patientId: string
  parentId: string
}

interface Payment {
  id: string
  amount: number
  status: string
  dueDate: string
  paidDate?: string
  description: string
  method?: string
  referenceNumber?: string
}

export function MobilePaymentManager({ patientId, parentId }: MobilePaymentManagerProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filter, setFilter] = useState<'pending' | 'paid'>('pending')

  // Fetch payments from API
  const { data: payments = [], isLoading: loading } = useQuery({
    queryKey: ['payments', parentId, filter],
    queryFn: async () => {
      const statusParam = filter === 'pending' ? 'PENDING,SUBMITTED' : 'CONFIRMED'
      const response = await fetch(`/api/payments?parentId=${parentId}&status=${statusParam}`)
      if (!response.ok) {
        throw new Error('Failed to fetch payments')
      }
      const data = await response.json()
      return data.payments.map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        status: p.status.toLowerCase(),
        dueDate: p.dueDate || p.createdAt,
        paidDate: p.reviewedAt,
        description: p.type === 'CONSULTATION' 
          ? 'Consultation Payment' 
          : p.type === 'MONTHLY_PAYMENT'
          ? `Monthly Payment #${p.monthlyPaymentNumber || 1}`
          : 'Therapeutic Services',
        method: p.paymentMethod,
        referenceNumber: p.transactionId
      }))
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment)
    setDetailsOpen(true)
  }

  const handlePayNow = async (payment: Payment) => {
    toast({
      title: "Info",
      description: 'Payment processing would be implemented here'
    })
  }

  const handleDownloadReceipt = async (payment: Payment) => {
    toast({
      title: "Info",
      description: 'Receipt download would be implemented here'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'overdue': return <AlertCircle className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const totalPending = payments
    .filter((p: Payment) => p.status === 'pending')
    .reduce((sum: number, p: Payment) => sum + p.amount, 0)

  const totalPaid = payments
    .filter((p: Payment) => p.status === 'paid')
    .reduce((sum: number, p: Payment) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 sticky top-0 z-10 shadow-md">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-white/80 mb-1">Total Pending</p>
            <p className="text-2xl font-bold">${totalPending.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-white/80 mb-1">Total Paid</p>
            <p className="text-2xl font-bold">${totalPaid.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setFilter('pending')}
            className={`py-4 text-center font-medium transition-colors ${
              filter === 'pending'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`py-4 text-center font-medium transition-colors ${
              filter === 'paid'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground'
            }`}
          >
            Paid
          </button>
        </div>
      </div>

      {/* Payments List */}
      <div className="p-4 space-y-3 pb-24">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Payments</h3>
              <p className="text-muted-foreground text-sm">
                No {filter} payments found.
              </p>
            </CardContent>
          </Card>
        ) : (
          payments.map((payment: Payment, index: number) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={`${getStatusColor(payment.status)} text-xs`}>
                            {getStatusIcon(payment.status)}
                            <span className="ml-1">{payment.status}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{payment.description}</p>
                        <p className="text-2xl font-bold text-green-600">${payment.amount.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Due: {new Date(payment.dueDate).toLocaleDateString()}</span>
                      </div>
                      {payment.paidDate && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span>Paid: {new Date(payment.paidDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t bg-gray-50 p-3 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewDetails(payment)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {payment.status === 'pending' ? (
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handlePayNow(payment)}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pay Now
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleDownloadReceipt(payment)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Payment Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-[95vw] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">Payment Details</DialogTitle>
            <DialogDescription className="text-sm">
              Transaction Information
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="space-y-4 py-2">
              {/* Amount */}
              <div className="text-center py-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Amount</p>
                <p className="text-3xl font-bold text-green-600">${selectedPayment.amount.toFixed(2)}</p>
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">
                <Badge className={`${getStatusColor(selectedPayment.status)} text-sm py-1 px-3`}>
                  {getStatusIcon(selectedPayment.status)}
                  <span className="ml-1">{selectedPayment.status}</span>
                </Badge>
              </div>

              {/* Details */}
              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedPayment.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="font-medium">{new Date(selectedPayment.dueDate).toLocaleDateString()}</p>
                  </div>
                  {selectedPayment.paidDate && (
                    <div>
                      <p className="text-xs text-muted-foreground">Paid Date</p>
                      <p className="font-medium text-green-600">{new Date(selectedPayment.paidDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {selectedPayment.method && (
                  <div>
                    <p className="text-xs text-muted-foreground">Payment Method</p>
                    <p className="font-medium">{selectedPayment.method}</p>
                  </div>
                )}

                {selectedPayment.referenceNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">Reference Number</p>
                    <p className="font-medium font-mono text-sm">{selectedPayment.referenceNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedPayment?.status === 'pending' ? (
              <Button className="w-full" onClick={() => selectedPayment && handlePayNow(selectedPayment)}>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            ) : (
              <Button variant="outline" className="w-full" onClick={() => selectedPayment && handleDownloadReceipt(selectedPayment)}>
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
