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
  Upload,
  GitCompare,
  ArrowRight,
  ArrowLeft,
  Target,
  TrendingUp,
  BarChart3,
  Calculator,
  BookOpen,
  Lightbulb,
  Star,
  Award,
  Zap
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

interface SelectedService {
  service: Service
  sessionCount: number
  notes?: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  estimatedStartDate?: string
  estimatedEndDate?: string
}

interface Proposal {
  id?: string
  patientId: string
  therapistId: string
  selectedServices: SelectedService[]
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
  createdAt?: string
  updatedAt?: string
  submittedAt?: string
  reviewedAt?: string
  reviewedBy?: string
}

interface DualProposal {
  id?: string
  patientId: string
  therapistId: string
  proposalA: Proposal
  proposalB: Proposal
  comparison: {
    costDifference: number
    sessionDifference: number
    durationDifference: number
    serviceDifference: number
  }
  recommendation: {
    preferredProposal: 'A' | 'B' | 'NONE'
    reasoning: string
    benefits: string[]
    considerations: string[]
  }
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  notes: string
  createdAt?: string
  updatedAt?: string
  submittedAt?: string
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

interface DualProposalSystemProps {
  patient?: Patient
  therapist?: Therapist
  services?: Service[]
  onSave?: (dualProposal: DualProposal) => void
  onSubmit?: (dualProposal: DualProposal) => void
  onPreview?: (dualProposal: DualProposal) => void
  onCancel?: () => void
  initialDualProposal?: DualProposal
  isEditing?: boolean
}

export function DualProposalSystem({
  patient,
  therapist,
  services = [],
  onSave,
  onSubmit,
  onPreview,
  onCancel,
  initialDualProposal,
  isEditing = false
}: DualProposalSystemProps) {
  const [activeTab, setActiveTab] = useState<'proposal-a' | 'proposal-b' | 'comparison' | 'recommendation'>('proposal-a')
  const [activeProposal, setActiveProposal] = useState<'A' | 'B'>('A')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedServicesA, setSelectedServicesA] = useState<SelectedService[]>([])
  const [selectedServicesB, setSelectedServicesB] = useState<SelectedService[]>([])
  const [showServiceDetails, setShowServiceDetails] = useState<string | null>(null)
  
  // Dual proposal state
  const [dualProposal, setDualProposal] = useState<DualProposal>({
    patientId: patient?.id || '',
    therapistId: therapist?.id || '',
    proposalA: {
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
      followUpNotes: ''
    },
    proposalB: {
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
      followUpNotes: ''
    },
    comparison: {
      costDifference: 0,
      sessionDifference: 0,
      durationDifference: 0,
      serviceDifference: 0
    },
    recommendation: {
      preferredProposal: 'NONE',
      reasoning: '',
      benefits: [],
      considerations: []
    },
    status: 'DRAFT',
    notes: '',
    ...initialDualProposal
  })

  // Initialize from initial proposal
  useEffect(() => {
    if (initialDualProposal) {
      setSelectedServicesA(initialDualProposal.proposalA.selectedServices)
      setSelectedServicesB(initialDualProposal.proposalB.selectedServices)
    }
  }, [initialDualProposal])

  // Update proposals when services change
  useEffect(() => {
    const updateProposal = (services: SelectedService[]) => {
      const totalSessions = services.reduce((sum, item) => sum + item.sessionCount, 0)
      const estimatedDuration = services.reduce((sum, item) => sum + (item.service.duration * item.sessionCount), 0)
      const estimatedCost = services.reduce((sum, item) => sum + (item.service.price * item.sessionCount), 0)
      
      return {
        selectedServices: services,
        totalSessions,
        estimatedDuration,
        estimatedCost
      }
    }

    const proposalAUpdate = updateProposal(selectedServicesA)
    const proposalBUpdate = updateProposal(selectedServicesB)

    setDualProposal(prev => ({
      ...prev,
      proposalA: { ...prev.proposalA, ...proposalAUpdate },
      proposalB: { ...prev.proposalB, ...proposalBUpdate },
      comparison: {
        costDifference: proposalBUpdate.estimatedCost - proposalAUpdate.estimatedCost,
        sessionDifference: proposalBUpdate.totalSessions - proposalAUpdate.totalSessions,
        durationDifference: proposalBUpdate.estimatedDuration - proposalAUpdate.estimatedDuration,
        serviceDifference: proposalBUpdate.selectedServices.length - proposalAUpdate.selectedServices.length
      }
    }))
  }, [selectedServicesA, selectedServicesB])

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

  // Get current selected services
  const getCurrentSelectedServices = () => {
    return activeProposal === 'A' ? selectedServicesA : selectedServicesB
  }

  const setCurrentSelectedServices = (services: SelectedService[]) => {
    if (activeProposal === 'A') {
      setSelectedServicesA(services)
    } else {
      setSelectedServicesB(services)
    }
  }

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

  // Add service to current proposal
  const handleAddService = (service: Service) => {
    const currentServices = getCurrentSelectedServices()
    const existingService = currentServices.find(item => item.service.id === service.id)
    
    if (existingService) {
      const updatedServices = currentServices.map(item => 
        item.service.id === service.id 
          ? { ...item, sessionCount: Math.min(item.sessionCount + 1, service.maxSessions || 50) }
          : item
      )
      setCurrentSelectedServices(updatedServices)
    } else {
      const newSelectedService: SelectedService = {
        service,
        sessionCount: service.minSessions || 1,
        priority: 'MEDIUM',
        notes: ''
      }
      setCurrentSelectedServices([...currentServices, newSelectedService])
    }
  }

  // Remove service from current proposal
  const handleRemoveService = (serviceId: string) => {
    const currentServices = getCurrentSelectedServices()
    setCurrentSelectedServices(currentServices.filter(item => item.service.id !== serviceId))
  }

  // Update session count
  const handleUpdateSessionCount = (serviceId: string, count: number) => {
    const currentServices = getCurrentSelectedServices()
    const updatedServices = currentServices.map(item => 
      item.service.id === serviceId 
        ? { ...item, sessionCount: Math.max(1, Math.min(count, item.service.maxSessions || 50)) }
        : item
    )
    setCurrentSelectedServices(updatedServices)
  }

  // Update service notes
  const handleUpdateServiceNotes = (serviceId: string, notes: string) => {
    const currentServices = getCurrentSelectedServices()
    const updatedServices = currentServices.map(item => 
      item.service.id === serviceId 
        ? { ...item, notes }
        : item
    )
    setCurrentSelectedServices(updatedServices)
  }

  // Update service priority
  const handleUpdateServicePriority = (serviceId: string, priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    const currentServices = getCurrentSelectedServices()
    const updatedServices = currentServices.map(item => 
      item.service.id === serviceId 
        ? { ...item, priority }
        : item
    )
    setCurrentSelectedServices(updatedServices)
  }

  // Copy services between proposals
  const handleCopyServices = (fromProposal: 'A' | 'B', toProposal: 'A' | 'B') => {
    const sourceServices = fromProposal === 'A' ? selectedServicesA : selectedServicesB
    if (toProposal === 'A') {
      setSelectedServicesA([...sourceServices])
    } else {
      setSelectedServicesB([...sourceServices])
    }
  }

  // Handle form submission
  const handleSave = () => {
    const dualProposalToSave: DualProposal = {
      ...dualProposal,
      proposalA: { ...dualProposal.proposalA, selectedServices: selectedServicesA },
      proposalB: { ...dualProposal.proposalB, selectedServices: selectedServicesB },
      status: 'DRAFT'
    }
    
    if (onSave) {
      onSave(dualProposalToSave)
    }
  }

  const handleSubmit = () => {
    const dualProposalToSubmit: DualProposal = {
      ...dualProposal,
      proposalA: { ...dualProposal.proposalA, selectedServices: selectedServicesA },
      proposalB: { ...dualProposal.proposalB, selectedServices: selectedServicesB },
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString()
    }
    
    if (onSubmit) {
      onSubmit(dualProposalToSubmit)
    }
  }

  const handlePreview = () => {
    const dualProposalToPreview: DualProposal = {
      ...dualProposal,
      proposalA: { ...dualProposal.proposalA, selectedServices: selectedServicesA },
      proposalB: { ...dualProposal.proposalB, selectedServices: selectedServicesB }
    }
    
    if (onPreview) {
      onPreview(dualProposalToPreview)
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
            {isEditing ? 'Editar Propuesta Dual' : 'Crear Propuesta Dual'}
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
            Enviar Propuestas
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
            </div>
          </CardContent>
        </Card>
      )}

      {/* Proposal Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GitCompare className="h-5 w-5 mr-2" />
            Seleccionar Propuesta
          </CardTitle>
          <CardDescription>
            Elige entre Propuesta A o Propuesta B para configurar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={activeProposal === 'A' ? 'default' : 'outline'}
              onClick={() => setActiveProposal('A')}
              className="h-auto p-6"
            >
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">Propuesta A</div>
                <div className="text-sm text-muted-foreground">
                  {selectedServicesA.length} servicios • {dualProposal.proposalA.totalSessions} sesiones
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(dualProposal.proposalA.estimatedDuration / 60)}h {dualProposal.proposalA.estimatedDuration % 60}m
                </div>
              </div>
            </Button>

            <Button
              variant={activeProposal === 'B' ? 'default' : 'outline'}
              onClick={() => setActiveProposal('B')}
              className="h-auto p-6"
            >
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">Propuesta B</div>
                <div className="text-sm text-muted-foreground">
                  {selectedServicesB.length} servicios • {dualProposal.proposalB.totalSessions} sesiones
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(dualProposal.proposalB.estimatedDuration / 60)}h {dualProposal.proposalB.estimatedDuration % 60}m
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Copy Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Copy className="h-5 w-5 mr-2" />
            Copiar Servicios
          </CardTitle>
          <CardDescription>
            Copia servicios entre las propuestas A y B
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => handleCopyServices('A', 'B')}
              disabled={selectedServicesA.length === 0}
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              A → B
            </Button>
            <Button
              variant="outline"
              onClick={() => handleCopyServices('B', 'A')}
              disabled={selectedServicesB.length === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              B → A
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="proposal-a">Propuesta A</TabsTrigger>
          <TabsTrigger value="proposal-b">Propuesta B</TabsTrigger>
          <TabsTrigger value="comparison">Comparación</TabsTrigger>
          <TabsTrigger value="recommendation">Recomendación</TabsTrigger>
        </TabsList>

        <TabsContent value="proposal-a" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Propuesta A</h2>
            <Badge variant="outline">Activa</Badge>
          </div>
          {/* Services Grid for Proposal A */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => {
              const isSelected = selectedServicesA.some(item => item.service.id === service.id)
              const selectedItem = selectedServicesA.find(item => item.service.id === service.id)
              
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

        <TabsContent value="proposal-b" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Propuesta B</h2>
            <Badge variant="outline">Activa</Badge>
          </div>
          {/* Services Grid for Proposal B */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => {
              const isSelected = selectedServicesB.some(item => item.service.id === service.id)
              const selectedItem = selectedServicesB.find(item => item.service.id === service.id)
              
              return (
                <Card key={service.id} className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-green-500' : ''}`}>
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

        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Proposal A Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                  Propuesta A
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{dualProposal.proposalA.totalSessions}</div>
                      <div className="text-sm text-muted-foreground">Sesiones</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(dualProposal.proposalA.estimatedDuration / 60)}h {dualProposal.proposalA.estimatedDuration % 60}m
                      </div>
                      <div className="text-sm text-muted-foreground">Duración</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Servicios:</h4>
                    {selectedServicesA.map((item) => (
                      <div key={item.service.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{item.service.name}</span>
                        <Badge variant="outline">{item.sessionCount} sesiones</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Proposal B Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  Propuesta B
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{dualProposal.proposalB.totalSessions}</div>
                      <div className="text-sm text-muted-foreground">Sesiones</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(dualProposal.proposalB.estimatedDuration / 60)}h {dualProposal.proposalB.estimatedDuration % 60}m
                      </div>
                      <div className="text-sm text-muted-foreground">Duración</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Servicios:</h4>
                    {selectedServicesB.map((item) => (
                      <div key={item.service.id} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{item.service.name}</span>
                        <Badge variant="outline">{item.sessionCount} sesiones</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Comparación de Métricas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {dualProposal.comparison.sessionDifference > 0 ? '+' : ''}{dualProposal.comparison.sessionDifference}
                  </div>
                  <div className="text-sm text-muted-foreground">Diferencia en Sesiones</div>
                  <div className="text-xs text-muted-foreground">B vs A</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {dualProposal.comparison.durationDifference > 0 ? '+' : ''}{Math.round(dualProposal.comparison.durationDifference / 60)}h {dualProposal.comparison.durationDifference % 60}m
                  </div>
                  <div className="text-sm text-muted-foreground">Diferencia en Duración</div>
                  <div className="text-xs text-muted-foreground">B vs A</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {dualProposal.comparison.serviceDifference > 0 ? '+' : ''}{dualProposal.comparison.serviceDifference}
                  </div>
                  <div className="text-sm text-muted-foreground">Diferencia en Servicios</div>
                  <div className="text-xs text-muted-foreground">B vs A</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {dualProposal.comparison.costDifference > 0 ? '+' : ''}${dualProposal.comparison.costDifference}
                  </div>
                  <div className="text-sm text-muted-foreground">Diferencia en Costo</div>
                  <div className="text-xs text-muted-foreground">B vs A</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Recomendación del Terapeuta
              </CardTitle>
              <CardDescription>
                Proporciona tu recomendación y justificación para las propuestas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="preferred-proposal">Propuesta Recomendada</Label>
                <Select
                  value={dualProposal.recommendation.preferredProposal}
                  onValueChange={(value: any) => setDualProposal(prev => ({
                    ...prev,
                    recommendation: { ...prev.recommendation, preferredProposal: value }
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sin recomendación</SelectItem>
                    <SelectItem value="A">Propuesta A</SelectItem>
                    <SelectItem value="B">Propuesta B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="reasoning">Justificación</Label>
                <Textarea
                  id="reasoning"
                  placeholder="Explica por qué recomiendas esta propuesta..."
                  value={dualProposal.recommendation.reasoning}
                  onChange={(e) => setDualProposal(prev => ({
                    ...prev,
                    recommendation: { ...prev.recommendation, reasoning: e.target.value }
                  }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="benefits">Beneficios</Label>
                <Textarea
                  id="benefits"
                  placeholder="Lista los beneficios de la propuesta recomendada..."
                  value={dualProposal.recommendation.benefits.join('\n')}
                  onChange={(e) => setDualProposal(prev => ({
                    ...prev,
                    recommendation: { 
                      ...prev.recommendation, 
                      benefits: e.target.value.split('\n').filter(b => b.trim()) 
                    }
                  }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="considerations">Consideraciones</Label>
                <Textarea
                  id="considerations"
                  placeholder="Menciona cualquier consideración especial..."
                  value={dualProposal.recommendation.considerations.join('\n')}
                  onChange={(e) => setDualProposal(prev => ({
                    ...prev,
                    recommendation: { 
                      ...prev.recommendation, 
                      considerations: e.target.value.split('\n').filter(c => c.trim()) 
                    }
                  }))}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
