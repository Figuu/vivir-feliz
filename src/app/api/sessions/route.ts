import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { ConflictResolutionService } from '@/lib/conflict-resolution'

// Validation schemas
const createSessionSchema = z.object({
  serviceAssignmentId: z.string().uuid(),
  patientId: z.string().uuid(),
  therapistId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
  notes: z.string().optional()
})

const updateSessionSchema = z.object({
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional(),
  duration: z.number().min(15).max(480).optional(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  sessionNotes: z.string().optional(),
  therapistComments: z.string().optional(),
  parentVisible: z.boolean().optional(),
  rescheduleReason: z.string().optional()
})

const bulkScheduleSchema = z.object({
  serviceAssignmentId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY']),
  daysOfWeek: z.array(z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'])).optional(),
  timeSlots: z.array(z.object({
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    duration: z.number().min(15).max(480)
  })).min(1),
  notes: z.string().optional()
})


// GET /api/sessions - Get sessions with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapistId')
    const patientId = searchParams.get('patientId')
    const serviceAssignmentId = searchParams.get('serviceAssignmentId')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause
    let whereClause: any = {}

    if (therapistId) whereClause.therapistId = therapistId
    if (patientId) whereClause.patientId = patientId
    if (serviceAssignmentId) whereClause.serviceAssignmentId = serviceAssignmentId
    if (status) whereClause.status = status

    if (dateFrom || dateTo) {
      whereClause.scheduledDate = {}
      if (dateFrom) whereClause.scheduledDate.gte = new Date(dateFrom)
      if (dateTo) whereClause.scheduledDate.lte = new Date(dateTo)
    }

    // Fetch sessions with related data
    const sessions = await db.patientSession.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            dateOfBirth: true
          }
        },
        therapist: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        serviceAssignment: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { scheduledTime: 'asc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    })

    // Get total count for pagination
    const total = await db.patientSession.count({ where: whereClause })

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = createSessionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { serviceAssignmentId, patientId, therapistId, scheduledDate, scheduledTime, duration, notes } = validation.data

    // Verify service assignment exists and is active
    const serviceAssignment = await db.serviceAssignment.findUnique({
      where: { id: serviceAssignmentId },
      include: {
        service: true,
        proposalService: {
          include: {
            therapeuticProposal: true
          }
        }
      }
    })

    if (!serviceAssignment) {
      return NextResponse.json(
        { error: 'Service assignment not found' },
        { status: 404 }
      )
    }

    if (serviceAssignment.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Service assignment is not in scheduled status' },
        { status: 400 }
      )
    }

    // Check if we haven't exceeded total sessions
    if (serviceAssignment.completedSessions >= serviceAssignment.totalSessions) {
      return NextResponse.json(
        { error: 'All sessions for this service assignment have been scheduled' },
        { status: 400 }
      )
    }

    // Check therapist availability using conflict resolution service
    const availability = await ConflictResolutionService.checkAvailability({
      therapistId,
      date: new Date(scheduledDate),
      startTime: scheduledTime,
      endTime: new Date(new Date(scheduledDate).getTime() + duration * 60000).toTimeString().slice(0, 5),
      duration
    })

    if (!availability.available) {
      return NextResponse.json(
        { 
          error: `Therapist not available: ${availability.reason}`,
          conflicts: availability.conflicts,
          suggestions: availability.suggestions
        },
        { status: 400 }
      )
    }

    // Create session
    const session = await db.patientSession.create({
      data: {
        serviceAssignmentId,
        patientId,
        therapistId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        duration,
        sessionNotes: notes,
        status: 'SCHEDULED'
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        serviceAssignment: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                type: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      session,
      message: 'Session created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/sessions - Bulk schedule sessions
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validation = bulkScheduleSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { serviceAssignmentId, startDate, endDate, frequency, daysOfWeek, timeSlots, notes } = validation.data

    // Verify service assignment
    const serviceAssignment = await db.serviceAssignment.findUnique({
      where: { id: serviceAssignmentId },
      include: {
        therapist: true,
        service: true
      }
    })

    if (!serviceAssignment) {
      return NextResponse.json(
        { error: 'Service assignment not found' },
        { status: 404 }
      )
    }

    // Generate session dates based on frequency
    const sessionDates: Date[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    let currentDate = new Date(start)
    while (currentDate <= end) {
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
      
      if (!daysOfWeek || daysOfWeek.includes(dayOfWeek as any)) {
        sessionDates.push(new Date(currentDate))
      }

      // Move to next date based on frequency
      switch (frequency) {
        case 'DAILY':
          currentDate.setDate(currentDate.getDate() + 1)
          break
        case 'WEEKLY':
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case 'BIWEEKLY':
          currentDate.setDate(currentDate.getDate() + 14)
          break
      }
    }

    // Create sessions for each date and time slot
    const createdSessions = []
    const errors = []

    for (const date of sessionDates) {
      for (const timeSlot of timeSlots) {
        try {
          // Check availability using conflict resolution service
          const availability = await ConflictResolutionService.checkAvailability({
            therapistId: serviceAssignment.therapistId,
            date,
            startTime: timeSlot.time,
            endTime: new Date(date.getTime() + timeSlot.duration * 60000).toTimeString().slice(0, 5),
            duration: timeSlot.duration
          })

          if (!availability.available) {
            errors.push({
              date: date.toISOString(),
              time: timeSlot.time,
              error: availability.reason,
              conflicts: availability.conflicts,
              suggestions: availability.suggestions
            })
            continue
          }

          // Create session
          const session = await db.patientSession.create({
            data: {
              serviceAssignmentId,
              patientId: serviceAssignment.proposalService.therapeuticProposal.patientId,
              therapistId: serviceAssignment.therapistId,
              scheduledDate: date,
              scheduledTime: timeSlot.time,
              duration: timeSlot.duration,
              sessionNotes: notes,
              status: 'SCHEDULED'
            }
          })

          createdSessions.push(session)
        } catch (error) {
          errors.push({
            date: date.toISOString(),
            time: timeSlot.time,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    return NextResponse.json({
      createdSessions,
      errors,
      message: `Created ${createdSessions.length} sessions successfully`
    })

  } catch (error) {
    console.error('Error bulk scheduling sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}