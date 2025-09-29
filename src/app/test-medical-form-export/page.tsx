'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { MedicalFormExport } from '@/components/medical-form/medical-form-export'
import { PDFGenerator } from '@/components/medical-form/pdf-generator'
import { generateCSVFromData, generateJSONFromData } from '@/components/medical-form/pdf-generator'

// Mock data for testing
const mockFormData = {
  'personal-info': {
    name: 'Juan',
    lastName: 'Pérez',
    dateOfBirth: '2020-03-15',
    gender: 'Masculino',
    address: 'Calle Principal 123, Ciudad',
    phone: '+1 234 567 8900',
    email: 'juan.perez@email.com'
  },
  'medical-history': {
    conditions: 'Ninguna condición médica conocida',
    medications: 'No toma medicamentos actualmente',
    allergies: 'Ninguna alergia conocida',
    surgeries: 'Ninguna cirugía previa'
  },
  'family-history': {
    mentalHealth: 'Sin antecedentes de problemas de salud mental',
    physicalConditions: 'Abuelo con diabetes tipo 2',
    geneticConditions: 'Ninguna condición genética conocida'
  },
  'developmental-history': {
    milestones: 'Desarrollo normal para la edad',
    concerns: 'Ligero retraso en el habla',
    schoolPerformance: 'Rendimiento académico adecuado'
  },
  'behavioral-assessment': {
    socialSkills: 'Buenas habilidades sociales',
    communication: 'Comunicación verbal en desarrollo',
    attention: 'Atención adecuada para la edad',
    behavior: 'Comportamiento apropiado'
  }
}

const mockPatientInfo = {
  firstName: 'Juan',
  lastName: 'Pérez',
  dateOfBirth: '2020-03-15',
  gender: 'Masculino',
  address: 'Calle Principal 123, Ciudad',
  phone: '+1 234 567 8900',
  email: 'juan.perez@email.com'
}

const mockTherapistInfo = {
  id: 'therapist-1',
  name: 'Dr. María González',
  email: 'maria@therapycenter.com',
  role: 'THERAPIST' as const
}

const mockTemplates = [
  {
    id: 'template-1',
    name: 'Plantilla Médica Profesional',
    description: 'Plantilla estándar para documentos médicos profesionales',
    format: 'PDF' as const,
    settings: {
      includeHeader: true,
      includeFooter: true,
      includeMetadata: true,
      includeComments: false,
      includeSignatures: true,
      pageOrientation: 'portrait' as const,
      fontSize: 'medium' as const,
      colorScheme: 'medical' as const
    },
    sections: ['personal-info', 'medical-history'],
    fields: ['name', 'conditions', 'medications']
  },
  {
    id: 'template-2',
    name: 'Plantilla de Datos CSV',
    description: 'Plantilla para exportación de datos en formato CSV',
    format: 'CSV' as const,
    settings: {
      includeHeader: true,
      includeFooter: false,
      includeMetadata: false,
      includeComments: false,
      includeSignatures: false,
      pageOrientation: 'portrait' as const,
      fontSize: 'medium' as const,
      colorScheme: 'default' as const
    },
    sections: [],
    fields: []
  },
  {
    id: 'template-3',
    name: 'Plantilla JSON Completa',
    description: 'Plantilla para exportación completa en formato JSON',
    format: 'JSON' as const,
    settings: {
      includeHeader: false,
      includeFooter: false,
      includeMetadata: true,
      includeComments: true,
      includeSignatures: false,
      pageOrientation: 'portrait' as const,
      fontSize: 'medium' as const,
      colorScheme: 'default' as const
    },
    sections: [],
    fields: []
  }
]

export default function TestMedicalFormExportPage() {
  const [activeView, setActiveView] = useState<'export' | 'pdf-generator'>('export')
  const [templates, setTemplates] = useState(mockTemplates)
  const [exportHistory, setExportHistory] = useState<any[]>([])

  const handleExport = (format: string, template: any, options: any) => {
    console.log('Exporting:', { format, template, options })
    
    let blob: Blob
    let filename: string

    switch (format) {
      case 'CSV':
        blob = generateCSVFromData(mockFormData, { filename: 'formulario-medico' })
        filename = 'formulario-medico.csv'
        break
      case 'JSON':
        blob = generateJSONFromData(mockFormData, { filename: 'formulario-medico', pretty: true })
        filename = 'formulario-medico.json'
        break
      case 'PDF':
      default:
        // Mock PDF blob
        blob = new Blob(['Mock PDF content'], { type: 'application/pdf' })
        filename = 'formulario-medico.pdf'
        break
    }

    // Download the file
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Add to export history
    const exportRecord = {
      id: `export-${Date.now()}`,
      format,
      template: template.name,
      filename,
      timestamp: new Date().toISOString(),
      size: blob.size
    }
    setExportHistory(prev => [exportRecord, ...prev])

    alert(`Archivo ${filename} exportado exitosamente`)
  }

  const handleSaveTemplate = (template: any) => {
    console.log('Saving template:', template)
    setTemplates(prev => [template, ...prev])
    alert('Plantilla guardada exitosamente')
  }

  const handlePreview = (template: any) => {
    console.log('Previewing template:', template)
    alert('Vista previa de plantilla')
  }

  const handlePDFGenerate = (pdfBlob: Blob) => {
    console.log('PDF generated:', pdfBlob)
    const exportRecord = {
      id: `pdf-${Date.now()}`,
      format: 'PDF',
      template: 'Generador PDF',
      filename: 'formulario-medico.pdf',
      timestamp: new Date().toISOString(),
      size: pdfBlob.size
    }
    setExportHistory(prev => [exportRecord, ...prev])
  }

  const handlePDFError = (error: string) => {
    console.error('PDF generation error:', error)
    alert(`Error al generar PDF: ${error}`)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Download className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Sistema de Exportación de Formularios Médicos</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo para exportar formularios médicos en múltiples formatos con plantillas personalizables y generación de PDF.
      </p>

      {/* View Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Vista</CardTitle>
          <CardDescription>
            Elige entre la vista de exportación general o el generador de PDF específico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={activeView === 'export' ? 'default' : 'outline'}
              onClick={() => setActiveView('export')}
              className="h-auto p-4"
            >
              <div className="text-center">
                <Download className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Exportación General</div>
                <div className="text-sm text-muted-foreground">
                  Exportar en múltiples formatos con plantillas
                </div>
              </div>
            </Button>

            <Button
              variant={activeView === 'pdf-generator' ? 'default' : 'outline'}
              onClick={() => setActiveView('pdf-generator')}
              className="h-auto p-4"
            >
              <div className="text-center">
                <FileText className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Generador de PDF</div>
                <div className="text-sm text-muted-foreground">
                  Generación específica de documentos PDF
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
              Múltiples Formatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Exporta en PDF, CSV, JSON y DOCX con opciones personalizables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Palette className="h-4 w-4 mr-2 text-blue-600" />
              Plantillas Personalizables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Crea y guarda plantillas con estilos y configuraciones personalizadas
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
              Previsualiza documentos antes de exportar con vista previa en tiempo real
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Settings className="h-4 w-4 mr-2 text-orange-600" />
              Configuración Avanzada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Opciones avanzadas de diseño, colores, fuentes y layout
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Exportaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exportHistory.length}</div>
            <p className="text-xs text-muted-foreground">Documentos generados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Plantillas Guardadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">Plantillas disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Formatos Soportados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">PDF, CSV, JSON, DOCX</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tamaño Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exportHistory.length > 0 
                ? Math.round(exportHistory.reduce((sum, exp) => sum + exp.size, 0) / exportHistory.length / 1024)
                : 0
              }KB
            </div>
            <p className="text-xs text-muted-foreground">Por documento</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {activeView === 'export' && (
        <MedicalFormExport
          formId="form-123"
          formTitle="Evaluación Pediátrica - Juan Pérez"
          formData={mockFormData}
          patientInfo={mockPatientInfo}
          therapistInfo={mockTherapistInfo}
          templates={templates}
          onExport={handleExport}
          onSaveTemplate={handleSaveTemplate}
          onPreview={handlePreview}
        />
      )}

      {activeView === 'pdf-generator' && (
        <PDFGenerator
          content={
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Evaluación Pediátrica</h1>
                <p className="text-muted-foreground">Juan Pérez - 4 años</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Información Personal</h2>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Nombre:</strong> Juan Pérez</div>
                    <div><strong>Edad:</strong> 4 años</div>
                    <div><strong>Fecha de Nacimiento:</strong> 15/03/2020</div>
                    <div><strong>Género:</strong> Masculino</div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold mb-2">Historial Médico</h2>
                  <div className="space-y-2 text-sm">
                    <div><strong>Condiciones:</strong> Ninguna condición médica conocida</div>
                    <div><strong>Medicamentos:</strong> No toma medicamentos actualmente</div>
                    <div><strong>Alergias:</strong> Ninguna alergia conocida</div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold mb-2">Evaluación Conductual</h2>
                  <div className="space-y-2 text-sm">
                    <div><strong>Habilidades Sociales:</strong> Buenas habilidades sociales</div>
                    <div><strong>Comunicación:</strong> Comunicación verbal en desarrollo</div>
                    <div><strong>Atención:</strong> Atención adecuada para la edad</div>
                  </div>
                </div>
              </div>
            </div>
          }
          filename="evaluacion-pediatrica-juan-perez"
          title="Evaluación Pediátrica - Juan Pérez"
          onGenerate={handlePDFGenerate}
          onError={handlePDFError}
          showPreview={true}
          showProgress={true}
          autoDownload={false}
        />
      )}

      {/* Export History */}
      {exportHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Exportaciones</CardTitle>
            <CardDescription>
              Registro de todos los documentos exportados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exportHistory.slice(0, 5).map((exportRecord) => (
                <div key={exportRecord.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {exportRecord.format === 'PDF' && <FileText className="h-5 w-5 text-red-500" />}
                    {exportRecord.format === 'CSV' && <FileSpreadsheet className="h-5 w-5 text-green-500" />}
                    {exportRecord.format === 'JSON' && <FileJson className="h-5 w-5 text-blue-500" />}
                    <div>
                      <p className="font-medium">{exportRecord.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {exportRecord.template} • {new Date(exportRecord.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{exportRecord.format}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(exportRecord.size / 1024)}KB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Technical Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema incluye exportación en múltiples formatos 
          (PDF, CSV, JSON, DOCX) con plantillas personalizables, generación de PDF con vista previa, 
          configuración avanzada de diseño y colores, historial de exportaciones, y opciones de 
          compartir e imprimir. Los documentos mantienen la integridad de los datos médicos con 
          formato profesional.
        </AlertDescription>
      </Alert>

      {/* Format Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Formatos de Exportación</CardTitle>
          <CardDescription>
            Diferentes formatos disponibles para exportar formularios médicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <h3 className="font-medium">PDF</h3>
              <p className="text-sm text-muted-foreground">Documento profesional con formato médico</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <FileSpreadsheet className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-medium">CSV</h3>
              <p className="text-sm text-muted-foreground">Datos estructurados para análisis</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <FileJson className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-medium">JSON</h3>
              <p className="text-sm text-muted-foreground">Formato para integración con sistemas</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-medium">DOCX</h3>
              <p className="text-sm text-muted-foreground">Documento Word editable</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
