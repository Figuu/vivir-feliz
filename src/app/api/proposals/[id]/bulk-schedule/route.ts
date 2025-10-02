import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Simplified validation schema
const bulkScheduleSchema = z.object({
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

// POST /api/proposals/[id]/bulk-schedule - Bulk schedule sessions for approved proposal
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { startDate, endDate, frequency, daysOfWeek, timeSlots, notes } = validation.data

    // Get proposal with related data
    const proposal = await db.therapeuticProposal.findUnique({
      where: { id: params.id },
      include: {
        patient: {
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
        }
      }
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Check if proposal is approved
    if (proposal.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Proposal must be approved before scheduling sessions' },
        { status: 400 }
      )
    }

    // Generate session dates based on frequency
    const sessionDates: Date[] = []
    const start = new Date(startDate)
    const end = new Date(endDate)

    let currentDate = new Date(start)
    while (currentDate <= end) {
      const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
      
      if (!daysOfWeek || daysOfWeek.includes(dayOfWeek as 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY')) {
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
    for (const date of sessionDates) {
      for (const timeSlot of timeSlots) {
        const [hours, minutes] = timeSlot.time.split(':').map(Number)
        const sessionDateTime = new Date(date)
        sessionDateTime.setHours(hours, minutes, 0, 0)

        const session = await db.session.create({
          data: {
            patientId: proposal.patientId,
            therapistId: proposal.therapistId,
            scheduledDate: sessionDateTime,
            duration: timeSlot.duration,
            status: 'SCHEDULED',
            notes: notes || `Bulk scheduled session for proposal ${proposal.id}`
          },
          include: {
            patient: {
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
            }
          }
        })

        createdSessions.push(session)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdSessions.length} sessions`,
      data: {
        proposalId: params.id,
        sessionsCreated: createdSessions.length,
        sessions: createdSessions.map(session => ({
          id: session.id,
          scheduledDate: session.scheduledDate,
          duration: session.duration,
          status: session.status,
          patient: session.patient,
          therapist: session.therapist
        }))
      }
    })

  } catch (error) {
    console.error('Error creating bulk schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}