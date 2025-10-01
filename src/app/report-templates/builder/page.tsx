'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText,
  Plus,
  Minus,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  Clock,
  User,
  Users,
  Shield,
  AlertTriangle,
  Edit,
  Trash2,
  Copy,
  Move,
  GripVertical,
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
  Home,
  Settings,
  Bell,
  Menu,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square as SquareIcon3,
  RotateCcw,
  Square as SquareIcon3,
  CheckSquare,
  Crown,
  Trophy,
  Medal,
  Award,
  Activity,
  TrendingUp,
  TrendingDown,
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
  RefreshCw,
  Download,
  Upload,
  Eye,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserCog,
  Zap,
  Brain,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon,
  Lightbulb,
  BookmarkCheck,
  ClipboardCheck,
  FileCheck,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart,
  PieChart,
  LineChart,
  Activity as ActivityIcon,
  Type,
  Hash as HashIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckSquare as CheckSquareIcon,
  Circle,
  Upload as UploadIcon,
  PenTool
} from 'lucide-react'
import { ReportTemplateBuilder } from '@/components/report-templates/report-template-builder'

export default function ReportTemplateBuilderPage() {
  const [activeTab, setActiveTab] = useState('builder')
  const [savedTemplate, setSavedTemplate] = useState<any>(null)

  const handleTemplateSaved = (template: any) => {
    setSavedTemplate(template)
    setActiveTab('success')
  }

  const handleCancel = () => {
    // Navigate back or reset form
    console.log('Builder cancelled')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Report Template Builder</h1>
          <p className="text-muted-foreground">
            Create and customize report templates with field validation
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">Template Builder</TabsTrigger>
          <TabsTrigger value="success">Success</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <ReportTemplateBuilder
            onTemplateSaved={handleTemplateSaved}
            onCancel={handleCancel}
          />
        </TabsContent>

        <TabsContent value="success" className="space-y-4">
          {savedTemplate ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Template Created Successfully
                </CardTitle>
                <CardDescription>
                  Your report template has been created and is ready for use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Template Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Name:</span> {savedTemplate.name}</div>
                      <div><span className="font-medium">Category:</span> {savedTemplate.category}</div>
                      <div><span className="font-medium">Type:</span> {savedTemplate.type}</div>
                      <div><span className="font-medium">Version:</span> {savedTemplate.version}</div>
                      <div><span className="font-medium">Status:</span> {savedTemplate.isActive ? 'Active' : 'Inactive'}</div>
                      <div><span className="font-medium">Visibility:</span> {savedTemplate.isPublic ? 'Public' : 'Private'}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Template Statistics</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Total Fields:</span> {savedTemplate.stats?.totalFields || 0}</div>
                      <div><span className="font-medium">Submissions:</span> {savedTemplate.stats?.totalSubmissions || 0}</div>
                      <div><span className="font-medium">Tags:</span> {savedTemplate.tags?.length || 0}</div>
                      <div><span className="font-medium">Created:</span> {savedTemplate.createdAt ? new Date(savedTemplate.createdAt).toLocaleDateString() : 'Unknown'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-4">
                  <Button onClick={() => setActiveTab('builder')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Another Template
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Template
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Template Created</h3>
                <p className="text-muted-foreground">
                  Create a report template to see the success details here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Template Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Drag-and-drop field builder</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Multiple field types support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Template versioning</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Category and tagging system</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Template sharing and collaboration</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Field Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Comprehensive field validation rules</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Type-specific validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Custom validation patterns</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Required field enforcement</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Conditional field display</span>
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
                    <span>Advanced template settings</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Submission management</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Approval workflows</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Auto-save and draft support</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Progress tracking</span>
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
                Report Template Builder Overview
              </CardTitle>
              <CardDescription>
                Comprehensive report template creation with field validation and customization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Template Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Visual drag-and-drop template builder</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Multiple field types (text, number, date, select, file, signature)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Field validation and customization</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Template categories and tagging</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Real-time preview and testing</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Validation Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Type-specific field validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Custom validation patterns and rules</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Required field enforcement</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Conditional field display logic</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>File upload validation and constraints</span>
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
