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
  FileText, 
  Edit, 
  Save, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Users,
  User,
  Calendar,
  Clock,
  DollarSign,
  Package,
  Tag,
  Settings,
  Plus,
  Minus,
  Copy,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Star,
  Award,
  Target,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Calculator,
  BookOpen,
  Lightbulb,
  Zap,
  Shield,
  UserCheck,
  UserPlus,
  UserMinus,
  UserX,
  GraduationCap,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Globe,
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
  ExternalLink,
  Lock,
  Unlock,
  EyeOff,
  EyeOn,
  Pencil,
  Trash2,
  Archive,
  Flag,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  FileCheck,
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
  FilePdf,
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
  FileRuler,
  FileRuler2,
  FileRuler3,
  FileRuler4,
  FileRuler5,
  FileRuler6,
  FileRuler7,
  FileRuler8,
  FileRuler9,
  FileRuler10,
  FileRuler11,
  FileRuler12,
  FileRuler13,
  FileRuler14,
  FileRuler15,
  FileRuler16,
  FileRuler17,
  FileRuler18,
  FileRuler19,
  FileRuler20,
  FileRuler21,
  FileRuler22,
  FileRuler23,
  FileRuler24,
  FileRuler25,
  FileRuler26,
  FileRuler27,
  FileRuler28,
  FileRuler29,
  FileRuler30,
  FileRuler31,
  FileRuler32,
  FileRuler33,
  FileRuler34,
  FileRuler35,
  FileRuler36,
  FileRuler37,
  FileRuler38,
  FileRuler39,
  FileRuler40,
  FileRuler41,
  FileRuler42,
  FileRuler43,
  FileRuler44,
  FileRuler45,
  FileRuler46,
  FileRuler47,
  FileRuler48,
  FileRuler49,
  FileRuler50,
  FileRuler51,
  FileRuler52,
  FileRuler53,
  FileRuler54,
  FileRuler55,
  FileRuler56,
  FileRuler57,
  FileRuler58,
  FileRuler59,
  FileRuler60,
  FileRuler61,
  FileRuler62,
  FileRuler63,
  FileRuler64,
  FileRuler65,
  FileRuler66,
  FileRuler67,
  FileRuler68,
  FileRuler69,
  FileRuler70,
  FileRuler71,
  FileRuler72,
  FileRuler73,
  FileRuler74,
  FileRuler75,
  FileRuler76,
  FileRuler77,
  FileRuler78,
  FileRuler79,
  FileRuler80,
  FileRuler81,
  FileRuler82,
  FileRuler83,
  FileRuler84,
  FileRuler85,
  FileRuler86,
  FileRuler87,
  FileRuler88,
  FileRuler89,
  FileRuler90,
  FileRuler91,
  FileRuler92,
  FileRuler93,
  FileRuler94,
  FileRuler95,
  FileRuler96,
  FileRuler97,
  FileRuler98,
  FileRuler99,
  FileRuler100
} from 'lucide-react'

interface Service {
  id: string
  code: string
  name: string
  description: string
  categoryId: string
  category: {
    id: string
    name: string
    color: string
    icon: string
  }
  type: 'EVALUATION' | 'TREATMENT' | 'CONSULTATION' | 'FOLLOW_UP' | 'ASSESSMENT'
  duration: number
  price: number
  currency: string
  isActive: boolean
  requiresApproval: boolean
  maxSessions?: number
  minSessions?: number
  ageRange?: {
    min: number
    max: number
  }
  prerequisites?: string[]
  outcomes?: string[]
  tags: string[]
}

interface Therapist {
  id: string
  name: string
  email: string
  phone?: string
  role: 'THERAPIST' | 'COORDINATOR' | 'ADMIN'
  specialties: string[]
  certifications: string[]
  experience: number
  education: string[]
  languages: string[]
  availability: {
    days: string[]
    hours: {
      start: string
      end: string
    }
    timezone: string
  }
  location: {
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  preferences: {
    maxPatientsPerDay: number
    preferredAgeGroups: string[]
    preferredServiceTypes: string[]
    workingHours: {
      start: string
      end: string
    }
  }
  performance: {
    averageRating: number
    totalPatients: number
    completionRate: number
    patientSatisfaction: number
  }
  isActive: boolean
  isAvailable: boolean
  currentWorkload: number
  maxWorkload: number
  createdAt: string
  updatedAt: string
}

interface Proposal {
  id: string
  patientId: string
  therapistId?: string
  therapist?: Therapist
  selectedServices: {
    service: Service
    sessionCount: number
    notes: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
  }[]
  totalSessions: number
  estimatedDuration: number
  estimatedCost: number
  currency: string
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  notes: string
  goals: string[]
  expectedOutcomes: string[]
  followUpRequired: boolean
  followUpNotes?: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
  coordinatorNotes?: string
  pricingNotes?: string
  approvalNotes?: string
}

interface ProposalReviewInterfaceProps {
  proposal: Proposal
  services?: Service[]
  therapists?: Therapist[]
  onSave?: (proposal: Proposal) => void
  onApprove?: (proposal: Proposal) => void
  onReject?: (proposal: Proposal) => void
  onRequestChanges?: (proposal: Proposal) => void
  onCancel?: () => void
  isEditing?: boolean
}

export function ProposalReviewInterface({
  proposal,
  services = [],
  therapists = [],
  onSave,
  onApprove,
  onReject,
  onRequestChanges,
  onCancel,
  isEditing = false
}: ProposalReviewInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'pricing' | 'validation' | 'notes'>('overview')
  const [editedProposal, setEditedProposal] = useState<Proposal>(proposal)
  const [showPricing, setShowPricing] = useState(true)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isDirty, setIsDirty] = useState(false)

  // Update edited proposal when proposal prop changes
  useEffect(() => {
    setEditedProposal(proposal)
    setIsDirty(false)
  }, [proposal])

  // Handle field changes
  const handleFieldChange = (field: string, value: any) => {
    setEditedProposal(prev => ({
      ...prev,
      [field]: value
    }))
    setIsDirty(true)
  }

  // Handle service changes
  const handleServiceChange = (serviceIndex: number, field: string, value: any) => {
    setEditedProposal(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.map((service, index) => 
        index === serviceIndex ? { ...service, [field]: value } : service
      )
    }))
    setIsDirty(true)
  }

  // Validate proposal
  const validateProposal = (): string[] => {
    const errors: string[] = []

    if (!editedProposal.notes.trim()) {
      errors.push('Las notas de la propuesta son requeridas')
    }

    if (editedProposal.goals.length === 0) {
      errors.push('Al menos un objetivo debe ser especificado')
    }

    if (editedProposal.expectedOutcomes.length === 0) {
      errors.push('Al menos un resultado esperado debe ser especificado')
    }

    if (editedProposal.selectedServices.length === 0) {
      errors.push('Al menos un servicio debe ser seleccionado')
    }

    editedProposal.selectedServices.forEach((service, index) => {
      if (service.sessionCount <= 0) {
        errors.push(`El número de sesiones para ${service.service.name} debe ser mayor a 0`)
      }
      
      if (service.service.maxSessions && service.sessionCount > service.service.maxSessions) {
        errors.push(`El número de sesiones para ${service.service.name} excede el máximo permitido (${service.service.maxSessions})`)
      }
      
      if (service.service.minSessions && service.sessionCount < service.service.minSessions) {
        errors.push(`El número de sesiones para ${service.service.name} es menor al mínimo requerido (${service.service.minSessions})`)
      }
    })

    return errors
  }

  // Handle save
  const handleSave = () => {
    const errors = validateProposal()
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    if (onSave) {
      onSave(editedProposal)
    }
    setIsDirty(false)
  }

  // Handle approve
  const handleApprove = () => {
    const errors = validateProposal()
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    if (onApprove) {
      onApprove(editedProposal)
    }
  }

  // Handle reject
  const handleReject = () => {
    if (onReject) {
      onReject(editedProposal)
    }
  }

  // Handle request changes
  const handleRequestChanges = () => {
    if (onRequestChanges) {
      onRequestChanges(editedProposal)
    }
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

  // Get service type color
  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'EVALUATION': return 'bg-blue-100 text-blue-800'
      case 'TREATMENT': return 'bg-green-100 text-green-800'
      case 'CONSULTATION': return 'bg-purple-100 text-purple-800'
      case 'FOLLOW_UP': return 'bg-orange-100 text-orange-800'
      case 'ASSESSMENT': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Calculate total cost
  const calculateTotalCost = () => {
    return editedProposal.selectedServices.reduce((total, service) => {
      return total + (service.service.price * service.sessionCount)
    }, 0)
  }

  // Calculate total duration
  const calculateTotalDuration = () => {
    return editedProposal.selectedServices.reduce((total, service) => {
      return total + (service.service.duration * service.sessionCount)
    }, 0)
  }

  // Calculate total sessions
  const calculateTotalSessions = () => {
    return editedProposal.selectedServices.reduce((total, service) => {
      return total + service.sessionCount
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Revisión de Propuesta Terapéutica
          </h1>
          <p className="text-muted-foreground">
            ID: {editedProposal.id} | Paciente: {editedProposal.patientId}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowPricing(!showPricing)}
          >
            {showPricing ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPricing ? 'Ocultar' : 'Mostrar'} Precios
          </Button>
          <Button onClick={handleSave} disabled={!isDirty}>
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Proposal Status and Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Información de la Propuesta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Estado</Label>
              <div className="mt-1">
                <Badge className={getStatusColor(editedProposal.status)}>
                  {editedProposal.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Prioridad</Label>
              <div className="mt-1">
                <Badge className={getPriorityColor(editedProposal.priority)}>
                  {editedProposal.priority}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Terapeuta Asignado</Label>
              <p className="text-sm mt-1">
                {editedProposal.therapist?.name || 'No asignado'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Fecha de Creación</Label>
              <p className="text-sm mt-1">
                {new Date(editedProposal.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Summary - Only visible to coordinators */}
      {showPricing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Resumen de Costos
            </CardTitle>
            <CardDescription>
              Información de precios visible solo para coordinadores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Sesiones Totales</Label>
                <p className="text-2xl font-bold">{calculateTotalSessions()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Duración Total</Label>
                <p className="text-2xl font-bold">
                  {Math.round(calculateTotalDuration() / 60)}h {calculateTotalDuration() % 60}m
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Costo Total</Label>
                <p className="text-2xl font-bold">
                  ${calculateTotalCost().toFixed(2)} {editedProposal.currency}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Costo por Sesión</Label>
                <p className="text-2xl font-bold">
                  ${(calculateTotalCost() / calculateTotalSessions()).toFixed(2)} {editedProposal.currency}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="pricing">Precios</TabsTrigger>
          <TabsTrigger value="validation">Validación</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Propuesta</CardTitle>
              <CardDescription>
                Información general y objetivos de la propuesta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="proposal-notes">Notas de la Propuesta</Label>
                <Textarea
                  id="proposal-notes"
                  value={editedProposal.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Descripción detallada de la propuesta..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="proposal-goals">Objetivos</Label>
                <div className="space-y-2 mt-1">
                  {editedProposal.goals.map((goal, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={goal}
                        onChange={(e) => {
                          const newGoals = [...editedProposal.goals]
                          newGoals[index] = e.target.value
                          handleFieldChange('goals', newGoals)
                        }}
                        placeholder="Objetivo de la terapia..."
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newGoals = editedProposal.goals.filter((_, i) => i !== index)
                          handleFieldChange('goals', newGoals)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newGoals = [...editedProposal.goals, '']
                      handleFieldChange('goals', newGoals)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Objetivo
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="proposal-outcomes">Resultados Esperados</Label>
                <div className="space-y-2 mt-1">
                  {editedProposal.expectedOutcomes.map((outcome, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={outcome}
                        onChange={(e) => {
                          const newOutcomes = [...editedProposal.expectedOutcomes]
                          newOutcomes[index] = e.target.value
                          handleFieldChange('expectedOutcomes', newOutcomes)
                        }}
                        placeholder="Resultado esperado..."
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOutcomes = editedProposal.expectedOutcomes.filter((_, i) => i !== index)
                          handleFieldChange('expectedOutcomes', newOutcomes)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOutcomes = [...editedProposal.expectedOutcomes, '']
                      handleFieldChange('expectedOutcomes', newOutcomes)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Resultado
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editedProposal.followUpRequired}
                  onCheckedChange={(checked) => handleFieldChange('followUpRequired', checked)}
                />
                <Label>Requiere Seguimiento</Label>
              </div>
              
              {editedProposal.followUpRequired && (
                <div>
                  <Label htmlFor="followup-notes">Notas de Seguimiento</Label>
                  <Textarea
                    id="followup-notes"
                    value={editedProposal.followUpNotes || ''}
                    onChange={(e) => handleFieldChange('followUpNotes', e.target.value)}
                    placeholder="Notas sobre el seguimiento requerido..."
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Servicios Seleccionados</CardTitle>
              <CardDescription>
                Revisa y edita los servicios incluidos en la propuesta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {editedProposal.selectedServices.map((service, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{service.service.name}</CardTitle>
                          <CardDescription>{service.service.description}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getServiceTypeColor(service.service.type)}>
                            {service.service.type}
                          </Badge>
                          <Badge className={getPriorityColor(service.priority)}>
                            {service.priority}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`service-${index}-sessions`}>Número de Sesiones</Label>
                          <Input
                            id={`service-${index}-sessions`}
                            type="number"
                            value={service.sessionCount}
                            onChange={(e) => handleServiceChange(index, 'sessionCount', parseInt(e.target.value) || 0)}
                            min={service.service.minSessions || 1}
                            max={service.service.maxSessions || 100}
                          />
                          {service.service.minSessions && service.service.maxSessions && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Rango: {service.service.minSessions} - {service.service.maxSessions} sesiones
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <Label htmlFor={`service-${index}-priority`}>Prioridad</Label>
                          <Select
                            value={service.priority}
                            onValueChange={(value: any) => handleServiceChange(index, 'priority', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HIGH">Alta</SelectItem>
                              <SelectItem value="MEDIUM">Media</SelectItem>
                              <SelectItem value="LOW">Baja</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor={`service-${index}-notes`}>Notas</Label>
                          <Input
                            id={`service-${index}-notes`}
                            value={service.notes}
                            onChange={(e) => handleServiceChange(index, 'notes', e.target.value)}
                            placeholder="Notas sobre este servicio..."
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Duración por sesión:</span>
                            <span className="ml-2">{service.service.duration} minutos</span>
                          </div>
                          <div>
                            <span className="font-medium">Duración total:</span>
                            <span className="ml-2">{service.service.duration * service.sessionCount} minutos</span>
                          </div>
                          {showPricing && (
                            <div>
                              <span className="font-medium">Costo total:</span>
                              <span className="ml-2">${(service.service.price * service.sessionCount).toFixed(2)} {editedProposal.currency}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          {showPricing ? (
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Precios</CardTitle>
                <CardDescription>
                  Desglose detallado de costos por servicio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {editedProposal.selectedServices.map((service, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{service.service.name}</h3>
                        <Badge className={getServiceTypeColor(service.service.type)}>
                          {service.service.type}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Precio por Sesión</Label>
                          <p className="text-lg font-bold">${service.service.price.toFixed(2)}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Número de Sesiones</Label>
                          <p className="text-lg font-bold">{service.sessionCount}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Subtotal</Label>
                          <p className="text-lg font-bold">
                            ${(service.service.price * service.sessionCount).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Costo por Hora</Label>
                          <p className="text-lg font-bold">
                            ${(service.service.price / (service.service.duration / 60)).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Total de Sesiones</Label>
                        <p className="text-2xl font-bold">{calculateTotalSessions()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Duración Total</Label>
                        <p className="text-2xl font-bold">
                          {Math.round(calculateTotalDuration() / 60)}h {calculateTotalDuration() % 60}m
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Costo Total</Label>
                        <p className="text-2xl font-bold text-green-600">
                          ${calculateTotalCost().toFixed(2)} {editedProposal.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Información de Precios Ocultada</h3>
                <p className="text-muted-foreground">
                  Los precios están ocultos. Haz clic en "Mostrar Precios" para ver la información de costos.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Validación de la Propuesta
              </CardTitle>
              <CardDescription>
                Verifica que la propuesta cumple con todos los requisitos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Validaciones de Contenido</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Notas de la propuesta</span>
                        <div className="flex items-center space-x-2">
                          {editedProposal.notes.trim() ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Objetivos definidos</span>
                        <div className="flex items-center space-x-2">
                          {editedProposal.goals.length > 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Resultados esperados</span>
                        <div className="flex items-center space-x-2">
                          {editedProposal.expectedOutcomes.length > 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Validaciones de Servicios</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Servicios seleccionados</span>
                        <div className="flex items-center space-x-2">
                          {editedProposal.selectedServices.length > 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sesiones válidas</span>
                        <div className="flex items-center space-x-2">
                          {editedProposal.selectedServices.every(s => s.sessionCount > 0) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Límites de sesiones</span>
                        <div className="flex items-center space-x-2">
                          {editedProposal.selectedServices.every(s => 
                            (!s.service.maxSessions || s.sessionCount <= s.service.maxSessions) &&
                            (!s.service.minSessions || s.sessionCount >= s.service.minSessions)
                          ) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {validationErrors.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {validationErrors.map((error, index) => (
                          <div key={index} className="text-sm">{error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notas de Revisión</CardTitle>
              <CardDescription>
                Notas internas para coordinadores y administradores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="coordinator-notes">Notas del Coordinador</Label>
                <Textarea
                  id="coordinator-notes"
                  value={editedProposal.coordinatorNotes || ''}
                  onChange={(e) => handleFieldChange('coordinatorNotes', e.target.value)}
                  placeholder="Notas internas del coordinador..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="pricing-notes">Notas de Precios</Label>
                <Textarea
                  id="pricing-notes"
                  value={editedProposal.pricingNotes || ''}
                  onChange={(e) => handleFieldChange('pricingNotes', e.target.value)}
                  placeholder="Notas sobre precios y costos..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="approval-notes">Notas de Aprobación</Label>
                <Textarea
                  id="approval-notes"
                  value={editedProposal.approvalNotes || ''}
                  onChange={(e) => handleFieldChange('approvalNotes', e.target.value)}
                  placeholder="Notas sobre la aprobación..."
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRequestChanges}
            className="text-yellow-600"
          >
            <Edit className="h-4 w-4 mr-2" />
            Solicitar Cambios
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReject}
            className="text-red-600"
          >
            <X className="h-4 w-4 mr-2" />
            Rechazar
          </Button>
          
          <Button
            onClick={handleApprove}
            className="text-green-600"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprobar
          </Button>
        </div>
      </div>
    </div>
  )
}
