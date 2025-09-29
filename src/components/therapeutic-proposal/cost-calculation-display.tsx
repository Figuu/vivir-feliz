'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { 
  ProposalCostCalculator, 
  CostCalculationUtils,
  type SelectedService,
  type CostCalculationOptions,
  type CostBreakdown,
  type CostSummary
} from '@/lib/proposal-cost-calculator'

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

interface CostCalculationDisplayProps {
  selectedServices: SelectedService[]
  userRole: 'therapist' | 'coordinator' | 'admin'
  onCostChange?: (costBreakdown: CostBreakdown) => void
  onOptionsChange?: (options: CostCalculationOptions) => void
  initialOptions?: CostCalculationOptions
  showOptions?: boolean
  showBreakdown?: boolean
  showSummary?: boolean
}

export function CostCalculationDisplay({
  selectedServices,
  userRole,
  onCostChange,
  onOptionsChange,
  initialOptions,
  showOptions = true,
  showBreakdown = true,
  showSummary = true
}: CostCalculationDisplayProps) {
  const [calculator] = useState(() => new ProposalCostCalculator(initialOptions))
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null)
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null)
  const [roleBasedInfo, setRoleBasedInfo] = useState<any>(null)
  const [options, setOptions] = useState<CostCalculationOptions>(calculator.getOptions())
  const [activeTab, setActiveTab] = useState<'summary' | 'breakdown' | 'options'>('summary')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Calculate costs when services or options change
  useEffect(() => {
    try {
      const breakdown = calculator.calculateCostBreakdown(selectedServices)
      const summary = calculator.calculateCostSummary(selectedServices)
      const roleInfo = calculator.getRoleBasedCostInfo(selectedServices, userRole)

      setCostBreakdown(breakdown)
      setCostSummary(summary)
      setRoleBasedInfo(roleInfo)
      setValidationErrors([])

      if (onCostChange) {
        onCostChange(breakdown)
      }
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Calculation error'])
    }
  }, [selectedServices, options, userRole, calculator, onCostChange])

  // Handle options change
  const handleOptionsChange = (newOptions: Partial<CostCalculationOptions>) => {
    try {
      calculator.updateOptions(newOptions)
      const updatedOptions = calculator.getOptions()
      setOptions(updatedOptions)
      
      if (onOptionsChange) {
        onOptionsChange(updatedOptions)
      }
    } catch (error) {
      setValidationErrors([error instanceof Error ? error.message : 'Invalid options'])
    }
  }

  // Get role-based visibility
  const getRoleVisibility = () => {
    switch (userRole) {
      case 'therapist':
        return {
          canViewPricing: false,
          canViewCosts: false,
          canViewBreakdown: false,
          canViewOptions: false,
          icon: <User className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800'
        }
      case 'coordinator':
        return {
          canViewPricing: true,
          canViewCosts: true,
          canViewBreakdown: true,
          canViewOptions: true,
          icon: <UserCheck className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800'
        }
      case 'admin':
        return {
          canViewPricing: true,
          canViewCosts: true,
          canViewBreakdown: true,
          canViewOptions: true,
          icon: <Crown className="h-4 w-4" />,
          color: 'bg-purple-100 text-purple-800'
        }
      default:
        return {
          canViewPricing: false,
          canViewCosts: false,
          canViewBreakdown: false,
          canViewOptions: false,
          icon: <User className="h-4 w-4" />,
          color: 'bg-gray-100 text-gray-800'
        }
    }
  }

  const visibility = getRoleVisibility()

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

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!roleBasedInfo) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Calculando costos...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Role Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Cálculo de Costos
              </CardTitle>
              <CardDescription>
                Sistema de cálculo de costos con visibilidad basada en roles
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={visibility.color}>
                {visibility.icon}
                <span className="ml-1 capitalize">{userRole}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Total de Sesiones</Label>
              <p className="text-2xl font-bold">{roleBasedInfo.totalSessions}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Duración Total</Label>
              <p className="text-2xl font-bold">
                {Math.round(roleBasedInfo.totalDuration / 60)}h {roleBasedInfo.totalDuration % 60}m
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Servicios</Label>
              <p className="text-2xl font-bold">{roleBasedInfo.serviceCount}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Calculado</Label>
              <p className="text-sm text-muted-foreground">
                {new Date(roleBasedInfo.calculatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
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

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="breakdown" disabled={!visibility.canViewBreakdown}>
            Desglose
          </TabsTrigger>
          <TabsTrigger value="options" disabled={!visibility.canViewOptions}>
            Opciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          {/* Services List */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios Seleccionados</CardTitle>
              <CardDescription>
                Lista de servicios con información visible según el rol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleBasedInfo.services.map((service: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{service.serviceName}</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedServices[index]?.service.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getServiceTypeColor(service.serviceType)}>
                          {service.serviceType}
                        </Badge>
                        <Badge className={getPriorityColor(service.priority)}>
                          {service.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Sesiones:</span>
                        <span className="ml-2">{service.sessionCount}</span>
                      </div>
                      <div>
                        <span className="font-medium">Duración:</span>
                        <span className="ml-2">{service.duration} min</span>
                      </div>
                      
                      {visibility.canViewPricing && service.unitPrice !== undefined && (
                        <div>
                          <span className="font-medium">Precio:</span>
                          <span className="ml-2">
                            {CostCalculationUtils.formatCurrency(
                              CostCalculationUtils.parseDecimal(service.unitPrice),
                              options.currency,
                              options.precision
                            )}
                          </span>
                        </div>
                      )}
                      
                      {visibility.canViewCosts && service.subtotal !== undefined && (
                        <div>
                          <span className="font-medium">Subtotal:</span>
                          <span className="ml-2">
                            {CostCalculationUtils.formatCurrency(
                              CostCalculationUtils.parseDecimal(service.subtotal),
                              options.currency,
                              options.precision
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {service.notes && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Notas:</span>
                        <span className="text-sm text-muted-foreground ml-2">{service.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary - Only visible to coordinators and admins */}
          {visibility.canViewCosts && roleBasedInfo.costSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Resumen de Costos
                </CardTitle>
                <CardDescription>
                  Información de costos visible para {userRole === 'coordinator' ? 'coordinadores' : 'administradores'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Subtotal</Label>
                    <p className="text-2xl font-bold">
                      {CostCalculationUtils.formatCurrency(
                        CostCalculationUtils.parseDecimal(roleBasedInfo.costSummary.subtotal),
                        options.currency,
                        options.precision
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total</Label>
                    <p className="text-2xl font-bold text-green-600">
                      {CostCalculationUtils.formatCurrency(
                        CostCalculationUtils.parseDecimal(roleBasedInfo.costSummary.total),
                        options.currency,
                        options.precision
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Moneda</Label>
                    <p className="text-2xl font-bold">{roleBasedInfo.costSummary.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          {visibility.canViewBreakdown && costBreakdown ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Desglose Detallado de Costos
                </CardTitle>
                <CardDescription>
                  Análisis completo de costos con decimales precisos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Service Breakdown */}
                  <div>
                    <h3 className="font-medium mb-3">Desglose por Servicio</h3>
                    <div className="space-y-3">
                      {costBreakdown.serviceCosts.map((service, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{service.serviceName}</h4>
                            <Badge variant="outline">
                              {service.percentage.toFixed(2)}%
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Sesiones:</span>
                              <span className="ml-2">{service.sessionCount}</span>
                            </div>
                            <div>
                              <span className="font-medium">Precio Unitario:</span>
                              <span className="ml-2">
                                {CostCalculationUtils.formatCurrency(
                                  service.unitPrice,
                                  options.currency,
                                  options.precision
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Subtotal:</span>
                              <span className="ml-2">
                                {CostCalculationUtils.formatCurrency(
                                  service.subtotal,
                                  options.currency,
                                  options.precision
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Porcentaje:</span>
                              <span className="ml-2">{service.percentage.toFixed(2)}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ inlineSize: `${service.percentage.toNumber()}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cost Components - Only visible to admins */}
                  {userRole === 'admin' && roleBasedInfo.costBreakdown && (
                    <div>
                      <h3 className="font-medium mb-3">Componentes de Costo</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Descuentos</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Monto:</span>
                              <span>
                                {CostCalculationUtils.formatCurrency(
                                  CostCalculationUtils.parseDecimal(roleBasedInfo.costBreakdown.discounts.amount),
                                  options.currency,
                                  options.precision
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Porcentaje:</span>
                              <span>{roleBasedInfo.costBreakdown.discounts.percentage.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Impuestos</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Monto:</span>
                              <span>
                                {CostCalculationUtils.formatCurrency(
                                  CostCalculationUtils.parseDecimal(roleBasedInfo.costBreakdown.taxes.amount),
                                  options.currency,
                                  options.precision
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tasa:</span>
                              <span>{roleBasedInfo.costBreakdown.taxes.rate.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Seguro</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Cubierto:</span>
                              <span>
                                {CostCalculationUtils.formatCurrency(
                                  CostCalculationUtils.parseDecimal(roleBasedInfo.costBreakdown.insurance.coveredAmount),
                                  options.currency,
                                  options.precision
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cobertura:</span>
                              <span>{roleBasedInfo.costBreakdown.insurance.coveragePercentage.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Responsabilidad del Paciente:</span>
                              <span>
                                {CostCalculationUtils.formatCurrency(
                                  CostCalculationUtils.parseDecimal(roleBasedInfo.costBreakdown.insurance.patientResponsibility),
                                  options.currency,
                                  options.precision
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-2">Tarifas de Pago</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Monto:</span>
                              <span>
                                {CostCalculationUtils.formatCurrency(
                                  CostCalculationUtils.parseDecimal(roleBasedInfo.costBreakdown.paymentFees.amount),
                                  options.currency,
                                  options.precision
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tasa:</span>
                              <span>{roleBasedInfo.costBreakdown.paymentFees.rate.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Información de Costos Ocultada</h3>
                <p className="text-muted-foreground">
                  Los detalles de costos no están disponibles para tu rol actual.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          {visibility.canViewOptions ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Opciones de Cálculo
                </CardTitle>
                <CardDescription>
                  Configuración de opciones de cálculo de costos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Moneda</Label>
                    <Select
                      value={options.currency}
                      onValueChange={(value) => handleOptionsChange({ currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - Libra Esterlina</SelectItem>
                        <SelectItem value="CAD">CAD - Dólar Canadiense</SelectItem>
                        <SelectItem value="AUD">AUD - Dólar Australiano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="precision">Precisión Decimal</Label>
                    <Input
                      id="precision"
                      type="number"
                      value={options.precision}
                      onChange={(e) => handleOptionsChange({ precision: parseInt(e.target.value) || 2 })}
                      min="0"
                      max="10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={options.includeTaxes || false}
                      onCheckedChange={(checked) => handleOptionsChange({ includeTaxes: checked })}
                    />
                    <Label>Incluir Impuestos</Label>
                  </div>
                  
                  {options.includeTaxes && (
                    <div>
                      <Label htmlFor="tax-rate">Tasa de Impuesto (%)</Label>
                      <Input
                        id="tax-rate"
                        type="number"
                        value={options.taxRate || 0}
                        onChange={(e) => handleOptionsChange({ taxRate: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={options.includeDiscounts || false}
                      onCheckedChange={(checked) => handleOptionsChange({ includeDiscounts: checked })}
                    />
                    <Label>Incluir Descuentos</Label>
                  </div>
                  
                  {options.includeDiscounts && (
                    <div>
                      <Label htmlFor="discount-percentage">Porcentaje de Descuento (%)</Label>
                      <Input
                        id="discount-percentage"
                        type="number"
                        value={options.discountPercentage || 0}
                        onChange={(e) => handleOptionsChange({ discountPercentage: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={options.includeInsurance || false}
                      onCheckedChange={(checked) => handleOptionsChange({ includeInsurance: checked })}
                    />
                    <Label>Incluir Cobertura de Seguro</Label>
                  </div>
                  
                  {options.includeInsurance && (
                    <div>
                      <Label htmlFor="insurance-coverage">Cobertura de Seguro (%)</Label>
                      <Input
                        id="insurance-coverage"
                        type="number"
                        value={options.insuranceCoverage || 0}
                        onChange={(e) => handleOptionsChange({ insuranceCoverage: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={options.includePaymentFees || false}
                      onCheckedChange={(checked) => handleOptionsChange({ includePaymentFees: checked })}
                    />
                    <Label>Incluir Tarifas de Pago</Label>
                  </div>
                  
                  {options.includePaymentFees && (
                    <div>
                      <Label htmlFor="payment-fee-rate">Tasa de Tarifa de Pago (%)</Label>
                      <Input
                        id="payment-fee-rate"
                        type="number"
                        value={options.paymentFeeRate || 0}
                        onChange={(e) => handleOptionsChange({ paymentFeeRate: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Opciones de Cálculo Ocultadas</h3>
                <p className="text-muted-foreground">
                  Las opciones de cálculo no están disponibles para tu rol actual.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
