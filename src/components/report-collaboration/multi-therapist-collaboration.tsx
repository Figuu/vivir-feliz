'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Edit,
  Eye,
  Plus,
  Minus,
  Save,
  X,
  Clock,
  User,
  Calendar,
  Flag,
  Bell,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Search,
  Filter,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Maximize,
  Minimize,
  ExternalLink,
  Link,
  Share,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  Percent,
  Home,
  Menu,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckSquare,
  Crown,
  Trophy,
  Medal,
  Award,
  Activity,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Star,
  Heart,
  Flame,
  Sparkles,
  Globe,
  Building,
  Key,
  Lock,
  Unlock,
  Database,
  Server,
  Code,
  Timer,
  Zap,
  Brain,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle as XCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  Info as InfoIcon,
  Lightbulb,
  BookmarkCheck,
  ClipboardCheck,
  FileCheck,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  BarChart,
  PieChart,
  LineChart,
  Activity as ActivityIcon,
  Type,
  Hash as HashIcon,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckSquare as CheckSquareIcon,
  Circle,
  Upload as UploadIcon,
  PenTool,
  FileText,
  Send,
  Reply,
  Quote,
  Pin,
  Archive,
  Trash2,
  Copy,
  Move,
  GripVertical
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface MultiTherapistCollaborationProps {
  collaborationId?: string
  reportId?: string
  reportType?: string
  onCollaborationUpdated?: (collaboration: any) => void
}

interface CollaborationData {
  id: string
  reportId: string
  reportType: string
  title: string
  description: string
  status: 'draft' | 'in_progress' | 'under_review' | 'approved' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  settings: any
  participants: Array<{
    id: string
    therapistId: string
    role: 'owner' | 'editor' | 'reviewer' | 'viewer'
    permissions: {
      canEdit: boolean
      canReview: boolean
      canComment: boolean
      canApprove: boolean
      canInvite: boolean
    }
    therapist: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }>
  stats: {
    totalComments: number
    totalApprovals: number
    totalVersions: number
  }
}

interface Comment {
  id: string
  content: string
  type: 'comment' | 'suggestion' | 'question' | 'approval' | 'rejection'
  reference?: {
    section?: string
    field?: string
    lineNumber?: number
    text?: string
  }
  isPrivate: boolean
  createdBy: string
  createdByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
}

export function MultiTherapistCollaboration({
  collaborationId,
  reportId,
  reportType,
  onCollaborationUpdated
}: MultiTherapistCollaborationProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Data state
  const [collaboration, setCollaboration] = useState<CollaborationData | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [therapists, setTherapists] = useState<any[]>([])
  
  // New comment form
  const [newComment, setNewComment] = useState({
    content: '',
    type: 'comment' as 'comment' | 'suggestion' | 'question' | 'approval' | 'rejection',
    isPrivate: false,
    reference: {
      section: '',
      field: '',
      text: ''
    }
  })

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (collaborationId) {
      loadCollaboration()
      loadComments()
    }
  }, [collaborationId])

  const loadInitialData = async () => {
    try {
      // Load therapists
      const therapistsResponse = await fetch('/api/therapist?limit=100')
      const therapistsResult = await therapistsResponse.json()
      if (therapistsResponse.ok) {
        setTherapists(therapistsResult.data.therapists || [])
      }
    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const loadCollaboration = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/report-collaboration/${collaborationId}`)
      const result = await response.json()

      if (response.ok) {
        setCollaboration(result.data)
      } else {
        setError(result.error || 'Failed to load collaboration')
      }
    } catch (err) {
      setError('Failed to load collaboration')
      console.error('Error loading collaboration:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/report-collaboration?action=comments&collaborationId=${collaborationId}`)
      const result = await response.json()

      if (response.ok) {
        setComments(result.data || [])
      } else {
        console.error('Failed to load comments:', result.error)
      }
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.content.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please enter a comment'
      })
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/report-collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'comment',
          collaborationId,
          content: newComment.content,
          type: newComment.type,
          isPrivate: newComment.isPrivate,
          reference: newComment.reference,
          createdBy: 'user-1' // This should come from auth context
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add comment')
      }

      toast({
        title: "Success",
        description: 'Comment added successfully'
      })
      
      // Reset form
      setNewComment({
        content: '',
        type: 'comment',
        isPrivate: false,
        reference: {
          section: '',
          field: '',
          text: ''
        }
      })

      // Reload comments
      loadComments()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add comment'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error adding comment:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-purple-100 text-purple-800'
      case 'archived': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCommentTypeIcon = (type: string) => {
    switch (type) {
      case 'comment': return <MessageSquare className="h-4 w-4" />
      case 'suggestion': return <Lightbulb className="h-4 w-4" />
      case 'question': return <MessageSquare className="h-4 w-4" />
      case 'approval': return <CheckCircle className="h-4 w-4" />
      case 'rejection': return <XCircle className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Multi-Therapist Collaboration
              </CardTitle>
              <CardDescription>
                Collaborate on reports with multiple therapists and maintain validation consistency
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={loadCollaboration}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {collaboration ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getStatusColor(collaboration.status)}>
                    {collaboration.status.replace('_', ' ')}
                  </Badge>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className={getPriorityColor(collaboration.priority)}>
                    {collaboration.priority}
                  </Badge>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Due Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {collaboration.dueDate 
                      ? new Date(collaboration.dueDate).toLocaleDateString()
                      : 'No due date'
                    }
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Collaboration Found</h3>
                <p className="text-muted-foreground">
                  Select a collaboration to view details.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Collaboration Participants</CardTitle>
              <CardDescription>
                Manage therapists participating in this collaboration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {collaboration?.participants ? (
                <div className="space-y-4">
                  {collaboration.participants.map((participant) => (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">
                              {participant.therapist.firstName} {participant.therapist.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {participant.therapist.email}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {participant.role}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                        <div className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={participant.permissions.canEdit}
                            disabled
                            className="rounded"
                          />
                          <span>Edit</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={participant.permissions.canReview}
                            disabled
                            className="rounded"
                          />
                          <span>Review</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={participant.permissions.canComment}
                            disabled
                            className="rounded"
                          />
                          <span>Comment</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={participant.permissions.canApprove}
                            disabled
                            className="rounded"
                          />
                          <span>Approve</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={participant.permissions.canInvite}
                            disabled
                            className="rounded"
                          />
                          <span>Invite</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Participants</h3>
                  <p className="text-muted-foreground">
                    No participants found for this collaboration.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Comments List */}
            <Card>
              <CardHeader>
                <CardTitle>Comments & Feedback</CardTitle>
                <CardDescription>
                  View and manage collaboration comments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Comments</h3>
                    <p className="text-muted-foreground">
                      No comments have been added to this collaboration yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getCommentTypeIcon(comment.type)}
                            <span className="font-medium">{comment.type}</span>
                            {comment.isPrivate && (
                              <Badge variant="outline">Private</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-sm font-medium">
                            {comment.createdByUser.firstName} {comment.createdByUser.lastName}
                          </span>
                        </div>
                        
                        <div className="text-sm">
                          {comment.content}
                        </div>
                        
                        {comment.reference && (
                          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            <strong>Reference:</strong> {comment.reference.section && `Section: ${comment.reference.section}`}
                            {comment.reference.field && `, Field: ${comment.reference.field}`}
                            {comment.reference.text && `, Text: ${comment.reference.text}`}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Comment */}
            <Card>
              <CardHeader>
                <CardTitle>Add Comment</CardTitle>
                <CardDescription>
                  Add a comment or feedback to the collaboration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Comment Type</Label>
                  <Select value={newComment.type} onValueChange={(value: any) => setNewComment(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comment">Comment</SelectItem>
                      <SelectItem value="suggestion">Suggestion</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="approval">Approval</SelectItem>
                      <SelectItem value="rejection">Rejection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Comment *</Label>
                  <Textarea
                    value={newComment.content}
                    onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your comment or feedback"
                    rows={4}
                    maxLength={2000}
                  />
                  <div className="text-sm text-muted-foreground mt-1">
                    {newComment.content.length}/2000 characters
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Section Reference</Label>
                    <Input
                      value={newComment.reference.section}
                      onChange={(e) => setNewComment(prev => ({
                        ...prev,
                        reference: { ...prev.reference, section: e.target.value }
                      }))}
                      placeholder="Section name"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label>Field Reference</Label>
                    <Input
                      value={newComment.reference.field}
                      onChange={(e) => setNewComment(prev => ({
                        ...prev,
                        reference: { ...prev.reference, field: e.target.value }
                      }))}
                      placeholder="Field name"
                      maxLength={100}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Text Reference</Label>
                  <Input
                    value={newComment.reference.text}
                    onChange={(e) => setNewComment(prev => ({
                      ...prev,
                      reference: { ...prev.reference, text: e.target.value }
                    }))}
                    placeholder="Referenced text"
                    maxLength={500}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={newComment.isPrivate}
                    onChange={(e) => setNewComment(prev => ({ ...prev, isPrivate: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="isPrivate">Private comment (only visible to participants)</Label>
                </div>
                
                <Button onClick={handleAddComment} disabled={loading} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Adding...' : 'Add Comment'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Validation Consistency</CardTitle>
              <CardDescription>
                Monitor and maintain validation consistency across all therapists
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Validation System</h3>
                <p className="text-muted-foreground">
                  Validation consistency features will be implemented here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
