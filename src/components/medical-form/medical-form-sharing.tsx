'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Share2, 
  Users, 
  UserPlus, 
  Eye, 
  Edit, 
  Trash2, 
  Mail, 
  Copy, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Lock,
  Unlock,
  Send,
  Download,
  MessageSquare,
  Bell,
  Settings
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'THERAPIST' | 'COORDINATOR' | 'ADMIN'
  avatar?: string
  isOnline?: boolean
}

interface SharePermission {
  id: string
  userId: string
  user: User
  permission: 'VIEW' | 'EDIT' | 'COMMENT' | 'ADMIN'
  grantedBy: string
  grantedAt: string
  expiresAt?: string
  isActive: boolean
}

interface ShareInvitation {
  id: string
  email: string
  permission: 'VIEW' | 'EDIT' | 'COMMENT' | 'ADMIN'
  message?: string
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
  sentAt: string
  expiresAt: string
  acceptedAt?: string
}

interface FormComment {
  id: string
  userId: string
  user: User
  content: string
  sectionId?: string
  fieldId?: string
  createdAt: string
  updatedAt: string
  isResolved: boolean
  replies?: FormComment[]
}

interface MedicalFormSharingProps {
  formId: string
  formTitle: string
  currentUser: User
  initialPermissions?: SharePermission[]
  initialInvitations?: ShareInvitation[]
  initialComments?: FormComment[]
  onShare?: (permissions: SharePermission[], invitations: ShareInvitation[]) => void
  onComment?: (comment: FormComment) => void
  onUpdatePermission?: (permissionId: string, updates: Partial<SharePermission>) => void
  onRemovePermission?: (permissionId: string) => void
  onResendInvitation?: (invitationId: string) => void
  onCancelInvitation?: (invitationId: string) => void
}

export function MedicalFormSharing({
  formId,
  formTitle,
  currentUser,
  initialPermissions = [],
  initialInvitations = [],
  initialComments = [],
  onShare,
  onComment,
  onUpdatePermission,
  onRemovePermission,
  onResendInvitation,
  onCancelInvitation
}: MedicalFormSharingProps) {
  const [permissions, setPermissions] = useState<SharePermission[]>(initialPermissions)
  const [invitations, setInvitations] = useState<ShareInvitation[]>(initialInvitations)
  const [comments, setComments] = useState<FormComment[]>(initialComments)
  const [activeTab, setActiveTab] = useState<'permissions' | 'invitations' | 'comments'>('permissions')
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  
  // Share form state
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermission, setSharePermission] = useState<'VIEW' | 'EDIT' | 'COMMENT' | 'ADMIN'>('VIEW')
  const [shareMessage, setShareMessage] = useState('')
  const [shareExpiration, setShareExpiration] = useState<'1' | '7' | '30' | '90' | 'never'>('30')
  
  // Comment form state
  const [commentContent, setCommentContent] = useState('')
  const [commentSection, setCommentSection] = useState('')
  const [commentField, setCommentField] = useState('')

  // Mock users for demonstration
  const availableUsers: User[] = [
    { id: '1', name: 'Dr. María González', email: 'maria@therapycenter.com', role: 'THERAPIST', isOnline: true },
    { id: '2', name: 'Dr. Carlos Rodríguez', email: 'carlos@therapycenter.com', role: 'THERAPIST', isOnline: false },
    { id: '3', name: 'Ana Martínez', email: 'ana@therapycenter.com', role: 'COORDINATOR', isOnline: true },
    { id: '4', name: 'Luis Fernández', email: 'luis@therapycenter.com', role: 'THERAPIST', isOnline: true },
    { id: '5', name: 'Sofia López', email: 'sofia@therapycenter.com', role: 'THERAPIST', isOnline: false }
  ]

  // Get permission level color
  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'EDIT': return 'bg-blue-100 text-blue-800'
      case 'COMMENT': return 'bg-yellow-100 text-yellow-800'
      case 'VIEW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get permission icon
  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'ADMIN': return <Settings className="h-4 w-4" />
      case 'EDIT': return <Edit className="h-4 w-4" />
      case 'COMMENT': return <MessageSquare className="h-4 w-4" />
      case 'VIEW': return <Eye className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  // Handle share form submission
  const handleShare = () => {
    if (!shareEmail) return

    const newInvitation: ShareInvitation = {
      id: `invitation-${Date.now()}`,
      email: shareEmail,
      permission: sharePermission,
      message: shareMessage,
      status: 'PENDING',
      sentAt: new Date().toISOString(),
      expiresAt: shareExpiration === 'never' 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + parseInt(shareExpiration) * 24 * 60 * 60 * 1000).toISOString()
    }

    setInvitations(prev => [newInvitation, ...prev])
    
    if (onShare) {
      onShare(permissions, [newInvitation, ...invitations])
    }

    // Reset form
    setShareEmail('')
    setSharePermission('VIEW')
    setShareMessage('')
    setShareExpiration('30')
    setShowShareDialog(false)
  }

  // Handle comment submission
  const handleComment = () => {
    if (!commentContent) return

    const newComment: FormComment = {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      user: currentUser,
      content: commentContent,
      sectionId: commentSection || undefined,
      fieldId: commentField || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isResolved: false
    }

    setComments(prev => [newComment, ...prev])
    
    if (onComment) {
      onComment(newComment)
    }

    // Reset form
    setCommentContent('')
    setCommentSection('')
    setCommentField('')
    setShowCommentDialog(false)
  }

  // Update permission
  const handleUpdatePermission = (permissionId: string, updates: Partial<SharePermission>) => {
    setPermissions(prev => prev.map(p => 
      p.id === permissionId ? { ...p, ...updates } : p
    ))
    
    if (onUpdatePermission) {
      onUpdatePermission(permissionId, updates)
    }
  }

  // Remove permission
  const handleRemovePermission = (permissionId: string) => {
    setPermissions(prev => prev.filter(p => p.id !== permissionId))
    
    if (onRemovePermission) {
      onRemovePermission(permissionId)
    }
  }

  // Resend invitation
  const handleResendInvitation = (invitationId: string) => {
    if (onResendInvitation) {
      onResendInvitation(invitationId)
    }
  }

  // Cancel invitation
  const handleCancelInvitation = (invitationId: string) => {
    setInvitations(prev => prev.filter(i => i.id !== invitationId))
    
    if (onCancelInvitation) {
      onCancelInvitation(invitationId)
    }
  }

  // Copy share link
  const copyShareLink = () => {
    const shareLink = `${window.location.origin}/medical-forms/${formId}/shared`
    navigator.clipboard.writeText(shareLink)
    // You could show a toast notification here
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compartir Formulario</h2>
          <p className="text-muted-foreground">{formTitle}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={copyShareLink} variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Copiar Enlace
          </Button>
          <Button onClick={() => setShowShareDialog(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>
        </div>
      </div>

      {/* Share Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Compartido con
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.length}</div>
            <p className="text-xs text-muted-foreground">Usuarios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Invitaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations.filter(i => i.status === 'PENDING').length}</div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comentarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comments.length}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Resueltos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{comments.filter(c => c.isResolved).length}</div>
            <p className="text-xs text-muted-foreground">Comentarios</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="permissions">Permisos</TabsTrigger>
          <TabsTrigger value="invitations">Invitaciones</TabsTrigger>
          <TabsTrigger value="comments">Comentarios</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Usuarios con Acceso</CardTitle>
                <Button onClick={() => setShowShareDialog(true)} size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar Usuario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {permissions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay usuarios con acceso</p>
                  <Button onClick={() => setShowShareDialog(true)} className="mt-4">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartir Formulario
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage src={permission.user.avatar} />
                          <AvatarFallback>
                            {permission.user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{permission.user.name}</p>
                            {permission.user.isOnline && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{permission.user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Otorgado por {permission.grantedBy} • {new Date(permission.grantedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getPermissionColor(permission.permission)}>
                          {getPermissionIcon(permission.permission)}
                          <span className="ml-1">{permission.permission}</span>
                        </Badge>
                        
                        <Select
                          value={permission.permission}
                          onValueChange={(value: any) => handleUpdatePermission(permission.id, { permission: value })}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VIEW">Ver</SelectItem>
                            <SelectItem value="COMMENT">Comentar</SelectItem>
                            <SelectItem value="EDIT">Editar</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemovePermission(permission.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invitaciones Enviadas</CardTitle>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay invitaciones enviadas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Enviado: {new Date(invitation.sentAt).toLocaleDateString()}
                          </p>
                          {invitation.expiresAt && (
                            <p className="text-xs text-muted-foreground">
                              Expira: {new Date(invitation.expiresAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getPermissionColor(invitation.permission)}>
                          {getPermissionIcon(invitation.permission)}
                          <span className="ml-1">{invitation.permission}</span>
                        </Badge>
                        
                        <Badge variant={
                          invitation.status === 'PENDING' ? 'default' :
                          invitation.status === 'ACCEPTED' ? 'default' :
                          invitation.status === 'DECLINED' ? 'destructive' : 'secondary'
                        }>
                          {invitation.status === 'PENDING' ? 'Pendiente' :
                           invitation.status === 'ACCEPTED' ? 'Aceptada' :
                           invitation.status === 'DECLINED' ? 'Rechazada' : 'Expirada'}
                        </Badge>
                        
                        {invitation.status === 'PENDING' && (
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendInvitation(invitation.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelInvitation(invitation.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Comentarios y Colaboración</CardTitle>
                <Button onClick={() => setShowCommentDialog(true)} size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Agregar Comentario
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay comentarios</p>
                  <Button onClick={() => setShowCommentDialog(true)} className="mt-4">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Agregar Comentario
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className={`p-4 border rounded-lg ${comment.isResolved ? 'bg-green-50' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={comment.user.avatar} />
                            <AvatarFallback>
                              {comment.user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{comment.user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()} a las {new Date(comment.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {comment.isResolved ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resuelto
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <Clock className="h-4 w-4 mr-1" />
                              Pendiente
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm">{comment.content}</p>
                        {comment.sectionId && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Sección: {comment.sectionId}
                          </p>
                        )}
                        {comment.fieldId && (
                          <p className="text-xs text-muted-foreground">
                            Campo: {comment.fieldId}
                          </p>
                        )}
                      </div>
                      
                      {!comment.isResolved && (
                        <div className="mt-3 flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setComments(prev => prev.map(c => 
                                c.id === comment.id ? { ...c, isResolved: true } : c
                              ))
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como Resuelto
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Compartir Formulario</CardTitle>
              <CardDescription>
                Invita a otros usuarios a colaborar en este formulario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="share-email">Email del Usuario</Label>
                <Input
                  id="share-email"
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="share-permission">Permisos</Label>
                <Select value={sharePermission} onValueChange={(value: any) => setSharePermission(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIEW">Ver - Solo lectura</SelectItem>
                    <SelectItem value="COMMENT">Comentar - Ver y comentar</SelectItem>
                    <SelectItem value="EDIT">Editar - Ver, comentar y editar</SelectItem>
                    <SelectItem value="ADMIN">Admin - Control total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="share-message">Mensaje (Opcional)</Label>
                <Textarea
                  id="share-message"
                  placeholder="Mensaje personalizado..."
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="share-expiration">Expiración</Label>
                <Select value={shareExpiration} onValueChange={(value: any) => setShareExpiration(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 día</SelectItem>
                    <SelectItem value="7">7 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="90">90 días</SelectItem>
                    <SelectItem value="never">Nunca</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowShareDialog(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleShare} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Invitación
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Comment Dialog */}
      {showCommentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Agregar Comentario</CardTitle>
              <CardDescription>
                Agrega un comentario o pregunta sobre el formulario
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="comment-content">Comentario</Label>
                <Textarea
                  id="comment-content"
                  placeholder="Escribe tu comentario..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="comment-section">Sección (Opcional)</Label>
                <Input
                  id="comment-section"
                  placeholder="Nombre de la sección"
                  value={commentSection}
                  onChange={(e) => setCommentSection(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="comment-field">Campo (Opcional)</Label>
                <Input
                  id="comment-field"
                  placeholder="Nombre del campo"
                  value={commentField}
                  onChange={(e) => setCommentField(e.target.value)}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowCommentDialog(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleComment} className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Agregar Comentario
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
