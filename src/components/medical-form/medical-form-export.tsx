'use client'

import { useState, useRef } from 'react'
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
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson, 
  Printer, 
  Settings,
  Eye,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  FileImage,
  Palette,
  Type,
  Layout,
  Save
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'THERAPIST' | 'COORDINATOR' | 'ADMIN'
  avatar?: string
}

interface FormData {
  [key: string]: any
}

interface ExportTemplate {
  id: string
  name: string
  description: string
  format: 'PDF' | 'CSV' | 'JSON' | 'DOCX'
  settings: {
    includeHeader: boolean
    includeFooter: boolean
    includeMetadata: boolean
    includeComments: boolean
    includeSignatures: boolean
    pageOrientation: 'portrait' | 'landscape'
    fontSize: 'small' | 'medium' | 'large'
    colorScheme: 'default' | 'professional' | 'medical' | 'custom'
    customColors?: {
      primary: string
      secondary: string
      accent: string
    }
  }
  sections: string[]
  fields: string[]
}

interface MedicalFormExportProps {
  formId: string
  formTitle: string
  formData: FormData
  patientInfo?: {
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    address?: string
    phone?: string
    email?: string
  }
  therapistInfo?: User
  templates?: ExportTemplate[]
  onExport?: (format: string, template: ExportTemplate, options: any) => void
  onSaveTemplate?: (template: ExportTemplate) => void
  onPreview?: (template: ExportTemplate) => void
}

export function MedicalFormExport({
  formId,
  formTitle,
  formData,
  patientInfo,
  therapistInfo,
  templates = [],
  onExport,
  onSaveTemplate,
  onPreview
}: MedicalFormExportProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'templates' | 'preview'>('export')
  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'CSV' | 'JSON' | 'DOCX'>('PDF')
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null)
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  // Export options
  const [exportOptions, setExportOptions] = useState({
    includeHeader: true,
    includeFooter: true,
    includeMetadata: true,
    includeComments: false,
    includeSignatures: true,
    pageOrientation: 'portrait' as 'portrait' | 'landscape',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    colorScheme: 'medical' as 'default' | 'professional' | 'medical' | 'custom',
    customColors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      accent: '#10b981'
    },
    sections: [] as string[],
    fields: [] as string[]
  })

  // Template editor state
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateSettings, setTemplateSettings] = useState(exportOptions)

  const previewRef = useRef<HTMLDivElement>(null)

  // Get format icon
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'PDF': return <FileText className="h-5 w-5" />
      case 'CSV': return <FileSpreadsheet className="h-5 w-5" />
      case 'JSON': return <FileJson className="h-5 w-5" />
      case 'DOCX': return <FileText className="h-5 w-5" />
      default: return <FileText className="h-5 w-5" />
    }
  }

  // Get format description
  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'PDF': return 'Documento PDF con formato profesional'
      case 'CSV': return 'Archivo CSV para análisis de datos'
      case 'JSON': return 'Archivo JSON para integración con sistemas'
      case 'DOCX': return 'Documento Word editable'
      default: return 'Formato de exportación'
    }
  }

  // Handle export
  const handleExport = () => {
    const template = selectedTemplate || {
      id: 'default',
      name: 'Plantilla por Defecto',
      description: 'Plantilla estándar de exportación',
      format: selectedFormat,
      settings: exportOptions,
      sections: [],
      fields: []
    }

    if (onExport) {
      onExport(selectedFormat, template, exportOptions)
    }
  }

  // Handle save template
  const handleSaveTemplate = () => {
    if (!templateName) return

    const newTemplate: ExportTemplate = {
      id: `template-${Date.now()}`,
      name: templateName,
      description: templateDescription,
      format: selectedFormat,
      settings: templateSettings,
      sections: templateSettings.sections,
      fields: templateSettings.fields
    }

    if (onSaveTemplate) {
      onSaveTemplate(newTemplate)
    }

    // Reset form
    setTemplateName('')
    setTemplateDescription('')
    setShowTemplateEditor(false)
  }

  // Handle preview
  const handlePreview = () => {
    if (onPreview && selectedTemplate) {
      onPreview(selectedTemplate)
    }
    setShowPreview(true)
  }

  // Generate preview content
  const generatePreviewContent = () => {
    return (
      <div className="p-8 bg-white" ref={previewRef}>
        {/* Header */}
        {exportOptions.includeHeader && (
          <div className="border-b pb-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: exportOptions.customColors.primary }}>
                  {formTitle}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Formulario Médico - {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                {patientInfo && (
                  <div className="text-sm">
                    <p className="font-medium">{patientInfo.firstName} {patientInfo.lastName}</p>
                    <p className="text-muted-foreground">
                      {new Date(patientInfo.dateOfBirth).toLocaleDateString()} • {patientInfo.gender}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Patient Information */}
        {patientInfo && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3" style={{ color: exportOptions.customColors.secondary }}>
              Información del Paciente
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Nombre:</span> {patientInfo.firstName} {patientInfo.lastName}
              </div>
              <div>
                <span className="font-medium">Fecha de Nacimiento:</span> {new Date(patientInfo.dateOfBirth).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">Género:</span> {patientInfo.gender}
              </div>
              {patientInfo.phone && (
                <div>
                  <span className="font-medium">Teléfono:</span> {patientInfo.phone}
                </div>
              )}
              {patientInfo.email && (
                <div>
                  <span className="font-medium">Email:</span> {patientInfo.email}
                </div>
              )}
              {patientInfo.address && (
                <div className="col-span-2">
                  <span className="font-medium">Dirección:</span> {patientInfo.address}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Data */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: exportOptions.customColors.secondary }}>
            Datos del Formulario
          </h2>
          <div className="space-y-3">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key} className="border-l-4 pl-4" style={{ borderColor: exportOptions.customColors.accent }}>
                <div className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className="text-sm text-muted-foreground">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Metadata */}
        {exportOptions.includeMetadata && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3" style={{ color: exportOptions.customColors.secondary }}>
              Metadatos
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">ID del Formulario:</span> {formId}
              </div>
              <div>
                <span className="font-medium">Fecha de Exportación:</span> {new Date().toLocaleString()}
              </div>
              {therapistInfo && (
                <div>
                  <span className="font-medium">Terapeuta:</span> {therapistInfo.name}
                </div>
              )}
              <div>
                <span className="font-medium">Formato:</span> {selectedFormat}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {exportOptions.includeFooter && (
          <div className="border-t pt-4 mt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>Documento generado automáticamente el {new Date().toLocaleString()}</p>
              <p>Centro de Terapia Especializada - Sistema de Gestión de Formularios Médicos</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Exportar Formulario</h2>
          <p className="text-muted-foreground">{formTitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handlePreview} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="export">Exportar</TabsTrigger>
          <TabsTrigger value="templates">Plantillas</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Format Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Formato de Exportación</CardTitle>
                <CardDescription>
                  Selecciona el formato y las opciones de exportación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Formato</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {(['PDF', 'CSV', 'JSON', 'DOCX'] as const).map((format) => (
                      <Button
                        key={format}
                        variant={selectedFormat === format ? 'default' : 'outline'}
                        onClick={() => setSelectedFormat(format)}
                        className="h-auto p-4"
                      >
                        <div className="text-center">
                          {getFormatIcon(format)}
                          <div className="font-medium mt-1">{format}</div>
                          <div className="text-xs text-muted-foreground">
                            {getFormatDescription(format)}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Export Options */}
                <div className="space-y-3">
                  <Label>Opciones de Exportación</Label>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-header">Incluir Encabezado</Label>
                    <Switch
                      id="include-header"
                      checked={exportOptions.includeHeader}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeHeader: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-footer">Incluir Pie de Página</Label>
                    <Switch
                      id="include-footer"
                      checked={exportOptions.includeFooter}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeFooter: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-metadata">Incluir Metadatos</Label>
                    <Switch
                      id="include-metadata"
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeMetadata: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-comments">Incluir Comentarios</Label>
                    <Switch
                      id="include-comments"
                      checked={exportOptions.includeComments}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeComments: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-signatures">Incluir Firmas</Label>
                    <Switch
                      id="include-signatures"
                      checked={exportOptions.includeSignatures}
                      onCheckedChange={(checked) => setExportOptions(prev => ({ ...prev, includeSignatures: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Layout Options */}
            <Card>
              <CardHeader>
                <CardTitle>Opciones de Diseño</CardTitle>
                <CardDescription>
                  Personaliza la apariencia del documento exportado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="page-orientation">Orientación de Página</Label>
                  <Select
                    value={exportOptions.pageOrientation}
                    onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, pageOrientation: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Vertical</SelectItem>
                      <SelectItem value="landscape">Horizontal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="font-size">Tamaño de Fuente</Label>
                  <Select
                    value={exportOptions.fontSize}
                    onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, fontSize: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeño</SelectItem>
                      <SelectItem value="medium">Mediano</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="color-scheme">Esquema de Colores</Label>
                  <Select
                    value={exportOptions.colorScheme}
                    onValueChange={(value: any) => setExportOptions(prev => ({ ...prev, colorScheme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Por Defecto</SelectItem>
                      <SelectItem value="professional">Profesional</SelectItem>
                      <SelectItem value="medical">Médico</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {exportOptions.colorScheme === 'custom' && (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="primary-color">Color Primario</Label>
                      <Input
                        id="primary-color"
                        type="color"
                        value={exportOptions.customColors.primary}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, primary: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondary-color">Color Secundario</Label>
                      <Input
                        id="secondary-color"
                        type="color"
                        value={exportOptions.customColors.secondary}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, secondary: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accent-color">Color de Acento</Label>
                      <Input
                        id="accent-color"
                        type="color"
                        value={exportOptions.customColors.accent}
                        onChange={(e) => setExportOptions(prev => ({
                          ...prev,
                          customColors: { ...prev.customColors, accent: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plantillas de Exportación</CardTitle>
                  <CardDescription>
                    Gestiona plantillas personalizadas para exportación
                  </CardDescription>
                </div>
                <Button onClick={() => setShowTemplateEditor(true)}>
                  <Save className="h-4 w-4 mr-2" />
                  Nueva Plantilla
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay plantillas guardadas</p>
                  <Button onClick={() => setShowTemplateEditor(true)} className="mt-4">
                    <Save className="h-4 w-4 mr-2" />
                    Crear Primera Plantilla
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="outline">{template.format}</Badge>
                        </div>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Orientación:</span>
                            <span className="capitalize">{template.settings.pageOrientation}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Tamaño:</span>
                            <span className="capitalize">{template.settings.fontSize}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Colores:</span>
                            <span className="capitalize">{template.settings.colorScheme}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template)
                              setExportOptions({
                                ...template.settings,
                                sections: template.sections,
                                fields: template.fields
                              })
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Usar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTemplateName(template.name)
                              setTemplateDescription(template.description)
                              setTemplateSettings({
                                ...template.settings,
                                sections: template.sections,
                                fields: template.fields
                              })
                              setShowTemplateEditor(true)
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa del Documento</CardTitle>
              <CardDescription>
                Previsualiza cómo se verá el documento exportado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                {generatePreviewContent()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Editor Dialog */}
      {showTemplateEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Guardar Plantilla</CardTitle>
              <CardDescription>
                Guarda la configuración actual como una plantilla reutilizable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                <Input
                  id="template-name"
                  placeholder="Ej: Plantilla Médica Profesional"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="template-description">Descripción</Label>
                <Textarea
                  id="template-description"
                  placeholder="Describe el propósito de esta plantilla..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowTemplateEditor(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSaveTemplate} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Plantilla
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
