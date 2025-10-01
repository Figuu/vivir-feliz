import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const durationConfigSchema = z.object({
  serviceId: z.string().uuid(),
  defaultDuration: z.number().min(15).max(480),
  minDuration: z.number().min(15).max(480),
  maxDuration: z.number().min(15).max(480),
  allowedDurations: z.array(z.number().min(15).max(480)).optional(),
  breakBetweenSessions: z.number().min(0).max(60).default(15),
  bufferTime: z.number().min(0).max(30).default(5),
  isActive: z.boolean().default(true)
})

const timingAdjustmentSchema = z.object({
  sessionId: z.string().uuid(),
  newDuration: z.number().min(15).max(480),
  reason: z.string().optional(),
  adjustFollowingSessions: z.boolean().default(false)
})

const timeSlotOptimizationSchema = z.object({
  therapistId: z.string().uuid(),
  date: z.string().datetime(),
  serviceIds: z.array(z.string().uuid()).optional(),
  optimizeFor: z.enum(['EFFICIENCY', 'PATIENT_COMFORT', 'THERAPIST_PREFERENCE']).default('EFFICIENCY')
})

// GET /api/sessions/duration-timing - Get duration configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId')
    const therapistId = searchParams.get('therapistId')

    let whereClause: any = { isActive: true }

    if (serviceId) {
      whereClause.serviceId = serviceId
    }

    // Get duration configurations
    const durationConfigs = await db.service.findMany({
      where: {
        id: serviceId ? serviceId : undefined,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        type: true,
        sessionDuration: true,
        costPerSession: true
      }
    })

    // Get therapist-specific timing preferences if therapistId provided
    let therapistPreferences = null
    if (therapistId) {
      therapistPreferences = await db.therapist.findUnique({
        where: { id: therapistId },
        select: {
          id: true,
          profile: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        durationConfigs,
        therapistPreferences,
        defaultSettings: {
          breakBetweenSessions: 15,
          bufferTime: 5,
          allowedDurations: [30, 45, 60, 90, 120]
        }
      }
    })

  } catch (error) {
    console.error('Error fetching duration timing configs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/duration-timing - Create or update duration configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'config'

    switch (action) {
      case 'config':
        return await handleDurationConfig(body)
      case 'adjust':
        return await handleTimingAdjustment(body)
      case 'optimize':
        return await handleTimeSlotOptimization(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: config, adjust, or optimize' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in duration timing API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleDurationConfig(body: any) {
  // Validate request body
  const validation = durationConfigSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { serviceId, defaultDuration, minDuration, maxDuration, allowedDurations, breakBetweenSessions, bufferTime, isActive } = validation.data

  try {
    // Update service with new duration configuration
    const updatedService = await db.service.update({
      where: { id: serviceId },
      data: {
        sessionDuration: defaultDuration,
        // Store additional timing config in metadata or separate table
        // For now, we'll update the service directly
      }
    })

    // In a real implementation, you might want to store this in a separate table
    // like ServiceDurationConfig to maintain history and more complex configurations

    return NextResponse.json({
      success: true,
      message: 'Duration configuration updated successfully',
      data: {
        service: updatedService,
        config: {
          defaultDuration,
          minDuration,
          maxDuration,
          allowedDurations,
          breakBetweenSessions,
          bufferTime,
          isActive
        }
      }
    })
  } catch (error) {
    console.error('Error updating duration config:', error)
    return NextResponse.json(
      { error: 'Failed to update duration configuration' },
      { status: 500 }
    )
  }
}

async function handleTimingAdjustment(body: any) {
  // Validate request body
  const validation = timingAdjustmentSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { sessionId, newDuration, reason, adjustFollowingSessions } = validation.data

  try {
    // Get the session to be adjusted
    const session = await db.patientSession.findUnique({
      where: { id: sessionId },
      include: {
        serviceAssignment: {
          include: {
            service: true
          }
        }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check if new duration is within allowed range
    const service = session.serviceAssignment.service
    if (newDuration < 15 || newDuration > 480) {
      return NextResponse.json(
        { error: 'Duration must be between 15 and 480 minutes' },
        { status: 400 }
      )
    }

    // Calculate new end time
    const [hours, minutes] = session.scheduledTime.split(':').map(Number)
    const startTime = hours * 60 + minutes
    const newEndTime = startTime + newDuration
    const newEndTimeString = `${Math.floor(newEndTime / 60).toString().padStart(2, '0')}:${(newEndTime % 60).toString().padStart(2, '0')}`

    // Check for conflicts with new duration
    const conflictingSessions = await db.patientSession.findMany({
      where: {
        therapistId: session.therapistId,
        scheduledDate: session.scheduledDate,
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS']
        },
        id: { not: sessionId },
        OR: [
          {
            AND: [
              { scheduledTime: { lte: session.scheduledTime } },
              { 
                scheduledTime: { 
                  gte: newEndTimeString 
                } 
              }
            ]
          }
        ]
      }
    })

    if (conflictingSessions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Duration adjustment would create conflicts with existing sessions',
          conflicts: conflictingSessions.map(s => ({
            id: s.id,
            time: s.scheduledTime,
            duration: s.duration
          }))
        },
        { status: 400 }
      )
    }

    // Update the session duration
    const updatedSession = await db.patientSession.update({
      where: { id: sessionId },
      data: {
        duration: newDuration,
        sessionNotes: reason ? `${session.sessionNotes || ''}\nDuration adjusted: ${reason}`.trim() : session.sessionNotes
      }
    })

    // Adjust following sessions if requested
    let adjustedSessions = []
    if (adjustFollowingSessions) {
      const followingSessions = await db.patientSession.findMany({
        where: {
          therapistId: session.therapistId,
          scheduledDate: session.scheduledDate,
          scheduledTime: { gt: session.scheduledTime },
          status: {
            in: ['SCHEDULED', 'IN_PROGRESS']
          }
        },
        orderBy: { scheduledTime: 'asc' }
      })

      // Shift following sessions by the duration difference
      const durationDifference = newDuration - session.duration
      
      for (const followingSession of followingSessions) {
        const [fHours, fMinutes] = followingSession.scheduledTime.split(':').map(Number)
        const fStartTime = fHours * 60 + fMinutes
        const newFStartTime = fStartTime + durationDifference
        
        if (newFStartTime >= 0 && newFStartTime < 24 * 60) { // Within same day
          const newFStartTimeString = `${Math.floor(newFStartTime / 60).toString().padStart(2, '0')}:${(newFStartTime % 60).toString().padStart(2, '0')}`
          
          const adjustedSession = await db.patientSession.update({
            where: { id: followingSession.id },
            data: {
              scheduledTime: newFStartTimeString,
              sessionNotes: `${followingSession.sessionNotes || ''}\nTime adjusted due to previous session duration change`.trim()
            }
          })
          
          adjustedSessions.push(adjustedSession)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Session timing adjusted successfully',
      data: {
        updatedSession,
        adjustedSessions,
        summary: {
          originalDuration: session.duration,
          newDuration,
          durationDifference: newDuration - session.duration,
          followingSessionsAdjusted: adjustedSessions.length
        }
      }
    })

  } catch (error) {
    console.error('Error adjusting session timing:', error)
    return NextResponse.json(
      { error: 'Failed to adjust session timing' },
      { status: 500 }
    )
  }
}

async function handleTimeSlotOptimization(body: any) {
  // Validate request body
  const validation = timeSlotOptimizationSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { therapistId, date, serviceIds, optimizeFor } = validation.data

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
      return NextResponse.json(
        { error: 'Therapist not scheduled for this day' },
        { status: 400 }
      )
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
          in: ['SCHEDULED', 'IN_PROGRESS']
        }
      },
      include: {
        serviceAssignment: {
          include: {
            service: true
          }
        }
      },
      orderBy: { scheduledTime: 'asc' }
    })

    // Get available services
    const services = await db.service.findMany({
      where: {
        id: serviceIds ? { in: serviceIds } : undefined,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        type: true,
        sessionDuration: true,
        costPerSession: true
      }
    })

    // Generate optimized time slots
    const optimizedSlots = generateOptimizedTimeSlots(
      therapistSchedule,
      existingSessions,
      services,
      optimizeFor
    )

    return NextResponse.json({
      success: true,
      data: {
        therapistSchedule,
        existingSessions,
        services,
        optimizedSlots,
        optimizationCriteria: optimizeFor,
        summary: {
          totalAvailableSlots: optimizedSlots.length,
          totalExistingSessions: existingSessions.length,
          workingHours: {
            start: therapistSchedule.startTime,
            end: therapistSchedule.endTime
          }
        }
      }
    })

  } catch (error) {
    console.error('Error optimizing time slots:', error)
    return NextResponse.json(
      { error: 'Failed to optimize time slots' },
      { status: 500 }
    )
  }
}

// Helper function to generate optimized time slots
function generateOptimizedTimeSlots(
  therapistSchedule: any,
  existingSessions: any[],
  services: any[],
  optimizeFor: string
) {
  const slots: any[] = []
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
    return { start, end, session }
  })

  // Add break time as occupied
  if (therapistSchedule.breakStart && therapistSchedule.breakEnd) {
    occupiedRanges.push({ start: breakStart, end: breakEnd, session: null })
  }

  // Sort occupied ranges by start time
  occupiedRanges.sort((a, b) => a.start - b.start)

  // Generate available slots
  let currentTime = workStart
  const bufferTime = 5 // 5 minutes buffer between sessions

  for (const service of services) {
    const duration = service.sessionDuration
    const allowedDurations = [30, 45, 60, 90, 120] // Default allowed durations
    
    for (const slotDuration of allowedDurations) {
      if (slotDuration > duration) continue // Skip if slot duration is longer than service duration
      
      currentTime = workStart
      
      while (currentTime + slotDuration <= workEnd) {
        const slotEnd = currentTime + slotDuration
        
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
            
            // Calculate optimization score based on criteria
            let optimizationScore = 0
            
            switch (optimizeFor) {
              case 'EFFICIENCY':
                // Prefer slots that maximize time utilization
                optimizationScore = slotDuration
                break
              case 'PATIENT_COMFORT':
                // Prefer slots that don't create back-to-back sessions
                const hasBuffer = !occupiedRanges.some(range => 
                  Math.abs(range.end - currentTime) < bufferTime || 
                  Math.abs(slotEnd - range.start) < bufferTime
                )
                optimizationScore = hasBuffer ? 100 : 50
                break
              case 'THERAPIST_PREFERENCE':
                // Prefer standard durations (60 minutes)
                optimizationScore = slotDuration === 60 ? 100 : 80
                break
            }
            
            slots.push({
              time: timeString,
              duration: slotDuration,
              serviceId: service.id,
              serviceName: service.name,
              optimizationScore,
              isOptimal: optimizationScore >= 80
            })
          }
        }
        
        // Move to next potential slot
        currentTime += 15 // 15-minute intervals
      }
    }
  }

  // Sort slots by optimization score
  slots.sort((a, b) => b.optimizationScore - a.optimizationScore)

  return slots
}
