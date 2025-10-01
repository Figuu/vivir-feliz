import { db } from './db'

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'

export interface PaymentStatusTransition {
  from: PaymentStatus
  to: PaymentStatus
  allowed: boolean
  reason?: string
}

export interface PaymentStatusUpdate {
  id: string
  paymentId: string
  fromStatus: PaymentStatus
  toStatus: PaymentStatus
  updatedBy: string
  updatedAt: Date
  reason?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface PaymentStatusHistory {
  id: string
  paymentId: string
  status: PaymentStatus
  updatedBy: string
  updatedAt: Date
  reason?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface PaymentStatusInfo {
  currentStatus: PaymentStatus
  statusHistory: PaymentStatusHistory[]
  canTransitionTo: PaymentStatus[]
  lastUpdated: Date
  lastUpdatedBy: string
  totalDuration: number // in minutes
  timeInCurrentStatus: number // in minutes
  nextAction?: string
  requiresAttention: boolean
}

export interface PaymentStatusStatistics {
  statusCounts: { [key in PaymentStatus]: number }
  totalPayments: number
  statusDistribution: { [key in PaymentStatus]: number }
  averageProcessingTime: number // in minutes
  completionRate: number
  failureRate: number
}

export class PaymentStatusTracker {
  // Define valid status transitions
  private static readonly STATUS_TRANSITIONS: { [key in PaymentStatus]: PaymentStatus[] } = {
    'PENDING': ['PROCESSING', 'CANCELLED'],
    'PROCESSING': ['COMPLETED', 'FAILED', 'CANCELLED'],
    'COMPLETED': ['REFUNDED'],
    'FAILED': ['PROCESSING', 'CANCELLED'],
    'CANCELLED': ['PROCESSING'], // Can retry
    'REFUNDED': [] // Terminal state
  }

  // Define status descriptions
  private static readonly STATUS_DESCRIPTIONS: { [key in PaymentStatus]: string } = {
    'PENDING': 'Payment request received, awaiting processing',
    'PROCESSING': 'Payment is currently being processed',
    'COMPLETED': 'Payment has been successfully completed',
    'FAILED': 'Payment processing failed',
    'CANCELLED': 'Payment has been cancelled',
    'REFUNDED': 'Payment has been refunded'
  }

  // Define status colors for UI
  private static readonly STATUS_COLORS: { [key in PaymentStatus]: string } = {
    'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'PROCESSING': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'FAILED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'CANCELLED': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    'REFUNDED': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  }

  // Define status priorities for sorting
  private static readonly STATUS_PRIORITIES: { [key in PaymentStatus]: number } = {
    'FAILED': 1, // Highest priority
    'PROCESSING': 2,
    'PENDING': 3,
    'CANCELLED': 4,
    'REFUNDED': 5,
    'COMPLETED': 6 // Lowest priority
  }

  /**
   * Update payment status with validation and history tracking
   */
  static async updatePaymentStatus(
    paymentId: string,
    newStatus: PaymentStatus,
    updatedBy: string,
    reason?: string,
    notes?: string,
    metadata?: Record<string, any>
  ): Promise<PaymentStatusUpdate> {
    try {
      // Get current payment
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        select: { id: true, status: true, createdAt: true }
      })

      if (!payment) {
        throw new Error('Payment not found')
      }

      const currentStatus = payment.status as PaymentStatus

      // Validate status transition
      const transitionValidation = this.validateStatusTransition(currentStatus, newStatus)
      if (!transitionValidation.allowed) {
        throw new Error(transitionValidation.reason || 'Invalid status transition')
      }

      // Use transaction to update status and create history record
      const result = await db.$transaction(async (tx) => {
        // Update payment status
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: { 
            status: newStatus,
            updatedAt: new Date()
          }
        })

        // Create status history record
        const statusHistory = await tx.paymentStatusHistory.create({
          data: {
            paymentId,
            toStatus: newStatus,
            changedBy: updatedBy,
            reason,
            metadata: metadata ? JSON.stringify(metadata) : null
          }
        })

        return { updatedPayment, statusHistory }
      })

      return {
        id: result.statusHistory.id,
        paymentId,
        fromStatus: currentStatus,
        toStatus: newStatus,
        updatedBy,
        updatedAt: result.statusHistory.createdAt,
        reason,
        notes,
        metadata
      }

    } catch (error) {
      console.error('Error updating payment status:', error)
      throw error
    }
  }

  /**
   * Get payment status information with history
   */
  static async getPaymentStatusInfo(paymentId: string): Promise<PaymentStatusInfo> {
    try {
      const [payment, statusHistory] = await Promise.all([
        db.payment.findUnique({
          where: { id: paymentId },
          select: { 
            id: true, 
            status: true, 
            createdAt: true,
            updatedAt: true
          }
        }),
        db.paymentStatusHistory.findMany({
          where: { paymentId },
          orderBy: { createdAt: 'desc' }
        })
      ])

      if (!payment) {
        throw new Error('Payment not found')
      }

      const currentStatus = payment.status as PaymentStatus
      const canTransitionTo = this.STATUS_TRANSITIONS[currentStatus] || []

      // Calculate time in current status
      const lastStatusChange = statusHistory[0]?.createdAt || payment.createdAt
      const timeInCurrentStatus = Math.floor(
        (new Date().getTime() - lastStatusChange.getTime()) / (1000 * 60)
      )

      // Calculate total duration
      const totalDuration = Math.floor(
        (new Date().getTime() - payment.createdAt.getTime()) / (1000 * 60)
      )

      // Determine next action
      const nextAction = this.getNextAction(currentStatus, timeInCurrentStatus)

      // Check if requires attention
      const requiresAttention = this.requiresAttention(currentStatus, timeInCurrentStatus)

      return {
        currentStatus,
        statusHistory: statusHistory.map(history => ({
          id: history.id,
          paymentId: history.paymentId,
          status: history.toStatus as PaymentStatus,
          updatedBy: history.changedBy,
          updatedAt: history.createdAt,
          reason: history.reason || undefined,
          metadata: history.metadata ? JSON.parse(String(history.metadata)) : undefined
        })),
        canTransitionTo,
        lastUpdated: payment.updatedAt,
        lastUpdatedBy: statusHistory[0]?.changedBy || 'system',
        totalDuration,
        timeInCurrentStatus,
        nextAction,
        requiresAttention
      }

    } catch (error) {
      console.error('Error getting payment status info:', error)
      throw error
    }
  }

  /**
   * Get payment status history
   */
  static async getPaymentStatusHistory(paymentId: string): Promise<PaymentStatusHistory[]> {
    try {
      const history = await db.paymentStatusHistory.findMany({
        where: { paymentId },
        orderBy: { updatedAt: 'desc' }
      })

      return history.map(record => ({
        id: record.id,
        paymentId: record.paymentId,
        status: record.toStatus as PaymentStatus,
        updatedBy: record.changedBy,
        updatedAt: record.createdAt,
        reason: record.reason || undefined,
        metadata: record.metadata ? JSON.parse(String(record.metadata)) : undefined
      }))

    } catch (error) {
      console.error('Error getting payment status history:', error)
      throw error
    }
  }

  /**
   * Get payments by status with priority sorting
   */
  static async getPaymentsByStatus(
    status: PaymentStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    payments: any[]
    totalCount: number
  }> {
    try {
      const [payments, totalCount] = await Promise.all([
        db.payment.findMany({
          where: { status },
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
                    profile: {
                      select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                      }
                    }
                  }
                },
                specialty: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: [
            { updatedAt: 'asc' }, // Oldest first for processing
            { createdAt: 'asc' }
          ],
          take: limit,
          skip: offset
        }),
        db.payment.count({ where: { status } })
      ])

      return { payments, totalCount }

    } catch (error) {
      console.error('Error getting payments by status:', error)
      throw error
    }
  }

  /**
   * Get payments requiring attention
   */
  static async getPaymentsRequiringAttention(): Promise<{
    failed: any[]
    processing: any[]
    pending: any[]
  }> {
    try {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const [failed, processing, pending] = await Promise.all([
        // Failed payments
        db.payment.findMany({
          where: { status: 'FAILED' },
          include: {
            consultationRequest: {
              include: {
                patient: { select: { firstName: true, lastName: true } },
                parent: { select: { profile: { select: { firstName: true, lastName: true, email: true } } } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),

        // Processing payments older than 1 hour
        db.payment.findMany({
          where: {
            status: 'PROCESSING',
            updatedAt: { lte: oneHourAgo }
          },
          include: {
            consultationRequest: {
              include: {
                patient: { select: { firstName: true, lastName: true } },
                parent: { select: { profile: { select: { firstName: true, lastName: true, email: true } } } }
              }
            }
          },
          orderBy: { updatedAt: 'asc' }
        }),

        // Pending payments older than 1 day
        db.payment.findMany({
          where: {
            status: 'PENDING',
            createdAt: { lte: oneDayAgo }
          },
          include: {
            consultationRequest: {
              include: {
                patient: { select: { firstName: true, lastName: true } },
                parent: { select: { profile: { select: { firstName: true, lastName: true, email: true } } } }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        })
      ])

      return { failed, processing, pending }

    } catch (error) {
      console.error('Error getting payments requiring attention:', error)
      throw error
    }
  }

  /**
   * Get payment status statistics
   */
  static async getPaymentStatusStatistics(dateRange?: { start: Date; end: Date }): Promise<PaymentStatusStatistics> {
    try {
      const whereClause = dateRange ? {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      } : {}

      const [
        statusCounts,
        totalPayments,
        completedPayments,
        failedPayments,
        processingTimes
      ] = await Promise.all([
        db.payment.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true }
        }),
        db.payment.count({ where: whereClause }),
        db.payment.count({ 
          where: { 
            ...whereClause,
            status: 'COMPLETED' 
          } 
        }),
        db.payment.count({ 
          where: { 
            ...whereClause,
            status: 'FAILED' 
          } 
        }),
        db.payment.findMany({
          where: {
            ...whereClause,
            status: 'COMPLETED'
          },
          select: {
            createdAt: true,
            updatedAt: true
          }
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

      // Calculate status distribution
      const statusDistribution: { [key in PaymentStatus]: number } = {
        'PENDING': 0,
        'PROCESSING': 0,
        'COMPLETED': 0,
        'FAILED': 0,
        'CANCELLED': 0,
        'REFUNDED': 0
      }

      Object.keys(formattedStatusCounts).forEach(status => {
        statusDistribution[status as PaymentStatus] = totalPayments > 0 ? 
          (formattedStatusCounts[status as PaymentStatus] / totalPayments) * 100 : 0
      })

      // Calculate average processing time
      const processingTimesInMinutes = processingTimes.map(payment => 
        Math.floor((payment.updatedAt.getTime() - payment.createdAt.getTime()) / (1000 * 60))
      )
      const averageProcessingTime = processingTimesInMinutes.length > 0 ? 
        processingTimesInMinutes.reduce((sum, time) => sum + time, 0) / processingTimesInMinutes.length : 0

      // Calculate rates
      const completionRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0
      const failureRate = totalPayments > 0 ? (failedPayments / totalPayments) * 100 : 0

      return {
        statusCounts: formattedStatusCounts,
        totalPayments,
        statusDistribution,
        averageProcessingTime,
        completionRate,
        failureRate
      }

    } catch (error) {
      console.error('Error getting payment status statistics:', error)
      throw error
    }
  }

  /**
   * Auto-update payment statuses based on time
   */
  static async autoUpdatePaymentStatuses(): Promise<{
    updated: number
    errors: string[]
  }> {
    try {
      const now = new Date()
      const errors: string[] = []
      let updated = 0

      // Find processing payments older than 2 hours
      const processingPayments = await db.payment.findMany({
        where: {
          status: 'PROCESSING',
          updatedAt: {
            lte: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
          }
        }
      })

      // Update processing payments to failed
      for (const payment of processingPayments) {
        try {
          await this.updatePaymentStatus(
            payment.id,
            'FAILED',
            'system',
            'Automatically failed due to timeout'
          )
          updated++
        } catch (error) {
          errors.push(`Failed to update payment ${payment.id}: ${error}`)
        }
      }

      return { updated, errors }

    } catch (error) {
      console.error('Error in auto-update payment statuses:', error)
      throw error
    }
  }

  /**
   * Validate status transition
   */
  static validateStatusTransition(
    fromStatus: PaymentStatus, 
    toStatus: PaymentStatus
  ): PaymentStatusTransition {
    const allowedTransitions = this.STATUS_TRANSITIONS[fromStatus] || []
    const allowed = allowedTransitions.includes(toStatus)

    return {
      from: fromStatus,
      to: toStatus,
      allowed,
      reason: allowed ? undefined : `Cannot transition from ${fromStatus} to ${toStatus}`
    }
  }

  /**
   * Get possible transitions for a status
   */
  static getPossibleTransitions(currentStatus: PaymentStatus): PaymentStatus[] {
    return this.STATUS_TRANSITIONS[currentStatus] || []
  }

  /**
   * Get status description
   */
  static getStatusDescription(status: PaymentStatus): string {
    return this.STATUS_DESCRIPTIONS[status]
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status: PaymentStatus): string {
    return this.STATUS_COLORS[status]
  }

  /**
   * Get status priority for sorting
   */
  static getStatusPriority(status: PaymentStatus): number {
    return this.STATUS_PRIORITIES[status]
  }

  /**
   * Get next action for a status
   */
  private static getNextAction(status: PaymentStatus, timeInStatus: number): string | undefined {
    switch (status) {
      case 'PENDING':
        return 'Process payment'
      case 'PROCESSING':
        if (timeInStatus > 60) {
          return 'Check payment status'
        }
        return 'Wait for completion'
      case 'FAILED':
        return 'Retry or investigate'
      case 'COMPLETED':
        return 'Payment completed'
      case 'CANCELLED':
        return 'Can retry if needed'
      case 'REFUNDED':
        return 'Refund completed'
      default:
        return undefined
    }
  }

  /**
   * Check if payment requires attention
   */
  private static requiresAttention(status: PaymentStatus, timeInStatus: number): boolean {
    switch (status) {
      case 'FAILED':
        return true
      case 'PROCESSING':
        return timeInStatus > 60 // More than 1 hour
      case 'PENDING':
        return timeInStatus > 1440 // More than 1 day
      default:
        return false
    }
  }
}


