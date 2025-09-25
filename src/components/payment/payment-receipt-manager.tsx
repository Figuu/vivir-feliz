'use client'

import { useState, useEffect, useRef } from 'react'
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
  Upload,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Image,
  File,
  Loader2,
  Plus,
  Search,
  RefreshCw,
  BarChart3,
  Shield,
  Filter,
  Calendar,
  User,
  FileCheck,
  FileX
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePaymentReceipts, ReceiptUploadRequest, ReceiptType, FileType, ReceiptStatus } from '@/hooks/use-payment-receipts'

interface PaymentReceiptManagerProps {
  paymentId?: string
  showUploadForm?: boolean
  showReceiptsList?: boolean
  showStatistics?: boolean
}

export function PaymentReceiptManager({
  paymentId,
  showUploadForm = true,
  showReceiptsList = true,
  showStatistics = true
}: PaymentReceiptManagerProps) {
  const [activeTab, setActiveTab] = useState('upload')
  const [receipts, setReceipts] = useState<any[]>([])
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [showReceiptDetails, setShowReceiptDetails] = useState(false)
  const [receiptStatistics, setReceiptStatistics] = useState<any>(null)
  const [validationResult, setValidationResult] = useState<any>(null)
  
  const [uploadForm, setUploadForm] = useState<ReceiptUploadRequest>({
    paymentId: paymentId || '',
    receiptType: 'PAYMENT_RECEIPT',
    fileName: '',
    fileSize: 0,
    fileType: 'PDF',
    fileData: '',
    description: '',
    metadata: {}
  })
  
  const [filters, setFilters] = useState({
    receiptType: '',
    status: '',
    fileType: '',
    searchTerm: '',
    page: 1,
    limit: 20
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const { 
    uploadReceipt,
    getReceipts,
    getReceipt,
    verifyReceipt,
    deleteReceipt,
    downloadReceipt,
    validateReceipt,
    getReceiptStatistics,
    loading, 
    error 
  } = usePaymentReceipts()

  // Load receipts
  const loadReceipts = async () => {
    if (!paymentId) return
    
    try {
      const result = await getReceipts(paymentId, {
        receiptType: filters.receiptType as ReceiptType || undefined,
        status: filters.status as ReceiptStatus || undefined,
        fileType: filters.fileType as FileType || undefined,
        searchTerm: filters.searchTerm || undefined
      }, {
        page: filters.page,
        limit: filters.limit
      })
      setReceipts(result.receipts)
    } catch (err) {
      console.error('Failed to load receipts:', err)
    }
  }

  // Load receipt statistics
  const loadReceiptStatistics = async () => {
    try {
      const result = await getReceiptStatistics({
        paymentId: paymentId || undefined
      })
      setReceiptStatistics(result)
    } catch (err) {
      console.error('Failed to load receipt statistics:', err)
    }
  }

  useEffect(() => {
    if (showReceiptsList && paymentId) {
      loadReceipts()
    }
  }, [filters, paymentId, showReceiptsList])

  useEffect(() => {
    if (showStatistics) {
      loadReceiptStatistics()
    }
  }, [paymentId, showStatistics])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size cannot exceed 10MB')
      return
    }

    // Get file extension
    const fileExtension = file.name.split('.').pop()?.toUpperCase()
    const allowedTypes = ['PDF', 'JPG', 'JPEG', 'PNG', 'DOC', 'DOCX', 'TXT']
    
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      alert('File type not allowed. Allowed types: PDF, JPG, JPEG, PNG, DOC, DOCX, TXT')
      return
    }

    // Read file as base64
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64Data = e.target?.result as string
      const base64Content = base64Data.split(',')[1] // Remove data:type;base64, prefix
      
      setUploadForm(prev => ({
        ...prev,
        fileName: file.name,
        fileSize: file.size,
        fileType: fileExtension as FileType,
        fileData: base64Content
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleUploadReceipt = async () => {
    try {
      // Validate receipt first
      const validation = await validateReceipt(uploadForm)
      setValidationResult(validation)
      
      if (!validation.isValid) {
        alert(`Validation failed: ${validation.errors.join(', ')}`)
        return
      }

      const result = await uploadReceipt(uploadForm)
      
      // Reset form
      setUploadForm({
        paymentId: paymentId || '',
        receiptType: 'PAYMENT_RECEIPT',
        fileName: '',
        fileSize: 0,
        fileType: 'PDF',
        fileData: '',
        description: '',
        metadata: {}
      })
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Reload receipts
      await loadReceipts()
      
      alert(`Receipt uploaded successfully! Receipt ID: ${result.id}`)
    } catch (err) {
      console.error('Failed to upload receipt:', err)
    }
  }

  const handleViewReceiptDetails = async (receiptId: string) => {
    try {
      const receipt = await getReceipt(receiptId)
      setSelectedReceipt(receipt)
      setShowReceiptDetails(true)
    } catch (err) {
      console.error('Failed to load receipt details:', err)
    }
  }

  const handleVerifyReceipt = async (receiptId: string, isApproved: boolean) => {
    try {
      const comments = prompt(`Enter ${isApproved ? 'approval' : 'rejection'} comments:`)
      if (comments === null) return

      const result = await verifyReceipt(receiptId, isApproved, comments)
      alert(`Receipt ${isApproved ? 'approved' : 'rejected'} successfully!`)
      await loadReceipts()
    } catch (err) {
      console.error('Failed to verify receipt:', err)
    }
  }

  const handleDeleteReceipt = async (receiptId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this receipt?')) return

      await deleteReceipt(receiptId)
      alert('Receipt deleted successfully!')
      await loadReceipts()
    } catch (err) {
      console.error('Failed to delete receipt:', err)
    }
  }

  const handleDownloadReceipt = async (receiptId: string) => {
    try {
      const fileData = await downloadReceipt(receiptId)
      
      // Create download link
      const link = document.createElement('a')
      link.href = `data:${fileData.fileType};base64,${fileData.fileData}`
      link.download = fileData.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Failed to download receipt:', err)
    }
  }

  const getStatusBadge = (status: ReceiptStatus) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
      'UPLOADED': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Upload },
      'VERIFIED': { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
      'REJECTED': { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
      'EXPIRED': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200', icon: AlertCircle }
    }
    
    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getFileIcon = (fileType: FileType) => {
    switch (fileType) {
      case 'PDF':
        return <FileText className="h-4 w-4 text-red-500" />
      case 'JPG':
      case 'JPEG':
      case 'PNG':
        return <Image className="h-4 w-4 text-blue-500" />
      case 'DOC':
      case 'DOCX':
        return <File className="h-4 w-4 text-blue-600" />
      case 'TXT':
        return <FileText className="h-4 w-4 text-gray-500" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Receipt</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        {/* Upload Receipt Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Payment Receipt
              </CardTitle>
              <CardDescription>
                Upload and manage payment receipts with validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentId">Payment ID *</Label>
                  <Input
                    id="paymentId"
                    value={uploadForm.paymentId}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, paymentId: e.target.value }))}
                    placeholder="Payment UUID"
                  />
                </div>
                <div>
                  <Label htmlFor="receiptType">Receipt Type *</Label>
                  <Select value={uploadForm.receiptType} onValueChange={(value: ReceiptType) => setUploadForm(prev => ({ ...prev, receiptType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAYMENT_RECEIPT">Payment Receipt</SelectItem>
                      <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                      <SelectItem value="TRANSACTION_PROOF">Transaction Proof</SelectItem>
                      <SelectItem value="INVOICE">Invoice</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="file">Select File *</Label>
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Allowed types: PDF, JPG, JPEG, PNG, DOC, DOCX, TXT (Max 10MB)
                </p>
              </div>

              {uploadForm.fileName && (
                <div className="p-3 border rounded bg-muted">
                  <div className="flex items-center gap-2">
                    {getFileIcon(uploadForm.fileType)}
                    <span className="font-medium">{uploadForm.fileName}</span>
                    <span className="text-sm text-muted-foreground">
                      ({formatFileSize(uploadForm.fileSize)})
                    </span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for the receipt"
                  rows={2}
                />
              </div>

              <Button
                onClick={handleUploadReceipt}
                disabled={loading || !uploadForm.paymentId || !uploadForm.fileData}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading Receipt...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Receipt
                  </>
                )}
              </Button>

              {validationResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Validation Result:</span>
                    <Badge className={validationResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {validationResult.isValid ? 'Valid' : 'Invalid'}
                    </Badge>
                  </div>
                  {validationResult.errors.length > 0 && (
                    <div>
                      <span className="font-medium text-red-600">Errors:</span>
                      <ul className="list-disc list-inside text-sm text-red-600">
                        {validationResult.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {validationResult.warnings.length > 0 && (
                    <div>
                      <span className="font-medium text-yellow-600">Warnings:</span>
                      <ul className="list-disc list-inside text-sm text-yellow-600">
                        {validationResult.warnings.map((warning: string, index: number) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Payment Receipts
              </CardTitle>
              <CardDescription>
                View and manage uploaded receipts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="searchTerm">Search</Label>
                  <Input
                    id="searchTerm"
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    placeholder="Search receipts..."
                  />
                </div>
                <div>
                  <Label htmlFor="receiptType">Receipt Type</Label>
                  <Select value={filters.receiptType} onValueChange={(value) => setFilters(prev => ({ ...prev, receiptType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="PAYMENT_RECEIPT">Payment Receipt</SelectItem>
                      <SelectItem value="BANK_STATEMENT">Bank Statement</SelectItem>
                      <SelectItem value="TRANSACTION_PROOF">Transaction Proof</SelectItem>
                      <SelectItem value="INVOICE">Invoice</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="UPLOADED">Uploaded</SelectItem>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fileType">File Type</Label>
                  <Select value={filters.fileType} onValueChange={(value) => setFilters(prev => ({ ...prev, fileType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="JPG">JPG</SelectItem>
                      <SelectItem value="JPEG">JPEG</SelectItem>
                      <SelectItem value="PNG">PNG</SelectItem>
                      <SelectItem value="DOC">DOC</SelectItem>
                      <SelectItem value="DOCX">DOCX</SelectItem>
                      <SelectItem value="TXT">TXT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={loadReceipts} disabled={loading || !paymentId} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Receipts...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Receipts
                  </>
                )}
              </Button>

              <Separator />

              {/* Receipts List */}
              <div className="space-y-4">
                {receipts.map((receipt) => (
                  <motion.div
                    key={receipt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {getFileIcon(receipt.fileType)}
                              <span className="font-semibold">{receipt.fileName}</span>
                              {getStatusBadge(receipt.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Type: {receipt.receiptType}</p>
                              <p>Size: {formatFileSize(receipt.fileSize)}</p>
                              <p>Uploaded: {formatDate(receipt.uploadedAt)}</p>
                              {receipt.description && <p>Description: {receipt.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReceiptDetails(receipt.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadReceipt(receipt.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            {receipt.status === 'UPLOADED' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVerifyReceipt(receipt.id, true)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVerifyReceipt(receipt.id, false)}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteReceipt(receipt.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
                Receipt Statistics
              </CardTitle>
              <CardDescription>
                View receipt statistics and analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={loadReceiptStatistics} disabled={loading} className="w-full">
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

              {receiptStatistics && (
                <div className="space-y-6">
                  {/* Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{receiptStatistics.totalReceipts}</div>
                          <div className="text-sm text-muted-foreground">Total Receipts</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatFileSize(receiptStatistics.totalFileSize)}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Size</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatFileSize(receiptStatistics.averageFileSize)}
                          </div>
                          <div className="text-sm text-muted-foreground">Average Size</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">
                            {receiptStatistics.verificationRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Verification Rate</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Status Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Status Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(receiptStatistics.statusBreakdown).map(([status, count]: [string, any]) => (
                          <div key={status} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(status as ReceiptStatus)}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{count}</div>
                              <div className="text-sm text-muted-foreground">receipts</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* File Type Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">File Type Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(receiptStatistics.fileTypeBreakdown).map(([fileType, count]: [string, any]) => (
                          <div key={fileType} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getFileIcon(fileType as FileType)}
                              <span className="font-medium">{fileType}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{count}</div>
                              <div className="text-sm text-muted-foreground">files</div>
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

      {/* Receipt Details Modal */}
      <AnimatePresence>
        {showReceiptDetails && selectedReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowReceiptDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Receipt Details</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowReceiptDetails(false)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Receipt ID</Label>
                    <p className="text-sm text-muted-foreground">{selectedReceipt.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedReceipt.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">File Name</Label>
                    <p className="text-sm text-muted-foreground">{selectedReceipt.fileName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">File Size</Label>
                    <p className="text-sm text-muted-foreground">{formatFileSize(selectedReceipt.fileSize)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Receipt Type</Label>
                    <p className="text-sm text-muted-foreground">{selectedReceipt.receiptType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">File Type</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getFileIcon(selectedReceipt.fileType)}
                      <span>{selectedReceipt.fileType}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Uploaded By</Label>
                    <p className="text-sm text-muted-foreground">{selectedReceipt.uploadedBy}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Uploaded At</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedReceipt.uploadedAt)}</p>
                  </div>
                </div>

                {selectedReceipt.verifiedBy && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Verified By</Label>
                      <p className="text-sm text-muted-foreground">{selectedReceipt.verifiedBy}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Verified At</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedReceipt.verifiedAt ? formatDate(selectedReceipt.verifiedAt) : 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                {selectedReceipt.rejectionReason && (
                  <div>
                    <Label className="text-sm font-medium">Rejection Reason</Label>
                    <p className="text-sm text-muted-foreground">{selectedReceipt.rejectionReason}</p>
                  </div>
                )}

                {selectedReceipt.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground">{selectedReceipt.description}</p>
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
