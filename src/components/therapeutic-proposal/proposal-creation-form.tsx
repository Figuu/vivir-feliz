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
  Plus, 
  Minus, 
  Save, 
  Eye, 
  Search,
  Filter,
  Clock,
  Users,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
  Heart,
  Brain,
  Baby,
  UserCheck,
  Package,
  Tag,
  DollarSign,
  Settings,
  Trash2,
  Edit,
  Copy,
  Send,
  Download,
  Upload
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
  duration: number // in minutes
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

interface SelectedService {
  service: Service
  sessionCount: number
  notes?: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  estimatedStartDate?: string
  estimatedEndDate?: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  address?: string
  phone?: string
  email?: string
  medicalHistory?: string
  currentMedications?: string
  allergies?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

interface Therapist {
  id: string
  name: string
  email: string
  specialties: string[]
  certifications: string[]
  experience: number
  availability: {
    days: string[]
    hours: {
      start: string
      end: string
    }
  }
}

interface Proposal {
  id?: string
  patientId: string
  therapistId: string
  selectedServices: SelectedService[]
  totalSessions: number
  estimatedDuration: number // in minutes
  estimatedCost: number
  currency: string
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  notes: string
  goals: string[]
  expectedOutcomes: string[]
  followUpRequired: boolean
  followUpNotes?: string
  createdAt?: string
  updatedAt?: string
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
}

interface ProposalCreationFormProps {
  patient?: Patient
  therapist?: Therapist
  services?: Service[]
  onSave?: (proposal: Proposal) => void
  onSubmit?: (proposal: Proposal) => void
  onPreview?: (proposal: Proposal) => void
  onCancel?: () => void
  initialProposal?: Proposal
  isEditing?: boolean
}

export function ProposalCreationForm({
  patient,
  therapist,
  services = [],
  onSave,
  onSubmit,
  onPreview,
  onCancel,
  initialProposal,
  isEditing = false
}: ProposalCreationFormProps) {
  const [activeTab, setActiveTab] = useState<'services' | 'details' | 'preview'>('services')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([])
  const [showServiceDetails, setShowServiceDetails] = useState<string | null>(null)
  
  // Form state
  const [proposal, setProposal] = useState<Proposal>({
    patientId: patient?.id || '',
    therapistId: therapist?.id || '',
    selectedServices: [],
    totalSessions: 0,
    estimatedDuration: 0,
    estimatedCost: 0,
    currency: 'USD',
    status: 'DRAFT',
    priority: 'MEDIUM',
    notes: '',
    goals: [],
    expectedOutcomes: [],
    followUpRequired: false,
    followUpNotes: '',
    ...initialProposal
  })

  // Initialize selected services from initial proposal
  useEffect(() => {
    if (initialProposal?.selectedServices) {
      setSelectedServices(initialProposal.selectedServices)
    }
  }, [initialProposal])

  // Update proposal when selected services change
  useEffect(() => {
    const totalSessions = selectedServices.reduce((sum, item) => sum + item.sessionCount, 0)
    const estimatedDuration = selectedServices.reduce((sum, item) => sum + (item.service.duration * item.sessionCount), 0)
    const estimatedCost = selectedServices.reduce((sum, item) => sum + (item.service.price * item.sessionCount), 0)
    
    setProposal(prev => ({
      ...prev,
      selectedServices,
      totalSessions,
      estimatedDuration,
      estimatedCost
    }))
  }, [selectedServices])

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = searchTerm === '' || 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || service.categoryId === filterCategory
    const matchesType = filterType === 'all' || service.type === filterType
    
    return matchesSearch && matchesCategory && matchesType && service.isActive
  })

  // Get service type icon
  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'EVALUATION': return <UserCheck className="h-4 w-4" />
      case 'TREATMENT': return <Heart className="h-4 w-4" />
      case 'CONSULTATION': return <Users className="h-4 w-4" />
      case 'FOLLOW_UP': return <Calendar className="h-4 w-4" />
      case 'ASSESSMENT': return <Brain className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  // Get service type color
  const getServiceTypeColor = (type: string) => {
    switch (type) {
      case 'EVALUATION': return 'bg-blue-100 text-blue-800'
      case 'TREATMENT': return 'bg-green-100 text-green-800'
      case 'CONSULTATION': return 'bg-purple-100 text-purple-800'
      case 'FOLLOW_UP': return 'bg-yellow-100 text-yellow-800'
      case 'ASSESSMENT': return 'bg-orange-100 text-orange-800'
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

  // Add service to proposal
  const handleAddService = (service: Service) => {
    const existingService = selectedServices.find(item => item.service.id === service.id)
    
    if (existingService) {
      // Update session count
      setSelectedServices(prev => prev.map(item => 
        item.service.id === service.id 
          ? { ...item, sessionCount: Math.min(item.sessionCount + 1, service.maxSessions || 50) }
          : item
      ))
    } else {
      // Add new service
      const newSelectedService: SelectedService = {
        service,
        sessionCount: service.minSessions || 1,
        priority: 'MEDIUM',
        notes: ''
      }
      setSelectedServices(prev => [...prev, newSelectedService])
    }
  }

  // Remove service from proposal
  const handleRemoveService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(item => item.service.id !== serviceId))
  }

  // Update session count
  const handleUpdateSessionCount = (serviceId: string, count: number) => {
    setSelectedServices(prev => prev.map(item => 
      item.service.id === serviceId 
        ? { ...item, sessionCount: Math.max(1, Math.min(count, item.service.maxSessions || 50)) }
        : item
    ))
  }

  // Update service notes
  const handleUpdateServiceNotes = (serviceId: string, notes: string) => {
    setSelectedServices(prev => prev.map(item => 
      item.service.id === serviceId 
        ? { ...item, notes }
        : item
    ))
  }

  // Update service priority
  const handleUpdateServicePriority = (serviceId: string, priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    setSelectedServices(prev => prev.map(item => 
      item.service.id === serviceId 
        ? { ...item, priority }
        : item
    ))
  }

  // Handle form submission
  const handleSave = () => {
    const proposalToSave: Proposal = {
      ...proposal,
      selectedServices,
      status: 'DRAFT'
    }
    
    if (onSave) {
      onSave(proposalToSave)
    }
  }

  const handleSubmit = () => {
    const proposalToSubmit: Proposal = {
      ...proposal,
      selectedServices,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString()
    }
    
    if (onSubmit) {
      onSubmit(proposalToSubmit)
    }
  }

  const handlePreview = () => {
    const proposalToPreview: Proposal = {
      ...proposal,
      selectedServices
    }
    
    if (onPreview) {
      onPreview(proposalToPreview)
    }
  }

  // Get unique categories
  const categories = Array.from(new Set(services.map(s => s.categoryId)))
    .map(id => services.find(s => s.categoryId === id)?.category)
    .filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editar Propuesta Terapéutica' : 'Crear Propuesta Terapéutica'}
          </h1>
          <p className="text-muted-foreground">
            {patient ? `${patient.firstName} ${patient.lastName}` : 'Selecciona un paciente'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handlePreview} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          <Button onClick={handleSave} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Guardar Borrador
          </Button>
          <Button onClick={handleSubmit}>
            <Send className="h-4 w-4 mr-2" />
            Enviar Propuesta
          </Button>
        </div>
      </div>

      {/* Patient Information */}
      {patient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Información del Paciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Nombre Completo</Label>
                <p className="text-sm">{patient.firstName} {patient.lastName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Fecha de Nacimiento</Label>
                <p className="text-sm">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Género</Label>
                <p className="text-sm">{patient.gender}</p>
              </div>
              {patient.phone && (
                <div>
                  <Label className="text-sm font-medium">Teléfono</Label>
                  <p className="text-sm">{patient.phone}</p>
                </div>
              )}
              {patient.email && (
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{patient.email}</p>
                </div>
              )}
              {patient.medicalHistory && (
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium">Historial Médico</Label>
                  <p className="text-sm">{patient.medicalHistory}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Buscar Servicios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nombre, código o descripción..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="category-filter">Categoría</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category?.id} value={category?.id || ''}>
                          {category?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="type-filter">Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="EVALUATION">Evaluación</SelectItem>
                      <SelectItem value="TREATMENT">Tratamiento</SelectItem>
                      <SelectItem value="CONSULTATION">Consulta</SelectItem>
                      <SelectItem value="FOLLOW_UP">Seguimiento</SelectItem>
                      <SelectItem value="ASSESSMENT">Evaluación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Resultados</Label>
                  <div className="text-sm text-muted-foreground">
                    {filteredServices.length} servicios disponibles
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => {
              const isSelected = selectedServices.some(item => item.service.id === service.id)
              const selectedItem = selectedServices.find(item => item.service.id === service.id)
              
              return (
                <Card key={service.id} className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center">
                          {getServiceTypeIcon(service.type)}
                          <span className="ml-2">{service.name}</span>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Código: {service.code}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={getServiceTypeColor(service.type)}>
                          {service.type}
                        </Badge>
                        {isSelected && (
                          <Badge variant="default">
                            {selectedItem?.sessionCount} sesiones
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{service.duration} min</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{service.minSessions || 1}-{service.maxSessions || '∞'} sesiones</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span>Categoría: {service.category.name}</span>
                        {service.ageRange && (
                          <span>Edad: {service.ageRange.min}-{service.ageRange.max} años</span>
                        )}
                      </div>
                      
                      {service.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {service.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {service.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{service.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      {isSelected ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateSessionCount(service.id, (selectedItem?.sessionCount || 1) - 1)}
                            disabled={selectedItem?.sessionCount <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium">
                            {selectedItem?.sessionCount} sesiones
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateSessionCount(service.id, (selectedItem?.sessionCount || 1) + 1)}
                            disabled={selectedItem?.sessionCount >= (service.maxSessions || 50)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleAddService(service)}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowServiceDetails(showServiceDetails === service.id ? null : service.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          {/* Selected Services */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios Seleccionados</CardTitle>
              <CardDescription>
                Configura los detalles de cada servicio seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedServices.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay servicios seleccionados</p>
                  <p className="text-sm text-muted-foreground">
                    Ve a la pestaña "Servicios" para agregar servicios a la propuesta
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedServices.map((item) => (
                    <Card key={item.service.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              {getServiceTypeIcon(item.service.type)}
                              <span className="ml-2">{item.service.name}</span>
                            </CardTitle>
                            <CardDescription>
                              {item.service.code} • {item.service.duration} minutos por sesión
                            </CardDescription>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveService(item.service.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label htmlFor={`sessions-${item.service.id}`}>Número de Sesiones</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateSessionCount(item.service.id, item.sessionCount - 1)}
                                disabled={item.sessionCount <= 1}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                id={`sessions-${item.service.id}`}
                                type="number"
                                value={item.sessionCount}
                                onChange={(e) => handleUpdateSessionCount(item.service.id, parseInt(e.target.value) || 1)}
                                className="w-20 text-center"
                                min={1}
                                max={item.service.maxSessions || 50}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateSessionCount(item.service.id, item.sessionCount + 1)}
                                disabled={item.sessionCount >= (item.service.maxSessions || 50)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor={`priority-${item.service.id}`}>Prioridad</Label>
                            <Select
                              value={item.priority}
                              onValueChange={(value: any) => handleUpdateServicePriority(item.service.id, value)}
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
                            <Label htmlFor={`start-date-${item.service.id}`}>Fecha Estimada de Inicio</Label>
                            <Input
                              id={`start-date-${item.service.id}`}
                              type="date"
                              value={item.estimatedStartDate || ''}
                              onChange={(e) => {
                                setSelectedServices(prev => prev.map(service => 
                                  service.service.id === item.service.id 
                                    ? { ...service, estimatedStartDate: e.target.value }
                                    : service
                                ))
                              }}
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Label htmlFor={`notes-${item.service.id}`}>Notas del Servicio</Label>
                          <Textarea
                            id={`notes-${item.service.id}`}
                            placeholder="Notas específicas para este servicio..."
                            value={item.notes || ''}
                            onChange={(e) => handleUpdateServiceNotes(item.service.id, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proposal Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Propuesta</CardTitle>
              <CardDescription>
                Configura los detalles generales de la propuesta terapéutica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="proposal-priority">Prioridad General</Label>
                  <Select
                    value={proposal.priority}
                    onValueChange={(value: any) => setProposal(prev => ({ ...prev, priority: value }))}
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
                  <Label htmlFor="follow-up">Seguimiento Requerido</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      checked={proposal.followUpRequired}
                      onCheckedChange={(checked) => setProposal(prev => ({ ...prev, followUpRequired: checked }))}
                    />
                    <Label htmlFor="follow-up">Requiere seguimiento</Label>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="proposal-notes">Notas de la Propuesta</Label>
                <Textarea
                  id="proposal-notes"
                  placeholder="Notas generales sobre la propuesta terapéutica..."
                  value={proposal.notes}
                  onChange={(e) => setProposal(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              {proposal.followUpRequired && (
                <div>
                  <Label htmlFor="follow-up-notes">Notas de Seguimiento</Label>
                  <Textarea
                    id="follow-up-notes"
                    placeholder="Detalles sobre el seguimiento requerido..."
                    value={proposal.followUpNotes || ''}
                    onChange={(e) => setProposal(prev => ({ ...prev, followUpNotes: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {/* Proposal Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Propuesta</CardTitle>
              <CardDescription>
                Vista previa de la propuesta terapéutica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{proposal.totalSessions}</div>
                  <div className="text-sm text-muted-foreground">Sesiones Totales</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(proposal.estimatedDuration / 60)}h {proposal.estimatedDuration % 60}m
                  </div>
                  <div className="text-sm text-muted-foreground">Duración Estimada</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{selectedServices.length}</div>
                  <div className="text-sm text-muted-foreground">Servicios</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Badge className={getPriorityColor(proposal.priority)}>
                    {proposal.priority}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Prioridad</div>
                </div>
              </div>
              
              {selectedServices.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Servicios Incluidos:</h4>
                  {selectedServices.map((item) => (
                    <div key={item.service.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getServiceTypeIcon(item.service.type)}
                        <div>
                          <div className="font-medium">{item.service.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.service.code} • {item.service.duration} min/sesión
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.sessionCount} sesiones</div>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {proposal.notes && (
                <div className="mt-6">
                  <h4 className="font-medium">Notas de la Propuesta:</h4>
                  <p className="text-sm text-muted-foreground mt-1">{proposal.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
