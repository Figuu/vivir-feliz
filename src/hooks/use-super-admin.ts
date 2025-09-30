'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface DashboardData {
  financial?: {
    totalRevenue: number
    paidRevenue: number
    pendingRevenue: number
    overdueRevenue: number
    collectionRate: string
  }
  users?: {
    total: number
    active: number
    byRole: Array<{ role: string; count: number }>
  }
  sessions?: {
    total: number
    completed: number
    upcoming: number
    today: number
    completionRate: string
  }
  system?: {
    uptime: number
    memory: {
      used: number
      total: number
      percentage: string
    }
    nodejs: string
    platform: string
  }
}

interface QuickStats {
  patients: number
  therapists: number
  sessions: number
  payments: number
  activeUsers: number
}

interface Alert {
  severity: string
  type: string
  message: string
  timestamp: string
}

interface AlertsData {
  alerts: Alert[]
  totalAlerts: number
  criticalCount: number
  warningCount: number
  infoCount: number
}

export function useSuperAdmin() {
  const [loading, setLoading] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null)
  const [alerts, setAlerts] = useState<AlertsData | null>(null)

  // Load dashboard data
  const loadDashboard = async (options?: {
    includeFinancial?: boolean
    includeUsers?: boolean
    includeSessions?: boolean
    includeSystem?: boolean
  }) => {
    try {
      setLoading(true)

      const params = new URLSearchParams({ action: 'dashboard' })
      if (options?.includeFinancial !== undefined) params.append('includeFinancial', options.includeFinancial.toString())
      if (options?.includeUsers !== undefined) params.append('includeUsers', options.includeUsers.toString())
      if (options?.includeSessions !== undefined) params.append('includeSessions', options.includeSessions.toString())
      if (options?.includeSystem !== undefined) params.append('includeSystem', options.includeSystem.toString())

      const response = await fetch(`/api/super-admin?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const result = await response.json()
      setDashboardData(result.data)
      return result.data
    } catch (err) {
      console.error('Error loading dashboard:', err)
      toast.error('Failed to load dashboard data')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Load quick stats
  const loadQuickStats = async () => {
    try {
      const response = await fetch('/api/super-admin?action=quick-stats')

      if (!response.ok) {
        throw new Error('Failed to load quick stats')
      }

      const result = await response.json()
      setQuickStats(result.data)
      return result.data
    } catch (err) {
      console.error('Error loading quick stats:', err)
      toast.error('Failed to load quick stats')
      return null
    }
  }

  // Load system alerts
  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/super-admin?action=alerts')

      if (!response.ok) {
        throw new Error('Failed to load alerts')
      }

      const result = await response.json()
      setAlerts(result.data)
      return result.data
    } catch (err) {
      console.error('Error loading alerts:', err)
      toast.error('Failed to load alerts')
      return null
    }
  }

  // Utility functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return {
    loading,
    dashboardData,
    quickStats,
    alerts,
    loadDashboard,
    loadQuickStats,
    loadAlerts,
    formatCurrency,
    formatUptime
  }
}
