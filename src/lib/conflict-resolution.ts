import { db } from '@/lib/db'

export interface AvailabilityCheck {
  available: boolean
  reason?: string
  conflicts?: Conflict[]
  suggestions?: TimeSlotSuggestion[]
}

export interface Conflict {
  type: 'SCHEDULE_CONFLICT' | 'BREAK_CONFLICT' | 'WORKING_HOURS' | 'EXISTING_SESSION' | 'THERAPIST_UNAVAILABLE'
  message: string
  severity: 'ERROR' | 'WARNING' | 'INFO'
  conflictingItem?: {
    id: string
    type: string
    startTime: string
    endTime: string
    description?: string
  }
}

export interface TimeSlotSuggestion {
  time: string
  duration: number
  reason: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface AvailabilityRequest {
  therapistId: string
  date: Date
  startTime: string
  endTime: string
  duration: number
  excludeSessionId?: string
  serviceType?: string
  patientId?: string
}

export interface BulkAvailabilityRequest {
  therapistId: string
  date: Date
  timeSlots: Array<{
    startTime: string
    endTime: string
    duration: number
  }>
  excludeSessionIds?: string[]
}

export class ConflictResolutionService {
  /**
   * Check availability for a single time slot
   */
  static async checkAvailability(request: AvailabilityRequest): Promise<AvailabilityCheck> {
    const conflicts: Conflict[] = []
    const suggestions: TimeSlotSuggestion[] = []

    try {
      // 1. Check therapist schedule
      const scheduleConflict = await this.checkTherapistSchedule(request)
      if (scheduleConflict) {
        conflicts.push(scheduleConflict)
      }

      // 2. Check existing sessions
      const sessionConflicts = await this.checkExistingSessions(request)
      conflicts.push(...sessionConflicts)

      // 3. Check break times
      const breakConflict = await this.checkBreakTimes(request)
      if (breakConflict) {
        conflicts.push(breakConflict)
      }

      // 4. Check working hours
      const workingHoursConflict = await this.checkWorkingHours(request)
      if (workingHoursConflict) {
        conflicts.push(workingHoursConflict)
      }

      // 5. Check therapist availability (holidays, time off, etc.)
      const availabilityConflict = await this.checkTherapistAvailability(request)
      if (availabilityConflict) {
        conflicts.push(availabilityConflict)
      }

      // 6. Generate suggestions if conflicts exist
      if (conflicts.length > 0) {
        suggestions.push(...await this.generateTimeSlotSuggestions(request))
      }

      const hasErrors = conflicts.some(c => c.severity === 'ERROR')
      const hasWarnings = conflicts.some(c => c.severity === 'WARNING')

      return {
        available: !hasErrors,
        reason: hasErrors ? 'Conflicts prevent scheduling' : hasWarnings ? 'Scheduling possible with warnings' : undefined,
        conflicts,
        suggestions
      }

    } catch (error) {
      console.error('Error checking availability:', error)
      return {
        available: false,
        reason: 'Error checking availability',
        conflicts: [{
          type: 'THERAPIST_UNAVAILABLE',
          message: 'Unable to verify availability',
          severity: 'ERROR'
        }]
      }
    }
  }

  /**
   * Check availability for multiple time slots
   */
  static async checkBulkAvailability(request: BulkAvailabilityRequest): Promise<{
    [key: string]: AvailabilityCheck
  }> {
    const results: { [key: string]: AvailabilityCheck } = {}

    for (const timeSlot of request.timeSlots) {
      const key = `${timeSlot.startTime}-${timeSlot.endTime}`
      results[key] = await this.checkAvailability({
        therapistId: request.therapistId,
        date: request.date,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        duration: timeSlot.duration,
        excludeSessionId: request.excludeSessionIds?.[0]
      })
    }

    return results
  }

  /**
   * Check if therapist has a schedule for the requested day
   */
  private static async checkTherapistSchedule(request: AvailabilityRequest): Promise<Conflict | null> {
    const dayOfWeek = request.date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    
    const schedule = await db.therapistSchedule.findFirst({
      where: {
        therapistId: request.therapistId,
        dayOfWeek: dayOfWeek as any,
        isActive: true
      }
    })

    if (!schedule) {
      return {
        type: 'THERAPIST_UNAVAILABLE',
        message: `Therapist is not scheduled to work on ${dayOfWeek}`,
        severity: 'ERROR'
      }
    }

    return null
  }

  /**
   * Check for conflicts with existing sessions
   */
  private static async checkExistingSessions(request: AvailabilityRequest): Promise<Conflict[]> {
    const conflicts: Conflict[] = []

    const whereClause: any = {
      therapistId: request.therapistId,
      scheduledDate: {
        gte: new Date(request.date.getFullYear(), request.date.getMonth(), request.date.getDate()),
        lt: new Date(request.date.getFullYear(), request.date.getMonth(), request.date.getDate() + 1)
      },
      status: {
        in: ['SCHEDULED', 'IN_PROGRESS']
      }
    }

    if (request.excludeSessionId) {
      whereClause.id = { not: request.excludeSessionId }
    }

    const existingSessions = await db.patientSession.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        serviceAssignment: {
          include: {
            service: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    const requestStart = this.timeToMinutes(request.startTime)
    const requestEnd = requestStart + request.duration

    for (const session of existingSessions) {
      const sessionStart = this.timeToMinutes(session.scheduledTime)
      const sessionEnd = sessionStart + session.duration

      // Check for overlap
      if (requestStart < sessionEnd && requestEnd > sessionStart) {
        conflicts.push({
          type: 'EXISTING_SESSION',
          message: `Time slot conflicts with existing session for ${session.patient.firstName} ${session.patient.lastName}`,
          severity: 'ERROR',
          conflictingItem: {
            id: session.id,
            type: 'session',
            startTime: session.scheduledTime,
            endTime: this.minutesToTime(sessionEnd),
            description: `${session.serviceAssignment.service.name} - ${session.patient.firstName} ${session.patient.lastName}`
          }
        })
      }
    }

    return conflicts
  }

  /**
   * Check for conflicts with break times
   */
  private static async checkBreakTimes(request: AvailabilityRequest): Promise<Conflict | null> {
    const dayOfWeek = request.date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    
    const schedule = await db.therapistSchedule.findFirst({
      where: {
        therapistId: request.therapistId,
        dayOfWeek: dayOfWeek as any,
        isActive: true
      }
    })

    if (!schedule || !schedule.breakStart || !schedule.breakEnd) {
      return null
    }

    const requestStart = this.timeToMinutes(request.startTime)
    const requestEnd = requestStart + request.duration
    const breakStart = this.timeToMinutes(schedule.breakStart)
    const breakEnd = this.timeToMinutes(schedule.breakEnd)

    // Check for overlap with break time
    if (requestStart < breakEnd && requestEnd > breakStart) {
      return {
        type: 'BREAK_CONFLICT',
        message: `Time slot conflicts with therapist's break time (${schedule.breakStart} - ${schedule.breakEnd})`,
        severity: 'ERROR',
        conflictingItem: {
          id: schedule.id,
          type: 'break',
          startTime: schedule.breakStart,
          endTime: schedule.breakEnd,
          description: 'Therapist break time'
        }
      }
    }

    return null
  }

  /**
   * Check if time slot is within working hours
   */
  private static async checkWorkingHours(request: AvailabilityRequest): Promise<Conflict | null> {
    const dayOfWeek = request.date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    
    const schedule = await db.therapistSchedule.findFirst({
      where: {
        therapistId: request.therapistId,
        dayOfWeek: dayOfWeek as any,
        isActive: true
      }
    })

    if (!schedule) {
      return null
    }

    const requestStart = this.timeToMinutes(request.startTime)
    const requestEnd = requestStart + request.duration
    const workStart = this.timeToMinutes(schedule.startTime)
    const workEnd = this.timeToMinutes(schedule.endTime)

    if (requestStart < workStart || requestEnd > workEnd) {
      return {
        type: 'WORKING_HOURS',
        message: `Time slot is outside working hours (${schedule.startTime} - ${schedule.endTime})`,
        severity: 'ERROR',
        conflictingItem: {
          id: schedule.id,
          type: 'working_hours',
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          description: 'Therapist working hours'
        }
      }
    }

    return null
  }

  /**
   * Check therapist general availability (holidays, time off, etc.)
   */
  private static async checkTherapistAvailability(request: AvailabilityRequest): Promise<Conflict | null> {
    // This could be extended to check for:
    // - Holiday schedules
    // - Time off requests
    // - Therapist-specific availability overrides
    // - Emergency unavailability
    
    // For now, we'll just check if the therapist is active
    const therapist = await db.therapist.findUnique({
      where: { id: request.therapistId },
      select: { isActive: true, canTakeConsultations: true }
    })

    if (!therapist || !therapist.isActive) {
      return {
        type: 'THERAPIST_UNAVAILABLE',
        message: 'Therapist is not active',
        severity: 'ERROR'
      }
    }

    if (!therapist.canTakeConsultations) {
      return {
        type: 'THERAPIST_UNAVAILABLE',
        message: 'Therapist is not accepting new consultations',
        severity: 'ERROR'
      }
    }

    return null
  }

  /**
   * Generate alternative time slot suggestions
   */
  private static async generateTimeSlotSuggestions(request: AvailabilityRequest): Promise<TimeSlotSuggestion[]> {
    const suggestions: TimeSlotSuggestion[] = []
    const dayOfWeek = request.date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    
    const schedule = await db.therapistSchedule.findFirst({
      where: {
        therapistId: request.therapistId,
        dayOfWeek: dayOfWeek as any,
        isActive: true
      }
    })

    if (!schedule) {
      return suggestions
    }

    const workStart = this.timeToMinutes(schedule.startTime)
    const workEnd = this.timeToMinutes(schedule.endTime)
    const breakStart = schedule.breakStart ? this.timeToMinutes(schedule.breakStart) : null
    const breakEnd = schedule.breakEnd ? this.timeToMinutes(schedule.breakEnd) : null

    // Get existing sessions for the day
    const existingSessions = await db.patientSession.findMany({
      where: {
        therapistId: request.therapistId,
        scheduledDate: {
          gte: new Date(request.date.getFullYear(), request.date.getMonth(), request.date.getDate()),
          lt: new Date(request.date.getFullYear(), request.date.getMonth(), request.date.getDate() + 1)
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      }
    })

    // Generate suggestions before and after the requested time
    const requestedTime = this.timeToMinutes(request.startTime)
    const duration = request.duration

    // Suggest earlier time slots
    for (let time = requestedTime - duration; time >= workStart; time -= 30) {
      if (this.isTimeSlotAvailable(time, duration, existingSessions, breakStart, breakEnd)) {
        suggestions.push({
          time: this.minutesToTime(time),
          duration,
          reason: 'Earlier time slot available',
          priority: 'MEDIUM'
        })
        break
      }
    }

    // Suggest later time slots
    for (let time = requestedTime + duration; time + duration <= workEnd; time += 30) {
      if (this.isTimeSlotAvailable(time, duration, existingSessions, breakStart, breakEnd)) {
        suggestions.push({
          time: this.minutesToTime(time),
          duration,
          reason: 'Later time slot available',
          priority: 'MEDIUM'
        })
        break
      }
    }

    // Suggest alternative days if no slots available
    if (suggestions.length === 0) {
      // This could be extended to suggest the next available day
      suggestions.push({
        time: schedule.startTime,
        duration,
        reason: 'Consider scheduling on a different day',
        priority: 'LOW'
      })
    }

    return suggestions
  }

  /**
   * Check if a time slot is available
   */
  private static isTimeSlotAvailable(
    startTime: number,
    duration: number,
    existingSessions: any[],
    breakStart: number | null,
    breakEnd: number | null
  ): boolean {
    const endTime = startTime + duration

    // Check break time conflict
    if (breakStart && breakEnd && startTime < breakEnd && endTime > breakStart) {
      return false
    }

    // Check existing session conflicts
    for (const session of existingSessions) {
      const sessionStart = this.timeToMinutes(session.scheduledTime)
      const sessionEnd = sessionStart + session.duration

      if (startTime < sessionEnd && endTime > sessionStart) {
        return false
      }
    }

    return true
  }

  /**
   * Convert time string (HH:mm) to minutes
   */
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  /**
   * Convert minutes to time string (HH:mm)
   */
  private static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  /**
   * Resolve conflicts automatically when possible
   */
  static async resolveConflicts(
    therapistId: string,
    date: Date,
    duration: number,
    preferences?: {
      preferredTime?: string
      maxTimeShift?: number // in minutes
      allowDifferentDay?: boolean
    }
  ): Promise<{
    resolved: boolean
    suggestedTime?: string
    suggestedDate?: Date
    reason?: string
  }> {
    try {
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
      
      const schedule = await db.therapistSchedule.findFirst({
        where: {
          therapistId,
          dayOfWeek: dayOfWeek as any,
          isActive: true
        }
      })

      if (!schedule) {
        return {
          resolved: false,
          reason: 'Therapist not available on this day'
        }
      }

      const workStart = this.timeToMinutes(schedule.startTime)
      const workEnd = this.timeToMinutes(schedule.endTime)
      const breakStart = schedule.breakStart ? this.timeToMinutes(schedule.breakStart) : null
      const breakEnd = schedule.breakEnd ? this.timeToMinutes(schedule.breakEnd) : null

      // Get existing sessions
      const existingSessions = await db.patientSession.findMany({
        where: {
          therapistId,
          scheduledDate: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
          },
          status: {
            in: ['SCHEDULED', 'IN_PROGRESS']
          }
        }
      })

      const preferredTime = preferences?.preferredTime ? this.timeToMinutes(preferences.preferredTime) : null
      const maxShift = preferences?.maxTimeShift || 60 // Default 1 hour

      // Try to find a slot near the preferred time
      if (preferredTime) {
        for (let shift = 0; shift <= maxShift; shift += 15) {
          // Try earlier
          const earlierTime = preferredTime - shift
          if (earlierTime >= workStart && this.isTimeSlotAvailable(earlierTime, duration, existingSessions, breakStart, breakEnd)) {
            return {
              resolved: true,
              suggestedTime: this.minutesToTime(earlierTime),
              suggestedDate: date,
              reason: `Found available slot ${shift} minutes earlier`
            }
          }

          // Try later
          const laterTime = preferredTime + shift
          if (laterTime + duration <= workEnd && this.isTimeSlotAvailable(laterTime, duration, existingSessions, breakStart, breakEnd)) {
            return {
              resolved: true,
              suggestedTime: this.minutesToTime(laterTime),
              suggestedDate: date,
              reason: `Found available slot ${shift} minutes later`
            }
          }
        }
      }

      // Try to find any available slot
      for (let time = workStart; time + duration <= workEnd; time += 15) {
        if (this.isTimeSlotAvailable(time, duration, existingSessions, breakStart, breakEnd)) {
          return {
            resolved: true,
            suggestedTime: this.minutesToTime(time),
            suggestedDate: date,
            reason: 'Found first available slot'
          }
        }
      }

      return {
        resolved: false,
        reason: 'No available slots found for this day'
      }

    } catch (error) {
      console.error('Error resolving conflicts:', error)
      return {
        resolved: false,
        reason: 'Error resolving conflicts'
      }
    }
  }
}
