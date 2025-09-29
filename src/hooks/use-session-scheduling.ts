import { useState, useCallback } from 'react'

interface ScheduleSessionData {
  patientId: string
  therapistId: string
  serviceId: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  notes?: string
  isRecurring?: boolean
  recurringPattern?: {
    frequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
    interval: number
    endDate?: string
    occurrences?: number
    daysOfWeek?: number[]
    dayOfMonth?: number
  }
  schedulingRules?: {
    allowWeekends: boolean
    allowHolidays: boolean
    minAdvanceBooking: number
    maxAdvanceBooking: number
    preferredTimeSlots?: string[]
    avoidTimeSlots?: string[]
  }
}

interface AvailabilityCheckData {
  therapistId: string
  serviceId: string
  date: string
  duration: number
  timeSlots?: string[]
  excludeSessionId?: string
}

interface RescheduleSessionData {
  sessionId: string
  newDate: string
  newTime: string
  reason: string
  notifyPatient?: boolean
  notifyTherapist?: boolean
}

interface BulkScheduleData {
  sessions: ScheduleSessionData[]
  templateId?: string
}

interface SchedulingTemplate {
  id: string
  name: string
  description?: string
  serviceId: string
  therapistId: string
  defaultDuration: number
  defaultTimeSlots: string[]
  schedulingRules: any
  isActive: boolean
  service: {
    id: string
    name: string
    type: string
  }
  therapist: {
    id: string
    firstName: string
    lastName: string
  }
}

interface SchedulingRule {
  id: string
  name: string
  description?: string
  type: 'TIME_CONSTRAINT' | 'CAPACITY_LIMIT' | 'ADVANCE_BOOKING' | 'RECURRING_PATTERN' | 'CUSTOM'
  conditions: any
  actions: {
    type: 'ALLOW' | 'DENY' | 'WARN' | 'AUTO_RESCHEDULE'
    message?: string
    autoRescheduleOptions?: any
  }
  scope: {
    therapistIds?: string[]
    serviceIds?: string[]
    patientIds?: string[]
    applyToAll: boolean
  }
  priority: number
  isActive: boolean
}

interface UseSessionSchedulingReturn {
  loading: boolean
  error: string | null
  
  // Availability checking
  checkAvailability: (data: AvailabilityCheckData) => Promise<{
    available: boolean
    availableSlots: string[]
    therapistSchedule: any
    existingSessions: any[]
  }>
  
  // Session scheduling
  scheduleSession: (data: ScheduleSessionData) => Promise<{
    sessions: any[]
    totalSessions: number
    isRecurring: boolean
    recurringPattern?: any
  }>
  
  // Bulk scheduling
  bulkSchedule: (data: BulkScheduleData) => Promise<{
    successful: any[]
    failed: any[]
    summary: {
      total: number
      successful: number
      failed: number
    }
  }>
  
  // Rescheduling
  rescheduleSession: (data: RescheduleSessionData) => Promise<{
    session: any
    notifications: {
      patient: boolean
      therapist: boolean
    }
  }>
  
  // Templates
  getTemplates: (params: {
    therapistId?: string
    serviceId?: string
    isActive?: boolean
  }) => Promise<{
    templates: SchedulingTemplate[]
    total: number
  }>
  
  createTemplate: (data: {
    name: string
    description?: string
    serviceId: string
    therapistId: string
    defaultDuration: number
    defaultTimeSlots: string[]
    schedulingRules: any
    isActive?: boolean
  }) => Promise<{
    template: SchedulingTemplate
  }>
  
  updateTemplate: (data: {
    id: string
    name?: string
    description?: string
    serviceId?: string
    therapistId?: string
    defaultDuration?: number
    defaultTimeSlots?: string[]
    schedulingRules?: any
    isActive?: boolean
  }) => Promise<{
    template: SchedulingTemplate
  }>
  
  deleteTemplate: (templateId: string) => Promise<{
    template: any
  }>
  
  applyTemplate: (data: {
    templateId: string
    patientId: string
    startDate: string
    endDate?: string
    occurrences?: number
    customizations?: {
      duration?: number
      timeSlots?: string[]
      notes?: string
    }
  }) => Promise<{
    sessions: any[]
    template: any
    summary: any
  }>
  
  // Rules
  getRules: (params: {
    therapistId?: string
    serviceId?: string
    type?: string
    isActive?: boolean
  }) => Promise<{
    rules: SchedulingRule[]
    total: number
  }>
  
  createRule: (data: {
    name: string
    description?: string
    type: 'TIME_CONSTRAINT' | 'CAPACITY_LIMIT' | 'ADVANCE_BOOKING' | 'RECURRING_PATTERN' | 'CUSTOM'
    conditions: any
    actions: any
    scope: any
    priority?: number
    isActive?: boolean
  }) => Promise<{
    rule: SchedulingRule
  }>
  
  updateRule: (data: {
    id: string
    name?: string
    description?: string
    type?: string
    conditions?: any
    actions?: any
    scope?: any
    priority?: number
    isActive?: boolean
  }) => Promise<{
    rule: SchedulingRule
  }>
  
  deleteRule: (ruleId: string) => Promise<{
    rule: any
  }>
  
  validateScheduling: (data: {
    therapistId: string
    serviceId: string
    scheduledDate: string
    scheduledTime: string
    duration: number
    patientId?: string
    sessionId?: string
  }) => Promise<{
    valid: boolean
    violations: any[]
    warnings: any[]
    validationResults: any[]
    summary: any
  }>
  
  getConflicts: (params: {
    therapistId: string
    date: string
  }) => Promise<{
    conflicts: any[]
    sessions: any[]
    summary: any
  }>
  
  clearError: () => void
}

export function useSessionScheduling(): UseSessionSchedulingReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkAvailability = useCallback(async (data: AvailabilityCheckData): Promise<{
    available: boolean
    availableSlots: string[]
    therapistSchedule: any
    existingSessions: any[]
  }> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      searchParams.append('action', 'availability')
      searchParams.append('therapistId', data.therapistId)
      searchParams.append('serviceId', data.serviceId)
      searchParams.append('date', data.date)
      searchParams.append('duration', data.duration.toString())
      if (data.timeSlots) searchParams.append('timeSlots', data.timeSlots.join(','))
      if (data.excludeSessionId) searchParams.append('excludeSessionId', data.excludeSessionId)

      const response = await fetch(`/api/sessions/scheduling?${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to check availability')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check availability'
      setError(errorMessage)
      console.error('Error checking availability:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const scheduleSession = useCallback(async (data: ScheduleSessionData): Promise<{
    sessions: any[]
    totalSessions: number
    isRecurring: boolean
    recurringPattern?: any
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/scheduling?action=schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to schedule session')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to schedule session'
      setError(errorMessage)
      console.error('Error scheduling session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const bulkSchedule = useCallback(async (data: BulkScheduleData): Promise<{
    successful: any[]
    failed: any[]
    summary: {
      total: number
      successful: number
      failed: number
    }
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/scheduling?action=bulk-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to bulk schedule sessions')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk schedule sessions'
      setError(errorMessage)
      console.error('Error bulk scheduling sessions:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const rescheduleSession = useCallback(async (data: RescheduleSessionData): Promise<{
    session: any
    notifications: {
      patient: boolean
      therapist: boolean
    }
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/scheduling?action=reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reschedule session')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reschedule session'
      setError(errorMessage)
      console.error('Error rescheduling session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getTemplates = useCallback(async (params: {
    therapistId?: string
    serviceId?: string
    isActive?: boolean
  }): Promise<{
    templates: SchedulingTemplate[]
    total: number
  }> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      if (params.therapistId) searchParams.append('therapistId', params.therapistId)
      if (params.serviceId) searchParams.append('serviceId', params.serviceId)
      if (params.isActive !== undefined) searchParams.append('isActive', params.isActive.toString())

      const response = await fetch(`/api/sessions/scheduling/templates?${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get templates')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get templates'
      setError(errorMessage)
      console.error('Error getting templates:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createTemplate = useCallback(async (data: {
    name: string
    description?: string
    serviceId: string
    therapistId: string
    defaultDuration: number
    defaultTimeSlots: string[]
    schedulingRules: any
    isActive?: boolean
  }): Promise<{
    template: SchedulingTemplate
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/scheduling/templates?action=create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create template')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create template'
      setError(errorMessage)
      console.error('Error creating template:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTemplate = useCallback(async (data: {
    id: string
    name?: string
    description?: string
    serviceId?: string
    therapistId?: string
    defaultDuration?: number
    defaultTimeSlots?: string[]
    schedulingRules?: any
    isActive?: boolean
  }): Promise<{
    template: SchedulingTemplate
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/scheduling/templates?action=update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update template')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update template'
      setError(errorMessage)
      console.error('Error updating template:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteTemplate = useCallback(async (templateId: string): Promise<{
    template: any
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/scheduling/templates?templateId=${templateId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete template')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete template'
      setError(errorMessage)
      console.error('Error deleting template:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const applyTemplate = useCallback(async (data: {
    templateId: string
    patientId: string
    startDate: string
    endDate?: string
    occurrences?: number
    customizations?: {
      duration?: number
      timeSlots?: string[]
      notes?: string
    }
  }): Promise<{
    sessions: any[]
    template: any
    summary: any
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/scheduling/templates?action=apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to apply template')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply template'
      setError(errorMessage)
      console.error('Error applying template:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getRules = useCallback(async (params: {
    therapistId?: string
    serviceId?: string
    type?: string
    isActive?: boolean
  }): Promise<{
    rules: SchedulingRule[]
    total: number
  }> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      searchParams.append('action', 'list')
      if (params.therapistId) searchParams.append('therapistId', params.therapistId)
      if (params.serviceId) searchParams.append('serviceId', params.serviceId)
      if (params.type) searchParams.append('type', params.type)
      if (params.isActive !== undefined) searchParams.append('isActive', params.isActive.toString())

      const response = await fetch(`/api/sessions/scheduling/rules?${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get rules')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get rules'
      setError(errorMessage)
      console.error('Error getting rules:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createRule = useCallback(async (data: {
    name: string
    description?: string
    type: 'TIME_CONSTRAINT' | 'CAPACITY_LIMIT' | 'ADVANCE_BOOKING' | 'RECURRING_PATTERN' | 'CUSTOM'
    conditions: any
    actions: any
    scope: any
    priority?: number
    isActive?: boolean
  }): Promise<{
    rule: SchedulingRule
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/scheduling/rules?action=create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create rule')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create rule'
      setError(errorMessage)
      console.error('Error creating rule:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateRule = useCallback(async (data: {
    id: string
    name?: string
    description?: string
    type?: string
    conditions?: any
    actions?: any
    scope?: any
    priority?: number
    isActive?: boolean
  }): Promise<{
    rule: SchedulingRule
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/scheduling/rules?action=update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update rule')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update rule'
      setError(errorMessage)
      console.error('Error updating rule:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteRule = useCallback(async (ruleId: string): Promise<{
    rule: any
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/sessions/scheduling/rules?ruleId=${ruleId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete rule')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete rule'
      setError(errorMessage)
      console.error('Error deleting rule:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const validateScheduling = useCallback(async (data: {
    therapistId: string
    serviceId: string
    scheduledDate: string
    scheduledTime: string
    duration: number
    patientId?: string
    sessionId?: string
  }): Promise<{
    valid: boolean
    violations: any[]
    warnings: any[]
    validationResults: any[]
    summary: any
  }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/sessions/scheduling/rules?action=validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to validate scheduling')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate scheduling'
      setError(errorMessage)
      console.error('Error validating scheduling:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const getConflicts = useCallback(async (params: {
    therapistId: string
    date: string
  }): Promise<{
    conflicts: any[]
    sessions: any[]
    summary: any
  }> => {
    try {
      setLoading(true)
      setError(null)

      const searchParams = new URLSearchParams()
      searchParams.append('action', 'conflicts')
      searchParams.append('therapistId', params.therapistId)
      searchParams.append('date', params.date)

      const response = await fetch(`/api/sessions/scheduling/rules?${searchParams.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get conflicts')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get conflicts'
      setError(errorMessage)
      console.error('Error getting conflicts:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    loading,
    error,
    checkAvailability,
    scheduleSession,
    bulkSchedule,
    rescheduleSession,
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
    getRules,
    createRule,
    updateRule,
    deleteRule,
    validateScheduling,
    getConflicts,
    clearError
  }
}
