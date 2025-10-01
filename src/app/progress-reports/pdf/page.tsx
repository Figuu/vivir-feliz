'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText,
  Download,
  Settings,
  Calendar,
  User,
  Users,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  RefreshCw,
  Save,
  Upload,
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
  TrendingUp,
  TrendingDown,
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
import { ProgressReportPDFGenerator } from '@/components/progress-reports/progress-report-pdf-generator'

export default function ProgressReportPDFPage() {
  const [activeTab, setActiveTab] = useState('generator')

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progress Report PDF Generator</h1>
          <p className="text-muted-foreground">
            Generate comprehensive progress reports in PDF format with customizable options
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
          <TabsTrigger value="generator">PDF Generator</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-4">
          <ProgressReportPDFGenerator />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  PDF Generation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Professional PDF generation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Multiple report types</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Customizable templates</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Charts and graphs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Professional formatting</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Report Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Summary reports</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Detailed progress reports</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Analytics reports</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Milestone reports</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Risk assessment reports</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Customization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Custom titles and headers</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Flexible content options</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Page orientation settings</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Font size customization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Organization branding</span>
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
                Progress Report PDF Generator Overview
              </CardTitle>
              <CardDescription>
                Comprehensive PDF generation system for patient progress reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">PDF Generation Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Professional PDF generation with jsPDF library</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Multiple report types (summary, detailed, analytics, milestone, progress timeline, risk assessment)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Comprehensive data integration with progress entries, milestones, and analytics</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Professional formatting with tables, headers, footers, and page numbers</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Automatic file naming and download functionality</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Customization & Options</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Flexible content options (charts, progress data, risk assessment, goals, recommendations)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Format customization (page orientation, font size, headers, footers)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Branding options (custom titles, organization name, therapist name, confidentiality notices)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Date range selection and patient/therapist filtering</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Preview functionality and configuration validation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Available Report Types
              </CardTitle>
              <CardDescription>
                Different types of progress reports you can generate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Summary Report</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      A concise overview of patient progress with key metrics and highlights.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Executive summary</li>
                      <li>• Key progress metrics</li>
                      <li>• Risk assessment overview</li>
                      <li>• Goal completion status</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Detailed Report</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Comprehensive progress report with all available data and analysis.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Complete progress entries</li>
                      <li>• Detailed risk assessment</li>
                      <li>• All goals and recommendations</li>
                      <li>• Session details and notes</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Analytics Report</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Data-driven analysis with charts, trends, and statistical insights.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Progress trends and patterns</li>
                      <li>• Statistical analysis</li>
                      <li>• Comparative metrics</li>
                      <li>• Performance indicators</li>
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Milestone Report</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Focus on milestones, achievements, and goal progress tracking.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Milestone achievements</li>
                      <li>• Goal progress tracking</li>
                      <li>• Timeline visualization</li>
                      <li>• Success metrics</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Progress Timeline</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Chronological view of progress over time with timeline visualization.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Chronological progress</li>
                      <li>• Timeline visualization</li>
                      <li>• Progress patterns</li>
                      <li>• Historical analysis</li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Risk Assessment</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Detailed risk analysis and safety planning documentation.
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Risk level analysis</li>
                      <li>• Risk factors tracking</li>
                      <li>• Safety planning</li>
                      <li>• Crisis intervention</li>
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
