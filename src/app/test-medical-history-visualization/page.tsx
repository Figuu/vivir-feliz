'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  BarChart3, 
  Users, 
  Download, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'
import { MedicalHistoryDashboard } from '@/components/medical-form/medical-history-dashboard'
import { MedicalHistoryVisualization } from '@/components/medical-form/medical-history-visualization'
import { MedicalHistoryAnalytics } from '@/components/medical-form/medical-history-analytics'

// Mock data for testing
const mockPatientData = [
  {
    id: '1',
    patientInfo: {
      firstName: 'María',
      lastName: 'González',
      dateOfBirth: '2020-03-15',
      gender: 'FEMALE'
    },
    medicalHistory: {
      birthHistory: {
        gestationalAge: 38,
        birthWeight: 3.2,
        birthLength: 50,
        deliveryMethod: 'VAGINAL',
        complications: 'Ninguna',
        apgarScore: {
          oneMinute: 9,
          fiveMinute: 10
        }
      },
      developmentalMilestones: {
        firstSmile: '6 semanas',
        firstSit: '6 meses',
        firstCrawl: '8 meses',
        firstWalk: '12 meses',
        firstWords: '10 meses',
        toiletTraining: '24 meses',
        concerns: 'Ligero retraso en el habla'
      },
      medicalConditions: {
        currentConditions: ['Asma leve'],
        pastConditions: ['Infección de oído'],
        hospitalizations: [
          {
            date: '2021-05-10',
            reason: 'Bronquitis',
            duration: '3 días',
            hospital: 'Hospital San Juan'
          }
        ],
        surgeries: []
      },
      familyHistory: {
        mentalHealthConditions: ['Depresión materna'],
        physicalConditions: ['Diabetes tipo 2 (abuelo)'],
        geneticConditions: [],
        substanceAbuse: [],
        other: 'Historial de alergias en la familia materna'
      }
    },
    createdAt: '2024-01-15T10:00:00Z',
    completedAt: '2024-01-20T15:30:00Z',
    status: 'COMPLETED' as const
  },
  {
    id: '2',
    patientInfo: {
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      dateOfBirth: '2019-08-22',
      gender: 'MALE'
    },
    medicalHistory: {
      birthHistory: {
        gestationalAge: 36,
        birthWeight: 2.8,
        birthLength: 48,
        deliveryMethod: 'CESAREAN',
        complications: 'Parto prematuro',
        apgarScore: {
          oneMinute: 7,
          fiveMinute: 9
        }
      },
      developmentalMilestones: {
        firstSmile: '8 semanas',
        firstSit: '7 meses',
        firstCrawl: '9 meses',
        firstWalk: '14 meses',
        firstWords: '12 meses',
        toiletTraining: '30 meses',
        concerns: 'Retraso en el desarrollo motor'
      },
      medicalConditions: {
        currentConditions: ['TDAH', 'Trastorno del espectro autista'],
        pastConditions: ['Infecciones respiratorias recurrentes'],
        hospitalizations: [
          {
            date: '2019-09-01',
            reason: 'Prematuridad',
            duration: '2 semanas',
            hospital: 'Hospital Materno Infantil'
          }
        ],
        surgeries: [
          {
            date: '2020-03-10',
            procedure: 'Adenoidectomía',
            surgeon: 'Dr. López',
            hospital: 'Hospital San Juan'
          }
        ]
      },
      familyHistory: {
        mentalHealthConditions: ['TDAH (padre)', 'Ansiedad (madre)'],
        physicalConditions: ['Hipertensión (abuela)'],
        geneticConditions: ['Síndrome de Down (primo)'],
        substanceAbuse: [],
        other: 'Historial de problemas de aprendizaje en la familia'
      }
    },
    createdAt: '2024-01-10T09:00:00Z',
    completedAt: '2024-01-18T14:20:00Z',
    status: 'APPROVED' as const
  },
  {
    id: '3',
    patientInfo: {
      firstName: 'Ana',
      lastName: 'Martínez',
      dateOfBirth: '2021-12-05',
      gender: 'FEMALE'
    },
    medicalHistory: {
      birthHistory: {
        gestationalAge: 40,
        birthWeight: 3.5,
        birthLength: 52,
        deliveryMethod: 'VAGINAL',
        complications: 'Ninguna',
        apgarScore: {
          oneMinute: 10,
          fiveMinute: 10
        }
      },
      developmentalMilestones: {
        firstSmile: '4 semanas',
        firstSit: '5 meses',
        firstCrawl: '7 meses',
        firstWalk: '11 meses',
        firstWords: '8 meses',
        toiletTraining: '20 meses',
        concerns: 'Ninguna'
      },
      medicalConditions: {
        currentConditions: [],
        pastConditions: ['Catarro común'],
        hospitalizations: [],
        surgeries: []
      },
      familyHistory: {
        mentalHealthConditions: [],
        physicalConditions: ['Asma (hermano)'],
        geneticConditions: [],
        substanceAbuse: [],
        other: 'Familia saludable'
      }
    },
    createdAt: '2024-01-25T11:00:00Z',
    status: 'IN_PROGRESS' as const
  }
]

export default function TestMedicalHistoryVisualizationPage() {
  const [activeView, setActiveView] = useState<'dashboard' | 'individual' | 'analytics'>('dashboard')
  const [selectedPatient, setSelectedPatient] = useState(mockPatientData[0])

  const handleExport = (data: any) => {
    console.log('Exporting data:', data)
    // In a real application, this would trigger a download or API call
    alert(`Exportando ${data.length} registros...`)
  }

  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    return mockPatientData
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Visualización del Historial Médico</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo de visualización y análisis de historiales médicos con componentes interactivos.
      </p>

      {/* View Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Vista</CardTitle>
          <CardDescription>
            Elige entre diferentes vistas del sistema de historial médico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={activeView === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setActiveView('dashboard')}
              className="h-auto p-4"
            >
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Dashboard Completo</div>
                <div className="text-sm text-muted-foreground">
                  Vista integral con lista, detalles y análisis
                </div>
              </div>
            </Button>

            <Button
              variant={activeView === 'individual' ? 'default' : 'outline'}
              onClick={() => setActiveView('individual')}
              className="h-auto p-4"
            >
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Vista Individual</div>
                <div className="text-sm text-muted-foreground">
                  Historial detallado de un paciente específico
                </div>
              </div>
            </Button>

            <Button
              variant={activeView === 'analytics' ? 'default' : 'outline'}
              onClick={() => setActiveView('analytics')}
              className="h-auto p-4"
            >
              <div className="text-center">
                <BarChart3 className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Análisis y Estadísticas</div>
                <div className="text-sm text-muted-foreground">
                  Análisis completo de todos los historiales
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Visualización Completa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Historial médico detallado con cronología, hitos del desarrollo y factores de riesgo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
              Análisis Avanzado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Estadísticas, tendencias y análisis de patrones en los historiales médicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-purple-600" />
              Dashboard Integrado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Vista unificada con lista de pacientes, filtros y navegación intuitiva
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Download className="h-4 w-4 mr-2 text-orange-600" />
              Exportación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Exportación de datos individuales o en lote para análisis externos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {activeView === 'dashboard' && (
        <MedicalHistoryDashboard
          initialData={mockPatientData}
          onExport={handleExport}
          onRefresh={handleRefresh}
          showPatientView={true}
          showAnalytics={true}
        />
      )}

      {activeView === 'individual' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Paciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockPatientData.map((patient) => (
                  <Button
                    key={patient.id}
                    variant={selectedPatient.id === patient.id ? 'default' : 'outline'}
                    onClick={() => setSelectedPatient(patient)}
                    className="h-auto p-4"
                  >
                    <div className="text-center">
                      <div className="font-medium">
                        {patient.patientInfo.firstName} {patient.patientInfo.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(patient.patientInfo.dateOfBirth).toLocaleDateString()}
                      </div>
                      <Badge variant="secondary" className="mt-2">
                        {patient.status}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <MedicalHistoryVisualization
            data={selectedPatient.medicalHistory}
            patientInfo={selectedPatient.patientInfo}
            showExport={true}
            onExport={() => handleExport([selectedPatient])}
          />
        </div>
      )}

      {activeView === 'analytics' && (
        <MedicalHistoryAnalytics
          data={mockPatientData}
          onExport={handleExport}
          onRefresh={handleRefresh}
        />
      )}

      {/* Technical Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema incluye visualización interactiva del historial médico, 
          análisis estadístico avanzado, dashboard integrado con filtros y búsqueda, y capacidades de exportación. 
          Los componentes están optimizados para uso por terapeutas, coordinadores y administradores.
        </AlertDescription>
      </Alert>
    </div>
  )
}
