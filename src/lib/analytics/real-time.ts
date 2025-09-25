
// Real-time metrics interfaces
export interface RealTimeMetrics {
  timestamp: Date
  activeUsers: number
  totalSessions: number
  newSignups: number
  recentActions: number
  securityEvents: number
  systemLoad: SystemMetrics
  errorRate: number
}

export interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkActivity: number
}

export interface LiveActivity {
  id: string
  type: 'user_action' | 'security_event' | 'system_event'
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  userId?: string
  metadata?: Record<string, unknown>
}

export interface ChartDataPoint {
  timestamp: string
  value: number
  label?: string
}

/**
 * Real-time analytics service for live dashboard updates
 * Client-side service that fetches data from API endpoints
 */
export class RealTimeAnalytics {
  /**
   * Get current real-time metrics via API
   */
  static async getCurrentMetrics(): Promise<RealTimeMetrics> {
    try {
      const response = await fetch('/api/analytics/real-time?type=metrics')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch metrics')
      }

      return {
        ...data.data,
        timestamp: new Date(data.data.timestamp)
      }
    } catch (error) {
      console.error('Failed to get real-time metrics:', error)
      throw new Error('Failed to retrieve metrics')
    }
  }

  /**
   * Get live activity feed via API
   */
  static async getLiveActivity(limit = 50): Promise<LiveActivity[]> {
    try {
      const response = await fetch(`/api/analytics/real-time?type=activity&limit=${limit}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch activity')
      }

      return data.data.map((activity: Record<string, unknown>) => ({
        ...activity,
        timestamp: new Date(activity.timestamp as string | number | Date)
      }))
    } catch (error) {
      console.error('Failed to get live activity:', error)
      throw new Error('Failed to retrieve activity feed')
    }
  }

  /**
   * Get chart data for various metrics over time via API
   */
  static async getChartData(
    metric: 'users' | 'sessions' | 'actions' | 'errors',
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<ChartDataPoint[]> {
    try {
      const response = await fetch(`/api/analytics/real-time?type=chart&metric=${metric}&timeRange=${timeRange}`)
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch chart data')
      }

      return data.data
    } catch (error) {
      console.error(`Failed to get chart data for ${metric}:`, error)
      throw new Error('Failed to retrieve chart data')
    }
  }

  /**
   * Get performance metrics via API
   */
  static async getPerformanceMetrics() {
    try {
      const response = await fetch('/api/analytics/real-time?type=performance')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch performance metrics')
      }

      return {
        ...data.data,
        timestamp: new Date(data.data.timestamp)
      }
    } catch (error) {
      console.error('Failed to get performance metrics:', error)
      throw new Error('Failed to retrieve performance metrics')
    }
  }

  /**
   * Clear cache via API (for admin users)
   */
  static async clearCache() {
    try {
      await fetch('/api/analytics/real-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_cache' })
      })
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }
}