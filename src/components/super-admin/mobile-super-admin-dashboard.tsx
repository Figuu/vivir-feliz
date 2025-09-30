'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  DollarSign, 
  Users,
  Calendar,
  Activity,
  Shield,
  Database,
  Settings,
  FileText,
  Menu,
  X,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Server
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSuperAdmin } from '@/hooks/use-super-admin'
import Link from 'next/link'

export function MobileSuperAdminDashboard() {
  const [menuOpen, setMenuOpen] = useState(false)
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">Super Admin</h1>
              <p className="text-xs text-white/80">System Control</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border-b shadow-lg absolute top-[72px] left-0 right-0 z-40"
          >
            <div className="p-4 space-y-2">
              <Link href="/super-admin/user-management" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                  <Users className="h-5 w-5" />
                  <span className="font-medium">User Management</span>
                </div>
              </Link>
              <Link href="/super-admin/financial-oversight" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-medium">Financial Oversight</span>
                </div>
              </Link>
              <Link href="/super-admin/system-health" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                  <Activity className="h-5 w-5" />
                  <span className="font-medium">System Health</span>
                </div>
              </Link>
              <Link href="/super-admin/backup-management" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                  <Database className="h-5 w-5" />
                  <span className="font-medium">Backups</span>
                </div>
              </Link>
              <Link href="/super-admin/audit-compliance" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                  <Shield className="h-5 w-5" />
                  <span className="font-medium">Audit & Compliance</span>
                </div>
              </Link>
              <Link href="/super-admin/system-configuration" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Configuration</span>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="p-4 space-y-4 pb-24">
        {/* Alerts */}
        {alerts && alerts.alerts.length > 0 && (
          <Alert variant={alerts.criticalCount > 0 ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold text-sm mb-2">
                {alerts.totalAlerts} Active Alerts
              </p>
              <div className="space-y-1">
                {alerts.alerts.slice(0, 2).map((alert, index) => (
                  <p key={index} className="text-xs">
                    • {alert.message}
                  </p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Stats */}
        {quickStats && (
          <div className="grid grid-cols-2 gap-3">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6 text-center">
                  <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{quickStats.patients}</p>
                  <p className="text-xs text-muted-foreground">Patients</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6 text-center">
                  <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{quickStats.therapists}</p>
                  <p className="text-xs text-muted-foreground">Therapists</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{quickStats.sessions}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-6 text-center">
                  <DollarSign className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{quickStats.payments}</p>
                  <p className="text-xs text-muted-foreground">Payments</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Financial Overview */}
        {dashboardData?.financial && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(dashboardData.financial.totalRevenue)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-600 mb-1">Collected</p>
                  <p className="font-bold text-green-700">{formatCurrency(dashboardData.financial.paidRevenue)}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-xs text-yellow-600 mb-1">Pending</p>
                  <p className="font-bold text-yellow-700">{formatCurrency(dashboardData.financial.pendingRevenue)}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-xs text-red-600 mb-1">Overdue</p>
                  <p className="font-bold text-red-700">{formatCurrency(dashboardData.financial.overdueRevenue)}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">Collection Rate</p>
                  <p className="font-bold text-blue-700">{dashboardData.financial.collectionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sessions Overview */}
        {dashboardData?.sessions && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Sessions</p>
                  <p className="text-2xl font-bold">{dashboardData.sessions.total}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-600 mb-1">Completed</p>
                  <p className="font-bold text-green-700">{dashboardData.sessions.completed}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-600 mb-1">Upcoming</p>
                  <p className="font-bold text-blue-700">{dashboardData.sessions.upcoming}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-xs text-purple-600 mb-1">Today</p>
                  <p className="font-bold text-purple-700">{dashboardData.sessions.today}</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <p className="text-xs text-indigo-600 mb-1">Completion</p>
                  <p className="font-bold text-indigo-700">{dashboardData.sessions.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Status */}
        {dashboardData?.system && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">System Status</p>
                  <p className="text-lg font-bold">Operational</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-medium">{formatUptime(dashboardData.system.uptime)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Memory</span>
                  <span className="font-medium">{dashboardData.system.memory.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      parseFloat(dashboardData.system.memory.percentage) > 90 ? 'bg-red-500' :
                      parseFloat(dashboardData.system.memory.percentage) > 70 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${dashboardData.system.memory.percentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardContent className="pt-6 space-y-2">
            <Link href="/super-admin/user-management">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Users className="h-5 w-5 mr-3" />
                User Management
              </Button>
            </Link>
            <Link href="/super-admin/financial-oversight">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <DollarSign className="h-5 w-5 mr-3" />
                Financial Oversight
              </Button>
            </Link>
            <Link href="/super-admin/system-health">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Activity className="h-5 w-5 mr-3" />
                System Health
              </Button>
            </Link>
            <Link href="/super-admin/backup-management">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Database className="h-5 w-5 mr-3" />
                Backup Management
              </Button>
            </Link>
            <Link href="/super-admin/audit-compliance">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Shield className="h-5 w-5 mr-3" />
                Audit & Compliance
              </Button>
            </Link>
            <Link href="/super-admin/system-configuration">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Settings className="h-5 w-5 mr-3" />
                System Configuration
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-4 gap-1 p-2">
          <Link href="/super-admin">
            <Button variant="ghost" className="flex flex-col h-auto py-2" size="sm">
              <Shield className="h-5 w-5 mb-1" />
              <span className="text-xs">Dashboard</span>
            </Button>
          </Link>
          <Link href="/super-admin/financial-reports">
            <Button variant="ghost" className="flex flex-col h-auto py-2" size="sm">
              <BarChart3 className="h-5 w-5 mb-1" />
              <span className="text-xs">Reports</span>
            </Button>
          </Link>
          <Link href="/super-admin/system-health">
            <Button variant="ghost" className="flex flex-col h-auto py-2" size="sm">
              <Activity className="h-5 w-5 mb-1" />
              <span className="text-xs">Health</span>
            </Button>
          </Link>
          <Link href="/super-admin/system-configuration">
            <Button variant="ghost" className="flex flex-col h-auto py-2" size="sm">
              <Settings className="h-5 w-5 mb-1" />
              <span className="text-xs">Settings</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
