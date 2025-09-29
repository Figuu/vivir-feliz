'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Download, 
  Eye, 
  EyeOff, 
  Settings, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  FilePdf,
  Printer,
  Share,
  Copy,
  ExternalLink,
  Info,
  Lock,
  Unlock,
  User,
  UserCheck,
  Crown,
  DollarSign,
  BarChart3,
  Users,
  Shield,
  CreditCard,
  MessageSquare,
  FileCheck,
  Calendar,
  Clock,
  Target,
  Activity,
  Heart,
  Brain,
  Baby,
  Coffee,
  Sun,
  Moon,
  Home,
  Work,
  School,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
  Flag,
  ThumbsUp,
  ThumbsDown,
  FileX,
  FileEdit,
  FileSearch,
  FileBarChart,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileJson,
  FileWord,
  FileExcel,
  FilePowerpoint,
  FileArchive,
  FileMinus,
  FilePlus,
  FileSlash,
  FileSymlink,
  FileType,
  FileUp,
  FileDown,
  FileClock,
  FileHeart,
  FileWarning,
  FileQuestion,
  FileInfo,
  FileLock,
  FileUnlock,
  FileShield,
  FileKey,
  FileUser,
  FileUsers,
  FileSettings,
  FileCog,
  FileGear,
  FileWrench,
  FileHammer,
  FileTool,
  FileWrench2,
  FileScrewdriver,
  FileNut,
  FileBolt,
  FileRuler
} from 'lucide-react'
import { 
  ProposalPDFGenerator, 
  type Proposal, 
  type CostBreakdown, 
  type PDFGenerationOptions,
  type PDFGenerationResult
} from '@/lib/proposal-pdf-generator'

interface ProposalPDFGeneratorProps {
  proposal: Proposal
  costBreakdown: CostBreakdown
  userRole: 'therapist' | 'coordinator' | 'admin'
  onPDFGenerated?: (result: PDFGenerationResult) => void
  onPDFDownloaded?: (result: PDFGenerationResult) => void
  className?: string
}

export function ProposalPDFGeneratorComponent({
  proposal,
  costBreakdown,
  userRole,
  onPDFGenerated,
  onPDFDownloaded,
  className
}: ProposalPDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<PDFGenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  
  const [options, setOptions] = useState<PDFGenerationOptions>({
    includePricing: userRole !== 'therapist',
    includeCostBreakdown: userRole !== 'therapist',
    includeTherapistInfo: true,
    includeNotes: true,
    includeApprovalInfo: userRole !== 'therapist',
    includeInsuranceInfo: userRole !== 'therapist',
    includePaymentTerms: userRole !== 'therapist',
    headerColor: '#3b82f6',
    footerText: 'Centro de Terapia Especializada - Propuesta Terapéutica',
    pageSize: 'A4',
    orientation: 'portrait',
    margins: {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    }
  })

  const pdfGenerator = useRef(new ProposalPDFGenerator())
  const previewRef = useRef<HTMLIFrameElement>(null)

  // Get role information
  const getRoleInfo = () => {
    switch (userRole) {
      case 'therapist':
        return {
          name: 'Terapeuta',
          description: 'Puede generar PDF sin información de precios',
          icon: <User className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800',
          canViewPricing: false
        }
      case 'coordinator':
        return {
          name: 'Coordinador',
          description: 'Puede generar PDF con información de precios',
          icon: <UserCheck className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800',
          canViewPricing: true
        }
      case 'admin':
        return {
          name: 'Administrador',
          description: 'Puede generar PDF con toda la información',
          icon: <Crown className="h-4 w-4" />,
          color: 'bg-purple-100 text-purple-800',
          canViewPricing: true
        }
      default:
        return {
          name: 'Desconocido',
          description: 'Rol no reconocido',
          icon: <User className="h-4 w-4" />,
          color: 'bg-gray-100 text-gray-800',
          canViewPricing: false
        }
    }
  }

  const roleInfo = getRoleInfo()

  // Handle PDF generation
  const handleGeneratePDF = async () => {
    setIsGenerating(true)
    setError(null)
    setGeneratedResult(null)

    try {
      const result = await pdfGenerator.current.generateProposalPDF(
        proposal,
        costBreakdown,
        userRole,
        options
      )

      setGeneratedResult(result)
      
      if (result.success) {
        if (onPDFGenerated) {
          onPDFGenerated(result)
        }
      } else {
        setError(result.error || 'Error generando PDF')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!generatedResult) return

    try {
      await pdfGenerator.current.downloadPDF(generatedResult)
      
      if (onPDFDownloaded) {
        onPDFDownloaded(generatedResult)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error descargando PDF')
    }
  }

  // Handle options change
  const handleOptionsChange = (key: keyof PDFGenerationOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Handle nested options change
  const handleNestedOptionsChange = (key: string, subKey: string, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: {
        ...(prev[key as keyof PDFGenerationOptions] as any),
        [subKey]: value
      }
    }))
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800'
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FilePdf className="h-5 w-5 mr-2" />
                Generador de PDF de Propuesta
              </CardTitle>
              <CardDescription>
                Genera y descarga PDFs de propuestas terapéuticas con información personalizada según el rol
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={roleInfo.color}>
                {roleInfo.icon}
                <span className="ml-1">{roleInfo.name}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">ID de Propuesta</Label>
              <p className="text-lg font-bold">{proposal.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Estado</Label>
              <Badge className={getStatusColor(proposal.status)}>
                {proposal.status}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Prioridad</Label>
              <Badge className={getPriorityColor(proposal.priority)}>
                {proposal.priority}
              </Badge>
            </div>
            <div>
              <Label className="text-sm font-medium">Servicios</Label>
              <p className="text-lg font-bold">{proposal.selectedServices.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Options Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Opciones de Generación
              </CardTitle>
              <CardDescription>
                Configura qué información incluir en el PDF
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOptions(!showOptions)}
            >
              {showOptions ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showOptions ? 'Ocultar' : 'Mostrar'} Opciones
            </Button>
          </div>
        </CardHeader>
        {showOptions && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Options */}
              <div className="space-y-4">
                <h3 className="font-medium">Información Básica</h3>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={options.includeTherapistInfo}
                    onCheckedChange={(checked) => handleOptionsChange('includeTherapistInfo', checked)}
                  />
                  <Label>Incluir Información del Terapeuta</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={options.includeNotes}
                    onCheckedChange={(checked) => handleOptionsChange('includeNotes', checked)}
                  />
                  <Label>Incluir Notas y Comentarios</Label>
                </div>
              </div>

              {/* Financial Options */}
              <div className="space-y-4">
                <h3 className="font-medium">Información Financiera</h3>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={options.includePricing}
                    onCheckedChange={(checked) => handleOptionsChange('includePricing', checked)}
                    disabled={!roleInfo.canViewPricing}
                  />
                  <Label className={!roleInfo.canViewPricing ? 'text-muted-foreground' : ''}>
                    Incluir Precios
                    {!roleInfo.canViewPricing && <Lock className="h-3 w-3 ml-1" />}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={options.includeCostBreakdown}
                    onCheckedChange={(checked) => handleOptionsChange('includeCostBreakdown', checked)}
                    disabled={!roleInfo.canViewPricing}
                  />
                  <Label className={!roleInfo.canViewPricing ? 'text-muted-foreground' : ''}>
                    Incluir Desglose de Costos
                    {!roleInfo.canViewPricing && <Lock className="h-3 w-3 ml-1" />}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={options.includeApprovalInfo}
                    onCheckedChange={(checked) => handleOptionsChange('includeApprovalInfo', checked)}
                    disabled={!roleInfo.canViewPricing}
                  />
                  <Label className={!roleInfo.canViewPricing ? 'text-muted-foreground' : ''}>
                    Incluir Información de Aprobación
                    {!roleInfo.canViewPricing && <Lock className="h-3 w-3 ml-1" />}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={options.includeInsuranceInfo}
                    onCheckedChange={(checked) => handleOptionsChange('includeInsuranceInfo', checked)}
                    disabled={!roleInfo.canViewPricing}
                  />
                  <Label className={!roleInfo.canViewPricing ? 'text-muted-foreground' : ''}>
                    Incluir Información de Seguro
                    {!roleInfo.canViewPricing && <Lock className="h-3 w-3 ml-1" />}
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={options.includePaymentTerms}
                    onCheckedChange={(checked) => handleOptionsChange('includePaymentTerms', checked)}
                    disabled={!roleInfo.canViewPricing}
                  />
                  <Label className={!roleInfo.canViewPricing ? 'text-muted-foreground' : ''}>
                    Incluir Términos de Pago
                    {!roleInfo.canViewPricing && <Lock className="h-3 w-3 ml-1" />}
                  </Label>
                </div>
              </div>
            </div>

            {/* Format Options */}
            <div className="space-y-4">
              <h3 className="font-medium">Opciones de Formato</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="page-size">Tamaño de Página</Label>
                  <Select
                    value={options.pageSize}
                    onValueChange={(value) => handleOptionsChange('pageSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4</SelectItem>
                      <SelectItem value="LETTER">Carta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="orientation">Orientación</Label>
                  <Select
                    value={options.orientation}
                    onValueChange={(value) => handleOptionsChange('orientation', value)}
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
                  <Label htmlFor="header-color">Color del Encabezado</Label>
                  <Input
                    id="header-color"
                    type="color"
                    value={options.headerColor}
                    onChange={(e) => handleOptionsChange('headerColor', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="footer-text">Texto del Pie de Página</Label>
                <Input
                  id="footer-text"
                  value={options.footerText}
                  onChange={(e) => handleOptionsChange('footerText', e.target.value)}
                  placeholder="Texto del pie de página..."
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generar PDF</CardTitle>
          <CardDescription>
            Genera y descarga el PDF de la propuesta con las opciones configuradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="flex items-center"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generando...' : 'Generar PDF'}
            </Button>

            {generatedResult && generatedResult.success && (
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            )}

            {generatedResult && generatedResult.success && (
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                className="flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Ocultar' : 'Mostrar'} Vista Previa
              </Button>
            )}
          </div>

          {/* Generation Result */}
          {generatedResult && (
            <div className="mt-4 p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                {generatedResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {generatedResult.success ? 'PDF Generado Exitosamente' : 'Error al Generar PDF'}
                </span>
              </div>
              
              {generatedResult.success && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Archivo:</span>
                    <span className="ml-2">{generatedResult.fileName}</span>
                  </div>
                  <div>
                    <span className="font-medium">Tamaño:</span>
                    <span className="ml-2">{(generatedResult.fileSize / 1024).toFixed(1)} KB</span>
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span>
                    <span className="ml-2 text-green-600">Listo para descargar</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Preview */}
      {showPreview && generatedResult && generatedResult.success && (
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa del PDF</CardTitle>
            <CardDescription>
              Vista previa del PDF generado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <iframe
                ref={previewRef}
                src={generatedResult.url}
                width="100%"
                height="600"
                className="border-0"
                title="PDF Preview"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información de Rol:</strong> Como {roleInfo.name.toLowerCase()}, 
          {roleInfo.canViewPricing 
            ? ' puedes generar PDFs con información completa de precios y costos.' 
            : ' puedes generar PDFs con información de servicios pero sin detalles de precios.'
          }
          {!roleInfo.canViewPricing && ' Las opciones de información financiera están deshabilitadas para tu rol.'}
        </AlertDescription>
      </Alert>
    </div>
  )
}
