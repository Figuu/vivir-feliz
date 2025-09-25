import { useState, useCallback } from 'react'

export type ReceiptStatus = 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED' | 'EXPIRED'
export type ReceiptType = 'PAYMENT_RECEIPT' | 'BANK_STATEMENT' | 'TRANSACTION_PROOF' | 'INVOICE' | 'OTHER'
export type FileType = 'PDF' | 'JPG' | 'JPEG' | 'PNG' | 'DOC' | 'DOCX' | 'TXT'

export interface ReceiptUploadRequest {
  paymentId: string
  receiptType: ReceiptType
  fileName: string
  fileSize: number
  fileType: FileType
  fileData: string // Base64 encoded file data
  description?: string
  metadata?: Record<string, any>
}

export interface ReceiptRecord {
  id: string
  paymentId: string
  receiptType: ReceiptType
  fileName: string
  fileSize: number
  fileType: FileType
  filePath: string
  status: ReceiptStatus
  description?: string
  uploadedBy: string
  uploadedAt: Date
  verifiedBy?: string
  verifiedAt?: Date
  rejectionReason?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ReceiptValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  fileInfo: {
    size: number
    type: string
    isValidFormat: boolean
    isValidSize: boolean
  }
}

export interface ReceiptSearchFilters {
  paymentId?: string
  receiptType?: ReceiptType
  status?: ReceiptStatus
  uploadedBy?: string
  dateRange?: { start: string; end: string }
  fileType?: FileType
  searchTerm?: string
}

export interface UsePaymentReceiptsReturn {
  // Receipt operations
  uploadReceipt: (request: ReceiptUploadRequest) => Promise<ReceiptRecord>
  getReceipt: (receiptId: string) => Promise<ReceiptRecord>
  getReceipts: (paymentId: string, filters?: ReceiptSearchFilters, pagination?: { page: number; limit: number }) => Promise<{
    receipts: any[]
    totalCount: number
    pagination: {
      page: number
      limit: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }>
  verifyReceipt: (receiptId: string, isApproved: boolean, comments?: string) => Promise<ReceiptRecord>
  deleteReceipt: (receiptId: string) => Promise<boolean>
  downloadReceipt: (receiptId: string) => Promise<{
    fileData: string
    fileName: string
    fileType: string
    fileSize: number
  }>
  validateReceipt: (request: ReceiptUploadRequest) => Promise<ReceiptValidationResult>
  
  // Statistics
  getReceiptStatistics: (filters?: ReceiptSearchFilters) => Promise<any>
  
  // State
  loading: boolean
  error: string | null
}

export function usePaymentReceipts(): UsePaymentReceiptsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadReceipt = useCallback(async (request: ReceiptUploadRequest): Promise<ReceiptRecord> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/${request.paymentId}/receipts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload receipt')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload receipt'
      setError(errorMessage)
      console.error('Error uploading receipt:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getReceipt = useCallback(async (receiptId: string): Promise<ReceiptRecord> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/receipts/${receiptId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch receipt')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch receipt'
      setError(errorMessage)
      console.error('Error fetching receipt:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getReceipts = useCallback(async (
    paymentId: string,
    filters?: ReceiptSearchFilters,
    pagination?: { page: number; limit: number }
  ) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      if (pagination) {
        searchParams.append('page', pagination.page.toString())
        searchParams.append('limit', pagination.limit.toString())
      }
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'dateRange' && typeof value === 'object') {
              searchParams.append('startDate', value.start)
              searchParams.append('endDate', value.end)
            } else {
              searchParams.append(key, value.toString())
            }
          }
        })
      }

      const response = await fetch(`/api/payments/${paymentId}/receipts?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get receipts')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get receipts'
      setError(errorMessage)
      console.error('Error getting receipts:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const verifyReceipt = useCallback(async (
    receiptId: string,
    isApproved: boolean,
    comments?: string
  ): Promise<ReceiptRecord> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/receipts/${receiptId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isApproved,
          comments
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to verify receipt')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify receipt'
      setError(errorMessage)
      console.error('Error verifying receipt:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteReceipt = useCallback(async (receiptId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/receipts/${receiptId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete receipt')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete receipt'
      setError(errorMessage)
      console.error('Error deleting receipt:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const downloadReceipt = useCallback(async (receiptId: string): Promise<{
    fileData: string
    fileName: string
    fileType: string
    fileSize: number
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/payments/receipts/${receiptId}/download`)
      
      if (!response.ok) {
        const errorResult = await response.json()
        throw new Error(errorResult.error || 'Failed to download receipt')
      }

      // Get file data from response
      const fileData = await response.text()
      const fileName = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'receipt'
      const fileType = response.headers.get('Content-Type') || 'application/octet-stream'
      const fileSize = parseInt(response.headers.get('Content-Length') || '0')

      return {
        fileData,
        fileName,
        fileType,
        fileSize
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download receipt'
      setError(errorMessage)
      console.error('Error downloading receipt:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const validateReceipt = useCallback(async (request: ReceiptUploadRequest): Promise<ReceiptValidationResult> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/payments/receipts/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to validate receipt')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate receipt'
      setError(errorMessage)
      console.error('Error validating receipt:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  const getReceiptStatistics = useCallback(async (filters?: ReceiptSearchFilters) => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            if (key === 'dateRange' && typeof value === 'object') {
              searchParams.append('startDate', value.start)
              searchParams.append('endDate', value.end)
            } else {
              searchParams.append(key, value.toString())
            }
          }
        })
      }

      const response = await fetch(`/api/payments/receipts/statistics?${searchParams.toString()}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get receipt statistics')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get receipt statistics'
      setError(errorMessage)
      console.error('Error getting receipt statistics:', err)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    uploadReceipt,
    getReceipt,
    getReceipts,
    verifyReceipt,
    deleteReceipt,
    downloadReceipt,
    validateReceipt,
    getReceiptStatistics,
    loading,
    error,
  }
}
