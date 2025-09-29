'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Search, 
  Calendar, 
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Users
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Therapist {
  id: string
  firstName: string
  lastName: string
  phone?: string
  licenseNumber?: string
  isCoordinator: boolean
  canTakeConsultations: boolean
  isActive: boolean
  specialties: {
    id: string
    specialty: {
      id: string
      name: string
    }
    isPrimary: boolean
  }[]
  schedules: {
    id: string
    dayOfWeek: string
    startTime: string
    endTime: string
    isActive: boolean
  }[]
  createdAt: string
}

interface TherapistSelectorProps {
  selectedTherapistId?: string
  onTherapistSelect: (therapist: Therapist | null) => void
  showScheduleInfo?: boolean
  filterActive?: boolean
  filterCanTakeConsultations?: boolean
  placeholder?: string
}

export function TherapistSelector({
  selectedTherapistId,
  onTherapistSelect,
  showScheduleInfo = true,
  filterActive = true,
  filterCanTakeConsultations = false,
  placeholder = "Select a therapist to configure schedule"
}: TherapistSelectorProps) {
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [filteredTherapists, setFilteredTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [specialtyFilter, setSpecialtyFilter] = useState<string>('all')

  // Load therapists
  useEffect(() => {
    loadTherapists()
  }, [])

  // Filter therapists based on search and filters
  useEffect(() => {
    let filtered = therapists

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(therapist =>
        therapist.firstName.toLowerCase().includes(search) ||
        therapist.lastName.toLowerCase().includes(search) ||
        therapist.licenseNumber?.toLowerCase().includes(search) ||
        therapist.specialties.some(s => s.specialty.name.toLowerCase().includes(search))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(therapist => 
        statusFilter === 'active' ? therapist.isActive : !therapist.isActive
      )
    }

    // Apply specialty filter
    if (specialtyFilter !== 'all') {
      filtered = filtered.filter(therapist =>
        therapist.specialties.some(s => s.specialty.id === specialtyFilter)
      )
    }

    // Apply additional filters
    if (filterActive) {
      filtered = filtered.filter(therapist => therapist.isActive)
    }

    if (filterCanTakeConsultations) {
      filtered = filtered.filter(therapist => therapist.canTakeConsultations)
    }

    setFilteredTherapists(filtered)
  }, [therapists, searchTerm, statusFilter, specialtyFilter, filterActive, filterCanTakeConsultations])

  const loadTherapists = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/therapist')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load therapists')
      }

      setTherapists(result.therapists || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load therapists'
      setError(errorMessage)
      console.error('Error loading therapists:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSelectedTherapist = () => {
    return therapists.find(t => t.id === selectedTherapistId) || null
  }

  const getScheduleSummary = (therapist: Therapist) => {
    const activeSchedules = therapist.schedules.filter(s => s.isActive)
    if (activeSchedules.length === 0) {
      return 'No schedule configured'
    }

    const days = activeSchedules.map(s => s.dayOfWeek.slice(0, 3)).join(', ')
    return `${activeSchedules.length} days (${days})`
  }

  const getPrimarySpecialties = (therapist: Therapist) => {
    return therapist.specialties
      .filter(s => s.isPrimary)
      .map(s => s.specialty.name)
      .join(', ')
  }

  const getUniqueSpecialties = () => {
    const specialties = new Set<string>()
    therapists.forEach(therapist => {
      therapist.specialties.forEach(s => specialties.add(s.specialty.name))
    })
    return Array.from(specialties).sort()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading therapists...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadTherapists}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Selected Therapist */}
      {selectedTherapistId && getSelectedTherapist() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-primary bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                Selected Therapist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {getSelectedTherapist()?.firstName} {getSelectedTherapist()?.lastName}
                    </span>
                    <Badge variant={getSelectedTherapist()?.isActive ? 'default' : 'secondary'}>
                      {getSelectedTherapist()?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {getSelectedTherapist()?.isCoordinator && (
                      <Badge variant="outline">Coordinator</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>License: {getSelectedTherapist()?.licenseNumber || 'Not provided'}</div>
                    <div>Specialties: {getPrimarySpecialties(getSelectedTherapist()!)}</div>
                    {showScheduleInfo && (
                      <div>Schedule: {getScheduleSummary(getSelectedTherapist()!)}</div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => onTherapistSelect(null)}
                >
                  Change Therapist
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Therapist Selection */}
      {!selectedTherapistId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Select Therapist
            </CardTitle>
            <CardDescription>
              {placeholder}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="search">Search</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Name, license, specialty..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="specialty-filter">Specialty</Label>
                <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    {getUniqueSpecialties().map(specialty => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Therapist List */}
            <div className="space-y-3">
              {filteredTherapists.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No therapists found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || specialtyFilter !== 'all'
                      ? 'Try adjusting your search criteria'
                      : 'No therapists are available'
                    }
                  </p>
                </div>
              ) : (
                filteredTherapists.map((therapist) => (
                  <motion.div
                    key={therapist.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => onTherapistSelect(therapist)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div>
                                <h3 className="font-semibold">
                                  {therapist.firstName} {therapist.lastName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  License: {therapist.licenseNumber || 'Not provided'}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Badge variant={therapist.isActive ? 'default' : 'secondary'}>
                                  {therapist.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                {therapist.isCoordinator && (
                                  <Badge variant="outline">Coordinator</Badge>
                                )}
                                {therapist.canTakeConsultations && (
                                  <Badge variant="outline">Consultations</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div>
                                <strong>Specialties:</strong> {getPrimarySpecialties(therapist)}
                              </div>
                              {showScheduleInfo && (
                                <div>
                                  <strong>Schedule:</strong> {getScheduleSummary(therapist)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4 mr-2" />
                              Configure
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

