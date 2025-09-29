'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calculator, 
  DollarSign, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Settings, 
  Info,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Percent,
  CreditCard,
  Shield,
  Users,
  User,
  UserCheck,
  Crown,
  Building,
  Receipt,
  FileText,
  Target,
  Activity,
  Clock,
  Calendar,
  Package,
  Tag,
  Star,
  Award,
  Zap,
  Lightbulb,
  BookOpen,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Save,
  Edit,
  Plus,
  Minus,
  X,
  Check,
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Bell,
  Mail,
  Phone,
  MapPin,
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
  Pencil,
  Trash2,
  Copy,
  Archive,
  Flag,
  ThumbsUp,
  ThumbsDown,
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
  FileRuler
} from 'lucide-react'
import { CostCalculationDisplay } from '@/components/therapeutic-proposal/cost-calculation-display'
import { 
  ProposalCostCalculator, 
  CostCalculationUtils,
  type SelectedService,
  type CostCalculationOptions,
  type CostBreakdown
} from '@/lib/proposal-cost-calculator'

// Mock data for testing
const mockServices = [
  {
    id: 'service-1',
    code: 'EVAL-001',
    name: 'Evaluación Pediátrica Integral',
    description: 'Evaluación completa del desarrollo infantil incluyendo aspectos cognitivos, emocionales y conductuales',
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Terapia Pediátrica',
      color: '#3b82f6',
      icon: 'baby'
    },
    type: 'EVALUATION' as const,
    duration: 120,
    price: 150.00,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 1,
    minSessions: 1,
    ageRange: { min: 2, max: 18 },
    prerequisites: ['Historial médico', 'Informes escolares'],
    outcomes: ['Diagnóstico integral', 'Plan de tratamiento', 'Recomendaciones'],
    tags: ['pediatric', 'evaluation', 'development']
  },
  {
    id: 'service-2',
    code: 'TREAT-001',
    name: 'Terapia de Lenguaje',
    description: 'Intervención terapéutica para mejorar las habilidades de comunicación y lenguaje',
    categoryId: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Terapia Pediátrica',
      color: '#3b82f6',
      icon: 'baby'
    },
    type: 'TREATMENT' as const,
    duration: 60,
    price: 80.00,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 20,
    minSessions: 8,
    ageRange: { min: 3, max: 12 },
    prerequisites: ['Evaluación previa'],
    outcomes: ['Mejora en comunicación', 'Desarrollo del lenguaje', 'Habilidades sociales'],
    tags: ['speech', 'language', 'pediatric']
  },
  {
    id: 'service-3',
    code: 'TREAT-002',
    name: 'Terapia Ocupacional',
    description: 'Intervención para mejorar las habilidades motoras finas y gruesas',
    categoryId: 'cat-2',
    category: {
      id: 'cat-2',
      name: 'Terapia Ocupacional',
      color: '#10b981',
      icon: 'activity'
    },
    type: 'TREATMENT' as const,
    duration: 45,
    price: 75.00,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 15,
    minSessions: 6,
    ageRange: { min: 2, max: 16 },
    prerequisites: ['Evaluación previa'],
    outcomes: ['Mejora motora', 'Independencia funcional', 'Habilidades de autocuidado'],
    tags: ['occupational', 'motor', 'pediatric']
  },
  {
    id: 'service-4',
    code: 'CONSULT-001',
    name: 'Consulta de Seguimiento',
    description: 'Consulta de seguimiento para evaluar el progreso del tratamiento',
    categoryId: 'cat-3',
    category: {
      id: 'cat-3',
      name: 'Consultas',
      color: '#8b5cf6',
      icon: 'consultation'
    },
    type: 'CONSULTATION' as const,
    duration: 30,
    price: 50.00,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 10,
    minSessions: 1,
    ageRange: { min: 0, max: 18 },
    prerequisites: ['Tratamiento previo'],
    outcomes: ['Evaluación de progreso', 'Ajustes al tratamiento', 'Recomendaciones'],
    tags: ['consultation', 'follow-up', 'progress']
  }
]

const mockSelectedServices: SelectedService[] = [
  {
    service: mockServices[0],
    sessionCount: 1,
    notes: 'Evaluación inicial para determinar necesidades',
    priority: 'HIGH'
  },
  {
    service: mockServices[1],
    sessionCount: 12,
    notes: 'Tratamiento de lenguaje basado en evaluación',
    priority: 'MEDIUM'
  },
  {
    service: mockServices[2],
    sessionCount: 8,
    notes: 'Terapia ocupacional para habilidades motoras',
    priority: 'LOW'
  },
  {
    service: mockServices[3],
    sessionCount: 3,
    notes: 'Consultas de seguimiento mensual',
    priority: 'MEDIUM'
  }
]

export default function TestCostCalculationPage() {
  const [currentRole, setCurrentRole] = useState<'therapist' | 'coordinator' | 'admin'>('therapist')
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(mockSelectedServices)
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null)
  const [calculationOptions, setCalculationOptions] = useState<CostCalculationOptions>({
    includeTaxes: false,
    taxRate: 0,
    includeDiscounts: false,
    discountPercentage: 0,
    includeInsurance: false,
    insuranceCoverage: 0,
    includePaymentFees: false,
    paymentFeeRate: 0,
    currency: 'USD',
    precision: 2
  })

  const handleCostChange = (breakdown: CostBreakdown) => {
    setCostBreakdown(breakdown)
  }

  const handleOptionsChange = (options: CostCalculationOptions) => {
    setCalculationOptions(options)
  }

  const handleRoleChange = (role: 'therapist' | 'coordinator' | 'admin') => {
    setCurrentRole(role)
  }

  const handleServiceChange = (serviceIndex: number, field: string, value: any) => {
    const newServices = [...selectedServices]
    if (field === 'sessionCount') {
      newServices[serviceIndex].sessionCount = parseInt(value) || 0
    } else if (field === 'notes') {
      newServices[serviceIndex].notes = value
    } else if (field === 'priority') {
      newServices[serviceIndex].priority = value
    }
    setSelectedServices(newServices)
  }

  const handleAddService = (serviceIndex: number) => {
    const newService: SelectedService = {
      service: mockServices[serviceIndex],
      sessionCount: 1,
      notes: '',
      priority: 'MEDIUM'
    }
    setSelectedServices([...selectedServices, newService])
  }

  const handleRemoveService = (serviceIndex: number) => {
    const newServices = selectedServices.filter((_, index) => index !== serviceIndex)
    setSelectedServices(newServices)
  }

  // Calculate statistics
  const stats = {
    totalServices: selectedServices.length,
    totalSessions: selectedServices.reduce((sum, s) => sum + s.sessionCount, 0),
    totalDuration: selectedServices.reduce((sum, s) => sum + (s.service.duration * s.sessionCount), 0),
    totalCost: costBreakdown?.total.toNumber() || 0,
    averageSessionCost: selectedServices.length > 0 ? 
      (costBreakdown?.total.toNumber() || 0) / selectedServices.reduce((sum, s) => sum + s.sessionCount, 0) : 0,
    highPriorityServices: selectedServices.filter(s => s.priority === 'HIGH').length,
    mediumPriorityServices: selectedServices.filter(s => s.priority === 'MEDIUM').length,
    lowPriorityServices: selectedServices.filter(s => s.priority === 'LOW').length
  }

  // Get role information
  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'therapist':
        return {
          name: 'Terapeuta',
          description: 'Puede ver sesiones y duración, pero no precios',
          icon: <User className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800'
        }
      case 'coordinator':
        return {
          name: 'Coordinador',
          description: 'Puede ver precios y costos básicos',
          icon: <UserCheck className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800'
        }
      case 'admin':
        return {
          name: 'Administrador',
          description: 'Puede ver todos los detalles de costos',
          icon: <Crown className="h-4 w-4" />,
          color: 'bg-purple-100 text-purple-800'
        }
      default:
        return {
          name: 'Desconocido',
          description: 'Rol no reconocido',
          icon: <User className="h-4 w-4" />,
          color: 'bg-gray-100 text-gray-800'
        }
    }
  }

  const currentRoleInfo = getRoleInfo(currentRole)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Calculator className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Sistema de Cálculo de Costos de Propuestas</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo de cálculo de costos con visibilidad basada en roles, 
        precisión decimal y validación avanzada.
      </p>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calculator className="h-4 w-4 mr-2 text-green-600" />
              Cálculo Preciso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Cálculos con precisión decimal usando Decimal.js
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2 text-blue-600" />
              Visibilidad por Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Información visible según el rol del usuario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
              Análisis Detallado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Desglose completo de costos y análisis
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
              Opciones de cálculo configurables
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selección de Rol</CardTitle>
          <CardDescription>
            Cambia el rol para ver cómo afecta la visibilidad de la información
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['therapist', 'coordinator', 'admin'] as const).map((role) => {
              const roleInfo = getRoleInfo(role)
              const isSelected = currentRole === role
              
              return (
                <div
                  key={role}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleRoleChange(role)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${roleInfo.color}`}>
                      {roleInfo.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{roleInfo.name}</h3>
                      <p className="text-sm text-muted-foreground">{roleInfo.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Role Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {currentRoleInfo.icon}
            <span className="ml-2">Rol Actual: {currentRoleInfo.name}</span>
          </CardTitle>
          <CardDescription>
            {currentRoleInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge className={currentRoleInfo.color}>
              {currentRoleInfo.name}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentRole === 'therapist' && 'No puede ver precios ni costos'}
              {currentRole === 'coordinator' && 'Puede ver precios y costos básicos'}
              {currentRole === 'admin' && 'Puede ver todos los detalles de costos'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">Seleccionados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sesiones Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">Programadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Duración Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.totalDuration / 60)}h {stats.totalDuration % 60}m
            </div>
            <p className="text-xs text-muted-foreground">De terapia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentRole === 'therapist' ? (
                <span className="text-muted-foreground">Oculto</span>
              ) : (
                `$${stats.totalCost.toFixed(2)}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentRole === 'therapist' ? 'No visible' : 'USD'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Servicios</CardTitle>
          <CardDescription>
            Agrega, edita o elimina servicios de la propuesta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Available Services */}
            <div>
              <h3 className="font-medium mb-3">Servicios Disponibles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockServices.map((service, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                      <Badge variant="outline">{service.type}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Duración:</span>
                        <span className="ml-2">{service.duration} min</span>
                      </div>
                      <div>
                        <span className="font-medium">Precio:</span>
                        <span className="ml-2">
                          {currentRole === 'therapist' ? (
                            <span className="text-muted-foreground">Oculto</span>
                          ) : (
                            `$${service.price.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Sesiones:</span>
                        <span className="ml-2">{service.minSessions}-{service.maxSessions}</span>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddService(index)}
                      className="mt-3"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Servicio
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Services */}
            <div>
              <h3 className="font-medium mb-3">Servicios Seleccionados</h3>
              <div className="space-y-3">
                {selectedServices.map((service, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{service.service.name}</h4>
                        <p className="text-sm text-muted-foreground">{service.service.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{service.service.type}</Badge>
                        <Badge variant="outline">{service.priority}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveService(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Sesiones:</span>
                        <input
                          type="number"
                          value={service.sessionCount}
                          onChange={(e) => handleServiceChange(index, 'sessionCount', e.target.value)}
                          className="ml-2 w-16 px-2 py-1 border rounded"
                          min={service.service.minSessions}
                          max={service.service.maxSessions}
                        />
                      </div>
                      <div>
                        <span className="font-medium">Duración:</span>
                        <span className="ml-2">{service.service.duration} min</span>
                      </div>
                      <div>
                        <span className="font-medium">Precio:</span>
                        <span className="ml-2">
                          {currentRole === 'therapist' ? (
                            <span className="text-muted-foreground">Oculto</span>
                          ) : (
                            `$${service.service.price.toFixed(2)}`
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Subtotal:</span>
                        <span className="ml-2">
                          {currentRole === 'therapist' ? (
                            <span className="text-muted-foreground">Oculto</span>
                          ) : (
                            `$${(service.service.price * service.sessionCount).toFixed(2)}`
                          )}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <span className="font-medium text-sm">Notas:</span>
                      <input
                        type="text"
                        value={service.notes}
                        onChange={(e) => handleServiceChange(index, 'notes', e.target.value)}
                        className="ml-2 w-full px-2 py-1 border rounded"
                        placeholder="Notas sobre este servicio..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Calculation Display */}
      <CostCalculationDisplay
        selectedServices={selectedServices}
        userRole={currentRole}
        onCostChange={handleCostChange}
        onOptionsChange={handleOptionsChange}
        initialOptions={calculationOptions}
        showOptions={true}
        showBreakdown={true}
        showSummary={true}
      />

      {/* Technical Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema utiliza Decimal.js para cálculos 
          precisos con decimales, implementa visibilidad basada en roles (terapeutas no pueden 
          ver precios, coordinadores ven costos básicos, administradores ven todo), incluye 
          validación de opciones de cálculo, soporte para impuestos, descuentos, seguros y 
          tarifas de pago, y proporciona análisis detallado de costos con precisión decimal.
        </AlertDescription>
      </Alert>
    </div>
  )
}
