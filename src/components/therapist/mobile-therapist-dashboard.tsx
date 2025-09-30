'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Bell,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Home,
  User,
  BarChart3,
  FileText,
  Phone,
  Mail,
  MapPin,
  Star,
  Heart,
  Zap,
  Activity,
  Target,
  Award,
  CheckCircle,
  AlertCircle,
  Info,
  Eye,
  Edit,
  Save,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Play,
  Pause,
  Stop,
  RotateCcw,
  Copy,
  Move,
  GripVertical,
  Square,
  CheckSquare,
  Crown,
  Trophy,
  Medal,
  Flame,
  Sparkles,
  Globe,
  Building,
  Shield,
  Key,
  Lock,
  Unlock,
  Database,
  Server,
  Code,
  TrendingUp,
  TrendingDown,
  BookOpen,
  MessageSquare as MessageSquareIcon,
  Timer,
  UserCheck,
  UserCog,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Maximize,
  Minimize,
  ExternalLink,
  Link,
  Share,
  Bookmark,
  Flag,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  Percent,
  Hash as HashIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Users as UsersIcon,
  MessageSquare as MessageSquareIcon2,
  Bell as BellIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  X as XIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Plus as PlusIcon,
  Search as SearchIcon,
  Filter as FilterIcon,
  MoreVertical as MoreVerticalIcon,
  Home as HomeIcon,
  User as UserIcon,
  BarChart3 as BarChart3Icon,
  FileText as FileTextIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  Star as StarIcon,
  Heart as HeartIcon,
  Zap as ZapIcon,
  Activity as ActivityIcon,
  Target as TargetIcon,
  Award as AwardIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon,
  Info as InfoIcon,
  Eye as EyeIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Trash2 as Trash2Icon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  RefreshCw as RefreshCwIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  RotateCcw as RotateCcwIcon,
  Copy as CopyIcon,
  Move as MoveIcon,
  GripVertical as GripVerticalIcon,
  Square as SquareIcon,
  CheckSquare as CheckSquareIcon,
  Crown as CrownIcon,
  Trophy as TrophyIcon,
  Medal as MedalIcon,
  Flame as FlameIcon,
  Sparkles as SparklesIcon,
  Globe as GlobeIcon,
  Building as BuildingIcon,
  Shield as ShieldIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Database as DatabaseIcon,
  Server as ServerIcon,
  Code as CodeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BookOpen as BookOpenIcon,
  MessageSquare as MessageSquareIcon3,
  Timer as TimerIcon,
  UserCheck as UserCheckIcon,
  UserCog as UserCogIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  ArrowUp as ArrowUpIcon,
  ArrowDown as ArrowDownIcon,
  Maximize as MaximizeIcon,
  Minimize as MinimizeIcon,
  ExternalLink as ExternalLinkIcon,
  Link as LinkIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  Flag as FlagIcon,
  Tag as TagIcon,
  Hash as HashIcon2,
  AtSign as AtSignIcon,
  DollarSign as DollarSignIcon,
  Percent as PercentIcon
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface MobileTherapistDashboardProps {
  therapistId?: string
  onNavigate?: (route: string) => void
  onSessionStart?: (sessionId: string) => void
  onSessionComplete?: (sessionId: string) => void
}

export function MobileTherapistDashboard({
  therapistId,
  onNavigate,
  onSessionStart,
  onSessionComplete
}: MobileTherapistDashboardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('today')
  const [showSidebar, setShowSidebar] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [todaySessions, setTodaySessions] = useState<any[]>([])
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
  const [recentPatients, setRecentPatients] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [stats, setStats] = useState({
    todaySessions: 0,
    completedSessions: 0,
    totalPatients: 0,
    monthlyRevenue: 0
  })

  // Load dashboard data
  useEffect(() => {
    if (therapistId) {
      loadDashboardData()
    }
  }, [therapistId, currentDate])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load today's sessions
      const todayResponse = await fetch(`/api/sessions?therapistId=${therapistId}&date=${currentDate.toISOString().split('T')[0]}`)
      const todayResult = await todayResponse.json()
      if (todayResponse.ok) {
        setTodaySessions(todayResult.data.sessions || [])
        setStats(prev => ({ ...prev, todaySessions: todayResult.data.sessions?.length || 0 }))
      }

      // Load upcoming sessions
      const upcomingResponse = await fetch(`/api/sessions?therapistId=${therapistId}&status=scheduled&limit=5`)
      const upcomingResult = await upcomingResponse.json()
      if (upcomingResponse.ok) {
        setUpcomingSessions(upcomingResult.data.sessions || [])
      }

      // Load recent patients
      const patientsResponse = await fetch(`/api/patients?therapistId=${therapistId}&limit=5`)
      const patientsResult = await patientsResponse.json()
      if (patientsResponse.ok) {
        setRecentPatients(patientsResult.data.patients || [])
        setStats(prev => ({ ...prev, totalPatients: patientsResult.data.patients?.length || 0 }))
      }

      // Load notifications
      const notificationsResponse = await fetch(`/api/notifications?therapistId=${therapistId}&limit=5`)
      const notificationsResult = await notificationsResponse.json()
      if (notificationsResponse.ok) {
        setNotifications(notificationsResult.data.notifications || [])
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(errorMessage)
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSessionAction = async (sessionId: string, action: 'start' | 'complete') => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/sessions/${sessionId}/${action}`, {
        method: 'POST'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action} session`)
      }

      toast({
        title: "Success",
        description: `Session ${action}ed successfully`
      })
      
      if (action === 'start' && onSessionStart) {
        onSessionStart(sessionId)
      } else if (action === 'complete' && onSessionComplete) {
        onSessionComplete(sessionId)
      }

      loadDashboardData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to ${action} session`
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error(`Error ${action}ing session:`, err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSessionStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'in-progress': return <Play className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <X className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading && !todaySessions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {currentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-40 overflow-y-auto"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(false)}
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <nav className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab('today')
                    setShowSidebar(false)
                  }}
                >
                  <Home className="h-4 w-4 mr-3" />
                  Today
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab('sessions')
                    setShowSidebar(false)
                  }}
                >
                  <Calendar className="h-4 w-4 mr-3" />
                  Sessions
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab('patients')
                    setShowSidebar(false)
                  }}
                >
                  <Users className="h-4 w-4 mr-3" />
                  Patients
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab('analytics')
                    setShowSidebar(false)
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Analytics
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab('messages')
                    setShowSidebar(false)
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-3" />
                  Messages
                </Button>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.todaySessions}</div>
                <div className="text-sm text-muted-foreground">Today's Sessions</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completedSessions}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalPatients}</div>
                <div className="text-sm text-muted-foreground">Total Patients</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-full bg-yellow-100">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">${stats.monthlyRevenue}</div>
                <div className="text-sm text-muted-foreground">Monthly Revenue</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Today's Sessions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Today's Sessions</CardTitle>
            <CardDescription>
              {todaySessions.length} sessions scheduled for today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaySessions.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sessions Today</h3>
                <p className="text-muted-foreground">
                  You have no sessions scheduled for today.
                </p>
              </div>
            ) : (
              todaySessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border rounded-lg bg-white"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-blue-100">
                        {getSessionStatusIcon(session.status)}
                      </div>
                      <div>
                        <div className="font-medium">
                          {session.patient?.firstName} {session.patient?.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatTime(session.scheduledTime)}
                        </div>
                      </div>
                    </div>
                    <Badge className={getSessionStatusColor(session.status)}>
                      {session.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {session.duration} minutes • {session.serviceAssignments?.[0]?.proposalService?.service?.name || 'General Session'}
                    </div>
                    <div className="flex items-center space-x-2">
                      {session.status === 'scheduled' && (
                        <Button
                          size="sm"
                          onClick={() => handleSessionAction(session.id, 'start')}
                          disabled={loading}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {session.status === 'in-progress' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSessionAction(session.id, 'complete')}
                          disabled={loading}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
              <CardDescription>
                Next {upcomingSessions.length} scheduled sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingSessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 border rounded-lg bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-gray-100">
                        <Clock className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {session.patient?.firstName} {session.patient?.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(session.scheduledDate)} at {formatTime(session.scheduledTime)}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="p-2">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Patients */}
        {recentPatients.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Patients</CardTitle>
              <CardDescription>
                Your most recent patient interactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentPatients.map((patient) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 border rounded-lg bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-full bg-green-100">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last session: {patient.lastSessionDate ? formatDate(patient.lastSessionDate) : 'No sessions yet'}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="p-2">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Notifications */}
        {notifications.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>
                Recent updates and reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 border rounded-lg bg-white"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Bell className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{notification.title}</div>
                      <div className="text-xs text-muted-foreground">{notification.message}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(notification.createdAt)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          <Button
            variant={activeTab === 'today' ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
            onClick={() => setActiveTab('today')}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Today</span>
          </Button>
          <Button
            variant={activeTab === 'sessions' ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
            onClick={() => setActiveTab('sessions')}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs">Sessions</span>
          </Button>
          <Button
            variant={activeTab === 'patients' ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
            onClick={() => setActiveTab('patients')}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs">Patients</span>
          </Button>
          <Button
            variant={activeTab === 'messages' ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
            onClick={() => setActiveTab('messages')}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">Messages</span>
          </Button>
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
            onClick={() => setActiveTab('profile')}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
