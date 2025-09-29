'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Workflow, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Play, 
  Pause, 
  RotateCcw,
  MessageSquare,
  Bell,
  Users,
  Calendar,
  FileText,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  User,
  UserCheck,
  Crown,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  AlertTriangle,
  Info,
  Check,
  X,
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  Archive,
  Flag,
  ThumbsUp,
  ThumbsDown,
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
  FileRuler
} from 'lucide-react'
import { ProposalWorkflowTracker } from '@/components/therapeutic-proposal/proposal-workflow-tracker'
import { 
  type Proposal, 
  type User,
  type WorkflowComment
} from '@/lib/proposal-workflow-manager'

// Mock data for testing
const mockProposal: Proposal = {
  id: 'PROP-2024-001',
  patientId: 'PAT-2024-001',
  therapistId: 'THER-2024-001',
  selectedServices: [
    {
      service: {
        id: 'service-1',
        code: 'EVAL-001',
        name: 'Evaluación Pediátrica Integral',
        description: 'Evaluación completa del desarrollo infantil',
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
      notes: 'Evaluación inicial para determinar necesidades específicas',
      priority: 'HIGH'
    },
    {
      service: {
        id: 'service-2',
        code: 'TREAT-001',
        name: 'Terapia de Lenguaje',
        description: 'Intervención terapéutica para mejorar las habilidades de comunicación',
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
    }
  ],
  totalSessions: 13,
  estimatedDuration: 780,
  estimatedCost: 1110.00,
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

const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Dr. María González',
    email: 'maria.gonzalez@terapiacentro.com',
    role: 'THERAPIST',
    isActive: true
  },
  {
    id: 'user-2',
    name: 'Ana Coordinadora',
    email: 'ana.coordinadora@terapiacentro.com',
    role: 'COORDINATOR',
    isActive: true
  },
  {
    id: 'user-3',
    name: 'Carlos Administrador',
    email: 'carlos.admin@terapiacentro.com',
    role: 'ADMIN',
    isActive: true
  }
]

export default function TestProposalWorkflowPage() {
  const [currentUser, setCurrentUser] = useState<User>(mockUsers[0])
  const [proposal, setProposal] = useState<Proposal>(mockProposal)
  const [workflowComments, setWorkflowComments] = useState<WorkflowComment[]>([])

  const handleStatusChange = (updatedProposal: Proposal) => {
    setProposal(updatedProposal)
  }

  const handleCommentAdded = (comment: WorkflowComment) => {
    setWorkflowComments(prev => [...prev, comment])
  }

  const handleUserChange = (user: User) => {
    setCurrentUser(user)
  }

  // Get user role information
  const getUserRoleInfo = (role: string) => {
    switch (role) {
      case 'THERAPIST':
        return {
          name: 'Terapeuta',
          description: 'Puede crear y editar propuestas, ver progreso',
          icon: <User className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800'
        }
      case 'COORDINATOR':
        return {
          name: 'Coordinador',
          description: 'Puede revisar propuestas, aprobar/rechazar',
          icon: <UserCheck className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800'
        }
      case 'ADMIN':
        return {
          name: 'Administrador',
          description: 'Puede realizar todas las acciones del flujo de trabajo',
          icon: <Crown className="h-4 w-4" />,
          color: 'bg-purple-100 text-purple-800'
        }
      default:
        return {
          name: 'Desconocido',
          description: 'Rol no reconocido',
          icon: <User className="h-4 w-4" />,
          color: 'bg-gray-100 text-gray-800'
        }
    }
  }

  const currentUserRoleInfo = getUserRoleInfo(currentUser.role)

  // Calculate statistics
  const stats = {
    totalServices: proposal.selectedServices.length,
    totalSessions: proposal.totalSessions,
    totalDuration: proposal.estimatedDuration,
    totalCost: proposal.estimatedCost,
    daysSinceCreation: Math.floor((Date.now() - new Date(proposal.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    daysSinceSubmission: proposal.submittedAt ? Math.floor((Date.now() - new Date(proposal.submittedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    daysSinceReview: proposal.reviewedAt ? Math.floor((Date.now() - new Date(proposal.reviewedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Workflow className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Sistema de Seguimiento de Flujo de Trabajo de Propuestas</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo de seguimiento y gestión del flujo de trabajo para propuestas terapéuticas 
        con monitoreo de estado, transiciones, comentarios y métricas.
      </p>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Workflow className="h-4 w-4 mr-2 text-blue-600" />
              Flujo de Trabajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Flujo de trabajo configurable con pasos y transiciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2 text-green-600" />
              Seguimiento en Tiempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Monitoreo en tiempo real del progreso de propuestas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MessageSquare className="h-4 w-4 mr-2 text-purple-600" />
              Comentarios y Colaboración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Sistema de comentarios y colaboración entre roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-orange-600" />
              Métricas y Análisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Métricas detalladas y análisis de rendimiento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selección de Usuario</CardTitle>
          <CardDescription>
            Cambia el usuario para ver cómo afecta las acciones disponibles en el flujo de trabajo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockUsers.map((user) => {
              const roleInfo = getUserRoleInfo(user.role)
              const isSelected = currentUser.id === user.id
              
              return (
                <div
                  key={user.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleUserChange(user)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roleInfo.color}`}>
                      {roleInfo.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {currentUserRoleInfo.icon}
            <span className="ml-2">Usuario Actual: {currentUserRoleInfo.name}</span>
          </CardTitle>
          <CardDescription>
            {currentUserRoleInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge className={currentUserRoleInfo.color}>
              {currentUserRoleInfo.name}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentUser.email}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Statistics */}
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
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">USD</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Días desde Creación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.daysSinceCreation}</div>
            <p className="text-xs text-muted-foreground">Días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Días desde Envío</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.daysSinceSubmission}</div>
            <p className="text-xs text-muted-foreground">Días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Días desde Revisión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.daysSinceReview}</div>
            <p className="text-xs text-muted-foreground">Días</p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Tracker Component */}
      <ProposalWorkflowTracker
        proposal={proposal}
        currentUser={currentUser}
        onStatusChange={handleStatusChange}
        onCommentAdded={handleCommentAdded}
      />

      {/* Workflow Comments Summary */}
      {workflowComments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Comentarios del Flujo de Trabajo</CardTitle>
            <CardDescription>
              Resumen de comentarios agregados durante esta sesión
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflowComments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getUserRoleInfo(comment.userRole).icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{comment.userName}</h4>
                          <Badge className={getUserRoleInfo(comment.userRole).color}>
                            {comment.userRole}
                          </Badge>
                          {comment.isInternal && (
                            <Badge variant="outline">Interno</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mt-2">{comment.content}</p>
                    </div>
                  </div>
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
          <strong>Información Técnica:</strong> Este sistema implementa un flujo de trabajo completo 
          para propuestas terapéuticas con seguimiento de estado, transiciones automáticas y manuales, 
          sistema de comentarios y colaboración, métricas de rendimiento, notificaciones automáticas, 
          escalación de propuestas atrasadas, y control de acceso basado en roles.
        </AlertDescription>
      </Alert>
    </div>
  )
}
