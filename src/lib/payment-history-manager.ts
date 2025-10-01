import { db } from './db'

export type PaymentHistoryFilter = {
  patientId?: string
  therapistId?: string
  parentId?: string
  paymentMethod?: string
  status?: string
  dateRange?: { start: Date; end: Date }
  amountRange?: { min: number; max: number }
  searchTerm?: string
}

export type PaymentHistorySort = {
  field: 'date' | 'amount' | 'status' | 'method'
  direction: 'asc' | 'desc'
}

export interface PaymentHistorySummary {
  totalPayments: number
  totalAmount: number
  averageAmount: number
  paymentMethods: Record<string, { count: number; total: number }>
  statusBreakdown: Record<string, number>
  monthlyTrends: Array<{
    month: string
    count: number
    total: number
  }>
}

export interface PaymentReport {
  id: string
  reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
  title: string
  description: string
  dateRange: { start: Date; end: Date }
  filters: PaymentHistoryFilter
  generatedAt: Date
  generatedBy: string
  data: PaymentHistorySummary
  metadata?: Record<string, any>
}

export class PaymentHistoryManager {
  /**
   * Get payment history with filtering, sorting, and pagination
   */
  static async getPaymentHistory(
    filters?: PaymentHistoryFilter,
    sort?: PaymentHistorySort,
    pagination?: { page: number; limit: number }
  ): Promise<{
    payments: any[]
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

      if (filters?.parentId) {
        whereClause.parentId = filters.parentId
      }

      if (filters?.paymentMethod) {
        whereClause.paymentMethod = filters.paymentMethod
      }

      if (filters?.status) {
        whereClause.status = filters.status
      }

      if (filters?.dateRange) {
        whereClause.createdAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        }
      }

      if (filters?.amountRange) {
        whereClause.amount = {
          gte: filters.amountRange.min,
          lte: filters.amountRange.max
        }
      }

      if (filters?.searchTerm) {
        whereClause.OR = [
          { description: { contains: filters.searchTerm, mode: 'insensitive' } },
          { reference: { contains: filters.searchTerm, mode: 'insensitive' } }
        ]
      }

      // Build order by clause
      const orderBy: any = {}
      if (sort) {
        switch (sort.field) {
          case 'date':
            orderBy.createdAt = sort.direction
            break
          case 'amount':
            orderBy.amount = sort.direction
            break
          case 'status':
            orderBy.status = sort.direction
            break
          case 'method':
            orderBy.paymentMethod = sort.direction
            break
        }
      } else {
        orderBy.createdAt = 'desc' // Default sort by date descending
      }

      // Fetch payments
      const [payments, totalCount] = await Promise.all([
        db.payment.findMany({
          where: whereClause,
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
            },
            consultationRequest: {
              select: {
                id: true,
                patient: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy,
          skip: offset,
          take: limit
        }),
        db.payment.count({ where: whereClause })
      ])

      const totalPages = Math.ceil(totalCount / limit)

      return {
        payments: payments.map(payment => ({
          ...payment,
          amount: payment.amount.toNumber()
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
      console.error('Error getting payment history:', error)
      throw error
    }
  }

  /**
   * Get payment history summary with analytics
   */
  static async getPaymentHistorySummary(
    filters?: PaymentHistoryFilter
  ): Promise<PaymentHistorySummary> {
    try {
      // Build where clause
      const whereClause: any = {}

      if (filters?.parentId) {
        whereClause.parentId = filters.parentId
      }

      if (filters?.paymentMethod) {
        whereClause.paymentMethod = filters.paymentMethod
      }

      if (filters?.status) {
        whereClause.status = filters.status
      }

      if (filters?.dateRange) {
        whereClause.createdAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        }
      }

      if (filters?.amountRange) {
        whereClause.amount = {
          gte: filters.amountRange.min,
          lte: filters.amountRange.max
        }
      }

      // Get basic statistics
      const [
        totalPayments,
        totalAmount,
        averageAmount,
        paymentMethods,
        statusBreakdown
      ] = await Promise.all([
        db.payment.count({ where: whereClause }),
        db.payment.aggregate({
          where: whereClause,
          _sum: { amount: true }
        }),
        db.payment.aggregate({
          where: whereClause,
          _avg: { amount: true }
        }),
        db.payment.groupBy({
          by: ['paymentMethod'],
          where: whereClause,
          _count: { paymentMethod: true },
          _sum: { amount: true }
        }),
        db.payment.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true }
        })
      ])

      // Get monthly trends (last 12 months)
      const monthlyTrends = await this.getMonthlyTrends(whereClause)

      // Format payment methods
      const paymentMethodsFormatted: Record<string, { count: number; total: number }> = {}
      paymentMethods.forEach(method => {
        if (method.paymentMethod) {
          paymentMethodsFormatted[method.paymentMethod] = {
            count: method._count.paymentMethod,
            total: method._sum.amount?.toNumber() || 0
          }
        }
      })

      // Format status breakdown
      const statusBreakdownFormatted: Record<string, number> = {}
      statusBreakdown.forEach(status => {
        statusBreakdownFormatted[status.status] = status._count.status
      })

      return {
        totalPayments,
        totalAmount: totalAmount._sum.amount?.toNumber() || 0,
        averageAmount: averageAmount._avg.amount?.toNumber() || 0,
        paymentMethods: paymentMethodsFormatted,
        statusBreakdown: statusBreakdownFormatted,
        monthlyTrends
      }

    } catch (error) {
      console.error('Error getting payment history summary:', error)
      throw error
    }
  }

  /**
   * Generate payment report
   */
  static async generatePaymentReport(
    reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM',
    dateRange: { start: Date; end: Date },
    filters?: PaymentHistoryFilter,
    generatedBy: string = 'system'
  ): Promise<PaymentReport> {
    try {
      const reportFilters = {
        ...filters,
        dateRange
      }

      const data = await this.getPaymentHistorySummary(reportFilters)

      const report: PaymentReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reportType,
        title: this.generateReportTitle(reportType, dateRange),
        description: this.generateReportDescription(reportType, dateRange, filters),
        dateRange,
        filters: reportFilters,
        generatedAt: new Date(),
        generatedBy,
        data,
        metadata: {
          reportVersion: '1.0',
          generatedBy: 'PaymentHistoryManager'
        }
      }

      return report

    } catch (error) {
      console.error('Error generating payment report:', error)
      throw error
    }
  }

  /**
   * Get payment trends over time
   */
  static async getPaymentTrends(
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY',
    dateRange: { start: Date; end: Date },
    filters?: PaymentHistoryFilter
  ): Promise<Array<{
    period: string
    count: number
    total: number
    average: number
  }>> {
    try {
      const whereClause: any = {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }

      if (filters?.parentId) {
        whereClause.parentId = filters.parentId
      }

      if (filters?.paymentMethod) {
        whereClause.paymentMethod = filters.paymentMethod
      }

      if (filters?.status) {
        whereClause.status = filters.status
      }

      const payments = await db.payment.findMany({
        where: whereClause,
        select: {
          createdAt: true,
          amount: true
        },
        orderBy: { createdAt: 'asc' }
      })

      return this.groupPaymentsByPeriod(
        payments.map(p => ({ transactionDate: p.createdAt, amount: p.amount.toNumber() })),
        period
      )

    } catch (error) {
      console.error('Error getting payment trends:', error)
      throw error
    }
  }

  /**
   * Get monthly trends
   */
  private static async getMonthlyTrends(whereClause: any): Promise<Array<{
    month: string
    count: number
    total: number
  }>> {
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const payments = await db.payment.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: twelveMonthsAgo
        }
      },
      select: {
        createdAt: true,
        amount: true
      }
    })

    // Group by month
    const monthlyTrends: Record<string, { count: number; total: number }> = {}

    payments.forEach(payment => {
      const month = payment.createdAt.toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { count: 0, total: 0 }
      }
      monthlyTrends[month].count++
      monthlyTrends[month].total += payment.amount.toNumber()
    })

    return Object.entries(monthlyTrends).map(([month, data]) => ({
      month,
      count: data.count,
      total: data.total
    })).sort((a, b) => a.month.localeCompare(b.month))
  }

  /**
   * Group payments by period
   */
  private static groupPaymentsByPeriod(
    payments: Array<{ transactionDate: Date; amount: number }>,
    period: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  ): Array<{
    period: string
    count: number
    total: number
    average: number
  }> {
    const grouped: Record<string, { count: number; total: number }> = {}

    payments.forEach(payment => {
      let periodKey: string
      const date = new Date(payment.transactionDate)

      switch (period) {
        case 'DAILY':
          periodKey = date.toISOString().substring(0, 10) // YYYY-MM-DD
          break
        case 'WEEKLY':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          periodKey = weekStart.toISOString().substring(0, 10)
          break
        case 'MONTHLY':
          periodKey = date.toISOString().substring(0, 7) // YYYY-MM
          break
        default:
          periodKey = date.toISOString().substring(0, 10)
      }

      if (!grouped[periodKey]) {
        grouped[periodKey] = { count: 0, total: 0 }
      }
      grouped[periodKey].count++
      grouped[periodKey].total += payment.amount
    })

    return Object.entries(grouped).map(([period, data]) => ({
      period,
      count: data.count,
      total: data.total,
      average: data.count > 0 ? data.total / data.count : 0
    })).sort((a, b) => a.period.localeCompare(b.period))
  }

  /**
   * Generate report title
   */
  private static generateReportTitle(
    reportType: string,
    dateRange: { start: Date; end: Date }
  ): string {
    const startDate = dateRange.start.toLocaleDateString()
    const endDate = dateRange.end.toLocaleDateString()

    switch (reportType) {
      case 'DAILY':
        return `Daily Payment Report - ${startDate}`
      case 'WEEKLY':
        return `Weekly Payment Report - ${startDate} to ${endDate}`
      case 'MONTHLY':
        return `Monthly Payment Report - ${startDate} to ${endDate}`
      case 'QUARTERLY':
        return `Quarterly Payment Report - ${startDate} to ${endDate}`
      case 'YEARLY':
        return `Yearly Payment Report - ${startDate} to ${endDate}`
      case 'CUSTOM':
        return `Custom Payment Report - ${startDate} to ${endDate}`
      default:
        return `Payment Report - ${startDate} to ${endDate}`
    }
  }

  /**
   * Generate report description
   */
  private static generateReportDescription(
    reportType: string,
    dateRange: { start: Date; end: Date },
    filters?: PaymentHistoryFilter
  ): string {
    let description = `Payment report for ${reportType.toLowerCase()} period from ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}.`

    if (filters) {
      const filterDescriptions = []
      if (filters.parentId) filterDescriptions.push('specific parent')
      if (filters.paymentMethod) filterDescriptions.push(`payment method: ${filters.paymentMethod}`)
      if (filters.status) filterDescriptions.push(`status: ${filters.status}`)
      if (filters.amountRange) filterDescriptions.push(`amount range: $${filters.amountRange.min} - $${filters.amountRange.max}`)

      if (filterDescriptions.length > 0) {
        description += ` Filtered by: ${filterDescriptions.join(', ')}.`
      }
    }

    return description
  }
}
