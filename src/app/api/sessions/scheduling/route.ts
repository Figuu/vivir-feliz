import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const scheduleSessionSchema = z.object({
  patientId: z.string().uuid(),
  therapistId: z.string().uuid(),
  serviceId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration: z.number().min(15).max(480),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.object({
    frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']),
    interval: z.number().min(1).max(52),
    endDate: z.string().datetime().optional(),
    occurrences: z.number().min(1).max(100).optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday, 6 = Saturday
    dayOfMonth: z.number().min(1).max(31).optional()
  }).optional(),
  schedulingRules: z.object({
    allowWeekends: z.boolean().default(false),
    allowHolidays: z.boolean().default(false),
    minAdvanceBooking: z.number().min(0).max(365), // days
    maxAdvanceBooking: z.number().min(0).max(365), // days
    preferredTimeSlots: z.array(z.string()).optional(),
    avoidTimeSlots: z.array(z.string()).optional()
  }).optional()
})

const scheduleTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  serviceId: z.string().uuid(),
  therapistId: z.string().uuid(),
  defaultDuration: z.number().min(15).max(480),
  defaultTimeSlots: z.array(z.string()),
  schedulingRules: z.object({
    allowWeekends: z.boolean().default(false),
    allowHolidays: z.boolean().default(false),
    minAdvanceBooking: z.number().min(0).max(365),
    maxAdvanceBooking: z.number().min(0).max(365),
    preferredTimeSlots: z.array(z.string()).optional(),
    avoidTimeSlots: z.array(z.string()).optional()
  }),
  isActive: z.boolean().default(true)
})

const availabilityCheckSchema = z.object({
  therapistId: z.string().uuid(),
  serviceId: z.string().uuid(),
  date: z.string().datetime(),
  duration: z.number().min(15).max(480),
  timeSlots: z.array(z.string()).optional(),
  excludeSessionId: z.string().uuid().optional()
})

const rescheduleSessionSchema = z.object({
  sessionId: z.string().uuid(),
  newDate: z.string().datetime(),
  newTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  reason: z.string().min(10),
  notifyPatient: z.boolean().default(true),
  notifyTherapist: z.boolean().default(true)
})

// GET /api/sessions/scheduling - Get scheduling data and availability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'availability'

    switch (action) {
      case 'availability':
        return await handleAvailabilityCheck(searchParams)
      case 'templates':
        return await handleGetTemplates(searchParams)
      case 'rules':
        return await handleGetSchedulingRules(searchParams)
      case 'conflicts':
        return await handleGetConflicts(searchParams)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: availability, templates, rules, or conflicts' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in scheduling API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/scheduling - Schedule sessions or manage templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'schedule'

    switch (action) {
      case 'schedule':
        return await handleScheduleSession(body)
      case 'template':
        return await handleCreateTemplate(body)
      case 'reschedule':
        return await handleRescheduleSession(body)
      case 'bulk-schedule':
        return await handleBulkSchedule(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: schedule, template, reschedule, or bulk-schedule' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in scheduling API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleAvailabilityCheck(searchParams: URLSearchParams) {
  const therapistId = searchParams.get('therapistId')
  const serviceId = searchParams.get('serviceId')
  const date = searchParams.get('date')
  const duration = searchParams.get('duration')

  if (!therapistId || !serviceId || !date || !duration) {
    return NextResponse.json(
      { error: 'Missing required parameters: therapistId, serviceId, date, duration' },
      { status: 400 }
    )
  }

  try {
    // Get therapist schedule for the day
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    const therapistSchedule = await db.therapistSchedule.findFirst({
      where: {
        therapistId,
        dayOfWeek: dayOfWeek as any,
        isActive: true
      }
    })

    if (!therapistSchedule) {
      return NextResponse.json({
        success: true,
        data: {
          available: false,
          reason: 'Therapist not scheduled for this day',
          availableSlots: []
        }
      })
    }

    // Get existing sessions for the day
    const existingSessions = await db.patientSession.findMany({
      where: {
        therapistId,
        scheduledDate: {
          gte: new Date(date),
          lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
        }
      },
      orderBy: { scheduledTime: 'asc' }
    })

    // Generate available time slots
    const availableSlots = generateAvailableSlots(
      therapistSchedule,
      existingSessions,
      parseInt(duration)
    )

    return NextResponse.json({
      success: true,
      data: {
        available: availableSlots.length > 0,
        availableSlots,
        therapistSchedule: {
          startTime: therapistSchedule.startTime,
          endTime: therapistSchedule.endTime,
          breakStart: therapistSchedule.breakStart,
          breakEnd: therapistSchedule.breakEnd
        },
        existingSessions: existingSessions.map(session => ({
          id: session.id,
          time: session.scheduledTime,
          duration: session.duration,
          status: session.status
        }))
      }
    })

  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}

async function handleGetTemplates(searchParams: URLSearchParams) {
  const therapistId = searchParams.get('therapistId')
  const serviceId = searchParams.get('serviceId')
  const isActive = searchParams.get('isActive')

  try {
    const templates = await db.schedulingTemplate.findMany({
      where: {
        therapistId: therapistId || undefined,
        serviceId: serviceId || undefined,
        isActive: isActive ? isActive === 'true' : undefined
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        templates
      }
    })

  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

async function handleGetSchedulingRules(searchParams: URLSearchParams) {
  const therapistId = searchParams.get('therapistId')
  const serviceId = searchParams.get('serviceId')

  try {
    // Get default scheduling rules
    const defaultRules = {
      allowWeekends: false,
      allowHolidays: false,
      minAdvanceBooking: 1, // 1 day
      maxAdvanceBooking: 90, // 90 days
      preferredTimeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
      avoidTimeSlots: ['12:00', '13:00'] // lunch time
    }

    // Get therapist-specific rules if therapistId provided
    let therapistRules = null
    if (therapistId) {
      const therapist = await db.therapist.findUnique({
        where: { id: therapistId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          preferences: true
        }
      })
      
      if (therapist?.preferences) {
        therapistRules = JSON.parse(therapist.preferences)
      }
    }

    // Get service-specific rules if serviceId provided
    let serviceRules = null
    if (serviceId) {
      const service = await db.service.findUnique({
        where: { id: serviceId },
        select: {
          id: true,
          name: true,
          type: true,
          sessionDuration: true
        }
      })
      
      serviceRules = service
    }

    return NextResponse.json({
      success: true,
      data: {
        defaultRules,
        therapistRules,
        serviceRules,
        effectiveRules: {
          ...defaultRules,
          ...therapistRules,
          ...serviceRules
        }
      }
    })

  } catch (error) {
    console.error('Error fetching scheduling rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduling rules' },
      { status: 500 }
    )
  }
}

async function handleGetConflicts(searchParams: URLSearchParams) {
  const therapistId = searchParams.get('therapistId')
  const date = searchParams.get('date')
  const time = searchParams.get('time')
  const duration = searchParams.get('duration')

  if (!therapistId || !date || !time || !duration) {
    return NextResponse.json(
      { error: 'Missing required parameters: therapistId, date, time, duration' },
      { status: 400 }
    )
  }

  try {
    const conflicts = await checkSchedulingConflicts(
      therapistId,
      date,
      time,
      parseInt(duration)
    )

    return NextResponse.json({
      success: true,
      data: {
        hasConflicts: conflicts.length > 0,
        conflicts,
        recommendations: generateConflictRecommendations(conflicts)
      }
    })

  } catch (error) {
    console.error('Error checking conflicts:', error)
    return NextResponse.json(
      { error: 'Failed to check conflicts' },
      { status: 500 }
    )
  }
}

async function handleScheduleSession(body: any) {
  // Validate request body
  const validation = scheduleSessionSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.errors },
      { status: 400 }
    )
  }

  const {
    patientId,
    therapistId,
    serviceId,
    scheduledDate,
    scheduledTime,
    duration,
    notes,
    isRecurring,
    recurringPattern,
    schedulingRules
  } = validation.data

  try {
    // Check for conflicts
    const conflicts = await checkSchedulingConflicts(
      therapistId,
      scheduledDate,
      scheduledTime,
      duration
    )

    if (conflicts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Scheduling conflicts detected',
          conflicts,
          recommendations: generateConflictRecommendations(conflicts)
        },
        { status: 400 }
      )
    }

    // Apply scheduling rules
    const ruleViolations = await validateSchedulingRules(
      scheduledDate,
      scheduledTime,
      schedulingRules
    )

    if (ruleViolations.length > 0) {
      return NextResponse.json(
        { 
          error: 'Scheduling rule violations',
          violations: ruleViolations
        },
        { status: 400 }
      )
    }

    // Create session(s)
    const sessions = []
    
    if (isRecurring && recurringPattern) {
      // Create recurring sessions
      const recurringSessions = await createRecurringSessions({
        patientId,
        therapistId,
        serviceId,
        scheduledDate,
        scheduledTime,
        duration,
        notes,
        recurringPattern
      })
      sessions.push(...recurringSessions)
    } else {
      // Create single session
      const session = await db.patientSession.create({
        data: {
          patientId,
          therapistId,
          scheduledDate: new Date(scheduledDate),
          scheduledTime,
          duration,
          status: 'SCHEDULED',
          sessionNotes: notes
        }
      })
      sessions.push(session)
    }

    // Create service assignment for each session
    for (const session of sessions) {
      await db.serviceAssignment.create({
        data: {
          proposalServiceId: serviceId, // This should be a ProposalService ID in real implementation
          sessionId: session.id,
          assignedAt: new Date(),
          status: 'ACTIVE'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: isRecurring ? 'Recurring sessions created successfully' : 'Session scheduled successfully',
      data: {
        sessions,
        totalSessions: sessions.length,
        isRecurring,
        recurringPattern: isRecurring ? recurringPattern : null
      }
    })

  } catch (error) {
    console.error('Error scheduling session:', error)
    return NextResponse.json(
      { error: 'Failed to schedule session' },
      { status: 500 }
    )
  }
}

async function handleCreateTemplate(body: any) {
  // Validate request body
  const validation = scheduleTemplateSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.errors },
      { status: 400 }
    )
  }

  const {
    name,
    description,
    serviceId,
    therapistId,
    defaultDuration,
    defaultTimeSlots,
    schedulingRules,
    isActive
  } = validation.data

  try {
    const template = await db.schedulingTemplate.create({
      data: {
        name,
        description,
        serviceId,
        therapistId,
        defaultDuration,
        defaultTimeSlots: JSON.stringify(defaultTimeSlots),
        schedulingRules: JSON.stringify(schedulingRules),
        isActive
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Scheduling template created successfully',
      data: {
        template
      }
    })

  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

async function handleRescheduleSession(body: any) {
  // Validate request body
  const validation = rescheduleSessionSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.errors },
      { status: 400 }
    )
  }

  const { sessionId, newDate, newTime, reason, notifyPatient, notifyTherapist } = validation.data

  try {
    // Get existing session
    const existingSession = await db.patientSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: true,
        therapist: true
      }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check for conflicts with new time
    const conflicts = await checkSchedulingConflicts(
      existingSession.therapistId,
      newDate,
      newTime,
      existingSession.duration,
      sessionId // Exclude current session from conflict check
    )

    if (conflicts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Scheduling conflicts detected for new time',
          conflicts
        },
        { status: 400 }
      )
    }

    // Update session
    const updatedSession = await db.patientSession.update({
      where: { id: sessionId },
      data: {
        scheduledDate: new Date(newDate),
        scheduledTime: newTime,
        sessionNotes: `${existingSession.sessionNotes || ''}\nRescheduled: ${reason}`.trim()
      }
    })

    // Send notifications if requested
    if (notifyPatient || notifyTherapist) {
      await sendRescheduleNotifications(
        existingSession,
        updatedSession,
        reason,
        { notifyPatient, notifyTherapist }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Session rescheduled successfully',
      data: {
        session: updatedSession,
        notifications: {
          patient: notifyPatient,
          therapist: notifyTherapist
        }
      }
    })

  } catch (error) {
    console.error('Error rescheduling session:', error)
    return NextResponse.json(
      { error: 'Failed to reschedule session' },
      { status: 500 }
    )
  }
}

async function handleBulkSchedule(body: any) {
  const { sessions, templateId } = body

  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) {
    return NextResponse.json(
      { error: 'Sessions array is required' },
      { status: 400 }
    )
  }

  try {
    const results = []
    const errors = []

    for (const sessionData of sessions) {
      try {
        const validation = scheduleSessionSchema.safeParse(sessionData)
        if (!validation.success) {
          errors.push({
            session: sessionData,
            error: 'Validation failed',
            details: validation.error.errors
          })
          continue
        }

        // Check for conflicts
        const conflicts = await checkSchedulingConflicts(
          sessionData.therapistId,
          sessionData.scheduledDate,
          sessionData.scheduledTime,
          sessionData.duration
        )

        if (conflicts.length > 0) {
          errors.push({
            session: sessionData,
            error: 'Scheduling conflicts detected',
            conflicts
          })
          continue
        }

        // Create session
        const session = await db.patientSession.create({
          data: {
            patientId: sessionData.patientId,
            therapistId: sessionData.therapistId,
            scheduledDate: new Date(sessionData.scheduledDate),
            scheduledTime: sessionData.scheduledTime,
            duration: sessionData.duration,
            status: 'SCHEDULED',
            sessionNotes: sessionData.notes
          }
        })

        // Create service assignment
        await db.serviceAssignment.create({
          data: {
            proposalServiceId: sessionData.serviceId,
            sessionId: session.id,
            assignedAt: new Date(),
            status: 'ACTIVE'
          }
        })

        results.push(session)
      } catch (error) {
        errors.push({
          session: sessionData,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk scheduling completed: ${results.length} successful, ${errors.length} failed`,
      data: {
        successful: results,
        failed: errors,
        summary: {
          total: sessions.length,
          successful: results.length,
          failed: errors.length
        }
      }
    })

  } catch (error) {
    console.error('Error in bulk scheduling:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk scheduling' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateAvailableSlots(
  therapistSchedule: any,
  existingSessions: any[],
  duration: number
): string[] {
  const slots: string[] = []
  const [workStartHour, workStartMinute] = therapistSchedule.startTime.split(':').map(Number)
  const [workEndHour, workEndMinute] = therapistSchedule.endTime.split(':').map(Number)
  const [breakStartHour, breakStartMinute] = therapistSchedule.breakStart?.split(':').map(Number) || [0, 0]
  const [breakEndHour, breakEndMinute] = therapistSchedule.breakEnd?.split(':').map(Number) || [0, 0]

  const workStart = workStartHour * 60 + workStartMinute
  const workEnd = workEndHour * 60 + workEndMinute
  const breakStart = breakStartHour * 60 + breakStartMinute
  const breakEnd = breakEndHour * 60 + breakEndMinute

  // Create occupied time ranges
  const occupiedRanges = existingSessions.map(session => {
    const [startHour, startMinute] = session.scheduledTime.split(':').map(Number)
    const start = startHour * 60 + startMinute
    const end = start + session.duration
    return { start, end }
  })

  // Add break time as occupied
  if (therapistSchedule.breakStart && therapistSchedule.breakEnd) {
    occupiedRanges.push({ start: breakStart, end: breakEnd })
  }

  // Sort occupied ranges by start time
  occupiedRanges.sort((a, b) => a.start - b.start)

  // Generate available slots
  let currentTime = workStart
  const bufferTime = 5 // 5 minutes buffer between sessions

  while (currentTime + duration <= workEnd) {
    const slotEnd = currentTime + duration
    
    // Check if slot conflicts with occupied ranges
    const hasConflict = occupiedRanges.some(range => 
      (currentTime < range.end && slotEnd > range.start)
    )
    
    if (!hasConflict) {
      // Check if slot is within break time
      const isInBreak = therapistSchedule.breakStart && therapistSchedule.breakEnd &&
        currentTime < breakEnd && slotEnd > breakStart
      
      if (!isInBreak) {
        const timeString = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`
        slots.push(timeString)
      }
    }
    
    // Move to next potential slot
    currentTime += 15 // 15-minute intervals
  }

  return slots
}

async function checkSchedulingConflicts(
  therapistId: string,
  date: string,
  time: string,
  duration: number,
  excludeSessionId?: string
): Promise<any[]> {
  const conflicts = []

  try {
    // Check for existing sessions
    const [startHour, startMinute] = time.split(':').map(Number)
    const startTime = startHour * 60 + startMinute
    const endTime = startTime + duration

    const conflictingSessions = await db.patientSession.findMany({
      where: {
        therapistId,
        scheduledDate: {
          gte: new Date(date),
          lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
        },
        id: excludeSessionId ? { not: excludeSessionId } : undefined
      }
    })

    for (const session of conflictingSessions) {
      const [sessionStartHour, sessionStartMinute] = session.scheduledTime.split(':').map(Number)
      const sessionStart = sessionStartHour * 60 + sessionStartMinute
      const sessionEnd = sessionStart + session.duration

      if ((startTime < sessionEnd && endTime > sessionStart)) {
        conflicts.push({
          type: 'SESSION_OVERLAP',
          sessionId: session.id,
          conflictTime: session.scheduledTime,
          conflictDuration: session.duration,
          message: `Overlaps with existing session at ${session.scheduledTime}`
        })
      }
    }

    // Check therapist schedule
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    const therapistSchedule = await db.therapistSchedule.findFirst({
      where: {
        therapistId,
        dayOfWeek: dayOfWeek as any,
        isActive: true
      }
    })

    if (!therapistSchedule) {
      conflicts.push({
        type: 'NO_SCHEDULE',
        message: 'Therapist not scheduled for this day'
      })
    } else {
      const [workStartHour, workStartMinute] = therapistSchedule.startTime.split(':').map(Number)
      const [workEndHour, workEndMinute] = therapistSchedule.endTime.split(':').map(Number)
      const workStart = workStartHour * 60 + workStartMinute
      const workEnd = workEndHour * 60 + workEndMinute

      if (startTime < workStart || endTime > workEnd) {
        conflicts.push({
          type: 'OUTSIDE_WORKING_HOURS',
          message: `Session time is outside working hours (${therapistSchedule.startTime} - ${therapistSchedule.endTime})`
        })
      }

      // Check break time
      if (therapistSchedule.breakStart && therapistSchedule.breakEnd) {
        const [breakStartHour, breakStartMinute] = therapistSchedule.breakStart.split(':').map(Number)
        const [breakEndHour, breakEndMinute] = therapistSchedule.breakEnd.split(':').map(Number)
        const breakStart = breakStartHour * 60 + breakStartMinute
        const breakEnd = breakEndHour * 60 + breakEndMinute

        if (startTime < breakEnd && endTime > breakStart) {
          conflicts.push({
            type: 'BREAK_TIME_CONFLICT',
            message: `Session time conflicts with break time (${therapistSchedule.breakStart} - ${therapistSchedule.breakEnd})`
          })
        }
      }
    }

  } catch (error) {
    console.error('Error checking conflicts:', error)
    conflicts.push({
      type: 'ERROR',
      message: 'Error checking for conflicts'
    })
  }

  return conflicts
}

function generateConflictRecommendations(conflicts: any[]): string[] {
  const recommendations = []

  for (const conflict of conflicts) {
    switch (conflict.type) {
      case 'SESSION_OVERLAP':
        recommendations.push('Consider rescheduling the conflicting session or choose a different time slot')
        break
      case 'NO_SCHEDULE':
        recommendations.push('Check if the therapist is available on this day or select a different date')
        break
      case 'OUTSIDE_WORKING_HOURS':
        recommendations.push('Choose a time within the therapist\'s working hours')
        break
      case 'BREAK_TIME_CONFLICT':
        recommendations.push('Avoid scheduling during the therapist\'s break time')
        break
    }
  }

  return recommendations
}

async function validateSchedulingRules(
  date: string,
  time: string,
  rules?: any
): Promise<string[]> {
  const violations = []

  if (!rules) return violations

  const sessionDate = new Date(date)
  const today = new Date()
  const daysDifference = Math.ceil((sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Check advance booking rules
  if (rules.minAdvanceBooking && daysDifference < rules.minAdvanceBooking) {
    violations.push(`Session must be booked at least ${rules.minAdvanceBooking} days in advance`)
  }

  if (rules.maxAdvanceBooking && daysDifference > rules.maxAdvanceBooking) {
    violations.push(`Session cannot be booked more than ${rules.maxAdvanceBooking} days in advance`)
  }

  // Check weekend rule
  if (!rules.allowWeekends && (sessionDate.getDay() === 0 || sessionDate.getDay() === 6)) {
    violations.push('Weekend scheduling is not allowed')
  }

  // Check preferred time slots
  if (rules.preferredTimeSlots && !rules.preferredTimeSlots.includes(time)) {
    violations.push(`Time ${time} is not in the preferred time slots`)
  }

  // Check avoided time slots
  if (rules.avoidTimeSlots && rules.avoidTimeSlots.includes(time)) {
    violations.push(`Time ${time} is in the avoided time slots`)
  }

  return violations
}

async function createRecurringSessions(params: {
  patientId: string
  therapistId: string
  serviceId: string
  scheduledDate: string
  scheduledTime: string
  duration: number
  notes?: string
  recurringPattern: any
}): Promise<any[]> {
  const sessions = []
  const startDate = new Date(params.scheduledDate)
  let currentDate = new Date(startDate)
  let sessionCount = 0

  const maxSessions = params.recurringPattern.occurrences || 52
  const endDate = params.recurringPattern.endDate ? new Date(params.recurringPattern.endDate) : null

  while (sessionCount < maxSessions && (!endDate || currentDate <= endDate)) {
    // Check if current date matches the recurring pattern
    if (matchesRecurringPattern(currentDate, params.recurringPattern, startDate)) {
      const session = await db.patientSession.create({
        data: {
          patientId: params.patientId,
          therapistId: params.therapistId,
          scheduledDate: new Date(currentDate),
          scheduledTime: params.scheduledTime,
          duration: params.duration,
          status: 'SCHEDULED',
          sessionNotes: params.notes
        }
      })
      sessions.push(session)
      sessionCount++
    }

    // Move to next potential date
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return sessions
}

function matchesRecurringPattern(date: Date, pattern: any, startDate: Date): boolean {
  const dayOfWeek = date.getDay()
  const dayOfMonth = date.getDate()

  switch (pattern.frequency) {
    case 'DAILY':
      return true
    case 'WEEKLY':
      return pattern.daysOfWeek ? pattern.daysOfWeek.includes(dayOfWeek) : 
             dayOfWeek === startDate.getDay()
    case 'BIWEEKLY':
      const weeksDiff = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))
      return weeksDiff % 2 === 0 && 
             (pattern.daysOfWeek ? pattern.daysOfWeek.includes(dayOfWeek) : 
              dayOfWeek === startDate.getDay())
    case 'MONTHLY':
      return pattern.dayOfMonth ? dayOfMonth === pattern.dayOfMonth : 
             dayOfMonth === startDate.getDate()
    default:
      return false
  }
}

async function sendRescheduleNotifications(
  oldSession: any,
  newSession: any,
  reason: string,
  notifications: { notifyPatient: boolean; notifyTherapist: boolean }
): Promise<void> {
  try {
    // In a real implementation, you would send actual notifications
    console.log('Sending reschedule notifications:', {
      oldSession: oldSession.id,
      newSession: newSession.id,
      reason,
      notifications
    })
  } catch (error) {
    console.error('Error sending reschedule notifications:', error)
  }
}
