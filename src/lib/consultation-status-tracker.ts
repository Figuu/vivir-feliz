import { db } from './db'

export type ConsultationStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface StatusTransition {
  from: ConsultationStatus
  to: ConsultationStatus
  allowed: boolean
  reason?: string
}

export interface StatusUpdate {
  id: string
  consultationRequestId: string
  fromStatus: ConsultationStatus
  toStatus: ConsultationStatus
  updatedBy: string
  updatedAt: Date
  reason?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface StatusHistory {
  id: string
  consultationRequestId: string
  status: ConsultationStatus
  updatedBy: string
  updatedAt: Date
  reason?: string
  notes?: string
  metadata?: Record<string, any>
}

export interface ConsultationStatusInfo {
  currentStatus: ConsultationStatus
  statusHistory: StatusHistory[]
  canTransitionTo: ConsultationStatus[]
  lastUpdated: Date
  lastUpdatedBy: string
  totalDuration: number // in minutes
  timeInCurrentStatus: number // in minutes
}

export class ConsultationStatusTracker {
  // Define valid status transitions
  private static readonly STATUS_TRANSITIONS: { [key in ConsultationStatus]: ConsultationStatus[] } = {
    'PENDING': ['CONFIRMED', 'CANCELLED'],
    'CONFIRMED': ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
    'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
    'COMPLETED': [], // Terminal state
    'CANCELLED': ['CONFIRMED'], // Can reschedule
    'NO_SHOW': ['CONFIRMED', 'CANCELLED'] // Can reschedule or cancel
  }

  // Define status descriptions
  private static readonly STATUS_DESCRIPTIONS: { [key in ConsultationStatus]: string } = {
    'PENDING': 'Request received, awaiting confirmation',
    'CONFIRMED': 'Appointment confirmed and scheduled',
    'IN_PROGRESS': 'Consultation is currently in progress',
    'COMPLETED': 'Consultation has been completed successfully',
    'CANCELLED': 'Consultation has been cancelled',
    'NO_SHOW': 'Patient did not show up for the appointment'
  }

  // Define status colors for UI
  private static readonly STATUS_COLORS: { [key in ConsultationStatus]: string } = {
    'PENDING': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'CONFIRMED': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'IN_PROGRESS': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'CANCELLED': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'NO_SHOW': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }

  /**
   * Update consultation status with validation and history tracking
   */
  static async updateStatus(
    consultationRequestId: string,
    newStatus: ConsultationStatus,
    updatedBy: string,
    reason?: string,
    notes?: string,
    metadata?: Record<string, any>
  ): Promise<StatusUpdate> {
    try {
      // Get current consultation request
      const consultationRequest = await db.consultationRequest.findUnique({
        where: { id: consultationRequestId },
        select: { id: true, status: true, createdAt: true }
      })

      if (!consultationRequest) {
        throw new Error('Consultation request not found')
      }

      const currentStatus = consultationRequest.status as ConsultationStatus

      // Validate status transition
      const transitionValidation = this.validateStatusTransition(currentStatus, newStatus)
      if (!transitionValidation.allowed) {
        throw new Error(transitionValidation.reason || 'Invalid status transition')
      }

      // Use transaction to update status and create history record
      const result = await db.$transaction(async (tx) => {
        // Update consultation request status
        const updatedRequest = await tx.consultationRequest.update({
          where: { id: consultationRequestId },
          data: { 
            status: newStatus,
            updatedAt: new Date()
          }
        })

        // Create status history record
        const statusHistory = await tx.consultationStatusHistory.create({
          data: {
            consultationRequestId,
            status: newStatus,
            updatedBy,
            reason,
            notes,
            metadata: metadata ? JSON.stringify(metadata) : null
          }
        })

        return { updatedRequest, statusHistory }
      })

      return {
        id: result.statusHistory.id,
        consultationRequestId,
        fromStatus: currentStatus,
        toStatus: newStatus,
        updatedBy,
        updatedAt: result.statusHistory.updatedAt,
        reason,
        notes,
        metadata
      }

    } catch (error) {
      console.error('Error updating consultation status:', error)
      throw error
    }
  }

  /**
   * Get consultation status information with history
   */
  static async getStatusInfo(consultationRequestId: string): Promise<ConsultationStatusInfo> {
    try {
      const [consultationRequest, statusHistory] = await Promise.all([
        db.consultationRequest.findUnique({
          where: { id: consultationRequestId },
          select: { 
            id: true, 
            status: true, 
            createdAt: true,
            updatedAt: true
          }
        }),
        db.consultationStatusHistory.findMany({
          where: { consultationRequestId },
          orderBy: { updatedAt: 'desc' }
        })
      ])

      if (!consultationRequest) {
        throw new Error('Consultation request not found')
      }

      const currentStatus = consultationRequest.status as ConsultationStatus
      const canTransitionTo = this.STATUS_TRANSITIONS[currentStatus] || []

      // Calculate time in current status
      const lastStatusChange = statusHistory[0]?.updatedAt || consultationRequest.createdAt
      const timeInCurrentStatus = Math.floor(
        (new Date().getTime() - lastStatusChange.getTime()) / (1000 * 60)
      )

      // Calculate total duration
      const totalDuration = Math.floor(
        (new Date().getTime() - consultationRequest.createdAt.getTime()) / (1000 * 60)
      )

      return {
        currentStatus,
        statusHistory: statusHistory.map(history => ({
          id: history.id,
          consultationRequestId: history.consultationRequestId,
          status: history.status as ConsultationStatus,
          updatedBy: history.updatedBy,
          updatedAt: history.updatedAt,
          reason: history.reason || undefined,
          notes: history.notes || undefined,
          metadata: history.metadata ? JSON.parse(history.metadata) : undefined
        })),
        canTransitionTo,
        lastUpdated: consultationRequest.updatedAt,
        lastUpdatedBy: statusHistory[0]?.updatedBy || 'system',
        totalDuration,
        timeInCurrentStatus
      }

    } catch (error) {
      console.error('Error getting consultation status info:', error)
      throw error
    }
  }

  /**
   * Validate status transition
   */
  static validateStatusTransition(
    fromStatus: ConsultationStatus, 
    toStatus: ConsultationStatus
  ): StatusTransition {
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
   * Get all possible status transitions for a given status
   */
  static getPossibleTransitions(currentStatus: ConsultationStatus): ConsultationStatus[] {
    return this.STATUS_TRANSITIONS[currentStatus] || []
  }

  /**
   * Get status description
   */
  static getStatusDescription(status: ConsultationStatus): string {
    return this.STATUS_DESCRIPTIONS[status]
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status: ConsultationStatus): string {
    return this.STATUS_COLORS[status]
  }

  /**
   * Get status history for a consultation request
   */
  static async getStatusHistory(consultationRequestId: string): Promise<StatusHistory[]> {
    try {
      const history = await db.consultationStatusHistory.findMany({
        where: { consultationRequestId },
        orderBy: { updatedAt: 'desc' }
      })

      return history.map(record => ({
        id: record.id,
        consultationRequestId: record.consultationRequestId,
        status: record.status as ConsultationStatus,
        updatedBy: record.updatedBy,
        updatedAt: record.updatedAt,
        reason: record.reason || undefined,
        notes: record.notes || undefined,
        metadata: record.metadata ? JSON.parse(record.metadata) : undefined
      }))

    } catch (error) {
      console.error('Error getting status history:', error)
      throw error
    }
  }

  /**
   * Get consultation requests by status
   */
  static async getConsultationsByStatus(
    status: ConsultationStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    consultations: any[]
    totalCount: number
  }> {
    try {
      const [consultations, totalCount] = await Promise.all([
        db.consultationRequest.findMany({
          where: { status },
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
                firstName: true,
                lastName: true,
                email: true,
                phone: true
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
            specialty: {
              select: {
                name: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          skip: offset
        }),
        db.consultationRequest.count({ where: { status } })
      ])

      return { consultations, totalCount }

    } catch (error) {
      console.error('Error getting consultations by status:', error)
      throw error
    }
  }

  /**
   * Get status statistics
   */
  static async getStatusStatistics(dateRange?: { start: Date; end: Date }): Promise<{
    statusCounts: { [key in ConsultationStatus]: number }
    totalConsultations: number
    statusDistribution: { [key in ConsultationStatus]: number }
  }> {
    try {
      const whereClause = dateRange ? {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      } : {}

      const statusCounts = await db.consultationRequest.groupBy({
        by: ['status'],
        where: whereClause,
        _count: { status: true }
      })

      const totalConsultations = statusCounts.reduce((sum, item) => sum + item._count.status, 0)

      // Initialize all status counts to 0
      const statusDistribution: { [key in ConsultationStatus]: number } = {
        'PENDING': 0,
        'CONFIRMED': 0,
        'IN_PROGRESS': 0,
        'COMPLETED': 0,
        'CANCELLED': 0,
        'NO_SHOW': 0
      }

      // Fill in actual counts
      statusCounts.forEach(item => {
        statusDistribution[item.status as ConsultationStatus] = item._count.status
      })

      return {
        statusCounts: statusDistribution,
        totalConsultations,
        statusDistribution
      }

    } catch (error) {
      console.error('Error getting status statistics:', error)
      throw error
    }
  }

  /**
   * Auto-update statuses based on time (for scheduled status changes)
   */
  static async autoUpdateStatuses(): Promise<{
    updated: number
    errors: string[]
  }> {
    try {
      const now = new Date()
      const errors: string[] = []
      let updated = 0

      // Find confirmed consultations that should be in progress
      const confirmedConsultations = await db.consultationRequest.findMany({
        where: {
          status: 'CONFIRMED',
          scheduledDate: {
            lte: now
          },
          scheduledTime: {
            lte: now.toTimeString().slice(0, 5) // HH:MM format
          }
        }
      })

      // Update confirmed consultations to in progress
      for (const consultation of confirmedConsultations) {
        try {
          await this.updateStatus(
            consultation.id,
            'IN_PROGRESS',
            'system',
            'Automatically updated to in progress based on scheduled time'
          )
          updated++
        } catch (error) {
          errors.push(`Failed to update consultation ${consultation.id}: ${error}`)
        }
      }

      // Find in-progress consultations that should be completed (assuming 2 hours max)
      const inProgressConsultations = await db.consultationRequest.findMany({
        where: {
          status: 'IN_PROGRESS',
          scheduledDate: {
            lte: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
          }
        }
      })

      // Update in-progress consultations to completed
      for (const consultation of inProgressConsultations) {
        try {
          await this.updateStatus(
            consultation.id,
            'COMPLETED',
            'system',
            'Automatically completed after maximum duration'
          )
          updated++
        } catch (error) {
          errors.push(`Failed to complete consultation ${consultation.id}: ${error}`)
        }
      }

      return { updated, errors }

    } catch (error) {
      console.error('Error in auto-update statuses:', error)
      throw error
    }
  }

  /**
   * Get consultations that need status updates
   */
  static async getConsultationsNeedingUpdates(): Promise<{
    toInProgress: any[]
    toCompleted: any[]
    overdue: any[]
  }> {
    try {
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

      const [toInProgress, toCompleted, overdue] = await Promise.all([
        // Consultations that should be in progress
        db.consultationRequest.findMany({
          where: {
            status: 'CONFIRMED',
            scheduledDate: {
              lte: now
            }
          },
          include: {
            patient: { select: { firstName: true, lastName: true } },
            parent: { select: { firstName: true, lastName: true, email: true } }
          }
        }),

        // Consultations that should be completed
        db.consultationRequest.findMany({
          where: {
            status: 'IN_PROGRESS',
            scheduledDate: {
              lte: twoHoursAgo
            }
          },
          include: {
            patient: { select: { firstName: true, lastName: true } },
            parent: { select: { firstName: true, lastName: true, email: true } }
          }
        }),

        // Overdue consultations (confirmed but past scheduled time)
        db.consultationRequest.findMany({
          where: {
            status: 'CONFIRMED',
            scheduledDate: {
              lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
            }
          },
          include: {
            patient: { select: { firstName: true, lastName: true } },
            parent: { select: { firstName: true, lastName: true, email: true } }
          }
        })
      ])

      return { toInProgress, toCompleted, overdue }

    } catch (error) {
      console.error('Error getting consultations needing updates:', error)
      throw error
    }
  }
}
