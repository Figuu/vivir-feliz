'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { ProposalApprovalInterface } from '@/components/therapeutic-proposal/proposal-approval-interface'

// Mock data for testing
const mockServices = [
  {
    id: 'service-1',
    code: 'EVAL-001',
    name: 'Evaluación Pediátrica Integral',
    description: 'Evaluación completa del desarrollo infantil incluyendo aspectos cognitivos, emocionales y conductuales',
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Terapia Pediátrica',
      color: '#3b82f6',
      icon: 'baby'
    },
    type: 'EVALUATION' as const,
    duration: 120,
    price: 150,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 1,
    minSessions: 1,
    ageRange: { min: 2, max: 18 },
    prerequisites: ['Historial médico', 'Informes escolares'],
    outcomes: ['Diagnóstico integral', 'Plan de tratamiento', 'Recomendaciones'],
    tags: ['pediatric', 'evaluation', 'development']
  },
  {
    id: 'service-2',
    code: 'TREAT-001',
    name: 'Terapia de Lenguaje',
    description: 'Intervención terapéutica para mejorar las habilidades de comunicación y lenguaje',
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Terapia Pediátrica',
      color: '#3b82f6',
      icon: 'baby'
    },
    type: 'TREATMENT' as const,
    duration: 60,
    price: 80,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 20,
    minSessions: 8,
    ageRange: { min: 3, max: 12 },
    prerequisites: ['Evaluación previa'],
    outcomes: ['Mejora en comunicación', 'Desarrollo del lenguaje', 'Habilidades sociales'],
    tags: ['speech', 'language', 'pediatric']
  },
  {
    id: 'service-3',
    code: 'TREAT-002',
    name: 'Terapia Ocupacional',
    description: 'Intervención para mejorar las habilidades motoras finas y gruesas',
    categoryId: 'cat-2',
    category: {
      id: 'cat-2',
      name: 'Terapia Ocupacional',
      color: '#10b981',
      icon: 'activity'
    },
    type: 'TREATMENT' as const,
    duration: 45,
    price: 75,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 15,
    minSessions: 6,
    ageRange: { min: 2, max: 16 },
    prerequisites: ['Evaluación previa'],
    outcomes: ['Mejora motora', 'Independencia funcional', 'Habilidades de autocuidado'],
    tags: ['occupational', 'motor', 'pediatric']
  }
]

const mockTherapist = {
  id: 'therapist-1',
  name: 'Dr. María González',
  email: 'maria@therapycenter.com',
  phone: '+1 234 567 8900',
  role: 'THERAPIST' as const,
  specialties: ['Pediatric', 'Speech Therapy', 'Language Development'],
  certifications: ['Licensed Speech-Language Pathologist', 'Pediatric Specialist'],
  experience: 8,
  education: ['Master of Science in Speech-Language Pathology'],
  languages: ['Spanish', 'English'],
  availability: {
    days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    hours: { start: '08:00', end: '17:00' },
    timezone: 'EST'
  },
  location: {
    city: 'Miami',
    state: 'FL',
    country: 'USA'
  },
  preferences: {
    maxPatientsPerDay: 8,
    preferredAgeGroups: ['2-5', '6-12'],
    preferredServiceTypes: ['TREATMENT', 'EVALUATION'],
    workingHours: { start: '08:00', end: '17:00' }
  },
  performance: {
    averageRating: 4.8,
    totalPatients: 150,
    completionRate: 95,
    patientSatisfaction: 92
  },
  isActive: true,
  isAvailable: true,
  currentWorkload: 6,
  maxWorkload: 8,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
}

const mockProposal = {
  id: 'proposal-123',
  patientId: 'patient-1',
  therapistId: 'therapist-1',
  therapist: mockTherapist,
  selectedServices: [
    {
      service: mockServices[0],
      sessionCount: 1,
      notes: 'Evaluación inicial para determinar necesidades',
      priority: 'HIGH' as const
    },
    {
      service: mockServices[1],
      sessionCount: 12,
      notes: 'Tratamiento de lenguaje basado en evaluación',
      priority: 'MEDIUM' as const
    },
    {
      service: mockServices[2],
      sessionCount: 8,
      notes: 'Terapia ocupacional para habilidades motoras',
      priority: 'LOW' as const
    }
  ],
  totalSessions: 21,
  estimatedDuration: 1260,
  estimatedCost: 1890,
  currency: 'USD',
  status: 'UNDER_REVIEW' as const,
  priority: 'HIGH' as const,
  notes: 'Paciente de 5 años con retraso en el desarrollo del lenguaje y habilidades motoras finas. Requiere evaluación integral y tratamiento multidisciplinario.',
  goals: [
    'Mejorar las habilidades de comunicación verbal',
    'Desarrollar habilidades motoras finas',
    'Aumentar la independencia en actividades de la vida diaria',
    'Fortalecer la confianza y autoestima del paciente'
  ],
  expectedOutcomes: [
    'Comunicación funcional mejorada',
    'Habilidades motoras finas desarrolladas',
    'Mayor independencia en autocuidado',
    'Mejora en la participación escolar'
  ],
  followUpRequired: true,
  followUpNotes: 'Seguimiento mensual para evaluar progreso y ajustar tratamiento según sea necesario',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  submittedAt: '2024-01-15T10:00:00Z',
  coordinatorNotes: 'Propuesta bien estructurada con objetivos claros. Terapeuta asignado tiene experiencia adecuada.',
  pricingNotes: 'Costos dentro del rango esperado. Considerar descuento por paquete de servicios múltiples.',
  approvalNotes: 'Pendiente de revisión final por administrador',
  adminNotes: 'Revisión administrativa en proceso',
  finalApprovalNotes: '',
  budgetApproval: false,
  insuranceCoverage: {
    covered: true,
    percentage: 80,
    notes: 'Cobertura del 80% por seguro médico'
  },
  paymentTerms: {
    method: 'MIXED' as const,
    installments: 3,
    notes: 'Pago mixto: 80% seguro, 20% pago directo en 3 cuotas'
  }
}

const mockFinancialAnalysis = {
  totalCost: 1890,
  costPerSession: 90,
  costPerHour: 90,
  serviceBreakdown: [
    {
      serviceId: 'service-1',
      serviceName: 'Evaluación Pediátrica Integral',
      cost: 150,
      percentage: 7.9
    },
    {
      serviceId: 'service-2',
      serviceName: 'Terapia de Lenguaje',
      cost: 960,
      percentage: 50.8
    },
    {
      serviceId: 'service-3',
      serviceName: 'Terapia Ocupacional',
      cost: 600,
      percentage: 31.7
    }
  ],
  budgetImpact: {
    monthly: 157.5,
    quarterly: 472.5,
    yearly: 1890
  },
  costComparison: {
    average: 1200,
    median: 1100,
    range: {
      min: 800,
      max: 2000
    }
  },
  recommendations: [
    'Considerar descuento por paquete de servicios múltiples',
    'Verificar cobertura de seguro antes de aprobar',
    'Evaluar impacto presupuestario mensual',
    'Confirmar disponibilidad del terapeuta asignado'
  ]
}

export default function TestProposalApprovalPage() {
  const [proposal, setProposal] = useState(mockProposal)
  const [showForm, setShowForm] = useState(false)
  const [approvalHistory, setApprovalHistory] = useState<any[]>([])

  const handleSaveProposal = (updatedProposal: any) => {
    console.log('Saving proposal:', updatedProposal)
    setProposal(updatedProposal)
    setShowForm(false)
    alert('Propuesta guardada exitosamente')
  }

  const handleApproveProposal = (approvedProposal: any) => {
    console.log('Approving proposal:', approvedProposal)
    const updatedProposal = {
      ...approvedProposal,
      status: 'APPROVED',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'admin-1'
    }
    setProposal(updatedProposal)
    setApprovalHistory(prev => [{
      id: `approval-${Date.now()}`,
      action: 'APPROVED',
      timestamp: new Date().toISOString(),
      reviewer: 'admin-1',
      notes: 'Propuesta aprobada por administrador con presupuesto autorizado'
    }, ...prev])
    setShowForm(false)
    alert('Propuesta aprobada exitosamente')
  }

  const handleRejectProposal = (rejectedProposal: any) => {
    console.log('Rejecting proposal:', rejectedProposal)
    const updatedProposal = {
      ...rejectedProposal,
      status: 'REJECTED',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'admin-1'
    }
    setProposal(updatedProposal)
    setApprovalHistory(prev => [{
      id: `approval-${Date.now()}`,
      action: 'REJECTED',
      timestamp: new Date().toISOString(),
      reviewer: 'admin-1',
      notes: 'Propuesta rechazada por razones administrativas'
    }, ...prev])
    setShowForm(false)
    alert('Propuesta rechazada')
  }

  const handleRequestChanges = (proposalWithChanges: any) => {
    console.log('Requesting changes for proposal:', proposalWithChanges)
    const updatedProposal = {
      ...proposalWithChanges,
      status: 'SUBMITTED',
      reviewedAt: new Date().toISOString(),
      reviewedBy: 'admin-1'
    }
    setProposal(updatedProposal)
    setApprovalHistory(prev => [{
      id: `approval-${Date.now()}`,
      action: 'CHANGES_REQUESTED',
      timestamp: new Date().toISOString(),
      reviewer: 'admin-1',
      notes: 'Se solicitaron cambios administrativos en la propuesta'
    }, ...prev])
    setShowForm(false)
    alert('Cambios solicitados al coordinador')
  }

  // Calculate statistics
  const stats = {
    totalServices: proposal.selectedServices.length,
    totalSessions: proposal.selectedServices.reduce((sum, s) => sum + s.sessionCount, 0),
    totalDuration: proposal.selectedServices.reduce((sum, s) => sum + (s.service.duration * s.sessionCount), 0),
    totalCost: proposal.selectedServices.reduce((sum, s) => sum + (s.service.price * s.sessionCount), 0),
    averageSessionCost: proposal.selectedServices.reduce((sum, s) => sum + s.service.price, 0) / proposal.selectedServices.length,
    highPriorityServices: proposal.selectedServices.filter(s => s.priority === 'HIGH').length,
    mediumPriorityServices: proposal.selectedServices.filter(s => s.priority === 'MEDIUM').length,
    lowPriorityServices: proposal.selectedServices.filter(s => s.priority === 'LOW').length,
    budgetApproved: proposal.budgetApproval,
    insuranceCoverage: proposal.insuranceCoverage?.covered,
    coveragePercentage: proposal.insuranceCoverage?.percentage || 0
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Crown className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Sistema de Aprobación de Propuestas Terapéuticas</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo para que los administradores aprueben propuestas terapéuticas 
        con visibilidad completa de costos, análisis financiero y controles administrativos.
      </p>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Crown className="h-4 w-4 mr-2 text-green-600" />
              Aprobación Administrativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Aprobación final con controles administrativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
              Visibilidad Total de Costos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Acceso completo a información financiera
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
              Análisis Financiero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Análisis detallado de costos y presupuesto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Gavel className="h-4 w-4 mr-2 text-orange-600" />
              Control Presupuestario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Control y aprobación de presupuestos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">En la propuesta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sesiones Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">Programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">USD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cobertura de Seguro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.coveragePercentage}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.insuranceCoverage ? 'Cubierto' : 'No cubierto'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Duración Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.totalDuration / 60)}h {stats.totalDuration % 60}m
            </div>
            <p className="text-xs text-muted-foreground">De terapia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo por Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.averageSessionCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={stats.budgetApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {stats.budgetApproved ? 'Aprobado' : 'Pendiente'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Estado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant="outline">
                {proposal.paymentTerms?.method || 'No definido'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Tipo</p>
          </CardContent>
        </Card>
      </div>

      {/* Proposal Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Propuesta Actual</CardTitle>
          <CardDescription>
            Información general de la propuesta en aprobación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">ID de Propuesta</Label>
              <p className="text-sm">{proposal.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Estado</Label>
              <div className="mt-1">
                <Badge className={getStatusColor(proposal.status)}>
                  {proposal.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Prioridad</Label>
              <div className="mt-1">
                <Badge className={getPriorityColor(proposal.priority)}>
                  {proposal.priority}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Terapeuta</Label>
              <p className="text-sm">{proposal.therapist?.name || 'No asignado'}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <Label className="text-sm font-medium">Descripción</Label>
            <p className="text-sm text-muted-foreground mt-1">{proposal.notes}</p>
          </div>
        </CardContent>
      </Card>

      {/* Financial Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis Financiero</CardTitle>
          <CardDescription>
            Desglose detallado de costos y análisis presupuestario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Costo Total</span>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold mt-2">${mockFinancialAnalysis.totalCost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">USD</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Costo por Sesión</span>
                  <Calculator className="h-4 w-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold mt-2">${mockFinancialAnalysis.costPerSession.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Promedio</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Costo por Hora</span>
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold mt-2">${mockFinancialAnalysis.costPerHour.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Por hora</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Desglose por Servicio</h3>
              <div className="space-y-2">
                {mockFinancialAnalysis.serviceBreakdown.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{service.serviceName}</p>
                      <p className="text-sm text-muted-foreground">{service.percentage.toFixed(1)}% del total</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${service.cost.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">USD</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios Incluidos</CardTitle>
          <CardDescription>
            Resumen de servicios seleccionados en la propuesta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proposal.selectedServices.map((service, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium">{service.service.name}</h3>
                    <p className="text-sm text-muted-foreground">{service.service.description}</p>
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
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Sesiones:</span>
                    <span className="ml-2">{service.sessionCount}</span>
                  </div>
                  <div>
                    <span className="font-medium">Duración:</span>
                    <span className="ml-2">{service.service.duration} min/sesión</span>
                  </div>
                  <div>
                    <span className="font-medium">Precio:</span>
                    <span className="ml-2">${service.service.price}/sesión</span>
                  </div>
                  <div>
                    <span className="font-medium">Subtotal:</span>
                    <span className="ml-2">${(service.service.price * service.sessionCount).toFixed(2)}</span>
                  </div>
                </div>
                
                {service.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Notas:</span>
                    <span className="text-sm text-muted-foreground ml-2">{service.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goals and Outcomes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Objetivos</CardTitle>
            <CardDescription>
              Objetivos definidos para la terapia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {proposal.goals.map((goal, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <Target className="h-4 w-4 text-blue-500 mt-0.5" />
                  <span className="text-sm">{goal}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultados Esperados</CardTitle>
            <CardDescription>
              Resultados esperados del tratamiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {proposal.expectedOutcomes.map((outcome, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">{outcome}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval History */}
      {approvalHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Aprobación</CardTitle>
            <CardDescription>
              Registro de acciones administrativas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvalHistory.map((approval) => (
                <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Crown className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{approval.action}</p>
                      <p className="text-sm text-muted-foreground">{approval.notes}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{approval.reviewer}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(approval.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Aprobación de Propuesta</h2>
          <p className="text-muted-foreground">
            Revisa, analiza y aprueba la propuesta terapéutica
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Crown className="h-4 w-4 mr-2" />
          Aprobar Propuesta
        </Button>
      </div>

      {/* Proposal Approval Interface */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <ProposalApprovalInterface
              proposal={proposal}
              services={mockServices}
              therapists={[mockTherapist]}
              financialAnalysis={mockFinancialAnalysis}
              onSave={handleSaveProposal}
              onApprove={handleApproveProposal}
              onReject={handleRejectProposal}
              onRequestChanges={handleRequestChanges}
              onCancel={() => setShowForm(false)}
              isEditing={true}
            />
          </div>
        </div>
      )}

      {/* Technical Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema permite a los administradores aprobar 
          propuestas terapéuticas con visibilidad completa de costos, análisis financiero detallado, 
          control presupuestario, gestión de términos de pago, cobertura de seguro, y proceso de 
          aprobación administrativa. Incluye validación de presupuesto, análisis de impacto financiero, 
          y seguimiento del historial de aprobaciones.
        </AlertDescription>
      </Alert>
    </div>
  )
}
