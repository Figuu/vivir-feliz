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
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Save,
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
  FileText,
  MessageSquare,
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
  Info,
  AlertTriangle,
  CheckSquare,
  GripVertical,
  Move,
  Copy,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  PieChart,
  LineChart,
  BarChart,
  Eye,
  Users
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TherapistAvailabilityManager } from '@/components/therapist/therapist-availability-manager'
import { useTherapistAvailability } from '@/hooks/use-therapist-availability'

export default function TherapistAvailabilityPage() {
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('')
  const [therapists, setTherapists] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('manager')
  
  const {
    loading,
    error,
    therapist,
    availability,
    sessions,
    dateRange,
    availabilityResult,
    loadAvailabilityData,
    checkAvailability,
    updateAvailability,
    setDateRange,
    setAvailabilityResult,
    clearError,
    formatDate,
    formatTime,
    getStatusColor,
    getStatusIcon,
    getUtilizationPercentage,
    getAvailableSlots,
    getConflictsCount,
    isWorkingDay,
    getWorkingHours,
    getBreakTime,
    canScheduleSession,
    getNextAvailableSlot,
    getAvailabilitySummary
  } = useTherapistAvailability()

  // Load therapists list
  useEffect(() => {
    loadTherapists()
  }, [])

  // Load availability when therapist is selected
  useEffect(() => {
    if (selectedTherapistId) {
      loadAvailabilityData(selectedTherapistId)
    }
  }, [selectedTherapistId, loadAvailabilityData])

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

  const handleAvailabilityUpdate = (updatedAvailability: any[]) => {
    console.log('Availability updated:', updatedAvailability)
  }

  const handleConflictResolve = (conflicts: any[]) => {
    console.log('Conflicts resolved:', conflicts)
  }

  const summary = getAvailabilitySummary()

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Therapist Availability Management</h1>
          <p className="text-muted-foreground">
            Comprehensive availability management with time validation and conflict detection
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => selectedTherapistId && loadAvailabilityData(selectedTherapistId)}>
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
            Choose a therapist to manage their availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Select value={selectedTherapistId} onValueChange={setSelectedTherapistId}>
              <SelectTrigger>
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
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manager">Availability Manager</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="manager" className="space-y-4">
          {selectedTherapistId ? (
            <TherapistAvailabilityManager
              therapistId={selectedTherapistId}
              onAvailabilityUpdate={handleAvailabilityUpdate}
              onConflictResolve={handleConflictResolve}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Therapist Selected</h3>
                <p className="text-muted-foreground">
                  Select a therapist from the dropdown above to manage their availability.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {therapist && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Availability Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Availability Statistics
                  </CardTitle>
                  <CardDescription>
                    Overview of therapist availability and utilization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Working Days</div>
                          <div className="text-sm text-muted-foreground">Days available for sessions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{summary.workingDays}</div>
                        <div className="text-sm text-muted-foreground">of {summary.totalDays} days</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <Users className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Total Sessions</div>
                          <div className="text-sm text-muted-foreground">Scheduled sessions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{summary.totalSessions}</div>
                        <div className="text-sm text-muted-foreground">sessions</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-yellow-100">
                          <Activity className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium">Average Utilization</div>
                          <div className="text-sm text-muted-foreground">Capacity utilization</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{summary.averageUtilization}%</div>
                        <div className="text-sm text-muted-foreground">utilized</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-red-100">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium">Conflicts</div>
                          <div className="text-sm text-muted-foreground">Scheduling conflicts</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{summary.totalConflicts}</div>
                        <div className="text-sm text-muted-foreground">conflicts</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Daily Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Daily Breakdown
                  </CardTitle>
                  <CardDescription>
                    Day-by-day availability and session details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availability.slice(0, 7).map((day) => (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${getStatusColor(day.isWorkingDay, getConflictsCount(day) > 0)}`}>
                            {day.isWorkingDay ? (
                              getConflictsCount(day) > 0 ? (
                                <AlertCircle className="h-4 w-4" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{formatDate(day.date)}</div>
                            <div className="text-sm text-muted-foreground">
                              {day.isWorkingDay ? (
                                `${day.startTime} - ${day.endTime}`
                              ) : (
                                'Not working'
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {day.scheduledSessions}/{day.maxSessions} sessions
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getUtilizationPercentage(day)}% utilized
                          </div>
                        </div>
                      </motion.div>
                    ))}
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
                  Availability Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Real-time availability checking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Time slot validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Working hours management</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Break time configuration</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Conflict Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Session overlap detection</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Working hours validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Break time conflicts</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Capacity limit checking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analytics & Reporting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Utilization tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Availability reports</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Conflict analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Performance metrics</span>
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
                Therapist Availability Management Overview
              </CardTitle>
              <CardDescription>
                Comprehensive availability management with time validation and conflict detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Availability Management Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Real-time availability checking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Time slot validation and conflict detection</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Working hours and break time management</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Dynamic availability updates</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Capacity and session limit management</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Validation & Conflict Detection</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Session overlap detection</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Working hours boundary validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Break time conflict checking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Capacity limit enforcement</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Smart time slot suggestions</span>
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
