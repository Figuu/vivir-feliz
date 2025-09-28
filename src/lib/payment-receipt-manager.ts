import { db } from './db'

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
  dateRange?: { start: Date; end: Date }
  fileType?: FileType
  searchTerm?: string
}

export class PaymentReceiptManager {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  private static readonly ALLOWED_FILE_TYPES = ['PDF', 'JPG', 'JPEG', 'PNG', 'DOC', 'DOCX', 'TXT']
  private static readonly RECEIPT_STORAGE_PATH = '/uploads/receipts'

  /**
   * Validate receipt upload request
   */
  static async validateReceiptUpload(request: ReceiptUploadRequest): Promise<ReceiptValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Validate payment ID
      if (!request.paymentId) {
        errors.push('Payment ID is required')
      } else if (!this.isValidUUID(request.paymentId)) {
        errors.push('Invalid payment ID format')
      } else {
        // Check if payment exists
        const payment = await db.payment.findUnique({
          where: { id: request.paymentId },
          select: { id: true, status: true }
        })
        if (!payment) {
          errors.push('Payment not found')
        } else if (payment.status === 'CANCELLED') {
          errors.push('Cannot upload receipt for cancelled payment')
        }
      }

      // Validate file information
      if (!request.fileName) {
        errors.push('File name is required')
      } else if (request.fileName.length > 255) {
        errors.push('File name cannot exceed 255 characters')
      }

      if (!request.fileSize || request.fileSize <= 0) {
        errors.push('File size must be greater than 0')
      } else if (request.fileSize > this.MAX_FILE_SIZE) {
        errors.push(`File size cannot exceed ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`)
      }

      if (!request.fileType) {
        errors.push('File type is required')
      } else if (!this.ALLOWED_FILE_TYPES.includes(request.fileType)) {
        errors.push(`File type ${request.fileType} is not allowed. Allowed types: ${this.ALLOWED_FILE_TYPES.join(', ')}`)
      }

      // Validate file data
      if (!request.fileData) {
        errors.push('File data is required')
      } else {
        try {
          // Validate base64 encoding
          const decodedData = Buffer.from(request.fileData, 'base64')
          if (decodedData.length !== request.fileSize) {
            errors.push('File size mismatch between declared size and actual data')
          }
        } catch (error) {
          errors.push('Invalid base64 file data')
        }
      }

      // Validate receipt type
      if (!request.receiptType) {
        errors.push('Receipt type is required')
      } else if (!Object.values(['PAYMENT_RECEIPT', 'BANK_STATEMENT', 'TRANSACTION_PROOF', 'INVOICE', 'OTHER']).includes(request.receiptType)) {
        errors.push('Invalid receipt type')
      }

      // Validate description
      if (request.description && request.description.length > 500) {
        errors.push('Description cannot exceed 500 characters')
      }

      // Check for duplicate receipts
      if (request.paymentId) {
        const existingReceipt = await db.paymentReceipt.findFirst({
          where: {
            paymentId: request.paymentId,
            receiptType: request.receiptType,
            status: { in: ['PENDING', 'UPLOADED', 'VERIFIED'] }
          }
        })
        if (existingReceipt) {
          warnings.push('A receipt of this type already exists for this payment')
        }
      }

      // File type specific validations
      if (request.fileType === 'PDF' && request.fileSize > 5 * 1024 * 1024) {
        warnings.push('Large PDF files may take longer to process')
      }

      if (['JPG', 'JPEG', 'PNG'].includes(request.fileType) && request.fileSize > 2 * 1024 * 1024) {
        warnings.push('Large image files may affect performance')
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        fileInfo: {
          size: request.fileSize,
          type: request.fileType,
          isValidFormat: this.ALLOWED_FILE_TYPES.includes(request.fileType),
          isValidSize: request.fileSize <= this.MAX_FILE_SIZE
        }
      }

    } catch (error) {
      console.error('Error validating receipt upload:', error)
      return {
        isValid: false,
        errors: ['Validation failed due to system error'],
        warnings: [],
        fileInfo: {
          size: 0,
          type: '',
          isValidFormat: false,
          isValidSize: false
        }
      }
    }
  }

  /**
   * Upload receipt
   */
  static async uploadReceipt(
    request: ReceiptUploadRequest,
    uploadedBy: string
  ): Promise<ReceiptRecord> {
    try {
      // Validate request first
      const validation = await this.validateReceiptUpload(request)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      // Generate unique file path
      const fileExtension = this.getFileExtension(request.fileType)
      const uniqueFileName = `${request.paymentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`
      const filePath = `${this.RECEIPT_STORAGE_PATH}/${uniqueFileName}`

      // Save file to storage (in a real implementation, this would save to cloud storage)
      await this.saveFileToStorage(filePath, request.fileData)

      // Create receipt record
      const receipt = await db.paymentReceipt.create({
        data: {
          paymentId: request.paymentId,
          receiptType: request.receiptType,
          fileName: request.fileName,
          fileSize: request.fileSize,
          fileType: request.fileType,
          filePath,
          status: 'UPLOADED',
          description: request.description,
          uploadedBy,
          uploadedAt: new Date(),
          metadata: request.metadata ? JSON.stringify(request.metadata) : null
        },
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              paymentMethod: true,
              status: true
            }
          }
        }
      })

      return {
        id: receipt.id,
        paymentId: receipt.paymentId,
        receiptType: receipt.receiptType as ReceiptType,
        fileName: receipt.fileName,
        fileSize: receipt.fileSize,
        fileType: receipt.fileType as FileType,
        filePath: receipt.filePath,
        status: receipt.status as ReceiptStatus,
        description: receipt.description || undefined,
        uploadedBy: receipt.uploadedBy,
        uploadedAt: receipt.uploadedAt,
        verifiedBy: receipt.verifiedBy || undefined,
        verifiedAt: receipt.verifiedAt || undefined,
        rejectionReason: receipt.rejectionReason || undefined,
        metadata: receipt.metadata ? JSON.parse(receipt.metadata) : undefined,
        createdAt: receipt.createdAt,
        updatedAt: receipt.updatedAt
      }

    } catch (error) {
      console.error('Error uploading receipt:', error)
      throw error
    }
  }

  /**
   * Get receipt by ID
   */
  static async getReceipt(receiptId: string): Promise<ReceiptRecord | null> {
    try {
      const receipt = await db.paymentReceipt.findUnique({
        where: { id: receiptId },
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              paymentMethod: true,
              status: true,
              patient: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
              therapist: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      })

      if (!receipt) {
        return null
      }

      return {
        id: receipt.id,
        paymentId: receipt.paymentId,
        receiptType: receipt.receiptType as ReceiptType,
        fileName: receipt.fileName,
        fileSize: receipt.fileSize,
        fileType: receipt.fileType as FileType,
        filePath: receipt.filePath,
        status: receipt.status as ReceiptStatus,
        description: receipt.description || undefined,
        uploadedBy: receipt.uploadedBy,
        uploadedAt: receipt.uploadedAt,
        verifiedBy: receipt.verifiedBy || undefined,
        verifiedAt: receipt.verifiedAt || undefined,
        rejectionReason: receipt.rejectionReason || undefined,
        metadata: receipt.metadata ? JSON.parse(receipt.metadata) : undefined,
        createdAt: receipt.createdAt,
        updatedAt: receipt.updatedAt
      }

    } catch (error) {
      console.error('Error getting receipt:', error)
      throw error
    }
  }

  /**
   * Get receipts with filtering and pagination
   */
  static async getReceipts(
    filters?: ReceiptSearchFilters,
    pagination?: { page: number; limit: number }
  ): Promise<{
    receipts: any[]
    totalCount: number
    pagination: {
      page: number
      limit: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }> {
    try {
      const page = pagination?.page || 1
      const limit = Math.min(pagination?.limit || 20, 100)
      const offset = (page - 1) * limit

      // Build where clause
      const whereClause: any = {}
      
      if (filters?.paymentId) {
        whereClause.paymentId = filters.paymentId
      }
      
      if (filters?.receiptType) {
        whereClause.receiptType = filters.receiptType
      }
      
      if (filters?.status) {
        whereClause.status = filters.status
      }
      
      if (filters?.uploadedBy) {
        whereClause.uploadedBy = filters.uploadedBy
      }
      
      if (filters?.fileType) {
        whereClause.fileType = filters.fileType
      }
      
      if (filters?.dateRange) {
        whereClause.uploadedAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        }
      }
      
      if (filters?.searchTerm) {
        whereClause.OR = [
          { fileName: { contains: filters.searchTerm, mode: 'insensitive' } },
          { description: { contains: filters.searchTerm, mode: 'insensitive' } }
        ]
      }

      // Fetch receipts
      const [receipts, totalCount] = await Promise.all([
        db.paymentReceipt.findMany({
          where: whereClause,
          include: {
            payment: {
              select: {
                id: true,
                amount: true,
                paymentMethod: true,
                status: true,
                patient: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                },
                therapist: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: { uploadedAt: 'desc' },
          skip: offset,
          take: limit
        }),
        db.paymentReceipt.count({ where: whereClause })
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return {
        receipts,
        totalCount,
        pagination: {
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }

    } catch (error) {
      console.error('Error getting receipts:', error)
      throw error
    }
  }

  /**
   * Verify receipt
   */
  static async verifyReceipt(
    receiptId: string,
    verifiedBy: string,
    isApproved: boolean,
    comments?: string
  ): Promise<ReceiptRecord> {
    try {
      const receipt = await db.paymentReceipt.findUnique({
        where: { id: receiptId }
      })

      if (!receipt) {
        throw new Error('Receipt not found')
      }

      if (receipt.status !== 'UPLOADED') {
        throw new Error(`Cannot verify receipt with status: ${receipt.status}`)
      }

      // Update receipt status
      const updatedReceipt = await db.paymentReceipt.update({
        where: { id: receiptId },
        data: {
          status: isApproved ? 'VERIFIED' : 'REJECTED',
          verifiedBy,
          verifiedAt: new Date(),
          rejectionReason: !isApproved ? comments : null,
          description: comments ? `${receipt.description || ''} - Verification: ${comments}`.trim() : receipt.description
        },
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              paymentMethod: true,
              status: true
            }
          }
        }
      })

      return {
        id: updatedReceipt.id,
        paymentId: updatedReceipt.paymentId,
        receiptType: updatedReceipt.receiptType as ReceiptType,
        fileName: updatedReceipt.fileName,
        fileSize: updatedReceipt.fileSize,
        fileType: updatedReceipt.fileType as FileType,
        filePath: updatedReceipt.filePath,
        status: updatedReceipt.status as ReceiptStatus,
        description: updatedReceipt.description || undefined,
        uploadedBy: updatedReceipt.uploadedBy,
        uploadedAt: updatedReceipt.uploadedAt,
        verifiedBy: updatedReceipt.verifiedBy || undefined,
        verifiedAt: updatedReceipt.verifiedAt || undefined,
        rejectionReason: updatedReceipt.rejectionReason || undefined,
        metadata: updatedReceipt.metadata ? JSON.parse(updatedReceipt.metadata) : undefined,
        createdAt: updatedReceipt.createdAt,
        updatedAt: updatedReceipt.updatedAt
      }

    } catch (error) {
      console.error('Error verifying receipt:', error)
      throw error
    }
  }

  /**
   * Delete receipt
   */
  static async deleteReceipt(receiptId: string): Promise<boolean> {
    try {
      const receipt = await db.paymentReceipt.findUnique({
        where: { id: receiptId }
      })

      if (!receipt) {
        throw new Error('Receipt not found')
      }

      // Delete file from storage
      await this.deleteFileFromStorage(receipt.filePath)

      // Delete receipt record
      await db.paymentReceipt.delete({
        where: { id: receiptId }
      })

      return true

    } catch (error) {
      console.error('Error deleting receipt:', error)
      throw error
    }
  }

  /**
   * Get receipt file data
   */
  static async getReceiptFile(receiptId: string): Promise<{
    fileData: string
    fileName: string
    fileType: string
    fileSize: number
  }> {
    try {
      const receipt = await db.paymentReceipt.findUnique({
        where: { id: receiptId },
        select: {
          filePath: true,
          fileName: true,
          fileType: true,
          fileSize: true
        }
      })

      if (!receipt) {
        throw new Error('Receipt not found')
      }

      // Read file from storage
      const fileData = await this.readFileFromStorage(receipt.filePath)

      return {
        fileData,
        fileName: receipt.fileName,
        fileType: receipt.fileType,
        fileSize: receipt.fileSize
      }

    } catch (error) {
      console.error('Error getting receipt file:', error)
      throw error
    }
  }

  /**
   * Get receipt statistics
   */
  static async getReceiptStatistics(filters?: ReceiptSearchFilters): Promise<{
    totalReceipts: number
    statusBreakdown: Record<string, number>
    typeBreakdown: Record<string, number>
    fileTypeBreakdown: Record<string, number>
    totalFileSize: number
    averageFileSize: number
    verificationRate: number
  }> {
    try {
      // Build where clause
      const whereClause: any = {}
      
      if (filters?.paymentId) {
        whereClause.paymentId = filters.paymentId
      }
      
      if (filters?.receiptType) {
        whereClause.receiptType = filters.receiptType
      }
      
      if (filters?.status) {
        whereClause.status = filters.status
      }
      
      if (filters?.uploadedBy) {
        whereClause.uploadedBy = filters.uploadedBy
      }
      
      if (filters?.fileType) {
        whereClause.fileType = filters.fileType
      }
      
      if (filters?.dateRange) {
        whereClause.uploadedAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        }
      }

      const [
        totalReceipts,
        statusBreakdown,
        typeBreakdown,
        fileTypeBreakdown,
        totalFileSize,
        verifiedReceipts
      ] = await Promise.all([
        db.paymentReceipt.count({ where: whereClause }),
        db.paymentReceipt.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true }
        }),
        db.paymentReceipt.groupBy({
          by: ['receiptType'],
          where: whereClause,
          _count: { receiptType: true }
        }),
        db.paymentReceipt.groupBy({
          by: ['fileType'],
          where: whereClause,
          _count: { fileType: true }
        }),
        db.paymentReceipt.aggregate({
          where: whereClause,
          _sum: { fileSize: true }
        }),
        db.paymentReceipt.count({
          where: {
            ...whereClause,
            status: { in: ['VERIFIED', 'REJECTED'] }
          }
        })
      ])

      // Format breakdowns
      const statusBreakdownFormatted: Record<string, number> = {}
      statusBreakdown.forEach(status => {
        statusBreakdownFormatted[status.status] = status._count.status
      })

      const typeBreakdownFormatted: Record<string, number> = {}
      typeBreakdown.forEach(type => {
        typeBreakdownFormatted[type.receiptType] = type._count.receiptType
      })

      const fileTypeBreakdownFormatted: Record<string, number> = {}
      fileTypeBreakdown.forEach(fileType => {
        fileTypeBreakdownFormatted[fileType.fileType] = fileType._count.fileType
      })

      const averageFileSize = totalReceipts > 0 ? (totalFileSize._sum.fileSize || 0) / totalReceipts : 0
      const verificationRate = totalReceipts > 0 ? (verifiedReceipts / totalReceipts) * 100 : 0

      return {
        totalReceipts,
        statusBreakdown: statusBreakdownFormatted,
        typeBreakdown: typeBreakdownFormatted,
        fileTypeBreakdown: fileTypeBreakdownFormatted,
        totalFileSize: totalFileSize._sum.fileSize || 0,
        averageFileSize,
        verificationRate
      }

    } catch (error) {
      console.error('Error getting receipt statistics:', error)
      throw error
    }
  }

  /**
   * Save file to storage (mock implementation)
   */
  private static async saveFileToStorage(filePath: string, fileData: string): Promise<void> {
    // In a real implementation, this would save to cloud storage (AWS S3, Google Cloud Storage, etc.)
    // For now, we'll just simulate the operation
    console.log(`Saving file to: ${filePath}`)
    // Simulate file save operation
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  /**
   * Read file from storage (mock implementation)
   */
  private static async readFileFromStorage(filePath: string): Promise<string> {
    // In a real implementation, this would read from cloud storage
    // For now, we'll return a mock base64 string
    console.log(`Reading file from: ${filePath}`)
    // Simulate file read operation
    await new Promise(resolve => setTimeout(resolve, 100))
    return 'mock-file-data-base64-encoded'
  }

  /**
   * Delete file from storage (mock implementation)
   */
  private static async deleteFileFromStorage(filePath: string): Promise<void> {
    // In a real implementation, this would delete from cloud storage
    console.log(`Deleting file from: ${filePath}`)
    // Simulate file delete operation
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  /**
   * Get file extension from file type
   */
  private static getFileExtension(fileType: FileType): string {
    const extensions: Record<FileType, string> = {
      'PDF': 'pdf',
      'JPG': 'jpg',
      'JPEG': 'jpeg',
      'PNG': 'png',
      'DOC': 'doc',
      'DOCX': 'docx',
      'TXT': 'txt'
    }
    return extensions[fileType] || 'bin'
  }

  /**
   * Validate UUID format
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }
}


