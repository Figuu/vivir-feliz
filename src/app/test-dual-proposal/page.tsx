'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  GitCompare, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Heart,
  Brain,
  Baby,
  UserCheck,
  Calendar,
  Clock,
  DollarSign,
  Package,
  Tag,
  Settings,
  Plus,
  Edit,
  Trash2,
  Copy,
  Save,
  Eye,
  Search,
  Filter,
  Send,
  Download,
  Upload,
  ArrowRight,
  ArrowLeft,
  Target,
  TrendingUp,
  BarChart3,
  Calculator,
  BookOpen,
  Lightbulb,
  Star,
  Award,
  Zap
} from 'lucide-react'
import { DualProposalSystem } from '@/components/therapeutic-proposal/dual-proposal-system'

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
    tags: ['pediátrica', 'evaluación', 'desarrollo'],
    metadata: {
      createdBy: 'admin-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      usageCount: 45,
      averageRating: 4.8
    }
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
    tags: ['lenguaje', 'comunicación', 'pediátrica'],
    metadata: {
      createdBy: 'admin-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      usageCount: 120,
      averageRating: 4.6
    }
  },
  {
    id: 'service-3',
    code: 'CONSULT-001',
    name: 'Consulta Psicológica',
    description: 'Consulta inicial para evaluación y orientación psicológica',
    categoryId: 'cat-2',
    category: {
      id: 'cat-2',
      name: 'Terapia de Adultos',
      color: '#10b981',
      icon: 'users'
    },
    type: 'CONSULTATION' as const,
    duration: 50,
    price: 100,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 1,
    minSessions: 1,
    ageRange: { min: 18, max: 65 },
    prerequisites: [],
    outcomes: ['Evaluación inicial', 'Orientación', 'Plan de seguimiento'],
    tags: ['consulta', 'psicología', 'adultos'],
    metadata: {
      createdBy: 'admin-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      usageCount: 85,
      averageRating: 4.7
    }
  },
  {
    id: 'service-4',
    code: 'ASSESS-001',
    name: 'Evaluación Neuropsicológica',
    description: 'Evaluación completa del funcionamiento cognitivo y neuropsicológico',
    categoryId: 'cat-3',
    category: {
      id: 'cat-3',
      name: 'Evaluaciones Neuropsicológicas',
      color: '#8b5cf6',
      icon: 'brain'
    },
    type: 'ASSESSMENT' as const,
    duration: 180,
    price: 300,
    currency: 'USD',
    isActive: true,
    requiresApproval: true,
    maxSessions: 1,
    minSessions: 1,
    ageRange: { min: 6, max: 80 },
    prerequisites: ['Historial médico', 'Evaluación previa'],
    outcomes: ['Perfil neuropsicológico', 'Diagnóstico', 'Recomendaciones'],
    tags: ['neuropsicología', 'evaluación', 'cognición'],
    metadata: {
      createdBy: 'admin-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      usageCount: 25,
      averageRating: 4.9
    }
  },
  {
    id: 'service-5',
    code: 'FOLLOW-001',
    name: 'Seguimiento Terapéutico',
    description: 'Sesiones de seguimiento para monitorear el progreso del tratamiento',
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Terapia Pediátrica',
      color: '#3b82f6',
      icon: 'baby'
    },
    type: 'FOLLOW_UP' as const,
    duration: 30,
    price: 50,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 10,
    minSessions: 1,
    ageRange: { min: 2, max: 18 },
    prerequisites: ['Tratamiento previo'],
    outcomes: ['Monitoreo de progreso', 'Ajustes al tratamiento'],
    tags: ['seguimiento', 'monitoreo', 'progreso'],
    metadata: {
      createdBy: 'admin-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      usageCount: 200,
      averageRating: 4.5
    }
  },
  {
    id: 'service-6',
    code: 'TREAT-002',
    name: 'Terapia Ocupacional',
    description: 'Intervención para mejorar las habilidades de la vida diaria y la independencia funcional',
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Terapia Pediátrica',
      color: '#3b82f6',
      icon: 'baby'
    },
    type: 'TREATMENT' as const,
    duration: 45,
    price: 75,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 15,
    minSessions: 6,
    ageRange: { min: 3, max: 16 },
    prerequisites: ['Evaluación previa'],
    outcomes: ['Mejora en habilidades motoras', 'Independencia funcional', 'Integración sensorial'],
    tags: ['ocupacional', 'motricidad', 'independencia'],
    metadata: {
      createdBy: 'admin-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      usageCount: 95,
      averageRating: 4.7
    }
  }
]

const mockPatient = {
  id: 'patient-1',
  firstName: 'Juan',
  lastName: 'Pérez',
  dateOfBirth: '2020-03-15',
  gender: 'Masculino',
  address: 'Calle Principal 123, Ciudad',
  phone: '+1 234 567 8900',
  email: 'juan.perez@email.com',
  medicalHistory: 'Ninguna condición médica conocida. Desarrollo normal para la edad.',
  currentMedications: 'No toma medicamentos actualmente',
  allergies: 'Ninguna alergia conocida',
  emergencyContact: {
    name: 'María Pérez',
    phone: '+1 234 567 8901',
    relationship: 'Madre'
  }
}

const mockTherapist = {
  id: 'therapist-1',
  name: 'Dr. María González',
  email: 'maria@therapycenter.com',
  specialties: ['Terapia Pediátrica', 'Terapia de Lenguaje', 'Evaluaciones Neuropsicológicas'],
  certifications: ['Licenciada en Psicología', 'Especialista en Terapia Pediátrica'],
  experience: 8,
  availability: {
    days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    hours: {
      start: '08:00',
      end: '17:00'
    }
  }
}

export default function TestDualProposalPage() {
  const [dualProposals, setDualProposals] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProposal, setEditingProposal] = useState<any>(null)

  const handleSaveDualProposal = (dualProposal: any) => {
    console.log('Saving dual proposal:', dualProposal)
    
    if (editingProposal) {
      setDualProposals(prev => prev.map(p => p.id === editingProposal.id ? { ...dualProposal, id: editingProposal.id } : p))
      setEditingProposal(null)
    } else {
      const newDualProposal = {
        ...dualProposal,
        id: `dual-proposal-${Date.now()}`,
        createdAt: new Date().toISOString()
      }
      setDualProposals(prev => [newDualProposal, ...prev])
    }
    
    setShowForm(false)
    alert('Propuesta dual guardada exitosamente')
  }

  const handleSubmitDualProposal = (dualProposal: any) => {
    console.log('Submitting dual proposal:', dualProposal)
    
    const submittedDualProposal = {
      ...dualProposal,
      id: dualProposal.id || `dual-proposal-${Date.now()}`,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      createdAt: dualProposal.createdAt || new Date().toISOString()
    }
    
    setDualProposals(prev => [submittedDualProposal, ...prev])
    setShowForm(false)
    alert('Propuesta dual enviada para revisión')
  }

  const handlePreviewDualProposal = (dualProposal: any) => {
    console.log('Previewing dual proposal:', dualProposal)
    alert('Vista previa de la propuesta dual')
  }

  const handleEditDualProposal = (dualProposal: any) => {
    setEditingProposal(dualProposal)
    setShowForm(true)
  }

  const handleDeleteDualProposal = (dualProposalId: string) => {
    setDualProposals(prev => prev.filter(p => p.id !== dualProposalId))
    alert('Propuesta dual eliminada')
  }

  // Calculate statistics
  const stats = {
    totalDualProposals: dualProposals.length,
    draftDualProposals: dualProposals.filter(p => p.status === 'DRAFT').length,
    submittedDualProposals: dualProposals.filter(p => p.status === 'SUBMITTED').length,
    approvedDualProposals: dualProposals.filter(p => p.status === 'APPROVED').length,
    totalSessionsA: dualProposals.reduce((sum, p) => sum + p.proposalA.totalSessions, 0),
    totalSessionsB: dualProposals.reduce((sum, p) => sum + p.proposalB.totalSessions, 0),
    totalCostA: dualProposals.reduce((sum, p) => sum + p.proposalA.estimatedCost, 0),
    totalCostB: dualProposals.reduce((sum, p) => sum + p.proposalB.estimatedCost, 0)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <GitCompare className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Sistema de Propuestas Duales</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo para crear propuestas duales (A y B) que permiten a los terapeutas 
        ofrecer múltiples opciones de tratamiento con comparación automática y recomendaciones.
      </p>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Propuestas Duales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Crea dos propuestas diferentes (A y B) para el mismo paciente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
              Comparación Automática
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Comparación automática de sesiones, duración y costos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-purple-600" />
              Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Sistema de recomendaciones con justificación del terapeuta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Copy className="h-4 w-4 mr-2 text-orange-600" />
              Copia de Servicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Copia servicios entre propuestas A y B fácilmente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Duales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDualProposals}</div>
            <p className="text-xs text-muted-foreground">Creadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Borradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftDualProposals}</div>
            <p className="text-xs text-muted-foreground">En progreso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submittedDualProposals}</div>
            <p className="text-xs text-muted-foreground">Para revisión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedDualProposals}</div>
            <p className="text-xs text-muted-foreground">Aprobadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sesiones A</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalSessionsA}</div>
            <p className="text-xs text-muted-foreground">Propuesta A</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sesiones B</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalSessionsB}</div>
            <p className="text-xs text-muted-foreground">Propuesta B</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo A</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${stats.totalCostA.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Propuesta A</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo B</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${stats.totalCostB.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Propuesta B</p>
          </CardContent>
        </Card>
      </div>

      {/* Dual Proposal Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Beneficios del Sistema Dual</CardTitle>
          <CardDescription>
            Ventajas de ofrecer múltiples opciones de tratamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Lightbulb className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-medium">Flexibilidad</h3>
              <p className="text-sm text-muted-foreground">Múltiples opciones para diferentes necesidades</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Calculator className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-medium">Comparación</h3>
              <p className="text-sm text-muted-foreground">Análisis automático de costos y beneficios</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-medium">Personalización</h3>
              <p className="text-sm text-muted-foreground">Opciones adaptadas a cada paciente</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-medium">Recomendación</h3>
              <p className="text-sm text-muted-foreground">Guía experta del terapeuta</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Propuestas Duales</h2>
          <p className="text-muted-foreground">
            Gestiona las propuestas duales para tus pacientes
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Propuesta Dual
        </Button>
      </div>

      {/* Dual Proposals List */}
      {dualProposals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay propuestas duales creadas</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera propuesta dual para comenzar
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Propuesta Dual
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dualProposals.map((dualProposal) => (
            <Card key={dualProposal.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {dualProposal.patientId === 'patient-1' ? 'Juan Pérez' : 'Paciente'}
                    </CardTitle>
                    <CardDescription>
                      Propuesta Dual • {dualProposal.proposalA.totalSessions + dualProposal.proposalB.totalSessions} sesiones totales
                    </CardDescription>
                  </div>
                  <Badge variant={
                    dualProposal.status === 'DRAFT' ? 'secondary' :
                    dualProposal.status === 'SUBMITTED' ? 'default' :
                    dualProposal.status === 'APPROVED' ? 'default' : 'destructive'
                  }>
                    {dualProposal.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 border rounded">
                      <div className="text-lg font-bold text-blue-600">{dualProposal.proposalA.totalSessions}</div>
                      <div className="text-xs text-muted-foreground">Sesiones A</div>
                    </div>
                    <div className="text-center p-2 border rounded">
                      <div className="text-lg font-bold text-green-600">{dualProposal.proposalB.totalSessions}</div>
                      <div className="text-xs text-muted-foreground">Sesiones B</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Diferencia en sesiones:</span>
                    <span className={dualProposal.comparison.sessionDifference > 0 ? 'text-green-600' : 'text-red-600'}>
                      {dualProposal.comparison.sessionDifference > 0 ? '+' : ''}{dualProposal.comparison.sessionDifference}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Diferencia en costo:</span>
                    <span className={dualProposal.comparison.costDifference > 0 ? 'text-green-600' : 'text-red-600'}>
                      {dualProposal.comparison.costDifference > 0 ? '+' : ''}${dualProposal.comparison.costDifference}
                    </span>
                  </div>
                  
                  {dualProposal.recommendation.preferredProposal !== 'NONE' && (
                    <div className="flex items-center justify-between text-sm">
                      <span>Recomendación:</span>
                      <Badge variant="outline" className={
                        dualProposal.recommendation.preferredProposal === 'A' ? 'text-blue-600' : 'text-green-600'
                      }>
                        Propuesta {dualProposal.recommendation.preferredProposal}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditDualProposal(dualProposal)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewDualProposal(dualProposal)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteDualProposal(dualProposal.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dual Proposal Creation Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-7xl max-h-[90vh] overflow-y-auto">
            <DualProposalSystem
              patient={mockPatient}
              therapist={mockTherapist}
              services={mockServices}
              onSave={handleSaveDualProposal}
              onSubmit={handleSubmitDualProposal}
              onPreview={handlePreviewDualProposal}
              onCancel={() => {
                setShowForm(false)
                setEditingProposal(null)
              }}
              initialDualProposal={editingProposal}
              isEditing={!!editingProposal}
            />
          </div>
        </div>
      )}

      {/* Technical Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema permite crear propuestas duales (A y B) 
          que ofrecen múltiples opciones de tratamiento para el mismo paciente. Incluye comparación 
          automática de sesiones, duración y costos, sistema de recomendaciones con justificación 
          del terapeuta, copia de servicios entre propuestas, validación de sesiones, y cálculo 
          automático de diferencias. Los terapeutas pueden recomendar una propuesta específica 
          con beneficios y consideraciones detalladas.
        </AlertDescription>
      </Alert>
    </div>
  )
}
