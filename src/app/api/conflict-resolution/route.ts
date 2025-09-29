import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ConflictResolutionService } from '@/lib/conflict-resolution'

// Validation schemas
const availabilityCheckSchema = z.object({
  therapistId: z.string().uuid(),
  date: z.string().datetime(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  duration: z.number().min(15).max(480),
  excludeSessionId: z.string().uuid().optional()
})

const bulkAvailabilityCheckSchema = z.object({
  therapistId: z.string().uuid(),
  date: z.string().datetime(),
  timeSlots: z.array(z.object({
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    duration: z.number().min(15).max(480)
  })).min(1),
  excludeSessionIds: z.array(z.string().uuid()).optional()
})

const conflictResolutionSchema = z.object({
  therapistId: z.string().uuid(),
  date: z.string().datetime(),
  duration: z.number().min(15).max(480),
  preferences: z.object({
    preferredTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    maxTimeShift: z.number().min(0).max(480).optional(),
    allowDifferentDay: z.boolean().optional()
  }).optional()
})

// POST /api/conflict-resolution/check - Check availability for a single time slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'check'

    switch (action) {
      case 'check':
        return await handleAvailabilityCheck(body)
      case 'bulk-check':
        return await handleBulkAvailabilityCheck(body)
      case 'resolve':
        return await handleConflictResolution(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: check, bulk-check, or resolve' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in conflict resolution API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleAvailabilityCheck(body: any) {
  // Validate request body
  const validation = availabilityCheckSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.errors },
      { status: 400 }
    )
  }

  const { therapistId, date, startTime, endTime, duration, excludeSessionId } = validation.data

  try {
    const result = await ConflictResolutionService.checkAvailability({
      therapistId,
      date: new Date(date),
      startTime,
      endTime,
      duration,
      excludeSessionId
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error checking availability:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}

async function handleBulkAvailabilityCheck(body: any) {
  // Validate request body
  const validation = bulkAvailabilityCheckSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.errors },
      { status: 400 }
    )
  }

  const { therapistId, date, timeSlots, excludeSessionIds } = validation.data

  try {
    const result = await ConflictResolutionService.checkBulkAvailability({
      therapistId,
      date: new Date(date),
      timeSlots,
      excludeSessionIds
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error checking bulk availability:', error)
    return NextResponse.json(
      { error: 'Failed to check bulk availability' },
      { status: 500 }
    )
  }
}

async function handleConflictResolution(body: any) {
  // Validate request body
  const validation = conflictResolutionSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.errors },
      { status: 400 }
    )
  }

  const { therapistId, date, duration, preferences } = validation.data

  try {
    const result = await ConflictResolutionService.resolveConflicts(
      therapistId,
      new Date(date),
      duration,
      preferences
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error resolving conflicts:', error)
    return NextResponse.json(
      { error: 'Failed to resolve conflicts' },
      { status: 500 }
    )
  }
}

// GET /api/conflict-resolution - Get conflict resolution suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapistId')
    const date = searchParams.get('date')
    const duration = searchParams.get('duration')

    if (!therapistId || !date || !duration) {
      return NextResponse.json(
        { error: 'Missing required parameters: therapistId, date, duration' },
        { status: 400 }
      )
    }

    try {
      const result = await ConflictResolutionService.resolveConflicts(
        therapistId,
        new Date(date),
        parseInt(duration),
        {
          maxTimeShift: 120, // 2 hours
          allowDifferentDay: false
        }
      )

      return NextResponse.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Error getting conflict resolution suggestions:', error)
      return NextResponse.json(
        { error: 'Failed to get conflict resolution suggestions' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in conflict resolution GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
