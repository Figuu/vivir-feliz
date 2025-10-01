'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  PieChart,
  LineChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  Download,
  Settings,
  Plus,
  Minus,
  Edit,
  Trash2,
  X,
  Check,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
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
  Home,
  Menu,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckSquare,
  Crown,
  Trophy,
  Medal,
  Award,
  BookOpen,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Star,
  Heart,
  Flame,
  Sparkles,
  Globe,
  Building,
  Key,
  Lock,
  Unlock,
  Database,
  Server,
  Code,
  Timer,
  Zap,
  Brain,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  Lightbulb,
  BookmarkCheck,
  ClipboardCheck,
  FileCheck,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity as ActivityIcon,
  Type,
  Hash as HashIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckSquare as CheckSquareIcon,
  Circle,
  Upload as UploadIcon,
  PenTool,
  Send,
  Reply,
  Quote,
  Pin,
  Archive,
  Trash2 as Trash2Icon,
  Copy,
  Move,
  GripVertical,
  Info
} from 'lucide-react'
import { ProgressAnalyticsDashboard } from '@/components/progress-analytics/progress-analytics-dashboard'

export default function ProgressAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progress Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for patient progress tracking
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">Analytics Dashboard</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <ProgressAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analytics Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Overview analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Trend analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Comparative analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Predictive analytics</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Performance metrics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Analysis Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Risk analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Goal analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Therapist performance</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Statistical significance</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Correlation analysis</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Insights & Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Automated insights</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Trend predictions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Benchmark comparisons</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Export capabilities</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Custom reporting</span>
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
                Progress Analytics & Insights Overview
              </CardTitle>
              <CardDescription>
                Comprehensive analytics system for patient progress tracking and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Analytics Capabilities</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Multiple analytics types (overview, trends, comparative, predictive, performance, risk, goal, therapist)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Flexible grouping options (day, week, month, quarter, year)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Advanced filtering and comparison options</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Statistical significance testing and confidence intervals</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Predictive analytics with trend forecasting</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Insights & Visualization</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Automated insight generation with actionable recommendations</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Comprehensive data visualization with charts and graphs</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Distribution analysis and trend visualization</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Risk analysis and safety planning insights</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Export capabilities for reports and data analysis</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Available Analytics Types
              </CardTitle>
              <CardDescription>
                Different types of analytics and insights you can generate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Overview Analytics</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Comprehensive overview of patient progress with key metrics and distributions.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Key performance indicators</li>
                      <li>• Progress distributions</li>
                      <li>• Comparison analysis</li>
                      <li>• Automated insights</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Trend Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Analyze progress trends over time with flexible grouping options.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Time-based trend analysis</li>
                      <li>• Progress pattern recognition</li>
                      <li>• Trend strength and direction</li>
                      <li>• Historical comparisons</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Comparative Analytics</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Compare progress across different time periods and conditions.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Period-to-period comparisons</li>
                      <li>• Statistical significance testing</li>
                      <li>• Percentage change analysis</li>
                      <li>• Benchmark comparisons</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Predictive Analytics</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Forecast future progress trends and outcomes using statistical models.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Progress trend forecasting</li>
                      <li>• Risk prediction models</li>
                      <li>• Goal completion predictions</li>
                      <li>• Confidence intervals</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Performance Analytics</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Analyze performance metrics and efficiency indicators.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Efficiency metrics</li>
                      <li>• Quality indicators</li>
                      <li>• Consistency analysis</li>
                      <li>• Improvement tracking</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Risk Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Comprehensive risk assessment and safety planning analysis.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Risk level distribution</li>
                      <li>• Risk factor analysis</li>
                      <li>• Intervention tracking</li>
                      <li>• Safety planning insights</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Goal Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Analyze goal progress, completion rates, and achievement patterns.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Goal completion tracking</li>
                      <li>• Progress timeline analysis</li>
                      <li>• Goal category insights</li>
                      <li>• Achievement patterns</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Therapist Performance</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Analyze therapist effectiveness and performance metrics.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Therapist effectiveness metrics</li>
                      <li>• Patient outcome comparisons</li>
                      <li>• Performance benchmarking</li>
                      <li>• Improvement recommendations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
