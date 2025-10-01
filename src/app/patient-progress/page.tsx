'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  Plus,
  Minus,
  Save,
  X,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Bell,
  User,
  Users,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
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
  FileText,
  Send,
  Reply,
  Quote,
  Pin,
  Archive,
  Trash2 as Trash2Icon,
  Copy,
  Move,
  GripVertical
} from 'lucide-react'
import { PatientProgressDashboard } from '@/components/patient-progress/patient-progress-dashboard'

export default function PatientProgressPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Progress Dashboard</h1>
          <p className="text-muted-foreground">
            Track and analyze patient progress with comprehensive validation
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
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <PatientProgressDashboard />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Progress Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Comprehensive progress tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Multi-dimensional progress data</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Real-time progress monitoring</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Progress validation and quality control</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Goal tracking and milestone management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analytics & Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Progress analytics and trends</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Risk assessment and analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Performance metrics tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Comparative analysis and benchmarking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Export and reporting capabilities</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Validation System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Comprehensive data validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Multi-level validation rules</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Quality assurance checks</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Validation status tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Error detection and correction</span>
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
                Patient Progress Dashboard Overview
              </CardTitle>
              <CardDescription>
                Comprehensive patient progress tracking with validation and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Progress Tracking Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Multi-dimensional progress tracking (behavioral, emotional, cognitive, social, physical)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Comprehensive progress entry types (session, assessment, evaluation, milestone, observation, measurement)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Goal tracking and milestone management with progress percentages</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Risk assessment and safety planning with crisis intervention tracking</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Treatment recommendations with priority and completion tracking</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Validation & Analytics Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Comprehensive data validation with multi-level validation rules</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Progress analytics with trends, comparisons, and risk analysis</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Validation status tracking (pending, validated, flagged, requires review)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Performance metrics calculation and progress distribution analysis</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Export capabilities and comprehensive reporting features</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
