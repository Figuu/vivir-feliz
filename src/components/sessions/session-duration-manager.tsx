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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock,
  Settings,
  Zap,
  BarChart3,
  Calendar,
  Timer,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Plus,
  Minus,
  Edit,
  Save,
  X,
  TrendingUp,
  Users,
  Target,
  Activity
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from '@/hooks/use-toast'

interface Service {
  id: string
  name: string
  type: string
  sessionDuration: number
  costPerSession: number
}

interface DurationConfig {
  serviceId: string
  defaultDuration: number
  minDuration: number
  maxDuration: number
  allowedDurations: number[]
  breakBetweenSessions: number
  bufferTime: number
  isActive: boolean
}

interface OptimizedSlot {
  time: string
  duration: number
  serviceId: string
  serviceName: string
  optimizationScore: number
  isOptimal: boolean
}

interface SessionDurationManagerProps {
  therapistId?: string
  serviceId?: string
  onDurationChange?: (config: DurationConfig) => void
  onOptimizationComplete?: (slots: OptimizedSlot[]) => void
}

export function SessionDurationManager({
  therapistId,
  serviceId,
  onDurationChange,
  onOptimizationComplete
}: SessionDurationManagerProps) {
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [durationConfig, setDurationConfig] = useState<DurationConfig | null>(null)
  const [optimizedSlots, setOptimizedSlots] = useState<OptimizedSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'config' | 'optimize' | 'adjust'>('config')

  // Form state for duration configuration
  const [configForm, setConfigForm] = useState({
    defaultDuration: 60,
    minDuration: 30,
    maxDuration: 120,
    allowedDurations: [30, 45, 60, 90, 120],
    breakBetweenSessions: 15,
    bufferTime: 5,
    isActive: true
  })

  // Form state for optimization
  const [optimizationForm, setOptimizationForm] = useState({
    date: '',
    optimizeFor: 'EFFICIENCY' as 'EFFICIENCY' | 'PATIENT_COMFORT' | 'THERAPIST_PREFERENCE',
    selectedServices: [] as string[]
  })

  // Load services and configurations
  useEffect(() => {
    loadServices()
  }, [therapistId, serviceId])

  const loadServices = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (serviceId) params.append('serviceId', serviceId)
      if (therapistId) params.append('therapistId', therapistId)

      const response = await fetch(`/api/sessions/duration-timing?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load services')
      }

      setServices(result.data.durationConfigs)
      
      if (result.data.durationConfigs.length > 0) {
        const firstService = result.data.durationConfigs[0]
        setSelectedService(firstService)
        
        // Set default configuration
        setConfigForm({
          defaultDuration: firstService.sessionDuration,
          minDuration: 30,
          maxDuration: 120,
          allowedDurations: [30, 45, 60, 90, 120],
          breakBetweenSessions: result.data.defaultSettings.breakBetweenSessions,
          bufferTime: result.data.defaultSettings.bufferTime,
          isActive: true
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load services'
      setError(errorMessage)
      console.error('Error loading services:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!selectedService) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/duration-timing?action=config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          ...configForm
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save configuration')
      }

      toast({
        title: "Success",
        description: 'Duration configuration saved successfully'
      })
      
      if (onDurationChange) {
        onDurationChange({
          serviceId: selectedService.id,
          ...configForm
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error saving configuration:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOptimizeTimeSlots = async () => {
    if (!optimizationForm.date || !therapistId) return

    try {
      setOptimizing(true)
      setError(null)

      const response = await fetch('/api/sessions/duration-timing?action=optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId,
          date: new Date(optimizationForm.date).toISOString(),
          serviceIds: optimizationForm.selectedServices.length > 0 ? optimizationForm.selectedServices : undefined,
          optimizeFor: optimizationForm.optimizeFor
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to optimize time slots')
      }

      setOptimizedSlots(result.data.optimizedSlots)
      toast({
        title: "Success",
        description: `Found ${result.data.optimizedSlots.length} optimized time slots`
      })
      
      if (onOptimizationComplete) {
        onOptimizationComplete(result.data.optimizedSlots)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize time slots'
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      })
      console.error('Error optimizing time slots:', err)
    } finally {
      setOptimizing(false)
    }
  }

  const addAllowedDuration = (duration: number) => {
    if (!configForm.allowedDurations.includes(duration)) {
      setConfigForm(prev => ({
        ...prev,
        allowedDurations: [...prev.allowedDurations, duration].sort((a, b) => a - b)
      }))
    }
  }

  const removeAllowedDuration = (duration: number) => {
    setConfigForm(prev => ({
      ...prev,
      allowedDurations: prev.allowedDurations.filter(d => d !== duration)
    }))
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getOptimizationColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  if (loading && services.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Loading duration configurations...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Session Duration & Timing Management
          </CardTitle>
          <CardDescription>
            Configure session durations and optimize time slot allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div>
              <Label className="text-sm font-medium">Service</Label>
              <Select 
                value={selectedService?.id || ''} 
                onValueChange={(value) => {
                  const service = services.find(s => s.id === value)
                  setSelectedService(service || null)
                  if (service) {
                    setConfigForm(prev => ({
                      ...prev,
                      defaultDuration: service.sessionDuration
                    }))
                  }
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.sessionDuration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedService && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{selectedService.type}</Badge>
                <Badge variant="outline">${selectedService.costPerSession}</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'config' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('config')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Configuration
        </Button>
        <Button
          variant={activeTab === 'optimize' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('optimize')}
        >
          <Zap className="h-4 w-4 mr-2" />
          Optimization
        </Button>
        <Button
          variant={activeTab === 'adjust' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('adjust')}
        >
          <Edit className="h-4 w-4 mr-2" />
          Adjustments
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && selectedService && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Duration Configuration
              </CardTitle>
              <CardDescription>
                Configure session duration settings for {selectedService.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="defaultDuration">Default Duration (minutes)</Label>
                  <Input
                    id="defaultDuration"
                    type="number"
                    min="15"
                    max="480"
                    value={configForm.defaultDuration}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, defaultDuration: parseInt(e.target.value) || 60 }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="minDuration">Minimum Duration (minutes)</Label>
                  <Input
                    id="minDuration"
                    type="number"
                    min="15"
                    max="480"
                    value={configForm.minDuration}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, minDuration: parseInt(e.target.value) || 30 }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxDuration">Maximum Duration (minutes)</Label>
                  <Input
                    id="maxDuration"
                    type="number"
                    min="15"
                    max="480"
                    value={configForm.maxDuration}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, maxDuration: parseInt(e.target.value) || 120 }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="breakBetweenSessions">Break Between Sessions (minutes)</Label>
                  <Input
                    id="breakBetweenSessions"
                    type="number"
                    min="0"
                    max="60"
                    value={configForm.breakBetweenSessions}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, breakBetweenSessions: parseInt(e.target.value) || 15 }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bufferTime">Buffer Time (minutes)</Label>
                  <Input
                    id="bufferTime"
                    type="number"
                    min="0"
                    max="30"
                    value={configForm.bufferTime}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, bufferTime: parseInt(e.target.value) || 5 }))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Allowed Durations</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {configForm.allowedDurations.map((duration) => (
                    <Badge key={duration} variant="outline" className="flex items-center space-x-1">
                      <span>{duration} min</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAllowedDuration(duration)}
                        className="h-4 w-4 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2 mt-2">
                  {[30, 45, 60, 90, 120].map((duration) => (
                    <Button
                      key={duration}
                      variant="outline"
                      size="sm"
                      onClick={() => addAllowedDuration(duration)}
                      disabled={configForm.allowedDurations.includes(duration)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {duration} min
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={configForm.isActive}
                  onCheckedChange={(checked) => setConfigForm(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Active Configuration</Label>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveConfig} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Optimization Tab */}
      {activeTab === 'optimize' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Time Slot Optimization
              </CardTitle>
              <CardDescription>
                Optimize time slot allocation for maximum efficiency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="optimizeDate">Date</Label>
                  <Input
                    id="optimizeDate"
                    type="date"
                    value={optimizationForm.date}
                    onChange={(e) => setOptimizationForm(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="optimizeFor">Optimization Criteria</Label>
                  <Select 
                    value={optimizationForm.optimizeFor} 
                    onValueChange={(value: any) => setOptimizationForm(prev => ({ ...prev, optimizeFor: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFFICIENCY">Maximum Efficiency</SelectItem>
                      <SelectItem value="PATIENT_COMFORT">Patient Comfort</SelectItem>
                      <SelectItem value="THERAPIST_PREFERENCE">Therapist Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Services to Optimize</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {services.map((service) => (
                    <Button
                      key={service.id}
                      variant={optimizationForm.selectedServices.includes(service.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setOptimizationForm(prev => ({
                          ...prev,
                          selectedServices: prev.selectedServices.includes(service.id)
                            ? prev.selectedServices.filter(id => id !== service.id)
                            : [...prev.selectedServices, service.id]
                        }))
                      }}
                    >
                      {service.name}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleOptimizeTimeSlots}
                disabled={optimizing || !optimizationForm.date || !therapistId}
                className="w-full"
              >
                {optimizing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {optimizing ? 'Optimizing...' : 'Optimize Time Slots'}
              </Button>

              {/* Optimization Results */}
              {optimizedSlots.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium">Optimized Time Slots</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {optimizedSlots.slice(0, 12).map((slot, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`p-3 ${getOptimizationColor(slot.optimizationScore)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{formatTime(slot.time)}</span>
                            {slot.isOptimal && <CheckCircle className="h-4 w-4" />}
                          </div>
                          <div className="text-sm space-y-1">
                            <div>{slot.duration} minutes</div>
                            <div>{slot.serviceName}</div>
                            <div className="text-xs">Score: {slot.optimizationScore}</div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                  
                  {optimizedSlots.length > 12 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... and {optimizedSlots.length - 12} more optimized slots
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Adjustments Tab */}
      {activeTab === 'adjust' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Edit className="h-5 w-5 mr-2" />
                Session Adjustments
              </CardTitle>
              <CardDescription>
                Adjust individual session durations and timing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Session Adjustments</h3>
                <p className="text-muted-foreground">
                  This feature allows you to adjust individual session durations and timing.
                  Select a session from the calendar to make adjustments.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
