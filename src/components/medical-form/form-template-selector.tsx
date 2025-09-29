'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  FileText, 
  Users, 
  Calendar, 
  CheckCircle, 
  Info,
  ArrowRight,
  Star,
  Clock,
  Tag
} from 'lucide-react'

interface FormTemplate {
  id: string
  name: string
  description: string
  version: string
  isActive: boolean
  isDefault: boolean
  sections: Array<{
    id: string
    title: string
    description?: string
    fields: Array<{
      id: string
      type: string
      label: string
      required: boolean
    }>
  }>
  metadata: {
    createdBy: string
    createdAt: string
    updatedAt: string
    usageCount: number
    tags: string[]
  }
  settings: {
    allowPartialSave: boolean
    requireAllSections: boolean
    showProgress: boolean
    autoSave: boolean
  }
}

interface FormTemplateSelectorProps {
  templates: FormTemplate[]
  onSelect: (template: FormTemplate) => void
  onCancel?: () => void
  selectedTemplateId?: string
  showPreview?: boolean
  filterByTags?: string[]
  showUsageStats?: boolean
}

export function FormTemplateSelector({
  templates,
  onSelect,
  onCancel,
  selectedTemplateId,
  showPreview = true,
  filterByTags = [],
  showUsageStats = true
}: FormTemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'default'>('all')

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    // Search filter
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Status filter
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && template.isActive) ||
      (filterStatus === 'default' && template.isDefault)
    
    // Tags filter
    const matchesTags = filterByTags.length === 0 || 
      filterByTags.some(tag => template.metadata.tags.includes(tag))
    
    return matchesSearch && matchesStatus && matchesTags
  })

  // Set selected template when selectedTemplateId changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t.id === selectedTemplateId)
      setSelectedTemplate(template || null)
    }
  }, [selectedTemplateId, templates])

  const handleTemplateSelect = (template: FormTemplate) => {
    setSelectedTemplate(template)
  }

  const handleConfirmSelection = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate)
    }
  }

  const getTemplateStats = (template: FormTemplate) => {
    const totalFields = template.sections.reduce((sum, section) => sum + section.fields.length, 0)
    const requiredFields = template.sections.reduce((sum, section) => 
      sum + section.fields.filter(field => field.required).length, 0
    )
    
    return {
      totalFields,
      requiredFields,
      sections: template.sections.length,
      estimatedTime: Math.ceil(totalFields * 2) // 2 minutes per field estimate
    }
  }

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝'
      case 'textarea': return '📄'
      case 'select': return '📋'
      case 'checkbox': return '☑️'
      case 'radio': return '🔘'
      case 'date': return '📅'
      case 'number': return '🔢'
      case 'email': return '📧'
      case 'phone': return '📞'
      default: return '📝'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Seleccionar Plantilla de Formulario</h2>
        <p className="text-muted-foreground">
          Elige una plantilla para crear un nuevo formulario médico
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Buscar Plantillas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Nombre, descripción o etiquetas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>Filtrar por Estado</Label>
              <div className="flex space-x-2 mt-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  Todas
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('active')}
                >
                  Activas
                </Button>
                <Button
                  variant={filterStatus === 'default' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('default')}
                >
                  Por Defecto
                </Button>
              </div>
            </div>
            <div>
              <Label>Resultados</Label>
              <div className="text-sm text-muted-foreground mt-2">
                {filteredTemplates.length} de {templates.length} plantillas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Plantillas Disponibles</h3>
          
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No se encontraron plantillas</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => {
                const stats = getTemplateStats(template)
                const isSelected = selectedTemplate?.id === template.id
                
                return (
                  <Card 
                    key={template.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
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
                      <div className="space-y-3">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div className="flex items-center space-x-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{stats.sections} secciones</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <span>{stats.totalFields} campos</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>~{stats.estimatedTime} min</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{template.metadata.usageCount} usos</span>
                          </div>
                        </div>
                        
                        {/* Tags */}
                        {template.metadata.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.metadata.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {/* Version and Date */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Versión {template.version}</span>
                          <span>Actualizado: {new Date(template.metadata.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Preview */}
        {showPreview && selectedTemplate && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Vista Previa</h3>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {selectedTemplate.name}
                  {selectedTemplate.isDefault && (
                    <Star className="h-4 w-4 ml-2 text-yellow-500 fill-current" />
                  )}
                </CardTitle>
                <CardDescription>{selectedTemplate.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Template Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Versión</Label>
                      <p className="font-medium">{selectedTemplate.version}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Estado</Label>
                      <p className="font-medium">
                        {selectedTemplate.isActive ? 'Activa' : 'Inactiva'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Secciones</Label>
                      <p className="font-medium">{getTemplateStats(selectedTemplate).sections}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Campos</Label>
                      <p className="font-medium">{getTemplateStats(selectedTemplate).totalFields}</p>
                    </div>
                  </div>

                  {/* Settings */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Configuración</Label>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Guardado parcial: {selectedTemplate.settings.allowPartialSave ? 'Sí' : 'No'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Mostrar progreso: {selectedTemplate.settings.showProgress ? 'Sí' : 'No'}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Auto-guardado: {selectedTemplate.settings.autoSave ? 'Sí' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sections Preview */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Secciones</Label>
                    <div className="mt-2 space-y-2">
                      {selectedTemplate.sections.map((section) => (
                        <div key={section.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{section.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {section.fields.length} campos
                            </Badge>
                          </div>
                          {section.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {section.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {section.fields.slice(0, 5).map((field) => (
                              <Badge key={field.id} variant="secondary" className="text-xs">
                                {getFieldTypeIcon(field.type)} {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </Badge>
                            ))}
                            {section.fields.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{section.fields.length - 5} más
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Usage Stats */}
                  {showUsageStats && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Estadísticas de Uso</Label>
                      <div className="mt-2 text-sm">
                        <p>Usado {selectedTemplate.metadata.usageCount} veces</p>
                        <p>Creado: {new Date(selectedTemplate.metadata.createdAt).toLocaleDateString()}</p>
                        <p>Última actualización: {new Date(selectedTemplate.metadata.updatedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button onClick={handleConfirmSelection} className="flex-1">
                <ArrowRight className="h-4 w-4 mr-2" />
                Usar esta Plantilla
              </Button>
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Consejo:</strong> Las plantillas marcadas con ⭐ son las recomendadas por defecto. 
          Puedes personalizar cualquier plantilla después de seleccionarla. El tiempo estimado 
          se basa en el número de campos del formulario.
        </AlertDescription>
      </Alert>
    </div>
  )
}
