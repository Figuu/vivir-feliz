'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Clock, 
  Plus, 
  CheckCircle, 
  Info,
  Users,
  User,
  CalendarDays,
  Timer,
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
  Activity,
  Save,
  Edit,
  Trash2,
  Copy,
  Eye,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  AlertTriangle
} from 'lucide-react'
import { ParentAvailabilityManager } from '@/components/therapeutic-proposal/parent-availability-manager'

// Mock data for testing
const mockParent = {
  id: 'parent-1',
  firstName: 'María',
  lastName: 'González',
  email: 'maria.gonzalez@email.com',
  phone: '+1 234 567 8900',
  relationship: 'MOTHER' as const,
  emergencyContact: true,
  preferredContactMethod: 'EMAIL' as const,
  timezone: 'America/New_York',
  location: {
    address: '123 Main Street',
    city: 'Miami',
    state: 'FL',
    zipCode: '33101'
  }
}

const mockChild = {
  id: 'child-1',
  firstName: 'Carlos',
  lastName: 'González',
  dateOfBirth: '2018-05-15',
  grade: 'Kindergarten',
  school: 'Miami Elementary School',
  specialNeeds: ['Speech Delay', 'Sensory Processing'],
  transportationNeeds: 'Parent pickup required',
  parentId: 'parent-1'
}

const mockInitialAvailability = [
  {
    id: 'slot-1',
    day: 'MONDAY' as const,
    startTime: '09:00',
    endTime: '11:00',
    isAvailable: true,
    priority: 'HIGH' as const,
    notes: 'Morning sessions preferred',
    recurring: true
  },
  {
    id: 'slot-2',
    day: 'WEDNESDAY' as const,
    startTime: '14:00',
    endTime: '16:00',
    isAvailable: true,
    priority: 'MEDIUM' as const,
    notes: 'After school sessions',
    recurring: true
  },
  {
    id: 'slot-3',
    day: 'FRIDAY' as const,
    startTime: '10:00',
    endTime: '12:00',
    isAvailable: true,
    priority: 'LOW' as const,
    notes: 'Flexible timing',
    recurring: true
  }
]

const mockInitialPreferences = {
  preferredDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
  preferredTimes: {
    morning: true,
    afternoon: true,
    evening: false
  },
  sessionDuration: 60,
  maxSessionsPerWeek: 3,
  flexibility: 'MEDIUM' as const,
  advanceNotice: 2,
  recurringSessions: true,
  holidayAvailability: false,
  summerAvailability: true,
  notes: 'Prefer morning sessions for better child focus'
}

export default function TestParentAvailabilityPage() {
  const [availability, setAvailability] = useState(mockInitialAvailability)
  const [preferences, setPreferences] = useState(mockInitialPreferences)
  const [showForm, setShowForm] = useState(false)
  const [editingAvailability, setEditingAvailability] = useState<any>(null)

  const handleSaveAvailability = (newAvailability: any[], newPreferences: any) => {
    console.log('Saving availability:', { newAvailability, newPreferences })
    setAvailability(newAvailability)
    setPreferences(newPreferences)
    setShowForm(false)
    alert('Disponibilidad guardada exitosamente')
  }

  const handleUpdateAvailability = (newAvailability: any[], newPreferences: any) => {
    console.log('Updating availability:', { newAvailability, newPreferences })
    setAvailability(newAvailability)
    setPreferences(newPreferences)
    setShowForm(false)
    setEditingAvailability(null)
    alert('Disponibilidad actualizada exitosamente')
  }

  const handleEditAvailability = () => {
    setEditingAvailability({
      availability: availability,
      preferences: preferences
    })
    setShowForm(true)
  }

  const handleDeleteAvailability = () => {
    setAvailability([])
    setPreferences({
      preferredDays: [],
      preferredTimes: { morning: false, afternoon: false, evening: false },
      sessionDuration: 60,
      maxSessionsPerWeek: 3,
      flexibility: 'MEDIUM',
      advanceNotice: 2,
      recurringSessions: true,
      holidayAvailability: false,
      summerAvailability: true,
      notes: ''
    })
    alert('Disponibilidad eliminada')
  }

  // Calculate statistics
  const stats = {
    totalSlots: availability.length,
    availableSlots: availability.filter(slot => slot.isAvailable).length,
    totalHours: availability.reduce((sum, slot) => {
      const start = new Date(`2000-01-01T${slot.startTime}:00`)
      const end = new Date(`2000-01-01T${slot.endTime}:00`)
      return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    }, 0),
    daysWithSlots: new Set(availability.map(slot => slot.day)).size,
    highPrioritySlots: availability.filter(slot => slot.priority === 'HIGH').length,
    recurringSlots: availability.filter(slot => slot.recurring).length,
    morningSlots: availability.filter(slot => {
      const hour = parseInt(slot.startTime.split(':')[0])
      return hour >= 6 && hour < 12
    }).length,
    afternoonSlots: availability.filter(slot => {
      const hour = parseInt(slot.startTime.split(':')[0])
      return hour >= 12 && hour < 18
    }).length,
    eveningSlots: availability.filter(slot => {
      const hour = parseInt(slot.startTime.split(':')[0])
      return hour >= 18 && hour < 22
    }).length
  }

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Calendar className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Sistema de Gestión de Disponibilidad de Padres</h1>
      </div>
      
      <p className="text-muted-foreground">
        Sistema completo para que los padres gestionen su disponibilidad para sesiones de terapia 
        con validación de formato de tiempo, preferencias y horarios personalizados.
      </p>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Validación de Tiempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Validación automática de formato de tiempo y horarios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-blue-600" />
              Gestión de Horarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Creación y gestión de horarios de disponibilidad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Settings className="h-4 w-4 mr-2 text-purple-600" />
              Preferencias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Configuración de preferencias y flexibilidad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-orange-600" />
              Análisis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Análisis de disponibilidad y estadísticas
            </p>
          </CardContent>
        </Card>
      </div>

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

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Horarios de Mañana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.morningSlots}</div>
            <p className="text-xs text-muted-foreground">6:00 - 12:00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Horarios de Tarde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.afternoonSlots}</div>
            <p className="text-xs text-muted-foreground">12:00 - 18:00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Horarios de Noche</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eveningSlots}</div>
            <p className="text-xs text-muted-foreground">18:00 - 22:00</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Horarios Recurrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recurringSlots}</div>
            <p className="text-xs text-muted-foreground">De {stats.totalSlots} total</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Availability Display */}
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidad Actual</CardTitle>
          <CardDescription>
            Horarios configurados por día de la semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map((day) => {
              const daySlots = availability.filter(slot => slot.day === day)
              
              return (
                <div key={day} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {getDayName(day)}
                    </h3>
                    <Badge variant="outline">
                      {daySlots.length} horarios
                    </Badge>
                  </div>
                  
                  {daySlots.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No hay horarios configurados para este día
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {daySlots.map((slot) => (
                        <div key={slot.id} className="border rounded-lg p-3 bg-blue-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getTimePeriodIcon(slot.startTime)}
                              <span className="font-medium">
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                            <Badge className={getPriorityColor(slot.priority)}>
                              {slot.priority}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1">
                            {slot.isAvailable ? (
                              <Badge variant="default" className="text-xs">Disponible</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">No disponible</Badge>
                            )}
                            
                            {slot.recurring && (
                              <Badge variant="outline" className="text-xs">Recurrente</Badge>
                            )}
                            
                            {slot.notes && (
                              <p className="text-xs text-muted-foreground">{slot.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Preferences Display */}
      <Card>
        <CardHeader>
          <CardTitle>Preferencias Configuradas</CardTitle>
          <CardDescription>
            Configuración actual de preferencias de disponibilidad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">Duración de Sesión</Label>
              <p className="text-sm">{preferences.sessionDuration} minutos</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Máximo Sesiones/Semana</Label>
              <p className="text-sm">{preferences.maxSessionsPerWeek}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Aviso Previo</Label>
              <p className="text-sm">{preferences.advanceNotice} días</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Períodos Preferidos</Label>
              <div className="flex space-x-2 mt-1">
                {preferences.preferredTimes.morning && (
                  <Badge variant="outline" className="text-xs">Mañana</Badge>
                )}
                {preferences.preferredTimes.afternoon && (
                  <Badge variant="outline" className="text-xs">Tarde</Badge>
                )}
                {preferences.preferredTimes.evening && (
                  <Badge variant="outline" className="text-xs">Noche</Badge>
                )}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Opciones Especiales</Label>
              <div className="flex space-x-2 mt-1">
                {preferences.recurringSessions && (
                  <Badge variant="outline" className="text-xs">Recurrentes</Badge>
                )}
                {preferences.holidayAvailability && (
                  <Badge variant="outline" className="text-xs">Vacaciones</Badge>
                )}
                {preferences.summerAvailability && (
                  <Badge variant="outline" className="text-xs">Verano</Badge>
                )}
              </div>
            </div>
            
            {preferences.notes && (
              <div className="md:col-span-2 lg:col-span-3">
                <Label className="text-sm font-medium">Notas</Label>
                <p className="text-sm text-muted-foreground mt-1">{preferences.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gestión de Disponibilidad</h2>
          <p className="text-muted-foreground">
            Configura y gestiona la disponibilidad para sesiones de terapia
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Disponibilidad
          </Button>
          <Button variant="outline" onClick={handleEditAvailability}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Parent Availability Manager Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <ParentAvailabilityManager
              parent={mockParent}
              child={mockChild}
              onSave={handleSaveAvailability}
              onUpdate={handleUpdateAvailability}
              onCancel={() => {
                setShowForm(false)
                setEditingAvailability(null)
              }}
              initialAvailability={editingAvailability?.availability || []}
              initialPreferences={editingAvailability?.preferences}
              isEditing={!!editingAvailability}
            />
          </div>
        </div>
      )}

      {/* Technical Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Información Técnica:</strong> Este sistema permite a los padres gestionar su disponibilidad 
          para sesiones de terapia con validación automática de formato de tiempo, gestión de horarios 
          personalizados, configuración de preferencias, análisis de disponibilidad, y validación de 
          superposiciones. Incluye soporte para horarios recurrentes, validación de fechas, y análisis 
          estadístico de la disponibilidad configurada.
        </AlertDescription>
      </Alert>
    </div>
  )
}
