'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar,
  Users,
  User,
  Shield,
  Heart,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Activity,
  Target,
  Star,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { RoleBasedCalendar } from '@/components/sessions/role-based-calendar'
import { useSessionCalendar } from '@/hooks/use-session-calendar'

export default function SessionCalendarPage() {
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'THERAPIST' | 'PARENT' | 'PATIENT'>('ADMIN')
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined)
  const [activeTab, setActiveTab] = useState('calendar')
  
  const { 
    loading, 
    error, 
    sessions, 
    stats, 
    roleData, 
    loadSessions,
    clearError 
  } = useSessionCalendar()

  // Load sessions when role or user changes
  useEffect(() => {
    loadSessions({
      role: selectedRole,
      userId: selectedUserId,
      date: new Date().toISOString(),
      view: 'month'
    })
  }, [selectedRole, selectedUserId, loadSessions])

  const handleSessionSelect = (session: any) => {
    console.log('Session selected:', session)
  }

  const handleSessionCreate = () => {
    console.log('Create new session')
  }

  const handleSessionEdit = (session: any) => {
    console.log('Edit session:', session)
  }

  const handleSessionDelete = (session: any) => {
    console.log('Delete session:', session)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return Shield
      case 'THERAPIST':
        return User
      case 'PARENT':
        return Users
      case 'PATIENT':
        return Heart
      default:
        return User
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'THERAPIST':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PARENT':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PATIENT':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Full access to all sessions and management features'
      case 'THERAPIST':
        return 'View and manage your assigned therapy sessions'
      case 'PARENT':
        return 'View and manage your children\'s therapy sessions'
      case 'PATIENT':
        return 'View your personal therapy sessions'
      default:
        return ''
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Calendar</h1>
          <p className="text-muted-foreground">
            Role-based calendar views for therapy session management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Role Selection
          </CardTitle>
          <CardDescription>
            Select a role to view the calendar from that perspective
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(['ADMIN', 'THERAPIST', 'PARENT', 'PATIENT'] as const).map((role) => {
              const Icon = getRoleIcon(role)
              return (
                <motion.div
                  key={role}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all ${
                      selectedRole === role 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getRoleColor(role)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{role}</h3>
                          <p className="text-sm text-muted-foreground">
                            {getRoleDescription(role)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Role-specific User Selection */}
      {selectedRole !== 'ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle>Select User</CardTitle>
            <CardDescription>
              Choose a specific user to view their calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Select 
                value={selectedUserId || ''} 
                onValueChange={(value) => setSelectedUserId(value || undefined)}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {selectedRole === 'THERAPIST' && roleData.therapists?.map((therapist: any) => (
                    <SelectItem key={therapist.id} value={therapist.id}>
                      {therapist.firstName} {therapist.lastName}
                    </SelectItem>
                  ))}
                  {selectedRole === 'PARENT' && roleData.children?.map((child: any) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.firstName} {child.lastName}
                    </SelectItem>
                  ))}
                  {selectedRole === 'PATIENT' && (
                    <SelectItem value="patient-1">
                      John Doe (Patient)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Badge className={getRoleColor(selectedRole)}>
                {selectedRole}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All scheduled sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
            <p className="text-xs text-muted-foreground">
              Sessions scheduled today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.upcoming}</div>
            <p className="text-xs text-muted-foreground">
              Next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Past due sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <RoleBasedCalendar
            userRole={selectedRole}
            userId={selectedUserId}
            onSessionSelect={handleSessionSelect}
            onSessionCreate={handleSessionCreate}
            onSessionEdit={handleSessionEdit}
            onSessionDelete={handleSessionDelete}
          />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Calendar Statistics
              </CardTitle>
              <CardDescription>
                Overview of session statistics for {selectedRole} role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Status Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Status Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                      <div key={status} className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {status.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Role-specific Data */}
                {roleData && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Role-specific Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedRole === 'ADMIN' && (
                        <>
                          <div className="p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{roleData.totalTherapists || 0}</div>
                            <div className="text-sm text-muted-foreground">Total Therapists</div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{roleData.totalServices || 0}</div>
                            <div className="text-sm text-muted-foreground">Total Services</div>
                          </div>
                        </>
                      )}
                      {selectedRole === 'THERAPIST' && (
                        <>
                          <div className="p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{roleData.totalPatients || 0}</div>
                            <div className="text-sm text-muted-foreground">Total Patients</div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{roleData.totalServices || 0}</div>
                            <div className="text-sm text-muted-foreground">Services Provided</div>
                          </div>
                        </>
                      )}
                      {selectedRole === 'PARENT' && (
                        <>
                          <div className="p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{roleData.totalChildren || 0}</div>
                            <div className="text-sm text-muted-foreground">Children</div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{roleData.totalTherapists || 0}</div>
                            <div className="text-sm text-muted-foreground">Therapists</div>
                          </div>
                        </>
                      )}
                      {selectedRole === 'PATIENT' && (
                        <>
                          <div className="p-4 border rounded-lg">
                            <div className="text-2xl font-bold">{roleData.totalServices || 0}</div>
                            <div className="text-sm text-muted-foreground">Services</div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <div className="text-2xl font-bold">1</div>
                            <div className="text-sm text-muted-foreground">Assigned Therapist</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Calendar Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Month view with full calendar grid</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Week view with daily columns</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Day view with detailed schedule</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Agenda view with session list</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Role-based Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Admin: Full access to all sessions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Therapist: Manage assigned sessions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Parent: View children's sessions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Patient: Personal session view</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Interactive Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Click to view session details</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Role-specific action buttons</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Real-time status updates</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Advanced filtering and search</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Session Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Confirm/cancel sessions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Start/complete sessions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Edit session details</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Add session notes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
