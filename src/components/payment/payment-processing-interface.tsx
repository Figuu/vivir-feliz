'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CreditCard, 
  DollarSign, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  FileText,
  Camera,
  Trash2,
  Eye
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePaymentProcessing, PaymentMethod, PaymentStatus } from '@/hooks/use-payment-processing'

interface PaymentProcessingInterfaceProps {
  consultationRequestId: string
  consultationDetails?: {
    patientName: string
    specialty: string
    amount: number
    currency: string
  }
  onPaymentComplete?: (paymentId: string) => void
  onPaymentCancel?: () => void
}

export function PaymentProcessingInterface({
  consultationRequestId,
  consultationDetails,
  onPaymentComplete,
  onPaymentCancel
}: PaymentProcessingInterfaceProps) {
  const [paymentForm, setPaymentForm] = useState({
    amount: consultationDetails?.amount || 0,
    currency: consultationDetails?.currency || 'USD',
    paymentMethod: 'CASH' as PaymentMethod,
    description: '',
    transactionId: '',
    notes: ''
  })
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [currentPayment, setCurrentPayment] = useState<any>(null)
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { 
    processPayment, 
    completePayment, 
    uploadReceipt,
    loading, 
    error 
  } = usePaymentProcessing()

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentForm(prev => ({ ...prev, paymentMethod: method }))
    
    // Show receipt upload for certain payment methods
    if (['CASH', 'CHECK', 'BANK_TRANSFER'].includes(method)) {
      setShowReceiptUpload(true)
    } else {
      setShowReceiptUpload(false)
    }
  }

  const handleReceiptFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setReceiptFile(file)
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setReceiptPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setReceiptPreview(null)
      }
    }
  }

  const handleRemoveReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleProcessPayment = async () => {
    try {
      // Process payment
      const paymentResult = await processPayment({
        consultationRequestId,
        paymentDetails: {
          amount: paymentForm.amount,
          currency: paymentForm.currency,
          paymentMethod: paymentForm.paymentMethod,
          description: paymentForm.description || `Payment for ${consultationDetails?.specialty} consultation`
        },
        processedBy: 'user' // This would come from auth context
      })

      setCurrentPayment(paymentResult)

      // Complete payment if it's not cash/check (which need manual completion)
      if (!['CASH', 'CHECK'].includes(paymentForm.paymentMethod)) {
        await completePayment({
          paymentId: paymentResult.paymentId,
          transactionId: paymentForm.transactionId || undefined,
          completedBy: 'user'
        })
      }

      // Upload receipt if provided
      if (receiptFile && currentPayment) {
        await uploadReceipt({
          paymentId: paymentResult.paymentId,
          file: receiptFile,
          uploadedBy: 'user'
        })
      }

      onPaymentComplete?.(paymentResult.paymentId)
    } catch (err) {
      console.error('Payment processing failed:', err)
    }
  }

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH':
        return <DollarSign className="h-4 w-4" />
      case 'CARD':
        return <CreditCard className="h-4 w-4" />
      case 'BANK_TRANSFER':
        return <FileText className="h-4 w-4" />
      case 'CHECK':
        return <FileText className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getPaymentStatusBadge = (status: PaymentStatus) => {
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Consultation Details */}
      {consultationDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Consultation Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Patient</Label>
                <p className="text-sm text-muted-foreground">{consultationDetails.patientName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Specialty</Label>
                <p className="text-sm text-muted-foreground">{consultationDetails.specialty}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Amount</Label>
                <p className="text-lg font-semibold">
                  {formatCurrency(consultationDetails.amount, consultationDetails.currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
          <CardDescription>
            Enter payment details and process the transaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={paymentForm.currency} onValueChange={(value) => setPaymentForm(prev => ({ ...prev, currency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select value={paymentForm.paymentMethod} onValueChange={handlePaymentMethodChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cash
                  </div>
                </SelectItem>
                <SelectItem value="CARD">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Credit/Debit Card
                  </div>
                </SelectItem>
                <SelectItem value="BANK_TRANSFER">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Bank Transfer
                  </div>
                </SelectItem>
                <SelectItem value="CHECK">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Check
                  </div>
                </SelectItem>
                <SelectItem value="OTHER">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Other
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentForm.paymentMethod === 'CARD' && (
            <div>
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionId: e.target.value }))}
                placeholder="Enter transaction ID"
              />
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={paymentForm.description}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Payment description (optional)"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes (optional)"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Receipt Upload */}
      <AnimatePresence>
        {showReceiptUpload && (
          <motion.div
            initial={{ opacity: 0, blockSize: 0 }}
            animate={{ opacity: 1, blockSize: 'auto' }}
            exit={{ opacity: 0, blockSize: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Receipt Upload
                </CardTitle>
                <CardDescription>
                  Upload a receipt for this payment (required for cash, check, and bank transfer)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="receipt">Receipt File</Label>
                  <Input
                    ref={fileInputRef}
                    id="receipt"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleReceiptFileChange}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepted formats: JPEG, PNG, GIF, PDF (max 10MB)
                  </p>
                </div>

                {receiptFile && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {receiptPreview ? (
                          <img
                            src={receiptPreview}
                            alt="Receipt preview"
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        )}
                        <div>
                          <p className="font-medium">{receiptFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(receiptPreview || '', '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveReceipt}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount:</span>
              <span className="font-medium">
                {formatCurrency(paymentForm.amount, paymentForm.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment Method:</span>
              <div className="flex items-center gap-2">
                {getPaymentMethodIcon(paymentForm.paymentMethod)}
                <span className="font-medium">{paymentForm.paymentMethod.replace('_', ' ')}</span>
              </div>
            </div>
            {receiptFile && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Receipt:</span>
                <Badge variant="outline" className="text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Uploaded
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleProcessPayment}
          disabled={loading || paymentForm.amount <= 0 || (showReceiptUpload && !receiptFile)}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Process Payment
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onPaymentCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>

      {/* Current Payment Status */}
      {currentPayment && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Payment Processed</h4>
                <p className="text-sm text-muted-foreground">
                  Payment ID: {currentPayment.paymentId}
                </p>
              </div>
              {getPaymentStatusBadge(currentPayment.status)}
            </div>
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
