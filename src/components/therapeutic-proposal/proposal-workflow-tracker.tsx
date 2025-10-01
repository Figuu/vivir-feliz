'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Workflow, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Play, 
  Pause, 
  RotateCcw,
  MessageSquare,
  Bell,
  Users,
  User,
  Calendar,
  FileText,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  UserCheck,
  Crown,
  Settings,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Zap,
  AlertTriangle,
  Info,
  Check,
  X,
  Plus,
  Minus,
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
  FileArchive,
  FileMinus,
  FilePlus,
  FileSymlink,
  FileType,
  FileUp,
  FileDown,
  FileClock,
  FileHeart,
  FileWarning,
  FileQuestion,
  FileLock,
  FileKey,
  FileUser,
  FileCog,
} from 'lucide-react'
import { 
  ProposalWorkflowManager,
  type Proposal,
  type User as WorkflowUser,
  type WorkflowStep,
  type WorkflowTransition,
  type WorkflowEvent,
  type WorkflowComment,
  type WorkflowMetrics
} from '@/lib/proposal-workflow-manager'

interface ProposalWorkflowTrackerProps {
  proposal: Proposal
  currentUser: WorkflowUser
  onStatusChange?: (proposal: Proposal) => void
  onCommentAdded?: (comment: WorkflowComment) => void
  className?: string
}

export function ProposalWorkflowTracker({
  proposal,
  currentUser,
  onStatusChange,
  onCommentAdded,
  className
}: ProposalWorkflowTrackerProps) {
  const [workflowManager] = useState(() => new ProposalWorkflowManager())
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [currentStep, setCurrentStep] = useState<WorkflowStep | null>(null)
  const [nextStep, setNextStep] = useState<WorkflowStep | null>(null)
  const [availableTransitions, setAvailableTransitions] = useState<WorkflowTransition[]>([])
  const [workflowEvents, setWorkflowEvents] = useState<WorkflowEvent[]>([])
  const [workflowComments, setWorkflowComments] = useState<WorkflowComment[]>([])
  const [workflowMetrics, setWorkflowMetrics] = useState<WorkflowMetrics | null>(null)
  const [selectedTransition, setSelectedTransition] = useState<string>('')
  const [transitionNotes, setTransitionNotes] = useState('')
  const [newComment, setNewComment] = useState('')
  const [isInternalComment, setIsInternalComment] = useState(false)
  const [activeTab, setActiveTab] = useState<'timeline' | 'comments' | 'metrics'>('timeline')
  const [isExecutingTransition, setIsExecutingTransition] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load workflow data
  useEffect(() => {
    loadWorkflowData()
  }, [proposal, currentUser])

  const loadWorkflowData = async () => {
    try {
      const steps = workflowManager.getWorkflowSteps(proposal)
      const current = workflowManager.getCurrentStep(proposal)
      const next = workflowManager.getNextStep(proposal)
      const transitions = workflowManager.getAvailableTransitions(proposal, currentUser)
      const events = workflowManager.getProposalEvents(proposal.id)
      const comments = workflowManager.getStepComments(proposal.id, current?.id || '')
      const metrics = workflowManager.getWorkflowMetrics()

      setWorkflowSteps(steps)
      setCurrentStep(current)
      setNextStep(next)
      setAvailableTransitions(transitions)
      setWorkflowEvents(events)
      setWorkflowComments(comments)
      setWorkflowMetrics(metrics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading workflow data')
    }
  }

  // Handle transition execution
  const handleExecuteTransition = async () => {
    if (!selectedTransition) return

    setIsExecutingTransition(true)
    setError(null)

    try {
      const result = await workflowManager.executeTransition(
        proposal,
        currentUser,
        selectedTransition,
        transitionNotes
      )

      if (result.success && result.updatedProposal) {
        if (onStatusChange) {
          onStatusChange(result.updatedProposal)
        }
        setSelectedTransition('')
        setTransitionNotes('')
        await loadWorkflowData()
      } else {
        setError(result.error || 'Failed to execute transition')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error executing transition')
    } finally {
      setIsExecutingTransition(false)
    }
  }

  // Handle comment addition
  const handleAddComment = () => {
    if (!newComment.trim() || !currentStep) return

    const comment = workflowManager.addComment(
      proposal.id,
      currentStep.id,
      currentUser,
      newComment,
      isInternalComment
    )

    setWorkflowComments(prev => [...prev, comment])
    setNewComment('')
    setIsInternalComment(false)

    if (onCommentAdded) {
      onCommentAdded(comment)
    }
  }

  // Get step status icon
  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-600" />
      case 'PENDING':
        return <Clock className="h-5 w-5 text-gray-400" />
      case 'SKIPPED':
        return <XCircle className="h-5 w-5 text-yellow-600" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  // Get step status color
  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'PENDING':
        return 'bg-gray-100 text-gray-800'
      case 'SKIPPED':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get event type icon
  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'STATUS_CHANGE':
        return <ArrowRight className="h-4 w-4" />
      case 'ASSIGNMENT':
        return <Users className="h-4 w-4" />
      case 'COMMENT':
        return <MessageSquare className="h-4 w-4" />
      case 'APPROVAL':
        return <CheckCircle className="h-4 w-4" />
      case 'REJECTION':
        return <XCircle className="h-4 w-4" />
      case 'ESCALATION':
        return <AlertTriangle className="h-4 w-4" />
      case 'DEADLINE':
        return <Calendar className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  // Get event type color
  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'STATUS_CHANGE':
        return 'bg-blue-100 text-blue-800'
      case 'ASSIGNMENT':
        return 'bg-purple-100 text-purple-800'
      case 'COMMENT':
        return 'bg-gray-100 text-gray-800'
      case 'APPROVAL':
        return 'bg-green-100 text-green-800'
      case 'REJECTION':
        return 'bg-red-100 text-red-800'
      case 'ESCALATION':
        return 'bg-orange-100 text-orange-800'
      case 'DEADLINE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get user role icon
  const getUserRoleIcon = (role: string) => {
    switch (role) {
      case 'THERAPIST':
        return <User className="h-4 w-4" />
      case 'COORDINATOR':
        return <UserCheck className="h-4 w-4" />
      case 'ADMIN':
        return <Crown className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  // Get user role color
  const getUserRoleColor = (role: string) => {
    switch (role) {
      case 'THERAPIST':
        return 'bg-blue-100 text-blue-800'
      case 'COORDINATOR':
        return 'bg-green-100 text-green-800'
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Workflow className="h-5 w-5 mr-2" />
                Seguimiento de Flujo de Trabajo
              </CardTitle>
              <CardDescription>
                Monitoreo del progreso de la propuesta a través del flujo de trabajo
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStepStatusColor(currentStep?.status || 'PENDING')}>
                {getStepStatusIcon(currentStep?.status || 'PENDING')}
                <span className="ml-1">{currentStep?.name || 'Desconocido'}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Estado Actual</Label>
              <p className="text-lg font-bold">{proposal.status}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Paso Actual</Label>
              <p className="text-lg font-bold">{currentStep?.name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Siguiente Paso</Label>
              <p className="text-lg font-bold">{nextStep?.name || 'N/A'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Progreso</Label>
              <p className="text-lg font-bold">
                {workflowSteps.filter(s => s.status === 'COMPLETED').length} / {workflowSteps.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Línea de Tiempo</TabsTrigger>
          <TabsTrigger value="comments">Comentarios</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          {/* Workflow Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Pasos del Flujo de Trabajo</CardTitle>
              <CardDescription>
                Progreso actual a través de los pasos del flujo de trabajo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowSteps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getStepStatusIcon(step.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{step.name}</h3>
                        <Badge className={getStepStatusColor(step.status)}>
                          {step.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {step.description}
                      </p>
                      {step.assignedToName && (
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-sm font-medium">Asignado a:</span>
                          <Badge className={getUserRoleColor(step.assignedToName)}>
                            {step.assignedToName}
                          </Badge>
                        </div>
                      )}
                      {step.dueDate && (
                        <div className="flex items-center space-x-2 mt-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Vence: {new Date(step.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {index < workflowSteps.length - 1 && (
                      <div className="flex-shrink-0 ml-4">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Transitions */}
          {availableTransitions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Acciones Disponibles</CardTitle>
                <CardDescription>
                  Transiciones disponibles para el estado actual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="transition-select">Seleccionar Acción</Label>
                  <Select
                    value={selectedTransition}
                    onValueChange={setSelectedTransition}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una acción..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTransitions.map((transition) => (
                        <SelectItem key={transition.id} value={transition.id}>
                          {transition.toStatus} - {transition.trigger}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTransition && (
                  <div>
                    <Label htmlFor="transition-notes">Notas (Opcional)</Label>
                    <Textarea
                      id="transition-notes"
                      value={transitionNotes}
                      onChange={(e) => setTransitionNotes(e.target.value)}
                      placeholder="Agrega notas sobre esta acción..."
                      rows={3}
                    />
                  </div>
                )}

                <Button
                  onClick={handleExecuteTransition}
                  disabled={!selectedTransition || isExecutingTransition}
                  className="w-full"
                >
                  {isExecutingTransition ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Ejecutando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Ejecutar Acción
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Workflow Events */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Eventos</CardTitle>
              <CardDescription>
                Registro de todos los eventos del flujo de trabajo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowEvents.map((event) => (
                  <div key={event.id} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getEventTypeIcon(event.eventType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{event.description}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge className={getEventTypeColor(event.eventType)}>
                              {event.eventType}
                            </Badge>
                            <Badge className={getUserRoleColor(event.userRole)}>
                              {getUserRoleIcon(event.userRole)}
                              <span className="ml-1">{event.userName}</span>
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                        {event.details && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(event.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {/* Add Comment */}
          <Card>
            <CardHeader>
              <CardTitle>Agregar Comentario</CardTitle>
              <CardDescription>
                Agrega comentarios al paso actual del flujo de trabajo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new-comment">Comentario</Label>
                <Textarea
                  id="new-comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe tu comentario aquí..."
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="internal-comment"
                  checked={isInternalComment}
                  onChange={(e) => setIsInternalComment(e.target.checked)}
                />
                <Label htmlFor="internal-comment">Comentario interno</Label>
              </div>

              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="w-full"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Agregar Comentario
              </Button>
            </CardContent>
          </Card>

          {/* Comments List */}
          <Card>
            <CardHeader>
              <CardTitle>Comentarios del Flujo de Trabajo</CardTitle>
              <CardDescription>
                Comentarios agregados a los pasos del flujo de trabajo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowComments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getUserRoleIcon(comment.userRole)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{comment.userName}</h4>
                            <Badge className={getUserRoleColor(comment.userRole)}>
                              {comment.userRole}
                            </Badge>
                            {comment.isInternal && (
                              <Badge variant="outline">Interno</Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm mt-2">{comment.content}</p>
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-2">
                            <span className="text-sm font-medium">Adjuntos:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {comment.attachments.map((attachment, index) => (
                                <Badge key={index} variant="outline">
                                  {attachment}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {/* Workflow Metrics */}
          {workflowMetrics && (
            <Card>
              <CardHeader>
                <CardTitle>Métricas del Flujo de Trabajo</CardTitle>
                <CardDescription>
                  Estadísticas y métricas del flujo de trabajo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Total Propuestas</Label>
                    <p className="text-2xl font-bold">{workflowMetrics.totalProposals}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Tasa de Finalización</Label>
                    <p className="text-2xl font-bold">{workflowMetrics.completionRate}%</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Tiempo Promedio</Label>
                    <p className="text-2xl font-bold">{workflowMetrics.averageProcessingTime}h</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Propuestas Atrasadas</Label>
                    <p className="text-2xl font-bold text-red-600">{workflowMetrics.overdueProposals}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-3">Propuestas por Estado</h3>
                  <div className="space-y-2">
                    {Object.entries(workflowMetrics.proposalsByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <span className="text-sm">{status}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-3">Rendimiento de Usuarios</h3>
                  <div className="space-y-3">
                    {workflowMetrics.userPerformance.map((user) => (
                      <div key={user.userId} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{user.userName}</h4>
                            <p className="text-sm text-muted-foreground">{user.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{user.proposalsProcessed} propuestas</p>
                            <p className="text-sm text-muted-foreground">
                              {user.completionRate}% finalización
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
