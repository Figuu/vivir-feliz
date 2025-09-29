'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Users,
  DollarSign,
  Clock,
  Tag,
  Star,
  TrendingUp,
  BarChart3,
  Activity,
  Heart,
  Brain,
  Baby,
  UserCheck,
  Calendar,
  FileText,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Copy,
  Save,
  Eye,
  Search,
  Filter
} from 'lucide-react'
import { ServiceCatalogManager } from '@/components/service-catalog/service-catalog-manager'
import { 
  validateService, 
  validateCategory, 
  validateServiceCode, 
  validatePricing, 
  validateDuration,
  generateServiceCode,
  validateServiceCodeUniqueness,
  validatePriceRange,
  validateDurationConstraints
} from '@/lib/service-validation'

// Mock data for testing
const mockCategories = [
  {
    id: 'cat-1',
    name: 'Terapia Pediátrica',
    description: 'Servicios especializados para niños y adolescentes',
    icon: 'baby',
    color: '#3b82f6',
    isActive: true,
    sortOrder: 1,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'cat-2',
    name: 'Terapia de Adultos',
    description: 'Servicios terapéuticos para adultos',
    icon: 'users',
    color: '#10b981',
    isActive: true,
    sortOrder: 2,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'cat-3',
    name: 'Evaluaciones Neuropsicológicas',
    description: 'Evaluaciones especializadas del funcionamiento cognitivo',
    icon: 'brain',
    color: '#8b5cf6',
    isActive: true,
    sortOrder: 3,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'cat-4',
    name: 'Terapia Familiar',
    description: 'Servicios de terapia familiar y de pareja',
    icon: 'heart',
    color: '#f59e0b',
    isActive: true,
    sortOrder: 4,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  }
]

const mockServices = [
  {
    id: 'service-1',
    code: 'EVAL-001',
    name: 'Evaluación Pediátrica Integral',
    description: 'Evaluación completa del desarrollo infantil incluyendo aspectos cognitivos, emocionales y conductuales',
    categoryId: 'cat-1',
    category: mockCategories[0],
    type: 'EVALUATION' as const,
    duration: 120,
    price: 150,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 1,
    minSessions: 1,
    ageRange: { min: 2, max: 18 },
    prerequisites: ['Historial médico', 'Informes escolares'],
    outcomes: ['Diagnóstico integral', 'Plan de tratamiento', 'Recomendaciones'],
    tags: ['pediátrica', 'evaluación', 'desarrollo'],
    metadata: {
      createdBy: 'admin-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      usageCount: 45,
      averageRating: 4.8
    }
  },
  {
    id: 'service-2',
    code: 'TREAT-001',
    name: 'Terapia de Lenguaje',
    description: 'Intervención terapéutica para mejorar las habilidades de comunicación y lenguaje',
    categoryId: 'cat-1',
    category: mockCategories[0],
    type: 'TREATMENT' as const,
    duration: 60,
    price: 80,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 20,
    minSessions: 8,
    ageRange: { min: 3, max: 12 },
    prerequisites: ['Evaluación previa'],
    outcomes: ['Mejora en comunicación', 'Desarrollo del lenguaje', 'Habilidades sociales'],
    tags: ['lenguaje', 'comunicación', 'pediátrica'],
    metadata: {
      createdBy: 'admin-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      usageCount: 120,
      averageRating: 4.6
    }
  },
  {
    id: 'service-3',
    code: 'CONSULT-001',
    name: 'Consulta Psicológica',
    description: 'Consulta inicial para evaluación y orientación psicológica',
    categoryId: 'cat-2',
    category: mockCategories[1],
    type: 'CONSULTATION' as const,
    duration: 50,
    price: 100,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 1,
    minSessions: 1,
    ageRange: { min: 18, max: 65 },
    prerequisites: [],
    outcomes: ['Evaluación inicial', 'Orientación', 'Plan de seguimiento'],
    tags: ['consulta', 'psicología', 'adultos'],
    metadata: {
      createdBy: 'admin-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      usageCount: 85,
      averageRating: 4.7
    }
  },
  {
    id: 'service-4',
    code: 'ASSESS-001',
    name: 'Evaluación Neuropsicológica',
    description: 'Evaluación completa del funcionamiento cognitivo y neuropsicológico',
    categoryId: 'cat-3',
    category: mockCategories[2],
    type: 'ASSESSMENT' as const,
    duration: 180,
    price: 300,
    currency: 'USD',
    isActive: true,
    requiresApproval: true,
    maxSessions: 1,
    minSessions: 1,
    ageRange: { min: 6, max: 80 },
    prerequisites: ['Historial médico', 'Evaluación previa'],
    outcomes: ['Perfil neuropsicológico', 'Diagnóstico', 'Recomendaciones'],
    tags: ['neuropsicología', 'evaluación', 'cognición'],
    metadata: {
      createdBy: 'admin-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      usageCount: 25,
      averageRating: 4.9
    }
  },
  {
    id: 'service-5',
    code: 'FOLLOW-001',
    name: 'Seguimiento Terapéutico',
    description: 'Sesiones de seguimiento para monitorear el progreso del tratamiento',
    categoryId: 'cat-1',
    category: mockCategories[0],
    type: 'FOLLOW_UP' as const,
    duration: 30,
    price: 50,
    currency: 'USD',
    isActive: true,
    requiresApproval: false,
    maxSessions: 10,
    minSessions: 1,
    ageRange: { min: 2, max: 18 },
    prerequisites: ['Tratamiento previo'],
    outcomes: ['Monitoreo de progreso', 'Ajustes al tratamiento'],
    tags: ['seguimiento', 'monitoreo', 'progreso'],
    metadata: {
      createdBy: 'admin-1',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      usageCount: 200,
      averageRating: 4.5
    }
  }
]

const mockCurrentUser = {
  id: 'admin-1',
  name: 'Dr. María González',
  role: 'ADMIN'
}

export default function TestServiceCatalogPage() {
  const [services, setServices] = useState(mockServices)
  const [categories, setCategories] = useState(mockCategories)
  const [validationResults, setValidationResults] = useState<any[]>([])
  const [showValidationDemo, setShowValidationDemo] = useState(false)

  const handleServiceSave = (service: any) => {
    console.log('Saving service:', service)
    
    // Validate the service
    const validation = validateService(service)
    setValidationResults(prev => [{
      type: 'service',
      data: service,
      validation,
      timestamp: new Date().toISOString()
    }, ...prev])
    
    if (validation.isValid) {
      setServices(prev => {
        const existingIndex = prev.findIndex(s => s.id === service.id)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = service
          return updated
        } else {
          return [service, ...prev]
        }
      })
      alert('Servicio guardado exitosamente')
    } else {
      alert(`Error de validación: ${validation.errors.join(', ')}`)
    }
  }

  const handleServiceDelete = (serviceId: string) => {
    console.log('Deleting service:', serviceId)
    setServices(prev => prev.filter(s => s.id !== serviceId))
    alert('Servicio eliminado')
  }

  const handleServiceDuplicate = (service: any) => {
    console.log('Duplicating service:', service)
    alert('Servicio duplicado')
  }

  const handleCategorySave = (category: any) => {
    console.log('Saving category:', category)
    
    // Validate the category
    const validation = validateCategory(category)
    setValidationResults(prev => [{
      type: 'category',
      data: category,
      validation,
      timestamp: new Date().toISOString()
    }, ...prev])
    
    if (validation.isValid) {
      setCategories(prev => {
        const existingIndex = prev.findIndex(c => c.id === category.id)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = category
          return updated
        } else {
          return [category, ...prev]
        }
      })
      alert('Categoría guardada exitosamente')
    } else {
      alert(`Error de validación: ${validation.errors.join(', ')}`)
    }
  }

  const handleCategoryDelete = (categoryId: string) => {
    console.log('Deleting category:', categoryId)
    setCategories(prev => prev.filter(c => c.id !== categoryId))
    alert('Categoría eliminada')
  }

  const handleExport = (services: any[]) => {
    console.log('Exporting services:', services)
    const dataStr = JSON.stringify(services, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'service-catalog.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    alert('Catálogo exportado exitosamente')
  }

  const handleImport = (file: File) => {
    console.log('Importing file:', file)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (Array.isArray(data)) {
          setServices(data)
          alert('Catálogo importado exitosamente')
        } else {
          alert('Formato de archivo inválido')
        }
      } catch (error) {
        alert('Error al importar el archivo')
      }
    }
    reader.readAsText(file)
  }

  // Demo validation functions
  const runValidationDemo = () => {
    const demoResults = []
    
    // Test service code validation
    const codeTests = [
      { code: 'EVAL-001', expected: true },
      { code: 'INVALID', expected: false },
      { code: 'TREAT-999', expected: true },
      { code: 'eval-001', expected: false }, // lowercase
      { code: 'EVAL-1', expected: false } // wrong format
    ]
    
    codeTests.forEach(test => {
      const result = validateServiceCode(test.code)
      demoResults.push({
        type: 'Service Code',
        input: test.code,
        expected: test.expected,
        actual: result.isValid,
        errors: result.errors
      })
    })
    
    // Test pricing validation
    const pricingTests = [
      { pricing: { price: 100, currency: 'USD' }, expected: true },
      { pricing: { price: -50, currency: 'USD' }, expected: false },
      { pricing: { price: 100, currency: 'INVALID' }, expected: false },
      { pricing: { price: 100.123, currency: 'USD' }, expected: false } // too many decimals
    ]
    
    pricingTests.forEach(test => {
      const result = validatePricing(test.pricing)
      demoResults.push({
        type: 'Pricing',
        input: test.pricing,
        expected: test.expected,
        actual: result.isValid,
        errors: result.errors
      })
    })
    
    // Test duration validation
    const durationTests = [
      { duration: { duration: 60 }, expected: true },
      { duration: { duration: 10 }, expected: false }, // too short
      { duration: { duration: 500 }, expected: false }, // too long
      { duration: { duration: 65 }, expected: false } // not multiple of 15
    ]
    
    durationTests.forEach(test => {
      const result = validateDuration(test.duration)
      demoResults.push({
        type: 'Duration',
        input: test.duration,
        expected: test.expected,
        actual: result.isValid,
        errors: result.errors
      })
    })
    
    setValidationResults(demoResults)
    setShowValidationDemo(true)
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Package className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Sistema de Gestión del Catálogo de Servicios</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo para administrar el catálogo de servicios terapéuticos con validación avanzada, 
        gestión de categorías, y análisis de uso.
      </p>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Validación Avanzada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Validación de códigos, precios, duraciones y restricciones de edad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Settings className="h-4 w-4 mr-2 text-blue-600" />
              Gestión Completa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              CRUD completo para servicios y categorías con plantillas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
              Analíticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Estadísticas de uso, ingresos y rendimiento de servicios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Download className="h-4 w-4 mr-2 text-orange-600" />
              Importar/Exportar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Importar y exportar catálogos en formato JSON
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
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
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Generados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Precio Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.averagePrice.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Por servicio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Más Usado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mostUsedService?.metadata.usageCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats.mostUsedService?.name || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Demostración de Validación</CardTitle>
          <CardDescription>
            Prueba las funciones de validación del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Button onClick={runValidationDemo}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Ejecutar Pruebas de Validación
            </Button>
            <Button 
              onClick={() => setShowValidationDemo(!showValidationDemo)} 
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showValidationDemo ? 'Ocultar' : 'Mostrar'} Resultados
            </Button>
          </div>
          
          {showValidationDemo && validationResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Resultados de Validación:</h4>
              {validationResults.map((result, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{result.type}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant={result.actual === result.expected ? 'default' : 'destructive'}>
                        {result.actual ? 'Válido' : 'Inválido'}
                      </Badge>
                      <Badge variant={result.actual === result.expected ? 'default' : 'destructive'}>
                        {result.actual === result.expected ? 'Correcto' : 'Incorrecto'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    <strong>Entrada:</strong> {JSON.stringify(result.input)}
                  </div>
                  {result.errors && result.errors.length > 0 && (
                    <div className="text-sm text-red-600 mt-1">
                      <strong>Errores:</strong> {result.errors.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Types Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Servicios</CardTitle>
          <CardDescription>
            Diferentes tipos de servicios disponibles en el catálogo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <UserCheck className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-medium">Evaluación</h3>
              <p className="text-sm text-muted-foreground">Evaluaciones iniciales y diagnósticas</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Heart className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-medium">Tratamiento</h3>
              <p className="text-sm text-muted-foreground">Sesiones de terapia y tratamiento</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-medium">Consulta</h3>
              <p className="text-sm text-muted-foreground">Consultas y orientaciones</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Calendar className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <h3 className="font-medium">Seguimiento</h3>
              <p className="text-sm text-muted-foreground">Sesiones de seguimiento</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Brain className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h3 className="font-medium">Evaluación</h3>
              <p className="text-sm text-muted-foreground">Evaluaciones especializadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Service Catalog Manager */}
      <ServiceCatalogManager
        initialServices={services}
        initialCategories={categories}
        currentUser={mockCurrentUser}
        onSave={handleServiceSave}
        onDelete={handleServiceDelete}
        onDuplicate={handleServiceDuplicate}
        onCategorySave={handleCategorySave}
        onCategoryDelete={handleCategoryDelete}
        onExport={handleExport}
        onImport={handleImport}
      />

      {/* Technical Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema incluye validación avanzada de códigos de servicio, 
          precios, duraciones y restricciones de edad. Soporta múltiples tipos de servicios (Evaluación, 
          Tratamiento, Consulta, Seguimiento, Evaluación), gestión completa de categorías, analíticas de uso 
          y rendimiento, importación/exportación de catálogos, y validación en tiempo real con mensajes de error 
          detallados.
        </AlertDescription>
      </Alert>
    </div>
  )
}
