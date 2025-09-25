import { db } from './db'

export type PaymentPlanStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE'
export type PaymentPlanType = 'MONTHLY' | 'QUARTERLY' | 'SEMESTER' | 'ANNUAL'
export type PaymentPlanFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY'

export interface PaymentPlan {
  id: string
  patientId: string
  therapistId: string
  serviceId: string
  planName: string
  planType: PaymentPlanType
  frequency: PaymentPlanFrequency
  totalAmount: number
  installmentAmount: number
  totalInstallments: number
  paidInstallments: number
  remainingInstallments: number
  startDate: Date
  endDate: Date
  nextPaymentDate: Date
  status: PaymentPlanStatus
  autoPay: boolean
  description?: string
  metadata?: Record<string, any>
}

export interface PaymentPlanInstallment {
  id: string
  paymentPlanId: string
  installmentNumber: number
  amount: number
  dueDate: Date
  paidDate?: Date
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  paymentId?: string
  notes?: string
}

export interface PaymentPlanSummary {
  totalPlans: number
  activePlans: number
  completedPlans: number
  overduePlans: number
  totalRevenue: number
  pendingRevenue: number
  averagePlanValue: number
  completionRate: number
}

export class PaymentPlanManager {
  /**
   * Create a new payment plan
   */
  static async createPaymentPlan(
    patientId: string,
    therapistId: string,
    serviceId: string,
    planDetails: {
      planName: string
      planType: PaymentPlanType
      frequency: PaymentPlanFrequency
      totalAmount: number
      startDate: Date
      autoPay?: boolean
      description?: string
      metadata?: Record<string, any>
    }
  ): Promise<PaymentPlan> {
    try {
      // Validate inputs
      if (planDetails.totalAmount <= 0) {
        throw new Error('Total amount must be greater than 0')
      }

      if (planDetails.startDate < new Date()) {
        throw new Error('Start date cannot be in the past')
      }

      // Calculate installment details
      const installmentDetails = this.calculateInstallmentDetails(
        planDetails.totalAmount,
        planDetails.frequency,
        planDetails.startDate
      )

      // Use transaction to create payment plan and installments
      const result = await db.$transaction(async (tx) => {
        // Create payment plan
        const paymentPlan = await tx.paymentPlan.create({
          data: {
            patientId,
            therapistId,
            serviceId,
            planName: planDetails.planName,
            planType: planDetails.planType,
            frequency: planDetails.frequency,
            totalAmount: planDetails.totalAmount,
            installmentAmount: installmentDetails.installmentAmount,
            totalInstallments: installmentDetails.totalInstallments,
            paidInstallments: 0,
            remainingInstallments: installmentDetails.totalInstallments,
            startDate: planDetails.startDate,
            endDate: installmentDetails.endDate,
            nextPaymentDate: installmentDetails.nextPaymentDate,
            status: 'ACTIVE',
            autoPay: planDetails.autoPay || false,
            description: planDetails.description,
            metadata: planDetails.metadata ? JSON.stringify(planDetails.metadata) : null
          }
        })

        // Create installments
        const installments = installmentDetails.installments.map(installment => ({
          paymentPlanId: paymentPlan.id,
          installmentNumber: installment.installmentNumber,
          amount: installment.amount,
          dueDate: installment.dueDate,
          status: 'PENDING' as const
        }))

        await tx.paymentPlanInstallment.createMany({
          data: installments
        })

        return paymentPlan
      })

      return {
        id: result.id,
        patientId: result.patientId,
        therapistId: result.therapistId,
        serviceId: result.serviceId,
        planName: result.planName,
        planType: result.planType as PaymentPlanType,
        frequency: result.frequency as PaymentPlanFrequency,
        totalAmount: result.totalAmount,
        installmentAmount: result.installmentAmount,
        totalInstallments: result.totalInstallments,
        paidInstallments: result.paidInstallments,
        remainingInstallments: result.remainingInstallments,
        startDate: result.startDate,
        endDate: result.endDate,
        nextPaymentDate: result.nextPaymentDate,
        status: result.status as PaymentPlanStatus,
        autoPay: result.autoPay,
        description: result.description || undefined,
        metadata: result.metadata ? JSON.parse(result.metadata) : undefined
      }

    } catch (error) {
      console.error('Error creating payment plan:', error)
      throw error
    }
  }

  /**
   * Get payment plan details with installments
   */
  static async getPaymentPlan(paymentPlanId: string): Promise<any> {
    try {
      const paymentPlan = await db.paymentPlan.findUnique({
        where: { id: paymentPlanId },
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
          service: {
            select: {
              name: true,
              description: true,
              price: true
            }
          },
          installments: {
            orderBy: { installmentNumber: 'asc' }
          }
        }
      })

      if (!paymentPlan) {
        throw new Error('Payment plan not found')
      }

      return paymentPlan

    } catch (error) {
      console.error('Error getting payment plan:', error)
      throw error
    }
  }

  /**
   * Get payment plans with filtering and pagination
   */
  static async getPaymentPlans(filters?: {
    patientId?: string
    therapistId?: string
    status?: PaymentPlanStatus
    planType?: PaymentPlanType
    frequency?: PaymentPlanFrequency
    dateRange?: { start: Date; end: Date }
    page?: number
    limit?: number
  }): Promise<{
    plans: any[]
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
      
      if (filters?.patientId) {
        whereClause.patientId = filters.patientId
      }
      
      if (filters?.therapistId) {
        whereClause.therapistId = filters.therapistId
      }
      
      if (filters?.status) {
        whereClause.status = filters.status
      }
      
      if (filters?.planType) {
        whereClause.planType = filters.planType
      }
      
      if (filters?.frequency) {
        whereClause.frequency = filters.frequency
      }
      
      if (filters?.dateRange) {
        whereClause.startDate = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        }
      }

      // Fetch payment plans
      const [plans, totalCount] = await Promise.all([
        db.paymentPlan.findMany({
          where: whereClause,
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
            service: {
              select: {
                name: true,
                description: true,
                price: true
              }
            }
          },
          orderBy: [
            { status: 'asc' }, // Active first
            { nextPaymentDate: 'asc' } // Due soon first
          ],
          skip: offset,
          take: limit
        }),
        db.paymentPlan.count({ where: whereClause })
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return {
        plans,
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
      console.error('Error getting payment plans:', error)
      throw error
    }
  }

  /**
   * Record payment for an installment
   */
  static async recordPayment(
    paymentPlanId: string,
    installmentNumber: number,
    paymentId: string,
    paidDate: Date,
    notes?: string
  ): Promise<PaymentPlanInstallment> {
    try {
      // Get the installment
      const installment = await db.paymentPlanInstallment.findFirst({
        where: {
          paymentPlanId,
          installmentNumber
        }
      })

      if (!installment) {
        throw new Error('Installment not found')
      }

      if (installment.status === 'PAID') {
        throw new Error('Installment is already paid')
      }

      // Use transaction to update installment and payment plan
      const result = await db.$transaction(async (tx) => {
        // Update installment
        const updatedInstallment = await tx.paymentPlanInstallment.update({
          where: { id: installment.id },
          data: {
            status: 'PAID',
            paidDate,
            paymentId,
            notes
          }
        })

        // Update payment plan
        await tx.paymentPlan.update({
          where: { id: paymentPlanId },
          data: {
            paidInstallments: {
              increment: 1
            },
            remainingInstallments: {
              decrement: 1
            },
            nextPaymentDate: await this.getNextPaymentDate(paymentPlanId, installmentNumber + 1)
          }
        })

        return updatedInstallment
      })

      return {
        id: result.id,
        paymentPlanId: result.paymentPlanId,
        installmentNumber: result.installmentNumber,
        amount: result.amount,
        dueDate: result.dueDate,
        paidDate: result.paidDate || undefined,
        status: result.status as 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED',
        paymentId: result.paymentId || undefined,
        notes: result.notes || undefined
      }

    } catch (error) {
      console.error('Error recording payment:', error)
      throw error
    }
  }

  /**
   * Update payment plan status
   */
  static async updatePaymentPlanStatus(
    paymentPlanId: string,
    status: PaymentPlanStatus,
    reason?: string
  ): Promise<PaymentPlan> {
    try {
      const paymentPlan = await db.paymentPlan.update({
        where: { id: paymentPlanId },
        data: {
          status,
          updatedAt: new Date()
        }
      })

      // If pausing or cancelling, update future installments
      if (status === 'PAUSED' || status === 'CANCELLED') {
        await db.paymentPlanInstallment.updateMany({
          where: {
            paymentPlanId,
            status: 'PENDING'
          },
          data: {
            status: status === 'PAUSED' ? 'PENDING' : 'CANCELLED'
          }
        })
      }

      return {
        id: paymentPlan.id,
        patientId: paymentPlan.patientId,
        therapistId: paymentPlan.therapistId,
        serviceId: paymentPlan.serviceId,
        planName: paymentPlan.planName,
        planType: paymentPlan.planType as PaymentPlanType,
        frequency: paymentPlan.frequency as PaymentPlanFrequency,
        totalAmount: paymentPlan.totalAmount,
        installmentAmount: paymentPlan.installmentAmount,
        totalInstallments: paymentPlan.totalInstallments,
        paidInstallments: paymentPlan.paidInstallments,
        remainingInstallments: paymentPlan.remainingInstallments,
        startDate: paymentPlan.startDate,
        endDate: paymentPlan.endDate,
        nextPaymentDate: paymentPlan.nextPaymentDate,
        status: paymentPlan.status as PaymentPlanStatus,
        autoPay: paymentPlan.autoPay,
        description: paymentPlan.description || undefined,
        metadata: paymentPlan.metadata ? JSON.parse(paymentPlan.metadata) : undefined
      }

    } catch (error) {
      console.error('Error updating payment plan status:', error)
      throw error
    }
  }

  /**
   * Get payment plan statistics
   */
  static async getPaymentPlanStatistics(dateRange?: { start: Date; end: Date }): Promise<PaymentPlanSummary> {
    try {
      const whereClause = dateRange ? {
        startDate: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      } : {}

      const [
        totalPlans,
        activePlans,
        completedPlans,
        overduePlans,
        totalRevenue,
        pendingRevenue
      ] = await Promise.all([
        db.paymentPlan.count({ where: whereClause }),
        db.paymentPlan.count({ where: { ...whereClause, status: 'ACTIVE' } }),
        db.paymentPlan.count({ where: { ...whereClause, status: 'COMPLETED' } }),
        db.paymentPlan.count({ where: { ...whereClause, status: 'OVERDUE' } }),
        db.paymentPlan.aggregate({
          where: whereClause,
          _sum: { totalAmount: true }
        }),
        db.paymentPlan.aggregate({
          where: { ...whereClause, status: { in: ['ACTIVE', 'OVERDUE'] } },
          _sum: { totalAmount: true }
        })
      ])

      const averagePlanValue = totalPlans > 0 ? (totalRevenue._sum.totalAmount || 0) / totalPlans : 0
      const completionRate = totalPlans > 0 ? (completedPlans / totalPlans) * 100 : 0

      return {
        totalPlans,
        activePlans,
        completedPlans,
        overduePlans,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        pendingRevenue: pendingRevenue._sum.totalAmount || 0,
        averagePlanValue,
        completionRate
      }

    } catch (error) {
      console.error('Error getting payment plan statistics:', error)
      throw error
    }
  }

  /**
   * Get overdue payments
   */
  static async getOverduePayments(): Promise<{
    overduePlans: any[]
    overdueInstallments: any[]
  }> {
    try {
      const now = new Date()

      const [overduePlans, overdueInstallments] = await Promise.all([
        // Plans with overdue next payment
        db.paymentPlan.findMany({
          where: {
            status: 'ACTIVE',
            nextPaymentDate: {
              lt: now
            }
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
            service: {
              select: {
                name: true,
                description: true
              }
            }
          }
        }),

        // Individual overdue installments
        db.paymentPlanInstallment.findMany({
          where: {
            status: 'PENDING',
            dueDate: {
              lt: now
            }
          },
          include: {
            paymentPlan: {
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
            }
          },
          orderBy: { dueDate: 'asc' }
        })
      ])

      return { overduePlans, overdueInstallments }

    } catch (error) {
      console.error('Error getting overdue payments:', error)
      throw error
    }
  }

  /**
   * Calculate installment details
   */
  private static calculateInstallmentDetails(
    totalAmount: number,
    frequency: PaymentPlanFrequency,
    startDate: Date
  ): {
    installmentAmount: number
    totalInstallments: number
    endDate: Date
    nextPaymentDate: Date
    installments: Array<{
      installmentNumber: number
      amount: number
      dueDate: Date
    }>
  } {
    const frequencyDays = this.getFrequencyDays(frequency)
    const totalInstallments = this.getTotalInstallments(frequency)
    const installmentAmount = Math.round((totalAmount / totalInstallments) * 100) / 100

    const installments = []
    let currentDate = new Date(startDate)

    for (let i = 1; i <= totalInstallments; i++) {
      installments.push({
        installmentNumber: i,
        amount: i === totalInstallments ? 
          totalAmount - (installmentAmount * (totalInstallments - 1)) : // Last installment gets remainder
          installmentAmount,
        dueDate: new Date(currentDate)
      })

      currentDate = new Date(currentDate.getTime() + (frequencyDays * 24 * 60 * 60 * 1000))
    }

    const endDate = new Date(currentDate.getTime() - (frequencyDays * 24 * 60 * 60 * 1000))
    const nextPaymentDate = new Date(startDate)

    return {
      installmentAmount,
      totalInstallments,
      endDate,
      nextPaymentDate,
      installments
    }
  }

  /**
   * Get frequency in days
   */
  private static getFrequencyDays(frequency: PaymentPlanFrequency): number {
    switch (frequency) {
      case 'WEEKLY': return 7
      case 'BIWEEKLY': return 14
      case 'MONTHLY': return 30
      case 'QUARTERLY': return 90
      default: return 30
    }
  }

  /**
   * Get total installments based on frequency
   */
  private static getTotalInstallments(frequency: PaymentPlanFrequency): number {
    switch (frequency) {
      case 'WEEKLY': return 12 // 3 months
      case 'BIWEEKLY': return 6 // 3 months
      case 'MONTHLY': return 3 // 3 months
      case 'QUARTERLY': return 1 // 3 months
      default: return 3
    }
  }

  /**
   * Get next payment date for a plan
   */
  private static async getNextPaymentDate(paymentPlanId: string, nextInstallmentNumber: number): Promise<Date> {
    const nextInstallment = await db.paymentPlanInstallment.findFirst({
      where: {
        paymentPlanId,
        installmentNumber: nextInstallmentNumber
      }
    })

    return nextInstallment?.dueDate || new Date()
  }
}
