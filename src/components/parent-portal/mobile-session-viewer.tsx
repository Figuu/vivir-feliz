'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  ChevronRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface MobileSessionViewerProps {
  patientId: string
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
}

export function MobileSessionViewer({ patientId }: MobileSessionViewerProps) {
  const [loading, setLoading] = useState(false)
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filter, setFilter] = useState<'upcoming' | 'completed'>('upcoming')

  useEffect(() => {
    loadSessions()
  }, [patientId, filter])

  const loadSessions = async () => {
    try {
      setLoading(true)
      
      const today = new Date().toISOString().split('T')[0]
      const queryParams = new URLSearchParams({
        patientId,
        status: filter === 'upcoming' ? 'scheduled' : 'completed',
        startDate: filter === 'upcoming' ? today : '',
        endDate: filter === 'upcoming' ? '' : today,
        limit: '50',
        sortBy: 'scheduledDate',
        sortOrder: filter === 'upcoming' ? 'asc' : 'desc'
      })

      const response = await fetch(`/api/sessions?${queryParams}`)
      const data = await response.json()

      if (data.data) {
        setSessions(data.data)
      }
    } catch (err) {
      console.error('Error loading sessions:', err)
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (session: Session) => {
    setSelectedSession(session)
    setDetailsOpen(true)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'scheduled': return <Clock className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filter Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`py-4 text-center font-medium transition-colors ${
              filter === 'upcoming'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`py-4 text-center font-medium transition-colors ${
              filter === 'completed'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-muted-foreground'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="p-4 space-y-3 pb-24">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Sessions</h3>
              <p className="text-muted-foreground text-sm">
                No {filter} sessions found.
              </p>
            </CardContent>
          </Card>
        ) : (
          sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleViewDetails(session)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base mb-1">{session.service.name}</h3>
                      <Badge className={`${getStatusColor(session.status)} text-xs`}>
                        {getStatusIcon(session.status)}
                        <span className="ml-1">{session.status}</span>
                      </Badge>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <User className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{session.therapist.firstName} {session.therapist.lastName}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{new Date(session.scheduledDate).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{session.scheduledTime} ({session.duration} min)</span>
                    </div>
                  </div>

                  {session.sessionNotes && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center text-xs text-blue-600 font-medium">
                        <FileText className="h-3 w-3 mr-1" />
                        Has session notes
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Session Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedSession?.service.name}</DialogTitle>
            <DialogDescription className="text-sm">
              Session Details
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-4 py-2">
              {/* Status Badge */}
              <div className="flex justify-center">
                <Badge className={`${getStatusColor(selectedSession.status)} text-sm py-1 px-3`}>
                  {getStatusIcon(selectedSession.status)}
                  <span className="ml-1">{selectedSession.status}</span>
                </Badge>
              </div>

              {/* Session Info */}
              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                <div className="flex items-start">
                  <User className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Therapist</p>
                    <p className="font-medium">{selectedSession.therapist.firstName} {selectedSession.therapist.lastName}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedSession.scheduledDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-muted-foreground mr-3 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Time & Duration</p>
                    <p className="font-medium">{selectedSession.scheduledTime} ({selectedSession.duration} minutes)</p>
                  </div>
                </div>
              </div>

              {/* Session Notes */}
              {selectedSession.sessionNotes && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    <h4 className="font-semibold text-sm">Session Notes</h4>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{selectedSession.sessionNotes}</p>
                  </div>
                </div>
              )}

              {/* Therapist Comments */}
              {selectedSession.therapistComments && (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-green-600" />
                    <h4 className="font-semibold text-sm">Therapist Comments</h4>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{selectedSession.therapistComments}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedSession.status === 'scheduled' && (
                <div className="pt-2 space-y-2">
                  <Button className="w-full" variant="outline">
                    Request Reschedule
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
