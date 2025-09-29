import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const scheduleConfigSchema = z.object({
  therapistId: z.string().uuid('Invalid therapist ID'),
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
  endTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'),
  isWorkingDay: z.boolean().default(true),
  breakStartTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Break start time must be in HH:MM format')
    .optional(),
  breakEndTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Break end time must be in HH:MM format')
    .optional(),
  maxSessionsPerDay: z.number()
    .min(1, 'Maximum sessions per day must be at least 1')
    .max(20, 'Maximum sessions per day cannot exceed 20')
    .default(8),
  sessionDuration: z.number()
    .min(15, 'Session duration must be at least 15 minutes')
    .max(180, 'Session duration cannot exceed 180 minutes')
    .default(60),
  bufferTime: z.number()
    .min(0, 'Buffer time cannot be negative')
    .max(60, 'Buffer time cannot exceed 60 minutes')
    .default(15),
  isRecurring: z.boolean().default(true),
  effectiveDate: z.string().datetime('Invalid effective date'),
  endDate: z.string().datetime('Invalid end date').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional()
})

const scheduleConfigUpdateSchema = scheduleConfigSchema.partial().extend({
  id: z.string().uuid()
})

const scheduleConfigQuerySchema = z.object({
  therapistId: z.string().uuid().optional(),
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
  isWorkingDay: z.string().transform(val => val === 'true').optional(),
  isRecurring: z.string().transform(val => val === 'true').optional(),
  effectiveDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(10),
  sortBy: z.enum(['dayOfWeek', 'startTime', 'effectiveDate', 'createdAt']).default('dayOfWeek'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// GET /api/therapist/schedule-config - Get schedule configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = scheduleConfigQuerySchema.safeParse({
      therapistId: searchParams.get('therapistId'),
      dayOfWeek: searchParams.get('dayOfWeek'),
      isWorkingDay: searchParams.get('isWorkingDay'),
      isRecurring: searchParams.get('isRecurring'),
      effectiveDate: searchParams.get('effectiveDate'),
      endDate: searchParams.get('endDate'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { therapistId, dayOfWeek, isWorkingDay, isRecurring, effectiveDate, endDate, page, limit, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (therapistId) {
      whereClause.therapistId = therapistId
    }

    if (dayOfWeek) {
      whereClause.dayOfWeek = dayOfWeek
    }

    if (isWorkingDay !== undefined) {
      whereClause.isWorkingDay = isWorkingDay
    }

    if (isRecurring !== undefined) {
      whereClause.isRecurring = isRecurring
    }

    if (effectiveDate) {
      whereClause.effectiveDate = { gte: new Date(effectiveDate) }
    }

    if (endDate) {
      whereClause.endDate = { lte: new Date(endDate) }
    }

    // Get schedule configurations with pagination
    const [scheduleConfigs, totalCount] = await Promise.all([
      db.therapistSchedule.findMany({
        where: whereClause,
        include: {
          therapist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.therapistSchedule.count({ where: whereClause })
    ])

    return NextResponse.json({
      success: true,
      data: {
        scheduleConfigs,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching schedule configurations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/therapist/schedule-config - Create schedule configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = scheduleConfigSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const scheduleData = validation.data

    // Validate time format and logic
    const timeValidation = validateTimeLogic(scheduleData)
    if (!timeValidation.isValid) {
      return NextResponse.json(
        { error: timeValidation.error },
        { status: 400 }
      )
    }

    // Check for conflicts
    const conflictCheck = await checkScheduleConflicts(scheduleData)
    if (conflictCheck.hasConflicts) {
      return NextResponse.json(
        { 
          error: 'Schedule conflicts detected',
          conflicts: conflictCheck.conflicts,
          suggestions: conflictCheck.suggestions
        },
        { status: 409 }
      )
    }

    // Create schedule configuration
    const scheduleConfig = await db.therapistSchedule.create({
      data: scheduleData,
      include: {
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Schedule configuration created successfully',
      data: { scheduleConfig }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating schedule configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/therapist/schedule-config - Update schedule configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = scheduleConfigUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { id, ...updateData } = validation.data

    // Check if schedule configuration exists
    const existingSchedule = await db.therapistSchedule.findUnique({
      where: { id }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule configuration not found' },
        { status: 404 }
      )
    }

    // Validate time format and logic if time fields are being updated
    if (updateData.startTime || updateData.endTime || updateData.breakStartTime || updateData.breakEndTime) {
      const timeValidation = validateTimeLogic({
        ...existingSchedule,
        ...updateData
      })
      if (!timeValidation.isValid) {
        return NextResponse.json(
          { error: timeValidation.error },
          { status: 400 }
        )
      }
    }

    // Check for conflicts if schedule data is being updated
    if (Object.keys(updateData).length > 0) {
      const conflictCheck = await checkScheduleConflicts({
        ...existingSchedule,
        ...updateData
      }, id)
      if (conflictCheck.hasConflicts) {
        return NextResponse.json(
          { 
            error: 'Schedule conflicts detected',
            conflicts: conflictCheck.conflicts,
            suggestions: conflictCheck.suggestions
          },
          { status: 409 }
        )
      }
    }

    // Update schedule configuration
    const scheduleConfig = await db.therapistSchedule.update({
      where: { id },
      data: updateData,
      include: {
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Schedule configuration updated successfully',
      data: { scheduleConfig }
    })

  } catch (error) {
    console.error('Error updating schedule configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/therapist/schedule-config - Delete schedule configuration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Schedule configuration ID is required' },
        { status: 400 }
      )
    }

    // Check if schedule configuration exists
    const existingSchedule = await db.therapistSchedule.findUnique({
      where: { id }
    })

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule configuration not found' },
        { status: 404 }
      )
    }

    // Check if there are any existing sessions that depend on this schedule
    const existingSessions = await db.patientSession.count({
      where: {
        therapistId: existingSchedule.therapistId,
        scheduledDate: {
          gte: existingSchedule.effectiveDate,
          lte: existingSchedule.endDate || new Date('2099-12-31')
        }
      }
    })

    if (existingSessions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete schedule configuration with existing sessions' },
        { status: 409 }
      )
    }

    // Delete schedule configuration
    await db.therapistSchedule.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Schedule configuration deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting schedule configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to validate time logic
function validateTimeLogic(scheduleData: any): { isValid: boolean; error?: string } {
  const { startTime, endTime, breakStartTime, breakEndTime } = scheduleData

  // Convert time strings to minutes for easier comparison
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  const breakStartMinutes = breakStartTime ? timeToMinutes(breakStartTime) : null
  const breakEndMinutes = breakEndTime ? timeToMinutes(breakEndTime) : null

  // Check if start time is before end time
  if (startMinutes >= endMinutes) {
    return { isValid: false, error: 'Start time must be before end time' }
  }

  // Check if break times are provided together
  if ((breakStartTime && !breakEndTime) || (!breakStartTime && breakEndTime)) {
    return { isValid: false, error: 'Both break start and end times must be provided' }
  }

  // Check if break time is within working hours
  if (breakStartMinutes && breakEndMinutes) {
    if (breakStartMinutes < startMinutes || breakEndMinutes > endMinutes) {
      return { isValid: false, error: 'Break time must be within working hours' }
    }

    if (breakStartMinutes >= breakEndMinutes) {
      return { isValid: false, error: 'Break start time must be before break end time' }
    }
  }

  return { isValid: true }
}

// Helper function to check for schedule conflicts
async function checkScheduleConflicts(scheduleData: any, excludeId?: string): Promise<{
  hasConflicts: boolean;
  conflicts: any[];
  suggestions: any[];
}> {
  const { therapistId, dayOfWeek, effectiveDate, endDate } = scheduleData

  // Find overlapping schedule configurations
  const overlappingSchedules = await db.therapistSchedule.findMany({
    where: {
      therapistId,
      dayOfWeek,
      id: excludeId ? { not: excludeId } : undefined,
      OR: [
        {
          effectiveDate: { lte: endDate || new Date('2099-12-31') },
          endDate: { gte: effectiveDate }
        },
        {
          effectiveDate: { lte: endDate || new Date('2099-12-31') },
          endDate: null
        }
      ]
    }
  })

  const conflicts = overlappingSchedules.map(schedule => ({
    id: schedule.id,
    dayOfWeek: schedule.dayOfWeek,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    effectiveDate: schedule.effectiveDate,
    endDate: schedule.endDate,
    conflictType: 'overlapping_period'
  }))

  // Generate suggestions for resolving conflicts
  const suggestions = []
  if (conflicts.length > 0) {
    suggestions.push({
      type: 'adjust_effective_date',
      message: 'Consider adjusting the effective date to avoid overlapping periods',
      action: 'Modify the effective date to start after existing schedules end'
    })
    
    suggestions.push({
      type: 'adjust_end_date',
      message: 'Consider setting an end date for existing schedules',
      action: 'Set an end date for overlapping schedules before the new schedule starts'
    })
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    suggestions
  }
}

// Helper function to convert time string to minutes
function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}

// Helper function to convert minutes to time string
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}
