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
  Stop,
  RotateCcw,
  Copy,
  Move,
  GripVertical,
  Square,
  CheckSquare,
  Award,
  Trophy,
  Medal,
  Crown,
  Flame,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TherapistPerformanceAnalytics } from '@/components/therapist/therapist-performance-analytics'
import { useTherapistPerformanceAnalytics } from '@/hooks/use-therapist-performance-analytics'

export default function TherapistPerformanceAnalyticsPage() {
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('')
  const [activeTab, setActiveTab] = useState('manager')
  
  const {
    loading,
    error,
    performanceData,
    comparisons,
    trends,
    summary,
    therapists,
    selectedTherapistId: hookSelectedTherapistId,
    selectedPeriod,
    loadPerformanceData,
    createPerformanceGoal,
    loadTherapists,
    setSelectedTherapistId,
    setSelectedPeriod,
    clearError,
    formatDate,
    formatCurrency,
    formatDuration,
    getPerformanceColor,
    getPerformanceBgColor,
    getPerformanceIcon,
    getRankIcon,
    getPerformanceTrend,
    getSpecialtyPerformance,
    getProductivityScore,
    getQualityScore,
    getCompletionRate,
    getTotalSessions,
    getTotalRevenue,
    getTotalHours,
    getAverageSatisfaction,
    isTopPerformer,
    getPerformanceRank,
    getPerformanceSummary
  } = useTherapistPerformanceAnalytics()

  // Load therapists list
  useEffect(() => {
    loadTherapists()
  }, [loadTherapists])

  // Load performance data when therapist is selected
  useEffect(() => {
    if (selectedTherapistId) {
      loadPerformanceData(selectedTherapistId)
    }
  }, [selectedTherapistId, loadPerformanceData])

  const handlePerformanceUpdate = (updatedPerformance: any[]) => {
    console.log('Performance updated:', updatedPerformance)
  }

  const handleGoalUpdate = (updatedGoals: any) => {
    console.log('Goals updated:', updatedGoals)
  }

  const performanceSummary = getPerformanceSummary()

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Therapist Performance Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive performance tracking, analytics, and goal management system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => loadPerformanceData()}>
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
            Choose a therapist to view their performance analytics
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
          <TabsTrigger value="manager">Performance Manager</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="manager" className="space-y-4">
          {selectedTherapistId ? (
            <TherapistPerformanceAnalytics
              therapistId={selectedTherapistId}
              onPerformanceUpdate={handlePerformanceUpdate}
              onGoalUpdate={handleGoalUpdate}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Therapist Selected</h3>
                <p className="text-muted-foreground">
                  Select a therapist from the dropdown above to view their performance analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {performanceData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Performance Analytics
                  </CardTitle>
                  <CardDescription>
                    Comprehensive performance analysis and insights
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
                        <div className="text-2xl font-bold">{performanceSummary.totalTherapists}</div>
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
                        <div className="text-2xl font-bold">{performanceSummary.totalSessions}</div>
                        <div className="text-sm text-muted-foreground">sessions</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-yellow-100">
                          <DollarSign className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <div className="font-medium">Total Revenue</div>
                          <div className="text-sm text-muted-foreground">All revenue</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{formatCurrency(performanceSummary.totalRevenue)}</div>
                        <div className="text-sm text-muted-foreground">revenue</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-purple-100">
                          <Zap className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium">Average Productivity</div>
                          <div className="text-sm text-muted-foreground">Overall productivity</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{performanceSummary.averageProductivity}%</div>
                        <div className="text-sm text-muted-foreground">productivity</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Leaders */}
              {comparisons && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2" />
                      Performance Leaders
                    </CardTitle>
                    <CardDescription>
                      Top performing therapists by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium mb-2">Productivity Champions</div>
                        <div className="space-y-2">
                          {comparisons.topPerformers.productivity.slice(0, 3).map((therapist, index) => (
                            <div key={therapist.therapist.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                              <div className="flex items-center space-x-2">
                                {index === 0 && <Crown className="h-4 w-4 text-yellow-600" />}
                                {index === 1 && <Trophy className="h-4 w-4 text-gray-600" />}
                                {index === 2 && <Medal className="h-4 w-4 text-orange-600" />}
                                <span className="text-sm font-medium">
                                  {therapist.therapist.firstName} {therapist.therapist.lastName}
                                </span>
                              </div>
                              <Badge className="bg-green-100 text-green-800">
                                {Math.round(therapist.productivityScore)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Quality Champions</div>
                        <div className="space-y-2">
                          {comparisons.topPerformers.quality.slice(0, 3).map((therapist, index) => (
                            <div key={therapist.therapist.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                              <div className="flex items-center space-x-2">
                                {index === 0 && <Crown className="h-4 w-4 text-yellow-600" />}
                                {index === 1 && <Trophy className="h-4 w-4 text-gray-600" />}
                                {index === 2 && <Medal className="h-4 w-4 text-orange-600" />}
                                <span className="text-sm font-medium">
                                  {therapist.therapist.firstName} {therapist.therapist.lastName}
                                </span>
                              </div>
                              <Badge className="bg-blue-100 text-blue-800">
                                {Math.round(therapist.qualityScore)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Revenue Leaders</div>
                        <div className="space-y-2">
                          {comparisons.topPerformers.revenue.slice(0, 3).map((therapist, index) => (
                            <div key={therapist.therapist.id} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                              <div className="flex items-center space-x-2">
                                {index === 0 && <Crown className="h-4 w-4 text-yellow-600" />}
                                {index === 1 && <Trophy className="h-4 w-4 text-gray-600" />}
                                {index === 2 && <Medal className="h-4 w-4 text-orange-600" />}
                                <span className="text-sm font-medium">
                                  {therapist.therapist.firstName} {therapist.therapist.lastName}
                                </span>
                              </div>
                              <Badge className="bg-purple-100 text-purple-800">
                                {formatCurrency(therapist.totalRevenue)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Performance Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Productivity score calculation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Quality score assessment</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Session completion tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Revenue and efficiency metrics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Goal Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Performance goal setting</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Progress tracking and monitoring</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Goal achievement analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Performance improvement planning</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Analytics & Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Performance comparisons</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Trend analysis and forecasting</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Specialty performance tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Performance reporting and dashboards</span>
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
                Therapist Performance Analytics Overview
              </CardTitle>
              <CardDescription>
                Comprehensive performance tracking, analytics, and goal management system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Performance Tracking Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Productivity score calculation and tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Quality score assessment and monitoring</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Session completion rate tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Revenue and efficiency metrics</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Patient satisfaction tracking</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Analytics & Insights Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Performance comparisons and rankings</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Trend analysis and forecasting</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Specialty performance tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Goal setting and progress tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Performance reporting and dashboards</span>
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
