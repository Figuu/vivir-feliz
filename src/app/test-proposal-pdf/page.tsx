'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FilePdf, 
  Download, 
  Eye, 
  EyeOff, 
  Settings, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Printer,
  Share,
  Copy,
  ExternalLink,
  Info,
  Lock,
  Unlock,
  User,
  UserCheck,
  Crown,
  DollarSign,
  BarChart3,
  Users,
  Shield,
  CreditCard,
  MessageSquare,
  FileCheck,
  Calendar,
  Clock,
  Target,
  Activity,
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
  Pencil,
  Trash2,
  Archive,
  Flag,
  ThumbsUp,
  ThumbsDown,
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
  FileRuler
} from 'lucide-react'
import { ProposalPDFGeneratorComponent } from '@/components/therapeutic-proposal/proposal-pdf-generator'
import { 
  type Proposal, 
  type CostBreakdown,
  type PDFGenerationResult
} from '@/lib/proposal-pdf-generator'

// Mock data for testing
const mockProposal: Proposal = {
  id: 'PROP-2024-001',
  patientId: 'PAT-2024-001',
  therapistId: 'THER-2024-001',
  therapist: {
    id: 'THER-2024-001',
    name: 'Dr. María González',
    email: 'maria.gonzalez@terapiacentro.com',
    phone: '+1 (555) 123-4567',
    role: 'THERAPIST',
    specialties: ['Terapia de Lenguaje', 'Terapia Ocupacional', 'Desarrollo Infantil'],
    certifications: ['Certified Speech-Language Pathologist', 'Occupational Therapy License'],
    experience: 8,
    education: ['Master en Terapia de Lenguaje', 'Licenciatura en Terapia Ocupacional'],
    languages: ['Español', 'Inglés'],
    availability: {
      days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
      hours: { start: '09:00', end: '17:00' },
      timezone: 'America/Mexico_City'
    },
    location: {
      address: '123 Calle Principal',
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '01000',
      country: 'México'
    },
    preferences: {
      maxPatientsPerDay: 8,
      preferredAgeGroups: ['3-12 años'],
      preferredServiceTypes: ['EVALUATION', 'TREATMENT'],
      workingHours: { start: '09:00', end: '17:00' }
    },
    performance: {
      averageRating: 4.8,
      totalPatients: 156,
      completionRate: 94,
      patientSatisfaction: 96
    },
    isActive: true,
    isAvailable: true,
    currentWorkload: 6,
    maxWorkload: 8,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  selectedServices: [
    {
      service: {
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
        type: 'EVALUATION',
        duration: 120,
        price: 150.00,
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
      sessionCount: 1,
      notes: 'Evaluación inicial para determinar necesidades específicas del paciente',
      priority: 'HIGH'
    },
    {
      service: {
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
        type: 'TREATMENT',
        duration: 60,
        price: 80.00,
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
      sessionCount: 12,
      notes: 'Tratamiento de lenguaje basado en evaluación inicial',
      priority: 'MEDIUM'
    },
    {
      service: {
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
        type: 'TREATMENT',
        duration: 45,
        price: 75.00,
        currency: 'USD',
        isActive: true,
        requiresApproval: false,
        maxSessions: 15,
        minSessions: 6,
        ageRange: { min: 2, max: 16 },
        prerequisites: ['Evaluación previa'],
        outcomes: ['Mejora motora', 'Independencia funcional', 'Habilidades de autocuidado'],
        tags: ['occupational', 'motor', 'pediatric']
      },
      sessionCount: 8,
      notes: 'Terapia ocupacional para habilidades motoras finas',
      priority: 'LOW'
    }
  ],
  totalSessions: 21,
  estimatedDuration: 1260,
  estimatedCost: 1890.00,
  currency: 'USD',
  status: 'UNDER_REVIEW',
  priority: 'HIGH',
  notes: 'Propuesta para paciente pediátrico con necesidades múltiples de terapia',
  goals: [
    'Mejorar las habilidades de comunicación y lenguaje',
    'Desarrollar habilidades motoras finas y gruesas',
    'Aumentar la independencia funcional',
    'Mejorar las habilidades sociales y de interacción'
  ],
  expectedOutcomes: [
    'Comunicación más efectiva con familiares y compañeros',
    'Mejora en las habilidades motoras para actividades diarias',
    'Mayor independencia en tareas de autocuidado',
    'Mejor integración social y académica'
  ],
  followUpRequired: true,
  followUpNotes: 'Seguimiento mensual para evaluar progreso y ajustar tratamiento',
  createdAt: '2024-01-20T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
  submittedAt: '2024-01-20T11:00:00Z',
  reviewedAt: '2024-01-20T13:00:00Z',
  reviewedBy: 'coord-001',
  coordinatorNotes: 'Propuesta bien estructurada con objetivos claros',
  pricingNotes: 'Costos dentro del rango presupuestario',
  approvalNotes: 'Aprobación pendiente de revisión final',
  adminNotes: 'Verificar cobertura de seguro antes de aprobación final',
  finalApprovalNotes: 'Aprobación final pendiente',
  budgetApproval: true,
  insuranceCoverage: {
    covered: true,
    percentage: 80,
    notes: 'Cobertura del 80% por seguro médico'
  },
  paymentTerms: {
    method: 'MIXED',
    installments: 3,
    notes: 'Pago en 3 cuotas: 40% inicial, 30% a mitad del tratamiento, 30% final'
  }
}

const mockCostBreakdown: CostBreakdown = {
  baseCost: 1890.00,
  serviceCosts: [
    {
      serviceId: 'service-1',
      serviceName: 'Evaluación Pediátrica Integral',
      sessionCount: 1,
      unitPrice: 150.00,
      subtotal: 150.00,
      percentage: 7.9
    },
    {
      serviceId: 'service-2',
      serviceName: 'Terapia de Lenguaje',
      sessionCount: 12,
      unitPrice: 80.00,
      subtotal: 960.00,
      percentage: 50.8
    },
    {
      serviceId: 'service-3',
      serviceName: 'Terapia Ocupacional',
      sessionCount: 8,
      unitPrice: 75.00,
      subtotal: 600.00,
      percentage: 31.7
    }
  ],
  subtotal: 1710.00,
  discounts: {
    amount: 180.00,
    percentage: 10.0,
    reason: 'Descuento por paquete de servicios'
  },
  taxes: {
    amount: 153.00,
    rate: 10.0
  },
  insurance: {
    coveredAmount: 1368.00,
    coveragePercentage: 80.0,
    patientResponsibility: 342.00
  },
  paymentFees: {
    amount: 17.10,
    rate: 1.0
  },
  total: 1683.10,
  currency: 'USD',
  calculatedAt: '2024-01-20T14:30:00Z'
}

export default function TestProposalPDFPage() {
  const [currentRole, setCurrentRole] = useState<'therapist' | 'coordinator' | 'admin'>('therapist')
  const [generatedResults, setGeneratedResults] = useState<PDFGenerationResult[]>([])
  const [showResults, setShowResults] = useState(false)

  const handlePDFGenerated = (result: PDFGenerationResult) => {
    setGeneratedResults(prev => [...prev, result])
    setShowResults(true)
  }

  const handlePDFDownloaded = (result: PDFGenerationResult) => {
    console.log('PDF downloaded:', result.fileName)
  }

  const handleRoleChange = (role: 'therapist' | 'coordinator' | 'admin') => {
    setCurrentRole(role)
  }

  // Get role information
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'therapist':
        return {
          name: 'Terapeuta',
          description: 'Puede generar PDF sin información de precios',
          icon: <User className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800',
          canViewPricing: false
        }
      case 'coordinator':
        return {
          name: 'Coordinador',
          description: 'Puede generar PDF con información de precios',
          icon: <UserCheck className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800',
          canViewPricing: true
        }
      case 'admin':
        return {
          name: 'Administrador',
          description: 'Puede generar PDF con toda la información',
          icon: <Crown className="h-4 w-4" />,
          color: 'bg-purple-100 text-purple-800',
          canViewPricing: true
        }
      default:
        return {
          name: 'Desconocido',
          description: 'Rol no reconocido',
          icon: <User className="h-4 w-4" />,
          color: 'bg-gray-100 text-gray-800',
          canViewPricing: false
        }
    }
  }

  const currentRoleInfo = getRoleInfo(currentRole)

  // Calculate statistics
  const stats = {
    totalServices: mockProposal.selectedServices.length,
    totalSessions: mockProposal.totalSessions,
    totalDuration: mockProposal.estimatedDuration,
    totalCost: mockCostBreakdown.total,
    averageSessionCost: mockCostBreakdown.total / mockProposal.totalSessions,
    highPriorityServices: mockProposal.selectedServices.filter(s => s.priority === 'HIGH').length,
    mediumPriorityServices: mockProposal.selectedServices.filter(s => s.priority === 'MEDIUM').length,
    lowPriorityServices: mockProposal.selectedServices.filter(s => s.priority === 'LOW').length
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <FilePdf className="h-8 w-8 text-red-600" />
        <h1 className="text-3xl font-bold">Sistema de Generación de PDF de Propuestas</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo de generación de PDFs para propuestas terapéuticas con 
        información personalizada según el rol del usuario.
      </p>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FilePdf className="h-4 w-4 mr-2 text-red-600" />
              Generación de PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Generación de PDFs profesionales con jsPDF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2 text-blue-600" />
              Visibilidad por Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Información visible según el rol del usuario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Settings className="h-4 w-4 mr-2 text-purple-600" />
              Opciones Configurables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Configuración personalizable de contenido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Download className="h-4 w-4 mr-2 text-green-600" />
              Descarga y Vista Previa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Descarga directa y vista previa del PDF
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selección de Rol</CardTitle>
          <CardDescription>
            Cambia el rol para ver cómo afecta la generación del PDF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['therapist', 'coordinator', 'admin'] as const).map((role) => {
              const roleInfo = getRoleInfo(role)
              const isSelected = currentRole === role
              
              return (
                <div
                  key={role}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleRoleChange(role)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roleInfo.color}`}>
                      {roleInfo.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{roleInfo.name}</h3>
                      <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Role Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {currentRoleInfo.icon}
            <span className="ml-2">Rol Actual: {currentRoleInfo.name}</span>
          </CardTitle>
          <CardDescription>
            {currentRoleInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge className={currentRoleInfo.color}>
              {currentRoleInfo.name}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentRole === 'therapist' && 'No puede ver precios ni costos en el PDF'}
              {currentRole === 'coordinator' && 'Puede ver precios y costos básicos en el PDF'}
              {currentRole === 'admin' && 'Puede ver toda la información en el PDF'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">Seleccionados</p>
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
            <div className="text-2xl font-bold">
              {currentRole === 'therapist' ? (
                <span className="text-muted-foreground">Oculto</span>
              ) : (
                `$${stats.totalCost.toFixed(2)}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentRole === 'therapist' ? 'No visible' : 'USD'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PDF Generator Component */}
      <ProposalPDFGeneratorComponent
        proposal={mockProposal}
        costBreakdown={mockCostBreakdown}
        userRole={currentRole}
        onPDFGenerated={handlePDFGenerated}
        onPDFDownloaded={handlePDFDownloaded}
      />

      {/* Generated Results */}
      {showResults && generatedResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>PDFs Generados</CardTitle>
                <CardDescription>
                  Historial de PDFs generados en esta sesión
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResults(!showResults)}
              >
                {showResults ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showResults ? 'Ocultar' : 'Mostrar'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium">{result.fileName}</span>
                    </div>
                    <Badge variant="outline">
                      {result.success ? 'Exitoso' : 'Error'}
                    </Badge>
                  </div>
                  
                  {result.success && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Tamaño:</span>
                        <span className="ml-2">{(result.fileSize / 1024).toFixed(1)} KB</span>
                      </div>
                      <div>
                        <span className="font-medium">Estado:</span>
                        <span className="ml-2 text-green-600">Listo para descargar</span>
                      </div>
                      <div>
                        <span className="font-medium">Rol:</span>
                        <span className="ml-2">{currentRole}</span>
                      </div>
                    </div>
                  )}
                  
                  {!result.success && (
                    <div className="text-sm text-red-600">
                      <span className="font-medium">Error:</span>
                      <span className="ml-2">{result.error}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema utiliza jsPDF para generar PDFs profesionales, 
          implementa visibilidad basada en roles (terapeutas no pueden ver precios, coordinadores ven costos básicos, 
          administradores ven todo), incluye opciones configurables de contenido, formato y estilo, proporciona 
          vista previa del PDF generado, y permite descarga directa del archivo.
        </AlertDescription>
      </Alert>
    </div>
  )
}
