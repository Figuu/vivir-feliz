import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const scheduleEntrySchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  breakStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional(),
  breakEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional(),
  breakBetweenSessions: z.number().min(0).max(60).default(15),
  isActive: z.boolean().default(true)
})

const createScheduleSchema = z.object({
  therapistId: z.string().uuid(),
  schedules: z.array(scheduleEntrySchema).min(1, 'At least one schedule entry is required')
})

const updateScheduleSchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  breakStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional(),
  breakEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)').optional(),
  breakBetweenSessions: z.number().min(0).max(60).default(15),
  isActive: z.boolean().default(true)
})

// Helper function to validate time ranges
function validateTimeRange(startTime: string, endTime: string, breakStart?: string, breakEnd?: string): string | null {
  const start = new Date(`2000-01-01T${startTime}:00`)
  const end = new Date(`2000-01-01T${endTime}:00`)
  
  if (start >= end) {
    return 'End time must be after start time'
  }
  
  if (breakStart && breakEnd) {
    const breakStartTime = new Date(`2000-01-01T${breakStart}:00`)
    const breakEndTime = new Date(`2000-01-01T${breakEnd}:00`)
    
    if (breakStartTime >= breakEndTime) {
      return 'Break end time must be after break start time'
    }
    
    if (breakStartTime <= start || breakEndTime >= end) {
      return 'Break time must be within working hours'
    }
  }
  
  return null
}

// GET /api/therapist/schedule - Get therapist schedules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapistId')
    
    if (!therapistId) {
      return NextResponse.json(
        { error: 'Therapist ID is required' },
        { status: 400 }
      )
    }
    
    // Verify therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: therapistId },
      select: { id: true, firstName: true, lastName: true, isActive: true }
    })
    
    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }
    
    // Fetch therapist schedules
    const schedules = await db.therapistSchedule.findMany({
      where: { therapistId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })
    
    return NextResponse.json({
      therapist: {
        id: therapist.id,
        name: `${therapist.firstName} ${therapist.lastName}`,
        isActive: therapist.isActive
      },
      schedules
    })
    
  } catch (error) {
    console.error('Error fetching therapist schedules:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/therapist/schedule - Create or update therapist schedules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = createScheduleSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }
    
    const { therapistId, schedules } = validation.data
    
    // Verify therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: therapistId },
      select: { id: true, firstName: true, lastName: true, isActive: true }
    })
    
    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }
    
    // Validate time ranges for each schedule
    for (const schedule of schedules) {
      const timeError = validateTimeRange(
        schedule.startTime, 
        schedule.endTime, 
        schedule.breakStart, 
        schedule.breakEnd
      )
      
      if (timeError) {
        return NextResponse.json(
          { error: `Invalid time range for ${schedule.dayOfWeek}: ${timeError}` },
          { status: 400 }
        )
      }
    }
    
    // Check for duplicate days
    const days = schedules.map(s => s.dayOfWeek)
    const uniqueDays = new Set(days)
    if (days.length !== uniqueDays.size) {
      return NextResponse.json(
        { error: 'Duplicate days found in schedule' },
        { status: 400 }
      )
    }
    
    // Use transaction to update schedules
    const result = await db.$transaction(async (tx) => {
      // Delete existing schedules for this therapist
      await tx.therapistSchedule.deleteMany({
        where: { therapistId }
      })
      
      // Create new schedules
      const newSchedules = await Promise.all(
        schedules.map(schedule =>
          tx.therapistSchedule.create({
            data: {
              therapistId,
              dayOfWeek: schedule.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              breakStart: schedule.breakStart,
              breakEnd: schedule.breakEnd,
              breakBetweenSessions: schedule.breakBetweenSessions,
              isActive: schedule.isActive
            }
          })
        )
      )
      
      return newSchedules
    })
    
    return NextResponse.json({
      message: 'Schedule updated successfully',
      schedules: result
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error updating therapist schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/therapist/schedule - Update specific schedule entry
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')
    
    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    // Validate request body
    const validation = updateScheduleSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }
    
    const scheduleData = validation.data
    
    // Validate time range
    const timeError = validateTimeRange(
      scheduleData.startTime, 
      scheduleData.endTime, 
      scheduleData.breakStart, 
      scheduleData.breakEnd
    )
    
    if (timeError) {
      return NextResponse.json(
        { error: `Invalid time range: ${timeError}` },
        { status: 400 }
      )
    }
    
    // Check if schedule exists
    const existingSchedule = await db.therapistSchedule.findUnique({
      where: { id: scheduleId },
      include: { therapist: { select: { id: true, firstName: true, lastName: true } } }
    })
    
    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }
    
    // Check for conflicts with other schedules for the same therapist and day
    const conflictingSchedule = await db.therapistSchedule.findFirst({
      where: {
        therapistId: existingSchedule.therapistId,
        dayOfWeek: scheduleData.dayOfWeek,
        id: { not: scheduleId },
        isActive: true
      }
    })
    
    if (conflictingSchedule) {
      return NextResponse.json(
        { error: `Schedule already exists for ${scheduleData.dayOfWeek}` },
        { status: 400 }
      )
    }
    
    // Update schedule
    const updatedSchedule = await db.therapistSchedule.update({
      where: { id: scheduleId },
      data: {
        dayOfWeek: scheduleData.dayOfWeek,
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
        breakStart: scheduleData.breakStart,
        breakEnd: scheduleData.breakEnd,
        breakBetweenSessions: scheduleData.breakBetweenSessions,
        isActive: scheduleData.isActive
      }
    })
    
    return NextResponse.json({
      message: 'Schedule updated successfully',
      schedule: updatedSchedule
    })
    
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/therapist/schedule - Delete schedule entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('id')
    
    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }
    
    // Check if schedule exists
    const existingSchedule = await db.therapistSchedule.findUnique({
      where: { id: scheduleId }
    })
    
    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }
    
    // Delete schedule
    await db.therapistSchedule.delete({
      where: { id: scheduleId }
    })
    
    return NextResponse.json({
      message: 'Schedule deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

