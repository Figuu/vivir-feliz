'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
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
  Stop,
  RotateCcw,
  Square,
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
  GripVertical
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface ProgressReportPDFGeneratorProps {
  patientId?: string
  therapistId?: string
  onPDFGenerated?: (pdfData: any) => void
}

interface PDFGenerationOptions {
  includeCharts: boolean
  includeProgressData: boolean
  includeRiskAssessment: boolean
  includeGoals: boolean
  includeRecommendations: boolean
  includeSessionDetails: boolean
  includeAnalytics: boolean
  includeTimeline: boolean
  includeMilestones: boolean
  includeValidationStatus: boolean
  includeNotes: boolean
  includeTags: boolean
  pageOrientation: 'portrait' | 'landscape'
  fontSize: number
  includeHeader: boolean
  includeFooter: boolean
  includeTableOfContents: boolean
  includeExecutiveSummary: boolean
}

interface PDFCustomization {
  title?: string
  subtitle?: string
  logoUrl?: string
  organizationName?: string
  therapistName?: string
  patientName?: string
  reportDate?: string
  confidentialityNotice?: string
  footerText?: string
}

export function ProgressReportPDFGenerator({
  patientId,
  therapistId,
  onPDFGenerated
}: ProgressReportPDFGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('configuration')
  
  // Data state
  const [patients, setPatients] = useState<any[]>([])
  const [therapists, setTherapists] = useState<any[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    reportType: 'summary' as 'summary' | 'detailed' | 'analytics' | 'milestone' | 'progress_timeline' | 'risk_assessment',
    patientId: patientId || '',
    therapistId: therapistId || '',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    generatedBy: 'user-1' // This should come from auth context
  })

  const [options, setOptions] = useState<PDFGenerationOptions>({
    includeCharts: true,
    includeProgressData: true,
    includeRiskAssessment: true,
    includeGoals: true,
    includeRecommendations: true,
    includeSessionDetails: false,
    includeAnalytics: true,
    includeTimeline: true,
    includeMilestones: true,
    includeValidationStatus: true,
    includeNotes: true,
    includeTags: false,
    pageOrientation: 'portrait',
    fontSize: 12,
    includeHeader: true,
    includeFooter: true,
    includeTableOfContents: true,
    includeExecutiveSummary: true
  })

  const [customization, setCustomization] = useState<PDFCustomization>({
    title: '',
    subtitle: '',
    organizationName: '',
    therapistName: '',
    patientName: '',
    reportDate: new Date().toISOString().split('T')[0],
    confidentialityNotice: 'This report contains confidential patient information and is intended for authorized personnel only.',
    footerText: ''
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      // Load patients
      const patientsResponse = await fetch('/api/patients?limit=100')
      const patientsResult = await patientsResponse.json()
      if (patientsResponse.ok) {
        setPatients(patientsResult.data.patients || [])
      }

      // Load therapists
      const therapistsResponse = await fetch('/api/therapist?limit=100')
      const therapistsResult = await therapistsResponse.json()
      if (therapistsResponse.ok) {
        setTherapists(therapistsResult.data.therapists || [])
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const handleGeneratePDF = async () => {
    if (!formData.patientId || !formData.startDate || !formData.endDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please fill in all required fields'
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/progress-reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          options,
          customization
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate PDF')
      }

      // Get the PDF blob
      const pdfBlob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'progress-report.pdf'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: 'PDF generated and downloaded successfully'
      })
      
      if (onPDFGenerated) {
        onPDFGenerated({ success: true, filename })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error generating PDF:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOptionChange = (key: keyof PDFGenerationOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const handleCustomizationChange = (key: keyof PDFCustomization, value: string) => {
    setCustomization(prev => ({ ...prev, [key]: value }))
  }

  const getReportTypeDescription = (type: string) => {
    switch (type) {
      case 'summary': return 'A concise overview of patient progress with key metrics'
      case 'detailed': return 'Comprehensive progress report with all available data'
      case 'analytics': return 'Data-driven analysis with charts and trends'
      case 'milestone': return 'Focus on milestones and goal achievements'
      case 'progress_timeline': return 'Chronological view of progress over time'
      case 'risk_assessment': return 'Detailed risk analysis and safety planning'
      default: return ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Progress Report PDF Generator
              </CardTitle>
              <CardDescription>
                Generate comprehensive progress reports in PDF format
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="options">Options</TabsTrigger>
          <TabsTrigger value="customization">Customization</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>
                Configure the basic settings for your progress report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportType">Report Type *</Label>
                  <Select value={formData.reportType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, reportType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary Report</SelectItem>
                      <SelectItem value="detailed">Detailed Report</SelectItem>
                      <SelectItem value="analytics">Analytics Report</SelectItem>
                      <SelectItem value="milestone">Milestone Report</SelectItem>
                      <SelectItem value="progress_timeline">Progress Timeline</SelectItem>
                      <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getReportTypeDescription(formData.reportType)}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="patient">Patient *</Label>
                  <Select value={formData.patientId} onValueChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="therapist">Therapist (Optional)</Label>
                <Select value={formData.therapistId} onValueChange={(value) => setFormData(prev => ({ ...prev, therapistId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapist (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Therapists</SelectItem>
                    {therapists.map((therapist) => (
                      <SelectItem key={therapist.id} value={therapist.id}>
                        {therapist.firstName} {therapist.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    max={formData.endDate}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    min={formData.startDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Options Tab */}
        <TabsContent value="options" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Options</CardTitle>
              <CardDescription>
                Choose what to include in your progress report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Options */}
              <div>
                <h4 className="font-semibold mb-3">Content Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeCharts"
                      checked={options.includeCharts}
                      onCheckedChange={(checked) => handleOptionChange('includeCharts', checked)}
                    />
                    <Label htmlFor="includeCharts">Include Charts and Graphs</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeProgressData"
                      checked={options.includeProgressData}
                      onCheckedChange={(checked) => handleOptionChange('includeProgressData', checked)}
                    />
                    <Label htmlFor="includeProgressData">Include Progress Data</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeRiskAssessment"
                      checked={options.includeRiskAssessment}
                      onCheckedChange={(checked) => handleOptionChange('includeRiskAssessment', checked)}
                    />
                    <Label htmlFor="includeRiskAssessment">Include Risk Assessment</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeGoals"
                      checked={options.includeGoals}
                      onCheckedChange={(checked) => handleOptionChange('includeGoals', checked)}
                    />
                    <Label htmlFor="includeGoals">Include Goals Progress</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeRecommendations"
                      checked={options.includeRecommendations}
                      onCheckedChange={(checked) => handleOptionChange('includeRecommendations', checked)}
                    />
                    <Label htmlFor="includeRecommendations">Include Recommendations</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeSessionDetails"
                      checked={options.includeSessionDetails}
                      onCheckedChange={(checked) => handleOptionChange('includeSessionDetails', checked)}
                    />
                    <Label htmlFor="includeSessionDetails">Include Session Details</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAnalytics"
                      checked={options.includeAnalytics}
                      onCheckedChange={(checked) => handleOptionChange('includeAnalytics', checked)}
                    />
                    <Label htmlFor="includeAnalytics">Include Analytics</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeTimeline"
                      checked={options.includeTimeline}
                      onCheckedChange={(checked) => handleOptionChange('includeTimeline', checked)}
                    />
                    <Label htmlFor="includeTimeline">Include Timeline</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeMilestones"
                      checked={options.includeMilestones}
                      onCheckedChange={(checked) => handleOptionChange('includeMilestones', checked)}
                    />
                    <Label htmlFor="includeMilestones">Include Milestones</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeValidationStatus"
                      checked={options.includeValidationStatus}
                      onCheckedChange={(checked) => handleOptionChange('includeValidationStatus', checked)}
                    />
                    <Label htmlFor="includeValidationStatus">Include Validation Status</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeNotes"
                      checked={options.includeNotes}
                      onCheckedChange={(checked) => handleOptionChange('includeNotes', checked)}
                    />
                    <Label htmlFor="includeNotes">Include Notes</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeTags"
                      checked={options.includeTags}
                      onCheckedChange={(checked) => handleOptionChange('includeTags', checked)}
                    />
                    <Label htmlFor="includeTags">Include Tags</Label>
                  </div>
                </div>
              </div>

              {/* Format Options */}
              <div>
                <h4 className="font-semibold mb-3">Format Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pageOrientation">Page Orientation</Label>
                    <Select value={options.pageOrientation} onValueChange={(value: any) => handleOptionChange('pageOrientation', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="fontSize">Font Size</Label>
                    <Select value={options.fontSize.toString()} onValueChange={(value) => handleOptionChange('fontSize', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="8">8pt</SelectItem>
                        <SelectItem value="10">10pt</SelectItem>
                        <SelectItem value="12">12pt</SelectItem>
                        <SelectItem value="14">14pt</SelectItem>
                        <SelectItem value="16">16pt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Layout Options */}
              <div>
                <h4 className="font-semibold mb-3">Layout Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeHeader"
                      checked={options.includeHeader}
                      onCheckedChange={(checked) => handleOptionChange('includeHeader', checked)}
                    />
                    <Label htmlFor="includeHeader">Include Header</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeFooter"
                      checked={options.includeFooter}
                      onCheckedChange={(checked) => handleOptionChange('includeFooter', checked)}
                    />
                    <Label htmlFor="includeFooter">Include Footer</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeTableOfContents"
                      checked={options.includeTableOfContents}
                      onCheckedChange={(checked) => handleOptionChange('includeTableOfContents', checked)}
                    />
                    <Label htmlFor="includeTableOfContents">Include Table of Contents</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeExecutiveSummary"
                      checked={options.includeExecutiveSummary}
                      onCheckedChange={(checked) => handleOptionChange('includeExecutiveSummary', checked)}
                    />
                    <Label htmlFor="includeExecutiveSummary">Include Executive Summary</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customization Tab */}
        <TabsContent value="customization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Customization</CardTitle>
              <CardDescription>
                Customize the appearance and content of your report
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Custom Title</Label>
                  <Input
                    id="title"
                    value={customization.title || ''}
                    onChange={(e) => handleCustomizationChange('title', e.target.value)}
                    placeholder="Enter custom title"
                    maxLength={200}
                  />
                </div>
                
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    value={customization.subtitle || ''}
                    onChange={(e) => handleCustomizationChange('subtitle', e.target.value)}
                    placeholder="Enter subtitle"
                    maxLength={300}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    value={customization.organizationName || ''}
                    onChange={(e) => handleCustomizationChange('organizationName', e.target.value)}
                    placeholder="Enter organization name"
                    maxLength={100}
                  />
                </div>
                
                <div>
                  <Label htmlFor="therapistName">Therapist Name</Label>
                  <Input
                    id="therapistName"
                    value={customization.therapistName || ''}
                    onChange={(e) => handleCustomizationChange('therapistName', e.target.value)}
                    placeholder="Enter therapist name"
                    maxLength={100}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="confidentialityNotice">Confidentiality Notice</Label>
                <Textarea
                  id="confidentialityNotice"
                  value={customization.confidentialityNotice || ''}
                  onChange={(e) => handleCustomizationChange('confidentialityNotice', e.target.value)}
                  placeholder="Enter confidentiality notice"
                  rows={3}
                  maxLength={500}
                />
              </div>
              
              <div>
                <Label htmlFor="footerText">Footer Text</Label>
                <Input
                  id="footerText"
                  value={customization.footerText || ''}
                  onChange={(e) => handleCustomizationChange('footerText', e.target.value)}
                  placeholder="Enter footer text"
                  maxLength={200}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>
                Review your report configuration before generating
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Report Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Report Type:</span>
                      <span className="font-medium">{formData.reportType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Patient:</span>
                      <span className="font-medium">
                        {patients.find(p => p.id === formData.patientId)?.firstName} {patients.find(p => p.id === formData.patientId)?.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Therapist:</span>
                      <span className="font-medium">
                        {formData.therapistId ? 
                          `${therapists.find(t => t.id === formData.therapistId)?.firstName} ${therapists.find(t => t.id === formData.therapistId)?.lastName}` :
                          'All Therapists'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date Range:</span>
                      <span className="font-medium">
                        {formData.startDate} to {formData.endDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Page Orientation:</span>
                      <span className="font-medium">{options.pageOrientation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Font Size:</span>
                      <span className="font-medium">{options.fontSize}pt</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Included Sections</h4>
                  <div className="space-y-1 text-sm">
                    {options.includeCharts && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>Charts and Graphs</span></div>}
                    {options.includeProgressData && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>Progress Data</span></div>}
                    {options.includeRiskAssessment && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>Risk Assessment</span></div>}
                    {options.includeGoals && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>Goals Progress</span></div>}
                    {options.includeRecommendations && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>Recommendations</span></div>}
                    {options.includeAnalytics && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>Analytics</span></div>}
                    {options.includeMilestones && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>Milestones</span></div>}
                    {options.includeExecutiveSummary && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-600" /><span>Executive Summary</span></div>}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleGeneratePDF} 
                  disabled={loading || !formData.patientId || !formData.startDate || !formData.endDate}
                  className="w-full"
                  size="lg"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {loading ? 'Generating PDF...' : 'Generate and Download PDF'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
