'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Api, 
  Database, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  User,
  UserCheck,
  Crown,
  FileText,
  MessageSquare,
  BarChart3,
  Calculator,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Save,
  Edit,
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

export default function TestProposalAPIPage() {
  const [currentUser, setCurrentUser] = useState({
    id: 'user-1',
    name: 'Dr. María González',
    role: 'THERAPIST'
  })
  const [apiResponses, setApiResponses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'endpoints' | 'responses' | 'documentation'>('endpoints')

  // Mock API endpoints
  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/proposals',
      description: 'List proposals with filtering and pagination',
      parameters: ['query', 'status', 'priority', 'therapistId', 'patientId', 'dateFrom', 'dateTo', 'minCost', 'maxCost', 'currency', 'sortBy', 'sortOrder', 'page', 'limit'],
      roleAccess: ['THERAPIST', 'COORDINATOR', 'ADMIN']
    },
    {
      method: 'POST',
      path: '/api/proposals',
      description: 'Create new proposal',
      parameters: ['proposal data'],
      roleAccess: ['THERAPIST']
    },
    {
      method: 'PUT',
      path: '/api/proposals',
      description: 'Bulk operations on proposals',
      parameters: ['proposalIds', 'operation', 'parameters'],
      roleAccess: ['COORDINATOR', 'ADMIN']
    },
    {
      method: 'GET',
      path: '/api/proposals/[id]',
      description: 'Get specific proposal',
      parameters: ['id'],
      roleAccess: ['THERAPIST', 'COORDINATOR', 'ADMIN']
    },
    {
      method: 'PUT',
      path: '/api/proposals/[id]',
      description: 'Update proposal',
      parameters: ['id', 'update data'],
      roleAccess: ['THERAPIST', 'COORDINATOR', 'ADMIN']
    },
    {
      method: 'DELETE',
      path: '/api/proposals/[id]',
      description: 'Delete proposal',
      parameters: ['id'],
      roleAccess: ['ADMIN']
    },
    {
      method: 'GET',
      path: '/api/proposals/[id]/status',
      description: 'Get proposal status and available transitions',
      parameters: ['id'],
      roleAccess: ['THERAPIST', 'COORDINATOR', 'ADMIN']
    },
    {
      method: 'PUT',
      path: '/api/proposals/[id]/status',
      description: 'Update proposal status',
      parameters: ['id', 'status transition data'],
      roleAccess: ['THERAPIST', 'COORDINATOR', 'ADMIN']
    },
    {
      method: 'GET',
      path: '/api/proposals/[id]/comments',
      description: 'Get proposal comments',
      parameters: ['id'],
      roleAccess: ['THERAPIST', 'COORDINATOR', 'ADMIN']
    },
    {
      method: 'POST',
      path: '/api/proposals/[id]/comments',
      description: 'Add comment to proposal',
      parameters: ['id', 'comment data'],
      roleAccess: ['THERAPIST', 'COORDINATOR', 'ADMIN']
    },
    {
      method: 'GET',
      path: '/api/proposals/[id]/review',
      description: 'Get proposal review information',
      parameters: ['id'],
      roleAccess: ['COORDINATOR', 'ADMIN']
    },
    {
      method: 'POST',
      path: '/api/proposals/[id]/review',
      description: 'Submit proposal review',
      parameters: ['id', 'review data'],
      roleAccess: ['COORDINATOR', 'ADMIN']
    },
    {
      method: 'POST',
      path: '/api/proposals/cost-calculation',
      description: 'Calculate proposal costs',
      parameters: ['cost calculation data'],
      roleAccess: ['THERAPIST', 'COORDINATOR', 'ADMIN']
    },
    {
      method: 'GET',
      path: '/api/proposals/statistics',
      description: 'Get proposal statistics and analytics',
      parameters: ['dateFrom', 'dateTo', 'groupBy', 'therapistId', 'status'],
      roleAccess: ['THERAPIST', 'COORDINATOR', 'ADMIN']
    }
  ]

  // Test API endpoint
  const testAPIEndpoint = async (endpoint: any) => {
    setIsLoading(true)
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-role': currentUser.role,
        'x-user-id': currentUser.id,
        'x-user-name': currentUser.name
      }
      
      let url = endpoint.path
      let options: RequestInit = {
        method: endpoint.method,
        headers
      }
      
      // Add mock data for POST/PUT requests
      if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
        options.body = JSON.stringify(getMockDataForEndpoint(endpoint))
      }
      
      // Add query parameters for GET requests
      if (endpoint.method === 'GET' && endpoint.parameters.length > 0) {
        const params = new URLSearchParams()
        endpoint.parameters.forEach((param: string) => {
          if (param !== 'id') {
            params.append(param, getMockValueForParameter(param))
          }
        })
        if (params.toString()) {
          url += `?${params.toString()}`
        }
      }
      
      // Replace [id] with mock ID
      url = url.replace('[id]', 'PROP-2024-001')
      
      const response = await fetch(url, options)
      const data = await response.json()
      
      const apiResponse = {
        id: Date.now(),
        endpoint: `${endpoint.method} ${endpoint.path}`,
        description: endpoint.description,
        status: response.status,
        statusText: response.statusText,
        data: data,
        timestamp: new Date().toISOString(),
        userRole: currentUser.role
      }
      
      setApiResponses(prev => [apiResponse, ...prev])
      
    } catch (error) {
      const apiResponse = {
        id: Date.now(),
        endpoint: `${endpoint.method} ${endpoint.path}`,
        description: endpoint.description,
        status: 'ERROR',
        statusText: 'Network Error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString(),
        userRole: currentUser.role
      }
      
      setApiResponses(prev => [apiResponse, ...prev])
    } finally {
      setIsLoading(false)
    }
  }

  // Get mock data for endpoint
  const getMockDataForEndpoint = (endpoint: any) => {
    switch (endpoint.path) {
      case '/api/proposals':
        if (endpoint.method === 'POST') {
          return {
            patientId: 'PAT-2024-001',
            selectedServices: [
              {
                service: {
                  id: 'service-1',
                  code: 'EVAL-001',
                  name: 'Evaluación Pediátrica Integral',
                  description: 'Evaluación completa del desarrollo infantil',
                  categoryId: 'cat-1',
                  category: {
                    id: 'cat-1',
                    name: 'Terapia Pediátrica',
                    color: '#3b82f6',
                    icon: 'baby'
                  },
                  type: 'EVALUATION',
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
                sessionCount: 1,
                notes: 'Evaluación inicial para determinar necesidades específicas',
                priority: 'HIGH'
              }
            ],
            totalSessions: 1,
            estimatedDuration: 120,
            estimatedCost: 150.00,
            currency: 'USD',
            priority: 'HIGH',
            notes: 'Propuesta para paciente pediátrico con necesidades múltiples de terapia',
            goals: [
              'Mejorar las habilidades de comunicación y lenguaje',
              'Desarrollar habilidades motoras finas y gruesas'
            ],
            expectedOutcomes: [
              'Comunicación más efectiva con familiares y compañeros',
              'Mejora en las habilidades motoras para actividades diarias'
            ],
            followUpRequired: true,
            followUpNotes: 'Seguimiento mensual para evaluar progreso'
          }
        }
        break
      case '/api/proposals/[id]/status':
        if (endpoint.method === 'PUT') {
          return {
            fromStatus: 'DRAFT',
            toStatus: 'SUBMITTED',
            notes: 'Propuesta enviada para revisión'
          }
        }
        break
      case '/api/proposals/[id]/comments':
        if (endpoint.method === 'POST') {
          return {
            content: 'Comentario de prueba desde la API',
            isInternal: false
          }
        }
        break
      case '/api/proposals/[id]/review':
        if (endpoint.method === 'POST') {
          return {
            status: 'APPROVED',
            notes: 'Revisión aprobada desde la API',
            coordinatorNotes: 'Propuesta bien estructurada',
            pricingNotes: 'Costos dentro del rango presupuestario',
            budgetApproval: true
          }
        }
        break
      case '/api/proposals/cost-calculation':
        return {
          selectedServices: [
            {
              service: {
                id: 'service-1',
                code: 'EVAL-001',
                name: 'Evaluación Pediátrica Integral',
                price: 150.00
              },
              sessionCount: 1
            }
          ],
          includeTaxes: true,
          taxRate: 10,
          includeDiscounts: true,
          discountPercentage: 5,
          currency: 'USD',
          precision: 2
        }
      default:
        return {}
    }
  }

  // Get mock value for parameter
  const getMockValueForParameter = (param: string) => {
    switch (param) {
      case 'query': return 'pediatric'
      case 'status': return 'UNDER_REVIEW'
      case 'priority': return 'HIGH'
      case 'therapistId': return 'THER-2024-001'
      case 'patientId': return 'PAT-2024-001'
      case 'dateFrom': return '2024-01-01T00:00:00Z'
      case 'dateTo': return '2024-12-31T23:59:59Z'
      case 'minCost': return '100'
      case 'maxCost': return '1000'
      case 'currency': return 'USD'
      case 'sortBy': return 'createdAt'
      case 'sortOrder': return 'desc'
      case 'page': return '1'
      case 'limit': return '20'
      case 'groupBy': return 'month'
      default: return 'test'
    }
  }

  // Get user role information
  const getUserRoleInfo = (role: string) => {
    switch (role) {
      case 'THERAPIST':
        return {
          name: 'Terapeuta',
          description: 'Puede crear y editar propuestas, ver progreso',
          icon: <User className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800'
        }
      case 'COORDINATOR':
        return {
          name: 'Coordinador',
          description: 'Puede revisar propuestas, aprobar/rechazar',
          icon: <UserCheck className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800'
        }
      case 'ADMIN':
        return {
          name: 'Administrador',
          description: 'Puede realizar todas las acciones del sistema',
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

  const currentUserRoleInfo = getUserRoleInfo(currentUser.role)

  // Get method color
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800'
      case 'POST': return 'bg-blue-100 text-blue-800'
      case 'PUT': return 'bg-yellow-100 text-yellow-800'
      case 'DELETE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get status color
  const getStatusColor = (status: number | string) => {
    if (typeof status === 'string') return 'bg-red-100 text-red-800'
    
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800'
    if (status >= 300 && status < 400) return 'bg-yellow-100 text-yellow-800'
    if (status >= 400 && status < 500) return 'bg-orange-100 text-orange-800'
    if (status >= 500) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Api className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">API de Propuestas Terapéuticas</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo de API endpoints para propuestas terapéuticas con validación del servidor, 
        control de acceso basado en roles y filtrado de datos.
      </p>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="h-4 w-4 mr-2 text-blue-600" />
              Validación del Servidor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Validación completa con Zod y esquemas de datos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-green-600" />
              Control de Acceso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Control de acceso basado en roles y permisos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Database className="h-4 w-4 mr-2 text-purple-600" />
              Filtrado de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Filtrado de datos basado en roles de usuario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-orange-600" />
              Análisis y Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Endpoints para análisis y estadísticas avanzadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selección de Usuario</CardTitle>
          <CardDescription>
            Cambia el usuario para ver cómo afecta el acceso a los endpoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['THERAPIST', 'COORDINATOR', 'ADMIN'] as const).map((role) => {
              const roleInfo = getUserRoleInfo(role)
              const isSelected = currentUser.role === role
              
              return (
                <div
                  key={role}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCurrentUser({
                    id: `user-${role.toLowerCase()}`,
                    name: roleInfo.name,
                    role
                  })}
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

      {/* Current User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {currentUserRoleInfo.icon}
            <span className="ml-2">Usuario Actual: {currentUserRoleInfo.name}</span>
          </CardTitle>
          <CardDescription>
            {currentUserRoleInfo.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Badge className={currentUserRoleInfo.color}>
              {currentUserRoleInfo.name}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {currentUser.name} ({currentUser.id})
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="responses">Respuestas</TabsTrigger>
          <TabsTrigger value="documentation">Documentación</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          {/* API Endpoints */}
          <Card>
            <CardHeader>
              <CardTitle>Endpoints de la API</CardTitle>
              <CardDescription>
                Lista de todos los endpoints disponibles con sus métodos, parámetros y control de acceso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiEndpoints.map((endpoint, index) => {
                  const canAccess = endpoint.roleAccess.includes(currentUser.role as any)
                  
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {endpoint.path}
                          </code>
                        </div>
                        <div className="flex items-center space-x-2">
                          {canAccess ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Acceso Permitido
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Sin Acceso
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {endpoint.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Parámetros:</span>
                          <div className="mt-1">
                            {endpoint.parameters.map((param, paramIndex) => (
                              <Badge key={paramIndex} variant="outline" className="mr-1 mb-1">
                                {param}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Roles con Acceso:</span>
                          <div className="mt-1">
                            {endpoint.roleAccess.map((role, roleIndex) => (
                              <Badge key={roleIndex} variant="outline" className="mr-1 mb-1">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Button
                          onClick={() => testAPIEndpoint(endpoint)}
                          disabled={!canAccess || isLoading}
                          size="sm"
                          className="w-full"
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Api className="h-4 w-4 mr-2" />
                          )}
                          {isLoading ? 'Probando...' : 'Probar Endpoint'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          {/* API Responses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Respuestas de la API</CardTitle>
                  <CardDescription>
                    Historial de respuestas de los endpoints probados
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setApiResponses([])}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpiar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiResponses.length === 0 ? (
                  <div className="text-center py-8">
                    <Api className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay respuestas de API aún</p>
                    <p className="text-sm text-muted-foreground">
                      Prueba algunos endpoints para ver las respuestas aquí
                    </p>
                  </div>
                ) : (
                  apiResponses.map((response) => (
                    <div key={response.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{response.endpoint}</h3>
                          <p className="text-sm text-muted-foreground">{response.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(response.status)}>
                            {response.status} {response.statusText}
                          </Badge>
                          <Badge variant="outline">
                            {response.userRole}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-3">
                        {new Date(response.timestamp).toLocaleString()}
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(response.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-4">
          {/* API Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>Documentación de la API</CardTitle>
              <CardDescription>
                Información detallada sobre el sistema de API de propuestas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Autenticación y Autorización</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  La API utiliza headers HTTP para la autenticación y autorización:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <code>x-user-role</code>: Rol del usuario (THERAPIST, COORDINATOR, ADMIN)</li>
                  <li>• <code>x-user-id</code>: ID único del usuario</li>
                  <li>• <code>x-user-name</code>: Nombre del usuario</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Control de Acceso Basado en Roles</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-100 text-blue-800">THERAPIST</Badge>
                    <span className="text-sm">Puede crear, editar y ver sus propias propuestas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">COORDINATOR</Badge>
                    <span className="text-sm">Puede revisar, aprobar/rechazar propuestas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-purple-100 text-purple-800">ADMIN</Badge>
                    <span className="text-sm">Acceso completo a todas las funcionalidades</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Validación del Servidor</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Todos los endpoints utilizan validación con Zod para:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Validación de tipos de datos</li>
                  <li>• Validación de rangos y formatos</li>
                  <li>• Validación de reglas de negocio</li>
                  <li>• Sanitización de entrada</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Filtrado de Datos</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Los datos se filtran automáticamente según el rol del usuario:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• <strong>Terapeutas:</strong> No pueden ver información de precios</li>
                  <li>• <strong>Coordinadores:</strong> Pueden ver precios pero no notas administrativas</li>
                  <li>• <strong>Administradores:</strong> Acceso completo a toda la información</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Códigos de Estado HTTP</h3>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-green-100 text-green-800">200</Badge>
                    <span className="text-sm">Éxito</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-100 text-blue-800">201</Badge>
                    <span className="text-sm">Creado exitosamente</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-orange-100 text-orange-800">400</Badge>
                    <span className="text-sm">Datos inválidos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-red-100 text-red-800">403</Badge>
                    <span className="text-sm">Acceso denegado</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-red-100 text-red-800">404</Badge>
                    <span className="text-sm">No encontrado</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-red-100 text-red-800">500</Badge>
                    <span className="text-sm">Error del servidor</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Technical Information */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema de API implementa validación completa del servidor 
          con Zod, control de acceso basado en roles, filtrado de datos según permisos, endpoints RESTful 
          para todas las operaciones CRUD, validación de transiciones de estado, sistema de comentarios 
          y colaboración, cálculo de costos con precisión decimal, y análisis estadístico avanzado.
        </AlertDescription>
      </Alert>
    </div>
  )
}
