'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Save, 
  Eye, 
  Settings,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info,
  GripVertical
} from 'lucide-react'
// import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface FormField {
  id: string
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number' | 'email' | 'phone'
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // For select, radio, checkbox
  validation?: {
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: string
    customMessage?: string
  }
  helpText?: string
  order: number
}

interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  order: number
  required: boolean
}

interface FormTemplate {
  id: string
  name: string
  description: string
  version: string
  isActive: boolean
  isDefault: boolean
  sections: FormSection[]
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
    maxAttempts?: number
  }
}

interface MedicalFormTemplateManagerProps {
  initialTemplates?: FormTemplate[]
  onSave?: (template: FormTemplate) => void
  onDelete?: (templateId: string) => void
  onDuplicate?: (template: FormTemplate) => void
  currentUser?: {
    id: string
    name: string
    role: string
  }
}

export function MedicalFormTemplateManager({
  initialTemplates = [],
  onSave,
  onDelete,
  onDuplicate,
  currentUser
}: MedicalFormTemplateManagerProps) {
  const [templates, setTemplates] = useState<FormTemplate[]>(initialTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'edit' | 'preview'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && template.isActive) ||
      (filterStatus === 'inactive' && !template.isActive)
    
    return matchesSearch && matchesStatus
  })

  // Create new template
  const createNewTemplate = () => {
    const newTemplate: FormTemplate = {
      id: `template-${Date.now()}`,
      name: 'Nueva Plantilla',
      description: 'Descripción de la nueva plantilla',
      version: '1.0.0',
      isActive: true,
      isDefault: false,
      sections: [
        {
          id: 'section-1',
          title: 'Información Personal',
          description: 'Datos básicos del paciente',
          fields: [
            {
              id: 'field-1',
              type: 'text',
              label: 'Nombre',
              required: true,
              order: 1,
              validation: {
                minLength: 2,
                maxLength: 50
              }
            },
            {
              id: 'field-2',
              type: 'text',
              label: 'Apellido',
              required: true,
              order: 2,
              validation: {
                minLength: 2,
                maxLength: 50
              }
            }
          ],
          order: 1,
          required: true
        }
      ],
      metadata: {
        createdBy: currentUser?.id || 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
        tags: ['nuevo']
      },
      settings: {
        allowPartialSave: true,
        requireAllSections: false,
        showProgress: true,
        autoSave: true
      }
    }
    
    setEditingTemplate(newTemplate)
    setActiveTab('edit')
  }

  // Save template
  const saveTemplate = () => {
    if (!editingTemplate) return
    
    const updatedTemplate = {
      ...editingTemplate,
      metadata: {
        ...editingTemplate.metadata,
        updatedAt: new Date().toISOString()
      }
    }
    
    setTemplates(prev => {
      const existingIndex = prev.findIndex(t => t.id === updatedTemplate.id)
      if (existingIndex >= 0) {
        const newTemplates = [...prev]
        newTemplates[existingIndex] = updatedTemplate
        return newTemplates
      } else {
        return [updatedTemplate, ...prev]
      }
    })
    
    if (onSave) {
      onSave(updatedTemplate)
    }
    
    setEditingTemplate(null)
    setActiveTab('list')
  }

  // Delete template
  const deleteTemplate = (templateId: string) => {
    if (onDelete) {
      onDelete(templateId)
    }
    setTemplates(prev => prev.filter(t => t.id !== templateId))
  }

  // Duplicate template
  const duplicateTemplate = (template: FormTemplate) => {
    const duplicatedTemplate: FormTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copia)`,
      isDefault: false,
      metadata: {
        ...template.metadata,
        createdBy: currentUser?.id || 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      }
    }
    
    if (onDuplicate) {
      onDuplicate(duplicatedTemplate)
    }
    
    setTemplates(prev => [duplicatedTemplate, ...prev])
  }

  // Add section
  const addSection = () => {
    if (!editingTemplate) return
    
    const newSection: FormSection = {
      id: `section-${Date.now()}`,
      title: 'Nueva Sección',
      description: 'Descripción de la nueva sección',
      fields: [],
      order: editingTemplate.sections.length + 1,
      required: true
    }
    
    setEditingTemplate(prev => prev ? {
      ...prev,
      sections: [...prev.sections, newSection]
    } : null)
  }

  // Add field to section
  const addField = (sectionId: string) => {
    if (!editingTemplate) return
    
    const section = editingTemplate.sections.find(s => s.id === sectionId)
    if (!section) return
    
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'Nuevo Campo',
      required: false,
      order: section.fields.length + 1
    }
    
    setEditingTemplate(prev => prev ? {
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId 
          ? { ...s, fields: [...s.fields, newField] }
          : s
      )
    } : null)
  }

  // Update field
  const updateField = (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
    if (!editingTemplate) return
    
    setEditingTemplate(prev => prev ? {
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              fields: section.fields.map(field => 
                field.id === fieldId ? { ...field, ...updates } : field
              )
            }
          : section
      )
    } : null)
  }

  // Delete field
  const deleteField = (sectionId: string, fieldId: string) => {
    if (!editingTemplate) return
    
    setEditingTemplate(prev => prev ? {
      ...prev,
      sections: prev.sections.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              fields: section.fields.filter(field => field.id !== fieldId)
            }
          : section
      )
    } : null)
  }

  // Handle drag and drop for sections
  const handleSectionDragEnd = (result: any) => {
    if (!editingTemplate || !result.destination) return
    
    const sections = Array.from(editingTemplate.sections)
    const [reorderedSection] = sections.splice(result.source.index, 1)
    sections.splice(result.destination.index, 0, reorderedSection)
    
    // Update order
    const updatedSections = sections.map((section, index) => ({
      ...section,
      order: index + 1
    }))
    
    setEditingTemplate(prev => prev ? {
      ...prev,
      sections: updatedSections
    } : null)
  }

  // Handle drag and drop for fields
  const handleFieldDragEnd = (sectionId: string, result: any) => {
    if (!editingTemplate || !result.destination) return
    
    const section = editingTemplate.sections.find(s => s.id === sectionId)
    if (!section) return
    
    const fields = Array.from(section.fields)
    const [reorderedField] = fields.splice(result.source.index, 1)
    fields.splice(result.destination.index, 0, reorderedField)
    
    // Update order
    const updatedFields = fields.map((field, index) => ({
      ...field,
      order: index + 1
    }))
    
    setEditingTemplate(prev => prev ? {
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, fields: updatedFields } : s
      )
    } : null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Plantillas de Formularios Médicos</h1>
          <p className="text-muted-foreground">
            Crea y personaliza plantillas de formularios médicos para diferentes necesidades
          </p>
        </div>
        <Button onClick={createNewTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar Plantillas</Label>
              <Input
                id="search"
                placeholder="Nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="inactive">Inactivas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Resultados</Label>
              <div className="text-sm text-muted-foreground">
                {filteredTemplates.length} de {templates.length} plantillas
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'list' | 'edit' | 'preview')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list">Lista de Plantillas</TabsTrigger>
          <TabsTrigger value="edit" disabled={!editingTemplate}>
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!selectedTemplate}>
            Vista Previa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-1">
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
                    <div className="flex items-center justify-between text-sm">
                      <span>Actualizado:</span>
                      <span>{new Date(template.metadata.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setActiveTab('preview')
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template)
                          setActiveTab('edit')
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateTemplate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="edit" className="space-y-4">
          {editingTemplate && (
            <div className="space-y-6">
              {/* Template Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de la Plantilla</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Nombre</Label>
                      <Input
                        id="template-name"
                        value={editingTemplate.name}
                        onChange={(e) => setEditingTemplate(prev => prev ? {
                          ...prev,
                          name: e.target.value
                        } : null)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-version">Versión</Label>
                      <Input
                        id="template-version"
                        value={editingTemplate.version}
                        onChange={(e) => setEditingTemplate(prev => prev ? {
                          ...prev,
                          version: e.target.value
                        } : null)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="template-description">Descripción</Label>
                    <Textarea
                      id="template-description"
                      value={editingTemplate.description}
                      onChange={(e) => setEditingTemplate(prev => prev ? {
                        ...prev,
                        description: e.target.value
                      } : null)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingTemplate.isActive}
                        onCheckedChange={(checked) => setEditingTemplate(prev => prev ? {
                          ...prev,
                          isActive: checked
                        } : null)}
                      />
                      <Label>Plantilla Activa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingTemplate.settings.allowPartialSave}
                        onCheckedChange={(checked) => setEditingTemplate(prev => prev ? {
                          ...prev,
                          settings: {
                            ...prev.settings,
                            allowPartialSave: checked
                          }
                        } : null)}
                      />
                      <Label>Permitir Guardado Parcial</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sections */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Secciones del Formulario</CardTitle>
                    <Button onClick={addSection} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Sección
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {editingTemplate.sections.map((section, index) => (
                      <Card key={section.id}>
                        <CardHeader>
                          <div className="flex items-center space-x-2">
                            <div>
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                                      <Input
                                        value={section.title}
                                        onChange={(e) => setEditingTemplate(prev => prev ? {
                                          ...prev,
                                          sections: prev.sections.map(s => 
                                            s.id === section.id ? { ...s, title: e.target.value } : s
                                          )
                                        } : null)}
                                        className="font-medium"
                                      />
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      <Textarea
                                        placeholder="Descripción de la sección..."
                                        value={section.description || ''}
                                        onChange={(e) => setEditingTemplate(prev => prev ? {
                                          ...prev,
                                          sections: prev.sections.map(s => 
                                            s.id === section.id ? { ...s, description: e.target.value } : s
                                          )
                                        } : null)}
                                      />
                                      
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          <Switch
                                            checked={section.required}
                                            onCheckedChange={(checked) => setEditingTemplate(prev => prev ? {
                                              ...prev,
                                              sections: prev.sections.map(s => 
                                                s.id === section.id ? { ...s, required: checked } : s
                                              )
                                            } : null)}
                                          />
                                          <Label>Sección Requerida</Label>
                                        </div>
                                        <Button
                                          onClick={() => addField(section.id)}
                                          size="sm"
                                          variant="outline"
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Agregar Campo
                                        </Button>
                                      </div>
                                      
                                      {/* Fields */}
                                      <div className="space-y-2">
                                        {section.fields.map((field, fieldIndex) => (
                                          <div key={field.id} className="p-3 border rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center space-x-2">
                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                <Input
                                                  value={field.label}
                                                  onChange={(e) => updateField(section.id, field.id, {
                                                    label: e.target.value
                                                  })}
                                                  placeholder="Etiqueta del campo"
                                                />
                                              </div>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => deleteField(section.id, field.id)}
                                                className="text-red-600"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                              <Select
                                                value={field.type}
                                                onValueChange={(value: any) => updateField(section.id, field.id, {
                                                  type: value
                                                })}
                                              >
                                                <SelectTrigger>
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="text">Texto</SelectItem>
                                                  <SelectItem value="textarea">Área de Texto</SelectItem>
                                                  <SelectItem value="select">Selección</SelectItem>
                                                  <SelectItem value="checkbox">Casilla</SelectItem>
                                                  <SelectItem value="radio">Radio</SelectItem>
                                                  <SelectItem value="date">Fecha</SelectItem>
                                                  <SelectItem value="number">Número</SelectItem>
                                                  <SelectItem value="email">Email</SelectItem>
                                                  <SelectItem value="phone">Teléfono</SelectItem>
                                                </SelectContent>
                                              </Select>
                                              
                                              <Input
                                                placeholder="Placeholder..."
                                                value={field.placeholder || ''}
                                                onChange={(e) => updateField(section.id, field.id, {
                                                  placeholder: e.target.value
                                                })}
                                              />
                                              
                                              <div className="flex items-center space-x-2">
                                                <Switch
                                                  checked={field.required}
                                                  onCheckedChange={(checked) => updateField(section.id, field.id, {
                                                    required: checked
                                                  })}
                                                />
                                                <Label>Requerido</Label>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setActiveTab('list')}>
                  Cancelar
                </Button>
                <Button onClick={saveTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Plantilla
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {selectedTemplate && (
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa: {selectedTemplate.name}</CardTitle>
                <CardDescription>{selectedTemplate.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {selectedTemplate.sections.map((section) => (
                    <div key={section.id} className="space-y-4">
                      <div className="border-b pb-2">
                        <h3 className="text-lg font-medium">{section.title}</h3>
                        {section.description && (
                          <p className="text-sm text-muted-foreground">{section.description}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.fields.map((field) => (
                          <div key={field.id} className="space-y-2">
                            <Label>
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            
                            {field.type === 'text' && (
                              <Input placeholder={field.placeholder} disabled />
                            )}
                            
                            {field.type === 'textarea' && (
                              <Textarea placeholder={field.placeholder} disabled />
                            )}
                            
                            {field.type === 'select' && (
                              <Select disabled>
                                <SelectTrigger>
                                  <SelectValue placeholder={field.placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {field.type === 'date' && (
                              <Input type="date" disabled />
                            )}
                            
                            {field.type === 'number' && (
                              <Input type="number" placeholder={field.placeholder} disabled />
                            )}
                            
                            {field.type === 'email' && (
                              <Input type="email" placeholder={field.placeholder} disabled />
                            )}
                            
                            {field.type === 'phone' && (
                              <Input type="tel" placeholder={field.placeholder} disabled />
                            )}
                            
                            {field.helpText && (
                              <p className="text-xs text-muted-foreground">{field.helpText}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
