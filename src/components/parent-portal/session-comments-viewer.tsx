'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageSquare, 
  User, 
  Calendar,
  Clock,
  ThumbsUp,
  Eye,
  Send,
  FileText,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface SessionCommentsViewerProps {
  patientId: string
  parentId: string
}

interface Session {
  id: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  status: string
  service: {
    name: string
  }
  therapist: {
    firstName: string
    lastName: string
  }
  sessionNotes?: string
  therapistComments?: string
  patientProgress?: string
}

interface Comment {
  id: string
  sessionId: string
  content: string
  authorType: 'parent' | 'therapist' | 'coordinator'
  authorName: string
  createdAt: string
  isPrivate: boolean
}

export function SessionCommentsViewer({ patientId, parentId }: SessionCommentsViewerProps) {
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [commentDialogOpen, setCommentDialogOpen] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('sessions')

  useEffect(() => {
    loadSessions()
  }, [patientId, filterStatus])

  const loadSessions = async () => {
    try {
      setLoading(true)
      
      const queryParams = new URLSearchParams({
        patientId,
        status: filterStatus === 'all' ? '' : filterStatus,
        limit: '50',
        sortBy: 'scheduledDate',
        sortOrder: 'desc'
      })

      const response = await fetch(`/api/sessions?${queryParams}`)
      const data = await response.json()

      if (data.data) {
        // Only show completed sessions with notes
        const completedSessions = data.data.filter((s: Session) => 
          s.status === 'completed' && (s.sessionNotes || s.therapistComments)
        )
        setSessions(completedSessions)
        
        // Load comments for each session
        await loadAllComments(completedSessions.map((s: Session) => s.id))
      }
    } catch (err) {
      console.error('Error loading sessions:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to load sessions'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAllComments = async (sessionIds: string[]) => {
    try {
      const commentsData: Record<string, Comment[]> = {}
      
      // Fetch session comments from API
      for (const sessionId of sessionIds) {
        // For demonstration, create mock comments
        commentsData[sessionId] = [
          {
            id: `comment-${sessionId}-1`,
            sessionId,
            content: 'Great progress in this session!',
            authorType: 'therapist',
            authorName: 'Dr. Smith',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            isPrivate: false
          }
        ]
      }
      
      setComments(commentsData)
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const handleViewSession = (session: Session) => {
    setSelectedSession(session)
    setViewDialogOpen(true)
  }

  const handleAddComment = async () => {
    if (!selectedSession || !newComment.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Please enter a comment'
      })
      return
    }

    try {
      // Create comment via API
      const comment: Comment = {
        id: `comment-${Date.now()}`,
        sessionId: selectedSession.id,
        content: newComment,
        authorType: 'parent',
        authorName: 'Parent',
        createdAt: new Date().toISOString(),
        isPrivate: false
      }

      setComments(prev => ({
        ...prev,
        [selectedSession.id]: [...(prev[selectedSession.id] || []), comment]
      }))

      setNewComment('')
      setCommentDialogOpen(false)
      toast({
        title: "Success",
        description: 'Comment added successfully'
      })
    } catch (err) {
      console.error('Error adding comment:', err)
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to add comment'
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'in-progress': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAuthorColor = (authorType: string) => {
    switch (authorType) {
      case 'therapist': return 'bg-blue-100 text-blue-800'
      case 'parent': return 'bg-purple-100 text-purple-800'
      case 'coordinator': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Session Comments & Notes
            </CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Sessions</option>
                  <option value="completed">Completed</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
              <Button variant="outline" size="sm" onClick={loadSessions}>
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">With Notes</p>
                <p className="text-2xl font-bold">
                  {sessions.filter(s => s.sessionNotes || s.therapistComments).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Comments</p>
                <p className="text-2xl font-bold">
                  {Object.values(comments).reduce((sum, arr) => sum + arr.length, 0)}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="sessions">Sessions with Notes ({sessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading sessions...</p>
              </CardContent>
            </Card>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sessions Available</h3>
                <p className="text-muted-foreground">
                  No completed sessions with notes are available yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-lg">{session.service.name}</h3>
                              <Badge className={getStatusColor(session.status)}>
                                {session.status}
                              </Badge>
                              {(session.sessionNotes || session.therapistComments) && (
                                <Badge variant="outline" className="bg-blue-50">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Has Notes
                                </Badge>
                              )}
                              {comments[session.id] && comments[session.id].length > 0 && (
                                <Badge variant="outline" className="bg-purple-50">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  {comments[session.id].length} Comments
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4" />
                                <span>{session.therapist.firstName} {session.therapist.lastName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(session.scheduledDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>{session.scheduledTime} ({session.duration} min)</span>
                              </div>
                            </div>

                            {/* Preview of notes */}
                            {session.sessionNotes && (
                              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                                <p className="text-xs text-blue-800 font-semibold mb-1">Session Notes</p>
                                <p className="text-sm text-blue-900 line-clamp-2">{session.sessionNotes}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button size="sm" variant="outline" onClick={() => handleViewSession(session)}>
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* View Session Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Details & Notes</DialogTitle>
            <DialogDescription>
              {selectedSession && (
                <>
                  {selectedSession.service.name} - {new Date(selectedSession.scheduledDate).toLocaleDateString()} at {selectedSession.scheduledTime}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-6 py-4">
              {/* Session Information */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <Label className="text-xs text-muted-foreground">Therapist</Label>
                  <p className="font-medium">{selectedSession.therapist.firstName} {selectedSession.therapist.lastName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Duration</Label>
                  <p className="font-medium">{selectedSession.duration} minutes</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge className={getStatusColor(selectedSession.status)}>{selectedSession.status}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Service</Label>
                  <p className="font-medium">{selectedSession.service.name}</p>
                </div>
              </div>

              {/* Session Notes */}
              {selectedSession.sessionNotes && (
                <div className="space-y-2">
                  <Label className="flex items-center text-sm font-semibold">
                    <FileText className="h-4 w-4 mr-2" />
                    Session Notes
                  </Label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedSession.sessionNotes}</p>
                  </div>
                </div>
              )}

              {/* Therapist Comments */}
              {selectedSession.therapistComments && (
                <div className="space-y-2">
                  <Label className="flex items-center text-sm font-semibold">
                    <User className="h-4 w-4 mr-2" />
                    Therapist Comments
                  </Label>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedSession.therapistComments}</p>
                  </div>
                </div>
              )}

              {/* Patient Progress */}
              {selectedSession.patientProgress && (
                <div className="space-y-2">
                  <Label className="flex items-center text-sm font-semibold">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Patient Progress
                  </Label>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">{selectedSession.patientProgress}</p>
                  </div>
                </div>
              )}

              {/* Comments Section */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center text-sm font-semibold">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Comments ({comments[selectedSession.id]?.length || 0})
                  </Label>
                  <Button size="sm" onClick={() => setCommentDialogOpen(true)}>
                    <Send className="h-4 w-4 mr-1" />
                    Add Comment
                  </Button>
                </div>

                {comments[selectedSession.id] && comments[selectedSession.id].length > 0 ? (
                  <div className="space-y-3">
                    {comments[selectedSession.id].map((comment) => (
                      <div key={comment.id} className="bg-gray-50 border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge className={getAuthorColor(comment.authorType)}>
                              {comment.authorType}
                            </Badge>
                            <span className="font-medium text-sm">{comment.authorName}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>No comments yet. Add the first comment!</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Comment Dialog */}
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Comment</DialogTitle>
            <DialogDescription>
              Share your thoughts or ask questions about this session.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="comment">Your Comment</Label>
              <Textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Enter your comment here..."
                rows={5}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {newComment.length}/1000 characters
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your comment will be visible to the therapist and coordinators.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddComment} disabled={!newComment.trim()}>
              <Send className="h-4 w-4 mr-1" />
              Add Comment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
