'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Clock, 
  Plus, 
  Minus, 
  Save, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Users,
  User,
  UserCheck,
  CalendarDays,
  Timer,
  MapPin,
  Phone,
  Mail,
  Settings,
  Filter,
  Search,
  Download,
  Upload,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Sun,
  Moon,
  Coffee,
  Home,
  Work,
  School,
  Heart,
  Star,
  Zap,
  Target,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity
} from 'lucide-react'

interface TimeSlot {
  id: string
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'
  startTime: string // Format: HH:MM
  endTime: string // Format: HH:MM
  isAvailable: boolean
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  notes?: string
  recurring: boolean
  validFrom?: string // Date when this slot becomes valid
  validUntil?: string // Date when this slot expires
}

interface Parent {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  relationship: 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER'
  emergencyContact: boolean
  preferredContactMethod: 'EMAIL' | 'PHONE' | 'SMS'
  timezone: string
  location?: {
    address?: string
    city?: string
    state?: string
    zipCode?: string
  }
}

interface Child {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  grade?: string
  school?: string
  specialNeeds?: string[]
  transportationNeeds?: string
  parentId: string
}

interface AvailabilityPreferences {
  preferredDays: string[]
  preferredTimes: {
    morning: boolean
    afternoon: boolean
    evening: boolean
  }
  sessionDuration: number // in minutes
  maxSessionsPerWeek: number
  flexibility: 'HIGH' | 'MEDIUM' | 'LOW'
  advanceNotice: number // days
  recurringSessions: boolean
  holidayAvailability: boolean
  summerAvailability: boolean
  notes?: string
}

interface ParentAvailabilityManagerProps {
  parent?: Parent
  child?: Child
  onSave?: (availability: TimeSlot[], preferences: AvailabilityPreferences) => void
  onUpdate?: (availability: TimeSlot[], preferences: AvailabilityPreferences) => void
  onCancel?: () => void
  initialAvailability?: TimeSlot[]
  initialPreferences?: AvailabilityPreferences
  isEditing?: boolean
}

export function ParentAvailabilityManager({
  parent,
  child,
  onSave,
  onUpdate,
  onCancel,
  initialAvailability = [],
  initialPreferences,
  isEditing = false
}: ParentAvailabilityManagerProps) {
  const [activeTab, setActiveTab] = useState<'availability' | 'preferences' | 'schedule' | 'validation'>('availability')
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(initialAvailability)
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null)
  const [showSlotForm, setShowSlotForm] = useState(false)
  
  // Form state for new/editing slot
  const [slotForm, setSlotForm] = useState({
    day: 'MONDAY' as TimeSlot['day'],
    startTime: '09:00',
    endTime: '10:00',
    isAvailable: true,
    priority: 'MEDIUM' as TimeSlot['priority'],
    notes: '',
    recurring: true,
    validFrom: '',
    validUntil: ''
  })

  // Preferences state
  const [preferences, setPreferences] = useState<AvailabilityPreferences>({
    preferredDays: [],
    preferredTimes: {
      morning: true,
      afternoon: true,
      evening: false
    },
    sessionDuration: 60,
    maxSessionsPerWeek: 3,
    flexibility: 'MEDIUM',
    advanceNotice: 2,
    recurringSessions: true,
    holidayAvailability: false,
    summerAvailability: true,
    notes: '',
    ...initialPreferences
  })

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Get day name in Spanish
  const getDayName = (day: string) => {
    const days = {
      'MONDAY': 'Lunes',
      'TUESDAY': 'Martes',
      'WEDNESDAY': 'Miércoles',
      'THURSDAY': 'Jueves',
      'FRIDAY': 'Viernes',
      'SATURDAY': 'Sábado',
      'SUNDAY': 'Domingo'
    }
    return days[day as keyof typeof days] || day
  }

  // Get time period icon
  const getTimePeriodIcon = (time: string) => {
    const hour = parseInt(time.split(':')[0])
    if (hour < 6) return <Moon className="h-4 w-4" />
    if (hour < 12) return <Sun className="h-4 w-4" />
    if (hour < 18) return <Coffee className="h-4 w-4" />
    return <Moon className="h-4 w-4" />
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Validate time format
  const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return timeRegex.test(time)
  }

  // Validate time slot
  const validateTimeSlot = (slot: Partial<TimeSlot>): string[] => {
    const errors: string[] = []

    if (!slot.startTime || !validateTimeFormat(slot.startTime)) {
      errors.push('Hora de inicio inválida (formato: HH:MM)')
    }

    if (!slot.endTime || !validateTimeFormat(slot.endTime)) {
      errors.push('Hora de fin inválida (formato: HH:MM)')
    }

    if (slot.startTime && slot.endTime && slot.startTime >= slot.endTime) {
      errors.push('La hora de inicio debe ser anterior a la hora de fin')
    }

    if (slot.validFrom && slot.validUntil && slot.validFrom >= slot.validUntil) {
      errors.push('La fecha de inicio debe ser anterior a la fecha de fin')
    }

    return errors
  }

  // Check for overlapping slots
  const checkOverlappingSlots = (newSlot: TimeSlot, excludeId?: string): boolean => {
    return timeSlots.some(slot => {
      if (excludeId && slot.id === excludeId) return false
      if (slot.day !== newSlot.day) return false
      
      const newStart = newSlot.startTime
      const newEnd = newSlot.endTime
      const existingStart = slot.startTime
      const existingEnd = slot.endTime
      
      return (newStart < existingEnd && newEnd > existingStart)
    })
  }

  // Handle add/edit time slot
  const handleSlotSubmit = () => {
    const errors = validateTimeSlot(slotForm)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    const newSlot: TimeSlot = {
      id: editingSlot?.id || `slot-${Date.now()}`,
      day: slotForm.day,
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      isAvailable: slotForm.isAvailable,
      priority: slotForm.priority,
      notes: slotForm.notes,
      recurring: slotForm.recurring,
      validFrom: slotForm.validFrom || undefined,
      validUntil: slotForm.validUntil || undefined
    }

    // Check for overlaps
    if (checkOverlappingSlots(newSlot, editingSlot?.id)) {
      setValidationErrors(['Este horario se superpone con otro horario existente'])
      return
    }

    if (editingSlot) {
      setTimeSlots(prev => prev.map(slot => slot.id === editingSlot.id ? newSlot : slot))
    } else {
      setTimeSlots(prev => [...prev, newSlot])
    }

    // Reset form
    setSlotForm({
      day: 'MONDAY',
      startTime: '09:00',
      endTime: '10:00',
      isAvailable: true,
      priority: 'MEDIUM',
      notes: '',
      recurring: true,
      validFrom: '',
      validUntil: ''
    })
    setEditingSlot(null)
    setShowSlotForm(false)
    setValidationErrors([])
  }

  // Handle edit slot
  const handleEditSlot = (slot: TimeSlot) => {
    setEditingSlot(slot)
    setSlotForm({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
      priority: slot.priority,
      notes: slot.notes || '',
      recurring: slot.recurring,
      validFrom: slot.validFrom || '',
      validUntil: slot.validUntil || ''
    })
    setShowSlotForm(true)
  }

  // Handle delete slot
  const handleDeleteSlot = (slotId: string) => {
    setTimeSlots(prev => prev.filter(slot => slot.id !== slotId))
  }

  // Handle duplicate slot
  const handleDuplicateSlot = (slot: TimeSlot) => {
    const newSlot: TimeSlot = {
      ...slot,
      id: `slot-${Date.now()}`,
      notes: `${slot.notes || ''} (Copia)`.trim()
    }
    setTimeSlots(prev => [...prev, newSlot])
  }

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(timeSlots, preferences)
    }
  }

  // Handle update
  const handleUpdate = () => {
    if (onUpdate) {
      onUpdate(timeSlots, preferences)
    }
  }

  // Group slots by day
  const slotsByDay = timeSlots.reduce((acc, slot) => {
    if (!acc[slot.day]) {
      acc[slot.day] = []
    }
    acc[slot.day].push(slot)
    return acc
  }, {} as Record<string, TimeSlot[]>)

  // Calculate statistics
  const stats = {
    totalSlots: timeSlots.length,
    availableSlots: timeSlots.filter(slot => slot.isAvailable).length,
    totalHours: timeSlots.reduce((sum, slot) => {
      const start = new Date(`2000-01-01T${slot.startTime}:00`)
      const end = new Date(`2000-01-01T${slot.endTime}:00`)
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    }, 0),
    daysWithSlots: Object.keys(slotsByDay).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editar Disponibilidad' : 'Gestión de Disponibilidad'}
          </h1>
          <p className="text-muted-foreground">
            {parent ? `${parent.firstName} ${parent.lastName}` : 'Selecciona un padre/madre'}
            {child && ` - ${child.firstName} ${child.lastName}`}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSave} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Guardar
          </Button>
          {isEditing && (
            <Button onClick={handleUpdate}>
              <Save className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          )}
        </div>
      </div>

      {/* Parent Information */}
      {parent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Información del Padre/Madre
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Nombre Completo</Label>
                <p className="text-sm">{parent.firstName} {parent.lastName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm">{parent.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Teléfono</Label>
                <p className="text-sm">{parent.phone || 'No proporcionado'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Relación</Label>
                <p className="text-sm">{parent.relationship}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Método de Contacto Preferido</Label>
                <p className="text-sm">{parent.preferredContactMethod}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Zona Horaria</Label>
                <p className="text-sm">{parent.timezone}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Horarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSlots}</div>
            <p className="text-xs text-muted-foreground">
              {stats.availableSlots} disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Horas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Por semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Días Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.daysWithSlots}</div>
            <p className="text-xs text-muted-foreground">De 7 días</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Flexibilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className={getPriorityColor(preferences.flexibility)}>
                {preferences.flexibility}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Nivel</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
          <TabsTrigger value="schedule">Horario</TabsTrigger>
          <TabsTrigger value="validation">Validación</TabsTrigger>
        </TabsList>

        <TabsContent value="availability" className="space-y-4">
          {/* Add Time Slot Button */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Horarios de Disponibilidad</h2>
            <Button onClick={() => setShowSlotForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Horario
            </Button>
          </div>

          {/* Time Slots by Day */}
          <div className="space-y-4">
            {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => {
              const daySlots = slotsByDay[day] || []
              
              return (
                <Card key={day}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 mr-2" />
                        {getDayName(day)}
                      </div>
                      <Badge variant="outline">
                        {daySlots.length} horarios
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {daySlots.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No hay horarios configurados para este día
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {daySlots.map((slot) => (
                          <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                {getTimePeriodIcon(slot.startTime)}
                                <span className="font-medium">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              </div>
                              <Badge className={getPriorityColor(slot.priority)}>
                                {slot.priority}
                              </Badge>
                              {slot.isAvailable ? (
                                <Badge variant="default">Disponible</Badge>
                              ) : (
                                <Badge variant="secondary">No disponible</Badge>
                              )}
                              {slot.recurring && (
                                <Badge variant="outline">Recurrente</Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditSlot(slot)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDuplicateSlot(slot)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteSlot(slot.id)}
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
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Disponibilidad</CardTitle>
              <CardDescription>
                Configura las preferencias generales de disponibilidad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="session-duration">Duración de Sesión (minutos)</Label>
                  <Input
                    id="session-duration"
                    type="number"
                    value={preferences.sessionDuration}
                    onChange={(e) => setPreferences(prev => ({ ...prev, sessionDuration: parseInt(e.target.value) || 60 }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="max-sessions">Máximo Sesiones por Semana</Label>
                  <Input
                    id="max-sessions"
                    type="number"
                    value={preferences.maxSessionsPerWeek}
                    onChange={(e) => setPreferences(prev => ({ ...prev, maxSessionsPerWeek: parseInt(e.target.value) || 3 }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="flexibility">Nivel de Flexibilidad</Label>
                <Select
                  value={preferences.flexibility}
                  onValueChange={(value: any) => setPreferences(prev => ({ ...prev, flexibility: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">Alta - Muy flexible con horarios</SelectItem>
                    <SelectItem value="MEDIUM">Media - Moderadamente flexible</SelectItem>
                    <SelectItem value="LOW">Baja - Horarios fijos preferidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="advance-notice">Aviso Previo Requerido (días)</Label>
                <Input
                  id="advance-notice"
                  type="number"
                  value={preferences.advanceNotice}
                  onChange={(e) => setPreferences(prev => ({ ...prev, advanceNotice: parseInt(e.target.value) || 2 }))}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Períodos Preferidos</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={preferences.preferredTimes.morning}
                      onCheckedChange={(checked) => setPreferences(prev => ({
                        ...prev,
                        preferredTimes: { ...prev.preferredTimes, morning: checked }
                      }))}
                    />
                    <Label>Mañana (6:00 - 12:00)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={preferences.preferredTimes.afternoon}
                      onCheckedChange={(checked) => setPreferences(prev => ({
                        ...prev,
                        preferredTimes: { ...prev.preferredTimes, afternoon: checked }
                      }))}
                    />
                    <Label>Tarde (12:00 - 18:00)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={preferences.preferredTimes.evening}
                      onCheckedChange={(checked) => setPreferences(prev => ({
                        ...prev,
                        preferredTimes: { ...prev.preferredTimes, evening: checked }
                      }))}
                    />
                    <Label>Noche (18:00 - 22:00)</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={preferences.recurringSessions}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, recurringSessions: checked }))}
                  />
                  <Label>Sesiones Recurrentes</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={preferences.holidayAvailability}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, holidayAvailability: checked }))}
                  />
                  <Label>Disponible en Vacaciones</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={preferences.summerAvailability}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, summerAvailability: checked }))}
                  />
                  <Label>Disponible en Verano</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="preferences-notes">Notas Adicionales</Label>
                <Textarea
                  id="preferences-notes"
                  placeholder="Notas adicionales sobre disponibilidad..."
                  value={preferences.notes || ''}
                  onChange={(e) => setPreferences(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vista de Horario Semanal</CardTitle>
              <CardDescription>
                Vista general de la disponibilidad semanal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => {
                  const daySlots = slotsByDay[day] || []
                  
                  return (
                    <div key={day} className="border rounded-lg p-3">
                      <h3 className="font-medium text-center mb-2">{getDayName(day)}</h3>
                      <div className="space-y-1">
                        {daySlots.length === 0 ? (
                          <div className="text-xs text-muted-foreground text-center">
                            Sin horarios
                          </div>
                        ) : (
                          daySlots.map((slot) => (
                            <div key={slot.id} className="text-xs p-1 bg-blue-50 rounded">
                              <div className="font-medium">
                                {slot.startTime}-{slot.endTime}
                              </div>
                              <div className="text-muted-foreground">
                                {slot.priority}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Validación de Disponibilidad
              </CardTitle>
              <CardDescription>
                Verifica que la disponibilidad sea válida y completa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Validaciones de Formato</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Formato de hora válido</span>
                        <div className="flex items-center space-x-2">
                          {timeSlots.every(slot => 
                            validateTimeFormat(slot.startTime) && validateTimeFormat(slot.endTime)
                          ) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Horarios lógicos</span>
                        <div className="flex items-center space-x-2">
                          {timeSlots.every(slot => slot.startTime < slot.endTime) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Sin superposiciones</span>
                        <div className="flex items-center space-x-2">
                          {timeSlots.every(slot => !checkOverlappingSlots(slot, slot.id)) ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Validaciones de Completitud</h4>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Al menos un horario</span>
                        <div className="flex items-center space-x-2">
                          {timeSlots.length > 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Horarios disponibles</span>
                        <div className="flex items-center space-x-2">
                          {stats.availableSlots > 0 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Múltiples días</span>
                        <div className="flex items-center space-x-2">
                          {stats.daysWithSlots >= 2 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {validationErrors.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        {validationErrors.map((error, index) => (
                          <div key={index} className="text-sm">{error}</div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Time Slot Form Dialog */}
      {showSlotForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {editingSlot ? 'Editar Horario' : 'Nuevo Horario'}
              </CardTitle>
              <CardDescription>
                {editingSlot ? 'Modifica los datos del horario' : 'Agrega un nuevo horario de disponibilidad'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="slot-day">Día de la Semana</Label>
                <Select
                  value={slotForm.day}
                  onValueChange={(value: any) => setSlotForm(prev => ({ ...prev, day: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONDAY">Lunes</SelectItem>
                    <SelectItem value="TUESDAY">Martes</SelectItem>
                    <SelectItem value="WEDNESDAY">Miércoles</SelectItem>
                    <SelectItem value="THURSDAY">Jueves</SelectItem>
                    <SelectItem value="FRIDAY">Viernes</SelectItem>
                    <SelectItem value="SATURDAY">Sábado</SelectItem>
                    <SelectItem value="SUNDAY">Domingo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time">Hora de Inicio</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={slotForm.startTime}
                    onChange={(e) => setSlotForm(prev => ({ ...prev, startTime: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-time">Hora de Fin</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={slotForm.endTime}
                    onChange={(e) => setSlotForm(prev => ({ ...prev, endTime: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="slot-priority">Prioridad</Label>
                <Select
                  value={slotForm.priority}
                  onValueChange={(value: any) => setSlotForm(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="LOW">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="slot-notes">Notas</Label>
                <Textarea
                  id="slot-notes"
                  placeholder="Notas sobre este horario..."
                  value={slotForm.notes}
                  onChange={(e) => setSlotForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={slotForm.isAvailable}
                  onCheckedChange={(checked) => setSlotForm(prev => ({ ...prev, isAvailable: checked }))}
                />
                <Label>Horario Disponible</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={slotForm.recurring}
                  onCheckedChange={(checked) => setSlotForm(prev => ({ ...prev, recurring: checked }))}
                />
                <Label>Horario Recurrente</Label>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowSlotForm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleSlotSubmit} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {editingSlot ? 'Actualizar' : 'Crear'} Horario
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
