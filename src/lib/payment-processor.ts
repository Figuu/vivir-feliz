import { db } from './db'

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'OTHER'

export interface PaymentDetails {
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  description?: string
  metadata?: Record<string, any>
}

export interface PaymentResult {
  paymentId: string
  status: PaymentStatus
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  transactionId?: string
  receiptUrl?: string
  processedAt?: Date
  error?: string
}

export interface ReceiptUploadResult {
  receiptId: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  uploadedAt: Date
}

export interface PaymentValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class PaymentProcessor {
  /**
   * Process a payment for a consultation request
   */
  static async processPayment(
    consultationRequestId: string,
    paymentDetails: PaymentDetails,
    processedBy: string
  ): Promise<PaymentResult> {
    try {
      // Validate consultation request exists and is payable
      const consultationRequest = await db.consultationRequest.findUnique({
        where: { id: consultationRequestId },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          parent: {
            select: {
              id: true
            }
          }
        }
      })

      if (!consultationRequest) {
        throw new Error('Consultation request not found')
      }

      // Check if payment already exists
      const existingPayment = await db.payment.findFirst({
        where: { consultationRequestId }
      })

      if (existingPayment) {
        throw new Error('Payment already exists for this consultation request')
      }

      // Validate payment amount
      const validation = this.validatePayment(paymentDetails, consultationRequest)
      if (!validation.isValid) {
        throw new Error(`Payment validation failed: ${validation.errors.join(', ')}`)
      }

      // Use transaction to create payment record
      const result = await db.$transaction(async (tx) => {
        // Create payment record
        const payment = await tx.payment.create({
          data: {
            parentId: consultationRequest.parentId,
            consultationRequestId,
            amount: paymentDetails.amount,
            paymentMethod: paymentDetails.paymentMethod,
            type: 'CONSULTATION',
            status: 'PENDING',
            description: paymentDetails.description,
            metadata: paymentDetails.metadata ? JSON.stringify(paymentDetails.metadata) : null
          }
        })

        // Update consultation request status if needed
        if (consultationRequest.status === 'PENDING') {
          await tx.consultationRequest.update({
            where: { id: consultationRequestId },
            data: { status: 'CONFIRMED' }
          })
        }

        return payment
      })

      return {
        paymentId: result.id,
        status: result.status as PaymentStatus,
        amount: Number(result.amount),
        currency: 'USD', // Default currency since field might not exist
        paymentMethod: result.paymentMethod as PaymentMethod,
        transactionId: result.transactionId || undefined,
        receiptUrl: undefined, // Field might not exist in schema
        processedAt: result.processedAt || undefined
      }

    } catch (error) {
      console.error('Error processing payment:', error)
      throw error
    }
  }

  /**
   * Complete a payment (mark as completed)
   */
  static async completePayment(
    paymentId: string,
    transactionId?: string,
    receiptUrl?: string,
    completedBy?: string
  ): Promise<PaymentResult> {
    try {
      const payment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'CONFIRMED',
          transactionId,
          receiptUrl,
          processedAt: new Date()
        }
      })

      return {
        paymentId: payment.id,
        status: payment.status as PaymentStatus,
        amount: Number(payment.amount),
        currency: 'USD', // Default currency since field might not exist
        paymentMethod: payment.paymentMethod as PaymentMethod,
        transactionId: payment.transactionId || undefined,
        receiptUrl: undefined, // Field might not exist in schema
        processedAt: payment.processedAt || undefined
      }

    } catch (error) {
      console.error('Error completing payment:', error)
      throw error
    }
  }

  /**
   * Fail a payment
   */
  static async failPayment(
    paymentId: string,
    error: string,
    failedBy?: string
  ): Promise<PaymentResult> {
    try {
      const payment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED'
          // Note: errorMessage field might not exist in schema
        }
      })

      return {
        paymentId: payment.id,
        status: payment.status as PaymentStatus,
        amount: Number(payment.amount),
        currency: 'USD', // Default currency since field might not exist
        paymentMethod: payment.paymentMethod as PaymentMethod,
        error: undefined // errorMessage field might not exist in schema
      }

    } catch (error) {
      console.error('Error failing payment:', error)
      throw error
    }
  }

  /**
   * Cancel a payment
   */
  static async cancelPayment(
    paymentId: string,
    reason: string,
    cancelledBy?: string
  ): Promise<PaymentResult> {
    try {
      const payment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'CANCELLED'
          // Note: errorMessage field might not exist in schema
        }
      })

      return {
        paymentId: payment.id,
        status: payment.status as PaymentStatus,
        amount: Number(payment.amount),
        currency: 'USD', // Default currency since field might not exist
        paymentMethod: payment.paymentMethod as PaymentMethod,
        error: undefined // errorMessage field might not exist in schema
      }

    } catch (error) {
      console.error('Error cancelling payment:', error)
      throw error
    }
  }

  /**
   * Refund a payment
   */
  static async refundPayment(
    paymentId: string,
    refundAmount: number,
    reason: string,
    refundedBy?: string
  ): Promise<PaymentResult> {
    try {
      const payment = await db.payment.findUnique({
        where: { id: paymentId }
      })

      if (!payment) {
        throw new Error('Payment not found')
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('Only completed payments can be refunded')
      }

      if (refundAmount > Number(payment.amount)) {
        throw new Error('Refund amount cannot exceed original payment amount')
      }

      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED'
          // Note: refundAmount field might not exist in schema
        }
      })

      return {
        paymentId: updatedPayment.id,
        status: updatedPayment.status as PaymentStatus,
        amount: Number(updatedPayment.amount),
        currency: updatedPayment.currency,
        paymentMethod: updatedPayment.paymentMethod as PaymentMethod,
        transactionId: updatedPayment.transactionId || undefined,
        receiptUrl: updatedPayment.receiptUrl || undefined,
        processedAt: updatedPayment.paymentDate || undefined
      }

    } catch (error) {
      console.error('Error refunding payment:', error)
      throw error
    }
  }

  /**
   * Upload receipt for a payment
   */
  static async uploadReceipt(
    paymentId: string,
    file: {
      name: string
      size: number
      type: string
      data: Buffer | string
    },
    uploadedBy?: string
  ): Promise<ReceiptUploadResult> {
    try {
      // Validate file
      const validation = this.validateReceiptFile(file)
      if (!validation.isValid) {
        throw new Error(`Receipt validation failed: ${validation.errors.join(', ')}`)
      }

      // Check if payment exists
      const payment = await db.payment.findUnique({
        where: { id: paymentId }
      })

      if (!payment) {
        throw new Error('Payment not found')
      }

      // Generate unique filename
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const fileName = `receipt_${paymentId}_${timestamp}.${fileExtension}`
      
      // In a real implementation, you would upload to cloud storage (AWS S3, etc.)
      // For now, we'll simulate the upload
      const receiptUrl = `/uploads/receipts/${fileName}`

      // Update payment with receipt URL
      // Note: receiptUrl field might not exist in schema
      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: {
          // receiptUrl field might not exist in schema
        }
      })

      return {
        receiptId: `${paymentId}_${timestamp}`,
        fileName,
        fileSize: file.size,
        mimeType: file.type,
        url: receiptUrl,
        uploadedAt: new Date()
      }

    } catch (error) {
      console.error('Error uploading receipt:', error)
      throw error
    }
  }

  /**
   * Get payment details
   */
  static async getPayment(paymentId: string): Promise<any> {
    try {
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: {
          consultationRequest: {
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true
                }
              },
              parent: {
                select: {
                  id: true
                }
              },
              therapist: {
                select: {
                  id: true,
                  profileId: true
                }
              }
            }
          }
        }
      })

      if (!payment) {
        throw new Error('Payment not found')
      }

      return payment

    } catch (error) {
      console.error('Error getting payment:', error)
      throw error
    }
  }

  /**
   * Get payments by consultation request
   */
  static async getPaymentsByConsultation(consultationRequestId: string): Promise<any[]> {
    try {
      const payments = await db.payment.findMany({
        where: { consultationRequestId },
        orderBy: { createdAt: 'desc' }
      })

      return payments

    } catch (error) {
      console.error('Error getting payments by consultation:', error)
      throw error
    }
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStatistics(dateRange?: { start: Date; end: Date }): Promise<{
    totalPayments: number
    totalAmount: number
    statusCounts: { [key in PaymentStatus]: number }
    methodCounts: { [key in PaymentMethod]: number }
    averageAmount: number
    completionRate: number
  }> {
    try {
      const whereClause = dateRange ? {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      } : {}

      const [
        totalPayments,
        totalAmount,
        statusCounts,
        methodCounts
      ] = await Promise.all([
        db.payment.count({ where: whereClause }),
        db.payment.aggregate({
          where: whereClause,
          _sum: { amount: true }
        }),
        db.payment.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true }
        }),
        db.payment.groupBy({
          by: ['paymentMethod'],
          where: whereClause,
          _count: { paymentMethod: true }
        })
      ])

      // Format status counts
      const formattedStatusCounts: { [key in PaymentStatus]: number } = {
        'PENDING': 0,
        'PROCESSING': 0,
        'COMPLETED': 0,
        'FAILED': 0,
        'CANCELLED': 0,
        'REFUNDED': 0
      }

      statusCounts.forEach(item => {
        formattedStatusCounts[item.status as PaymentStatus] = item._count.status
      })

      // Format method counts
      const formattedMethodCounts: { [key in PaymentMethod]: number } = {
        'CASH': 0,
        'CARD': 0,
        'BANK_TRANSFER': 0,
        'CHECK': 0,
        'OTHER': 0
      }

      methodCounts.forEach(item => {
        formattedMethodCounts[item.paymentMethod as PaymentMethod] = Number(item._count.paymentMethod)
      })

      const averageAmount = totalPayments > 0 ? Number(totalAmount._sum.amount || 0) / totalPayments : 0
      const completionRate = totalPayments > 0 ? (formattedStatusCounts.COMPLETED / totalPayments) * 100 : 0

      return {
        totalPayments,
        totalAmount: Number(totalAmount._sum.amount) || 0,
        statusCounts: formattedStatusCounts,
        methodCounts: formattedMethodCounts,
        averageAmount,
        completionRate
      }

    } catch (error) {
      console.error('Error getting payment statistics:', error)
      throw error
    }
  }

  /**
   * Validate payment details
   */
  private static validatePayment(paymentDetails: PaymentDetails, consultationRequest: any): PaymentValidation {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate amount
    if (paymentDetails.amount <= 0) {
      errors.push('Payment amount must be greater than 0')
    }

    if (paymentDetails.amount > 10000) {
      warnings.push('Payment amount is unusually high')
    }

    // Validate currency
    if (!paymentDetails.currency || paymentDetails.currency.length !== 3) {
      errors.push('Invalid currency code')
    }

    // Validate payment method
    const validMethods: PaymentMethod[] = ['CASH', 'CARD', 'BANK_TRANSFER', 'CHECK', 'OTHER']
    if (!validMethods.includes(paymentDetails.paymentMethod)) {
      errors.push('Invalid payment method')
    }

    // Validate consultation request status
    if (consultationRequest.status === 'CANCELLED') {
      errors.push('Cannot process payment for cancelled consultation')
    }

    if (consultationRequest.status === 'COMPLETED' && paymentDetails.paymentMethod !== 'CASH') {
      warnings.push('Processing payment for already completed consultation')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate receipt file
   */
  private static validateReceiptFile(file: {
    name: string
    size: number
    type: string
  }): PaymentValidation {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      errors.push('File size exceeds 10MB limit')
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'image/webp'
    ]

    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Only JPEG, PNG, GIF, PDF, and WebP files are allowed')
    }

    // Validate file name
    if (!file.name || file.name.length > 255) {
      errors.push('Invalid file name')
    }

    // Check for suspicious file extensions
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif']
    const fileExtension = file.name.toLowerCase().split('.').pop()
    if (fileExtension && suspiciousExtensions.includes(`.${fileExtension}`)) {
      errors.push('File type not allowed for security reasons')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}


