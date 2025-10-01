import { db } from './db'
import { PaymentStatus } from '@prisma/client'

export type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
export type AnalyticsPeriod = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'LAST_YEAR' | 'CUSTOM'

export interface PaymentAnalyticsFilters {
  startDate?: Date
  endDate?: Date
  paymentStatus?: PaymentStatus[]
  paymentMethod?: string[]
  parentId?: string
  minAmount?: number
  maxAmount?: number
}

export interface PaymentAnalytics {
  totalPayments: number
  totalAmount: number
  averageAmount: number
  statusBreakdown: Record<string, number>
  methodBreakdown: Record<string, number>
  amountBreakdown: Record<string, number>
  dailyTrends: Array<{
    date: string
    count: number
    amount: number
  }>
  monthlyTrends: Array<{
    month: string
    count: number
    amount: number
    growth: number
  }>
  revenueMetrics: {
    grossRevenue: number
    netRevenue: number
    pendingAmount: number
    revenueGrowth: number
  }
}

export interface FinancialReport {
  id: string
  reportType: ReportType
  period: {
    start: Date
    end: Date
  }
  generatedAt: Date
  generatedBy: string
  summary: {
    totalRevenue: number
    totalPayments: number
    averagePayment: number
    growthRate: number
  }
  revenueBreakdown: {
    byStatus: Record<string, number>
    byMethod: Record<string, number>
    byMonth: Array<{
      month: string
      revenue: number
      growth: number
    }>
  }
  insights: string[]
  recommendations: string[]
}

export class PaymentAnalyticsManager {
  /**
   * Get comprehensive payment analytics
   */
  static async getPaymentAnalytics(filters?: PaymentAnalyticsFilters): Promise<PaymentAnalytics> {
    try {
      const whereClause = this.buildWhereClause(filters)

      const [
        totalPayments,
        totalAmount,
        statusBreakdown,
        methodBreakdown,
        amountBreakdown,
        dailyTrends,
        monthlyTrends,
        revenueMetrics
      ] = await Promise.all([
        this.getTotalPayments(whereClause),
        this.getTotalAmount(whereClause),
        this.getStatusBreakdown(whereClause),
        this.getMethodBreakdown(whereClause),
        this.getAmountBreakdown(whereClause),
        this.getDailyTrends(whereClause),
        this.getMonthlyTrends(whereClause),
        this.getRevenueMetrics(whereClause)
      ])

      const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0

      return {
        totalPayments,
        totalAmount,
        averageAmount,
        statusBreakdown,
        methodBreakdown,
        amountBreakdown,
        dailyTrends,
        monthlyTrends,
        revenueMetrics
      }

    } catch (error) {
      console.error('Error getting payment analytics:', error)
      throw error
    }
  }

  /**
   * Generate financial report
   */
  static async generateFinancialReport(
    reportType: ReportType,
    period: { start: Date; end: Date },
    generatedBy: string
  ): Promise<FinancialReport> {
    try {
      const filters: PaymentAnalyticsFilters = {
        startDate: period.start,
        endDate: period.end
      }

      const analytics = await this.getPaymentAnalytics(filters)

      // Generate insights and recommendations
      const insights = await this.generateInsights(analytics, period)
      const recommendations = await this.generateRecommendations(analytics, period)

      const report: FinancialReport = {
        id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reportType,
        period,
        generatedAt: new Date(),
        generatedBy,
        summary: {
          totalRevenue: analytics.totalAmount,
          totalPayments: analytics.totalPayments,
          averagePayment: analytics.averageAmount,
          growthRate: analytics.revenueMetrics.revenueGrowth
        },
        revenueBreakdown: {
          byStatus: analytics.amountBreakdown,
          byMethod: analytics.methodBreakdown,
          byMonth: analytics.monthlyTrends
        },
        insights,
        recommendations
      }

      return report

    } catch (error) {
      console.error('Error generating financial report:', error)
      throw error
    }
  }

  /**
   * Get payment trends analysis
   */
  static async getPaymentTrends(
    period: AnalyticsPeriod,
    customPeriod?: { start: Date; end: Date }
  ): Promise<{
    period: { start: Date; end: Date }
    current: PaymentAnalytics
    previous: PaymentAnalytics
    comparison: {
      revenueChange: number
      paymentCountChange: number
      averagePaymentChange: number
      growthRate: number
    }
  }> {
    try {
      const currentPeriod = this.getPeriodDates(period, customPeriod)
      const previousPeriod = this.getPreviousPeriodDates(currentPeriod)

      const [currentAnalytics, previousAnalytics] = await Promise.all([
        this.getPaymentAnalytics({ startDate: currentPeriod.start, endDate: currentPeriod.end }),
        this.getPaymentAnalytics({ startDate: previousPeriod.start, endDate: previousPeriod.end })
      ])

      const comparison = {
        revenueChange: previousAnalytics.totalAmount > 0
          ? ((currentAnalytics.totalAmount - previousAnalytics.totalAmount) / previousAnalytics.totalAmount) * 100
          : 0,
        paymentCountChange: previousAnalytics.totalPayments > 0
          ? ((currentAnalytics.totalPayments - previousAnalytics.totalPayments) / previousAnalytics.totalPayments) * 100
          : 0,
        averagePaymentChange: previousAnalytics.averageAmount > 0
          ? ((currentAnalytics.averageAmount - previousAnalytics.averageAmount) / previousAnalytics.averageAmount) * 100
          : 0,
        growthRate: currentAnalytics.revenueMetrics.revenueGrowth
      }

      return {
        period: currentPeriod,
        current: currentAnalytics,
        previous: previousAnalytics,
        comparison
      }

    } catch (error) {
      console.error('Error getting payment trends:', error)
      throw error
    }
  }

  /**
   * Get real-time payment dashboard data
   */
  static async getRealTimeDashboard(): Promise<{
    today: {
      payments: number
      revenue: number
      pending: number
      completed: number
    }
    thisWeek: {
      payments: number
      revenue: number
      growth: number
    }
    thisMonth: {
      payments: number
      revenue: number
      growth: number
    }
    alerts: Array<{
      type: 'HIGH_PENDING' | 'LOW_COMPLETION' | 'HIGH_REFUND' | 'SYSTEM_ISSUE'
      message: string
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    }>
  }> {
    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay())
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

      const [todayData, thisWeekData, thisMonthData] = await Promise.all([
        this.getPaymentAnalytics({ startDate: startOfDay, endDate: today }),
        this.getPaymentAnalytics({ startDate: startOfWeek, endDate: today }),
        this.getPaymentAnalytics({ startDate: startOfMonth, endDate: today })
      ])

      const alerts = await this.generateAlerts(todayData, thisWeekData, thisMonthData)

      return {
        today: {
          payments: todayData.totalPayments,
          revenue: todayData.totalAmount,
          pending: todayData.statusBreakdown['PENDING'] || 0,
          completed: todayData.statusBreakdown['CONFIRMED'] || 0
        },
        thisWeek: {
          payments: thisWeekData.totalPayments,
          revenue: thisWeekData.totalAmount,
          growth: thisWeekData.revenueMetrics.revenueGrowth
        },
        thisMonth: {
          payments: thisMonthData.totalPayments,
          revenue: thisMonthData.totalAmount,
          growth: thisMonthData.revenueMetrics.revenueGrowth
        },
        alerts
      }

    } catch (error) {
      console.error('Error getting real-time dashboard:', error)
      throw error
    }
  }

  // Helper methods
  private static buildWhereClause(filters?: PaymentAnalyticsFilters): any {
    const whereClause: any = {}

    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {}
      if (filters.startDate) whereClause.createdAt.gte = filters.startDate
      if (filters.endDate) whereClause.createdAt.lte = filters.endDate
    }

    if (filters?.paymentStatus && filters.paymentStatus.length > 0) {
      whereClause.status = { in: filters.paymentStatus }
    }

    if (filters?.paymentMethod && filters.paymentMethod.length > 0) {
      whereClause.paymentMethod = { in: filters.paymentMethod }
    }

    if (filters?.parentId) {
      whereClause.parentId = filters.parentId
    }

    if (filters?.minAmount || filters?.maxAmount) {
      whereClause.amount = {}
      if (filters.minAmount) whereClause.amount.gte = filters.minAmount
      if (filters.maxAmount) whereClause.amount.lte = filters.maxAmount
    }

    return whereClause
  }

  private static async getTotalPayments(whereClause: any): Promise<number> {
    return await db.payment.count({ where: whereClause })
  }

  private static async getTotalAmount(whereClause: any): Promise<number> {
    const result = await db.payment.aggregate({
      where: whereClause,
      _sum: { amount: true }
    })
    return result._sum.amount?.toNumber() || 0
  }

  private static async getStatusBreakdown(whereClause: any): Promise<Record<string, number>> {
    const breakdown = await db.payment.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true }
    })

    const result: Record<string, number> = {}
    breakdown.forEach(item => {
      result[item.status] = item._count.status
    })

    return result
  }

  private static async getMethodBreakdown(whereClause: any): Promise<Record<string, number>> {
    const breakdown = await db.payment.groupBy({
      by: ['paymentMethod'],
      where: whereClause,
      _count: { paymentMethod: true }
    })

    const result: Record<string, number> = {}
    breakdown.forEach(item => {
      if (item.paymentMethod) {
        result[item.paymentMethod] = item._count.paymentMethod
      }
    })

    return result
  }

  private static async getAmountBreakdown(whereClause: any): Promise<Record<string, number>> {
    const breakdown = await db.payment.groupBy({
      by: ['status'],
      where: whereClause,
      _sum: { amount: true }
    })

    const result: Record<string, number> = {}
    breakdown.forEach(item => {
      result[item.status] = item._sum.amount?.toNumber() || 0
    })

    return result
  }

  private static async getDailyTrends(whereClause: any): Promise<Array<{
    date: string
    count: number
    amount: number
  }>> {
    const payments = await db.payment.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        amount: true
      },
      orderBy: { createdAt: 'asc' }
    })

    const trends: Record<string, { count: number; amount: number }> = {}

    payments.forEach(payment => {
      const date = payment.createdAt.toISOString().split('T')[0]
      if (!trends[date]) {
        trends[date] = { count: 0, amount: 0 }
      }
      trends[date].count++
      trends[date].amount += payment.amount.toNumber()
    })

    return Object.entries(trends).map(([date, data]) => ({
      date,
      ...data
    }))
  }

  private static async getMonthlyTrends(whereClause: any): Promise<Array<{
    month: string
    count: number
    amount: number
    growth: number
  }>> {
    const payments = await db.payment.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        amount: true
      },
      orderBy: { createdAt: 'asc' }
    })

    const trends: Record<string, { count: number; amount: number }> = {}

    payments.forEach(payment => {
      const month = payment.createdAt.toISOString().substring(0, 7) // YYYY-MM
      if (!trends[month]) {
        trends[month] = { count: 0, amount: 0 }
      }
      trends[month].count++
      trends[month].amount += payment.amount.toNumber()
    })

    const sortedMonths = Object.keys(trends).sort()
    return sortedMonths.map((month, index) => {
      const current = trends[month]
      const previous = index > 0 ? trends[sortedMonths[index - 1]] : null
      const growth = previous && previous.amount > 0
        ? ((current.amount - previous.amount) / previous.amount) * 100
        : 0

      return {
        month,
        count: current.count,
        amount: current.amount,
        growth
      }
    })
  }

  private static async getRevenueMetrics(whereClause: any): Promise<{
    grossRevenue: number
    netRevenue: number
    pendingAmount: number
    revenueGrowth: number
  }> {
    const amountBreakdown = await this.getAmountBreakdown(whereClause)
    const grossRevenue = amountBreakdown['CONFIRMED'] || 0
    const pendingAmount = amountBreakdown['PENDING'] || 0
    const netRevenue = grossRevenue

    // Simplified revenue growth calculation
    const revenueGrowth = 0

    return {
      grossRevenue,
      netRevenue,
      pendingAmount,
      revenueGrowth
    }
  }

  private static async generateInsights(analytics: PaymentAnalytics, period: { start: Date; end: Date }): Promise<string[]> {
    const insights: string[] = []

    // Revenue insights
    if (analytics.revenueMetrics.revenueGrowth > 10) {
      insights.push(`Revenue growth of ${analytics.revenueMetrics.revenueGrowth.toFixed(1)}% indicates strong business performance`)
    } else if (analytics.revenueMetrics.revenueGrowth < -5) {
      insights.push(`Revenue decline of ${Math.abs(analytics.revenueMetrics.revenueGrowth).toFixed(1)}% requires attention`)
    }

    // Payment completion insights
    const totalPayments = analytics.totalPayments
    const completedPayments = analytics.statusBreakdown['CONFIRMED'] || 0
    const completionRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0

    if (completionRate < 80) {
      insights.push(`Low completion rate of ${completionRate.toFixed(1)}% indicates potential issues`)
    }

    return insights
  }

  private static async generateRecommendations(analytics: PaymentAnalytics, period: { start: Date; end: Date }): Promise<string[]> {
    const recommendations: string[] = []

    // Revenue recommendations
    if (analytics.revenueMetrics.revenueGrowth < 0) {
      recommendations.push('Consider implementing promotional campaigns to boost revenue')
    }

    // Completion rate recommendations
    const totalPayments = analytics.totalPayments
    const completedPayments = analytics.statusBreakdown['CONFIRMED'] || 0
    const completionRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0

    if (completionRate < 85) {
      recommendations.push('Review payment process to identify and resolve completion issues')
    }

    return recommendations
  }

  private static getPeriodDates(period: AnalyticsPeriod, customPeriod?: { start: Date; end: Date }): { start: Date; end: Date } {
    if (period === 'CUSTOM' && customPeriod) {
      return customPeriod
    }

    const now = new Date()
    const start = new Date(now)
    const end = new Date(now)

    switch (period) {
      case 'TODAY':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'YESTERDAY':
        start.setDate(start.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        end.setDate(end.getDate() - 1)
        end.setHours(23, 59, 59, 999)
        break
      case 'LAST_7_DAYS':
        start.setDate(start.getDate() - 7)
        break
      case 'LAST_30_DAYS':
        start.setDate(start.getDate() - 30)
        break
      case 'LAST_90_DAYS':
        start.setDate(start.getDate() - 90)
        break
      case 'THIS_MONTH':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        break
      case 'LAST_MONTH':
        start.setMonth(start.getMonth() - 1, 1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(end.getMonth(), 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'THIS_YEAR':
        start.setMonth(0, 1)
        start.setHours(0, 0, 0, 0)
        break
      case 'LAST_YEAR':
        start.setFullYear(start.getFullYear() - 1, 0, 1)
        start.setHours(0, 0, 0, 0)
        end.setFullYear(end.getFullYear() - 1, 11, 31)
        end.setHours(23, 59, 59, 999)
        break
    }

    return { start, end }
  }

  private static getPreviousPeriodDates(currentPeriod: { start: Date; end: Date }): { start: Date; end: Date } {
    const duration = currentPeriod.end.getTime() - currentPeriod.start.getTime()
    const start = new Date(currentPeriod.start.getTime() - duration)
    const end = new Date(currentPeriod.start.getTime() - 1)

    return { start, end }
  }

  private static async generateAlerts(todayData: PaymentAnalytics, thisWeekData: PaymentAnalytics, thisMonthData: PaymentAnalytics): Promise<Array<{
    type: 'HIGH_PENDING' | 'LOW_COMPLETION' | 'HIGH_REFUND' | 'SYSTEM_ISSUE'
    message: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  }>> {
    const alerts: Array<{
      type: 'HIGH_PENDING' | 'LOW_COMPLETION' | 'HIGH_REFUND' | 'SYSTEM_ISSUE'
      message: string
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    }> = []

    // High pending payments
    const pendingCount = todayData.statusBreakdown['PENDING'] || 0
    if (pendingCount > 10) {
      alerts.push({
        type: 'HIGH_PENDING',
        message: `${pendingCount} payments are pending`,
        severity: 'MEDIUM'
      })
    }

    // Low completion rate
    const totalPayments = todayData.totalPayments
    const completedPayments = todayData.statusBreakdown['CONFIRMED'] || 0
    const completionRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 100

    if (completionRate < 70 && totalPayments > 0) {
      alerts.push({
        type: 'LOW_COMPLETION',
        message: `Low completion rate: ${completionRate.toFixed(1)}%`,
        severity: 'HIGH'
      })
    }

    return alerts
  }

  /**
   * Generate payment forecast based on historical data
   */
  static async generatePaymentForecast(
    period: { start: Date; end: Date },
    historicalMonths: number = 12
  ): Promise<{
    forecast: Array<{
      month: string
      predictedRevenue: number
      predictedPayments: number
      confidence: number
    }>
    historicalData: Array<{
      month: string
      revenue: number
      payments: number
    }>
    insights: string[]
  }> {
    try {
      // Get historical data for the specified months
      const historicalStart = new Date(period.start)
      historicalStart.setMonth(historicalStart.getMonth() - historicalMonths)
      
      const historicalData = await this.getMonthlyTrends({
        createdAt: {
          gte: historicalStart,
          lte: period.start
        }
      })
      
      // Simple linear regression for forecasting
      const forecast: Array<{
        month: string
        predictedRevenue: number
        predictedPayments: number
        confidence: number
      }> = []
      
      // Calculate average monthly revenue and payments
      const avgRevenue = historicalData.length > 0 
        ? historicalData.reduce((sum, item) => sum + item.revenue, 0) / historicalData.length 
        : 0
      
      const avgPayments = historicalData.length > 0 
        ? historicalData.reduce((sum, item) => sum + item.count, 0) / historicalData.length 
        : 0
      
      // Generate forecast for the requested period
      const currentDate = new Date(period.start)
      const endDate = new Date(period.end)
      
      while (currentDate <= endDate) {
        const monthStr = currentDate.toISOString().substring(0, 7) // YYYY-MM format
        
        // Simple trend calculation (could be improved with more sophisticated algorithms)
        const monthIndex = forecast.length
        const trendFactor = 1 + (monthIndex * 0.02) // 2% growth per month
        
        forecast.push({
          month: monthStr,
          predictedRevenue: avgRevenue * trendFactor,
          predictedPayments: avgPayments * trendFactor,
          confidence: Math.max(0.6, 1 - (monthIndex * 0.05)) // Decreasing confidence over time
        })
        
        currentDate.setMonth(currentDate.getMonth() + 1)
      }
      
      // Generate insights
      const insights: string[] = []
      if (historicalData.length > 0) {
        const recentTrend = historicalData.slice(-3)
        const avgRecent = recentTrend.reduce((sum, item) => sum + item.revenue, 0) / recentTrend.length
        
        if (avgRecent > avgRevenue * 1.1) {
          insights.push('Revenue is trending upward in recent months')
        } else if (avgRecent < avgRevenue * 0.9) {
          insights.push('Revenue has declined in recent months')
        }
        
        insights.push(`Based on ${historicalMonths} months of historical data`)
        insights.push(`Average monthly revenue: $${avgRevenue.toFixed(2)}`)
      }
      
      return {
        forecast,
        historicalData: historicalData.map(item => ({
          month: item.month,
          revenue: item.revenue,
          payments: item.count
        })),
        insights
      }
      
    } catch (error) {
      console.error('Error generating payment forecast:', error)
      throw error
    }
  }
}
