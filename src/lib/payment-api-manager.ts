import { db } from './db'

export type PaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'CHECK' | 'DEBIT_CARD' | 'PAYPAL' | 'STRIPE'
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
export type PaymentType = 'CONSULTATION' | 'SESSION' | 'EVALUATION' | 'TREATMENT' | 'PLAN_INSTALLMENT' | 'REFUND'

export interface PaymentRequest {
  patientId: string
  therapistId: string
  consultationRequestId?: string
  paymentPlanId?: string
  amount: number
  paymentMethod: PaymentMethod
  paymentType: PaymentType
  description?: string
  reference?: string
  metadata?: Record<string, any>
  dueDate?: Date
  autoProcess?: boolean
}

export interface PaymentResponse {
  id: string
  patientId: string
  therapistId: string
  consultationRequestId?: string
  paymentPlanId?: string
  amount: number
  paymentMethod: PaymentMethod
  paymentType: PaymentType
  status: PaymentStatus
  description?: string
  reference?: string
  transactionId?: string
  processedAt?: Date
  dueDate?: Date
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface PaymentValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface PaymentProcessingResult {
  success: boolean
  paymentId?: string
  transactionId?: string
  status: PaymentStatus
  message: string
  errors?: string[]
}

export class PaymentApiManager {
  /**
   * Validate payment request
   */
  static async validatePaymentRequest(request: PaymentRequest): Promise<PaymentValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Validate required fields
      if (!request.patientId) {
        errors.push('Patient ID is required')
      } else if (!this.isValidUUID(request.patientId)) {
        errors.push('Invalid patient ID format')
      }

      if (!request.therapistId) {
        errors.push('Therapist ID is required')
      } else if (!this.isValidUUID(request.therapistId)) {
        errors.push('Invalid therapist ID format')
      }

      if (!request.amount || request.amount <= 0) {
        errors.push('Amount must be greater than 0')
      } else if (request.amount > 10000) {
        warnings.push('Amount exceeds $10,000 - may require additional verification')
      }

      if (!request.paymentMethod) {
        errors.push('Payment method is required')
      } else if (!Object.values(['CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'CHECK', 'DEBIT_CARD', 'PAYPAL', 'STRIPE']).includes(request.paymentMethod)) {
        errors.push('Invalid payment method')
      }

      if (!request.paymentType) {
        errors.push('Payment type is required')
      } else if (!Object.values(['CONSULTATION', 'SESSION', 'EVALUATION', 'TREATMENT', 'PLAN_INSTALLMENT', 'REFUND']).includes(request.paymentType)) {
        errors.push('Invalid payment type')
      }

      // Validate optional fields
      if (request.consultationRequestId && !this.isValidUUID(request.consultationRequestId)) {
        errors.push('Invalid consultation request ID format')
      }

      if (request.paymentPlanId && !this.isValidUUID(request.paymentPlanId)) {
        errors.push('Invalid payment plan ID format')
      }

      if (request.description && request.description.length > 500) {
        errors.push('Description cannot exceed 500 characters')
      }

      if (request.reference && request.reference.length > 100) {
        errors.push('Reference cannot exceed 100 characters')
      }

      if (request.dueDate && request.dueDate < new Date()) {
        warnings.push('Due date is in the past')
      }

      // Validate business rules
      if (request.paymentType === 'PLAN_INSTALLMENT' && !request.paymentPlanId) {
        errors.push('Payment plan ID is required for plan installment payments')
      }

      if (request.paymentType === 'CONSULTATION' && !request.consultationRequestId) {
        errors.push('Consultation request ID is required for consultation payments')
      }

      // Check if patient exists
      if (request.patientId) {
        const patient = await db.patient.findUnique({
          where: { id: request.patientId },
          select: { id: true, firstName: true, lastName: true }
        })
        if (!patient) {
          errors.push('Patient not found')
        }
      }

      // Check if therapist exists
      if (request.therapistId) {
        const therapist = await db.therapist.findUnique({
          where: { id: request.therapistId },
          select: { id: true, firstName: true, lastName: true }
        })
        if (!therapist) {
          errors.push('Therapist not found')
        }
      }

      // Check if consultation request exists (if provided)
      if (request.consultationRequestId) {
        const consultationRequest = await db.consultationRequest.findUnique({
          where: { id: request.consultationRequestId },
          select: { id: true, status: true }
        })
        if (!consultationRequest) {
          errors.push('Consultation request not found')
        } else if (consultationRequest.status === 'CANCELLED') {
          errors.push('Cannot process payment for cancelled consultation request')
        }
      }

      // Check if payment plan exists (if provided)
      if (request.paymentPlanId) {
        const paymentPlan = await db.paymentPlan.findUnique({
          where: { id: request.paymentPlanId },
          select: { id: true, status: true, totalAmount: true, paidInstallments: true, totalInstallments: true }
        })
        if (!paymentPlan) {
          errors.push('Payment plan not found')
        } else if (paymentPlan.status === 'CANCELLED') {
          errors.push('Cannot process payment for cancelled payment plan')
        } else if (paymentPlan.paidInstallments >= paymentPlan.totalInstallments) {
          errors.push('Payment plan is already fully paid')
        }
      }

      // Check for duplicate payments
      if (request.consultationRequestId) {
        const existingPayment = await db.payment.findFirst({
          where: {
            consultationRequestId: request.consultationRequestId,
            status: { in: ['PENDING', 'COMPLETED'] }
          }
        })
        if (existingPayment) {
          errors.push('Payment already exists for this consultation request')
        }
      }

      // Validate payment method specific rules
      if (request.paymentMethod === 'CASH' && request.amount > 1000) {
        warnings.push('Large cash payments may require additional documentation')
      }

      if (request.paymentMethod === 'CHECK' && request.amount > 5000) {
        warnings.push('Large check payments may require additional verification')
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }

    } catch (error) {
      console.error('Error validating payment request:', error)
      return {
        isValid: false,
        errors: ['Validation failed due to system error'],
        warnings: []
      }
    }
  }

  /**
   * Create payment record
   */
  static async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Validate request first
      const validation = await this.validatePaymentRequest(request)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      // Generate transaction ID
      const transactionId = this.generateTransactionId(request.paymentMethod)

      // Create payment record
      const payment = await db.payment.create({
        data: {
          patientId: request.patientId,
          therapistId: request.therapistId,
          consultationRequestId: request.consultationRequestId,
          paymentPlanId: request.paymentPlanId,
          amount: request.amount,
          paymentMethod: request.paymentMethod,
          paymentType: request.paymentType,
          status: 'PENDING',
          description: request.description,
          reference: request.reference,
          transactionId,
          dueDate: request.dueDate,
          metadata: request.metadata ? JSON.stringify(request.metadata) : null
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              dateOfBirth: true
            }
          },
          therapist: {
            select: {
              firstName: true,
              lastName: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          consultationRequest: {
            select: {
              id: true,
              reason: true,
              urgency: true
            }
          },
          paymentPlan: {
            select: {
              id: true,
              planName: true,
              totalAmount: true
            }
          }
        }
      })

      // Auto-process if requested
      if (request.autoProcess) {
        await this.processPayment(payment.id)
      }

      return {
        id: payment.id,
        patientId: payment.patientId,
        therapistId: payment.therapistId,
        consultationRequestId: payment.consultationRequestId || undefined,
        paymentPlanId: payment.paymentPlanId || undefined,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod as PaymentMethod,
        paymentType: payment.paymentType as PaymentType,
        status: payment.status as PaymentStatus,
        description: payment.description || undefined,
        reference: payment.reference || undefined,
        transactionId: payment.transactionId || undefined,
        processedAt: payment.processedAt || undefined,
        dueDate: payment.dueDate || undefined,
        metadata: payment.metadata ? JSON.parse(payment.metadata) : undefined,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }

    } catch (error) {
      console.error('Error creating payment:', error)
      throw error
    }
  }

  /**
   * Process payment
   */
  static async processPayment(paymentId: string): Promise<PaymentProcessingResult> {
    try {
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: {
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
      })

      if (!payment) {
        return {
          success: false,
          status: 'FAILED',
          message: 'Payment not found',
          errors: ['Payment not found']
        }
      }

      if (payment.status !== 'PENDING') {
        return {
          success: false,
          status: payment.status as PaymentStatus,
          message: `Payment is already ${payment.status.toLowerCase()}`,
          errors: [`Payment is already ${payment.status.toLowerCase()}`]
        }
      }

      // Simulate payment processing based on method
      const processingResult = await this.simulatePaymentProcessing(payment)

      // Update payment status
      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: {
          status: processingResult.status,
          processedAt: processingResult.success ? new Date() : null,
          transactionId: processingResult.transactionId || payment.transactionId
        }
      })

      // If payment is successful, update related records
      if (processingResult.success) {
        await this.updateRelatedRecords(paymentId, payment)
      }

      return {
        success: processingResult.success,
        paymentId: paymentId,
        transactionId: processingResult.transactionId,
        status: processingResult.status,
        message: processingResult.message,
        errors: processingResult.errors
      }

    } catch (error) {
      console.error('Error processing payment:', error)
      return {
        success: false,
        status: 'FAILED',
        message: 'Payment processing failed due to system error',
        errors: ['System error during payment processing']
      }
    }
  }

  /**
   * Get payment by ID
   */
  static async getPayment(paymentId: string): Promise<PaymentResponse | null> {
    try {
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              dateOfBirth: true
            }
          },
          therapist: {
            select: {
              firstName: true,
              lastName: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          },
          consultationRequest: {
            select: {
              id: true,
              reason: true,
              urgency: true
            }
          },
          paymentPlan: {
            select: {
              id: true,
              planName: true,
              totalAmount: true
            }
          }
        }
      })

      if (!payment) {
        return null
      }

      return {
        id: payment.id,
        patientId: payment.patientId,
        therapistId: payment.therapistId,
        consultationRequestId: payment.consultationRequestId || undefined,
        paymentPlanId: payment.paymentPlanId || undefined,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod as PaymentMethod,
        paymentType: payment.paymentType as PaymentType,
        status: payment.status as PaymentStatus,
        description: payment.description || undefined,
        reference: payment.reference || undefined,
        transactionId: payment.transactionId || undefined,
        processedAt: payment.processedAt || undefined,
        dueDate: payment.dueDate || undefined,
        metadata: payment.metadata ? JSON.parse(payment.metadata) : undefined,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }

    } catch (error) {
      console.error('Error getting payment:', error)
      throw error
    }
  }

  /**
   * Update payment
   */
  static async updatePayment(
    paymentId: string,
    updates: Partial<PaymentRequest>
  ): Promise<PaymentResponse> {
    try {
      // Validate updates
      const existingPayment = await db.payment.findUnique({
        where: { id: paymentId }
      })

      if (!existingPayment) {
        throw new Error('Payment not found')
      }

      if (existingPayment.status === 'COMPLETED') {
        throw new Error('Cannot update completed payment')
      }

      // Build update data
      const updateData: any = {}
      
      if (updates.amount !== undefined) updateData.amount = updates.amount
      if (updates.paymentMethod !== undefined) updateData.paymentMethod = updates.paymentMethod
      if (updates.paymentType !== undefined) updateData.paymentType = updates.paymentType
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.reference !== undefined) updateData.reference = updates.reference
      if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata ? JSON.stringify(updates.metadata) : null

      // Update payment
      const updatedPayment = await db.payment.update({
        where: { id: paymentId },
        data: updateData,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              dateOfBirth: true
            }
          },
          therapist: {
            select: {
              firstName: true,
              lastName: true,
              user: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      })

      return {
        id: updatedPayment.id,
        patientId: updatedPayment.patientId,
        therapistId: updatedPayment.therapistId,
        consultationRequestId: updatedPayment.consultationRequestId || undefined,
        paymentPlanId: updatedPayment.paymentPlanId || undefined,
        amount: updatedPayment.amount,
        paymentMethod: updatedPayment.paymentMethod as PaymentMethod,
        paymentType: updatedPayment.paymentType as PaymentType,
        status: updatedPayment.status as PaymentStatus,
        description: updatedPayment.description || undefined,
        reference: updatedPayment.reference || undefined,
        transactionId: updatedPayment.transactionId || undefined,
        processedAt: updatedPayment.processedAt || undefined,
        dueDate: updatedPayment.dueDate || undefined,
        metadata: updatedPayment.metadata ? JSON.parse(updatedPayment.metadata) : undefined,
        createdAt: updatedPayment.createdAt,
        updatedAt: updatedPayment.updatedAt
      }

    } catch (error) {
      console.error('Error updating payment:', error)
      throw error
    }
  }

  /**
   * Cancel payment
   */
  static async cancelPayment(paymentId: string, reason?: string): Promise<PaymentProcessingResult> {
    try {
      const payment = await db.payment.findUnique({
        where: { id: paymentId }
      })

      if (!payment) {
        return {
          success: false,
          status: 'FAILED',
          message: 'Payment not found',
          errors: ['Payment not found']
        }
      }

      if (payment.status === 'COMPLETED') {
        return {
          success: false,
          status: payment.status as PaymentStatus,
          message: 'Cannot cancel completed payment',
          errors: ['Cannot cancel completed payment']
        }
      }

      if (payment.status === 'CANCELLED') {
        return {
          success: false,
          status: payment.status as PaymentStatus,
          message: 'Payment is already cancelled',
          errors: ['Payment is already cancelled']
        }
      }

      // Update payment status
      await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'CANCELLED',
          description: reason ? `${payment.description || ''} - Cancelled: ${reason}`.trim() : payment.description
        }
      })

      return {
        success: true,
        paymentId: paymentId,
        status: 'CANCELLED',
        message: 'Payment cancelled successfully'
      }

    } catch (error) {
      console.error('Error cancelling payment:', error)
      return {
        success: false,
        status: 'FAILED',
        message: 'Failed to cancel payment',
        errors: ['System error during payment cancellation']
      }
    }
  }

  /**
   * Simulate payment processing
   */
  private static async simulatePaymentProcessing(payment: any): Promise<{
    success: boolean
    status: PaymentStatus
    transactionId?: string
    message: string
    errors?: string[]
  }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Simulate different success rates based on payment method
    const successRates = {
      'CREDIT_CARD': 0.95,
      'DEBIT_CARD': 0.98,
      'BANK_TRANSFER': 0.99,
      'PAYPAL': 0.97,
      'STRIPE': 0.96,
      'CASH': 1.0,
      'CHECK': 0.85
    }

    const successRate = successRates[payment.paymentMethod as keyof typeof successRates] || 0.95
    const isSuccess = Math.random() < successRate

    if (isSuccess) {
      return {
        success: true,
        status: 'COMPLETED',
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Payment processed successfully'
      }
    } else {
      return {
        success: false,
        status: 'FAILED',
        message: 'Payment processing failed',
        errors: ['Payment method declined or processing error']
      }
    }
  }

  /**
   * Update related records after successful payment
   */
  private static async updateRelatedRecords(paymentId: string, payment: any): Promise<void> {
    try {
      // Update consultation request status if applicable
      if (payment.consultationRequestId) {
        await db.consultationRequest.update({
          where: { id: payment.consultationRequestId },
          data: { status: 'PAID' }
        })
      }

      // Update payment plan if applicable
      if (payment.paymentPlanId) {
        await db.paymentPlan.update({
          where: { id: payment.paymentPlanId },
          data: {
            paidInstallments: { increment: 1 },
            remainingInstallments: { decrement: 1 }
          }
        })
      }

    } catch (error) {
      console.error('Error updating related records:', error)
      // Don't throw error as payment is already processed
    }
  }

  /**
   * Generate transaction ID
   */
  private static generateTransactionId(paymentMethod: PaymentMethod): string {
    const prefix = paymentMethod.substring(0, 3).toUpperCase()
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 6)
    return `${prefix}_${timestamp}_${random}`
  }

  /**
   * Validate UUID format
   */
  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }
}
