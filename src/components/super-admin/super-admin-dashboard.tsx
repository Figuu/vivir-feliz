'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  DollarSign, 
  Users,
  Calendar,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Server,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useSuperAdmin } from '@/hooks/use-super-admin'
import Link from 'next/link'

export function SuperAdminDashboard() {
  const { 
    loading, 
    dashboardData, 
    quickStats, 
    alerts, 
    loadDashboard, 
    loadQuickStats, 
    loadAlerts,
    formatCurrency,
    formatUptime
  } = useSuperAdmin()

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    await Promise.all([
      loadDashboard(),
      loadQuickStats(),
      loadAlerts()
    ])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Super Admin Dashboard
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadAll}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Alerts */}
      {alerts && alerts.alerts.length > 0 && (
        <Alert variant={alerts.criticalCount > 0 ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold mb-2">
              {alerts.criticalCount} Critical, {alerts.warningCount} Warning, {alerts.infoCount} Info alerts
            </p>
            <div className="space-y-1">
              {alerts.alerts.slice(0, 3).map((alert, index) => (
                <p key={index} className="text-sm">
                  • {alert.message}
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      {quickStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{quickStats.patients}</p>
                <p className="text-xs text-muted-foreground">Patients</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{quickStats.therapists}</p>
                <p className="text-xs text-muted-foreground">Therapists</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{quickStats.sessions}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="pt-6 text-center">
                <DollarSign className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{quickStats.payments}</p>
                <p className="text-xs text-muted-foreground">Payments</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{quickStats.activeUsers}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Main Metrics */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Financial Overview */}
          {dashboardData.financial && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="text-xl font-bold">{formatCurrency(dashboardData.financial.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Collected</span>
                    <span className="text-xl font-bold text-green-600">{formatCurrency(dashboardData.financial.paidRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <span className="text-xl font-bold text-yellow-600">{formatCurrency(dashboardData.financial.pendingRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Overdue</span>
                    <span className="text-xl font-bold text-red-600">{formatCurrency(dashboardData.financial.overdueRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-sm font-medium">Collection Rate</span>
                    <span className="text-2xl font-bold">{dashboardData.financial.collectionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sessions Overview */}
          {dashboardData.sessions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Calendar className="h-5 w-5 mr-2" />
                  Sessions Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Sessions</span>
                    <span className="text-xl font-bold">{dashboardData.sessions.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="text-xl font-bold text-green-600">{dashboardData.sessions.completed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Upcoming</span>
                    <span className="text-xl font-bold text-blue-600">{dashboardData.sessions.upcoming}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Today</span>
                    <span className="text-xl font-bold text-purple-600">{dashboardData.sessions.today}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-2xl font-bold">{dashboardData.sessions.completionRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Users Overview */}
          {dashboardData.users && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Users className="h-5 w-5 mr-2" />
                  Users Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Users</span>
                    <span className="text-xl font-bold">{dashboardData.users.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Users</span>
                    <span className="text-xl font-bold text-green-600">{dashboardData.users.active}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">By Role</p>
                    <div className="space-y-1">
                      {dashboardData.users.byRole.map(role => (
                        <div key={role.role} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{role.role}</span>
                          <span className="font-medium">{role.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Overview */}
          {dashboardData.system && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Server className="h-5 w-5 mr-2" />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Uptime</span>
                    <span className="text-xl font-bold">{formatUptime(dashboardData.system.uptime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Memory Usage</span>
                    <span className="text-xl font-bold">{dashboardData.system.memory.percentage}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Node.js</span>
                    <span className="text-sm font-medium">{dashboardData.system.nodejs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Platform</span>
                    <span className="text-sm font-medium capitalize">{dashboardData.system.platform}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/super-admin/user-management">
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Users
              </Button>
            </Link>
            <Link href="/super-admin/financial-oversight">
              <Button variant="outline" className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Finances
              </Button>
            </Link>
            <Link href="/super-admin/system-health">
              <Button variant="outline" className="w-full">
                <Activity className="h-4 w-4 mr-2" />
                Health
              </Button>
            </Link>
            <Link href="/super-admin/backup-management">
              <Button variant="outline" className="w-full">
                <Server className="h-4 w-4 mr-2" />
                Backups
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
