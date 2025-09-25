import { db } from './db'

export type PaymentHistoryFilter = {
  patientId?: string
  therapistId?: string
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

export interface PaymentHistoryEntry {
  id: string
  paymentId: string
  patientId: string
  therapistId: string
  amount: number
  paymentMethod: string
  status: string
  transactionDate: Date
  description?: string
  reference?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
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
  topPatients: Array<{
    patientId: string
    patientName: string
    totalPaid: number
    paymentCount: number
  }>
  topTherapists: Array<{
    therapistId: string
    therapistName: string
    totalReceived: number
    paymentCount: number
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
      
      if (filters?.patientId) {
        whereClause.patientId = filters.patientId
      }
      
      if (filters?.therapistId) {
        whereClause.therapistId = filters.therapistId
      }
      
      if (filters?.paymentMethod) {
        whereClause.paymentMethod = filters.paymentMethod
      }
      
      if (filters?.status) {
        whereClause.status = filters.status
      }
      
      if (filters?.dateRange) {
        whereClause.transactionDate = {
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
            orderBy.transactionDate = sort.direction
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
        orderBy.transactionDate = 'desc' // Default sort by date descending
      }

      // Fetch payments
      const [payments, totalCount] = await Promise.all([
        db.payment.findMany({
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
            consultationRequest: {
              select: {
                id: true,
                reason: true,
                urgency: true
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
        payments,
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
      
      if (filters?.patientId) {
        whereClause.patientId = filters.patientId
      }
      
      if (filters?.therapistId) {
        whereClause.therapistId = filters.therapistId
      }
      
      if (filters?.paymentMethod) {
        whereClause.paymentMethod = filters.paymentMethod
      }
      
      if (filters?.status) {
        whereClause.status = filters.status
      }
      
      if (filters?.dateRange) {
        whereClause.transactionDate = {
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

      // Get top patients
      const topPatients = await this.getTopPatients(whereClause)

      // Get top therapists
      const topTherapists = await this.getTopTherapists(whereClause)

      // Format payment methods
      const paymentMethodsFormatted: Record<string, { count: number; total: number }> = {}
      paymentMethods.forEach(method => {
        paymentMethodsFormatted[method.paymentMethod] = {
          count: method._count.paymentMethod,
          total: method._sum.amount || 0
        }
      })

      // Format status breakdown
      const statusBreakdownFormatted: Record<string, number> = {}
      statusBreakdown.forEach(status => {
        statusBreakdownFormatted[status.status] = status._count.status
      })

      return {
        totalPayments,
        totalAmount: totalAmount._sum.amount || 0,
        averageAmount: averageAmount._avg.amount || 0,
        paymentMethods: paymentMethodsFormatted,
        statusBreakdown: statusBreakdownFormatted,
        monthlyTrends,
        topPatients,
        topTherapists
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
        transactionDate: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }

      if (filters?.patientId) {
        whereClause.patientId = filters.patientId
      }
      
      if (filters?.therapistId) {
        whereClause.therapistId = filters.therapistId
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
          transactionDate: true,
          amount: true
        },
        orderBy: { transactionDate: 'asc' }
      })

      return this.groupPaymentsByPeriod(payments, period)

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

    const monthlyData = await db.payment.groupBy({
      by: ['transactionDate'],
      where: {
        ...whereClause,
        transactionDate: {
          gte: twelveMonthsAgo
        }
      },
      _count: { transactionDate: true },
      _sum: { amount: true }
    })

    // Group by month
    const monthlyTrends: Record<string, { count: number; total: number }> = {}
    
    monthlyData.forEach(item => {
      const month = new Date(item.transactionDate).toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyTrends[month]) {
        monthlyTrends[month] = { count: 0, total: 0 }
      }
      monthlyTrends[month].count += item._count.transactionDate
      monthlyTrends[month].total += item._sum.amount || 0
    })

    return Object.entries(monthlyTrends).map(([month, data]) => ({
      month,
      count: data.count,
      total: data.total
    })).sort((a, b) => a.month.localeCompare(b.month))
  }

  /**
   * Get top patients by payment amount
   */
  private static async getTopPatients(whereClause: any): Promise<Array<{
    patientId: string
    patientName: string
    totalPaid: number
    paymentCount: number
  }>> {
    const patientData = await db.payment.groupBy({
      by: ['patientId'],
      where: whereClause,
      _count: { patientId: true },
      _sum: { amount: true },
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      },
      take: 10
    })

    const patientIds = patientData.map(p => p.patientId)
    const patients = await db.patient.findMany({
      where: { id: { in: patientIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    })

    const patientMap = new Map(patients.map(p => [p.id, p]))

    return patientData.map(data => {
      const patient = patientMap.get(data.patientId)
      return {
        patientId: data.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        totalPaid: data._sum.amount || 0,
        paymentCount: data._count.patientId
      }
    })
  }

  /**
   * Get top therapists by payment amount
   */
  private static async getTopTherapists(whereClause: any): Promise<Array<{
    therapistId: string
    therapistName: string
    totalReceived: number
    paymentCount: number
  }>> {
    const therapistData = await db.payment.groupBy({
      by: ['therapistId'],
      where: whereClause,
      _count: { therapistId: true },
      _sum: { amount: true },
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      },
      take: 10
    })

    const therapistIds = therapistData.map(t => t.therapistId)
    const therapists = await db.therapist.findMany({
      where: { id: { in: therapistIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    })

    const therapistMap = new Map(therapists.map(t => [t.id, t]))

    return therapistData.map(data => {
      const therapist = therapistMap.get(data.therapistId)
      return {
        therapistId: data.therapistId,
        therapistName: therapist ? `${therapist.firstName} ${therapist.lastName}` : 'Unknown',
        totalReceived: data._sum.amount || 0,
        paymentCount: data._count.therapistId
      }
    })
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
      if (filters.patientId) filterDescriptions.push('specific patient')
      if (filters.therapistId) filterDescriptions.push('specific therapist')
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
