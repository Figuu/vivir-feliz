'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users,
  User,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Edit,
  Save,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Heart,
  Activity,
  BarChart3,
  FileText,
  Timer,
  Bell,
  Settings,
  Home,
  Menu,
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
  Flag,
  Tag,
  Hash,
  AtSign,
  DollarSign,
  Percent,
  Crown,
  Trophy,
  Medal,
  Flame,
  Sparkles,
  Globe,
  Building,
  Shield,
  Key,
  Lock,
  Unlock,
  Database,
  Server,
  Code,
  TrendingUp,
  TrendingDown,
  BookOpen,
  MessageSquare as MessageSquareIcon,
  Timer as TimerIcon,
  UserCheck,
  UserCog,
  Play,
  Pause,
  Stop,
  RotateCcw,
  Copy,
  Move,
  GripVertical,
  Square,
  CheckSquare,
  Info,
  Eye,
  Download,
  Upload
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface MobilePatientManagementProps {
  therapistId?: string
  onPatientSelect?: (patient: any) => void
  onPatientUpdate?: (patient: any) => void
}

export function MobilePatientManagement({
  therapistId,
  onPatientSelect,
  onPatientUpdate
}: MobilePatientManagementProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<any[]>([])
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
  const [showPatientDetails, setShowPatientDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Load patients
  useEffect(() => {
    if (therapistId) {
      loadPatients()
    }
  }, [therapistId, currentPage, searchTerm, statusFilter])

  const loadPatients = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (therapistId) params.append('therapistId', therapistId)
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      params.append('page', currentPage.toString())
      params.append('limit', '10')

      const response = await fetch(`/api/patients?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load patients')
      }

      setPatients(result.data.patients || [])
      setTotalPages(result.data.pagination?.totalPages || 1)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patients'
      setError(errorMessage)
      console.error('Error loading patients:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !patients.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <span>Loading patients...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error Loading Patients</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadPatients}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-lg font-semibold">Patients</h1>
            <p className="text-sm text-muted-foreground">
              {patients.length} patients
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="p-2">
            <Filter className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Patients List */}
      <div className="p-4 space-y-3">
        {patients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Patients Found</h3>
              <p className="text-muted-foreground mb-4">
                No patients found matching your search criteria.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </CardContent>
          </Card>
        ) : (
          patients.map((patient) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {patient.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(patient.status)}>
                    {patient.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedPatient(patient)
                      setShowPatientDetails(true)
                    }}
                    className="p-2"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Phone</div>
                  <div>{patient.phone || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Session</div>
                  <div>{patient.lastSessionDate ? formatDate(patient.lastSessionDate) : 'No sessions'}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <div className="text-sm text-muted-foreground">
                  {patient.totalSessions || 0} sessions
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="p-2">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Patient Details Modal */}
      <AnimatePresence>
        {showPatientDetails && selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white rounded-t-lg w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Patient Details</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPatientDetails(false)}
                    className="p-2"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="text-center">
                  <div className="p-4 rounded-full bg-blue-100 w-16 h-16 mx-auto mb-3">
                    <User className="h-8 w-8 text-blue-600 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <p className="text-muted-foreground">{selectedPatient.email}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <div className="text-sm">{selectedPatient.phone || 'Not provided'}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getStatusColor(selectedPatient.status)}>
                      {selectedPatient.status}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Date of Birth</Label>
                  <div className="text-sm">
                    {selectedPatient.dateOfBirth ? formatDate(selectedPatient.dateOfBirth) : 'Not provided'}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Last Session</Label>
                  <div className="text-sm">
                    {selectedPatient.lastSessionDate ? formatDate(selectedPatient.lastSessionDate) : 'No sessions yet'}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-4">
                  <Button variant="outline" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
          >
            <Users className="h-5 w-5" />
            <span className="text-xs">Patients</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs">Sessions</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">Messages</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center space-y-1 p-2"
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
