'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Palette, 
  Layout, 
  Save, 
  Undo, 
  Redo, 
  Eye, 
  Code,
  CheckCircle,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  Copy,
  Move
} from 'lucide-react'

interface FormField {
  id: string
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number' | 'email' | 'phone'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
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
  styling?: {
    width?: 'full' | 'half' | 'third' | 'quarter'
    color?: string
    backgroundColor?: string
    fontSize?: 'sm' | 'base' | 'lg' | 'xl'
  }
}

interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  order: number
  required: boolean
  styling?: {
    backgroundColor?: string
    borderColor?: string
    borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
    padding?: 'sm' | 'md' | 'lg' | 'xl'
  }
}

interface FormCustomization {
  id: string
  name: string
  description: string
  sections: FormSection[]
  globalSettings: {
    theme: 'light' | 'dark' | 'auto'
    primaryColor: string
    secondaryColor: string
    fontFamily: 'sans' | 'serif' | 'mono'
    fontSize: 'sm' | 'base' | 'lg'
    spacing: 'compact' | 'normal' | 'relaxed'
    showProgress: boolean
    showSectionNumbers: boolean
    allowNavigation: boolean
    autoSave: boolean
    saveInterval: number // in seconds
  }
  validation: {
    showInlineErrors: boolean
    showFieldRequirements: boolean
    validateOnBlur: boolean
    validateOnSubmit: boolean
  }
  accessibility: {
    highContrast: boolean
    largeText: boolean
    screenReaderOptimized: boolean
    keyboardNavigation: boolean
  }
}

interface FormCustomizationProps {
  initialCustomization?: FormCustomization
  onSave?: (customization: FormCustomization) => void
  onPreview?: (customization: FormCustomization) => void
  onReset?: () => void
  readOnly?: boolean
}

export function FormCustomization({
  initialCustomization,
  onSave,
  onPreview,
  onReset,
  readOnly = false
}: FormCustomizationProps) {
  const [customization, setCustomization] = useState<FormCustomization>(
    initialCustomization || getDefaultCustomization()
  )
  const [activeTab, setActiveTab] = useState<'layout' | 'styling' | 'validation' | 'accessibility'>('layout')
  const [history, setHistory] = useState<FormCustomization[]>([customization])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Update customization
  const updateCustomization = (updates: Partial<FormCustomization>) => {
    const newCustomization = { ...customization, ...updates }
    setCustomization(newCustomization)
    
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newCustomization)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // Undo/Redo functionality
  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const handleUndo = () => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1)
      setCustomization(history[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1)
      setCustomization(history[historyIndex + 1])
    }
  }

  // Add section
  const addSection = () => {
    const newSection: FormSection = {
      id: `section-${Date.now()}`,
      title: 'Nueva Sección',
      description: 'Descripción de la nueva sección',
      fields: [],
      order: customization.sections.length + 1,
      required: true
    }
    
    updateCustomization({
      sections: [...customization.sections, newSection]
    })
  }

  // Update section
  const updateSection = (sectionId: string, updates: Partial<FormSection>) => {
    const updatedSections = customization.sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    )
    updateCustomization({ sections: updatedSections })
  }

  // Delete section
  const deleteSection = (sectionId: string) => {
    const updatedSections = customization.sections.filter(section => section.id !== sectionId)
    updateCustomization({ sections: updatedSections })
  }

  // Add field to section
  const addField = (sectionId: string) => {
    const section = customization.sections.find(s => s.id === sectionId)
    if (!section) return

    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'Nuevo Campo',
      required: false,
      order: section.fields.length + 1
    }

    const updatedSections = customization.sections.map(s =>
      s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s
    )
    updateCustomization({ sections: updatedSections })
  }

  // Update field
  const updateField = (sectionId: string, fieldId: string, updates: Partial<FormField>) => {
    const updatedSections = customization.sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            fields: section.fields.map(field =>
              field.id === fieldId ? { ...field, ...updates } : field
            )
          }
        : section
    )
    updateCustomization({ sections: updatedSections })
  }

  // Delete field
  const deleteField = (sectionId: string, fieldId: string) => {
    const updatedSections = customization.sections.map(section =>
      section.id === sectionId
        ? {
            ...section,
            fields: section.fields.filter(field => field.id !== fieldId)
          }
        : section
    )
    updateCustomization({ sections: updatedSections })
  }

  // Duplicate section
  const duplicateSection = (sectionId: string) => {
    const section = customization.sections.find(s => s.id === sectionId)
    if (!section) return

    const duplicatedSection: FormSection = {
      ...section,
      id: `section-${Date.now()}`,
      title: `${section.title} (Copia)`,
      order: customization.sections.length + 1,
      fields: section.fields.map(field => ({
        ...field,
        id: `field-${Date.now()}-${Math.random()}`
      }))
    }

    updateCustomization({
      sections: [...customization.sections, duplicatedSection]
    })
  }

  // Save customization
  const handleSave = () => {
    if (onSave) {
      onSave(customization)
    }
  }

  // Preview customization
  const handlePreview = () => {
    if (onPreview) {
      onPreview(customization)
    }
  }

  // Reset customization
  const handleReset = () => {
    if (onReset) {
      onReset()
    } else {
      setCustomization(getDefaultCustomization())
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Personalización del Formulario</h2>
          <p className="text-muted-foreground">
            Personaliza la apariencia, comportamiento y validación del formulario
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo || readOnly}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo || readOnly}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
          >
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={readOnly}
          >
            <Undo className="h-4 w-4 mr-2" />
            Restablecer
          </Button>
          <Button
            onClick={handleSave}
            disabled={readOnly}
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Customization Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="layout" className="flex items-center">
            <Layout className="h-4 w-4 mr-2" />
            Diseño
          </TabsTrigger>
          <TabsTrigger value="styling" className="flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            Estilo
          </TabsTrigger>
          <TabsTrigger value="validation" className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Validación
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Accesibilidad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Structure */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Estructura del Formulario</CardTitle>
                  <Button onClick={addSection} size="sm" disabled={readOnly}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Sección
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customization.sections.map((section, index) => (
                    <Card key={section.id} className="border-dashed">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <Input
                              value={section.title}
                              onChange={(e) => updateSection(section.id, { title: e.target.value })}
                              className="font-medium"
                              disabled={readOnly}
                            />
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateSection(section.id)}
                              disabled={readOnly}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteSection(section.id)}
                              disabled={readOnly}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Descripción de la sección..."
                            value={section.description || ''}
                            onChange={(e) => updateSection(section.id, { description: e.target.value })}
                            disabled={readOnly}
                          />
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={section.required}
                                onCheckedChange={(checked) => updateSection(section.id, { required: checked })}
                                disabled={readOnly}
                              />
                              <Label>Sección Requerida</Label>
                            </div>
                            <Button
                              onClick={() => addField(section.id)}
                              size="sm"
                              variant="outline"
                              disabled={readOnly}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Agregar Campo
                            </Button>
                          </div>
                          
                          {/* Fields */}
                          <div className="space-y-2">
                            {section.fields.map((field) => (
                              <div key={field.id} className="p-3 border rounded-lg bg-muted/50">
                                <div className="flex items-center justify-between mb-2">
                                  <Input
                                    value={field.label}
                                    onChange={(e) => updateField(section.id, field.id, { label: e.target.value })}
                                    placeholder="Etiqueta del campo"
                                    disabled={readOnly}
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteField(section.id, field.id)}
                                    disabled={readOnly}
                                    className="text-red-600 ml-2"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <Select
                                    value={field.type}
                                    onValueChange={(value: any) => updateField(section.id, field.id, { type: value })}
                                    disabled={readOnly}
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
                                    onChange={(e) => updateField(section.id, field.id, { placeholder: e.target.value })}
                                    disabled={readOnly}
                                  />
                                  
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={field.required}
                                      onCheckedChange={(checked) => updateField(section.id, field.id, { required: checked })}
                                      disabled={readOnly}
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

            {/* Global Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración Global</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label>Mostrar Barra de Progreso</Label>
                    <Switch
                      checked={customization.globalSettings.showProgress}
                      onCheckedChange={(checked) => updateCustomization({
                        globalSettings: { ...customization.globalSettings, showProgress: checked }
                      })}
                      disabled={readOnly}
                    />
                  </div>
                  
                  <div>
                    <Label>Mostrar Números de Sección</Label>
                    <Switch
                      checked={customization.globalSettings.showSectionNumbers}
                      onCheckedChange={(checked) => updateCustomization({
                        globalSettings: { ...customization.globalSettings, showSectionNumbers: checked }
                      })}
                      disabled={readOnly}
                    />
                  </div>
                  
                  <div>
                    <Label>Permitir Navegación</Label>
                    <Switch
                      checked={customization.globalSettings.allowNavigation}
                      onCheckedChange={(checked) => updateCustomization({
                        globalSettings: { ...customization.globalSettings, allowNavigation: checked }
                      })}
                      disabled={readOnly}
                    />
                  </div>
                  
                  <div>
                    <Label>Auto-guardado</Label>
                    <Switch
                      checked={customization.globalSettings.autoSave}
                      onCheckedChange={(checked) => updateCustomization({
                        globalSettings: { ...customization.globalSettings, autoSave: checked }
                      })}
                      disabled={readOnly}
                    />
                  </div>
                  
                  {customization.globalSettings.autoSave && (
                    <div>
                      <Label htmlFor="save-interval">Intervalo de Guardado (segundos)</Label>
                      <Input
                        id="save-interval"
                        type="number"
                        value={customization.globalSettings.saveInterval}
                        onChange={(e) => updateCustomization({
                          globalSettings: { 
                            ...customization.globalSettings, 
                            saveInterval: parseInt(e.target.value) || 30 
                          }
                        })}
                        disabled={readOnly}
                        min="10"
                        max="300"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="styling" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Theme Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Tema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="theme">Tema</Label>
                  <Select
                    value={customization.globalSettings.theme}
                    onValueChange={(value: any) => updateCustomization({
                      globalSettings: { ...customization.globalSettings, theme: value }
                    })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Oscuro</SelectItem>
                      <SelectItem value="auto">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="primary-color">Color Primario</Label>
                  <Input
                    id="primary-color"
                    type="color"
                    value={customization.globalSettings.primaryColor}
                    onChange={(e) => updateCustomization({
                      globalSettings: { ...customization.globalSettings, primaryColor: e.target.value }
                    })}
                    disabled={readOnly}
                  />
                </div>
                
                <div>
                  <Label htmlFor="secondary-color">Color Secundario</Label>
                  <Input
                    id="secondary-color"
                    type="color"
                    value={customization.globalSettings.secondaryColor}
                    onChange={(e) => updateCustomization({
                      globalSettings: { ...customization.globalSettings, secondaryColor: e.target.value }
                    })}
                    disabled={readOnly}
                  />
                </div>
                
                <div>
                  <Label htmlFor="font-family">Familia de Fuente</Label>
                  <Select
                    value={customization.globalSettings.fontFamily}
                    onValueChange={(value: any) => updateCustomization({
                      globalSettings: { ...customization.globalSettings, fontFamily: value }
                    })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans">Sans Serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="mono">Monospace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="font-size">Tamaño de Fuente</Label>
                  <Select
                    value={customization.globalSettings.fontSize}
                    onValueChange={(value: any) => updateCustomization({
                      globalSettings: { ...customization.globalSettings, fontSize: value }
                    })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Pequeño</SelectItem>
                      <SelectItem value="base">Normal</SelectItem>
                      <SelectItem value="lg">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="spacing">Espaciado</Label>
                  <Select
                    value={customization.globalSettings.spacing}
                    onValueChange={(value: any) => updateCustomization({
                      globalSettings: { ...customization.globalSettings, spacing: value }
                    })}
                    disabled={readOnly}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compacto</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="relaxed">Relajado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Vista Previa del Estilo</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="p-4 border rounded-lg"
                  style={{
                    backgroundColor: customization.globalSettings.theme === 'dark' ? '#1a1a1a' : '#ffffff',
                    color: customization.globalSettings.theme === 'dark' ? '#ffffff' : '#000000',
                    fontFamily: customization.globalSettings.fontFamily === 'serif' ? 'serif' : 
                               customization.globalSettings.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
                    fontSize: customization.globalSettings.fontSize === 'sm' ? '0.875rem' :
                             customization.globalSettings.fontSize === 'lg' ? '1.125rem' : '1rem'
                  }}
                >
                  <h3 className="text-lg font-semibold mb-2">Ejemplo de Formulario</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Nombre</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded"
                        style={{ 
                          borderColor: customization.globalSettings.primaryColor,
                          backgroundColor: customization.globalSettings.theme === 'dark' ? '#2a2a2a' : '#ffffff'
                        }}
                        placeholder="Ingresa tu nombre"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input 
                        type="email" 
                        className="w-full p-2 border rounded"
                        style={{ 
                          borderColor: customization.globalSettings.primaryColor,
                          backgroundColor: customization.globalSettings.theme === 'dark' ? '#2a2a2a' : '#ffffff'
                        }}
                        placeholder="tu@email.com"
                      />
                    </div>
                    <button 
                      className="px-4 py-2 rounded text-white"
                      style={{ backgroundColor: customization.globalSettings.primaryColor }}
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Validación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Mostrar Errores en Línea</Label>
                  <Switch
                    checked={customization.validation.showInlineErrors}
                    onCheckedChange={(checked) => updateCustomization({
                      validation: { ...customization.validation, showInlineErrors: checked }
                    })}
                    disabled={readOnly}
                  />
                </div>
                
                <div>
                  <Label>Mostrar Requisitos de Campos</Label>
                  <Switch
                    checked={customization.validation.showFieldRequirements}
                    onCheckedChange={(checked) => updateCustomization({
                      validation: { ...customization.validation, showFieldRequirements: checked }
                    })}
                    disabled={readOnly}
                  />
                </div>
                
                <div>
                  <Label>Validar al Perder Foco</Label>
                  <Switch
                    checked={customization.validation.validateOnBlur}
                    onCheckedChange={(checked) => updateCustomization({
                      validation: { ...customization.validation, validateOnBlur: checked }
                    })}
                    disabled={readOnly}
                  />
                </div>
                
                <div>
                  <Label>Validar al Enviar</Label>
                  <Switch
                    checked={customization.validation.validateOnSubmit}
                    onCheckedChange={(checked) => updateCustomization({
                      validation: { ...customization.validation, validateOnSubmit: checked }
                    })}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accessibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Accesibilidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Alto Contraste</Label>
                  <Switch
                    checked={customization.accessibility.highContrast}
                    onCheckedChange={(checked) => updateCustomization({
                      accessibility: { ...customization.accessibility, highContrast: checked }
                    })}
                    disabled={readOnly}
                  />
                </div>
                
                <div>
                  <Label>Texto Grande</Label>
                  <Switch
                    checked={customization.accessibility.largeText}
                    onCheckedChange={(checked) => updateCustomization({
                      accessibility: { ...customization.accessibility, largeText: checked }
                    })}
                    disabled={readOnly}
                  />
                </div>
                
                <div>
                  <Label>Optimizado para Lector de Pantalla</Label>
                  <Switch
                    checked={customization.accessibility.screenReaderOptimized}
                    onCheckedChange={(checked) => updateCustomization({
                      accessibility: { ...customization.accessibility, screenReaderOptimized: checked }
                    })}
                    disabled={readOnly}
                  />
                </div>
                
                <div>
                  <Label>Navegación por Teclado</Label>
                  <Switch
                    checked={customization.accessibility.keyboardNavigation}
                    onCheckedChange={(checked) => updateCustomization({
                      accessibility: { ...customization.accessibility, keyboardNavigation: checked }
                    })}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to get default customization
function getDefaultCustomization(): FormCustomization {
  return {
    id: 'default',
    name: 'Formulario Personalizado',
    description: 'Formulario médico personalizado',
    sections: [],
    globalSettings: {
      theme: 'light',
      primaryColor: '#3b82f6',
      secondaryColor: '#6b7280',
      fontFamily: 'sans',
      fontSize: 'base',
      spacing: 'normal',
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
  }
}
