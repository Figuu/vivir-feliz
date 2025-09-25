'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  FileX,
  Receipt,
  Database,
  TestTube
} from 'lucide-react'
import { motion } from 'framer-motion'
import { PaymentReceiptManager } from '@/components/payment/payment-receipt-manager'
import { usePaymentReceipts, ReceiptUploadRequest, ReceiptType, FileType, ReceiptStatus } from '@/hooks/use-payment-receipts'

export default function TestPaymentReceiptsPage() {
  const [activeTab, setActiveTab] = useState('component')
  const [receipts, setReceipts] = useState<any[]>([])
  const [receiptStatistics, setReceiptStatistics] = useState<any>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [validationResult, setValidationResult] = useState<any>(null)

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

  const handleUploadTestReceipt = async () => {
    try {
      const receiptRequest: ReceiptUploadRequest = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000', // Sample UUID
        receiptType: 'PAYMENT_RECEIPT',
        fileName: 'test-receipt.pdf',
        fileSize: 1024, // 1KB
        fileType: 'PDF',
        fileData: 'dGVzdC1maWxlLWRhdGE=', // Base64 encoded "test-file-data"
        description: 'Test receipt upload'
      }

      const result = await uploadReceipt(receiptRequest)
      alert(`Receipt uploaded successfully! Receipt ID: ${result.id}`)
    } catch (err) {
      console.error('Failed to upload receipt:', err)
    }
  }

  const handleFetchReceipts = async () => {
    try {
      const result = await getReceipts('550e8400-e29b-41d4-a716-446655440000', {
        page: 1,
        limit: 20
      })
      setReceipts(result.receipts)
    } catch (err) {
      console.error('Failed to fetch receipts:', err)
    }
  }

  const handleFetchStatistics = async () => {
    try {
      const result = await getReceiptStatistics()
      setReceiptStatistics(result)
    } catch (err) {
      console.error('Failed to fetch statistics:', err)
    }
  }

  const handleValidateReceipt = async () => {
    try {
      const receiptRequest: ReceiptUploadRequest = {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        receiptType: 'PAYMENT_RECEIPT',
        fileName: 'test-receipt.pdf',
        fileSize: 1024,
        fileType: 'PDF',
        fileData: 'dGVzdC1maWxlLWRhdGE=',
        description: 'Test receipt validation'
      }

      const result = await validateReceipt(receiptRequest)
      setValidationResult(result)
    } catch (err) {
      console.error('Failed to validate receipt:', err)
    }
  }

  const handleVerifyReceipt = async (receiptId: string, isApproved: boolean) => {
    try {
      const result = await verifyReceipt(receiptId, isApproved, 'Test verification')
      alert(`Receipt ${isApproved ? 'approved' : 'rejected'} successfully!`)
    } catch (err) {
      console.error('Failed to verify receipt:', err)
    }
  }

  const handleDeleteReceipt = async (receiptId: string) => {
    try {
      const result = await deleteReceipt(receiptId)
      if (result) {
        alert('Receipt deleted successfully!')
      }
    } catch (err) {
      console.error('Failed to delete receipt:', err)
    }
  }

  const handleDownloadReceipt = async (receiptId: string) => {
    try {
      const result = await downloadReceipt(receiptId)
      alert(`Receipt downloaded: ${result.fileName} (${result.fileSize} bytes)`)
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Payment Receipt Management Test</h1>
          <p className="text-muted-foreground">
            Test the comprehensive payment receipt storage and management system
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="component">Component Test</TabsTrigger>
            <TabsTrigger value="api">API Test</TabsTrigger>
          </TabsList>

          {/* Component Test Tab */}
          <TabsContent value="component" className="space-y-6">
            <PaymentReceiptManager
              paymentId="550e8400-e29b-41d4-a716-446655440000"
              showUploadForm={true}
              showReceiptsList={true}
              showStatistics={true}
            />
          </TabsContent>

          {/* API Test Tab */}
          <TabsContent value="api" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Receipt Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Receipt Upload API
                  </CardTitle>
                  <CardDescription>
                    Test receipt upload with validation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleUploadTestReceipt} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading Receipt...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Test Receipt
                      </>
                    )}
                  </Button>

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    <p>This will upload a test receipt with:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Payment ID: 550e8400-e29b-41d4-a716-446655440000</li>
                      <li>Type: Payment Receipt</li>
                      <li>File: test-receipt.pdf (1KB)</li>
                      <li>Format: PDF</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Receipt Validation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Receipt Validation API
                  </CardTitle>
                  <CardDescription>
                    Test receipt upload validation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleValidateReceipt} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <Shield className="mr-2 h-4 w-4" />
                        Validate Receipt Request
                      </>
                    )}
                  </Button>

                  <Separator />

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

              {/* Receipt Listing */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Receipt Listing API
                  </CardTitle>
                  <CardDescription>
                    Test receipt retrieval with filtering
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleFetchReceipts} disabled={loading} className="w-full">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading Receipts...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Fetch Receipts
                      </>
                    )}
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-semibold">Recent Receipts ({receipts.length})</h4>
                    {receipts.slice(0, 3).map((receipt) => (
                      <div key={receipt.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {getFileIcon(receipt.fileType)}
                          <span className="font-medium">{receipt.fileName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(receipt.status)}
                          <span className="text-sm text-muted-foreground">
                            {formatFileSize(receipt.fileSize)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Receipt Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Receipt Statistics API
                  </CardTitle>
                  <CardDescription>
                    Test receipt statistics and analytics
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
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Fetch Statistics
                      </>
                    )}
                  </Button>

                  <Separator />

                  {receiptStatistics && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
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
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-semibold">Status Breakdown</h4>
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
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Receipt Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Receipt Operations API
                  </CardTitle>
                  <CardDescription>
                    Test receipt verification and management
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="receiptId">Receipt ID</Label>
                    <Input
                      id="receiptId"
                      placeholder="Enter receipt ID to test operations"
                      onChange={(e) => setSelectedReceipt({ id: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => selectedReceipt?.id && handleVerifyReceipt(selectedReceipt.id, true)} 
                      disabled={loading || !selectedReceipt?.id}
                      variant="outline"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button 
                      onClick={() => selectedReceipt?.id && handleVerifyReceipt(selectedReceipt.id, false)} 
                      disabled={loading || !selectedReceipt?.id}
                      variant="outline"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => selectedReceipt?.id && handleDownloadReceipt(selectedReceipt.id)} 
                      disabled={loading || !selectedReceipt?.id}
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      onClick={() => selectedReceipt?.id && handleDeleteReceipt(selectedReceipt.id)} 
                      disabled={loading || !selectedReceipt?.id}
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    <p>Enter a receipt ID above to test:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Receipt verification (approve/reject)</li>
                      <li>Receipt download</li>
                      <li>Receipt deletion</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* API Endpoints Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    API Endpoints
                  </CardTitle>
                  <CardDescription>
                    Available receipt management API endpoints
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm">/api/payments/[id]/receipts</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/payments/[id]/receipts</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/payments/receipts/[id]</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">DELETE</Badge>
                      <code className="text-sm">/api/payments/receipts/[id]</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm">/api/payments/receipts/[id]/verify</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/payments/receipts/[id]/download</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">POST</Badge>
                      <code className="text-sm">/api/payments/receipts/validate</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">GET</Badge>
                      <code className="text-sm">/api/payments/receipts/statistics</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
