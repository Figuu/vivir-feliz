import { db } from './db'

export type PaymentConfirmationStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'REQUIRES_CLARIFICATION' | 'ESCALATED'
export type PaymentReviewAction = 'APPROVE' | 'REJECT' | 'REQUEST_CLARIFICATION' | 'ESCALATE' | 'HOLD'

export interface PaymentConfirmationRequest {
  id: string
  paymentId: string
  status: PaymentConfirmationStatus
  requestedBy: string
  requestedAt: Date
  reviewedBy?: string
  reviewedAt?: Date
  reviewNotes?: string
  escalationReason?: string
  holdReason?: string
  metadata?: Record<string, any>
}

export interface PaymentReviewCriteria {
  amountThreshold: number
  paymentMethod: string[]
  requiresReceipt: boolean
  requiresDocumentation: boolean
  autoApprove: boolean
  escalationThreshold: number
}

export interface PaymentConfirmationWorkflow {
  id: string
  paymentId: string
  currentStep: number
  totalSteps: number
  status: PaymentConfirmationStatus
  assignedTo?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  steps: PaymentWorkflowStep[]
}

export interface PaymentWorkflowStep {
  stepNumber: number
  stepName: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  assignedTo?: string
  completedBy?: string
  completedAt?: Date
  notes?: string
  required: boolean
}

export class PaymentConfirmationWorkflow {
  // Define workflow steps
  private static readonly WORKFLOW_STEPS = [
    { stepNumber: 1, stepName: 'Initial Review', required: true },
    { stepNumber: 2, stepName: 'Receipt Verification', required: true },
    { stepNumber: 3, stepName: 'Amount Validation', required: true },
    { stepNumber: 4, stepName: 'Documentation Check', required: false },
    { stepNumber: 5, stepName: 'Final Approval', required: true }
  ]

  // Define confirmation status descriptions
  private static readonly STATUS_DESCRIPTIONS: { [key in PaymentConfirmationStatus]: string } = {
    'PENDING_REVIEW': 'Payment is pending administrative review',
    'APPROVED': 'Payment has been approved by administrator',
    'REJECTED': 'Payment has been rejected by administrator',
    'REQUIRES_CLARIFICATION': 'Payment requires additional clarification',
    'ESCALATED': 'Payment has been escalated for higher-level review'
  }

  // Define status colors for UI
  private static readonly STATUS_COLORS: { [key in PaymentConfirmationStatus]: string } = {
    'PENDING_REVIEW': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'APPROVED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'REJECTED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'REQUIRES_CLARIFICATION': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'ESCALATED': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  }

  /**
   * Create a payment confirmation request
   */
  static async createConfirmationRequest(
    paymentId: string,
    requestedBy: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM'
  ): Promise<PaymentConfirmationRequest> {
    try {
      // Check if payment exists and is eligible for confirmation
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: {
          consultationRequest: {
            include: {
              patient: { select: { firstName: true, lastName: true } },
              parent: { select: { firstName: true, lastName: true, email: true } }
            }
          }
        }
      })

      if (!payment) {
        throw new Error('Payment not found')
      }

      if (payment.status !== 'COMPLETED') {
        throw new Error('Only completed payments can be submitted for confirmation')
      }

      // Check if confirmation request already exists
      const existingRequest = await db.paymentConfirmationRequest.findUnique({
        where: { paymentId }
      })

      if (existingRequest) {
        throw new Error('Confirmation request already exists for this payment')
      }

      // Create confirmation request
      const confirmationRequest = await db.paymentConfirmationRequest.create({
        data: {
          paymentId,
          status: 'PENDING_REVIEW',
          requestedBy,
          priority
        }
      })

      // Create workflow
      await this.createWorkflow(paymentId, priority)

      return {
        id: confirmationRequest.id,
        paymentId: confirmationRequest.paymentId,
        status: confirmationRequest.status as PaymentConfirmationStatus,
        requestedBy: confirmationRequest.requestedBy,
        requestedAt: confirmationRequest.requestedAt,
        reviewedBy: confirmationRequest.reviewedBy || undefined,
        reviewedAt: confirmationRequest.reviewedAt || undefined,
        reviewNotes: confirmationRequest.reviewNotes || undefined,
        escalationReason: confirmationRequest.escalationReason || undefined,
        holdReason: confirmationRequest.holdReason || undefined,
        metadata: confirmationRequest.metadata ? JSON.parse(confirmationRequest.metadata) : undefined
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
    reviewNotes?: string,
    escalationReason?: string,
    holdReason?: string
  ): Promise<PaymentConfirmationRequest> {
    try {
      const confirmationRequest = await db.paymentConfirmationRequest.findUnique({
        where: { id: confirmationRequestId }
      })

      if (!confirmationRequest) {
        throw new Error('Confirmation request not found')
      }

      if (confirmationRequest.status !== 'PENDING_REVIEW') {
        throw new Error('Confirmation request is not in pending review status')
      }

      // Determine new status based on action
      let newStatus: PaymentConfirmationStatus
      switch (action) {
        case 'APPROVE':
          newStatus = 'APPROVED'
          break
        case 'REJECT':
          newStatus = 'REJECTED'
          break
        case 'REQUEST_CLARIFICATION':
          newStatus = 'REQUIRES_CLARIFICATION'
          break
        case 'ESCALATE':
          newStatus = 'ESCALATED'
          break
        case 'HOLD':
          newStatus = 'PENDING_REVIEW' // Keep in pending but add hold reason
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
          reviewNotes,
          escalationReason,
          holdReason
        }
      })

      // Update workflow
      await this.updateWorkflow(confirmationRequest.paymentId, action, reviewedBy, reviewNotes)

      // If approved, update payment status
      if (action === 'APPROVE') {
        await db.payment.update({
          where: { id: confirmationRequest.paymentId },
          data: { 
            status: 'COMPLETED',
            confirmedBy: reviewedBy,
            confirmedAt: new Date()
          }
        })
      }

      return {
        id: updatedRequest.id,
        paymentId: updatedRequest.paymentId,
        status: updatedRequest.status as PaymentConfirmationStatus,
        requestedBy: updatedRequest.requestedBy,
        requestedAt: updatedRequest.requestedAt,
        reviewedBy: updatedRequest.reviewedBy || undefined,
        reviewedAt: updatedRequest.reviewedAt || undefined,
        reviewNotes: updatedRequest.reviewNotes || undefined,
        escalationReason: updatedRequest.escalationReason || undefined,
        holdReason: updatedRequest.holdReason || undefined,
        metadata: updatedRequest.metadata ? JSON.parse(updatedRequest.metadata) : undefined
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
    status?: PaymentConfirmationStatus
    priority?: string
    assignedTo?: string
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
      
      if (filters?.assignedTo) {
        whereClause.assignedTo = filters.assignedTo
      }
      
      if (filters?.dateRange) {
        whereClause.requestedAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        }
      }

      // Fetch requests
      const [requests, totalCount] = await Promise.all([
        db.paymentConfirmationRequest.findMany({
          where: whereClause,
          include: {
            payment: {
              include: {
                consultationRequest: {
                  include: {
                    patient: { select: { firstName: true, lastName: true } },
                    parent: { select: { firstName: true, lastName: true, email: true } },
                    specialty: { select: { name: true } }
                  }
                }
              }
            }
          },
          orderBy: [
            { priority: 'asc' }, // Urgent first
            { requestedAt: 'asc' } // Oldest first
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
        where: { id: confirmationRequestId },
        include: {
          payment: {
            include: {
              consultationRequest: {
                include: {
                  patient: { select: { firstName: true, lastName: true, dateOfBirth: true } },
                  parent: { select: { firstName: true, lastName: true, email: true, phone: true } },
                  specialty: { select: { name: true } },
                  therapist: { 
                    select: { 
                      firstName: true, 
                      lastName: true,
                      user: { select: { name: true } }
                    } 
                  }
                }
              }
            }
          },
          workflow: {
            include: {
              steps: {
                orderBy: { stepNumber: 'asc' }
              }
            }
          }
        }
      })

      if (!request) {
        throw new Error('Confirmation request not found')
      }

      return request

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
    statusCounts: { [key in PaymentConfirmationStatus]: number }
    priorityCounts: { [key: string]: number }
    averageReviewTime: number // in hours
    approvalRate: number
    escalationRate: number
  }> {
    try {
      const whereClause = dateRange ? {
        requestedAt: {
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
            requestedAt: true,
            reviewedAt: true,
            status: true
          }
        })
      ])

      // Format status counts
      const formattedStatusCounts: { [key in PaymentConfirmationStatus]: number } = {
        'PENDING_REVIEW': 0,
        'APPROVED': 0,
        'REJECTED': 0,
        'REQUIRES_CLARIFICATION': 0,
        'ESCALATED': 0
      }

      statusCounts.forEach(item => {
        formattedStatusCounts[item.status as PaymentConfirmationStatus] = item._count.status
      })

      // Format priority counts
      const formattedPriorityCounts: { [key: string]: number } = {}
      priorityCounts.forEach(item => {
        formattedPriorityCounts[item.priority] = item._count.priority
      })

      // Calculate average review time
      const reviewTimes = completedRequests.map(request => 
        request.reviewedAt ? 
          (request.reviewedAt.getTime() - request.requestedAt.getTime()) / (1000 * 60 * 60) : 0
      )
      const averageReviewTime = reviewTimes.length > 0 ? 
        reviewTimes.reduce((sum, time) => sum + time, 0) / reviewTimes.length : 0

      // Calculate rates
      const approvedCount = formattedStatusCounts.APPROVED
      const escalatedCount = formattedStatusCounts.ESCALATED
      const approvalRate = totalRequests > 0 ? (approvedCount / totalRequests) * 100 : 0
      const escalationRate = totalRequests > 0 ? (escalatedCount / totalRequests) * 100 : 0

      return {
        totalRequests,
        statusCounts: formattedStatusCounts,
        priorityCounts: formattedPriorityCounts,
        averageReviewTime,
        approvalRate,
        escalationRate
      }

    } catch (error) {
      console.error('Error getting confirmation statistics:', error)
      throw error
    }
  }

  /**
   * Create workflow for payment confirmation
   */
  private static async createWorkflow(
    paymentId: string,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  ): Promise<void> {
    try {
      const workflow = await db.paymentConfirmationWorkflow.create({
        data: {
          paymentId,
          currentStep: 1,
          totalSteps: this.WORKFLOW_STEPS.length,
          status: 'PENDING_REVIEW',
          priority
        }
      })

      // Create workflow steps
      const steps = this.WORKFLOW_STEPS.map(step => ({
        workflowId: workflow.id,
        stepNumber: step.stepNumber,
        stepName: step.stepName,
        status: 'PENDING' as const,
        required: step.required
      }))

      await db.paymentWorkflowStep.createMany({
        data: steps
      })

    } catch (error) {
      console.error('Error creating workflow:', error)
      throw error
    }
  }

  /**
   * Update workflow based on review action
   */
  private static async updateWorkflow(
    paymentId: string,
    action: PaymentReviewAction,
    reviewedBy: string,
    notes?: string
  ): Promise<void> {
    try {
      const workflow = await db.paymentConfirmationWorkflow.findUnique({
        where: { paymentId },
        include: { steps: { orderBy: { stepNumber: 'asc' } } }
      })

      if (!workflow) {
        throw new Error('Workflow not found')
      }

      // Update current step based on action
      let newStep = workflow.currentStep
      let newStatus = workflow.status

      switch (action) {
        case 'APPROVE':
          newStep = workflow.totalSteps
          newStatus = 'APPROVED'
          break
        case 'REJECT':
          newStatus = 'REJECTED'
          break
        case 'REQUEST_CLARIFICATION':
          newStatus = 'REQUIRES_CLARIFICATION'
          break
        case 'ESCALATE':
          newStatus = 'ESCALATED'
          break
        case 'HOLD':
          // Keep current step and status
          break
      }

      // Update workflow
      await db.paymentConfirmationWorkflow.update({
        where: { id: workflow.id },
        data: {
          currentStep: newStep,
          status: newStatus,
          updatedAt: new Date(),
          completedAt: action === 'APPROVE' ? new Date() : undefined
        }
      })

      // Update current step
      if (workflow.steps.length > 0) {
        const currentStep = workflow.steps[workflow.currentStep - 1]
        if (currentStep) {
          await db.paymentWorkflowStep.update({
            where: { id: currentStep.id },
            data: {
              status: action === 'APPROVE' ? 'COMPLETED' : 'IN_PROGRESS',
              completedBy: action === 'APPROVE' ? reviewedBy : undefined,
              completedAt: action === 'APPROVE' ? new Date() : undefined,
              notes
            }
          })
        }
      }

    } catch (error) {
      console.error('Error updating workflow:', error)
      throw error
    }
  }

  /**
   * Get status description
   */
  static getStatusDescription(status: PaymentConfirmationStatus): string {
    return this.STATUS_DESCRIPTIONS[status]
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status: PaymentConfirmationStatus): string {
    return this.STATUS_COLORS[status]
  }

  /**
   * Get priority color for UI
   */
  static getPriorityColor(priority: string): string {
    const colors = {
      'LOW': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'MEDIUM': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'HIGH': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'URGENT': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }
    return colors[priority as keyof typeof colors] || colors.MEDIUM
  }
}
