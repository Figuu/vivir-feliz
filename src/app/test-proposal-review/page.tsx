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
  FileRuler2,
  FileRuler3,
  FileRuler4,
  FileRuler5,
  FileRuler6,
  FileRuler7,
  FileRuler8,
  FileRuler9,
  FileRuler10,
  FileRuler11,
  FileRuler12,
  FileRuler13,
  FileRuler14,
  FileRuler15,
  FileRuler16,
  FileRuler17,
  FileRuler18,
  FileRuler19,
  FileRuler20,
  FileRuler21,
  FileRuler22,
  FileRuler23,
  FileRuler24,
  FileRuler25,
  FileRuler26,
  FileRuler27,
  FileRuler28,
  FileRuler29,
  FileRuler30,
  FileRuler31,
  FileRuler32,
  FileRuler33,
  FileRuler34,
  FileRuler35,
  FileRuler36,
  FileRuler37,
  FileRuler38,
  FileRuler39,
  FileRuler40,
  FileRuler41,
  FileRuler42,
  FileRuler43,
  FileRuler44,
  FileRuler45,
  FileRuler46,
  FileRuler47,
  FileRuler48,
  FileRuler49,
  FileRuler50,
  FileRuler51,
  FileRuler52,
  FileRuler53,
  FileRuler54,
  FileRuler55,
  FileRuler56,
  FileRuler57,
  FileRuler58,
  FileRuler59,
  FileRuler60,
  FileRuler61,
  FileRuler62,
  FileRuler63,
  FileRuler64,
  FileRuler65,
  FileRuler66,
  FileRuler67,
  FileRuler68,
  FileRuler69,
  FileRuler70,
  FileRuler71,
  FileRuler72,
  FileRuler73,
  FileRuler74,
  FileRuler75,
  FileRuler76,
  FileRuler77,
  FileRuler78,
  FileRuler79,
  FileRuler80,
  FileRuler81,
  FileRuler82,
  FileRuler83,
  FileRuler84,
  FileRuler85,
  FileRuler86,
  FileRuler87,
  FileRuler88,
  FileRuler89,
  FileRuler90,
  FileRuler91,
  FileRuler92,
  FileRuler93,
  FileRuler94,
  FileRuler95,
  FileRuler96,
  FileRuler97,
  FileRuler98,
  FileRuler99,
  FileRuler100
} from 'lucide-react'
import { ProposalReviewInterface } from '@/components/therapeutic-proposal/proposal-review-interface'

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
  approvalNotes: 'Pendiente de revisión final por administrador'
}

export default function TestProposalReviewPage() {
  const [proposal, setProposal] = useState(mockProposal)
  const [showForm, setShowForm] = useState(false)
  const [reviewHistory, setReviewHistory] = useState<any[]>([])

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
      reviewedBy: 'coordinator-1'
    }
    setProposal(updatedProposal)
    setReviewHistory(prev => [{
      id: `review-${Date.now()}`,
      action: 'APPROVED',
      timestamp: new Date().toISOString(),
      reviewer: 'coordinator-1',
      notes: 'Propuesta aprobada después de revisión completa'
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
      reviewedBy: 'coordinator-1'
    }
    setProposal(updatedProposal)
    setReviewHistory(prev => [{
      id: `review-${Date.now()}`,
      action: 'REJECTED',
      timestamp: new Date().toISOString(),
      reviewer: 'coordinator-1',
      notes: 'Propuesta rechazada por razones especificadas'
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
      reviewedBy: 'coordinator-1'
    }
    setProposal(updatedProposal)
    setReviewHistory(prev => [{
      id: `review-${Date.now()}`,
      action: 'CHANGES_REQUESTED',
      timestamp: new Date().toISOString(),
      reviewer: 'coordinator-1',
      notes: 'Se solicitaron cambios en la propuesta'
    }, ...prev])
    setShowForm(false)
    alert('Cambios solicitados al terapeuta')
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
    lowPriorityServices: proposal.selectedServices.filter(s => s.priority === 'LOW').length
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
        <FileText className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Sistema de Revisión de Propuestas Terapéuticas</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo para que los coordinadores revisen propuestas terapéuticas, 
        realicen ediciones, vean información de precios y validen el contenido.
      </p>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Revisión Completa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Revisión integral de propuestas con validación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
              Visibilidad de Precios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Acceso completo a información de costos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Edit className="h-4 w-4 mr-2 text-purple-600" />
              Edición Avanzada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Edición de propuestas con validación en tiempo real
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2 text-orange-600" />
              Validación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Validación automática de contenido y servicios
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
            <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">USD</p>
          </CardContent>
        </Card>
      </div>

      {/* Proposal Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Propuesta Actual</CardTitle>
          <CardDescription>
            Información general de la propuesta en revisión
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

      {/* Review History */}
      {reviewHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Revisión</CardTitle>
            <CardDescription>
              Registro de acciones realizadas en la propuesta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewHistory.map((review) => (
                <div key={review.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{review.action}</p>
                      <p className="text-sm text-muted-foreground">{review.notes}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{review.reviewer}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.timestamp).toLocaleString()}
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
          <h2 className="text-xl font-semibold">Revisión de Propuesta</h2>
          <p className="text-muted-foreground">
            Revisa, edita y aprueba la propuesta terapéutica
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <FileText className="h-4 w-4 mr-2" />
          Revisar Propuesta
        </Button>
      </div>

      {/* Proposal Review Interface */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <ProposalReviewInterface
              proposal={proposal}
              services={mockServices}
              therapists={[mockTherapist]}
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
          <strong>Información Técnica:</strong> Este sistema permite a los coordinadores revisar 
          propuestas terapéuticas con acceso completo a información de precios, edición avanzada 
          de contenido, validación automática de servicios y sesiones, gestión de notas internas, 
          y flujo de aprobación/rechazo. Incluye validación de límites de sesiones, verificación 
          de objetivos y resultados, y seguimiento del historial de revisiones.
        </AlertDescription>
      </Alert>
    </div>
  )
}
