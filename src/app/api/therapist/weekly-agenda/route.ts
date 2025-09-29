import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const weeklyAgendaQuerySchema = z.object({
  therapistId: z.string().uuid('Invalid therapist ID'),
  weekStart: z.string().optional(), // ISO date string for Monday of the week
  includeSessions: z.string().transform(val => val === 'true').default(true),
  includeAvailability: z.string().transform(val => val === 'true').default(true),
  includeConflicts: z.string().transform(val => val === 'true').default(false)
})

const sessionUpdateSchema = z.object({
  sessionId: z.string().uuid(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  duration: z.number().min(15).max(180).optional(),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show']).optional(),
  sessionNotes: z.string().max(1000).optional(),
  therapistComments: z.string().max(1000).optional()
})

const sessionCreateSchema = z.object({
  therapistId: z.string().uuid(),
  patientId: z.string().uuid(),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  duration: z.number().min(15).max(180).default(60),
  serviceIds: z.array(z.string().uuid()).min(1),
  notes: z.string().max(500).optional()
})

// GET /api/therapist/weekly-agenda - Get weekly agenda data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = weeklyAgendaQuerySchema.safeParse({
      therapistId: searchParams.get('therapistId'),
      weekStart: searchParams.get('weekStart'),
      includeSessions: searchParams.get('includeSessions'),
      includeAvailability: searchParams.get('includeAvailability'),
      includeConflicts: searchParams.get('includeConflicts')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { therapistId, weekStart, includeSessions, includeAvailability, includeConflicts } = validation.data

    // Check if therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: therapistId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialties: {
          include: {
            specialty: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
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

    // Calculate week boundaries
    const weekStartDate = weekStart ? new Date(weekStart) : getWeekStart(new Date())
    const weekEndDate = new Date(weekStartDate)
    weekEndDate.setDate(weekStartDate.getDate() + 6)
    weekEndDate.setHours(23, 59, 59, 999)

    const agendaData: any = {
      therapist: {
        id: therapist.id,
        firstName: therapist.firstName,
        lastName: therapist.lastName,
        specialties: therapist.specialties.map(s => s.specialty)
      },
      week: {
        startDate: weekStartDate.toISOString(),
        endDate: weekEndDate.toISOString(),
        days: generateWeekDays(weekStartDate)
      }
    }

    // Get sessions for the week
    if (includeSessions) {
      agendaData.sessions = await getWeeklySessions(therapistId, weekStartDate, weekEndDate)
    }

    // Get availability for the week
    if (includeAvailability) {
      agendaData.availability = await getWeeklyAvailability(therapistId, weekStartDate, weekEndDate)
    }

    // Get conflicts if requested
    if (includeConflicts) {
      agendaData.conflicts = await getWeeklyConflicts(therapistId, weekStartDate, weekEndDate)
    }

    return NextResponse.json({
      success: true,
      data: agendaData
    })

  } catch (error) {
    console.error('Error fetching weekly agenda:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/therapist/weekly-agenda - Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = sessionCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const sessionData = validation.data

    // Check for conflicts
    const conflicts = await checkSessionConflicts(sessionData)
    if (conflicts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Session conflicts detected',
          conflicts,
          suggestions: generateConflictSuggestions(conflicts)
        },
        { status: 409 }
      )
    }

    // Create session
    const session = await db.patientSession.create({
      data: {
        therapistId: sessionData.therapistId,
        patientId: sessionData.patientId,
        scheduledDate: new Date(sessionData.scheduledDate),
        scheduledTime: sessionData.scheduledTime,
        duration: sessionData.duration,
        status: 'scheduled',
        sessionNotes: sessionData.notes,
        serviceAssignments: {
          create: sessionData.serviceIds.map(serviceId => ({
            proposalService: {
              create: {
                serviceId,
                proposalId: 'temp-proposal-id' // This would need to be handled properly
              }
            }
          }))
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        serviceAssignments: {
          include: {
            proposalService: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Session created successfully',
      data: { session }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/therapist/weekly-agenda - Update session
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = sessionUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { sessionId, ...updateData } = validation.data

    // Check if session exists
    const existingSession = await db.patientSession.findUnique({
      where: { id: sessionId }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Check for conflicts if time is being changed
    if (updateData.scheduledDate || updateData.scheduledTime) {
      const conflicts = await checkSessionConflicts({
        therapistId: existingSession.therapistId,
        scheduledDate: updateData.scheduledDate || existingSession.scheduledDate.toISOString().split('T')[0],
        scheduledTime: updateData.scheduledTime || existingSession.scheduledTime,
        duration: updateData.duration || existingSession.duration || 60
      }, sessionId)

      if (conflicts.length > 0) {
        return NextResponse.json(
          { 
            error: 'Session conflicts detected',
            conflicts,
            suggestions: generateConflictSuggestions(conflicts)
          },
          { status: 409 }
        )
      }
    }

    // Update session
    const session = await db.patientSession.update({
      where: { id: sessionId },
      data: {
        ...updateData,
        scheduledDate: updateData.scheduledDate ? new Date(updateData.scheduledDate) : undefined
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        serviceAssignments: {
          include: {
            proposalService: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
      data: { session }
    })

  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/therapist/weekly-agenda - Delete session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Check if session exists
    const existingSession = await db.patientSession.findUnique({
      where: { id: sessionId }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Delete session
    await db.patientSession.delete({
      where: { id: sessionId }
    })

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions
function getWeekStart(date: Date): Date {
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const weekStart = new Date(date.setDate(diff))
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

function generateWeekDays(weekStart: Date): Array<{ date: string; dayName: string; dayNumber: number }> {
  const days = []
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    days.push({
      date: date.toISOString().split('T')[0],
      dayName: dayNames[i],
      dayNumber: date.getDate()
    })
  }
  
  return days
}

async function getWeeklySessions(therapistId: string, weekStart: Date, weekEnd: Date) {
  const sessions = await db.patientSession.findMany({
    where: {
      therapistId,
      scheduledDate: {
        gte: weekStart,
        lte: weekEnd
      }
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
      },
      serviceAssignments: {
        include: {
          proposalService: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: [
      { scheduledDate: 'asc' },
      { scheduledTime: 'asc' }
    ]
  })

  // Group sessions by day
  const sessionsByDay = new Map()
  sessions.forEach(session => {
    const dateKey = session.scheduledDate.toISOString().split('T')[0]
    if (!sessionsByDay.has(dateKey)) {
      sessionsByDay.set(dateKey, [])
    }
    sessionsByDay.get(dateKey).push({
      id: session.id,
      scheduledDate: session.scheduledDate,
      scheduledTime: session.scheduledTime,
      duration: session.duration,
      status: session.status,
      sessionNotes: session.sessionNotes,
      therapistComments: session.therapistComments,
      patient: session.patient,
      services: session.serviceAssignments.map(sa => sa.proposalService.service)
    })
  })

  return Object.fromEntries(sessionsByDay)
}

async function getWeeklyAvailability(therapistId: string, weekStart: Date, weekEnd: Date) {
  const schedules = await db.therapistSchedule.findMany({
    where: {
      therapistId,
      OR: [
        {
          effectiveDate: { lte: weekEnd },
          endDate: { gte: weekStart }
        },
        {
          effectiveDate: { lte: weekEnd },
          endDate: null
        }
      ]
    }
  })

  // Generate availability for each day
  const availability = new Map()
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    const dayOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][i]
    
    const daySchedule = schedules.find(s => s.dayOfWeek === dayOfWeek)
    if (daySchedule && daySchedule.isWorkingDay) {
      availability.set(date.toISOString().split('T')[0], {
        startTime: daySchedule.startTime,
        endTime: daySchedule.endTime,
        breakStartTime: daySchedule.breakStartTime,
        breakEndTime: daySchedule.breakEndTime,
        maxSessionsPerDay: daySchedule.maxSessionsPerDay,
        sessionDuration: daySchedule.sessionDuration,
        bufferTime: daySchedule.bufferTime
      })
    }
  }

  return Object.fromEntries(availability)
}

async function getWeeklyConflicts(therapistId: string, weekStart: Date, weekEnd: Date) {
  // This would implement conflict detection logic
  // For now, return empty array
  return []
}

async function checkSessionConflicts(sessionData: any, excludeSessionId?: string) {
  const { therapistId, scheduledDate, scheduledTime, duration } = sessionData
  
  // Find overlapping sessions
  const sessionStart = new Date(`${scheduledDate}T${scheduledTime}`)
  const sessionEnd = new Date(sessionStart.getTime() + (duration * 60 * 1000))
  
  const overlappingSessions = await db.patientSession.findMany({
    where: {
      therapistId,
      id: excludeSessionId ? { not: excludeSessionId } : undefined,
      scheduledDate: new Date(scheduledDate),
      status: { not: 'cancelled' }
    }
  })

  const conflicts = []
  overlappingSessions.forEach(session => {
    const existingStart = new Date(`${session.scheduledDate.toISOString().split('T')[0]}T${session.scheduledTime}`)
    const existingEnd = new Date(existingStart.getTime() + ((session.duration || 60) * 60 * 1000))
    
    if (sessionStart < existingEnd && sessionEnd > existingStart) {
      conflicts.push({
        sessionId: session.id,
        scheduledTime: session.scheduledTime,
        duration: session.duration,
        conflictType: 'time_overlap'
      })
    }
  })

  return conflicts
}

function generateConflictSuggestions(conflicts: any[]) {
  const suggestions = []
  
  conflicts.forEach(conflict => {
    if (conflict.conflictType === 'time_overlap') {
      suggestions.push({
        type: 'adjust_time',
        message: `Consider scheduling at a different time to avoid overlap with existing session at ${conflict.scheduledTime}`,
        action: 'Modify the scheduled time'
      })
    }
  })
  
  return suggestions
}
