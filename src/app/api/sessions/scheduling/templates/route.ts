import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const createTemplateSchema = z.object({
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
    avoidTimeSlots: z.array(z.string()).optional(),
    maxSessionsPerDay: z.number().min(1).max(20).optional(),
    bufferTimeBetweenSessions: z.number().min(0).max(60).default(15)
  }),
  isActive: z.boolean().default(true)
})

const updateTemplateSchema = createTemplateSchema.partial().extend({
  id: z.string().uuid()
})

const applyTemplateSchema = z.object({
  templateId: z.string().uuid(),
  patientId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  occurrences: z.number().min(1).max(100).optional(),
  customizations: z.object({
    duration: z.number().min(15).max(480).optional(),
    timeSlots: z.array(z.string()).optional(),
    notes: z.string().optional()
  }).optional()
})

// GET /api/sessions/scheduling/templates - Get scheduling templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const therapistId = searchParams.get('therapistId')
    const serviceId = searchParams.get('serviceId')
    const isActive = searchParams.get('isActive')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    let whereClause: any = {}

    if (therapistId) whereClause.therapistId = therapistId
    if (serviceId) whereClause.serviceId = serviceId
    if (isActive !== null) whereClause.isActive = isActive === 'true'
    if (!includeInactive) whereClause.isActive = true

    const templates = await db.schedulingTemplate.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            type: true,
            sessionDuration: true
          }
        },
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Parse JSON fields
    const parsedTemplates = templates.map(template => ({
      ...template,
      defaultTimeSlots: JSON.parse(template.defaultTimeSlots || '[]'),
      schedulingRules: JSON.parse(template.schedulingRules || '{}')
    }))

    return NextResponse.json({
      success: true,
      data: {
        templates: parsedTemplates,
        total: templates.length
      }
    })

  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/scheduling/templates - Create or apply templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'create'

    switch (action) {
      case 'create':
        return await handleCreateTemplate(body)
      case 'update':
        return await handleUpdateTemplate(body)
      case 'apply':
        return await handleApplyTemplate(body)
      case 'duplicate':
        return await handleDuplicateTemplate(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create, update, apply, or duplicate' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in templates API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/sessions/scheduling/templates - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Check if template is being used
    const usageCount = await db.patientSession.count({
      where: {
        // In a real implementation, you would track template usage
        // For now, we'll just check if the template exists
      }
    })

    if (usageCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete template that is currently in use' },
        { status: 400 }
      )
    }

    // Soft delete by setting isActive to false
    const deletedTemplate = await db.schedulingTemplate.update({
      where: { id: templateId },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
      data: {
        template: deletedTemplate
      }
    })

  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}

async function handleCreateTemplate(body: any) {
  // Validate request body
  const validation = createTemplateSchema.safeParse(body)
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
    // Check if template with same name already exists for this therapist
    const existingTemplate = await db.schedulingTemplate.findFirst({
      where: {
        name,
        therapistId,
        isActive: true
      }
    })

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template with this name already exists for this therapist' },
        { status: 400 }
      )
    }

    // Validate service and therapist exist
    const [service, therapist] = await Promise.all([
      db.service.findUnique({ where: { id: serviceId } }),
      db.therapist.findUnique({ where: { id: therapistId } })
    ])

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

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
        template: {
          ...template,
          defaultTimeSlots: JSON.parse(template.defaultTimeSlots || '[]'),
          schedulingRules: JSON.parse(template.schedulingRules || '{}')
        }
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

async function handleUpdateTemplate(body: any) {
  // Validate request body
  const validation = updateTemplateSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.errors },
      { status: 400 }
    )
  }

  const { id, ...updateData } = validation.data

  try {
    // Check if template exists
    const existingTemplate = await db.schedulingTemplate.findUnique({
      where: { id }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateFields: any = {}
    if (updateData.name) updateFields.name = updateData.name
    if (updateData.description !== undefined) updateFields.description = updateData.description
    if (updateData.serviceId) updateFields.serviceId = updateData.serviceId
    if (updateData.therapistId) updateFields.therapistId = updateData.therapistId
    if (updateData.defaultDuration) updateFields.defaultDuration = updateData.defaultDuration
    if (updateData.defaultTimeSlots) updateFields.defaultTimeSlots = JSON.stringify(updateData.defaultTimeSlots)
    if (updateData.schedulingRules) updateFields.schedulingRules = JSON.stringify(updateData.schedulingRules)
    if (updateData.isActive !== undefined) updateFields.isActive = updateData.isActive

    const updatedTemplate = await db.schedulingTemplate.update({
      where: { id },
      data: updateFields,
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
      message: 'Template updated successfully',
      data: {
        template: {
          ...updatedTemplate,
          defaultTimeSlots: JSON.parse(updatedTemplate.defaultTimeSlots || '[]'),
          schedulingRules: JSON.parse(updatedTemplate.schedulingRules || '{}')
        }
      }
    })

  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

async function handleApplyTemplate(body: any) {
  // Validate request body
  const validation = applyTemplateSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.errors },
      { status: 400 }
    )
  }

  const { templateId, patientId, startDate, endDate, occurrences, customizations } = validation.data

  try {
    // Get template
    const template = await db.schedulingTemplate.findUnique({
      where: { id: templateId },
      include: {
        service: true,
        therapist: true
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    if (!template.isActive) {
      return NextResponse.json(
        { error: 'Template is not active' },
        { status: 400 }
      )
    }

    // Validate patient exists
    const patient = await db.patient.findUnique({
      where: { id: patientId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Parse template data
    const defaultTimeSlots = JSON.parse(template.defaultTimeSlots || '[]')
    const schedulingRules = JSON.parse(template.schedulingRules || '{}')

    // Apply customizations
    const finalDuration = customizations?.duration || template.defaultDuration
    const finalTimeSlots = customizations?.timeSlots || defaultTimeSlots
    const finalNotes = customizations?.notes || ''

    // Generate sessions based on template
    const sessions = await generateSessionsFromTemplate({
      template,
      patientId,
      startDate,
      endDate,
      occurrences,
      duration: finalDuration,
      timeSlots: finalTimeSlots,
      notes: finalNotes,
      schedulingRules
    })

    return NextResponse.json({
      success: true,
      message: `Template applied successfully: ${sessions.length} sessions created`,
      data: {
        sessions,
        template: {
          id: template.id,
          name: template.name,
          service: template.service,
          therapist: template.therapist
        },
        summary: {
          totalSessions: sessions.length,
          startDate,
          endDate,
          duration: finalDuration
        }
      }
    })

  } catch (error) {
    console.error('Error applying template:', error)
    return NextResponse.json(
      { error: 'Failed to apply template' },
      { status: 500 }
    )
  }
}

async function handleDuplicateTemplate(body: any) {
  const { templateId, newName } = body

  if (!templateId || !newName) {
    return NextResponse.json(
      { error: 'Template ID and new name are required' },
      { status: 400 }
    )
  }

  try {
    // Get original template
    const originalTemplate = await db.schedulingTemplate.findUnique({
      where: { id: templateId }
    })

    if (!originalTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Check if template with new name already exists
    const existingTemplate = await db.schedulingTemplate.findFirst({
      where: {
        name: newName,
        therapistId: originalTemplate.therapistId,
        isActive: true
      }
    })

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template with this name already exists for this therapist' },
        { status: 400 }
      )
    }

    // Create duplicate
    const duplicatedTemplate = await db.schedulingTemplate.create({
      data: {
        name: newName,
        description: originalTemplate.description,
        serviceId: originalTemplate.serviceId,
        therapistId: originalTemplate.therapistId,
        defaultDuration: originalTemplate.defaultDuration,
        defaultTimeSlots: originalTemplate.defaultTimeSlots,
        schedulingRules: originalTemplate.schedulingRules,
        isActive: true
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
      message: 'Template duplicated successfully',
      data: {
        template: {
          ...duplicatedTemplate,
          defaultTimeSlots: JSON.parse(duplicatedTemplate.defaultTimeSlots || '[]'),
          schedulingRules: JSON.parse(duplicatedTemplate.schedulingRules || '{}')
        }
      }
    })

  } catch (error) {
    console.error('Error duplicating template:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate template' },
      { status: 500 }
    )
  }
}

// Helper function to generate sessions from template
async function generateSessionsFromTemplate(params: {
  template: any
  patientId: string
  startDate: string
  endDate?: string
  occurrences?: number
  duration: number
  timeSlots: string[]
  notes: string
  schedulingRules: any
}): Promise<any[]> {
  const sessions = []
  const start = new Date(params.startDate)
  const end = params.endDate ? new Date(params.endDate) : null
  const maxOccurrences = params.occurrences || 52

  let currentDate = new Date(start)
  let sessionCount = 0

  // Get therapist schedule for the template's therapist
  const therapistSchedules = await db.therapistSchedule.findMany({
    where: {
      therapistId: params.template.therapistId,
      isActive: true
    }
  })

  while (sessionCount < maxOccurrences && (!end || currentDate <= end)) {
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
    const therapistSchedule = therapistSchedules.find(s => s.dayOfWeek === dayOfWeek)

    if (therapistSchedule) {
      // Check if this day matches the scheduling rules
      if (isValidSchedulingDay(currentDate, params.schedulingRules)) {
        // Try to schedule sessions for available time slots
        for (const timeSlot of params.timeSlots) {
          if (sessionCount >= maxOccurrences) break

          // Check if time slot is available
          const isAvailable = await isTimeSlotAvailable(
            params.template.therapistId,
            currentDate,
            timeSlot,
            params.duration
          )

          if (isAvailable) {
            const session = await db.patientSession.create({
              data: {
                patientId: params.patientId,
                therapistId: params.template.therapistId,
                scheduledDate: new Date(currentDate),
                scheduledTime: timeSlot,
                duration: params.duration,
                status: 'SCHEDULED',
                sessionNotes: params.notes
              }
            })

            // Create service assignment
            await db.serviceAssignment.create({
              data: {
                proposalServiceId: params.template.serviceId,
                sessionId: session.id,
                assignedAt: new Date(),
                status: 'ACTIVE'
              }
            })

            sessions.push(session)
            sessionCount++
          }
        }
      }
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return sessions
}

function isValidSchedulingDay(date: Date, rules: any): boolean {
  const dayOfWeek = date.getDay()

  // Check weekend rule
  if (!rules.allowWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return false
  }

  // Check holiday rule (in a real implementation, you would check against a holidays database)
  if (!rules.allowHolidays && isHoliday(date)) {
    return false
  }

  return true
}

function isHoliday(date: Date): boolean {
  // In a real implementation, you would check against a holidays database
  // For now, we'll just return false
  return false
}

async function isTimeSlotAvailable(
  therapistId: string,
  date: Date,
  time: string,
  duration: number
): Promise<boolean> {
  try {
    // Check for existing sessions
    const existingSessions = await db.patientSession.findMany({
      where: {
        therapistId,
        scheduledDate: {
          gte: date,
          lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
        }
      }
    })

    const [startHour, startMinute] = time.split(':').map(Number)
    const startTime = startHour * 60 + startMinute
    const endTime = startTime + duration

    for (const session of existingSessions) {
      const [sessionStartHour, sessionStartMinute] = session.scheduledTime.split(':').map(Number)
      const sessionStart = sessionStartHour * 60 + sessionStartMinute
      const sessionEnd = sessionStart + session.duration

      if (startTime < sessionEnd && endTime > sessionStart) {
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error checking time slot availability:', error)
    return false
  }
}
