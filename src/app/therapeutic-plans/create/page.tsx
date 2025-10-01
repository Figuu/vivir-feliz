'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText,
  Target,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Edit,
  Save,
  X,
  Plus,
  Minus,
  Filter,
  Search,
  AlertCircle,
  User,
  Timer,
  Heart,
  Star,
  Flame,
  Sparkles,
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
  Home,
  Bell,
  Menu,
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
  Globe,
  Building,
  Shield,
  Key,
  Lock,
  Unlock,
  Database,
  Server,
  Code,
  Calendar,
  Clock,
  Users,
  User as UserIcon,
  MessageSquare as MessageSquareIcon,
  FileText as FileTextIcon,
  Timer as TimerIcon,
  AlertCircle as AlertCircleIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  X as XIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  Filter as FilterIcon,
  Search as SearchIcon,
  AlertCircle as AlertCircleIcon2,
  User as UserIcon2,
  Timer as TimerIcon2,
  Heart as HeartIcon,
  Star as StarIcon,
  Flame as FlameIcon,
  Sparkles as SparklesIcon,
  Crown as CrownIcon,
  Trophy as TrophyIcon,
  Medal as MedalIcon,
  Award as AwardIcon,
  Target as TargetIcon,
  Activity as ActivityIcon,
  BarChart3 as BarChart3Icon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BookOpen as BookOpenIcon,
  MessageSquare as MessageSquareIcon2,
  Phone as PhoneIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  Square as SquareIcon,
  RotateCcw as RotateCcwIcon,
  Copy as CopyIcon,
  Move as MoveIcon,
  GripVertical as GripVerticalIcon,
  Square as SquareIcon,
  CheckSquare as CheckSquareIcon,
  Home as HomeIcon,
  Bell as BellIcon,
  Menu as MenuIcon,
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
  Hash as HashIcon,
  AtSign as AtSignIcon,
  DollarSign as DollarSignIcon,
  Percent as PercentIcon,
  Globe as GlobeIcon,
  Building as BuildingIcon,
  Shield as ShieldIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Database as DatabaseIcon,
  Server as ServerIcon,
  Code as CodeIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Users as UsersIcon,
  User as UserIcon3,
  MessageSquare as MessageSquareIcon3,
  FileText as FileTextIcon2,
  Timer as TimerIcon2,
  AlertCircle as AlertCircleIcon3,
  Info as InfoIcon2,
  Edit as EditIcon2,
  Save as SaveIcon2,
  X as XIcon2,
  Plus as PlusIcon2,
  Minus as MinusIcon2,
  Filter as FilterIcon2,
  Search as SearchIcon2,
  AlertCircle as AlertCircleIcon4,
  User as UserIcon4,
  Timer as TimerIcon3,
  Heart as HeartIcon2,
  Star as StarIcon2,
  Flame as FlameIcon2,
  Sparkles as SparklesIcon2,
  Crown as CrownIcon2,
  Trophy as TrophyIcon2,
  Medal as MedalIcon2,
  Award as AwardIcon2,
  Target as TargetIcon2,
  Activity as ActivityIcon2,
  BarChart3 as BarChart3Icon2,
  TrendingUp as TrendingUpIcon2,
  TrendingDown as TrendingDownIcon2,
  BookOpen as BookOpenIcon2,
  MessageSquare as MessageSquareIcon4,
  Phone as PhoneIcon2,
  Mail as MailIcon2,
  MapPin as MapPinIcon2,
  ChevronLeft as ChevronLeftIcon2,
  ChevronRight as ChevronRightIcon2,
  Play as PlayIcon2,
  Pause as PauseIcon2,
  Square as SquareIcon2,
  RotateCcw as RotateCcwIcon2,
  Copy as CopyIcon2,
  Move as MoveIcon2,
  GripVertical as GripVerticalIcon2,
  Square as SquareIcon2,
  CheckSquare as CheckSquareIcon2,
  Home as HomeIcon2,
  Bell as BellIcon2,
  Menu as MenuIcon2,
  ChevronDown as ChevronDownIcon2,
  ChevronUp as ChevronUpIcon2,
  ArrowLeft as ArrowLeftIcon2,
  ArrowRight as ArrowRightIcon2,
  ArrowUp as ArrowUpIcon2,
  ArrowDown as ArrowDownIcon2,
  Maximize as MaximizeIcon2,
  Minimize as MinimizeIcon2,
  ExternalLink as ExternalLinkIcon2,
  Link as LinkIcon2,
  Share as ShareIcon2,
  Bookmark as BookmarkIcon2,
  Flag as FlagIcon2,
  Tag as TagIcon2,
  Hash as HashIcon2,
  AtSign as AtSignIcon2,
  DollarSign as DollarSignIcon2,
  Percent as PercentIcon2
} from 'lucide-react'
import { TherapeuticPlanCreationForm } from '@/components/therapeutic-plans/therapeutic-plan-creation-form'

export default function CreateTherapeuticPlanPage() {
  const [activeTab, setActiveTab] = useState('form')
  const [createdPlan, setCreatedPlan] = useState<any>(null)

  const handlePlanCreated = (plan: any) => {
    setCreatedPlan(plan)
    setActiveTab('success')
  }

  const handleCancel = () => {
    // Navigate back or reset form
    console.log('Form cancelled')
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Therapeutic Plan</h1>
          <p className="text-muted-foreground">
            Create a comprehensive therapeutic plan after the first session
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
          <TabsTrigger value="form">Create Plan</TabsTrigger>
          <TabsTrigger value="success">Success</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <TherapeuticPlanCreationForm
            patientId="patient-1"
            therapistId="therapist-1"
            sessionId="session-1"
            onPlanCreated={handlePlanCreated}
            onCancel={handleCancel}
          />
        </TabsContent>

        <TabsContent value="success" className="space-y-4">
          {createdPlan ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Plan Created Successfully
                </CardTitle>
                <CardDescription>
                  Your therapeutic plan has been created and is ready for use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Plan Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Title:</span> {createdPlan.title}</div>
                      <div><span className="font-medium">Patient:</span> {createdPlan.patient?.firstName} {createdPlan.patient?.lastName}</div>
                      <div><span className="font-medium">Therapist:</span> {createdPlan.therapist?.firstName} {createdPlan.therapist?.lastName}</div>
                      <div><span className="font-medium">Duration:</span> {createdPlan.estimatedDuration} weeks</div>
                      <div><span className="font-medium">Frequency:</span> {createdPlan.frequency}</div>
                      <div><span className="font-medium">Status:</span> {createdPlan.status}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Objectives & Metrics</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">Total Objectives:</span> {createdPlan.objectives?.length || 0}</div>
                      <div><span className="font-medium">Total Metrics:</span> {createdPlan.objectives?.reduce((sum: number, obj: any) => sum + (obj.metrics?.length || 0), 0) || 0}</div>
                      <div><span className="font-medium">Next Review:</span> {createdPlan.nextReviewDate ? new Date(createdPlan.nextReviewDate).toLocaleDateString() : 'Not set'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-4">
                  <Button onClick={() => setActiveTab('form')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Another Plan
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    View Plan
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Plan Created</h3>
                <p className="text-muted-foreground">
                  Create a therapeutic plan to see the success details here.
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
                  <Target className="h-5 w-5 mr-2" />
                  Objective Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Multi-category objectives</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Priority-based organization</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Target date tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Progress measurement</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Validation and formatting</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Metrics & Measurement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Multiple metric types</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Numeric range validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Scale-based measurements</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Text length limits</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Frequency tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Validation & Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Comprehensive input validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Text length enforcement</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Numeric range validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Date validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Required field enforcement</span>
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
                Therapeutic Plan Creation Overview
              </CardTitle>
              <CardDescription>
                Comprehensive therapeutic plan creation with validation and measurement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Form Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Multi-step form with validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Objective formatting and categorization</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Metric range validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Text length limits and enforcement</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Risk assessment and safety planning</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Validation Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Real-time form validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Numeric range and scale validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Date and time validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Required field validation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Character limit enforcement</span>
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
