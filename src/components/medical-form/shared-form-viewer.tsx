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
  Eye, 
  Edit, 
  MessageSquare, 
  Download, 
  Share2, 
  Lock, 
  Unlock,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  FileText,
  Bell,
  Send,
  ThumbsUp,
  AlertCircle,
  ThumbsDown
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'THERAPIST' | 'COORDINATOR' | 'ADMIN'
  avatar?: string
}

interface FormPermission {
  permission: 'VIEW' | 'EDIT' | 'COMMENT' | 'ADMIN'
  grantedBy: string
  grantedAt: string
  expiresAt?: string
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
  reactions?: {
    thumbsUp: number
    thumbsDown: number
  }
}

interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  order: number
  required: boolean
}

interface FormField {
  id: string
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number' | 'email' | 'phone'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  value?: any
  helpText?: string
  order: number
}

interface SharedFormViewerProps {
  formId: string
  formTitle: string
  formData: any
  sections: FormSection[]
  currentUser: User
  permission: FormPermission
  comments: FormComment[]
  onSave?: (formData: any) => void
  onComment?: (comment: FormComment) => void
  onReply?: (commentId: string, reply: FormComment) => void
  onReact?: (commentId: string, reaction: 'thumbsUp' | 'thumbsDown') => void
  onResolveComment?: (commentId: string) => void
  onExport?: () => void
}

export function SharedFormViewer({
  formId,
  formTitle,
  formData,
  sections,
  currentUser,
  permission,
  comments,
  onSave,
  onComment,
  onReply,
  onReact,
  onResolveComment,
  onExport
}: SharedFormViewerProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'comments' | 'activity'>('form')
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [commentSection, setCommentSection] = useState('')
  const [commentField, setCommentField] = useState('')
  const [localFormData, setLocalFormData] = useState(formData)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Check if user can edit
  const canEdit = permission.permission === 'EDIT' || permission.permission === 'ADMIN'
  const canComment = permission.permission === 'COMMENT' || permission.permission === 'EDIT' || permission.permission === 'ADMIN'
  const canAdmin = permission.permission === 'ADMIN'

  // Handle form field changes
  const handleFieldChange = (sectionId: string, fieldId: string, value: any) => {
    if (!canEdit) return

    setLocalFormData((prev: any) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [fieldId]: value
      }
    }))
    setHasUnsavedChanges(true)
  }

  // Save form
  const handleSave = () => {
    if (onSave) {
      onSave(localFormData)
    }
    setHasUnsavedChanges(false)
  }

  // Handle comment submission
  const handleComment = () => {
    if (!commentContent || !canComment) return

    const newComment: FormComment = {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      user: currentUser,
      content: commentContent,
      sectionId: commentSection || undefined,
      fieldId: commentField || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isResolved: false,
      reactions: { thumbsUp: 0, thumbsDown: 0 }
    }

    if (onComment) {
      onComment(newComment)
    }

    // Reset form
    setCommentContent('')
    setCommentSection('')
    setCommentField('')
    setShowCommentDialog(false)
  }

  // Get permission badge
  const getPermissionBadge = () => {
    const colors = {
      VIEW: 'bg-green-100 text-green-800',
      COMMENT: 'bg-yellow-100 text-yellow-800',
      EDIT: 'bg-blue-100 text-blue-800',
      ADMIN: 'bg-red-100 text-red-800'
    }

    const icons = {
      VIEW: <Eye className="h-4 w-4" />,
      COMMENT: <MessageSquare className="h-4 w-4" />,
      EDIT: <Edit className="h-4 w-4" />,
      ADMIN: <User className="h-4 w-4" />
    }

    return (
      <Badge className={colors[permission.permission]}>
        {icons[permission.permission]}
        <span className="ml-1">{permission.permission}</span>
      </Badge>
    )
  }

  // Render form field
  const renderField = (section: FormSection, field: FormField) => {
    const fieldValue = localFormData[section.id]?.[field.id] || field.value || ''

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={fieldValue}
            onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={!canEdit}
          />
        )
      
      case 'textarea':
        return (
          <Textarea
            value={fieldValue}
            onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={!canEdit}
          />
        )
      
      case 'select':
        return (
          <Select
            value={fieldValue}
            onValueChange={(value) => handleFieldChange(section.id, field.id, value)}
            disabled={!canEdit}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'date':
        return (
          <Input
            type="date"
            value={fieldValue}
            onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
            disabled={!canEdit}
          />
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={fieldValue}
            onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={!canEdit}
          />
        )
      
      case 'email':
        return (
          <Input
            type="email"
            value={fieldValue}
            onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={!canEdit}
          />
        )
      
      case 'phone':
        return (
          <Input
            type="tel"
            value={fieldValue}
            onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={!canEdit}
          />
        )
      
      default:
        return (
          <Input
            value={fieldValue}
            onChange={(e) => handleFieldChange(section.id, field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={!canEdit}
          />
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{formTitle}</h1>
          <p className="text-muted-foreground">Formulario compartido</p>
        </div>
        <div className="flex items-center space-x-2">
          {getPermissionBadge()}
          {onExport && (
            <Button onClick={onExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Permission Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Acceso compartido:</strong> Tienes permisos de {permission.permission.toLowerCase()} en este formulario. 
          Otorgado por {permission.grantedBy} el {new Date(permission.grantedAt).toLocaleDateString()}.
          {permission.expiresAt && (
            <span> Expira el {new Date(permission.expiresAt).toLocaleDateString()}.</span>
          )}
        </AlertDescription>
      </Alert>

      {/* Unsaved Changes Alert */}
      {hasUnsavedChanges && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tienes cambios sin guardar. 
            <Button onClick={handleSave} size="sm" className="ml-2">
              Guardar Cambios
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'form' | 'comments' | 'activity')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="form">Formulario</TabsTrigger>
          <TabsTrigger value="comments">Comentarios</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <div className="space-y-6">
            {sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{section.title}</span>
                    {section.required && (
                      <Badge variant="outline">Requerido</Badge>
                    )}
                  </CardTitle>
                  {section.description && (
                    <CardDescription>{section.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {section.fields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <Label className="flex items-center">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        {renderField(section, field)}
                        {field.helpText && (
                          <p className="text-xs text-muted-foreground">{field.helpText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Save Button */}
          {canEdit && hasUnsavedChanges && (
            <div className="flex justify-end">
              <Button onClick={handleSave}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Comentarios y Colaboración</CardTitle>
                {canComment && (
                  <Button onClick={() => setShowCommentDialog(true)} size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Agregar Comentario
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay comentarios</p>
                  {canComment && (
                    <Button onClick={() => setShowCommentDialog(true)} className="mt-4">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Agregar Comentario
                    </Button>
                  )}
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
                      
                      {/* Reactions */}
                      {comment.reactions && (
                        <div className="mt-3 flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReact?.(comment.id, 'thumbsUp')}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {comment.reactions.thumbsUp}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReact?.(comment.id, 'thumbsDown')}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            {comment.reactions.thumbsDown}
                          </Button>
                        </div>
                      )}
                      
                      {/* Actions */}
                      {!comment.isResolved && canComment && (
                        <div className="mt-3 flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onResolveComment?.(comment.id)}
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

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Formulario compartido</p>
                    <p className="text-xs text-muted-foreground">
                      {permission.grantedBy} te otorgó acceso el {new Date(permission.grantedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Formulario creado</p>
                    <p className="text-xs text-muted-foreground">
                      Formulario creado el {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
