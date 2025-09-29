'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  Info,
  Star,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { TherapistAssignment } from '@/components/therapeutic-proposal/therapist-assignment'

// Mock data for testing
const mockTherapists = [
  {
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
  },
  {
    id: 'therapist-2',
    name: 'Dr. Carlos Rodríguez',
    email: 'carlos@therapycenter.com',
    phone: '+1 234 567 8901',
    role: 'THERAPIST' as const,
    specialties: ['Neuropsychology', 'Adult Therapy', 'Cognitive Assessment'],
    certifications: ['Licensed Psychologist', 'Neuropsychology Specialist'],
    experience: 12,
    education: ['PhD in Clinical Psychology'],
    languages: ['Spanish', 'English', 'Portuguese'],
    availability: {
      days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
      hours: { start: '09:00', end: '18:00' },
      timezone: 'EST'
    },
    location: {
      city: 'Miami',
      state: 'FL',
      country: 'USA'
    },
    preferences: {
      maxPatientsPerDay: 6,
      preferredAgeGroups: ['18-65', '65+'],
      preferredServiceTypes: ['ASSESSMENT', 'EVALUATION'],
      workingHours: { start: '09:00', end: '18:00' }
    },
    performance: {
      averageRating: 4.9,
      totalPatients: 200,
      completionRate: 98,
      patientSatisfaction: 95
    },
    isActive: true,
    isAvailable: true,
    currentWorkload: 4,
    maxWorkload: 6,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  }
]

const mockServices = [
  {
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
    type: 'EVALUATION' as const,
    duration: 120,
    price: 150,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 1,
    minSessions: 1,
    ageRange: { min: 2, max: 18 },
    tags: ['pediatric', 'evaluation', 'development']
  }
]

const mockProposal = {
  id: 'proposal-123',
  patientId: 'patient-1',
  therapistId: '',
  selectedServices: [
    {
      service: mockServices[0],
      sessionCount: 1,
      notes: 'Evaluación inicial',
      priority: 'HIGH' as const
    }
  ],
  totalSessions: 1,
  estimatedDuration: 120,
  estimatedCost: 150,
  currency: 'USD',
  status: 'SUBMITTED' as const,
  priority: 'HIGH' as const,
  notes: 'Paciente con retraso en el desarrollo del lenguaje',
  goals: ['Mejorar comunicación'],
  expectedOutcomes: ['Comunicación funcional'],
  followUpRequired: true,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  submittedAt: '2024-01-15T10:00:00Z'
}

export default function TestTherapistAssignmentPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)

  const handleAssignTherapist = (assignment: any) => {
    console.log('Assigning therapist:', assignment)
    const newAssignment = {
      ...assignment,
      id: `assignment-${Date.now()}`,
      assignedAt: new Date().toISOString()
    }
    setAssignments(prev => [newAssignment, ...prev])
    setShowForm(false)
    alert('Terapeuta asignado exitosamente')
  }

  const handleUnassignTherapist = (assignmentId: string) => {
    setAssignments(prev => prev.filter(a => a.id !== assignmentId))
    alert('Asignación cancelada')
  }

  const handleUpdateAssignment = (assignment: any) => {
    setAssignments(prev => prev.map(a => a.id === assignment.id ? assignment : a))
    setShowForm(false)
    alert('Asignación actualizada exitosamente')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Users className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Sistema de Asignación de Terapeutas</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo para asignar terapeutas a propuestas basado en especialidades, 
        disponibilidad, experiencia y criterios de validación avanzados.
      </p>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Asignaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">Realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Terapeutas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTherapists.length}</div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockTherapists.filter(t => t.isAvailable).length}</div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Puntuación Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments.length > 0 ? 
                Math.round(assignments.reduce((sum, a) => sum + a.matchScore, 0) / assignments.length) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Coincidencia</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Asignaciones de Terapeutas</h2>
          <p className="text-muted-foreground">
            Gestiona las asignaciones de terapeutas a propuestas
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Asignación
        </Button>
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay asignaciones realizadas</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera asignación de terapeuta
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Asignación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{assignment.therapist.name}</CardTitle>
                    <CardDescription>
                      Propuesta: {assignment.proposalId}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {assignment.matchScore}% coincidencia
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Especialidades:</span>
                    <span>{assignment.therapist.specialties.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Experiencia:</span>
                    <span>{assignment.therapist.experience} años</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Carga de trabajo:</span>
                    <span>{Math.round((assignment.therapist.currentWorkload / assignment.therapist.maxWorkload) * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Therapist Assignment Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <TherapistAssignment
              proposal={mockProposal}
              therapists={mockTherapists}
              services={mockServices}
              onAssign={handleAssignTherapist}
              onUnassign={handleUnassignTherapist}
              onUpdate={handleUpdateAssignment}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Technical Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema permite asignar terapeutas a propuestas 
          basándose en especialidades, experiencia, disponibilidad y criterios de validación. 
          Incluye filtros avanzados, cálculo de puntuación de coincidencia, validación de criterios, 
          análisis de rendimiento, gestión de carga de trabajo, y sistema de recomendaciones 
          automáticas.
        </AlertDescription>
      </Alert>
    </div>
  )
}