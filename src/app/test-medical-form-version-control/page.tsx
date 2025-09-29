'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  GitBranch, 
  History, 
  RotateCcw, 
  GitCompare, 
  Download, 
  Tag,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  User,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
  Plus,
  Move
} from 'lucide-react'
import { MedicalFormVersionControl } from '@/components/medical-form/medical-form-version-control'
import { VersionHistoryTimeline } from '@/components/medical-form/version-history-timeline'

// Mock data for testing
const mockCurrentUser = {
  id: 'current-user',
  name: 'Dr. María González',
  email: 'maria@therapycenter.com',
  role: 'THERAPIST' as const,
  avatar: undefined
}

const mockVersions = [
  {
    id: 'version-1',
    version: '1.0.0',
    title: 'Versión Inicial',
    description: 'Primera versión del formulario de evaluación pediátrica',
    formData: { name: 'Juan', age: '4' },
    changes: [
      {
        id: 'change-1',
        type: 'ADD' as const,
        sectionId: 'personal-info',
        fieldId: 'name',
        fieldName: 'Nombre',
        description: 'Agregado campo de nombre',
        timestamp: '2024-01-15T10:00:00Z'
      },
      {
        id: 'change-2',
        type: 'ADD' as const,
        sectionId: 'personal-info',
        fieldId: 'age',
        fieldName: 'Edad',
        description: 'Agregado campo de edad',
        timestamp: '2024-01-15T10:01:00Z'
      }
    ],
    createdBy: mockCurrentUser,
    createdAt: '2024-01-15T10:00:00Z',
    isCurrent: false,
    isDraft: false,
    tags: ['initial', 'stable'],
    parentVersionId: undefined
  },
  {
    id: 'version-2',
    version: '1.1.0',
    title: 'Agregado Historial Médico',
    description: 'Se agregó sección completa de historial médico con validaciones',
    formData: { name: 'Juan', age: '4', medicalHistory: 'Ninguna condición conocida' },
    changes: [
      {
        id: 'change-3',
        type: 'ADD' as const,
        sectionId: 'medical-history',
        fieldId: 'conditions',
        fieldName: 'Condiciones Médicas',
        description: 'Agregada sección de historial médico',
        timestamp: '2024-01-20T14:30:00Z'
      },
      {
        id: 'change-4',
        type: 'MODIFY' as const,
        sectionId: 'personal-info',
        fieldId: 'age',
        fieldName: 'Edad',
        oldValue: '4',
        newValue: '4 años',
        description: 'Mejorado formato del campo edad',
        timestamp: '2024-01-20T14:31:00Z'
      }
    ],
    createdBy: mockCurrentUser,
    createdAt: '2024-01-20T14:30:00Z',
    isCurrent: false,
    isDraft: false,
    tags: ['stable'],
    parentVersionId: 'version-1'
  },
  {
    id: 'version-3',
    version: '2.0.0',
    title: 'Reestructuración Completa',
    description: 'Reestructuración completa del formulario con nuevas secciones y validaciones mejoradas',
    formData: { 
      name: 'Juan', 
      age: '4 años', 
      medicalHistory: 'Ninguna condición conocida',
      familyHistory: 'Sin antecedentes familiares relevantes',
      developmentalHistory: 'Desarrollo normal para la edad'
    },
    changes: [
      {
        id: 'change-5',
        type: 'ADD' as const,
        sectionId: 'family-history',
        fieldId: 'familyConditions',
        fieldName: 'Antecedentes Familiares',
        description: 'Agregada sección de antecedentes familiares',
        timestamp: '2024-01-25T09:15:00Z'
      },
      {
        id: 'change-6',
        type: 'ADD' as const,
        sectionId: 'developmental-history',
        fieldId: 'milestones',
        fieldName: 'Hitos del Desarrollo',
        description: 'Agregada sección de hitos del desarrollo',
        timestamp: '2024-01-25T09:16:00Z'
      },
      {
        id: 'change-7',
        type: 'MODIFY' as const,
        sectionId: 'medical-history',
        fieldId: 'conditions',
        fieldName: 'Condiciones Médicas',
        oldValue: 'Campo simple',
        newValue: 'Campo con validación mejorada',
        description: 'Mejoradas validaciones del historial médico',
        timestamp: '2024-01-25T09:17:00Z'
      }
    ],
    createdBy: mockCurrentUser,
    createdAt: '2024-01-25T09:15:00Z',
    isCurrent: true,
    isDraft: false,
    tags: ['stable', 'major-update'],
    parentVersionId: 'version-2'
  },
  {
    id: 'version-4',
    version: '2.1.0-draft',
    title: 'Mejoras de Accesibilidad',
    description: 'Mejoras en accesibilidad y experiencia de usuario (borrador)',
    formData: { 
      name: 'Juan', 
      age: '4 años', 
      medicalHistory: 'Ninguna condición conocida',
      familyHistory: 'Sin antecedentes familiares relevantes',
      developmentalHistory: 'Desarrollo normal para la edad',
      accessibility: 'Formulario optimizado para lectores de pantalla'
    },
    changes: [
      {
        id: 'change-8',
        type: 'ADD' as const,
        sectionId: 'accessibility',
        fieldId: 'screenReader',
        fieldName: 'Optimización para Lectores de Pantalla',
        description: 'Agregadas mejoras de accesibilidad',
        timestamp: '2024-01-28T16:45:00Z'
      }
    ],
    createdBy: mockCurrentUser,
    createdAt: '2024-01-28T16:45:00Z',
    isCurrent: false,
    isDraft: true,
    tags: ['draft', 'accessibility'],
    parentVersionId: 'version-3'
  }
]

const mockBranches = [
  {
    id: 'branch-1',
    name: 'feature/behavioral-assessment',
    description: 'Desarrollo de nueva sección de evaluación conductual',
    baseVersionId: 'version-2',
    currentVersionId: 'version-2',
    createdBy: mockCurrentUser,
    createdAt: '2024-01-22T11:00:00Z',
    isActive: true,
    isMerged: false
  },
  {
    id: 'branch-2',
    name: 'hotfix/validation-bug',
    description: 'Corrección de bug en validación de fechas',
    baseVersionId: 'version-1',
    currentVersionId: 'version-1',
    createdBy: mockCurrentUser,
    createdAt: '2024-01-18T15:30:00Z',
    isActive: false,
    isMerged: true,
    mergedAt: '2024-01-19T10:00:00Z',
    mergedBy: mockCurrentUser
  }
]

export default function TestMedicalFormVersionControlPage() {
  const [activeView, setActiveView] = useState<'control' | 'timeline'>('control')
  const [versions, setVersions] = useState(mockVersions)
  const [branches, setBranches] = useState(mockBranches)
  const [currentVersion] = useState(mockVersions.find(v => v.isCurrent) || mockVersions[0])

  const handleCreateVersion = (version: any) => {
    console.log('Creating version:', version)
    const newVersion = {
      ...version,
      id: `version-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    setVersions(prev => [newVersion, ...prev])
    alert('Versión creada exitosamente')
  }

  const handleRestoreVersion = (versionId: string) => {
    console.log('Restoring version:', versionId)
    setVersions(prev => prev.map(v => ({ ...v, isCurrent: v.id === versionId })))
    alert('Versión restaurada exitosamente')
  }

  const handleCreateBranch = (branch: any) => {
    console.log('Creating branch:', branch)
    const newBranch = {
      ...branch,
      id: `branch-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    setBranches(prev => [newBranch, ...prev])
    alert('Rama creada exitosamente')
  }

  const handleMergeBranch = (branchId: string, targetVersionId: string) => {
    console.log('Merging branch:', branchId, 'to version:', targetVersionId)
    setBranches(prev => prev.map(b => 
      b.id === branchId 
        ? { ...b, isActive: false, isMerged: true, mergedAt: new Date().toISOString(), mergedBy: mockCurrentUser }
        : b
    ))
    alert('Rama fusionada exitosamente')
  }

  const handleCompareVersions = (version1Id: string, version2Id: string) => {
    console.log('Comparing versions:', version1Id, 'vs', version2Id)
    alert('Comparación de versiones iniciada')
  }

  const handleDeleteVersion = (versionId: string) => {
    console.log('Deleting version:', versionId)
    setVersions(prev => prev.filter(v => v.id !== versionId))
    alert('Versión eliminada')
  }

  const handleTagVersion = (versionId: string, tag: string) => {
    console.log('Tagging version:', versionId, 'with tag:', tag)
    setVersions(prev => prev.map(v => 
      v.id === versionId 
        ? { ...v, tags: [...v.tags, tag] }
        : v
    ))
    alert(`Versión etiquetada como "${tag}"`)
  }

  const handleVersionSelect = (version: any) => {
    console.log('Selected version:', version)
    alert(`Versión "${version.title}" seleccionada`)
  }

  const handleVersionDownload = (versionId: string) => {
    console.log('Downloading version:', versionId)
    alert('Descarga de versión iniciada')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <GitBranch className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Sistema de Control de Versiones de Formularios Médicos</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo para control de versiones, historial de cambios, ramas de desarrollo y comparación de formularios médicos.
      </p>

      {/* View Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Vista</CardTitle>
          <CardDescription>
            Elige entre la vista de control de versiones o la vista de timeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={activeView === 'control' ? 'default' : 'outline'}
              onClick={() => setActiveView('control')}
              className="h-auto p-4"
            >
              <div className="text-center">
                <GitBranch className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Control de Versiones</div>
                <div className="text-sm text-muted-foreground">
                  Gestión completa de versiones y ramas
                </div>
              </div>
            </Button>

            <Button
              variant={activeView === 'timeline' ? 'default' : 'outline'}
              onClick={() => setActiveView('timeline')}
              className="h-auto p-4"
            >
              <div className="text-center">
                <History className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Timeline de Versiones</div>
                <div className="text-sm text-muted-foreground">
                  Vista cronológica del historial
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
              Control de Versiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Historial completo de cambios con versionado semántico y etiquetas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <GitBranch className="h-4 w-4 mr-2 text-blue-600" />
              Ramas de Desarrollo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Desarrollo paralelo con ramas para features y hotfixes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <GitCompare className="h-4 w-4 mr-2 text-purple-600" />
              Comparación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Comparación detallada entre versiones con diff visual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <RotateCcw className="h-4 w-4 mr-2 text-orange-600" />
              Rollback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Restauración de versiones anteriores con un clic
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Versiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{versions.length}</div>
            <p className="text-xs text-muted-foreground">Versiones creadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ramas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {branches.filter(b => b.isActive && !b.isMerged).length}
            </div>
            <p className="text-xs text-muted-foreground">En desarrollo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cambios Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {versions.reduce((sum, v) => sum + v.changes.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Modificaciones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Versiones Estables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {versions.filter(v => v.tags.includes('stable')).length}
            </div>
            <p className="text-xs text-muted-foreground">Etiquetadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {activeView === 'control' && (
        <MedicalFormVersionControl
          formId="form-123"
          formTitle="Evaluación Pediátrica - Juan Pérez"
          currentVersion={currentVersion}
          versions={versions}
          branches={branches}
          currentUser={mockCurrentUser}
          onCreateVersion={handleCreateVersion}
          onRestoreVersion={handleRestoreVersion}
          onCreateBranch={handleCreateBranch}
          onMergeBranch={handleMergeBranch}
          onCompareVersions={handleCompareVersions}
          onDeleteVersion={handleDeleteVersion}
          onTagVersion={handleTagVersion}
        />
      )}

      {activeView === 'timeline' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Versiones</CardTitle>
              <CardDescription>
                Vista cronológica del historial de versiones del formulario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VersionHistoryTimeline
                versions={versions}
                onVersionSelect={handleVersionSelect}
                onVersionRestore={handleRestoreVersion}
                onVersionCompare={handleCompareVersions}
                onVersionDownload={handleVersionDownload}
                onVersionTag={handleTagVersion}
                showChanges={true}
                maxChanges={3}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Technical Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema incluye control de versiones completo con 
          versionado semántico, ramas de desarrollo para features y hotfixes, comparación visual entre 
          versiones, rollback automático, etiquetado de versiones estables, y timeline interactivo. 
          Todos los cambios se rastrean con metadatos completos incluyendo autor, timestamp y descripción.
        </AlertDescription>
      </Alert>

      {/* Version Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Ejemplos de Versiones</CardTitle>
          <CardDescription>
            Diferentes tipos de versiones y sus características
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Versiones Estables</h4>
              <div className="space-y-2">
                {versions.filter(v => v.tags.includes('stable')).map((version) => (
                  <div key={version.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{version.title}</p>
                        <p className="text-sm text-muted-foreground">v{version.version}</p>
                      </div>
                      <Badge variant="default">Estable</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Ramas de Desarrollo</h4>
              <div className="space-y-2">
                {branches.map((branch) => (
                  <div key={branch.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        <p className="text-sm text-muted-foreground">{branch.description}</p>
                      </div>
                      <Badge variant={branch.isActive ? 'default' : 'secondary'}>
                        {branch.isActive ? 'Activa' : 'Fusionada'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
