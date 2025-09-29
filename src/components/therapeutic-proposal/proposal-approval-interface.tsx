'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Edit, 
  Save, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Users,
  User,
  Calendar,
  Clock,
  DollarSign,
  Package,
  Tag,
  Settings,
  Plus,
  Minus,
  Copy,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Star,
  Award,
  Target,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Calculator,
  BookOpen,
  Lightbulb,
  Zap,
  Shield,
  UserCheck,
  UserPlus,
  UserMinus,
  UserX,
  GraduationCap,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Globe,
  Heart,
  Brain,
  Baby,
  Coffee,
  Sun,
  Moon,
  Home,
  Work,
  School,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  ExternalLink,
  Lock,
  Unlock,
  EyeOff,
  EyeOn,
  Pencil,
  Trash2,
  Archive,
  Flag,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  FileCheck,
  FileX,
  FileEdit,
  FileSearch,
  FileBarChart,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileJson,
  FilePdf,
  FileWord,
  FileExcel,
  FilePowerpoint,
  FileArchive,
  FileMinus,
  FilePlus,
  FileSlash,
  FileSymlink,
  FileType,
  FileUp,
  FileDown,
  FileClock,
  FileHeart,
  FileWarning,
  FileQuestion,
  FileInfo,
  FileLock,
  FileUnlock,
  FileShield,
  FileKey,
  FileUser,
  FileUsers,
  FileSettings,
  FileCog,
  FileGear,
  FileWrench,
  FileHammer,
  FileTool,
  FileWrench2,
  FileScrewdriver,
  FileNut,
  FileBolt,
  FileRuler,
  Crown,
  Gavel,
  Scale,
  Building,
  Building2,
  Banknote,
  CreditCard,
  Receipt,
  Wallet,
  Coins,
  PiggyBank,
  TrendingDown,
  Percent,
  Hash,
  MinusCircle,
  PlusCircle,
  XCircle,
  CheckCircle2,
  AlertCircle2,
  InfoIcon,
  HelpCircle2,
  Clock2,
  Timer,
  TimerIcon,
  Stopwatch,
  Calendar2,
  Calendar3,
  Calendar4,
  Calendar5,
  Calendar6,
  Calendar7,
  Calendar8,
  Calendar9,
  Calendar10,
  Calendar11,
  Calendar12,
  Calendar13,
  Calendar14,
  Calendar15,
  Calendar16,
  Calendar17,
  Calendar18,
  Calendar19,
  Calendar20,
  Calendar21,
  Calendar22,
  Calendar23,
  Calendar24,
  Calendar25,
  Calendar26,
  Calendar27,
  Calendar28,
  Calendar29,
  Calendar30,
  Calendar31,
  Calendar32,
  Calendar33,
  Calendar34,
  Calendar35,
  Calendar36,
  Calendar37,
  Calendar38,
  Calendar39,
  Calendar40,
  Calendar41,
  Calendar42,
  Calendar43,
  Calendar44,
  Calendar45,
  Calendar46,
  Calendar47,
  Calendar48,
  Calendar49,
  Calendar50,
  Calendar51,
  Calendar52,
  Calendar53,
  Calendar54,
  Calendar55,
  Calendar56,
  Calendar57,
  Calendar58,
  Calendar59,
  Calendar60,
  Calendar61,
  Calendar62,
  Calendar63,
  Calendar64,
  Calendar65,
  Calendar66,
  Calendar67,
  Calendar68,
  Calendar69,
  Calendar70,
  Calendar71,
  Calendar72,
  Calendar73,
  Calendar74,
  Calendar75,
  Calendar76,
  Calendar77,
  Calendar78,
  Calendar79,
  Calendar80,
  Calendar81,
  Calendar82,
  Calendar83,
  Calendar84,
  Calendar85,
  Calendar86,
  Calendar87,
  Calendar88,
  Calendar89,
  Calendar90,
  Calendar91,
  Calendar92,
  Calendar93,
  Calendar94,
  Calendar95,
  Calendar96,
  Calendar97,
  Calendar98,
  Calendar99,
  Calendar100
} from 'lucide-react'

interface Service {
  id: string
  code: string
  name: string
  description: string
  categoryId: string
  category: {
    id: string
    name: string
    color: string
    icon: string
  }
  type: 'EVALUATION' | 'TREATMENT' | 'CONSULTATION' | 'FOLLOW_UP' | 'ASSESSMENT'
  duration: number
  price: number
  currency: string
  isActive: boolean
  requiresApproval: boolean
  maxSessions?: number
  minSessions?: number
  ageRange?: {
    min: number
    max: number
  }
  prerequisites?: string[]
  outcomes?: string[]
  tags: string[]
}

interface Therapist {
  id: string
  name: string
  email: string
  phone?: string
  role: 'THERAPIST' | 'COORDINATOR' | 'ADMIN'
  specialties: string[]
  certifications: string[]
  experience: number
  education: string[]
  languages: string[]
  availability: {
    days: string[]
    hours: {
      start: string
      end: string
    }
    timezone: string
  }
  location: {
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  preferences: {
    maxPatientsPerDay: number
    preferredAgeGroups: string[]
    preferredServiceTypes: string[]
    workingHours: {
      start: string
      end: string
    }
  }
  performance: {
    averageRating: number
    totalPatients: number
    completionRate: number
    patientSatisfaction: number
  }
  isActive: boolean
  isAvailable: boolean
  currentWorkload: number
  maxWorkload: number
  createdAt: string
  updatedAt: string
}

interface Proposal {
  id: string
  patientId: string
  therapistId?: string
  therapist?: Therapist
  selectedServices: {
    service: Service
    sessionCount: number
    notes: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
  }[]
  totalSessions: number
  estimatedDuration: number
  estimatedCost: number
  currency: string
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  notes: string
  goals: string[]
  expectedOutcomes: string[]
  followUpRequired: boolean
  followUpNotes?: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  coordinatorNotes?: string
  pricingNotes?: string
  approvalNotes?: string
  adminNotes?: string
  finalApprovalNotes?: string
  budgetApproval?: boolean
  insuranceCoverage?: {
    covered: boolean
    percentage: number
    notes: string
  }
  paymentTerms?: {
    method: 'INSURANCE' | 'SELF_PAY' | 'MIXED'
    installments: number
    notes: string
  }
}

interface FinancialAnalysis {
  totalCost: number
  costPerSession: number
  costPerHour: number
  serviceBreakdown: {
    serviceId: string
    serviceName: string
    cost: number
    percentage: number
  }[]
  budgetImpact: {
    monthly: number
    quarterly: number
    yearly: number
  }
  costComparison: {
    average: number
    median: number
    range: {
      min: number
      max: number
    }
  }
  recommendations: string[]
}

interface ProposalApprovalInterfaceProps {
  proposal: Proposal
  services?: Service[]
  therapists?: Therapist[]
  financialAnalysis?: FinancialAnalysis
  onApprove?: (proposal: Proposal) => void
  onReject?: (proposal: Proposal) => void
  onRequestChanges?: (proposal: Proposal) => void
  onSave?: (proposal: Proposal) => void
  onCancel?: () => void
  isEditing?: boolean
}

export function ProposalApprovalInterface({
  proposal,
  services = [],
  therapists = [],
  financialAnalysis,
  onApprove,
  onReject,
  onRequestChanges,
  onSave,
  onCancel,
  isEditing = false
}: ProposalApprovalInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'analysis' | 'approval' | 'notes'>('overview')
  const [editedProposal, setEditedProposal] = useState<Proposal>(proposal)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)

  // Update edited proposal when proposal prop changes
  useEffect(() => {
    setEditedProposal(proposal)
    setIsDirty(false)
  }, [proposal])

  // Handle field changes
  const handleFieldChange = (field: string, value: any) => {
    setEditedProposal(prev => ({
      ...prev,
      [field]: value
    }))
    setIsDirty(true)
  }

  // Calculate financial metrics
  const calculateFinancialMetrics = () => {
    const totalCost = editedProposal.selectedServices.reduce((sum, service) => {
      return sum + (service.service.price * service.sessionCount)
    }, 0)

    const totalSessions = editedProposal.selectedServices.reduce((sum, service) => {
      return sum + service.sessionCount
    }, 0)

    const totalDuration = editedProposal.selectedServices.reduce((sum, service) => {
      return sum + (service.service.duration * service.sessionCount)
    }, 0)

    const costPerSession = totalSessions > 0 ? totalCost / totalSessions : 0
    const costPerHour = totalDuration > 0 ? (totalCost / (totalDuration / 60)) : 0

    const serviceBreakdown = editedProposal.selectedServices.map(service => ({
      serviceId: service.service.id,
      serviceName: service.service.name,
      cost: service.service.price * service.sessionCount,
      percentage: totalCost > 0 ? ((service.service.price * service.sessionCount) / totalCost) * 100 : 0
    }))

    return {
      totalCost,
      costPerSession,
      costPerHour,
      totalSessions,
      totalDuration,
      serviceBreakdown
    }
  }

  // Validate proposal for approval
  const validateProposalForApproval = (): string[] => {
    const errors: string[] = []

    if (!editedProposal.notes.trim()) {
      errors.push('Las notas de la propuesta son requeridas')
    }

    if (editedProposal.goals.length === 0) {
      errors.push('Al menos un objetivo debe ser especificado')
    }

    if (editedProposal.expectedOutcomes.length === 0) {
      errors.push('Al menos un resultado esperado debe ser especificado')
    }

    if (editedProposal.selectedServices.length === 0) {
      errors.push('Al menos un servicio debe ser seleccionado')
    }

    if (!editedProposal.therapistId) {
      errors.push('Un terapeuta debe ser asignado')
    }

    if (!editedProposal.budgetApproval) {
      errors.push('La aprobación presupuestaria es requerida')
    }

    if (!editedProposal.finalApprovalNotes?.trim()) {
      errors.push('Las notas de aprobación final son requeridas')
    }

    return errors
  }

  // Handle approve
  const handleApprove = () => {
    const errors = validateProposalForApproval()
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    if (onApprove) {
      onApprove(editedProposal)
    }
  }

  // Handle reject
  const handleReject = () => {
    if (onReject) {
      onReject(editedProposal)
    }
  }

  // Handle request changes
  const handleRequestChanges = () => {
    if (onRequestChanges) {
      onRequestChanges(editedProposal)
    }
  }

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(editedProposal)
    }
    setIsDirty(false)
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get service type color
  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'EVALUATION': return 'bg-blue-100 text-blue-800'
      case 'TREATMENT': return 'bg-green-100 text-green-800'
      case 'CONSULTATION': return 'bg-purple-100 text-purple-800'
      case 'FOLLOW_UP': return 'bg-orange-100 text-orange-800'
      case 'ASSESSMENT': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const financialMetrics = calculateFinancialMetrics()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Aprobación de Propuesta Terapéutica
          </h1>
          <p className="text-muted-foreground">
            ID: {editedProposal.id} | Paciente: {editedProposal.patientId}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSave} disabled={!isDirty}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Proposal Status and Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2" />
            Información de la Propuesta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Estado</Label>
              <div className="mt-1">
                <Badge className={getStatusColor(editedProposal.status)}>
                  {editedProposal.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Prioridad</Label>
              <div className="mt-1">
                <Badge className={getPriorityColor(editedProposal.priority)}>
                  {editedProposal.priority}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Terapeuta Asignado</Label>
              <p className="text-sm mt-1">
                {editedProposal.therapist?.name || 'No asignado'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Fecha de Creación</Label>
              <p className="text-sm mt-1">
                {new Date(editedProposal.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Resumen Financiero
          </CardTitle>
          <CardDescription>
            Análisis completo de costos y presupuesto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Costo Total</Label>
              <p className="text-2xl font-bold text-green-600">
                ${financialMetrics.totalCost.toFixed(2)} {editedProposal.currency}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Costo por Sesión</Label>
              <p className="text-2xl font-bold">
                ${financialMetrics.costPerSession.toFixed(2)} {editedProposal.currency}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Costo por Hora</Label>
              <p className="text-2xl font-bold">
                ${financialMetrics.costPerHour.toFixed(2)} {editedProposal.currency}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Sesiones Totales</Label>
              <p className="text-2xl font-bold">
                {financialMetrics.totalSessions}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="financial">Financiero</TabsTrigger>
          <TabsTrigger value="analysis">Análisis</TabsTrigger>
          <TabsTrigger value="approval">Aprobación</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Propuesta</CardTitle>
              <CardDescription>
                Información general y objetivos de la propuesta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Descripción de la Propuesta</Label>
                <p className="text-sm text-muted-foreground mt-1">{editedProposal.notes}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Objetivos</Label>
                <div className="space-y-2 mt-1">
                  {editedProposal.goals.map((goal, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Resultados Esperados</Label>
                <div className="space-y-2 mt-1">
                  {editedProposal.expectedOutcomes.map((outcome, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{outcome}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editedProposal.followUpRequired}
                  onCheckedChange={(checked) => handleFieldChange('followUpRequired', checked)}
                />
                <Label>Requiere Seguimiento</Label>
              </div>
              
              {editedProposal.followUpRequired && (
                <div>
                  <Label className="text-sm font-medium">Notas de Seguimiento</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {editedProposal.followUpNotes || 'No especificado'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis Financiero Detallado</CardTitle>
              <CardDescription>
                Desglose completo de costos y análisis presupuestario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Service Breakdown */}
                <div>
                  <h3 className="font-medium mb-3">Desglose por Servicio</h3>
                  <div className="space-y-3">
                    {financialMetrics.serviceBreakdown.map((service, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{service.serviceName}</h4>
                          <Badge variant="outline">
                            {service.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Costo del servicio</span>
                          <span className="font-medium">
                            ${service.cost.toFixed(2)} {editedProposal.currency}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ inlineSize: `${service.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget Impact */}
                <div>
                  <h3 className="font-medium mb-3">Impacto Presupuestario</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Mensual</span>
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        ${(financialMetrics.totalCost / 12).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Proyección anual</p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Trimestral</span>
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        ${(financialMetrics.totalCost / 4).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Proyección anual</p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Anual</span>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold mt-2">
                        ${financialMetrics.totalCost.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Costo total</p>
                    </div>
                  </div>
                </div>

                {/* Payment Terms */}
                <div>
                  <h3 className="font-medium mb-3">Términos de Pago</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="payment-method">Método de Pago</Label>
                      <Select
                        value={editedProposal.paymentTerms?.method || 'SELF_PAY'}
                        onValueChange={(value: any) => handleFieldChange('paymentTerms', {
                          ...editedProposal.paymentTerms,
                          method: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INSURANCE">Seguro</SelectItem>
                          <SelectItem value="SELF_PAY">Pago Directo</SelectItem>
                          <SelectItem value="MIXED">Mixto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="installments">Número de Cuotas</Label>
                      <Input
                        id="installments"
                        type="number"
                        value={editedProposal.paymentTerms?.installments || 1}
                        onChange={(e) => handleFieldChange('paymentTerms', {
                          ...editedProposal.paymentTerms,
                          installments: parseInt(e.target.value) || 1
                        })}
                        min="1"
                        max="12"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="payment-notes">Notas de Pago</Label>
                    <Textarea
                      id="payment-notes"
                      value={editedProposal.paymentTerms?.notes || ''}
                      onChange={(e) => handleFieldChange('paymentTerms', {
                        ...editedProposal.paymentTerms,
                        notes: e.target.value
                      })}
                      placeholder="Notas sobre términos de pago..."
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Insurance Coverage */}
                <div>
                  <h3 className="font-medium mb-3">Cobertura de Seguro</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editedProposal.insuranceCoverage?.covered || false}
                        onCheckedChange={(checked) => handleFieldChange('insuranceCoverage', {
                          ...editedProposal.insuranceCoverage,
                          covered: checked
                        })}
                      />
                      <Label>Cobertura de Seguro</Label>
                    </div>
                    
                    {editedProposal.insuranceCoverage?.covered && (
                      <div>
                        <Label htmlFor="coverage-percentage">Porcentaje de Cobertura</Label>
                        <Input
                          id="coverage-percentage"
                          type="number"
                          value={editedProposal.insuranceCoverage?.percentage || 0}
                          onChange={(e) => handleFieldChange('insuranceCoverage', {
                            ...editedProposal.insuranceCoverage,
                            percentage: parseInt(e.target.value) || 0
                          })}
                          min="0"
                          max="100"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="insurance-notes">Notas de Seguro</Label>
                    <Textarea
                      id="insurance-notes"
                      value={editedProposal.insuranceCoverage?.notes || ''}
                      onChange={(e) => handleFieldChange('insuranceCoverage', {
                        ...editedProposal.insuranceCoverage,
                        notes: e.target.value
                      })}
                      placeholder="Notas sobre cobertura de seguro..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Servicios</CardTitle>
              <CardDescription>
                Análisis detallado de servicios seleccionados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {editedProposal.selectedServices.map((service, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{service.service.name}</CardTitle>
                          <CardDescription>{service.service.description}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getServiceTypeColor(service.service.type)}>
                            {service.service.type}
                          </Badge>
                          <Badge className={getPriorityColor(service.priority)}>
                            {service.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Sesiones</Label>
                          <p className="text-lg font-bold">{service.sessionCount}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Duración por Sesión</Label>
                          <p className="text-lg font-bold">{service.service.duration} min</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Precio por Sesión</Label>
                          <p className="text-lg font-bold">
                            ${service.service.price.toFixed(2)} {editedProposal.currency}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Costo Total</Label>
                          <p className="text-lg font-bold text-green-600">
                            ${(service.service.price * service.sessionCount).toFixed(2)} {editedProposal.currency}
                          </p>
                        </div>
                      </div>
                      
                      {service.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <Label className="text-sm font-medium">Notas del Servicio</Label>
                          <p className="text-sm text-muted-foreground mt-1">{service.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approval" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gavel className="h-5 w-5 mr-2" />
                Proceso de Aprobación
              </CardTitle>
              <CardDescription>
                Validación final y aprobación administrativa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editedProposal.budgetApproval || false}
                  onCheckedChange={(checked) => handleFieldChange('budgetApproval', checked)}
                />
                <Label>Aprobación Presupuestaria</Label>
              </div>
              
              <div>
                <Label htmlFor="final-approval-notes">Notas de Aprobación Final</Label>
                <Textarea
                  id="final-approval-notes"
                  value={editedProposal.finalApprovalNotes || ''}
                  onChange={(e) => handleFieldChange('finalApprovalNotes', e.target.value)}
                  placeholder="Notas sobre la aprobación final..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="admin-notes">Notas Administrativas</Label>
                <Textarea
                  id="admin-notes"
                  value={editedProposal.adminNotes || ''}
                  onChange={(e) => handleFieldChange('adminNotes', e.target.value)}
                  placeholder="Notas administrativas internas..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas y Comentarios</CardTitle>
              <CardDescription>
                Notas internas y comentarios de coordinación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="coordinator-notes">Notas del Coordinador</Label>
                <Textarea
                  id="coordinator-notes"
                  value={editedProposal.coordinatorNotes || ''}
                  onChange={(e) => handleFieldChange('coordinatorNotes', e.target.value)}
                  placeholder="Notas del coordinador..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="pricing-notes">Notas de Precios</Label>
                <Textarea
                  id="pricing-notes"
                  value={editedProposal.pricingNotes || ''}
                  onChange={(e) => handleFieldChange('pricingNotes', e.target.value)}
                  placeholder="Notas sobre precios y costos..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="approval-notes">Notas de Aprobación</Label>
                <Textarea
                  id="approval-notes"
                  value={editedProposal.approvalNotes || ''}
                  onChange={(e) => handleFieldChange('approvalNotes', e.target.value)}
                  placeholder="Notas sobre la aprobación..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index} className="text-sm">{error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRequestChanges}
            className="text-yellow-600"
          >
            <Edit className="h-4 w-4 mr-2" />
            Solicitar Cambios
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReject}
            className="text-red-600"
          >
            <X className="h-4 w-4 mr-2" />
            Rechazar
          </Button>
          
          <Button
            onClick={handleApprove}
            className="text-green-600"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprobar
          </Button>
        </div>
      </div>
    </div>
  )
}
