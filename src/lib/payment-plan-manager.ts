import { db } from './db'
import { PaymentPlanType } from '@prisma/client'

export interface PaymentPlan {
  id: string
  name: string
  description: string | null
  planType: PaymentPlanType
  totalAmount: number
  installments: number
  frequency: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PaymentPlanSummary {
  totalPlans: number
  activePlans: number
  totalRevenue: number
  averagePlanValue: number
}

export class PaymentPlanManager {
  /**
   * Create a new payment plan
   */
  static async createPaymentPlan(planDetails: {
    name: string
    description?: string
    planType: PaymentPlanType
    totalAmount: number
    installments?: number
    frequency?: string
  }): Promise<PaymentPlan> {
    try {
      // Validate inputs
      if (planDetails.totalAmount <= 0) {
        throw new Error('Total amount must be greater than 0')
      }

      if (planDetails.installments && planDetails.installments < 1) {
        throw new Error('Installments must be at least 1')
      }

      // Create payment plan
      const paymentPlan = await db.paymentPlan.create({
        data: {
          name: planDetails.name,
          description: planDetails.description,
          planType: planDetails.planType,
          totalAmount: planDetails.totalAmount,
          installments: planDetails.installments || 1,
          frequency: planDetails.frequency,
          isActive: true
        }
      })

      return {
        id: paymentPlan.id,
        name: paymentPlan.name,
        description: paymentPlan.description,
        planType: paymentPlan.planType,
        totalAmount: paymentPlan.totalAmount.toNumber(),
        installments: paymentPlan.installments,
        frequency: paymentPlan.frequency,
        isActive: paymentPlan.isActive,
        createdAt: paymentPlan.createdAt,
        updatedAt: paymentPlan.updatedAt
      }

    } catch (error) {
      console.error('Error creating payment plan:', error)
      throw error
    }
  }

  /**
   * Get payment plan details
   */
  static async getPaymentPlan(paymentPlanId: string): Promise<PaymentPlan | null> {
    try {
      const paymentPlan = await db.paymentPlan.findUnique({
        where: { id: paymentPlanId }
      })

      if (!paymentPlan) {
        return null
      }

      return {
        id: paymentPlan.id,
        name: paymentPlan.name,
        description: paymentPlan.description,
        planType: paymentPlan.planType,
        totalAmount: paymentPlan.totalAmount.toNumber(),
        installments: paymentPlan.installments,
        frequency: paymentPlan.frequency,
        isActive: paymentPlan.isActive,
        createdAt: paymentPlan.createdAt,
        updatedAt: paymentPlan.updatedAt
      }

    } catch (error) {
      console.error('Error getting payment plan:', error)
      throw error
    }
  }

  /**
   * Get payment plans with filtering and pagination
   */
  static async getPaymentPlans(filters?: {
    planType?: PaymentPlanType
    isActive?: boolean
    page?: number
    limit?: number
  }): Promise<{
    plans: PaymentPlan[]
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

      if (filters?.planType) {
        whereClause.planType = filters.planType
      }

      if (filters?.isActive !== undefined) {
        whereClause.isActive = filters.isActive
      }

      // Fetch payment plans
      const [plans, totalCount] = await Promise.all([
        db.paymentPlan.findMany({
          where: whereClause,
          orderBy: [
            { isActive: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: offset,
          take: limit
        }),
        db.paymentPlan.count({ where: whereClause })
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return {
        plans: plans.map(plan => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          planType: plan.planType,
          totalAmount: plan.totalAmount.toNumber(),
          installments: plan.installments,
          frequency: plan.frequency,
          isActive: plan.isActive,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt
        })),
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
   * Update payment plan
   */
  static async updatePaymentPlan(
    paymentPlanId: string,
    updates: {
      name?: string
      description?: string
      totalAmount?: number
      installments?: number
      frequency?: string
      isActive?: boolean
    }
  ): Promise<PaymentPlan> {
    try {
      const updateData: any = {}

      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.totalAmount !== undefined) updateData.totalAmount = updates.totalAmount
      if (updates.installments !== undefined) updateData.installments = updates.installments
      if (updates.frequency !== undefined) updateData.frequency = updates.frequency
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive

      const paymentPlan = await db.paymentPlan.update({
        where: { id: paymentPlanId },
        data: updateData
      })

      return {
        id: paymentPlan.id,
        name: paymentPlan.name,
        description: paymentPlan.description,
        planType: paymentPlan.planType,
        totalAmount: paymentPlan.totalAmount.toNumber(),
        installments: paymentPlan.installments,
        frequency: paymentPlan.frequency,
        isActive: paymentPlan.isActive,
        createdAt: paymentPlan.createdAt,
        updatedAt: paymentPlan.updatedAt
      }

    } catch (error) {
      console.error('Error updating payment plan:', error)
      throw error
    }
  }

  /**
   * Delete payment plan
   */
  static async deletePaymentPlan(paymentPlanId: string): Promise<boolean> {
    try {
      // Check if plan is being used by any payments
      const paymentsCount = await db.payment.count({
        where: { paymentPlanId: paymentPlanId }
      })

      if (paymentsCount > 0) {
        throw new Error('Cannot delete payment plan that has associated payments. Set to inactive instead.')
      }

      await db.paymentPlan.delete({
        where: { id: paymentPlanId }
      })

      return true

    } catch (error) {
      console.error('Error deleting payment plan:', error)
      throw error
    }
  }

  /**
   * Get payment plan statistics
   */
  static async getPaymentPlanStatistics(): Promise<PaymentPlanSummary> {
    try {
      const [
        totalPlans,
        activePlans,
        totalRevenue
      ] = await Promise.all([
        db.paymentPlan.count(),
        db.paymentPlan.count({ where: { isActive: true } }),
        db.paymentPlan.aggregate({
          where: { isActive: true },
          _sum: { totalAmount: true }
        })
      ])

      const averagePlanValue = totalPlans > 0 ? ((totalRevenue._sum.totalAmount?.toNumber() || 0) / totalPlans) : 0

      return {
        totalPlans,
        activePlans,
        totalRevenue: totalRevenue._sum.totalAmount?.toNumber() || 0,
        averagePlanValue
      }

    } catch (error) {
      console.error('Error getting payment plan statistics:', error)
      throw error
    }
  }

  /**
   * Get payments by plan
   */
  static async getPaymentsByPlan(paymentPlanId: string): Promise<any[]> {
    try {
      const payments = await db.payment.findMany({
        where: { paymentPlanId: paymentPlanId },
        include: {
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
        },
        orderBy: { createdAt: 'desc' }
      })

      return payments.map(payment => ({
        id: payment.id,
        amount: payment.amount.toNumber(),
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.paymentDate,
        parent: payment.parent ? {
          name: `${payment.parent.profile.firstName} ${payment.parent.profile.lastName}`,
          email: payment.parent.profile.email
        } : null,
        createdAt: payment.createdAt
      }))

    } catch (error) {
      console.error('Error getting payments by plan:', error)
      throw error
    }
  }
}
