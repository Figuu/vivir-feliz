import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const createRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['TIME_CONSTRAINT', 'CAPACITY_LIMIT', 'ADVANCE_BOOKING', 'RECURRING_PATTERN', 'CUSTOM']),
  conditions: z.object({
    // Time constraints
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    specificDates: z.array(z.string().datetime()).optional(),
    
    // Capacity limits
    maxSessionsPerDay: z.number().min(1).max(20).optional(),
    maxSessionsPerWeek: z.number().min(1).max(50).optional(),
    maxSessionsPerMonth: z.number().min(1).max(200).optional(),
    
    // Advance booking
    minAdvanceBooking: z.number().min(0).max(365).optional(),
    maxAdvanceBooking: z.number().min(0).max(365).optional(),
    
    // Recurring patterns
    frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']).optional(),
    interval: z.number().min(1).max(52).optional(),
    
    // Custom conditions
    customLogic: z.string().optional()
  }),
  actions: z.object({
    type: z.enum(['ALLOW', 'DENY', 'WARN', 'AUTO_RESCHEDULE']),
    message: z.string().optional(),
    autoRescheduleOptions: z.object({
      preferredTimeSlots: z.array(z.string()).optional(),
      maxAttempts: z.number().min(1).max(10).optional(),
      fallbackAction: z.enum(['DENY', 'WARN']).optional()
    }).optional()
  }),
  scope: z.object({
    therapistIds: z.array(z.string().uuid()).optional(),
    serviceIds: z.array(z.string().uuid()).optional(),
    patientIds: z.array(z.string().uuid()).optional(),
    applyToAll: z.boolean().default(false)
  }),
  priority: z.number().min(1).max(100).default(50),
  isActive: z.boolean().default(true)
})

const updateRuleSchema = createRuleSchema.partial().extend({
  id: z.string().uuid()
})

const validateSchedulingSchema = z.object({
  therapistId: z.string().uuid(),
  serviceId: z.string().uuid(),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  duration: z.number().min(15).max(480),
  patientId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional() // For updates
})

// GET /api/sessions/scheduling/rules - Get scheduling rules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'

    switch (action) {
      case 'list':
        return await handleListRules(searchParams)
      case 'validate':
        return await handleValidateScheduling(searchParams)
      case 'conflicts':
        return await handleGetConflicts(searchParams)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: list, validate, or conflicts' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in scheduling rules API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/scheduling/rules - Create or manage rules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'create'

    switch (action) {
      case 'create':
        return await handleCreateRule(body)
      case 'update':
        return await handleUpdateRule(body)
      case 'validate':
        return await handleValidateScheduling(body)
      case 'test':
        return await handleTestRule(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create, update, validate, or test' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in scheduling rules API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/sessions/scheduling/rules - Delete rule
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('ruleId')

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      )
    }

    // Soft delete by setting isActive to false
    const deletedRule = await db.schedulingRule.update({
      where: { id: ruleId },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Scheduling rule deleted successfully',
      data: {
        rule: deletedRule
      }
    })

  } catch (error) {
    console.error('Error deleting rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete rule' },
      { status: 500 }
    )
  }
}

async function handleListRules(searchParams: URLSearchParams) {
  const therapistId = searchParams.get('therapistId')
  const serviceId = searchParams.get('serviceId')
  const type = searchParams.get('type')
  const isActive = searchParams.get('isActive')

  let whereClause: any = {}

  if (therapistId) whereClause.therapistIds = { has: therapistId }
  if (serviceId) whereClause.serviceIds = { has: serviceId }
  if (type) whereClause.type = type
  if (isActive !== null) whereClause.isActive = isActive === 'true'

  try {
    const rules = await db.schedulingRule.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Parse JSON fields
    const parsedRules = rules.map(rule => ({
      ...rule,
      conditions: JSON.parse(rule.conditions || '{}'),
      actions: JSON.parse(rule.actions || '{}'),
      scope: JSON.parse(rule.scope || '{}')
    }))

    return NextResponse.json({
      success: true,
      data: {
        rules: parsedRules,
        total: rules.length
      }
    })

  } catch (error) {
    console.error('Error fetching rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rules' },
      { status: 500 }
    )
  }
}

async function handleValidateScheduling(data: any) {
  // Validate request data
  const validation = validateSchedulingSchema.safeParse(data)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.issues },
      { status: 400 }
    )
  }

  const {
    therapistId,
    serviceId,
    scheduledDate,
    scheduledTime,
    duration,
    patientId,
    sessionId
  } = validation.data

  try {
    // Get applicable rules
    const applicableRules = await getApplicableRules(therapistId, serviceId, patientId)

    // Validate against each rule
    const validationResults = []
    const violations = []
    const warnings = []

    for (const rule of applicableRules) {
      const result = await validateAgainstRule(rule, {
        therapistId,
        serviceId,
        scheduledDate,
        scheduledTime,
        duration,
        patientId,
        sessionId
      })

      validationResults.push(result)

      if (result.violated) {
        if (rule.actions.type === 'DENY') {
          violations.push(result)
        } else if (rule.actions.type === 'WARN') {
          warnings.push(result)
        }
      }
    }

    // Determine overall result
    const hasViolations = violations.length > 0
    const hasWarnings = warnings.length > 0

    return NextResponse.json({
      success: true,
      data: {
        valid: !hasViolations,
        violations,
        warnings,
        validationResults,
        summary: {
          totalRules: applicableRules.length,
          violations: violations.length,
          warnings: warnings.length,
          passed: applicableRules.length - violations.length - warnings.length
        }
      }
    })

  } catch (error) {
    console.error('Error validating scheduling:', error)
    return NextResponse.json(
      { error: 'Failed to validate scheduling' },
      { status: 500 }
    )
  }
}

async function handleGetConflicts(searchParams: URLSearchParams) {
  const therapistId = searchParams.get('therapistId')
  const date = searchParams.get('date')

  if (!therapistId || !date) {
    return NextResponse.json(
      { error: 'Therapist ID and date are required' },
      { status: 400 }
    )
  }

  try {
    // Get therapist's sessions for the day
    const sessions = await db.patientSession.findMany({
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
      include: {
        patient: {
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
                name: true
              }
            }
          }
        }
      },
      orderBy: { scheduledTime: 'asc' }
    })

    // Check for conflicts
    const conflicts = []
    for (let i = 0; i < sessions.length - 1; i++) {
      const current = sessions[i]
      const next = sessions[i + 1]

      const [currentHour, currentMinute] = current.scheduledTime.split(':').map(Number)
      const currentStart = currentHour * 60 + currentMinute
      const currentEnd = currentStart + current.duration

      const [nextHour, nextMinute] = next.scheduledTime.split(':').map(Number)
      const nextStart = nextHour * 60 + nextMinute

      // Check for overlap
      if (currentEnd > nextStart) {
        conflicts.push({
          type: 'TIME_OVERLAP',
          sessions: [current, next],
          overlapMinutes: currentEnd - nextStart,
          message: `Sessions overlap by ${currentEnd - nextStart} minutes`
        })
      }

      // Check for insufficient buffer time
      const bufferTime = nextStart - currentEnd
      if (bufferTime < 15) { // Minimum 15 minutes buffer
        conflicts.push({
          type: 'INSUFFICIENT_BUFFER',
          sessions: [current, next],
          bufferMinutes: bufferTime,
          message: `Insufficient buffer time: ${bufferTime} minutes between sessions`
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        conflicts,
        sessions,
        summary: {
          totalSessions: sessions.length,
          conflicts: conflicts.length,
          hasConflicts: conflicts.length > 0
        }
      }
    })

  } catch (error) {
    console.error('Error getting conflicts:', error)
    return NextResponse.json(
      { error: 'Failed to get conflicts' },
      { status: 500 }
    )
  }
}

async function handleCreateRule(body: any) {
  // Validate request body
  const validation = createRuleSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.issues },
      { status: 400 }
    )
  }

  const {
    name,
    description,
    type,
    conditions,
    actions,
    scope,
    priority,
    isActive
  } = validation.data

  try {
    const rule = await db.schedulingRule.create({
      data: {
        name,
        description,
        type,
        conditions: JSON.stringify(conditions),
        actions: JSON.stringify(actions),
        scope: JSON.stringify(scope),
        priority,
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Scheduling rule created successfully',
      data: {
        rule: {
          ...rule,
          conditions: JSON.parse(rule.conditions || '{}'),
          actions: JSON.parse(rule.actions || '{}'),
          scope: JSON.parse(rule.scope || '{}')
        }
      }
    })

  } catch (error) {
    console.error('Error creating rule:', error)
    return NextResponse.json(
      { error: 'Failed to create rule' },
      { status: 500 }
    )
  }
}

async function handleUpdateRule(body: any) {
  // Validate request body
  const validation = updateRuleSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { id, ...updateData } = validation.data

  try {
    // Check if rule exists
    const existingRule = await db.schedulingRule.findUnique({
      where: { id }
    })

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateFields: any = {}
    if (updateData.name) updateFields.name = updateData.name
    if (updateData.description !== undefined) updateFields.description = updateData.description
    if (updateData.type) updateFields.type = updateData.type
    if (updateData.conditions) updateFields.conditions = JSON.stringify(updateData.conditions)
    if (updateData.actions) updateFields.actions = JSON.stringify(updateData.actions)
    if (updateData.scope) updateFields.scope = JSON.stringify(updateData.scope)
    if (updateData.priority !== undefined) updateFields.priority = updateData.priority
    if (updateData.isActive !== undefined) updateFields.isActive = updateData.isActive

    const updatedRule = await db.schedulingRule.update({
      where: { id },
      data: updateFields
    })

    return NextResponse.json({
      success: true,
      message: 'Rule updated successfully',
      data: {
        rule: {
          ...updatedRule,
          conditions: JSON.parse(updatedRule.conditions || '{}'),
          actions: JSON.parse(updatedRule.actions || '{}'),
          scope: JSON.parse(updatedRule.scope || '{}')
        }
      }
    })

  } catch (error) {
    console.error('Error updating rule:', error)
    return NextResponse.json(
      { error: 'Failed to update rule' },
      { status: 500 }
    )
  }
}

async function handleTestRule(body: any) {
  const { ruleId, testData } = body

  if (!ruleId || !testData) {
    return NextResponse.json(
      { error: 'Rule ID and test data are required' },
      { status: 400 }
    )
  }

  try {
    // Get rule
    const rule = await db.schedulingRule.findUnique({
      where: { id: ruleId }
    })

    if (!rule) {
      return NextResponse.json(
        { error: 'Rule not found' },
        { status: 404 }
      )
    }

    // Parse rule data
    const conditions = JSON.parse(rule.conditions || '{}')
    const actions = JSON.parse(rule.actions || '{}')

    // Test rule against test data
    const result = await validateAgainstRule(rule, testData)

    return NextResponse.json({
      success: true,
      data: {
        rule: {
          id: rule.id,
          name: rule.name,
          type: rule.type
        },
        testData,
        result,
        passed: !result.violated
      }
    })

  } catch (error) {
    console.error('Error testing rule:', error)
    return NextResponse.json(
      { error: 'Failed to test rule' },
      { status: 500 }
    )
  }
}

// Helper functions
async function getApplicableRules(therapistId: string, serviceId: string, patientId?: string) {
  try {
    const rules = await db.schedulingRule.findMany({
      where: {
        isActive: true,
        OR: [
          { scope: { path: ['applyToAll'], equals: true } },
          { scope: { path: ['therapistIds'], array_contains: therapistId } },
          { scope: { path: ['serviceIds'], array_contains: serviceId } },
          ...(patientId ? [{ scope: { path: ['patientIds'], array_contains: patientId } }] : [])
        ]
      },
      orderBy: { priority: 'desc' }
    })

    return rules.map(rule => ({
      ...rule,
      conditions: JSON.parse(rule.conditions || '{}'),
      actions: JSON.parse(rule.actions || '{}'),
      scope: JSON.parse(rule.scope || '{}')
    }))
  } catch (error) {
    console.error('Error getting applicable rules:', error)
    return []
  }
}

async function validateAgainstRule(rule: any, schedulingData: any) {
  const { conditions, actions } = rule
  const { scheduledDate, scheduledTime, duration, therapistId } = schedulingData

  let violated = false
  let message = ''
  let details = {}

  try {
    switch (rule.type) {
      case 'TIME_CONSTRAINT':
        violated = await validateTimeConstraint(conditions, scheduledDate, scheduledTime, duration)
        if (violated) {
          message = 'Time constraint violation'
          details = { constraint: conditions }
        }
        break

      case 'CAPACITY_LIMIT':
        violated = await validateCapacityLimit(conditions, therapistId, scheduledDate)
        if (violated) {
          message = 'Capacity limit exceeded'
          details = { limit: conditions }
        }
        break

      case 'ADVANCE_BOOKING':
        violated = await validateAdvanceBooking(conditions, scheduledDate)
        if (violated) {
          message = 'Advance booking constraint violation'
          details = { constraint: conditions }
        }
        break

      case 'RECURRING_PATTERN':
        violated = await validateRecurringPattern(conditions, scheduledDate, scheduledTime)
        if (violated) {
          message = 'Recurring pattern violation'
          details = { pattern: conditions }
        }
        break

      case 'CUSTOM':
        violated = await validateCustomRule(conditions, schedulingData)
        if (violated) {
          message = 'Custom rule violation'
          details = { rule: conditions }
        }
        break
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      ruleType: rule.type,
      violated,
      message,
      details,
      action: actions.type,
      actionMessage: actions.message
    }

  } catch (error) {
    console.error('Error validating rule:', error)
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      ruleType: rule.type,
      violated: true,
      message: 'Error validating rule',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      action: 'DENY',
      actionMessage: 'Rule validation failed'
    }
  }
}

async function validateTimeConstraint(conditions: any, scheduledDate: string, scheduledTime: string, duration: number): Promise<boolean> {
  const date = new Date(scheduledDate)
  const dayOfWeek = date.getDay()

  // Check days of week
  if (conditions.daysOfWeek && !conditions.daysOfWeek.includes(dayOfWeek)) {
    return true
  }

  // Check specific dates
  if (conditions.specificDates && conditions.specificDates.includes(scheduledDate)) {
    return true
  }

  // Check time range
  if (conditions.startTime && conditions.endTime) {
    const [startHour, startMinute] = conditions.startTime.split(':').map(Number)
    const [endHour, endMinute] = conditions.endTime.split(':').map(Number)
    const [sessionHour, sessionMinute] = scheduledTime.split(':').map(Number)

    const startTime = startHour * 60 + startMinute
    const endTime = endHour * 60 + endMinute
    const sessionStart = sessionHour * 60 + sessionMinute
    const sessionEnd = sessionStart + duration

    if (sessionStart < startTime || sessionEnd > endTime) {
      return true
    }
  }

  return false
}

async function validateCapacityLimit(conditions: any, therapistId: string, scheduledDate: string): Promise<boolean> {
  const date = new Date(scheduledDate)
  const startOfDay = new Date(date.setHours(0, 0, 0, 0))
  const endOfDay = new Date(date.setHours(23, 59, 59, 999))

  // Check daily limit
  if (conditions.maxSessionsPerDay) {
    const dailyCount = await db.patientSession.count({
      where: {
        therapistId,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
        }
      }
    })

    if (dailyCount >= conditions.maxSessionsPerDay) {
      return true
    }
  }

  // Check weekly limit
  if (conditions.maxSessionsPerWeek) {
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const weeklyCount = await db.patientSession.count({
      where: {
        therapistId,
        scheduledDate: {
          gte: startOfWeek,
          lte: endOfWeek
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
        }
      }
    })

    if (weeklyCount >= conditions.maxSessionsPerWeek) {
      return true
    }
  }

  return false
}

async function validateAdvanceBooking(conditions: any, scheduledDate: string): Promise<boolean> {
  const date = new Date(scheduledDate)
  const today = new Date()
  const daysDifference = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  // Check minimum advance booking
  if (conditions.minAdvanceBooking && daysDifference < conditions.minAdvanceBooking) {
    return true
  }

  // Check maximum advance booking
  if (conditions.maxAdvanceBooking && daysDifference > conditions.maxAdvanceBooking) {
    return true
  }

  return false
}

async function validateRecurringPattern(conditions: any, scheduledDate: string, scheduledTime: string): Promise<boolean> {
  // This is a simplified implementation
  // In a real system, you would have more complex recurring pattern validation
  return false
}

async function validateCustomRule(conditions: any, schedulingData: any): Promise<boolean> {
  // This would evaluate custom logic
  // In a real implementation, you might use a safe evaluation method
  return false
}
