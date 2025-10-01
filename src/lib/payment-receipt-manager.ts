import { db } from './db'

export type FileType = 'PDF' | 'JPG' | 'JPEG' | 'PNG' | 'DOC' | 'DOCX' | 'TXT'

export interface ReceiptUploadRequest {
  paymentId: string
  receiptType?: 'PAYMENT_RECEIPT' | 'BANK_STATEMENT' | 'TRANSACTION_PROOF' | 'INVOICE' | 'OTHER'
  receiptNumber?: string
  fileName?: string
  fileSize: number
  fileType: FileType
  fileData: string // Base64 encoded file data
  description?: string
  metadata?: Record<string, any>
  generatedBy?: string
}

export interface ReceiptRecord {
  id: string
  paymentId: string
  receiptNumber: string
  fileSize: number | null
  fileType: string
  receiptUrl: string
  generatedBy: string | null
  generatedAt: Date
  emailSent: boolean
  emailSentAt: Date | null
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
  receiptType?: 'PAYMENT_RECEIPT' | 'BANK_STATEMENT' | 'TRANSACTION_PROOF' | 'INVOICE' | 'OTHER'
  status?: 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED' | 'EXPIRED'
  uploadedBy?: string
  generatedBy?: string
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

      // Validate receipt number
      if (!request.receiptNumber) {
        errors.push('Receipt number is required')
      } else if (request.receiptNumber.length > 100) {
        errors.push('Receipt number cannot exceed 100 characters')
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

      // Check for duplicate receipt numbers
      if (request.receiptNumber) {
        const existingReceipt = await db.paymentReceipt.findUnique({
          where: { receiptNumber: request.receiptNumber }
        })
        if (existingReceipt) {
          errors.push('Receipt number already exists')
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
  static async uploadReceipt(request: ReceiptUploadRequest): Promise<ReceiptRecord> {
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
          receiptNumber: request.receiptNumber,
          receiptUrl: filePath,
          fileSize: request.fileSize,
          fileType: request.fileType,
          generatedBy: request.generatedBy,
          generatedAt: new Date(),
          emailSent: false
        }
      })

      return {
        id: receipt.id,
        paymentId: receipt.paymentId,
        receiptNumber: receipt.receiptNumber,
        fileSize: receipt.fileSize,
        fileType: receipt.fileType,
        receiptUrl: receipt.receiptUrl,
        generatedBy: receipt.generatedBy,
        generatedAt: receipt.generatedAt,
        emailSent: receipt.emailSent,
        emailSentAt: receipt.emailSentAt,
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
              parent: {
                select: {
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
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
        receiptNumber: receipt.receiptNumber,
        fileSize: receipt.fileSize,
        fileType: receipt.fileType,
        receiptUrl: receipt.receiptUrl,
        generatedBy: receipt.generatedBy,
        generatedAt: receipt.generatedAt,
        emailSent: receipt.emailSent,
        emailSentAt: receipt.emailSentAt,
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

      if (filters?.generatedBy) {
        whereClause.generatedBy = filters.generatedBy
      }

      if (filters?.fileType) {
        whereClause.fileType = filters.fileType
      }

      if (filters?.dateRange) {
        whereClause.generatedAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        }
      }

      if (filters?.searchTerm) {
        whereClause.OR = [
          { receiptNumber: { contains: filters.searchTerm, mode: 'insensitive' } }
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
                parent: {
                  select: {
                    profile: {
                      select: {
                        firstName: true,
                        lastName: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { generatedAt: 'desc' },
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
      await this.deleteFileFromStorage(receipt.receiptUrl)

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
    receiptNumber: string
    fileType: string
    fileSize: number | null
  }> {
    try {
      const receipt = await db.paymentReceipt.findUnique({
        where: { id: receiptId },
        select: {
          receiptUrl: true,
          receiptNumber: true,
          fileType: true,
          fileSize: true
        }
      })

      if (!receipt) {
        throw new Error('Receipt not found')
      }

      // Read file from storage
      const fileData = await this.readFileFromStorage(receipt.receiptUrl)

      return {
        fileData,
        receiptNumber: receipt.receiptNumber,
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
    fileTypeBreakdown: Record<string, number>
    totalFileSize: number
    averageFileSize: number
  }> {
    try {
      // Build where clause
      const whereClause: any = {}

      if (filters?.paymentId) {
        whereClause.paymentId = filters.paymentId
      }

      if (filters?.generatedBy) {
        whereClause.generatedBy = filters.generatedBy
      }

      if (filters?.fileType) {
        whereClause.fileType = filters.fileType
      }

      if (filters?.dateRange) {
        whereClause.generatedAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        }
      }

      const [
        totalReceipts,
        fileTypeBreakdown,
        totalFileSize
      ] = await Promise.all([
        db.paymentReceipt.count({ where: whereClause }),
        db.paymentReceipt.groupBy({
          by: ['fileType'],
          where: whereClause,
          _count: { fileType: true }
        }),
        db.paymentReceipt.aggregate({
          where: whereClause,
          _sum: { fileSize: true }
        })
      ])

      // Format breakdowns
      const fileTypeBreakdownFormatted: Record<string, number> = {}
      fileTypeBreakdown.forEach(fileType => {
        fileTypeBreakdownFormatted[fileType.fileType] = fileType._count.fileType
      })

      const averageFileSize = totalReceipts > 0 ? (totalFileSize._sum.fileSize || 0) / totalReceipts : 0

      return {
        totalReceipts,
        fileTypeBreakdown: fileTypeBreakdownFormatted,
        totalFileSize: totalFileSize._sum.fileSize || 0,
        averageFileSize
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
   * Verify receipt
   */
  static async verifyReceipt(
    receiptId: string,
    verifiedBy: string,
    isApproved: boolean,
    comments?: string
  ): Promise<ReceiptRecord> {
    try {
      if (!this.isValidUUID(receiptId)) {
        throw new Error('Invalid receipt ID format')
      }
      
      // Check if receipt exists
      const existingReceipt = await db.paymentReceipt.findUnique({
        where: { id: receiptId }
      })
      
      if (!existingReceipt) {
        throw new Error('Receipt not found')
      }
      
      // Update receipt with verification
      const updatedReceipt = await db.paymentReceipt.update({
        where: { id: receiptId },
        data: {
          status: isApproved ? 'VERIFIED' : 'REJECTED',
          verifiedBy,
          verifiedAt: new Date(),
          verificationComments: comments
        }
      })
      
      return {
        id: updatedReceipt.id,
        paymentId: updatedReceipt.paymentId,
        receiptNumber: updatedReceipt.receiptNumber,
        fileSize: updatedReceipt.fileSize,
        fileType: updatedReceipt.fileType,
        receiptUrl: updatedReceipt.receiptUrl,
        generatedBy: updatedReceipt.generatedBy,
        generatedAt: updatedReceipt.generatedAt,
        emailSent: updatedReceipt.emailSent,
        emailSentAt: updatedReceipt.emailSentAt,
        createdAt: updatedReceipt.createdAt,
        updatedAt: updatedReceipt.updatedAt
      }
      
    } catch (error) {
      console.error('Error verifying receipt:', error)
      throw error
    }
  }

  /**
   * Validate UUID format
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }
}
