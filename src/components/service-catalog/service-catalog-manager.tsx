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
  Edit, 
  Trash2, 
  Copy, 
  Save, 
  Eye, 
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  DollarSign,
  Users,
  Calendar,
  Tag,
  FileText,
  Activity,
  BarChart3,
  TrendingUp,
  Package,
  Star,
  Heart,
  Brain,
  Baby,
  UserCheck
} from 'lucide-react'

interface ServiceCategory {
  id: string
  name: string
  description: string
  icon?: string
  color?: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

interface Service {
  id: string
  code: string
  name: string
  description: string
  categoryId: string
  category: ServiceCategory
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
  metadata: {
    createdBy: string
    createdAt: string
    updatedAt: string
    usageCount: number
    averageRating?: number
  }
}

interface ServiceCatalogManagerProps {
  initialServices?: Service[]
  initialCategories?: ServiceCategory[]
  currentUser?: {
    id: string
    name: string
    role: string
  }
  onSave?: (service: Service) => void
  onDelete?: (serviceId: string) => void
  onDuplicate?: (service: Service) => void
  onCategorySave?: (category: ServiceCategory) => void
  onCategoryDelete?: (categoryId: string) => void
  onExport?: (services: Service[]) => void
  onImport?: (file: File) => void
}

export function ServiceCatalogManager({
  initialServices = [],
  initialCategories = [],
  currentUser,
  onSave,
  onDelete,
  onDuplicate,
  onCategorySave,
  onCategoryDelete,
  onExport,
  onImport
}: ServiceCatalogManagerProps) {
  const [services, setServices] = useState<Service[]>(initialServices)
  const [categories, setCategories] = useState<ServiceCategory[]>(initialCategories)
  const [activeTab, setActiveTab] = useState<'services' | 'categories' | 'analytics'>('services')
  const [showServiceForm, setShowServiceForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    code: '',
    name: '',
    description: '',
    categoryId: '',
    type: 'EVALUATION' as Service['type'],
    duration: 60,
    price: 0,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: undefined as number | undefined,
    minSessions: undefined as number | undefined,
    ageRangeMin: undefined as number | undefined,
    ageRangeMax: undefined as number | undefined,
    prerequisites: [] as string[],
    outcomes: [] as string[],
    tags: [] as string[]
  })

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: '',
    color: '#3b82f6',
    isActive: true,
    sortOrder: 0
  })

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = searchTerm === '' || 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || service.categoryId === filterCategory
    const matchesType = filterType === 'all' || service.type === filterType
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && service.isActive) ||
      (filterStatus === 'inactive' && !service.isActive)
    
    return matchesSearch && matchesCategory && matchesType && matchesStatus
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

  // Get category icon
  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'heart': return <Heart className="h-4 w-4" />
      case 'brain': return <Brain className="h-4 w-4" />
      case 'baby': return <Baby className="h-4 w-4" />
      case 'users': return <Users className="h-4 w-4" />
      case 'activity': return <Activity className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  // Handle service form submission
  const handleServiceSubmit = () => {
    if (!serviceForm.code || !serviceForm.name || !serviceForm.categoryId) return

    const serviceData: Service = {
      id: editingService?.id || `service-${Date.now()}`,
      code: serviceForm.code,
      name: serviceForm.name,
      description: serviceForm.description,
      categoryId: serviceForm.categoryId,
      category: categories.find(c => c.id === serviceForm.categoryId) || categories[0],
      type: serviceForm.type,
      duration: serviceForm.duration,
      price: serviceForm.price,
      currency: serviceForm.currency,
      isActive: serviceForm.isActive,
      requiresApproval: serviceForm.requiresApproval,
      maxSessions: serviceForm.maxSessions,
      minSessions: serviceForm.minSessions,
      ageRange: serviceForm.ageRangeMin && serviceForm.ageRangeMax ? {
        min: serviceForm.ageRangeMin,
        max: serviceForm.ageRangeMax
      } : undefined,
      prerequisites: serviceForm.prerequisites,
      outcomes: serviceForm.outcomes,
      tags: serviceForm.tags,
      metadata: {
        createdBy: currentUser?.id || 'system',
        createdAt: editingService?.metadata.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: editingService?.metadata.usageCount || 0,
        averageRating: editingService?.metadata.averageRating
      }
    }

    if (editingService) {
      setServices(prev => prev.map(s => s.id === editingService.id ? serviceData : s))
    } else {
      setServices(prev => [serviceData, ...prev])
    }

    if (onSave) {
      onSave(serviceData)
    }

    // Reset form
    setServiceForm({
      code: '',
      name: '',
      description: '',
      categoryId: '',
      type: 'EVALUATION',
      duration: 60,
      price: 0,
      currency: 'USD',
      isActive: true,
      requiresApproval: false,
      maxSessions: undefined,
      minSessions: undefined,
      ageRangeMin: undefined,
      ageRangeMax: undefined,
      prerequisites: [],
      outcomes: [],
      tags: []
    })
    setEditingService(null)
    setShowServiceForm(false)
  }

  // Handle category form submission
  const handleCategorySubmit = () => {
    if (!categoryForm.name) return

    const categoryData: ServiceCategory = {
      id: editingCategory?.id || `category-${Date.now()}`,
      name: categoryForm.name,
      description: categoryForm.description,
      icon: categoryForm.icon,
      color: categoryForm.color,
      isActive: categoryForm.isActive,
      sortOrder: categoryForm.sortOrder,
      createdAt: editingCategory?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? categoryData : c))
    } else {
      setCategories(prev => [categoryData, ...prev])
    }

    if (onCategorySave) {
      onCategorySave(categoryData)
    }

    // Reset form
    setCategoryForm({
      name: '',
      description: '',
      icon: '',
      color: '#3b82f6',
      isActive: true,
      sortOrder: 0
    })
    setEditingCategory(null)
    setShowCategoryForm(false)
  }

  // Handle service edit
  const handleServiceEdit = (service: Service) => {
    setEditingService(service)
    setServiceForm({
      code: service.code,
      name: service.name,
      description: service.description,
      categoryId: service.categoryId,
      type: service.type,
      duration: service.duration,
      price: service.price,
      currency: service.currency,
      isActive: service.isActive,
      requiresApproval: service.requiresApproval,
      maxSessions: service.maxSessions,
      minSessions: service.minSessions,
      ageRangeMin: service.ageRange?.min,
      ageRangeMax: service.ageRange?.max,
      prerequisites: service.prerequisites || [],
      outcomes: service.outcomes || [],
      tags: service.tags
    })
    setShowServiceForm(true)
  }

  // Handle service delete
  const handleServiceDelete = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId))
    if (onDelete) {
      onDelete(serviceId)
    }
  }

  // Handle service duplicate
  const handleServiceDuplicate = (service: Service) => {
    const duplicatedService: Service = {
      ...service,
      id: `service-${Date.now()}`,
      code: `${service.code}-COPY`,
      name: `${service.name} (Copia)`,
      metadata: {
        ...service.metadata,
        createdBy: currentUser?.id || 'system',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0
      }
    }
    setServices(prev => [duplicatedService, ...prev])
    if (onDuplicate) {
      onDuplicate(duplicatedService)
    }
  }

  // Calculate statistics
  const stats = {
    totalServices: services.length,
    activeServices: services.filter(s => s.isActive).length,
    totalCategories: categories.length,
    totalRevenue: services.reduce((sum, s) => sum + (s.price * s.metadata.usageCount), 0),
    averagePrice: services.length > 0 ? services.reduce((sum, s) => sum + s.price, 0) / services.length : 0,
    mostUsedService: services.reduce((max, s) => s.metadata.usageCount > max.metadata.usageCount ? s : max, services[0])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión del Catálogo de Servicios</h1>
          <p className="text-muted-foreground">
            Administra los servicios terapéuticos disponibles en el centro
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowServiceForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Servicio
          </Button>
          <Button onClick={() => setShowCategoryForm(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Total Servicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeServices} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Categorías
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Generados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Precio Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.averagePrice.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Por servicio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2" />
              Más Usado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mostUsedService?.metadata.usageCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.mostUsedService?.name || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Buscar Servicios</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Código, nombre o descripción..."
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
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
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
              <Label htmlFor="status-filter">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Resultados</Label>
              <div className="text-sm text-muted-foreground">
                {filteredServices.length} de {services.length} servicios
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="categories">Categorías</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
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
                      {service.isActive ? (
                        <Badge variant="default">Activo</Badge>
                      ) : (
                        <Badge variant="secondary">Inactivo</Badge>
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
                        <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>${service.price}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>Categoría: {service.category.name}</span>
                      <span>Usos: {service.metadata.usageCount}</span>
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
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleServiceEdit(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleServiceDuplicate(service)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleServiceDelete(service.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: category.color + '20', color: category.color }}
                      >
                        {getCategoryIcon(category.icon || 'default')}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>
                          {services.filter(s => s.categoryId === category.id).length} servicios
                        </CardDescription>
                      </div>
                    </div>
                    {category.isActive ? (
                      <Badge variant="default">Activa</Badge>
                    ) : (
                      <Badge variant="secondary">Inactiva</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {category.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(category)
                        setCategoryForm({
                          name: category.name,
                          description: category.description,
                          icon: category.icon || '',
                          color: category.color || '#3b82f6',
                          isActive: category.isActive,
                          sortOrder: category.sortOrder
                        })
                        setShowCategoryForm(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCategories(prev => prev.filter(c => c.id !== category.id))
                        if (onCategoryDelete) {
                          onCategoryDelete(category.id)
                        }
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Servicios por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((category) => {
                    const categoryServices = services.filter(s => s.categoryId === category.id)
                    const percentage = services.length > 0 ? (categoryServices.length / services.length) * 100 : 0
                    
                    return (
                      <div key={category.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {categoryServices.length} servicios
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full"
                            style={{ 
                              inlineSize: `${percentage}%`,
                              backgroundColor: category.color || '#3b82f6'
                            }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Servicios por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['EVALUATION', 'TREATMENT', 'CONSULTATION', 'FOLLOW_UP', 'ASSESSMENT'].map((type) => {
                    const typeServices = services.filter(s => s.type === type)
                    const percentage = services.length > 0 ? (typeServices.length / services.length) * 100 : 0
                    
                    return (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center">
                            {getServiceTypeIcon(type)}
                            <span className="ml-2">{type}</span>
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {typeServices.length} servicios
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getServiceTypeColor(type).replace('text-', 'bg-').replace('-800', '-500')}`}
                            style={{ inlineSize: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Service Form Dialog */}
      {showServiceForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </CardTitle>
              <CardDescription>
                {editingService ? 'Modifica los datos del servicio' : 'Crea un nuevo servicio en el catálogo'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-code">Código del Servicio *</Label>
                  <Input
                    id="service-code"
                    value={serviceForm.code}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="Ej: EVAL-001"
                  />
                </div>
                
                <div>
                  <Label htmlFor="service-name">Nombre del Servicio *</Label>
                  <Input
                    id="service-name"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Evaluación Pediátrica"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="service-description">Descripción</Label>
                <Textarea
                  id="service-description"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe el servicio..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-category">Categoría *</Label>
                  <Select value={serviceForm.categoryId} onValueChange={(value) => setServiceForm(prev => ({ ...prev, categoryId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="service-type">Tipo de Servicio</Label>
                  <Select value={serviceForm.type} onValueChange={(value: any) => setServiceForm(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EVALUATION">Evaluación</SelectItem>
                      <SelectItem value="TREATMENT">Tratamiento</SelectItem>
                      <SelectItem value="CONSULTATION">Consulta</SelectItem>
                      <SelectItem value="FOLLOW_UP">Seguimiento</SelectItem>
                      <SelectItem value="ASSESSMENT">Evaluación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="service-duration">Duración (minutos)</Label>
                  <Input
                    id="service-duration"
                    type="number"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="service-price">Precio</Label>
                  <Input
                    id="service-price"
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="service-currency">Moneda</Label>
                  <Select value={serviceForm.currency} onValueChange={(value) => setServiceForm(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min-sessions">Sesiones Mínimas</Label>
                  <Input
                    id="min-sessions"
                    type="number"
                    value={serviceForm.minSessions || ''}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, minSessions: parseInt(e.target.value) || undefined }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="max-sessions">Sesiones Máximas</Label>
                  <Input
                    id="max-sessions"
                    type="number"
                    value={serviceForm.maxSessions || ''}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, maxSessions: parseInt(e.target.value) || undefined }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age-min">Edad Mínima</Label>
                  <Input
                    id="age-min"
                    type="number"
                    value={serviceForm.ageRangeMin || ''}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, ageRangeMin: parseInt(e.target.value) || undefined }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="age-max">Edad Máxima</Label>
                  <Input
                    id="age-max"
                    type="number"
                    value={serviceForm.ageRangeMax || ''}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, ageRangeMax: parseInt(e.target.value) || undefined }))}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={serviceForm.isActive}
                    onCheckedChange={(checked) => setServiceForm(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>Servicio Activo</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={serviceForm.requiresApproval}
                    onCheckedChange={(checked) => setServiceForm(prev => ({ ...prev, requiresApproval: checked }))}
                  />
                  <Label>Requiere Aprobación</Label>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowServiceForm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleServiceSubmit} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {editingService ? 'Actualizar' : 'Crear'} Servicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Form Dialog */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </CardTitle>
              <CardDescription>
                {editingCategory ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría de servicios'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category-name">Nombre de la Categoría *</Label>
                <Input
                  id="category-name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Terapia Pediátrica"
                />
              </div>
              
              <div>
                <Label htmlFor="category-description">Descripción</Label>
                <Textarea
                  id="category-description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe la categoría..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category-icon">Icono</Label>
                  <Select value={categoryForm.icon} onValueChange={(value) => setCategoryForm(prev => ({ ...prev, icon: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar icono" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="heart">Corazón</SelectItem>
                      <SelectItem value="brain">Cerebro</SelectItem>
                      <SelectItem value="baby">Bebé</SelectItem>
                      <SelectItem value="users">Usuarios</SelectItem>
                      <SelectItem value="activity">Actividad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="category-color">Color</Label>
                  <Input
                    id="category-color"
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="category-sort">Orden de Clasificación</Label>
                <Input
                  id="category-sort"
                  type="number"
                  value={categoryForm.sortOrder}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={categoryForm.isActive}
                  onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Categoría Activa</Label>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowCategoryForm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCategorySubmit} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
