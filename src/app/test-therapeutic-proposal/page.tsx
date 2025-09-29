'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
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
  Upload
} from 'lucide-react'
import { ProposalCreationForm } from '@/components/therapeutic-proposal/proposal-creation-form'

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

export default function TestTherapeuticProposalPage() {
  const [proposals, setProposals] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProposal, setEditingProposal] = useState<any>(null)

  const handleSaveProposal = (proposal: any) => {
    console.log('Saving proposal:', proposal)
    
    if (editingProposal) {
      setProposals(prev => prev.map(p => p.id === editingProposal.id ? { ...proposal, id: editingProposal.id } : p))
      setEditingProposal(null)
    } else {
      const newProposal = {
        ...proposal,
        id: `proposal-${Date.now()}`,
        createdAt: new Date().toISOString()
      }
      setProposals(prev => [newProposal, ...prev])
    }
    
    setShowForm(false)
    alert('Propuesta guardada exitosamente')
  }

  const handleSubmitProposal = (proposal: any) => {
    console.log('Submitting proposal:', proposal)
    
    const submittedProposal = {
      ...proposal,
      id: proposal.id || `proposal-${Date.now()}`,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      createdAt: proposal.createdAt || new Date().toISOString()
    }
    
    setProposals(prev => [submittedProposal, ...prev])
    setShowForm(false)
    alert('Propuesta enviada para revisión')
  }

  const handlePreviewProposal = (proposal: any) => {
    console.log('Previewing proposal:', proposal)
    alert('Vista previa de la propuesta')
  }

  const handleEditProposal = (proposal: any) => {
    setEditingProposal(proposal)
    setShowForm(true)
  }

  const handleDeleteProposal = (proposalId: string) => {
    setProposals(prev => prev.filter(p => p.id !== proposalId))
    alert('Propuesta eliminada')
  }

  // Calculate statistics
  const stats = {
    totalProposals: proposals.length,
    draftProposals: proposals.filter(p => p.status === 'DRAFT').length,
    submittedProposals: proposals.filter(p => p.status === 'SUBMITTED').length,
    approvedProposals: proposals.filter(p => p.status === 'APPROVED').length,
    totalSessions: proposals.reduce((sum, p) => sum + p.totalSessions, 0),
    totalCost: proposals.reduce((sum, p) => sum + p.estimatedCost, 0)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Sistema de Creación de Propuestas Terapéuticas</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo para que los terapeutas creen propuestas terapéuticas personalizadas 
        seleccionando servicios del catálogo con validación y configuración avanzada.
      </p>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Selección de Servicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Selecciona servicios del catálogo con filtros avanzados y búsqueda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Settings className="h-4 w-4 mr-2 text-blue-600" />
              Configuración Avanzada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Configura sesiones, prioridades, fechas y notas por servicio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Eye className="h-4 w-4 mr-2 text-purple-600" />
              Vista Previa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Vista previa completa de la propuesta antes de enviar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Send className="h-4 w-4 mr-2 text-orange-600" />
              Envío y Seguimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Envía propuestas para revisión y sigue su estado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Propuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProposals}</div>
            <p className="text-xs text-muted-foreground">Creadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Borradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftProposals}</div>
            <p className="text-xs text-muted-foreground">En progreso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submittedProposals}</div>
            <p className="text-xs text-muted-foreground">Para revisión</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedProposals}</div>
            <p className="text-xs text-muted-foreground">Aprobadas</p>
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
            <div className="text-2xl font-bold">${stats.totalCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Estimado</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Servicios Disponibles</CardTitle>
          <CardDescription>
            Diferentes tipos de servicios que pueden incluirse en las propuestas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <UserCheck className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-medium">Evaluación</h3>
              <p className="text-sm text-muted-foreground">Evaluaciones iniciales y diagnósticas</p>
              <Badge variant="outline" className="mt-2">
                {mockServices.filter(s => s.type === 'EVALUATION').length} servicios
              </Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Heart className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-medium">Tratamiento</h3>
              <p className="text-sm text-muted-foreground">Sesiones de terapia y tratamiento</p>
              <Badge variant="outline" className="mt-2">
                {mockServices.filter(s => s.type === 'TREATMENT').length} servicios
              </Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-medium">Consulta</h3>
              <p className="text-sm text-muted-foreground">Consultas y orientaciones</p>
              <Badge variant="outline" className="mt-2">
                {mockServices.filter(s => s.type === 'CONSULTATION').length} servicios
              </Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Calendar className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-medium">Seguimiento</h3>
              <p className="text-sm text-muted-foreground">Sesiones de seguimiento</p>
              <Badge variant="outline" className="mt-2">
                {mockServices.filter(s => s.type === 'FOLLOW_UP').length} servicios
              </Badge>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Brain className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h3 className="font-medium">Evaluación</h3>
              <p className="text-sm text-muted-foreground">Evaluaciones especializadas</p>
              <Badge variant="outline" className="mt-2">
                {mockServices.filter(s => s.type === 'ASSESSMENT').length} servicios
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Propuestas Terapéuticas</h2>
          <p className="text-muted-foreground">
            Gestiona las propuestas terapéuticas para tus pacientes
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Propuesta
        </Button>
      </div>

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay propuestas creadas</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera propuesta terapéutica para comenzar
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Propuesta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {proposal.patientId === 'patient-1' ? 'Juan Pérez' : 'Paciente'}
                    </CardTitle>
                    <CardDescription>
                      {proposal.totalSessions} sesiones • {Math.round(proposal.estimatedDuration / 60)}h
                    </CardDescription>
                  </div>
                  <Badge variant={
                    proposal.status === 'DRAFT' ? 'secondary' :
                    proposal.status === 'SUBMITTED' ? 'default' :
                    proposal.status === 'APPROVED' ? 'default' : 'destructive'
                  }>
                    {proposal.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Servicios:</span>
                    <span>{proposal.selectedServices.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Costo estimado:</span>
                    <span>${proposal.estimatedCost}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Prioridad:</span>
                    <Badge variant="outline" className={
                      proposal.priority === 'HIGH' ? 'text-red-600' :
                      proposal.priority === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                    }>
                      {proposal.priority}
                    </Badge>
                  </div>
                  
                  {proposal.notes && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Notas:</strong> {proposal.notes.substring(0, 100)}...
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProposal(proposal)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewProposal(proposal)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProposal(proposal.id)}
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

      {/* Proposal Creation Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <ProposalCreationForm
              patient={mockPatient}
              therapist={mockTherapist}
              services={mockServices}
              onSave={handleSaveProposal}
              onSubmit={handleSubmitProposal}
              onPreview={handlePreviewProposal}
              onCancel={() => {
                setShowForm(false)
                setEditingProposal(null)
              }}
              initialProposal={editingProposal}
              isEditing={!!editingProposal}
            />
          </div>
        </div>
      )}

      {/* Technical Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema permite a los terapeutas crear propuestas 
          terapéuticas personalizadas seleccionando servicios del catálogo. Incluye filtros avanzados, 
          configuración de sesiones por servicio, prioridades, fechas estimadas, notas específicas, 
          vista previa completa, y envío para revisión. Los precios están ocultos para los terapeutas, 
          mostrando solo sesiones, duración y detalles del servicio.
        </AlertDescription>
      </Alert>
    </div>
  )
}
