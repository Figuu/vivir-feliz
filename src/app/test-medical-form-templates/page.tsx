'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Settings, 
  Palette, 
  Users, 
  Download, 
  CheckCircle,
  AlertTriangle,
  Info,
  Star,
  Copy,
  Edit,
  Eye
} from 'lucide-react'
import { MedicalFormTemplateManager } from '@/components/medical-form/medical-form-template-manager'
import { FormTemplateSelector } from '@/components/medical-form/form-template-selector'
import { FormCustomization } from '@/components/medical-form/form-customization'

// Mock data for testing
const mockTemplates = [
  {
    id: 'template-1',
    name: 'Formulario Pediátrico Estándar',
    description: 'Formulario completo para evaluación pediátrica inicial',
    version: '2.1.0',
    isActive: true,
    isDefault: true,
    sections: [
      {
        id: 'section-1',
        title: 'Información Personal',
        description: 'Datos básicos del paciente y familia',
        fields: [
          { id: 'field-1', type: 'text', label: 'Nombre', required: true, order: 1 },
          { id: 'field-2', type: 'text', label: 'Apellido', required: true, order: 2 },
          { id: 'field-3', type: 'date', label: 'Fecha de Nacimiento', required: true, order: 3 },
          { id: 'field-4', type: 'select', label: 'Género', required: true, order: 4, options: ['Masculino', 'Femenino', 'Otro'] }
        ],
        order: 1,
        required: true
      },
      {
        id: 'section-2',
        title: 'Historial Médico',
        description: 'Información médica relevante',
        fields: [
          { id: 'field-5', type: 'textarea', label: 'Condiciones Actuales', required: false, order: 1 },
          { id: 'field-6', type: 'textarea', label: 'Medicamentos', required: false, order: 2 },
          { id: 'field-7', type: 'textarea', label: 'Alergias', required: false, order: 3 }
        ],
        order: 2,
        required: true
      }
    ],
    metadata: {
      createdBy: 'admin',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      usageCount: 45,
      tags: ['pediátrico', 'estándar', 'completo']
    },
    settings: {
      allowPartialSave: true,
      requireAllSections: false,
      showProgress: true,
      autoSave: true
    }
  },
  {
    id: 'template-2',
    name: 'Formulario de Terapia Ocupacional',
    description: 'Formulario específico para evaluación de terapia ocupacional',
    version: '1.5.0',
    isActive: true,
    isDefault: false,
    sections: [
      {
        id: 'section-1',
        title: 'Evaluación Funcional',
        description: 'Evaluación de habilidades funcionales',
        fields: [
          { id: 'field-1', type: 'text', label: 'Nombre del Paciente', required: true, order: 1 },
          { id: 'field-2', type: 'number', label: 'Edad', required: true, order: 2 },
          { id: 'field-3', type: 'select', label: 'Nivel de Independencia', required: true, order: 3, options: ['Independiente', 'Asistencia Mínima', 'Asistencia Moderada', 'Dependiente'] }
        ],
        order: 1,
        required: true
      }
    ],
    metadata: {
      createdBy: 'therapist-1',
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-20T14:15:00Z',
      usageCount: 23,
      tags: ['terapia ocupacional', 'funcional', 'evaluación']
    },
    settings: {
      allowPartialSave: true,
      requireAllSections: true,
      showProgress: true,
      autoSave: false
    }
  },
  {
    id: 'template-3',
    name: 'Formulario de Seguimiento',
    description: 'Formulario rápido para seguimiento de pacientes',
    version: '1.0.0',
    isActive: true,
    isDefault: false,
    sections: [
      {
        id: 'section-1',
        title: 'Seguimiento',
        description: 'Información de seguimiento',
        fields: [
          { id: 'field-1', type: 'text', label: 'ID del Paciente', required: true, order: 1 },
          { id: 'field-2', type: 'textarea', label: 'Progreso', required: true, order: 2 },
          { id: 'field-3', type: 'date', label: 'Próxima Cita', required: false, order: 3 }
        ],
        order: 1,
        required: true
      }
    ],
    metadata: {
      createdBy: 'coordinator-1',
      createdAt: '2024-01-25T00:00:00Z',
      updatedAt: '2024-01-25T16:45:00Z',
      usageCount: 12,
      tags: ['seguimiento', 'rápido', 'progreso']
    },
    settings: {
      allowPartialSave: false,
      requireAllSections: true,
      showProgress: false,
      autoSave: true
    }
  }
]

export default function TestMedicalFormTemplatesPage() {
  const [activeView, setActiveView] = useState<'manager' | 'selector' | 'customization'>('manager')
  const [selectedTemplate, setSelectedTemplate] = useState(mockTemplates[0])
  const [templates, setTemplates] = useState(mockTemplates)

  const handleSaveTemplate = (template: any) => {
    console.log('Saving template:', template)
    // In a real application, this would save to the database
    setTemplates(prev => {
      const existingIndex = prev.findIndex(t => t.id === template.id)
      if (existingIndex >= 0) {
        const newTemplates = [...prev]
        newTemplates[existingIndex] = template
        return newTemplates
      } else {
        return [template, ...prev]
      }
    })
    alert('Plantilla guardada exitosamente')
  }

  const handleDeleteTemplate = (templateId: string) => {
    console.log('Deleting template:', templateId)
    setTemplates(prev => prev.filter(t => t.id !== templateId))
    alert('Plantilla eliminada')
  }

  const handleDuplicateTemplate = (template: any) => {
    console.log('Duplicating template:', template)
    alert('Plantilla duplicada exitosamente')
  }

  const handleSelectTemplate = (template: any) => {
    console.log('Selected template:', template)
    setSelectedTemplate(template)
    alert(`Plantilla "${template.name}" seleccionada`)
  }

  const handleSaveCustomization = (customization: any) => {
    console.log('Saving customization:', customization)
    alert('Personalización guardada exitosamente')
  }

  const handlePreviewCustomization = (customization: any) => {
    console.log('Previewing customization:', customization)
    alert('Vista previa de personalización')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Sistema de Plantillas de Formularios Médicos</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo para crear, gestionar y personalizar plantillas de formularios médicos.
      </p>

      {/* View Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Vista</CardTitle>
          <CardDescription>
            Elige entre diferentes vistas del sistema de plantillas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={activeView === 'manager' ? 'default' : 'outline'}
              onClick={() => setActiveView('manager')}
              className="h-auto p-4"
            >
              <div className="text-center">
                <Settings className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Gestor de Plantillas</div>
                <div className="text-sm text-muted-foreground">
                  Crear, editar y gestionar plantillas
                </div>
              </div>
            </Button>

            <Button
              variant={activeView === 'selector' ? 'default' : 'outline'}
              onClick={() => setActiveView('selector')}
              className="h-auto p-4"
            >
              <div className="text-center">
                <Eye className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Selector de Plantillas</div>
                <div className="text-sm text-muted-foreground">
                  Seleccionar plantilla para usar
                </div>
              </div>
            </Button>

            <Button
              variant={activeView === 'customization' ? 'default' : 'outline'}
              onClick={() => setActiveView('customization')}
              className="h-auto p-4"
            >
              <div className="text-center">
                <Palette className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Personalización</div>
                <div className="text-sm text-muted-foreground">
                  Personalizar apariencia y comportamiento
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
              Gestión Completa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Crear, editar, duplicar y eliminar plantillas con interfaz drag-and-drop
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2 text-yellow-600" />
              Plantillas Predefinidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Plantillas estándar para diferentes tipos de evaluaciones médicas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Palette className="h-4 w-4 mr-2 text-purple-600" />
              Personalización Avanzada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Personalizar colores, fuentes, validación y accesibilidad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-600" />
              Colaboración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Compartir plantillas entre terapeutas y coordinadores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Plantillas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">Plantillas disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plantillas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">En uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plantillas por Defecto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.isDefault).length}
            </div>
            <p className="text-xs text-muted-foreground">Recomendadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uso Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.reduce((sum, t) => sum + t.metadata.usageCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Formularios creados</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {activeView === 'manager' && (
        <MedicalFormTemplateManager
          initialTemplates={templates}
          onSave={handleSaveTemplate}
          onDelete={handleDeleteTemplate}
          onDuplicate={handleDuplicateTemplate}
          currentUser={{
            id: 'current-user',
            name: 'Usuario Actual',
            role: 'admin'
          }}
        />
      )}

      {activeView === 'selector' && (
        <FormTemplateSelector
          templates={templates}
          onSelect={handleSelectTemplate}
          onCancel={() => setActiveView('manager')}
          showPreview={true}
          showUsageStats={true}
        />
      )}

      {activeView === 'customization' && (
        <FormCustomization
          initialCustomization={{
            id: 'custom-1',
            name: 'Formulario Personalizado',
            description: 'Personalización del formulario médico',
            sections: selectedTemplate.sections.map(section => ({
              ...section,
              styling: {
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb',
                borderRadius: 'md' as const,
                padding: 'md' as const
              }
            })),
            globalSettings: {
              theme: 'light' as const,
              primaryColor: '#3b82f6',
              secondaryColor: '#6b7280',
              fontFamily: 'sans' as const,
              fontSize: 'base' as const,
              spacing: 'normal' as const,
              showProgress: true,
              showSectionNumbers: true,
              allowNavigation: true,
              autoSave: true,
              saveInterval: 30
            },
            validation: {
              showInlineErrors: true,
              showFieldRequirements: true,
              validateOnBlur: true,
              validateOnSubmit: true
            },
            accessibility: {
              highContrast: false,
              largeText: false,
              screenReaderOptimized: true,
              keyboardNavigation: true
            }
          }}
          onSave={handleSaveCustomization}
          onPreview={handlePreviewCustomization}
        />
      )}

      {/* Technical Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema incluye gestión completa de plantillas con 
          editor drag-and-drop, selector inteligente con vista previa, personalización avanzada de 
          estilos y validación, y capacidades de colaboración. Las plantillas son versionadas y 
          incluyen estadísticas de uso.
        </AlertDescription>
      </Alert>

      {/* Template Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Ejemplos de Plantillas</CardTitle>
          <CardDescription>
            Plantillas predefinidas para diferentes tipos de evaluaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {template.name}
                        {template.isDefault && (
                          <Star className="h-4 w-4 ml-2 text-yellow-500 fill-current" />
                        )}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {template.isDefault && (
                        <Badge variant="default">Por Defecto</Badge>
                      )}
                      {template.isActive ? (
                        <Badge variant="default">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Versión:</span>
                      <span>{template.version}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Secciones:</span>
                      <span>{template.sections.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Uso:</span>
                      <span>{template.metadata.usageCount} veces</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.metadata.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
