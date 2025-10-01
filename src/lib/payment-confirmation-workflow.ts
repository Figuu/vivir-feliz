import { db } from './db'

export type PaymentConfirmationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type PaymentReviewAction = 'APPROVE' | 'REJECT' | 'HOLD'

export interface PaymentConfirmationRequest {
  id: string
  paymentId: string
  status: string
  requestedBy: string
  requestedAt: Date
  reviewedBy: string | null
  reviewedAt: Date | null
  notes: string | null
  priority: string
}

export class PaymentConfirmationWorkflowManager {
  /**
   * Create a payment confirmation request
   */
  static async createConfirmationRequest(
    paymentId: string,
    requestedBy: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM',
    notes?: string
  ): Promise<PaymentConfirmationRequest> {
    try {
      // Check if payment exists
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: {
          consultationRequest: {
            include: {
              patient: { select: { firstName: true, lastName: true } },
              parent: {
                select: {
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        }
      })

      if (!payment) {
        throw new Error('Payment not found')
      }

      if (payment.status !== 'PENDING') {
        throw new Error('Only pending payments can be submitted for confirmation')
      }

      // Check if confirmation request already exists
      const existingRequest = await db.paymentConfirmationRequest.findFirst({
        where: { paymentId }
      })

      if (existingRequest) {
        throw new Error('Confirmation request already exists for this payment')
      }

      // Create confirmation request
      const confirmationRequest = await db.paymentConfirmationRequest.create({
        data: {
          paymentId,
          status: 'PENDING',
          requestedBy,
          priority,
          notes
        }
      })

      return {
        id: confirmationRequest.id,
        paymentId: confirmationRequest.paymentId,
        status: confirmationRequest.status,
        requestedBy: confirmationRequest.requestedBy,
        requestedAt: confirmationRequest.createdAt,
        reviewedBy: confirmationRequest.reviewedBy,
        reviewedAt: confirmationRequest.reviewedAt,
        notes: confirmationRequest.notes,
        priority: confirmationRequest.priority
      }

    } catch (error) {
      console.error('Error creating payment confirmation request:', error)
      throw error
    }
  }

  /**
   * Review a payment confirmation request
   */
  static async reviewConfirmationRequest(
    confirmationRequestId: string,
    action: PaymentReviewAction,
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<PaymentConfirmationRequest> {
    try {
      const confirmationRequest = await db.paymentConfirmationRequest.findUnique({
        where: { id: confirmationRequestId }
      })

      if (!confirmationRequest) {
        throw new Error('Confirmation request not found')
      }

      if (confirmationRequest.status !== 'PENDING') {
        throw new Error('Confirmation request is not in pending status')
      }

      // Determine new status based on action
      let newStatus: string
      switch (action) {
        case 'APPROVE':
          newStatus = 'APPROVED'
          break
        case 'REJECT':
          newStatus = 'REJECTED'
          break
        case 'HOLD':
          newStatus = 'PENDING'
          break
        default:
          throw new Error('Invalid review action')
      }

      // Update confirmation request
      const updatedRequest = await db.paymentConfirmationRequest.update({
        where: { id: confirmationRequestId },
        data: {
          status: newStatus,
          reviewedBy,
          reviewedAt: new Date(),
          notes: reviewNotes || confirmationRequest.notes
        }
      })

      // If approved, update payment status
      if (action === 'APPROVE') {
        await db.payment.update({
          where: { id: confirmationRequest.paymentId },
          data: {
            status: 'CONFIRMED',
            confirmedBy: reviewedBy,
            confirmedAt: new Date()
          }
        })
      }

      // If rejected, update payment status
      if (action === 'REJECT') {
        await db.payment.update({
          where: { id: confirmationRequest.paymentId },
          data: {
            status: 'REJECTED'
          }
        })
      }

      return {
        id: updatedRequest.id,
        paymentId: updatedRequest.paymentId,
        status: updatedRequest.status,
        requestedBy: updatedRequest.requestedBy,
        requestedAt: updatedRequest.createdAt,
        reviewedBy: updatedRequest.reviewedBy,
        reviewedAt: updatedRequest.reviewedAt,
        notes: updatedRequest.notes,
        priority: updatedRequest.priority
      }

    } catch (error) {
      console.error('Error reviewing payment confirmation request:', error)
      throw error
    }
  }

  /**
   * Get confirmation requests with filtering and pagination
   */
  static async getConfirmationRequests(filters?: {
    status?: string
    priority?: string
    requestedBy?: string
    dateRange?: { start: Date; end: Date }
    page?: number
    limit?: number
  }): Promise<{
    requests: any[]
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
      const page = filters?.page || 1
      const limit = Math.min(filters?.limit || 20, 100)
      const offset = (page - 1) * limit

      // Build where clause
      const whereClause: any = {}

      if (filters?.status) {
        whereClause.status = filters.status
      }

      if (filters?.priority) {
        whereClause.priority = filters.priority
      }

      if (filters?.requestedBy) {
        whereClause.requestedBy = filters.requestedBy
      }

      if (filters?.dateRange) {
        whereClause.createdAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        }
      }

      // Fetch requests
      const [requests, totalCount] = await Promise.all([
        db.paymentConfirmationRequest.findMany({
          where: whereClause,
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'asc' }
          ],
          skip: offset,
          take: limit
        }),
        db.paymentConfirmationRequest.count({ where: whereClause })
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return {
        requests,
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
      console.error('Error getting confirmation requests:', error)
      throw error
    }
  }

  /**
   * Get confirmation request details
   */
  static async getConfirmationRequestDetails(confirmationRequestId: string): Promise<any> {
    try {
      const request = await db.paymentConfirmationRequest.findUnique({
        where: { id: confirmationRequestId }
      })

      if (!request) {
        throw new Error('Confirmation request not found')
      }

      // Get payment details
      const payment = await db.payment.findUnique({
        where: { id: request.paymentId },
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
              }
            }
          }
        }
      })

      return {
        ...request,
        payment
      }

    } catch (error) {
      console.error('Error getting confirmation request details:', error)
      throw error
    }
  }

  /**
   * Get confirmation statistics
   */
  static async getConfirmationStatistics(dateRange?: { start: Date; end: Date }): Promise<{
    totalRequests: number
    statusCounts: Record<string, number>
    priorityCounts: Record<string, number>
    averageReviewTime: number
    approvalRate: number
  }> {
    try {
      const whereClause = dateRange ? {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      } : {}

      const [
        totalRequests,
        statusCounts,
        priorityCounts,
        completedRequests
      ] = await Promise.all([
        db.paymentConfirmationRequest.count({ where: whereClause }),
        db.paymentConfirmationRequest.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true }
        }),
        db.paymentConfirmationRequest.groupBy({
          by: ['priority'],
          where: whereClause,
          _count: { priority: true }
        }),
        db.paymentConfirmationRequest.findMany({
          where: {
            ...whereClause,
            reviewedAt: { not: null }
          },
          select: {
            createdAt: true,
            reviewedAt: true,
            status: true
          }
        })
      ])

      // Format status counts
      const formattedStatusCounts: Record<string, number> = {}
      statusCounts.forEach(item => {
        formattedStatusCounts[item.status] = item._count.status
      })

      // Format priority counts
      const formattedPriorityCounts: Record<string, number> = {}
      priorityCounts.forEach(item => {
        formattedPriorityCounts[item.priority] = item._count.priority
      })

      // Calculate average review time
      const reviewTimes = completedRequests.map(request =>
        request.reviewedAt ?
          (request.reviewedAt.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60) : 0
      )
      const averageReviewTime = reviewTimes.length > 0 ?
        reviewTimes.reduce((sum, time) => sum + time, 0) / reviewTimes.length : 0

      // Calculate rates
      const approvedCount = formattedStatusCounts['APPROVED'] || 0
      const approvalRate = totalRequests > 0 ? (approvedCount / totalRequests) * 100 : 0

      return {
        totalRequests,
        statusCounts: formattedStatusCounts,
        priorityCounts: formattedPriorityCounts,
        averageReviewTime,
        approvalRate
      }

    } catch (error) {
      console.error('Error getting confirmation statistics:', error)
      throw error
    }
  }

  /**
   * Get status description
   */
  static getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      'PENDING': 'Payment is pending administrative review',
      'APPROVED': 'Payment has been approved by administrator',
      'REJECTED': 'Payment has been rejected by administrator'
    }
    return descriptions[status] || 'Unknown status'
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'APPROVED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'REJECTED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    return colors[status] || colors.PENDING
  }

  /**
   * Get priority color for UI
   */
  static getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      'LOW': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'NORMAL': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'MEDIUM': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'HIGH': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'URGENT': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    return colors[priority] || colors.NORMAL
  }
}
