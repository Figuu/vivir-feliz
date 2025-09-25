import { db } from './db'

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHECK' | 'OTHER'
export type ReportType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
export type AnalyticsPeriod = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'LAST_YEAR' | 'CUSTOM'

export interface PaymentAnalyticsFilters {
  startDate?: Date
  endDate?: Date
  paymentStatus?: PaymentStatus[]
  paymentMethod?: PaymentMethod[]
  therapistId?: string
  patientId?: string
  minAmount?: number
  maxAmount?: number
  specialtyId?: string
  serviceId?: string
}

export interface PaymentAnalytics {
  totalPayments: number
  totalAmount: number
  averageAmount: number
  medianAmount: number
  statusBreakdown: Record<PaymentStatus, number>
  methodBreakdown: Record<PaymentMethod, number>
  amountBreakdown: Record<PaymentStatus, number>
  dailyTrends: Array<{
    date: string
    count: number
    amount: number
    status: PaymentStatus
  }>
  monthlyTrends: Array<{
    month: string
    count: number
    amount: number
    growth: number
  }>
  topTherapists: Array<{
    therapistId: string
    therapistName: string
    paymentCount: number
    totalAmount: number
    averageAmount: number
  }>
  topServices: Array<{
    serviceId: string
    serviceName: string
    paymentCount: number
    totalAmount: number
    averageAmount: number
  }>
  paymentVelocity: {
    averageProcessingTime: number
    completionRate: number
    failureRate: number
    cancellationRate: number
  }
  revenueMetrics: {
    grossRevenue: number
    netRevenue: number
    refundedAmount: number
    pendingAmount: number
    revenueGrowth: number
    revenuePerPatient: number
    revenuePerTherapist: number
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
    topPerformingTherapist: string
    topService: string
  }
  revenueBreakdown: {
    byStatus: Record<PaymentStatus, number>
    byMethod: Record<PaymentMethod, number>
    byTherapist: Array<{
      therapistId: string
      therapistName: string
      revenue: number
      percentage: number
    }>
    byService: Array<{
      serviceId: string
      serviceName: string
      revenue: number
      percentage: number
    }>
    byMonth: Array<{
      month: string
      revenue: number
      growth: number
    }>
  }
  performanceMetrics: {
    paymentCompletionRate: number
    averageProcessingTime: number
    refundRate: number
    cancellationRate: number
    patientRetentionRate: number
    therapistUtilizationRate: number
  }
  trends: {
    revenueTrend: 'INCREASING' | 'DECREASING' | 'STABLE'
    paymentVolumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE'
    averagePaymentTrend: 'INCREASING' | 'DECREASING' | 'STABLE'
    growthProjection: number
  }
  insights: string[]
  recommendations: string[]
}

export interface PaymentForecast {
  period: {
    start: Date
    end: Date
  }
  forecastedRevenue: number
  forecastedPayments: number
  confidenceLevel: number
  factors: Array<{
    factor: string
    impact: number
    description: string
  }>
  scenarios: {
    optimistic: number
    realistic: number
    pessimistic: number
  }
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
        topTherapists,
        topServices,
        paymentVelocity,
        revenueMetrics
      ] = await Promise.all([
        this.getTotalPayments(whereClause),
        this.getTotalAmount(whereClause),
        this.getStatusBreakdown(whereClause),
        this.getMethodBreakdown(whereClause),
        this.getAmountBreakdown(whereClause),
        this.getDailyTrends(whereClause),
        this.getMonthlyTrends(whereClause),
        this.getTopTherapists(whereClause),
        this.getTopServices(whereClause),
        this.getPaymentVelocity(whereClause),
        this.getRevenueMetrics(whereClause)
      ])

      const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0
      const medianAmount = await this.getMedianAmount(whereClause)

      return {
        totalPayments,
        totalAmount,
        averageAmount,
        medianAmount,
        statusBreakdown,
        methodBreakdown,
        amountBreakdown,
        dailyTrends,
        monthlyTrends,
        topTherapists,
        topServices,
        paymentVelocity,
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

      // Calculate trends
      const trends = await this.calculateTrends(analytics, period)

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
          growthRate: trends.revenueTrend === 'INCREASING' ? analytics.revenueMetrics.revenueGrowth : 0,
          topPerformingTherapist: analytics.topTherapists[0]?.therapistName || 'N/A',
          topService: analytics.topServices[0]?.serviceName || 'N/A'
        },
        revenueBreakdown: {
          byStatus: analytics.amountBreakdown,
          byMethod: analytics.methodBreakdown,
          byTherapist: analytics.topTherapists.map(t => ({
            therapistId: t.therapistId,
            therapistName: t.therapistName,
            revenue: t.totalAmount,
            percentage: analytics.totalAmount > 0 ? (t.totalAmount / analytics.totalAmount) * 100 : 0
          })),
          byService: analytics.topServices.map(s => ({
            serviceId: s.serviceId,
            serviceName: s.serviceName,
            revenue: s.totalAmount,
            percentage: analytics.totalAmount > 0 ? (s.totalAmount / analytics.totalAmount) * 100 : 0
          })),
          byMonth: analytics.monthlyTrends
        },
        performanceMetrics: {
          paymentCompletionRate: analytics.paymentVelocity.completionRate,
          averageProcessingTime: analytics.paymentVelocity.averageProcessingTime,
          refundRate: analytics.paymentVelocity.failureRate,
          cancellationRate: analytics.paymentVelocity.cancellationRate,
          patientRetentionRate: await this.getPatientRetentionRate(filters),
          therapistUtilizationRate: await this.getTherapistUtilizationRate(filters)
        },
        trends,
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
   * Generate payment forecast
   */
  static async generatePaymentForecast(
    period: { start: Date; end: Date },
    historicalMonths: number = 12
  ): Promise<PaymentForecast> {
    try {
      const historicalStart = new Date(period.start)
      historicalStart.setMonth(historicalStart.getMonth() - historicalMonths)

      const historicalFilters: PaymentAnalyticsFilters = {
        startDate: historicalStart,
        endDate: new Date(period.start)
      }

      const historicalAnalytics = await this.getPaymentAnalytics(historicalFilters)
      
      // Calculate forecast based on historical trends
      const monthlyGrowth = this.calculateMonthlyGrowth(historicalAnalytics.monthlyTrends)
      const forecastedRevenue = this.calculateForecastedRevenue(historicalAnalytics, monthlyGrowth, period)
      const forecastedPayments = this.calculateForecastedPayments(historicalAnalytics, monthlyGrowth, period)

      // Calculate confidence level based on data consistency
      const confidenceLevel = this.calculateConfidenceLevel(historicalAnalytics)

      // Identify key factors
      const factors = this.identifyForecastFactors(historicalAnalytics)

      // Generate scenarios
      const scenarios = this.generateScenarios(forecastedRevenue, confidenceLevel)

      return {
        period,
        forecastedRevenue,
        forecastedPayments,
        confidenceLevel,
        factors,
        scenarios
      }

    } catch (error) {
      console.error('Error generating payment forecast:', error)
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
          pending: todayData.statusBreakdown.PENDING || 0,
          completed: todayData.statusBreakdown.COMPLETED || 0
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

    if (filters?.therapistId) {
      whereClause.therapistId = filters.therapistId
    }

    if (filters?.patientId) {
      whereClause.patientId = filters.patientId
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
    return result._sum.amount || 0
  }

  private static async getStatusBreakdown(whereClause: any): Promise<Record<PaymentStatus, number>> {
    const breakdown = await db.payment.groupBy({
      by: ['status'],
      where: whereClause,
      _count: { status: true }
    })

    const result: Record<PaymentStatus, number> = {
      PENDING: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      FAILED: 0,
      CANCELLED: 0,
      REFUNDED: 0
    }

    breakdown.forEach(item => {
      result[item.status as PaymentStatus] = item._count.status
    })

    return result
  }

  private static async getMethodBreakdown(whereClause: any): Promise<Record<PaymentMethod, number>> {
    const breakdown = await db.payment.groupBy({
      by: ['paymentMethod'],
      where: whereClause,
      _count: { paymentMethod: true }
    })

    const result: Record<PaymentMethod, number> = {
      CASH: 0,
      CARD: 0,
      BANK_TRANSFER: 0,
      CHECK: 0,
      OTHER: 0
    }

    breakdown.forEach(item => {
      result[item.paymentMethod as PaymentMethod] = item._count.paymentMethod
    })

    return result
  }

  private static async getAmountBreakdown(whereClause: any): Promise<Record<PaymentStatus, number>> {
    const breakdown = await db.payment.groupBy({
      by: ['status'],
      where: whereClause,
      _sum: { amount: true }
    })

    const result: Record<PaymentStatus, number> = {
      PENDING: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      FAILED: 0,
      CANCELLED: 0,
      REFUNDED: 0
    }

    breakdown.forEach(item => {
      result[item.status as PaymentStatus] = item._sum.amount || 0
    })

    return result
  }

  private static async getDailyTrends(whereClause: any): Promise<Array<{
    date: string
    count: number
    amount: number
    status: PaymentStatus
  }>> {
    // Simplified implementation - in a real system, you'd use proper date aggregation
    const payments = await db.payment.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        amount: true,
        status: true
      },
      orderBy: { createdAt: 'asc' }
    })

    const trends: Record<string, { count: number; amount: number; status: PaymentStatus }> = {}
    
    payments.forEach(payment => {
      const date = payment.createdAt.toISOString().split('T')[0]
      if (!trends[date]) {
        trends[date] = { count: 0, amount: 0, status: payment.status as PaymentStatus }
      }
      trends[date].count++
      trends[date].amount += payment.amount
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
    // Simplified implementation - in a real system, you'd use proper date aggregation
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
      trends[month].amount += payment.amount
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

  private static async getTopTherapists(whereClause: any): Promise<Array<{
    therapistId: string
    therapistName: string
    paymentCount: number
    totalAmount: number
    averageAmount: number
  }>> {
    const breakdown = await db.payment.groupBy({
      by: ['therapistId'],
      where: whereClause,
      _count: { therapistId: true },
      _sum: { amount: true }
    })

    // Get therapist names
    const therapistIds = breakdown.map(item => item.therapistId)
    const therapists = await db.therapist.findMany({
      where: { id: { in: therapistIds } },
      select: { id: true, firstName: true, lastName: true }
    })

    const therapistMap = new Map(therapists.map(t => [t.id, `${t.firstName} ${t.lastName}`]))

    return breakdown
      .map(item => ({
        therapistId: item.therapistId,
        therapistName: therapistMap.get(item.therapistId) || 'Unknown',
        paymentCount: item._count.therapistId,
        totalAmount: item._sum.amount || 0,
        averageAmount: item._count.therapistId > 0 ? (item._sum.amount || 0) / item._count.therapistId : 0
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)
  }

  private static async getTopServices(whereClause: any): Promise<Array<{
    serviceId: string
    serviceName: string
    paymentCount: number
    totalAmount: number
    averageAmount: number
  }>> {
    // This would require joining with services table
    // For now, return empty array
    return []
  }

  private static async getPaymentVelocity(whereClause: any): Promise<{
    averageProcessingTime: number
    completionRate: number
    failureRate: number
    cancellationRate: number
  }> {
    const statusBreakdown = await this.getStatusBreakdown(whereClause)
    const totalPayments = Object.values(statusBreakdown).reduce((sum, count) => sum + count, 0)

    return {
      averageProcessingTime: 0, // Would need to calculate from timestamps
      completionRate: totalPayments > 0 ? (statusBreakdown.COMPLETED / totalPayments) * 100 : 0,
      failureRate: totalPayments > 0 ? (statusBreakdown.FAILED / totalPayments) * 100 : 0,
      cancellationRate: totalPayments > 0 ? (statusBreakdown.CANCELLED / totalPayments) * 100 : 0
    }
  }

  private static async getRevenueMetrics(whereClause: any): Promise<{
    grossRevenue: number
    netRevenue: number
    refundedAmount: number
    pendingAmount: number
    revenueGrowth: number
    revenuePerPatient: number
    revenuePerTherapist: number
  }> {
    const amountBreakdown = await this.getAmountBreakdown(whereClause)
    const grossRevenue = amountBreakdown.COMPLETED
    const refundedAmount = amountBreakdown.REFUNDED
    const pendingAmount = amountBreakdown.PENDING
    const netRevenue = grossRevenue - refundedAmount

    // Calculate revenue growth (simplified)
    const revenueGrowth = 0 // Would need historical data

    // Calculate per-patient and per-therapist revenue
    const uniquePatients = await db.payment.findMany({
      where: whereClause,
      select: { patientId: true },
      distinct: ['patientId']
    })

    const uniqueTherapists = await db.payment.findMany({
      where: whereClause,
      select: { therapistId: true },
      distinct: ['therapistId']
    })

    return {
      grossRevenue,
      netRevenue,
      refundedAmount,
      pendingAmount,
      revenueGrowth,
      revenuePerPatient: uniquePatients.length > 0 ? netRevenue / uniquePatients.length : 0,
      revenuePerTherapist: uniqueTherapists.length > 0 ? netRevenue / uniqueTherapists.length : 0
    }
  }

  private static async getMedianAmount(whereClause: any): Promise<number> {
    const payments = await db.payment.findMany({
      where: whereClause,
      select: { amount: true },
      orderBy: { amount: 'asc' }
    })

    if (payments.length === 0) return 0

    const middle = Math.floor(payments.length / 2)
    return payments.length % 2 === 0
      ? (payments[middle - 1].amount + payments[middle].amount) / 2
      : payments[middle].amount
  }

  private static async generateInsights(analytics: PaymentAnalytics, period: { start: Date; end: Date }): Promise<string[]> {
    const insights: string[] = []

    // Revenue insights
    if (analytics.revenueMetrics.revenueGrowth > 10) {
      insights.push(`Revenue growth of ${analytics.revenueMetrics.revenueGrowth.toFixed(1)}% indicates strong business performance`)
    } else if (analytics.revenueMetrics.revenueGrowth < -5) {
      insights.push(`Revenue decline of ${Math.abs(analytics.revenueMetrics.revenueGrowth).toFixed(1)}% requires attention`)
    }

    // Payment method insights
    const cardPayments = analytics.methodBreakdown.CARD
    const totalPayments = analytics.totalPayments
    if (totalPayments > 0 && (cardPayments / totalPayments) > 0.7) {
      insights.push('Card payments dominate with over 70% of transactions')
    }

    // Completion rate insights
    if (analytics.paymentVelocity.completionRate < 80) {
      insights.push(`Low completion rate of ${analytics.paymentVelocity.completionRate.toFixed(1)}% indicates potential issues`)
    }

    return insights
  }

  private static async generateRecommendations(analytics: PaymentAnalytics, period: { start: Date; end: Date }): Promise<string[]> {
    const recommendations: string[] = []

    // Revenue recommendations
    if (analytics.revenueMetrics.revenueGrowth < 0) {
      recommendations.push('Consider implementing promotional campaigns to boost revenue')
    }

    // Payment method recommendations
    if (analytics.methodBreakdown.CASH > analytics.methodBreakdown.CARD) {
      recommendations.push('Encourage card payments to reduce cash handling and improve tracking')
    }

    // Completion rate recommendations
    if (analytics.paymentVelocity.completionRate < 85) {
      recommendations.push('Review payment process to identify and resolve completion issues')
    }

    return recommendations
  }

  private static async calculateTrends(analytics: PaymentAnalytics, period: { start: Date; end: Date }): Promise<{
    revenueTrend: 'INCREASING' | 'DECREASING' | 'STABLE'
    paymentVolumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE'
    averagePaymentTrend: 'INCREASING' | 'DECREASING' | 'STABLE'
    growthProjection: number
  }> {
    // Simplified trend calculation
    const revenueTrend = analytics.revenueMetrics.revenueGrowth > 5 ? 'INCREASING' : 
                        analytics.revenueMetrics.revenueGrowth < -5 ? 'DECREASING' : 'STABLE'
    
    const paymentVolumeTrend = 'STABLE' // Would need historical data
    const averagePaymentTrend = 'STABLE' // Would need historical data
    const growthProjection = analytics.revenueMetrics.revenueGrowth

    return {
      revenueTrend,
      paymentVolumeTrend,
      averagePaymentTrend,
      growthProjection
    }
  }

  private static async getPatientRetentionRate(filters: PaymentAnalyticsFilters): Promise<number> {
    // Simplified implementation
    return 75 // Would need to calculate based on repeat patients
  }

  private static async getTherapistUtilizationRate(filters: PaymentAnalyticsFilters): Promise<number> {
    // Simplified implementation
    return 80 // Would need to calculate based on therapist schedules
  }

  private static calculateMonthlyGrowth(monthlyTrends: Array<{ month: string; count: number; amount: number; growth: number }>): number {
    if (monthlyTrends.length < 2) return 0
    
    const recentGrowth = monthlyTrends.slice(-3).reduce((sum, trend) => sum + trend.growth, 0)
    return recentGrowth / Math.min(3, monthlyTrends.length)
  }

  private static calculateForecastedRevenue(analytics: PaymentAnalytics, monthlyGrowth: number, period: { start: Date; end: Date }): number {
    const months = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24 * 30)
    const currentMonthlyRevenue = analytics.totalAmount / 12 // Assuming 12 months of data
    return currentMonthlyRevenue * months * (1 + monthlyGrowth / 100)
  }

  private static calculateForecastedPayments(analytics: PaymentAnalytics, monthlyGrowth: number, period: { start: Date; end: Date }): number {
    const months = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24 * 30)
    const currentMonthlyPayments = analytics.totalPayments / 12 // Assuming 12 months of data
    return currentMonthlyPayments * months * (1 + monthlyGrowth / 100)
  }

  private static calculateConfidenceLevel(analytics: PaymentAnalytics): number {
    // Simplified confidence calculation based on data consistency
    const completionRate = analytics.paymentVelocity.completionRate
    const dataConsistency = Math.min(100, completionRate + (100 - analytics.paymentVelocity.failureRate))
    return Math.max(50, dataConsistency)
  }

  private static identifyForecastFactors(analytics: PaymentAnalytics): Array<{
    factor: string
    impact: number
    description: string
  }> {
    return [
      {
        factor: 'Payment Completion Rate',
        impact: analytics.paymentVelocity.completionRate,
        description: 'Higher completion rates lead to more accurate forecasts'
      },
      {
        factor: 'Revenue Growth',
        impact: analytics.revenueMetrics.revenueGrowth,
        description: 'Historical growth patterns influence future projections'
      },
      {
        factor: 'Payment Method Distribution',
        impact: 75, // Simplified
        description: 'Card payments tend to be more predictable than cash'
      }
    ]
  }

  private static generateScenarios(forecastedRevenue: number, confidenceLevel: number): {
    optimistic: number
    realistic: number
    pessimistic: number
  } {
    const confidenceFactor = confidenceLevel / 100
    const optimistic = forecastedRevenue * (1 + (1 - confidenceFactor) * 0.2)
    const realistic = forecastedRevenue
    const pessimistic = forecastedRevenue * (1 - (1 - confidenceFactor) * 0.2)

    return { optimistic, realistic, pessimistic }
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
    if (todayData.statusBreakdown.PENDING > 10) {
      alerts.push({
        type: 'HIGH_PENDING',
        message: `${todayData.statusBreakdown.PENDING} payments are pending`,
        severity: 'MEDIUM'
      })
    }

    // Low completion rate
    if (todayData.paymentVelocity.completionRate < 70) {
      alerts.push({
        type: 'LOW_COMPLETION',
        message: `Low completion rate: ${todayData.paymentVelocity.completionRate.toFixed(1)}%`,
        severity: 'HIGH'
      })
    }

    // High refund rate
    if (todayData.paymentVelocity.failureRate > 15) {
      alerts.push({
        type: 'HIGH_REFUND',
        message: `High refund rate: ${todayData.paymentVelocity.failureRate.toFixed(1)}%`,
        severity: 'HIGH'
      })
    }

    return alerts
  }
}
