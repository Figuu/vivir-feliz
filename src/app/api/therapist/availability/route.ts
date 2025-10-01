import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const availabilityQuerySchema = z.object({
  therapistId: z.string().uuid('Invalid therapist ID'),
  date: z.string().optional(), // ISO date string
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  includeConflicts: z.string().transform(val => val === 'true').default(false),
  includeSessions: z.string().transform(val => val === 'true').default(false),
  timezone: z.string().optional().default('UTC')
})

const availabilityCheckSchema = z.object({
  therapistId: z.string().uuid('Invalid therapist ID'),
  date: z.string(), // ISO date string
  startTime: z.string(), // HH:MM format
  endTime: z.string(), // HH:MM format
  duration: z.number().min(15).max(300).default(60), // minutes
  excludeSessionId: z.string().uuid().optional()
})

const availabilityUpdateSchema = z.object({
  therapistId: z.string().uuid('Invalid therapist ID'),
  date: z.string(), // ISO date string
  startTime: z.string(), // HH:MM format
  endTime: z.string(), // HH:MM format
  isAvailable: z.boolean(),
  reason: z.string().max(200).optional(),
  breakStartTime: z.string().optional(), // HH:MM format
  breakEndTime: z.string().optional(), // HH:MM format
  maxSessions: z.number().min(0).max(20).optional(),
  sessionDuration: z.number().min(15).max(300).optional(),
  bufferTime: z.number().min(0).max(60).optional()
})

// GET /api/therapist/availability - Get therapist availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = availabilityQuerySchema.safeParse({
      therapistId: searchParams.get('therapistId'),
      date: searchParams.get('date'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      includeConflicts: searchParams.get('includeConflicts'),
      includeSessions: searchParams.get('includeSessions'),
      timezone: searchParams.get('timezone')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { therapistId, date, startDate, endDate, includeConflicts, includeSessions, timezone } = validation.data

    // Check if therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: therapistId },
      select: {
        id: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Calculate date range
    let queryStartDate: Date
    let queryEndDate: Date

    if (date) {
      // Single date
      queryStartDate = new Date(date)
      queryEndDate = new Date(date)
      queryEndDate.setHours(23, 59, 59, 999)
    } else if (startDate && endDate) {
      // Date range
      queryStartDate = new Date(startDate)
      queryEndDate = new Date(endDate)
      queryEndDate.setHours(23, 59, 59, 999)
    } else {
      // Default to today
      const today = new Date()
      queryStartDate = new Date(today)
      queryEndDate = new Date(today)
      queryEndDate.setHours(23, 59, 59, 999)
    }

    // Get therapist schedules
    const schedules = await db.therapistSchedule.findMany({
      where: {
        therapistId,
        OR: [
          {
            createdAt: { lte: queryEndDate },
            updatedAt: { gte: queryStartDate }
          },
          {
            createdAt: { lte: queryEndDate },
            updatedAt: { gte: queryStartDate }
          }
        ]
      },
      orderBy: [
        { createdAt: 'asc' },
        { dayOfWeek: 'asc' }
      ]
    })

    // Get existing sessions if requested
    let sessions: any[] = []
    if (includeSessions) {
      sessions = await db.patientSession.findMany({
        where: {
          therapistId,
          scheduledDate: {
            gte: queryStartDate,
            lte: queryEndDate
          },
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
        },
        select: {
          id: true,
          scheduledDate: true,
          scheduledTime: true,
          duration: true,
          status: true,
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
        },
        orderBy: [
          { scheduledDate: 'asc' },
          { scheduledTime: 'asc' }
        ]
      })
    }

    // Generate availability data
    const availability = generateAvailabilityData(
      queryStartDate,
      queryEndDate,
      schedules,
      sessions,
      includeConflicts
    )

    return NextResponse.json({
      success: true,
      data: {
        therapist,
        dateRange: {
          startDate: queryStartDate.toISOString(),
          endDate: queryEndDate.toISOString()
        },
        availability,
        sessions: includeSessions ? sessions : undefined,
        timezone
      }
    })

  } catch (error) {
    console.error('Error fetching therapist availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/therapist/availability - Check availability for specific time
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = availabilityCheckSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { therapistId, date, startTime, endTime, duration, excludeSessionId } = validation.data

    // Check if therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: therapistId }
    })

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Get therapist schedule for the date
    const targetDate = new Date(date)
    const dayOfWeek = getDayOfWeek(targetDate) as any
    
    const schedule = await db.therapistSchedule.findFirst({
      where: {
        therapistId,
        dayOfWeek,
        createdAt: { lte: targetDate },
        OR: [
          { updatedAt: { gte: targetDate } },
          { updatedAt: { gte: targetDate } }
        ]
      }
    })

    // Check for conflicts with existing sessions
    const conflictingSessions = await db.patientSession.findMany({
      where: {
        therapistId,
        scheduledDate: targetDate,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        id: excludeSessionId ? { not: excludeSessionId } : undefined
      }
    })

    // Perform availability check
    const availabilityCheck = checkTimeSlotAvailability(
      schedule,
      startTime,
      endTime,
      duration,
      conflictingSessions
    )

    return NextResponse.json({
      success: true,
      data: {
        available: availabilityCheck.available,
        reason: availabilityCheck.reason,
        conflicts: availabilityCheck.conflicts,
        suggestions: availabilityCheck.suggestions,
        schedule: schedule ? {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          breakStartTime: schedule.breakStart,
          breakEndTime: schedule.breakEnd,
          isWorkingDay: schedule.isActive
        } : null
      }
    })

  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/therapist/availability - Update availability
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = availabilityUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { 
      therapistId, 
      date, 
      startTime, 
      endTime, 
      isAvailable, 
      reason,
      breakStartTime,
      breakEndTime,
      maxSessions,
      sessionDuration,
      bufferTime
    } = validation.data

    // Check if therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: therapistId }
    })

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Check for existing sessions that would conflict
    if (!isAvailable) {
      const targetDate = new Date(date)
      const conflictingSessions = await db.patientSession.findMany({
        where: {
          therapistId,
          scheduledDate: targetDate,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
        }
      })

      if (conflictingSessions.length > 0) {
        return NextResponse.json(
          { 
            error: 'Cannot mark as unavailable due to existing sessions',
            conflictingSessions: conflictingSessions.map(s => ({
              id: s.id,
              scheduledTime: s.scheduledTime,
              duration: s.duration,
              patientId: s.patientId
            }))
          },
          { status: 409 }
        )
      }
    }

    // Update or create schedule entry
    const targetDate = new Date(date)
    const dayOfWeek = getDayOfWeek(targetDate) as any
    
    const existingSchedule = await db.therapistSchedule.findFirst({
      where: {
        therapistId,
        dayOfWeek,
        createdAt: { lte: targetDate },
        OR: [
          { updatedAt: { gte: targetDate } },
          { updatedAt: { gte: targetDate } }
        ]
      }
    })

    if (existingSchedule) {
      // Update existing schedule
      const updatedSchedule = await db.therapistSchedule.update({
        where: { id: existingSchedule.id },
        data: {
          isActive: isAvailable,
          startTime: isAvailable ? startTime : existingSchedule.startTime,
          endTime: isAvailable ? endTime : existingSchedule.endTime,
          breakStart: isAvailable ? breakStartTime : existingSchedule.breakStart,
          breakEnd: isAvailable ? breakEndTime : existingSchedule.breakEnd,
          breakBetweenSessions: isAvailable ? (bufferTime || existingSchedule.breakBetweenSessions) : existingSchedule.breakBetweenSessions,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Availability updated successfully',
        data: { schedule: updatedSchedule }
      })
    } else {
      // Create new schedule entry
      const newSchedule = await db.therapistSchedule.create({
        data: {
          therapistId,
          dayOfWeek: dayOfWeek as any,
          createdAt: targetDate,
          isActive: isAvailable,
          startTime: isAvailable ? startTime : '09:00',
          endTime: isAvailable ? endTime : '17:00',
          breakStart: isAvailable ? breakStartTime : null,
          breakEnd: isAvailable ? breakEndTime : null,
          breakBetweenSessions: isAvailable ? (bufferTime || 15) : 15
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Availability created successfully',
        data: { schedule: newSchedule }
      }, { status: 201 })
    }

  } catch (error) {
    console.error('Error updating availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function getDayOfWeek(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[date.getDay()]
}

function generateAvailabilityData(
  startDate: Date,
  endDate: Date,
  schedules: any[],
  sessions: any[],
  includeConflicts: boolean
) {
  const availability: any[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dayOfWeek = getDayOfWeek(currentDate)
    const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek)
    const daySessions = sessions.filter(s => 
      s.scheduledDate.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
    )

    const dayAvailability = {
      date: currentDate.toISOString().split('T')[0],
      dayOfWeek,
      isWorkingDay: daySchedule?.isActive || false,
      startTime: daySchedule?.startTime || null,
      endTime: daySchedule?.endTime || null,
      breakStartTime: daySchedule?.breakStart || null,
      breakEndTime: daySchedule?.breakEnd || null,
      maxSessions: 8, // Default value
      sessionDuration: 60, // Default value
      bufferTime: daySchedule?.breakBetweenSessions || 15,
      scheduledSessions: daySessions.length,
      availableSlots: 0,
      conflicts: includeConflicts ? [] as any[] : undefined
    }

    if (daySchedule?.isWorkingDay) {
      // Calculate available time slots
      const availableSlots = calculateAvailableSlots(
        daySchedule,
        daySessions
      )
      dayAvailability.availableSlots = availableSlots.length

      if (includeConflicts) {
        dayAvailability.conflicts = detectConflicts(daySchedule, daySessions)
      }
    }

    availability.push(dayAvailability)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return availability
}

function calculateAvailableSlots(schedule: any, sessions: any[]) {
  const slots: any[] = []
  const startTime = timeToMinutes(schedule.startTime)
  const endTime = timeToMinutes(schedule.endTime)
  const sessionDuration = 60 // Default value
  const bufferTime = schedule.breakBetweenSessions
  const breakStart = schedule.breakStart ? timeToMinutes(schedule.breakStart) : null
  const breakEnd = schedule.breakEnd ? timeToMinutes(schedule.breakEnd) : null

  let currentTime = startTime

  while (currentTime + sessionDuration <= endTime) {
    const slotEndTime = currentTime + sessionDuration

    // Check if slot conflicts with break time
    if (breakStart && breakEnd && currentTime < breakEnd && slotEndTime > breakStart) {
      currentTime = breakEnd
      continue
    }

    // Check if slot conflicts with existing sessions
    const hasConflict = sessions.some(session => {
      const sessionStart = timeToMinutes(session.scheduledTime)
      const sessionEnd = sessionStart + session.duration
      return currentTime < sessionEnd && slotEndTime > sessionStart
    })

    if (!hasConflict) {
      slots.push({
        startTime: minutesToTime(currentTime),
        endTime: minutesToTime(slotEndTime),
        duration: sessionDuration
      })
    }

    currentTime += sessionDuration + bufferTime
  }

  return slots
}

function detectConflicts(schedule: any, sessions: any[]) {
  const conflicts: any[] = []

  // Check for sessions outside working hours
  sessions.forEach(session => {
    const sessionStart = timeToMinutes(session.scheduledTime)
    const sessionEnd = sessionStart + session.duration
    const workStart = timeToMinutes(schedule.startTime)
    const workEnd = timeToMinutes(schedule.endTime)

    if (sessionStart < workStart || sessionEnd > workEnd) {
      conflicts.push({
        type: 'outside_working_hours',
        sessionId: session.id,
        message: 'Session scheduled outside working hours'
      })
    }

    // Check for break time conflicts
    if (schedule.breakStart && schedule.breakEnd) {
      const breakStart = timeToMinutes(schedule.breakStart)
      const breakEnd = timeToMinutes(schedule.breakEnd)

      if (sessionStart < breakEnd && sessionEnd > breakStart) {
        conflicts.push({
          type: 'break_time_conflict',
          sessionId: session.id,
          message: 'Session conflicts with break time'
        })
      }
    }
  })

  // Check for overlapping sessions
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      const session1 = sessions[i]
      const session2 = sessions[j]
      const start1 = timeToMinutes(session1.scheduledTime)
      const end1 = start1 + session1.duration
      const start2 = timeToMinutes(session2.scheduledTime)
      const end2 = start2 + session2.duration

      if (start1 < end2 && end1 > start2) {
        conflicts.push({
          type: 'session_overlap',
          sessionIds: [session1.id, session2.id],
          message: 'Sessions overlap in time'
        })
      }
    }
  }

  return conflicts
}

function checkTimeSlotAvailability(
  schedule: any,
  startTime: string,
  endTime: string,
  duration: number,
  existingSessions: any[]
) {
  if (!schedule || !schedule.isActive) {
    return {
      available: false,
      reason: 'Therapist is not working on this day',
      conflicts: [],
      suggestions: []
    }
  }

  const requestedStart = timeToMinutes(startTime)
  const requestedEnd = requestedStart + duration
  const workStart = timeToMinutes(schedule.startTime)
  const workEnd = timeToMinutes(schedule.endTime)

  // Check if within working hours
  if (requestedStart < workStart || requestedEnd > workEnd) {
    return {
      available: false,
      reason: 'Time slot is outside working hours',
      conflicts: [],
      suggestions: [`Try scheduling between ${schedule.startTime} and ${schedule.endTime}`]
    }
  }

  // Check for break time conflicts
  if (schedule.breakStart && schedule.breakEnd) {
    const breakStart = timeToMinutes(schedule.breakStart)
    const breakEnd = timeToMinutes(schedule.breakEnd)

    if (requestedStart < breakEnd && requestedEnd > breakStart) {
      return {
        available: false,
        reason: 'Time slot conflicts with break time',
        conflicts: [],
        suggestions: [`Try scheduling before ${schedule.breakStart} or after ${schedule.breakEnd}`]
      }
    }
  }

  // Check for session conflicts
  const conflicts = existingSessions.filter(session => {
    const sessionStart = timeToMinutes(session.scheduledTime)
    const sessionEnd = sessionStart + session.duration
    return requestedStart < sessionEnd && requestedEnd > sessionStart
  })

  if (conflicts.length > 0) {
    return {
      available: false,
      reason: 'Time slot conflicts with existing sessions',
      conflicts: conflicts.map(c => ({
        sessionId: c.id,
        scheduledTime: c.scheduledTime,
        duration: c.duration
      })),
      suggestions: generateTimeSuggestions(schedule, existingSessions, duration)
    }
  }

  return {
    available: true,
    reason: 'Time slot is available',
    conflicts: [],
    suggestions: []
  }
}

function generateTimeSuggestions(schedule: any, existingSessions: any[], duration: number) {
  const suggestions: string[] = []
  const workStart = timeToMinutes(schedule.startTime)
  const workEnd = timeToMinutes(schedule.endTime)
  const sessionDuration = 60 // Default value
  const bufferTime = schedule.breakBetweenSessions

  // Find available slots
  const availableSlots = calculateAvailableSlots(schedule, existingSessions)
  
  if (availableSlots.length > 0) {
    suggestions.push('Available time slots:')
    availableSlots.slice(0, 5).forEach(slot => {
      suggestions.push(`• ${slot.startTime} - ${slot.endTime}`)
    })
  }

  return suggestions
}

function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}
