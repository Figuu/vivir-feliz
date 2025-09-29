'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  BarChart3,
  FileText,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { MedicalHistoryVisualization } from './medical-history-visualization'
import { MedicalHistoryAnalytics } from './medical-history-analytics'

interface PatientMedicalHistory {
  id: string
  patientInfo: {
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
  }
  medicalHistory: {
    birthHistory: any
    developmentalMilestones: any
    medicalConditions: any
    familyHistory: any
  }
  createdAt: string
  completedAt?: string
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEWED' | 'APPROVED'
}

interface MedicalHistoryDashboardProps {
  initialData?: PatientMedicalHistory[]
  onExport?: (data: PatientMedicalHistory[]) => void
  onRefresh?: () => Promise<PatientMedicalHistory[]>
  showPatientView?: boolean
  showAnalytics?: boolean
}

export function MedicalHistoryDashboard({ 
  initialData = [], 
  onExport, 
  onRefresh,
  showPatientView = true,
  showAnalytics = true
}: MedicalHistoryDashboardProps) {
  const [data, setData] = useState<PatientMedicalHistory[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedPatient, setSelectedPatient] = useState<PatientMedicalHistory | null>(null)
  const [activeTab, setActiveTab] = useState('list')

  // Filter data based on search and status
  const filteredData = data.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.patientInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.patientInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh) return
    
    setLoading(true)
    try {
      const newData = await onRefresh()
      setData(newData)
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport(filteredData)
    }
  }

  // Calculate statistics
  const stats = {
    total: data.length,
    completed: data.filter(item => item.status === 'COMPLETED').length,
    inProgress: data.filter(item => item.status === 'IN_PROGRESS').length,
    draft: data.filter(item => item.status === 'DRAFT').length,
    approved: data.filter(item => item.status === 'APPROVED').length
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Borrador',
    IN_PROGRESS: 'En Progreso',
    COMPLETED: 'Completado',
    REVIEWED: 'Revisado',
    APPROVED: 'Aprobado'
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    REVIEWED: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-purple-100 text-purple-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Historial Médico</h1>
          <p className="text-muted-foreground">
            Gestión y análisis de historiales médicos de pacientes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Actualizar</span>
            </Button>
          )}
          {onExport && (
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4" />
              <span className="ml-2">Exportar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Pacientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Completados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              En Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.inProgress / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Borradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.draft / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Aprobados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar Paciente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre o apellido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="COMPLETED">Completado</SelectItem>
                  <SelectItem value="REVIEWED">Revisado</SelectItem>
                  <SelectItem value="APPROVED">Aprobado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Resultados</label>
              <div className="text-sm text-muted-foreground">
                {filteredData.length} de {data.length} pacientes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Lista de Pacientes</TabsTrigger>
          {showPatientView && (
            <TabsTrigger value="patient" disabled={!selectedPatient}>
              Historial del Paciente
            </TabsTrigger>
          )}
          {showAnalytics && (
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Pacientes</CardTitle>
              <CardDescription>
                Selecciona un paciente para ver su historial médico detallado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredData.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No se encontraron pacientes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredData.map((patient) => (
                    <div
                      key={patient.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedPatient?.id === patient.id ? 'bg-muted border-primary' : ''
                      }`}
                      onClick={() => {
                        setSelectedPatient(patient)
                        if (showPatientView) setActiveTab('patient')
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="font-medium">
                              {patient.patientInfo.firstName} {patient.patientInfo.lastName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(patient.patientInfo.dateOfBirth).toLocaleDateString()} • 
                              {patient.patientInfo.gender === 'MALE' ? ' Masculino' : ' Femenino'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={statusColors[patient.status]}>
                            {statusLabels[patient.status]}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedPatient(patient)
                              if (showPatientView) setActiveTab('patient')
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {showPatientView && (
          <TabsContent value="patient" className="space-y-4">
            {selectedPatient ? (
              <MedicalHistoryVisualization
                data={selectedPatient.medicalHistory}
                patientInfo={selectedPatient.patientInfo}
                showExport={true}
                onExport={() => {
                  // Export individual patient data
                  if (onExport) {
                    onExport([selectedPatient])
                  }
                }}
              />
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Selecciona un paciente para ver su historial</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {showAnalytics && (
          <TabsContent value="analytics" className="space-y-4">
            <MedicalHistoryAnalytics
              data={filteredData}
              onExport={handleExport}
              onRefresh={onRefresh ? handleRefresh : undefined}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
