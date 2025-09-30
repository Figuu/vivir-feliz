'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Calendar,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Menu,
  X,
  Home,
  CreditCard,
  BarChart
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { toast } from 'sonner'

interface MobileParentDashboardProps {
  patientId: string
  parentId: string
}

interface DashboardData {
  patient: {
    firstName: string
    lastName: string
    age: number
    profileImage?: string
  }
  stats: {
    completedSessions: number
    upcomingSessions: number
    totalReports: number
    pendingPayments: number
    lastSessionDate: string
    nextSessionDate: string
  }
  recentActivity: Array<{
    id: string
    type: string
    title: string
    description: string
    date: string
    icon: string
  }>
}

export function MobileParentDashboard({ patientId, parentId }: MobileParentDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [patientId])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Mock data - in real app, this would be an API call
      const mockData: DashboardData = {
        patient: {
          firstName: 'Emma',
          lastName: 'Johnson',
          age: 8
        },
        stats: {
          completedSessions: 12,
          upcomingSessions: 3,
          totalReports: 2,
          pendingPayments: 1,
          lastSessionDate: '2025-09-28',
          nextSessionDate: '2025-10-05'
        },
        recentActivity: [
          {
            id: '1',
            type: 'session',
            title: 'Session Completed',
            description: 'Speech Therapy session with Dr. Smith',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            icon: 'check'
          },
          {
            id: '2',
            type: 'report',
            title: 'New Report Available',
            description: 'Progress Report #2 has been approved',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            icon: 'file'
          },
          {
            id: '3',
            type: 'payment',
            title: 'Payment Received',
            description: 'Payment for September processed',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            icon: 'dollar'
          }
        ]
      }

      setData(mockData)
    } catch (err) {
      console.error('Error loading dashboard:', err)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'check': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'file': return <FileText className="h-5 w-5 text-blue-500" />
      case 'dollar': return <DollarSign className="h-5 w-5 text-purple-500" />
      default: return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-primary text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">{data.patient.firstName}'s Portal</h1>
              <p className="text-xs text-white/80">Parent Dashboard</p>
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
              <Link href="/parent-portal/dashboard" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                  <Home className="h-5 w-5" />
                  <span className="font-medium">Dashboard</span>
                </div>
              </Link>
              <Link href="/parent-portal/sessions" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Sessions</span>
                </div>
              </Link>
              <Link href="/parent-portal/progress" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                  <BarChart className="h-5 w-5" />
                  <span className="font-medium">Progress</span>
                </div>
              </Link>
              <Link href="/parent-portal/payments" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                  <CreditCard className="h-5 w-5" />
                  <span className="font-medium">Payments</span>
                </div>
              </Link>
              <Link href="/parent-portal/reports" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                  <FileText className="h-5 w-5" />
                  <span className="font-medium">Reports</span>
                </div>
              </Link>
              <Link href="/parent-portal/session-comments" onClick={() => setMenuOpen(false)}>
                <div className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg">
                  <MessageSquare className="h-5 w-5" />
                  <span className="font-medium">Comments</span>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="p-4 space-y-4 pb-24">
        {/* Patient Info Card */}
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{data.patient.firstName} {data.patient.lastName}</h2>
                <p className="text-sm text-muted-foreground">{data.patient.age} years old</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{data.stats.completedSessions}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{data.stats.upcomingSessions}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <FileText className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{data.stats.totalReports}</p>
                <p className="text-xs text-muted-foreground">Reports</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="pt-6 text-center">
                <DollarSign className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-bold">{data.stats.pendingPayments}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Next Session Card */}
        {data.stats.nextSessionDate && (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">Next Session</p>
                  <p className="text-lg font-bold text-blue-950">
                    {new Date(data.stats.nextSessionDate).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {Math.ceil((new Date(data.stats.nextSessionDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days from now
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/parent-portal/reschedule">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Calendar className="h-5 w-5 mr-3" />
                Request Reschedule
              </Button>
            </Link>
            <Link href="/parent-portal/payments">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <DollarSign className="h-5 w-5 mr-3" />
                View Payments
              </Button>
            </Link>
            <Link href="/parent-portal/session-comments">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <MessageSquare className="h-5 w-5 mr-3" />
                Session Comments
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(activity.date)}
                  </p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="grid grid-cols-5 gap-1 p-2">
          <Link href="/parent-portal/dashboard">
            <Button variant="ghost" className="flex flex-col h-auto py-2" size="sm">
              <Home className="h-5 w-5 mb-1" />
              <span className="text-xs">Home</span>
            </Button>
          </Link>
          <Link href="/parent-portal/sessions">
            <Button variant="ghost" className="flex flex-col h-auto py-2" size="sm">
              <Calendar className="h-5 w-5 mb-1" />
              <span className="text-xs">Sessions</span>
            </Button>
          </Link>
          <Link href="/parent-portal/progress">
            <Button variant="ghost" className="flex flex-col h-auto py-2" size="sm">
              <TrendingUp className="h-5 w-5 mb-1" />
              <span className="text-xs">Progress</span>
            </Button>
          </Link>
          <Link href="/parent-portal/reports">
            <Button variant="ghost" className="flex flex-col h-auto py-2" size="sm">
              <FileText className="h-5 w-5 mb-1" />
              <span className="text-xs">Reports</span>
            </Button>
          </Link>
          <Link href="/parent-portal/payments">
            <Button variant="ghost" className="flex flex-col h-auto py-2" size="sm">
              <CreditCard className="h-5 w-5 mb-1" />
              <span className="text-xs">Pay</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
