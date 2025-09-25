"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  MapPin, 
  LogOut,
  AlertTriangle,
  Activity,
  BarChart3,
  Shield
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface Session {
  id: string
  token: string
  expiresAt: string
  createdAt: string
  updatedAt: string
  lastActivity: string
  isActive: boolean
  deviceType: string | null
  deviceName: string | null
  browser: string | null
  browserVersion: string | null
  os: string | null
  osVersion: string | null
  ipAddress: string | null
  country: string | null
  city: string | null
  loginMethod: string | null
}

interface SessionStats {
  totalSessions: number
  activeSessions: number
  deviceBreakdown: Record<string, number>
  browserBreakdown: Record<string, number>
  locationBreakdown: Array<{ location: string; count: number }>
}

export function SessionManagement() {
  const [revokeAllDialogOpen, setRevokeAllDialogOpen] = React.useState(false)
  const [revokeSessionDialogOpen, setRevokeSessionDialogOpen] = React.useState(false)
  const [selectedSession, setSelectedSession] = React.useState<Session | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch sessions
  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const response = await fetch('/api/sessions')
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      const result = await response.json()
      return result as { sessions: Session[]; stats: SessionStats }
    },
  })

  // Revoke session mutation
  const revokeSessionMutation = useMutation({
    mutationFn: async ({ sessionId, action }: { sessionId?: string; action?: 'single' | 'all' }) => {
      const params = new URLSearchParams()
      if (sessionId) params.append('sessionId', sessionId)
      if (action) params.append('action', action)
      
      const response = await fetch(`/api/sessions?${params}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to revoke session')
      }

      return response.json()
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      
      if (variables.action === 'all') {
        toast({
          title: 'Sessions Revoked',
          description: result.message,
        })
      } else {
        toast({
          title: 'Session Revoked',
          description: 'Session has been successfully revoked',
        })
      }
      
      setRevokeAllDialogOpen(false)
      setRevokeSessionDialogOpen(false)
      setSelectedSession(null)
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to revoke session',
        variant: 'destructive',
      })
    },
  })

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getCurrentSession = () => {
    // In a real app, you'd identify the current session
    // For now, assume it's the most recent one
    return data?.sessions[0]
  }

  const formatLastActivity = (date: string) => {
    const activityDate = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - activityDate.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return format(activityDate, 'MMM dd, yyyy')
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
          <CardDescription>Loading session information...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sessions = data?.sessions || []
  const stats = data?.stats

  return (
    <div className="space-y-6">
      {/* Session Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSessions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSessions} total sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Device Types</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.deviceBreakdown).map(([device, count]) => (
                  <div key={device} className="flex justify-between text-sm">
                    <span className="capitalize">{device}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Browsers</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.browserBreakdown).slice(0, 3).map(([browser, count]) => (
                  <div key={browser} className="flex justify-between text-sm">
                    <span>{browser}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {stats.locationBreakdown.slice(0, 2).map((location, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="truncate">{location.location}</span>
                    <span>{location.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                Manage your active login sessions across all devices
              </CardDescription>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setRevokeAllDialogOpen(true)}
              disabled={sessions.length <= 1}
            >
              Revoke All Others
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session, index) => {
              const isCurrentSession = index === 0 // Simplified current session detection
              
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getDeviceIcon(session.deviceType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">
                          {session.deviceName || `${session.os} Device`}
                        </p>
                        {isCurrentSession && (
                          <Badge variant="default" className="text-xs">
                            Current Session
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          {session.browser} {session.browserVersion} on {session.os} {session.osVersion}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          {session.city && session.country 
                            ? `${session.city}, ${session.country}` 
                            : session.ipAddress || 'Unknown location'
                          }
                        </p>
                        <p>
                          Last active: {formatLastActivity(session.lastActivity)}
                        </p>
                        <p>
                          Login method: {session.loginMethod || 'email'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {!isCurrentSession && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSession(session)
                        setRevokeSessionDialogOpen(true)
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Revoke
                    </Button>
                  )}
                </div>
              )
            })}

            {sessions.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Sessions</h3>
                <p className="text-muted-foreground">
                  You don{`'`}t have any active sessions at the moment.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revoke Single Session Dialog */}
      <AlertDialog open={revokeSessionDialogOpen} onOpenChange={setRevokeSessionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this session? The user will be logged out from this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedSession) {
                  revokeSessionMutation.mutate({ 
                    sessionId: selectedSession.id, 
                    action: 'single' 
                  })
                }
              }}
            >
              Revoke Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke All Sessions Dialog */}
      <AlertDialog open={revokeAllDialogOpen} onOpenChange={setRevokeAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke All Other Sessions</AlertDialogTitle>
            <AlertDialogDescription>
              This will log you out from all other devices and browsers. Only your current session will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const currentSession = getCurrentSession()
                revokeSessionMutation.mutate({ 
                  sessionId: currentSession?.id,
                  action: 'all' 
                })
              }}
            >
              Revoke All Others
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}