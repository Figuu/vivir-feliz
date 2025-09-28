import { db } from './db'

export type PaymentTimeoutStatus = 'ACTIVE' | 'WARNING' | 'EXPIRED' | 'CANCELLED' | 'EXTENDED'
export type CancellationReason = 'USER_REQUEST' | 'TIMEOUT' | 'ADMIN_CANCELLATION' | 'PAYMENT_FAILED' | 'DUPLICATE_PAYMENT' | 'INVALID_AMOUNT' | 'SYSTEM_ERROR' | 'OTHER'

export interface PaymentTimeoutConfig {
  defaultTimeoutMinutes: number
  warningThresholdMinutes: number
  extensionAllowed: boolean
  maxExtensions: number
  extensionMinutes: number
  autoCancelEnabled: boolean
  notificationEnabled: boolean
}

export interface PaymentTimeoutRecord {
  id: string
  paymentId: string
  status: PaymentTimeoutStatus
  timeoutAt: Date
  warningAt: Date
  extendedAt?: Date
  extensionCount: number
  maxExtensions: number
  cancellationReason?: CancellationReason
  cancelledBy?: string
  cancelledAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface TimeoutNotification {
  id: string
  paymentId: string
  type: 'WARNING' | 'EXPIRED' | 'CANCELLED'
  sentAt: Date
  recipient: string
  message: string
  status: 'SENT' | 'FAILED' | 'PENDING'
}

export interface PaymentCancellationRequest {
  paymentId: string
  reason: CancellationReason
  notes?: string
  cancelledBy: string
  refundRequired?: boolean
  refundAmount?: number
  refundReason?: string
}

export interface TimeoutStatistics {
  totalTimeouts: number
  activeTimeouts: number
  expiredTimeouts: number
  cancelledTimeouts: number
  averageTimeoutDuration: number
  cancellationReasons: Record<string, number>
  timeoutTrends: Array<{
    date: string
    count: number
    expired: number
    cancelled: number
  }>
}

export class PaymentTimeoutManager {
  private static readonly DEFAULT_CONFIG: PaymentTimeoutConfig = {
    defaultTimeoutMinutes: 30, // 30 minutes default timeout
    warningThresholdMinutes: 5, // Warning 5 minutes before expiry
    extensionAllowed: true,
    maxExtensions: 2,
    extensionMinutes: 15, // 15 minutes per extension
    autoCancelEnabled: true,
    notificationEnabled: true
  }

  /**
   * Create timeout for a payment
   */
  static async createPaymentTimeout(
    paymentId: string,
    timeoutMinutes?: number,
    config?: Partial<PaymentTimeoutConfig>
  ): Promise<PaymentTimeoutRecord> {
    try {
      // Get payment details
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, status: true, amount: true, createdAt: true }
      })

      if (!payment) {
        throw new Error('Payment not found')
      }

      if (payment.status !== 'PENDING') {
        throw new Error(`Cannot create timeout for payment with status: ${payment.status}`)
      }

      // Check if timeout already exists
      const existingTimeout = await db.paymentTimeout.findUnique({
        where: { paymentId }
      })

      if (existingTimeout) {
        throw new Error('Timeout already exists for this payment')
      }

      // Merge config
      const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
      const timeoutDuration = timeoutMinutes || finalConfig.defaultTimeoutMinutes

      // Calculate timeout and warning times
      const now = new Date()
      const timeoutAt = new Date(now.getTime() + timeoutDuration * 60 * 1000)
      const warningAt = new Date(timeoutAt.getTime() - finalConfig.warningThresholdMinutes * 60 * 1000)

      // Create timeout record
      const timeout = await db.paymentTimeout.create({
        data: {
          paymentId,
          status: 'ACTIVE',
          timeoutAt,
          warningAt,
          extensionCount: 0,
          maxExtensions: finalConfig.maxExtensions
        }
      })

      // Schedule warning notification if enabled
      if (finalConfig.notificationEnabled) {
        await this.scheduleNotification(paymentId, 'WARNING', warningAt)
      }

      return {
        id: timeout.id,
        paymentId: timeout.paymentId,
        status: timeout.status as PaymentTimeoutStatus,
        timeoutAt: timeout.timeoutAt,
        warningAt: timeout.warningAt,
        extendedAt: timeout.extendedAt || undefined,
        extensionCount: timeout.extensionCount,
        maxExtensions: timeout.maxExtensions,
        cancellationReason: timeout.cancellationReason as CancellationReason || undefined,
        cancelledBy: timeout.cancelledBy || undefined,
        cancelledAt: timeout.cancelledAt || undefined,
        notes: timeout.notes || undefined,
        createdAt: timeout.createdAt,
        updatedAt: timeout.updatedAt
      }

    } catch (error) {
      console.error('Error creating payment timeout:', error)
      throw error
    }
  }

  /**
   * Extend payment timeout
   */
  static async extendPaymentTimeout(
    paymentId: string,
    extendedBy: string,
    extensionMinutes?: number,
    notes?: string
  ): Promise<PaymentTimeoutRecord> {
    try {
      const timeout = await db.paymentTimeout.findUnique({
        where: { paymentId }
      })

      if (!timeout) {
        throw new Error('Timeout not found for this payment')
      }

      if (timeout.status !== 'ACTIVE') {
        throw new Error(`Cannot extend timeout with status: ${timeout.status}`)
      }

      if (timeout.extensionCount >= timeout.maxExtensions) {
        throw new Error('Maximum extensions reached')
      }

      const extensionDuration = extensionMinutes || this.DEFAULT_CONFIG.extensionMinutes
      const newTimeoutAt = new Date(timeout.timeoutAt.getTime() + extensionDuration * 60 * 1000)
      const newWarningAt = new Date(newTimeoutAt.getTime() - this.DEFAULT_CONFIG.warningThresholdMinutes * 60 * 1000)

      const updatedTimeout = await db.paymentTimeout.update({
        where: { id: timeout.id },
        data: {
          timeoutAt: newTimeoutAt,
          warningAt: newWarningAt,
          extendedAt: new Date(),
          extensionCount: timeout.extensionCount + 1,
          notes: notes ? `${timeout.notes || ''}\nExtension: ${notes}`.trim() : timeout.notes
        }
      })

      return {
        id: updatedTimeout.id,
        paymentId: updatedTimeout.paymentId,
        status: updatedTimeout.status as PaymentTimeoutStatus,
        timeoutAt: updatedTimeout.timeoutAt,
        warningAt: updatedTimeout.warningAt,
        extendedAt: updatedTimeout.extendedAt || undefined,
        extensionCount: updatedTimeout.extensionCount,
        maxExtensions: updatedTimeout.maxExtensions,
        cancellationReason: updatedTimeout.cancellationReason as CancellationReason || undefined,
        cancelledBy: updatedTimeout.cancelledBy || undefined,
        cancelledAt: updatedTimeout.cancelledAt || undefined,
        notes: updatedTimeout.notes || undefined,
        createdAt: updatedTimeout.createdAt,
        updatedAt: updatedTimeout.updatedAt
      }

    } catch (error) {
      console.error('Error extending payment timeout:', error)
      throw error
    }
  }

  /**
   * Cancel payment due to timeout
   */
  static async cancelPaymentDueToTimeout(
    paymentId: string,
    reason: CancellationReason = 'TIMEOUT',
    notes?: string
  ): Promise<PaymentTimeoutRecord> {
    try {
      const timeout = await db.paymentTimeout.findUnique({
        where: { paymentId }
      })

      if (!timeout) {
        throw new Error('Timeout not found for this payment')
      }

      if (timeout.status === 'CANCELLED') {
        throw new Error('Payment already cancelled')
      }

      // Update timeout record
      const updatedTimeout = await db.paymentTimeout.update({
        where: { id: timeout.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledBy: 'system',
          cancelledAt: new Date(),
          notes: notes ? `${timeout.notes || ''}\nCancellation: ${notes}`.trim() : timeout.notes
        }
      })

      // Update payment status
      await db.payment.update({
        where: { id: paymentId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason
        }
      })

      // Send cancellation notification
      if (this.DEFAULT_CONFIG.notificationEnabled) {
        await this.sendNotification(paymentId, 'CANCELLED', 'Payment cancelled due to timeout')
      }

      return {
        id: updatedTimeout.id,
        paymentId: updatedTimeout.paymentId,
        status: updatedTimeout.status as PaymentTimeoutStatus,
        timeoutAt: updatedTimeout.timeoutAt,
        warningAt: updatedTimeout.warningAt,
        extendedAt: updatedTimeout.extendedAt || undefined,
        extensionCount: updatedTimeout.extensionCount,
        maxExtensions: updatedTimeout.maxExtensions,
        cancellationReason: updatedTimeout.cancellationReason as CancellationReason || undefined,
        cancelledBy: updatedTimeout.cancelledBy || undefined,
        cancelledAt: updatedTimeout.cancelledAt || undefined,
        notes: updatedTimeout.notes || undefined,
        createdAt: updatedTimeout.createdAt,
        updatedAt: updatedTimeout.updatedAt
      }

    } catch (error) {
      console.error('Error cancelling payment due to timeout:', error)
      throw error
    }
  }

  /**
   * Cancel payment manually
   */
  static async cancelPaymentManually(
    request: PaymentCancellationRequest
  ): Promise<PaymentTimeoutRecord> {
    try {
      const timeout = await db.paymentTimeout.findUnique({
        where: { paymentId: request.paymentId }
      })

      if (!timeout) {
        throw new Error('Timeout not found for this payment')
      }

      if (timeout.status === 'CANCELLED') {
        throw new Error('Payment already cancelled')
      }

      // Update timeout record
      const updatedTimeout = await db.paymentTimeout.update({
        where: { id: timeout.id },
        data: {
          status: 'CANCELLED',
          cancellationReason: request.reason,
          cancelledBy: request.cancelledBy,
          cancelledAt: new Date(),
          notes: request.notes ? `${timeout.notes || ''}\nManual cancellation: ${request.notes}`.trim() : timeout.notes
        }
      })

      // Update payment status
      await db.payment.update({
        where: { id: request.paymentId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: request.reason
        }
      })

      // Send cancellation notification
      if (this.DEFAULT_CONFIG.notificationEnabled) {
        await this.sendNotification(request.paymentId, 'CANCELLED', `Payment cancelled: ${request.reason}`)
      }

      return {
        id: updatedTimeout.id,
        paymentId: updatedTimeout.paymentId,
        status: updatedTimeout.status as PaymentTimeoutStatus,
        timeoutAt: updatedTimeout.timeoutAt,
        warningAt: updatedTimeout.warningAt,
        extendedAt: updatedTimeout.extendedAt || undefined,
        extensionCount: updatedTimeout.extensionCount,
        maxExtensions: updatedTimeout.maxExtensions,
        cancellationReason: updatedTimeout.cancellationReason as CancellationReason || undefined,
        cancelledBy: updatedTimeout.cancelledBy || undefined,
        cancelledAt: updatedTimeout.cancelledAt || undefined,
        notes: updatedTimeout.notes || undefined,
        createdAt: updatedTimeout.createdAt,
        updatedAt: updatedTimeout.updatedAt
      }

    } catch (error) {
      console.error('Error cancelling payment manually:', error)
      throw error
    }
  }

  /**
   * Get timeout status for a payment
   */
  static async getPaymentTimeout(paymentId: string): Promise<PaymentTimeoutRecord | null> {
    try {
      const timeout = await db.paymentTimeout.findUnique({
        where: { paymentId },
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              patient: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      })

      if (!timeout) {
        return null
      }

      return {
        id: timeout.id,
        paymentId: timeout.paymentId,
        status: timeout.status as PaymentTimeoutStatus,
        timeoutAt: timeout.timeoutAt,
        warningAt: timeout.warningAt,
        extendedAt: timeout.extendedAt || undefined,
        extensionCount: timeout.extensionCount,
        maxExtensions: timeout.maxExtensions,
        cancellationReason: timeout.cancellationReason as CancellationReason || undefined,
        cancelledBy: timeout.cancelledBy || undefined,
        cancelledAt: timeout.cancelledAt || undefined,
        notes: timeout.notes || undefined,
        createdAt: timeout.createdAt,
        updatedAt: timeout.updatedAt
      }

    } catch (error) {
      console.error('Error getting payment timeout:', error)
      throw error
    }
  }

  /**
   * Get all active timeouts
   */
  static async getActiveTimeouts(): Promise<PaymentTimeoutRecord[]> {
    try {
      const timeouts = await db.paymentTimeout.findMany({
        where: {
          status: 'ACTIVE',
          timeoutAt: { gt: new Date() }
        },
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              patient: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { timeoutAt: 'asc' }
      })

      return timeouts.map(timeout => ({
        id: timeout.id,
        paymentId: timeout.paymentId,
        status: timeout.status as PaymentTimeoutStatus,
        timeoutAt: timeout.timeoutAt,
        warningAt: timeout.warningAt,
        extendedAt: timeout.extendedAt || undefined,
        extensionCount: timeout.extensionCount,
        maxExtensions: timeout.maxExtensions,
        cancellationReason: timeout.cancellationReason as CancellationReason || undefined,
        cancelledBy: timeout.cancelledBy || undefined,
        cancelledAt: timeout.cancelledAt || undefined,
        notes: timeout.notes || undefined,
        createdAt: timeout.createdAt,
        updatedAt: timeout.updatedAt
      }))

    } catch (error) {
      console.error('Error getting active timeouts:', error)
      throw error
    }
  }

  /**
   * Get expired timeouts
   */
  static async getExpiredTimeouts(): Promise<PaymentTimeoutRecord[]> {
    try {
      const timeouts = await db.paymentTimeout.findMany({
        where: {
          status: 'ACTIVE',
          timeoutAt: { lte: new Date() }
        },
        include: {
          payment: {
            select: {
              id: true,
              amount: true,
              status: true,
              paymentMethod: true,
              patient: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { timeoutAt: 'asc' }
      })

      return timeouts.map(timeout => ({
        id: timeout.id,
        paymentId: timeout.paymentId,
        status: timeout.status as PaymentTimeoutStatus,
        timeoutAt: timeout.timeoutAt,
        warningAt: timeout.warningAt,
        extendedAt: timeout.extendedAt || undefined,
        extensionCount: timeout.extensionCount,
        maxExtensions: timeout.maxExtensions,
        cancellationReason: timeout.cancellationReason as CancellationReason || undefined,
        cancelledBy: timeout.cancelledBy || undefined,
        cancelledAt: timeout.cancelledAt || undefined,
        notes: timeout.notes || undefined,
        createdAt: timeout.createdAt,
        updatedAt: timeout.updatedAt
      }))

    } catch (error) {
      console.error('Error getting expired timeouts:', error)
      throw error
    }
  }

  /**
   * Process expired timeouts (auto-cancel)
   */
  static async processExpiredTimeouts(): Promise<{
    processed: number
    cancelled: number
    errors: string[]
  }> {
    try {
      const expiredTimeouts = await this.getExpiredTimeouts()
      let processed = 0
      let cancelled = 0
      const errors: string[] = []

      for (const timeout of expiredTimeouts) {
        try {
          processed++
          if (this.DEFAULT_CONFIG.autoCancelEnabled) {
            await this.cancelPaymentDueToTimeout(timeout.paymentId, 'TIMEOUT')
            cancelled++
          } else {
            // Just mark as expired
            await db.paymentTimeout.update({
              where: { id: timeout.id },
              data: { status: 'EXPIRED' }
            })
          }
        } catch (error) {
          errors.push(`Failed to process timeout ${timeout.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      return { processed, cancelled, errors }

    } catch (error) {
      console.error('Error processing expired timeouts:', error)
      throw error
    }
  }

  /**
   * Get timeout statistics
   */
  static async getTimeoutStatistics(dateRange?: { start: Date; end: Date }): Promise<TimeoutStatistics> {
    try {
      const whereClause: any = {}
      
      if (dateRange) {
        whereClause.createdAt = {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }

      const [
        totalTimeouts,
        activeTimeouts,
        expiredTimeouts,
        cancelledTimeouts,
        cancellationReasons,
        timeoutTrends
      ] = await Promise.all([
        db.paymentTimeout.count({ where: whereClause }),
        db.paymentTimeout.count({ 
          where: { ...whereClause, status: 'ACTIVE' } 
        }),
        db.paymentTimeout.count({ 
          where: { ...whereClause, status: 'EXPIRED' } 
        }),
        db.paymentTimeout.count({ 
          where: { ...whereClause, status: 'CANCELLED' } 
        }),
        db.paymentTimeout.groupBy({
          by: ['cancellationReason'],
          where: { ...whereClause, status: 'CANCELLED' },
          _count: { cancellationReason: true }
        }),
        this.getTimeoutTrends(dateRange)
      ])

      // Calculate average timeout duration
      const timeoutsWithDuration = await db.paymentTimeout.findMany({
        where: {
          ...whereClause,
          status: { in: ['CANCELLED', 'EXPIRED'] },
          cancelledAt: { not: null }
        },
        select: {
          createdAt: true,
          cancelledAt: true
        }
      })

      const averageTimeoutDuration = timeoutsWithDuration.length > 0
        ? timeoutsWithDuration.reduce((sum, timeout) => {
            const duration = timeout.cancelledAt!.getTime() - timeout.createdAt.getTime()
            return sum + duration
          }, 0) / timeoutsWithDuration.length / (1000 * 60) // Convert to minutes
        : 0

      // Format cancellation reasons
      const cancellationReasonsFormatted: Record<string, number> = {}
      cancellationReasons.forEach(reason => {
        cancellationReasonsFormatted[reason.cancellationReason || 'UNKNOWN'] = reason._count.cancellationReason
      })

      return {
        totalTimeouts,
        activeTimeouts,
        expiredTimeouts,
        cancelledTimeouts,
        averageTimeoutDuration,
        cancellationReasons: cancellationReasonsFormatted,
        timeoutTrends
      }

    } catch (error) {
      console.error('Error getting timeout statistics:', error)
      throw error
    }
  }

  /**
   * Get timeout trends
   */
  private static async getTimeoutTrends(dateRange?: { start: Date; end: Date }): Promise<Array<{
    date: string
    count: number
    expired: number
    cancelled: number
  }>> {
    try {
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      const endDate = dateRange?.end || new Date()

      // This is a simplified implementation
      // In a real system, you'd use proper date aggregation
      const timeouts = await db.paymentTimeout.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          createdAt: true,
          status: true
        },
        orderBy: { createdAt: 'asc' }
      })

      // Group by date
      const trends: Record<string, { count: number; expired: number; cancelled: number }> = {}
      
      timeouts.forEach(timeout => {
        const date = timeout.createdAt.toISOString().split('T')[0]
        if (!trends[date]) {
          trends[date] = { count: 0, expired: 0, cancelled: 0 }
        }
        trends[date].count++
        if (timeout.status === 'EXPIRED') trends[date].expired++
        if (timeout.status === 'CANCELLED') trends[date].cancelled++
      })

      return Object.entries(trends).map(([date, data]) => ({
        date,
        ...data
      }))

    } catch (error) {
      console.error('Error getting timeout trends:', error)
      return []
    }
  }

  /**
   * Schedule notification
   */
  private static async scheduleNotification(
    paymentId: string,
    type: 'WARNING' | 'EXPIRED' | 'CANCELLED',
    scheduledFor: Date
  ): Promise<void> {
    try {
      // In a real implementation, this would integrate with a job queue
      // For now, we'll just log the notification
      console.log(`Scheduled ${type} notification for payment ${paymentId} at ${scheduledFor.toISOString()}`)
      
      // Store notification record
      await db.paymentTimeoutNotification.create({
        data: {
          paymentId,
          type,
          scheduledFor,
          status: 'PENDING',
          message: this.generateNotificationMessage(type, paymentId)
        }
      })
    } catch (error) {
      console.error('Error scheduling notification:', error)
    }
  }

  /**
   * Send notification
   */
  private static async sendNotification(
    paymentId: string,
    type: 'WARNING' | 'EXPIRED' | 'CANCELLED',
    message: string
  ): Promise<void> {
    try {
      // In a real implementation, this would send actual notifications
      console.log(`Sending ${type} notification for payment ${paymentId}: ${message}`)
      
      // Update notification status
      await db.paymentTimeoutNotification.updateMany({
        where: { paymentId, type, status: 'PENDING' },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          message
        }
      })
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  /**
   * Generate notification message
   */
  private static generateNotificationMessage(
    type: 'WARNING' | 'EXPIRED' | 'CANCELLED',
    paymentId: string
  ): string {
    const messages = {
      WARNING: `Payment ${paymentId} will expire soon. Please complete your payment.`,
      EXPIRED: `Payment ${paymentId} has expired. Please create a new payment.`,
      CANCELLED: `Payment ${paymentId} has been cancelled.`
    }
    return messages[type]
  }
}


