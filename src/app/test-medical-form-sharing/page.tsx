'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Share2, 
  Users, 
  MessageSquare, 
  Eye, 
  Edit, 
  Download, 
  CheckCircle,
  AlertTriangle,
  Info,
  Lock,
  Unlock,
  Bell,
  Send
} from 'lucide-react'
import { MedicalFormSharing } from '@/components/medical-form/medical-form-sharing'
import { SharedFormViewer } from '@/components/medical-form/shared-form-viewer'

// Mock data for testing
const mockCurrentUser = {
  id: 'current-user',
  name: 'Dr. María González',
  email: 'maria@therapycenter.com',
  role: 'THERAPIST' as const,
  avatar: undefined,
  isOnline: true
}

const mockPermissions = [
  {
    id: 'perm-1',
    userId: 'user-1',
    user: {
      id: 'user-1',
      name: 'Dr. Carlos Rodríguez',
      email: 'carlos@therapycenter.com',
      role: 'THERAPIST' as const,
      isOnline: false
    },
    permission: 'EDIT' as const,
    grantedBy: 'Dr. María González',
    grantedAt: '2024-01-15T10:00:00Z',
    isActive: true
  },
  {
    id: 'perm-2',
    userId: 'user-2',
    user: {
      id: 'user-2',
      name: 'Ana Martínez',
      email: 'ana@therapycenter.com',
      role: 'COORDINATOR' as const,
      isOnline: true
    },
    permission: 'VIEW' as const,
    grantedBy: 'Dr. María González',
    grantedAt: '2024-01-16T14:30:00Z',
    isActive: true
  }
]

const mockInvitations = [
  {
    id: 'inv-1',
    email: 'luis@therapycenter.com',
    permission: 'COMMENT' as const,
    message: 'Por favor revisa este formulario y agrega tus comentarios',
    status: 'PENDING' as const,
    sentAt: '2024-01-17T09:00:00Z',
    expiresAt: '2024-02-16T09:00:00Z'
  },
  {
    id: 'inv-2',
    email: 'sofia@therapycenter.com',
    permission: 'VIEW' as const,
    message: 'Formulario para revisión',
    status: 'ACCEPTED' as const,
    sentAt: '2024-01-10T16:00:00Z',
    expiresAt: '2024-02-09T16:00:00Z',
    acceptedAt: '2024-01-11T08:30:00Z'
  }
]

const mockComments = [
  {
    id: 'comment-1',
    userId: 'user-1',
    user: {
      id: 'user-1',
      name: 'Dr. Carlos Rodríguez',
      email: 'carlos@therapycenter.com',
      role: 'THERAPIST' as const
    },
    content: 'El historial médico del paciente muestra algunas inconsistencias en las fechas. ¿Podrías verificar la información?',
    sectionId: 'medical-history',
    fieldId: 'birth-date',
    createdAt: '2024-01-18T10:30:00Z',
    updatedAt: '2024-01-18T10:30:00Z',
    isResolved: false
  },
  {
    id: 'comment-2',
    userId: 'user-2',
    user: {
      id: 'user-2',
      name: 'Ana Martínez',
      email: 'ana@therapycenter.com',
      role: 'COORDINATOR' as const
    },
    content: 'Excelente trabajo en la evaluación. Los padres están muy satisfechos con el proceso.',
    createdAt: '2024-01-19T15:45:00Z',
    updatedAt: '2024-01-19T15:45:00Z',
    isResolved: true
  }
]

const mockFormSections = [
  {
    id: 'personal-info',
    title: 'Información Personal',
    description: 'Datos básicos del paciente',
    fields: [
      {
        id: 'name',
        type: 'text' as const,
        label: 'Nombre',
        required: true,
        order: 1,
        value: 'Juan'
      },
      {
        id: 'lastname',
        type: 'text' as const,
        label: 'Apellido',
        required: true,
        order: 2,
        value: 'Pérez'
      },
      {
        id: 'birth-date',
        type: 'date' as const,
        label: 'Fecha de Nacimiento',
        required: true,
        order: 3,
        value: '2020-03-15'
      }
    ],
    order: 1,
    required: true
  },
  {
    id: 'medical-history',
    title: 'Historial Médico',
    description: 'Información médica relevante',
    fields: [
      {
        id: 'conditions',
        type: 'textarea' as const,
        label: 'Condiciones Actuales',
        required: false,
        order: 1,
        value: 'Ninguna condición médica conocida'
      },
      {
        id: 'medications',
        type: 'textarea' as const,
        label: 'Medicamentos',
        required: false,
        order: 2,
        value: 'No toma medicamentos'
      }
    ],
    order: 2,
    required: true
  }
]

const mockFormData = {
  'personal-info': {
    name: 'Juan',
    lastname: 'Pérez',
    'birth-date': '2020-03-15'
  },
  'medical-history': {
    conditions: 'Ninguna condición médica conocida',
    medications: 'No toma medicamentos'
  }
}

export default function TestMedicalFormSharingPage() {
  const [activeView, setActiveView] = useState<'sharing' | 'viewer'>('sharing')
  const [selectedPermission, setSelectedPermission] = useState<'VIEW' | 'EDIT' | 'COMMENT' | 'ADMIN'>('VIEW')

  const handleShare = (permissions: any, invitations: any) => {
    console.log('Sharing form:', { permissions, invitations })
    alert('Formulario compartido exitosamente')
  }

  const handleComment = (comment: any) => {
    console.log('New comment:', comment)
    alert('Comentario agregado')
  }

  const handleUpdatePermission = (permissionId: string, updates: any) => {
    console.log('Updating permission:', permissionId, updates)
    alert('Permiso actualizado')
  }

  const handleRemovePermission = (permissionId: string) => {
    console.log('Removing permission:', permissionId)
    alert('Permiso eliminado')
  }

  const handleResendInvitation = (invitationId: string) => {
    console.log('Resending invitation:', invitationId)
    alert('Invitación reenviada')
  }

  const handleCancelInvitation = (invitationId: string) => {
    console.log('Canceling invitation:', invitationId)
    alert('Invitación cancelada')
  }

  const handleSave = (formData: any) => {
    console.log('Saving form data:', formData)
    alert('Formulario guardado')
  }

  const handleExport = () => {
    console.log('Exporting form')
    alert('Formulario exportado')
  }

  const handleReact = (commentId: string, reaction: 'thumbsUp' | 'thumbsDown') => {
    console.log('Reacting to comment:', commentId, reaction)
    alert(`Reacción ${reaction} agregada`)
  }

  const handleResolveComment = (commentId: string) => {
    console.log('Resolving comment:', commentId)
    alert('Comentario marcado como resuelto')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Share2 className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Sistema de Compartir Formularios Médicos</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo para compartir formularios médicos entre terapeutas con permisos granulares y colaboración en tiempo real.
      </p>

      {/* View Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Vista</CardTitle>
          <CardDescription>
            Elige entre la vista de administración de compartir o la vista de usuario compartido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant={activeView === 'sharing' ? 'default' : 'outline'}
              onClick={() => setActiveView('sharing')}
              className="h-auto p-4"
            >
              <div className="text-center">
                <Share2 className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Administrar Compartir</div>
                <div className="text-sm text-muted-foreground">
                  Gestionar permisos e invitaciones
                </div>
              </div>
            </Button>

            <Button
              variant={activeView === 'viewer' ? 'default' : 'outline'}
              onClick={() => setActiveView('viewer')}
              className="h-auto p-4"
            >
              <div className="text-center">
                <Eye className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Vista de Usuario Compartido</div>
                <div className="text-sm text-muted-foreground">
                  Ver formulario compartido con permisos limitados
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Permission Selector for Viewer */}
      {activeView === 'viewer' && (
        <Card>
          <CardHeader>
            <CardTitle>Simular Permisos de Usuario</CardTitle>
            <CardDescription>
              Selecciona el nivel de permisos para simular la experiencia del usuario
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant={selectedPermission === 'VIEW' ? 'default' : 'outline'}
                onClick={() => setSelectedPermission('VIEW')}
                className="h-auto p-4"
              >
                <div className="text-center">
                  <Eye className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Solo Ver</div>
                  <div className="text-sm text-muted-foreground">
                    Lectura únicamente
                  </div>
                </div>
              </Button>

              <Button
                variant={selectedPermission === 'COMMENT' ? 'default' : 'outline'}
                onClick={() => setSelectedPermission('COMMENT')}
                className="h-auto p-4"
              >
                <div className="text-center">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Comentar</div>
                  <div className="text-sm text-muted-foreground">
                    Ver y comentar
                  </div>
                </div>
              </Button>

              <Button
                variant={selectedPermission === 'EDIT' ? 'default' : 'outline'}
                onClick={() => setSelectedPermission('EDIT')}
                className="h-auto p-4"
              >
                <div className="text-center">
                  <Edit className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Editar</div>
                  <div className="text-sm text-muted-foreground">
                    Ver, comentar y editar
                  </div>
                </div>
              </Button>

              <Button
                variant={selectedPermission === 'ADMIN' ? 'default' : 'outline'}
                onClick={() => setSelectedPermission('ADMIN')}
                className="h-auto p-4"
              >
                <div className="text-center">
                  <Users className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Admin</div>
                  <div className="text-sm text-muted-foreground">
                    Control total
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Permisos Granulares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Control detallado de permisos: ver, comentar, editar o administrar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MessageSquare className="h-4 w-4 mr-2 text-blue-600" />
              Colaboración en Tiempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Comentarios, reacciones y resolución de problemas colaborativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Bell className="h-4 w-4 mr-2 text-purple-600" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Invitaciones por email y notificaciones de actividad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Lock className="h-4 w-4 mr-2 text-orange-600" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Enlaces seguros, expiración de permisos y auditoría de acceso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Compartidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPermissions.length}</div>
            <p className="text-xs text-muted-foreground">Con acceso actual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Invitaciones Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockInvitations.filter(i => i.status === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">Esperando respuesta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Comentarios Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockComments.filter(c => !c.isResolved).length}
            </div>
            <p className="text-xs text-muted-foreground">Pendientes de resolución</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Resolución</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockComments.length > 0 ? Math.round((mockComments.filter(c => c.isResolved).length / mockComments.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Comentarios resueltos</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {activeView === 'sharing' && (
        <MedicalFormSharing
          formId="form-123"
          formTitle="Evaluación Pediátrica - Juan Pérez"
          currentUser={mockCurrentUser}
          initialPermissions={mockPermissions}
          initialInvitations={mockInvitations}
          initialComments={mockComments}
          onShare={handleShare}
          onComment={handleComment}
          onUpdatePermission={handleUpdatePermission}
          onRemovePermission={handleRemovePermission}
          onResendInvitation={handleResendInvitation}
          onCancelInvitation={handleCancelInvitation}
        />
      )}

      {activeView === 'viewer' && (
        <SharedFormViewer
          formId="form-123"
          formTitle="Evaluación Pediátrica - Juan Pérez"
          formData={mockFormData}
          sections={mockFormSections}
          currentUser={{
            id: 'shared-user',
            name: 'Dr. Carlos Rodríguez',
            email: 'carlos@therapycenter.com',
            role: 'THERAPIST'
          }}
          permission={{
            permission: selectedPermission,
            grantedBy: 'Dr. María González',
            grantedAt: '2024-01-15T10:00:00Z',
            expiresAt: '2024-02-15T10:00:00Z'
          }}
          comments={mockComments}
          onSave={handleSave}
          onComment={handleComment}
          onReact={handleReact}
          onResolveComment={handleResolveComment}
          onExport={handleExport}
        />
      )}

      {/* Technical Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema incluye gestión completa de permisos con 
          niveles granulares (ver, comentar, editar, administrar), invitaciones por email con 
          expiración, colaboración en tiempo real con comentarios y reacciones, notificaciones 
          automáticas, y auditoría de acceso. Los formularios compartidos mantienen la integridad 
          de los datos con validación de permisos en tiempo real.
        </AlertDescription>
      </Alert>

      {/* Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Casos de Uso</CardTitle>
          <CardDescription>
            Ejemplos de cómo se puede usar el sistema de compartir formularios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Para Terapeutas</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Compartir evaluaciones con colegas para segunda opinión</li>
                <li>• Colaborar en casos complejos con múltiples especialistas</li>
                <li>• Solicitar revisión de formularios antes de la aprobación</li>
                <li>• Mantener comunicación sobre el progreso del paciente</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Para Coordinadores</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Supervisar el progreso de las evaluaciones</li>
                <li>• Coordinar entre diferentes terapeutas</li>
                <li>• Asegurar la calidad y consistencia de los formularios</li>
                <li>• Gestionar el flujo de trabajo del centro</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
