'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Activity,
  Target,
  Zap,
  PieChart,
  LineChart,
  BarChart,
  RefreshCw,
  Settings,
  Download,
  Upload,
  Bell,
  Eye,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  Filter,
  Search,
  Info,
  AlertCircle,
  User,
  Timer,
  Heart,
  Star,
  Globe,
  Building,
  Shield,
  BookOpen,
  FileText,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square,
  RotateCcw,
  Copy,
  Move,
  GripVertical,
  CheckSquare
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TherapistWorkloadCapacity } from '@/components/therapist/therapist-workload-capacity'
import { useTherapistWorkloadCapacity } from '@/hooks/use-therapist-workload-capacity'

export default function TherapistWorkloadCapacityPage() {
  const [activeTab, setActiveTab] = useState('manager')
  
  const {
    loading,
    error,
    workloadData,
    projections,
    alerts,
    summary,
    therapists,
    selectedTherapistId,
    selectedPeriod,
    loadWorkloadData,
    updateCapacity,
    updateWorkloadAlert,
    loadTherapists,
    setSelectedTherapistId,
    setSelectedPeriod,
    clearError,
    formatDate,
    formatCurrency,
    formatDuration,
    getUtilizationColor,
    getUtilizationBgColor,
    getAlertSeverityColor,
    getWorkloadTrend,
    getCapacityAlerts,
    getUtilizationRate,
    getTotalSessions,
    getTotalHours,
    getTotalRevenue,
    isOverloaded,
    isUnderutilized,
    getCapacityUtilization,
    getWorkloadSummary
  } = useTherapistWorkloadCapacity()

  // Load therapists list
  useEffect(() => {
    loadTherapists()
  }, [loadTherapists])

  // Load workload data when therapist is selected
  useEffect(() => {
    if (selectedTherapistId) {
      loadWorkloadData(selectedTherapistId)
    }
  }, [selectedTherapistId, loadWorkloadData])

  const handleWorkloadUpdate = (updatedWorkload: any[]) => {
    console.log('Workload updated:', updatedWorkload)
  }

  const handleCapacityUpdate = (updatedCapacity: any) => {
    console.log('Capacity updated:', updatedCapacity)
  }

  const workloadSummary = getWorkloadSummary()

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Therapist Workload & Capacity Tracking</h1>
          <p className="text-muted-foreground">
            Comprehensive workload monitoring and capacity management system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => loadWorkloadData()}>
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
            Choose a therapist to manage their workload and capacity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <select
              value={selectedTherapistId}
              onChange={(e) => setSelectedTherapistId(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All Therapists</option>
              {therapists.map((therapist) => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.firstName} {therapist.lastName}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manager">Workload Manager</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="manager" className="space-y-4">
          {selectedTherapistId ? (
            <TherapistWorkloadCapacity
              therapistId={selectedTherapistId}
              onWorkloadUpdate={handleWorkloadUpdate}
              onCapacityUpdate={handleCapacityUpdate}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Therapist Selected</h3>
                <p className="text-muted-foreground">
                  Select a therapist from the dropdown above to manage their workload and capacity.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {workloadData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Workload Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Workload Analytics
                  </CardTitle>
                  <CardDescription>
                    Comprehensive workload analysis and trends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Total Therapists</div>
                          <div className="text-sm text-muted-foreground">Active therapists</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{workloadSummary.totalTherapists}</div>
                        <div className="text-sm text-muted-foreground">therapists</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Total Sessions</div>
                          <div className="text-sm text-muted-foreground">All sessions</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{workloadSummary.totalSessions}</div>
                        <div className="text-sm text-muted-foreground">sessions</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-yellow-100">
                          <Clock className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium">Total Hours</div>
                          <div className="text-sm text-muted-foreground">All hours</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{workloadSummary.totalHours.toFixed(1)}h</div>
                        <div className="text-sm text-muted-foreground">hours</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-purple-100">
                          <DollarSign className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">Total Revenue</div>
                          <div className="text-sm text-muted-foreground">All revenue</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{formatCurrency(workloadSummary.totalRevenue)}</div>
                        <div className="text-sm text-muted-foreground">revenue</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Capacity Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Capacity Status
                  </CardTitle>
                  <CardDescription>
                    Current capacity utilization and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-red-100">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium">Overloaded Therapists</div>
                          <div className="text-sm text-muted-foreground">High utilization</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">{workloadSummary.overloadedTherapists}</div>
                        <div className="text-sm text-muted-foreground">therapists</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-blue-100">
                          <TrendingDown className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">Underutilized Therapists</div>
                          <div className="text-sm text-muted-foreground">Low utilization</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{workloadSummary.underutilizedTherapists}</div>
                        <div className="text-sm text-muted-foreground">therapists</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <Target className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">Average Utilization</div>
                          <div className="text-sm text-muted-foreground">Overall capacity</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{workloadSummary.averageUtilization}%</div>
                        <div className="text-sm text-muted-foreground">utilization</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-yellow-100">
                          <Bell className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium">Active Alerts</div>
                          <div className="text-sm text-muted-foreground">Capacity alerts</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-600">{alerts.length}</div>
                        <div className="text-sm text-muted-foreground">alerts</div>
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
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Workload Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Real-time workload monitoring</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Session and hour tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Revenue and performance metrics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Utilization rate calculation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Capacity Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Capacity limit configuration</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Workload balancing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Capacity utilization tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Performance optimization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Alerts & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Capacity alerts and notifications</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Workload trend analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Performance projections</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Capacity planning tools</span>
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
                Therapist Workload & Capacity Tracking Overview
              </CardTitle>
              <CardDescription>
                Comprehensive workload monitoring and capacity management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Workload Tracking Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Real-time workload monitoring</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Session and hour tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Revenue and performance metrics</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Utilization rate calculation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Workload trend analysis</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Capacity Management Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Capacity limit configuration</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Workload balancing and optimization</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Capacity utilization tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Performance projections and planning</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Capacity alerts and notifications</span>
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
