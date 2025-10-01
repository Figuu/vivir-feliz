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
  Users, 
  Search,
  Filter,
  Clock,
  Calendar,
  Star,
  Award,
  CheckCircle,
  AlertTriangle,
  Info,
  Heart,
  Brain,
  Baby,
  UserCheck,
  Package,
  Tag,
  Settings,
  Plus,
  Edit,
  Trash2,
  Copy,
  Save,
  Eye,
  Send,
  Download,
  Upload,
  Target,
  TrendingUp,
  BarChart3,
  Calculator,
  BookOpen,
  Lightbulb,
  Zap,
  Shield,
  UserPlus,
  UserMinus,
  UserX,
  UserCheck2,
  GraduationCap,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Globe,
  Activity,
  PieChart,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  FileText
} from 'lucide-react'

interface Therapist {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: 'THERAPIST' | 'COORDINATOR' | 'ADMIN'
  specialties: string[]
  certifications: string[]
  experience: number // years
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

interface Proposal {
  id: string
  patientId: string
  therapistId?: string
  selectedServices: any[]
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
}

interface AssignmentCriteria {
  requiredSpecialties: string[]
  preferredSpecialties: string[]
  minExperience: number
  maxWorkload: number
  requiredCertifications: string[]
  preferredLanguages: string[]
  ageGroupPreference: string[]
  serviceTypePreference: string[]
  locationPreference: string
  availabilityRequired: boolean
  performanceThreshold: number
}

interface TherapistAssignment {
  id: string
  proposalId: string
  therapistId: string
  therapist: Therapist
  assignmentReason: string
  criteria: AssignmentCriteria
  matchScore: number
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
  assignedAt: string
  assignedBy: string
  notes?: string
  feedback?: string
}

interface TherapistAssignmentProps {
  proposal?: Proposal
  therapists?: Therapist[]
  services?: Service[]
  onAssign?: (assignment: TherapistAssignment) => void
  onUnassign?: (assignmentId: string) => void
  onUpdate?: (assignment: TherapistAssignment) => void
  onCancel?: () => void
  initialAssignment?: TherapistAssignment
  isEditing?: boolean
}

export function TherapistAssignment({
  proposal,
  therapists = [],
  services = [],
  onAssign,
  onUnassign,
  onUpdate,
  onCancel,
  initialAssignment,
  isEditing = false
}: TherapistAssignmentProps) {
  const [activeTab, setActiveTab] = useState<'criteria' | 'therapists' | 'assignment' | 'validation'>('criteria')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState<string>('all')
  const [filterExperience, setFilterExperience] = useState<string>('all')
  const [filterAvailability, setFilterAvailability] = useState<string>('all')
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null)
  const [showTherapistDetails, setShowTherapistDetails] = useState<string | null>(null)
  
  // Assignment criteria state
  const [criteria, setCriteria] = useState<AssignmentCriteria>({
    requiredSpecialties: [],
    preferredSpecialties: [],
    minExperience: 0,
    maxWorkload: 100,
    requiredCertifications: [],
    preferredLanguages: [],
    ageGroupPreference: [],
    serviceTypePreference: [],
    locationPreference: '',
    availabilityRequired: true,
    performanceThreshold: 3.0
  })

  // Assignment state
  const [assignment, setAssignment] = useState<TherapistAssignment>({
    id: initialAssignment?.id || '',
    proposalId: proposal?.id || '',
    therapistId: initialAssignment?.therapistId || '',
    therapist: initialAssignment?.therapist || therapists[0],
    assignmentReason: initialAssignment?.assignmentReason || '',
    criteria: initialAssignment?.criteria || criteria,
    matchScore: initialAssignment?.matchScore || 0,
    status: initialAssignment?.status || 'PENDING',
    assignedAt: initialAssignment?.assignedAt || new Date().toISOString(),
    assignedBy: initialAssignment?.assignedBy || 'system',
    notes: initialAssignment?.notes || '',
    feedback: initialAssignment?.feedback || ''
  })

  // Initialize criteria from proposal services
  useEffect(() => {
    if (proposal?.selectedServices && services.length > 0) {
      const proposalServices = proposal.selectedServices.map(ss => 
        services.find(s => s.id === ss.service.id)
      ).filter(Boolean)

      const requiredSpecialties = Array.from(new Set(
        proposalServices.flatMap(s => s?.tags || [])
      ))

      const serviceTypes = Array.from(new Set(
        proposalServices.map(s => s?.type)
      ))

      setCriteria(prev => ({
        ...prev,
        requiredSpecialties,
        serviceTypePreference: serviceTypes,
        ageGroupPreference: proposalServices
          .map(s => s?.ageRange ? 
            `${s.ageRange.min}-${s.ageRange.max}` : 'all'
          )
          .filter((age, index, arr) => arr.indexOf(age) === index)
      }))
    }
  }, [proposal, services])

  // Filter therapists based on criteria
  const filteredTherapists = therapists.filter(therapist => {
    const matchesSearch = searchTerm === '' || 
      therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.specialties.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesSpecialty = filterSpecialty === 'all' || 
      therapist.specialties.includes(filterSpecialty)
    
    const matchesExperience = filterExperience === 'all' || 
      (filterExperience === 'junior' && therapist.experience < 3) ||
      (filterExperience === 'mid' && therapist.experience >= 3 && therapist.experience < 7) ||
      (filterExperience === 'senior' && therapist.experience >= 7)
    
    const matchesAvailability = filterAvailability === 'all' ||
      (filterAvailability === 'available' && therapist.isAvailable) ||
      (filterAvailability === 'busy' && !therapist.isAvailable)
    
    return matchesSearch && matchesSpecialty && matchesExperience && matchesAvailability
  })

  // Calculate match score for a therapist
  const calculateMatchScore = (therapist: Therapist): number => {
    let score = 0
    let maxScore = 0

    // Specialty matching (40% weight)
    maxScore += 40
    const specialtyMatches = therapist.specialties.filter(s => 
      criteria.requiredSpecialties.includes(s)
    ).length
    score += (specialtyMatches / criteria.requiredSpecialties.length) * 40

    // Experience matching (20% weight)
    maxScore += 20
    if (therapist.experience >= criteria.minExperience) {
      score += 20
    } else {
      score += (therapist.experience / criteria.minExperience) * 20
    }

    // Workload matching (15% weight)
    maxScore += 15
    const workloadPercentage = (therapist.currentWorkload / therapist.maxWorkload) * 100
    if (workloadPercentage <= criteria.maxWorkload) {
      score += 15
    } else {
      score += Math.max(0, 15 - (workloadPercentage - criteria.maxWorkload) * 0.5)
    }

    // Performance matching (15% weight)
    maxScore += 15
    if (therapist.performance.averageRating >= criteria.performanceThreshold) {
      score += 15
    } else {
      score += (therapist.performance.averageRating / criteria.performanceThreshold) * 15
    }

    // Availability matching (10% weight)
    maxScore += 10
    if (therapist.isAvailable) {
      score += 10
    }

    return Math.round((score / maxScore) * 100)
  }

  // Get specialty icon
  const getSpecialtyIcon = (specialty: string) => {
    switch (specialty.toLowerCase()) {
      case 'pediatric': return <Baby className="h-4 w-4" />
      case 'adult': return <Users className="h-4 w-4" />
      case 'neuropsychology': return <Brain className="h-4 w-4" />
      case 'speech': return <Heart className="h-4 w-4" />
      case 'occupational': return <Activity className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  // Get specialty color
  const getSpecialtyColor = (specialty: string) => {
    switch (specialty.toLowerCase()) {
      case 'pediatric': return 'bg-blue-100 text-blue-800'
      case 'adult': return 'bg-green-100 text-green-800'
      case 'neuropsychology': return 'bg-purple-100 text-purple-800'
      case 'speech': return 'bg-pink-100 text-pink-800'
      case 'occupational': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get experience level
  const getExperienceLevel = (experience: number) => {
    if (experience < 3) return { level: 'Junior', color: 'bg-green-100 text-green-800' }
    if (experience < 7) return { level: 'Mid-level', color: 'bg-yellow-100 text-yellow-800' }
    return { level: 'Senior', color: 'bg-red-100 text-red-800' }
  }

  // Get availability status
  const getAvailabilityStatus = (therapist: Therapist) => {
    const workloadPercentage = (therapist.currentWorkload / therapist.maxWorkload) * 100
    
    if (!therapist.isAvailable) {
      return { status: 'Unavailable', color: 'bg-red-100 text-red-800' }
    }
    
    if (workloadPercentage >= 90) {
      return { status: 'Very Busy', color: 'bg-orange-100 text-orange-800' }
    }
    
    if (workloadPercentage >= 70) {
      return { status: 'Busy', color: 'bg-yellow-100 text-yellow-800' }
    }
    
    return { status: 'Available', color: 'bg-green-100 text-green-800' }
  }

  // Handle therapist selection
  const handleTherapistSelect = (therapist: Therapist) => {
    setSelectedTherapist(therapist)
    const matchScore = calculateMatchScore(therapist)
    
    setAssignment(prev => ({
      ...prev,
      therapistId: therapist.id,
      therapist: therapist,
      matchScore: matchScore
    }))
  }

  // Handle assignment submission
  const handleAssign = () => {
    if (!selectedTherapist) return

    const assignmentToSubmit: TherapistAssignment = {
      ...assignment,
      therapist: selectedTherapist,
      matchScore: calculateMatchScore(selectedTherapist),
      assignedAt: new Date().toISOString(),
      status: 'PENDING'
    }

    if (onAssign) {
      onAssign(assignmentToSubmit)
    }
  }

  // Get unique specialties
  const specialties = Array.from(new Set(
    therapists.flatMap(t => t.specialties)
  ))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editar Asignación de Terapeuta' : 'Asignar Terapeuta'}
          </h1>
          <p className="text-muted-foreground">
            {proposal ? `Propuesta: ${proposal.id}` : 'Selecciona una propuesta'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleAssign} disabled={!selectedTherapist}>
            <UserPlus className="h-4 w-4 mr-2" />
            Asignar Terapeuta
          </Button>
        </div>
      </div>

      {/* Proposal Information */}
      {proposal && (
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
                <Label className="text-sm font-medium">ID de Propuesta</Label>
                <p className="text-sm">{proposal.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Sesiones Totales</Label>
                <p className="text-sm">{proposal.totalSessions}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Duración Estimada</Label>
                <p className="text-sm">
                  {Math.round(proposal.estimatedDuration / 60)}h {proposal.estimatedDuration % 60}m
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Prioridad</Label>
                <Badge variant="outline">{proposal.priority}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="criteria">Criterios</TabsTrigger>
          <TabsTrigger value="therapists">Terapeutas</TabsTrigger>
          <TabsTrigger value="assignment">Asignación</TabsTrigger>
          <TabsTrigger value="validation">Validación</TabsTrigger>
        </TabsList>

        <TabsContent value="criteria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criterios de Asignación</CardTitle>
              <CardDescription>
                Define los criterios para la asignación de terapeutas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-experience">Experiencia Mínima (años)</Label>
                  <Input
                    id="min-experience"
                    type="number"
                    value={criteria.minExperience}
                    onChange={(e) => setCriteria(prev => ({ ...prev, minExperience: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="max-workload">Carga Máxima (%)</Label>
                  <Input
                    id="max-workload"
                    type="number"
                    value={criteria.maxWorkload}
                    onChange={(e) => setCriteria(prev => ({ ...prev, maxWorkload: parseInt(e.target.value) || 100 }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="performance-threshold">Umbral de Rendimiento</Label>
                <Input
                  id="performance-threshold"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={criteria.performanceThreshold}
                  onChange={(e) => setCriteria(prev => ({ ...prev, performanceThreshold: parseFloat(e.target.value) || 3.0 }))}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={criteria.availabilityRequired}
                  onCheckedChange={(checked) => setCriteria(prev => ({ ...prev, availabilityRequired: checked }))}
                />
                <Label>Requerir Disponibilidad</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="therapists" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtros de Terapeutas
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
                      placeholder="Nombre, email o especialidad..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="specialty-filter">Especialidad</Label>
                  <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las especialidades</SelectItem>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="experience-filter">Experiencia</Label>
                  <Select value={filterExperience} onValueChange={setFilterExperience}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toda la experiencia</SelectItem>
                      <SelectItem value="junior">Junior (0-2 años)</SelectItem>
                      <SelectItem value="mid">Mid-level (3-6 años)</SelectItem>
                      <SelectItem value="senior">Senior (7+ años)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="availability-filter">Disponibilidad</Label>
                  <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="available">Disponibles</SelectItem>
                      <SelectItem value="busy">Ocupados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Therapists Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTherapists.map((therapist) => {
              const matchScore = calculateMatchScore(therapist)
              const experienceLevel = getExperienceLevel(therapist.experience)
              const availabilityStatus = getAvailabilityStatus(therapist)
              const isSelected = selectedTherapist?.id === therapist.id
              
              return (
                <Card key={therapist.id} className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{therapist.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {therapist.email}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={experienceLevel.color}>
                          {experienceLevel.level}
                        </Badge>
                        <Badge className={availabilityStatus.color}>
                          {availabilityStatus.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Puntuación de Coincidencia</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                matchScore >= 80 ? 'bg-green-500' :
                                matchScore >= 60 ? 'bg-yellow-500' :
                                matchScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ inlineSize: `${matchScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{matchScore}%</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Experiencia:</span>
                          <span>{therapist.experience} años</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Carga de trabajo:</span>
                          <span>{Math.round((therapist.currentWorkload / therapist.maxWorkload) * 100)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Calificación:</span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{therapist.performance.averageRating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Especialidades:</h4>
                        <div className="flex flex-wrap gap-1">
                          {therapist.specialties.slice(0, 3).map((specialty) => (
                            <Badge key={specialty} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {therapist.specialties.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{therapist.specialties.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleTherapistSelect(therapist)}
                      >
                        {isSelected ? 'Seleccionado' : 'Seleccionar'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTherapistDetails(showTherapistDetails === therapist.id ? null : therapist.id)}
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

        <TabsContent value="assignment" className="space-y-4">
          {selectedTherapist ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck2 className="h-5 w-5 mr-2" />
                  Asignación de Terapeuta
                </CardTitle>
                <CardDescription>
                  Confirma la asignación del terapeuta seleccionado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{selectedTherapist.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedTherapist.email}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{assignment.matchScore}%</div>
                    <div className="text-sm text-muted-foreground">Coincidencia</div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="assignment-reason">Razón de la Asignación</Label>
                  <Textarea
                    id="assignment-reason"
                    placeholder="Explica por qué este terapeuta es adecuado para esta propuesta..."
                    value={assignment.assignmentReason}
                    onChange={(e) => setAssignment(prev => ({ ...prev, assignmentReason: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="assignment-notes">Notas Adicionales</Label>
                  <Textarea
                    id="assignment-notes"
                    placeholder="Notas adicionales sobre la asignación..."
                    value={assignment.notes || ''}
                    onChange={(e) => setAssignment(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={handleAssign} className="flex-1">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Confirmar Asignación
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedTherapist(null)}
                    className="flex-1"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Cancelar Selección
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay terapeuta seleccionado</h3>
                <p className="text-muted-foreground">
                  Ve a la pestaña "Terapeutas" para seleccionar un terapeuta
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
                Validación de Asignación
              </CardTitle>
              <CardDescription>
                Verifica que la asignación cumple con todos los criterios
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTherapist ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Criterios de Validación</h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Experiencia mínima</span>
                          <div className="flex items-center space-x-2">
                            {selectedTherapist.experience >= criteria.minExperience ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">{selectedTherapist.experience} años</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Carga de trabajo</span>
                          <div className="flex items-center space-x-2">
                            {(selectedTherapist.currentWorkload / selectedTherapist.maxWorkload) * 100 <= criteria.maxWorkload ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">{Math.round((selectedTherapist.currentWorkload / selectedTherapist.maxWorkload) * 100)}%</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Rendimiento</span>
                          <div className="flex items-center space-x-2">
                            {selectedTherapist.performance.averageRating >= criteria.performanceThreshold ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">{selectedTherapist.performance.averageRating.toFixed(1)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Disponibilidad</span>
                          <div className="flex items-center space-x-2">
                            {selectedTherapist.isAvailable ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-sm">{selectedTherapist.isAvailable ? 'Disponible' : 'No disponible'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Especialidades</h4>
                      <div className="space-y-2">
                        {criteria.requiredSpecialties.map((specialty) => (
                          <div key={specialty} className="flex items-center justify-between">
                            <span className="text-sm">{specialty}</span>
                            <div className="flex items-center space-x-2">
                              {selectedTherapist.specialties.includes(specialty) ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Resumen de Validación</h4>
                    <div className="flex items-center space-x-2">
                      {assignment.matchScore >= 80 ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : assignment.matchScore >= 60 ? (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">
                        {assignment.matchScore >= 80 ? 'Asignación Recomendada' :
                         assignment.matchScore >= 60 ? 'Asignación Aceptable' : 'Asignación No Recomendada'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Puntuación de coincidencia: {assignment.matchScore}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Selecciona un terapeuta para validar la asignación</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
