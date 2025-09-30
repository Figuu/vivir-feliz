'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar,
  Clock,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Eye,
  Phone,
  Mail,
  MapPin,
  Star,
  Heart,
  Zap,
  Target,
  Activity,
  BarChart3,
  Download,
  Upload,
  Bell,
  Globe,
  Building,
  Shield,
  BookOpen,
  Settings,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square,
  Timer,
  User,
  FileText,
  MessageSquare,
  Video,
  PhoneCall,
  CalendarIcon,
  ClockIcon,
  PieChart,
  LineChart,
  BarChart,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info,
  AlertTriangle,
  CheckSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TherapistDashboard } from '@/components/therapist/therapist-dashboard'
import { useTherapistDashboard } from '@/hooks/use-therapist-dashboard'

export default function TherapistDashboardPage() {
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('')
  const [therapists, setTherapists] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('dashboard')
  
  const { 
    loading, 
    error, 
    dashboardData,
    therapist,
    statistics,
    agenda,
    patients,
    loadDashboard,
    refreshDashboard,
    clearError 
  } = useTherapistDashboard()

  // Load therapists list
  useEffect(() => {
    loadTherapists()
  }, [])

  // Load dashboard when therapist is selected
  useEffect(() => {
    if (selectedTherapistId) {
      loadDashboard({
        therapistId: selectedTherapistId,
        period: 'today',
        includeStats: true,
        includeAgenda: true,
        includePatients: true
      })
    }
  }, [selectedTherapistId, loadDashboard])

  const loadTherapists = async () => {
    try {
      const response = await fetch('/api/therapist/profile?limit=100')
      const result = await response.json()
      if (response.ok) {
        setTherapists(result.data.therapists)
        // Auto-select first therapist if available
        if (result.data.therapists.length > 0) {
          setSelectedTherapistId(result.data.therapists[0].id)
        }
      }
    } catch (err) {
      console.error('Error loading therapists:', err)
    }
  }

  const handleSessionSelect = (session: any) => {
    console.log('Session selected:', session)
    // Handle session selection (e.g., open session details modal)
  }

  const handlePatientSelect = (patient: any) => {
    console.log('Patient selected:', patient)
    // Handle patient selection (e.g., open patient details modal)
  }

  const handleQuickAction = (action: string, data?: any) => {
    console.log('Quick action:', action, data)
    // Handle quick actions (e.g., new session, new patient, etc.)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Therapist Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive dashboard with agenda and patient overview
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={refreshDashboard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Therapist Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Select Therapist
          </CardTitle>
          <CardDescription>
            Choose a therapist to view their dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Select value={selectedTherapistId} onValueChange={setSelectedTherapistId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a therapist" />
              </SelectTrigger>
              <SelectContent>
                {therapists.map((therapist) => (
                  <SelectItem key={therapist.id} value={therapist.id}>
                    {therapist.firstName} {therapist.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {therapist && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{therapist.email}</Badge>
                <div className="flex flex-wrap gap-1">
                  {therapist.specialties.map((specialty: any) => (
                    <Badge key={specialty.id} variant="secondary" className="text-xs">
                      {specialty.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {selectedTherapistId ? (
            <TherapistDashboard
              therapistId={selectedTherapistId}
              onSessionSelect={handleSessionSelect}
              onPatientSelect={handlePatientSelect}
              onQuickAction={handleQuickAction}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Therapist</h3>
                <p className="text-muted-foreground">
                  Choose a therapist from the dropdown above to view their dashboard.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {statistics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Key performance indicators for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <CheckCircle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Completion Rate</div>
                          <div className="text-sm text-muted-foreground">Sessions completed</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{statistics.sessions.completionRate}%</div>
                        <div className="text-sm text-muted-foreground">
                          {statistics.sessions.completed}/{statistics.sessions.total}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <Timer className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Average Duration</div>
                          <div className="text-sm text-muted-foreground">Per session</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{statistics.performance.averageSessionDuration}m</div>
                        <div className="text-sm text-muted-foreground">minutes</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-purple-100">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">New Patients</div>
                          <div className="text-sm text-muted-foreground">This period</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{statistics.patients.new}</div>
                        <div className="text-sm text-muted-foreground">
                          of {statistics.patients.total} total
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Revenue Analytics
                  </CardTitle>
                  <CardDescription>
                    Financial performance and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Total Revenue</div>
                          <div className="text-sm text-muted-foreground">This period</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${statistics.revenue.total}</div>
                        <div className="text-sm text-muted-foreground">revenue</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Average per Session</div>
                          <div className="text-sm text-muted-foreground">Revenue per session</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${statistics.revenue.average}</div>
                        <div className="text-sm text-muted-foreground">per session</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-yellow-100">
                          <Calendar className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium">Upcoming Sessions</div>
                          <div className="text-sm text-muted-foreground">Scheduled</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{statistics.sessions.upcoming}</div>
                        <div className="text-sm text-muted-foreground">sessions</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Dashboard Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Real-time statistics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Daily/weekly/monthly views</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Session agenda management</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Patient overview</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analytics Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Performance metrics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Revenue tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Session completion rates</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Patient growth metrics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Patient Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Patient overview</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Session history</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Quick actions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Contact information</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Feature Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Dashboard Overview
              </CardTitle>
              <CardDescription>
                Comprehensive therapist dashboard with agenda and patient management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Dashboard Components</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Real-time statistics and metrics</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Daily, weekly, and monthly views</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Session agenda with status tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Patient overview and management</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Quick actions and shortcuts</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Key Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Session completion tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Revenue and performance analytics</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Patient session history</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Upcoming session management</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Specialty and certification display</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  )
}
