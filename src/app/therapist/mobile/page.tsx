'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Smartphone,
  Tablet,
  Monitor,
  Wifi,
  Battery,
  Signal,
  Globe,
  Shield,
  Zap,
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
  Target,
  Activity,
  BarChart3,
  TrendingUp,
  TrendingDown,
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
  Building,
  Key,
  Lock,
  Unlock,
  Database,
  Server,
  Code,
  Calendar,
  Clock,
  Users,
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
  Globe as GlobeIcon2,
  Building as BuildingIcon,
  Shield as ShieldIcon2,
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
import { motion, AnimatePresence } from 'framer-motion'
import { MobileTherapistDashboard } from '@/components/therapist/mobile-therapist-dashboard'
import { MobileSessionManagement } from '@/components/therapist/mobile-session-management'
import { MobilePatientManagement } from '@/components/therapist/mobile-patient-management'

export default function TherapistMobilePage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>('therapist-1')

  const handleTherapistUpdate = (therapist: any) => {
    console.log('Therapist updated:', therapist)
  }

  const handleSessionStart = (sessionId: string) => {
    console.log('Session started:', sessionId)
  }

  const handleSessionComplete = (sessionId: string) => {
    console.log('Session completed:', sessionId)
  }

  const handlePatientSelect = (patient: any) => {
    console.log('Patient selected:', patient)
  }

  const handlePatientUpdate = (patient: any) => {
    console.log('Patient updated:', patient)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mobile Therapist Interfaces</h1>
          <p className="text-muted-foreground">
            Responsive mobile interfaces for therapist management
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

      {/* Device Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Mobile Device Preview
          </CardTitle>
          <CardDescription>
            Responsive design optimized for mobile devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-4 rounded-lg bg-blue-100 w-16 h-16 mx-auto mb-3">
                <Smartphone className="h-8 w-8 text-blue-600 mx-auto" />
              </div>
              <h3 className="font-semibold">Mobile</h3>
              <p className="text-sm text-muted-foreground">320px - 768px</p>
            </div>
            <div className="text-center">
              <div className="p-4 rounded-lg bg-green-100 w-16 h-16 mx-auto mb-3">
                <Tablet className="h-8 w-8 text-green-600 mx-auto" />
              </div>
              <h3 className="font-semibold">Tablet</h3>
              <p className="text-sm text-muted-foreground">768px - 1024px</p>
            </div>
            <div className="text-center">
              <div className="p-4 rounded-lg bg-purple-100 w-16 h-16 mx-auto mb-3">
                <Monitor className="h-8 w-8 text-purple-600 mx-auto" />
              </div>
              <h3 className="font-semibold">Desktop</h3>
              <p className="text-sm text-muted-foreground">1024px+</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="patients">Patients</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-2 text-center text-sm text-muted-foreground">
              Mobile Dashboard Preview
            </div>
            <div className="h-96 overflow-y-auto">
              <MobileTherapistDashboard
                therapistId={selectedTherapistId}
                onSessionStart={handleSessionStart}
                onSessionComplete={handleSessionComplete}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-2 text-center text-sm text-muted-foreground">
              Mobile Session Management Preview
            </div>
            <div className="h-96 overflow-y-auto">
              <MobileSessionManagement
                therapistId={selectedTherapistId}
                onSessionStart={handleSessionStart}
                onSessionComplete={handleSessionComplete}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 p-2 text-center text-sm text-muted-foreground">
              Mobile Patient Management Preview
            </div>
            <div className="h-96 overflow-y-auto">
              <MobilePatientManagement
                therapistId={selectedTherapistId}
                onPatientSelect={handlePatientSelect}
                onPatientUpdate={handlePatientUpdate}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Touch Interactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Touch-friendly buttons and controls</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Swipe gestures for navigation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Pull-to-refresh functionality</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Long-press context menus</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Haptic feedback support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="h-5 w-5 mr-2" />
                  Responsive Design
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Adaptive layouts for all screen sizes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Flexible grid systems</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Scalable typography</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Optimized images and media</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Mobile-first approach</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Optimized loading times</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Lazy loading for images</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Efficient state management</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Minimal bundle sizes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Offline functionality</span>
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
                Mobile Interface Overview
              </CardTitle>
              <CardDescription>
                Comprehensive mobile-responsive interfaces for therapist management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Mobile Dashboard Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Touch-optimized navigation and controls</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Responsive grid layouts and cards</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Mobile-friendly forms and inputs</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Bottom navigation for easy thumb access</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Pull-to-refresh and infinite scroll</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Session Management Features</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Touch-friendly session controls</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Mobile-optimized calendar views</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Swipe gestures for session actions</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Full-screen session timers</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Voice-to-text for session notes</span>
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
