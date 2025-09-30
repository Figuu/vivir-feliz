import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const sendConfirmationSchema = z.object({
  sessionId: z.string().uuid(),
  confirmationType: z.enum(['EMAIL', 'SMS', 'BOTH']).default('EMAIL'),
  reminderHours: z.array(z.number().min(1).max(168)).default([24, 2]), // 24 hours and 2 hours before
  customMessage: z.string().optional()
})

const confirmSessionSchema = z.object({
  confirmationToken: z.string(),
  confirmedBy: z.enum(['PATIENT', 'PARENT', 'THERAPIST', 'ADMIN']),
  confirmationMethod: z.enum(['EMAIL', 'SMS', 'WEB', 'PHONE']),
  notes: z.string().optional()
})

const rescheduleRequestSchema = z.object({
  sessionId: z.string().uuid(),
  newDate: z.string().datetime(),
  newTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  reason: z.string().min(10),
  preferredAlternatives: z.array(z.object({
    date: z.string().datetime(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  })).optional()
})

// GET /api/sessions/confirmation - Get confirmation status and history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const patientId = searchParams.get('patientId')
    const therapistId = searchParams.get('therapistId')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    let whereClause: any = {}

    if (sessionId) whereClause.sessionId = sessionId
    if (patientId) whereClause.patientId = patientId
    if (therapistId) whereClause.therapistId = therapistId
    if (status) whereClause.status = status

    if (dateFrom || dateTo) {
      whereClause.scheduledDate = {}
      if (dateFrom) whereClause.scheduledDate.gte = new Date(dateFrom)
      if (dateTo) whereClause.scheduledDate.lte = new Date(dateTo)
    }

    // Get sessions with confirmation data
    const sessions = await db.patientSession.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            parent: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true
                  }
                }
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
                lastName: true,
                email: true,
                phone: true
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
      ]
    })

    // Get confirmation statistics
    const stats = await db.patientSession.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true
      }
    })

    const confirmationStats = {
      total: sessions.length,
      confirmed: sessions.filter(s => s.status === 'CONFIRMED').length,
      pending: sessions.filter(s => s.status === 'SCHEDULED').length,
      cancelled: sessions.filter(s => s.status === 'CANCELLED').length,
      noShow: sessions.filter(s => s.status === 'NO_SHOW').length
    }

    return NextResponse.json({
      success: true,
      data: {
        sessions,
        stats: confirmationStats,
        breakdown: stats
      }
    })

  } catch (error) {
    console.error('Error fetching confirmation data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/sessions/confirmation - Send confirmation or handle confirmation actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'send'

    switch (action) {
      case 'send':
        return await handleSendConfirmation(body)
      case 'confirm':
        return await handleConfirmSession(body)
      case 'reschedule':
        return await handleRescheduleRequest(body)
      case 'cancel':
        return await handleCancelSession(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: send, confirm, reschedule, or cancel' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in confirmation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleSendConfirmation(body: any) {
  // Validate request body
  const validation = sendConfirmationSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { sessionId, confirmationType, reminderHours, customMessage } = validation.data

  try {
    // Get session details
    const session = await db.patientSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: {
          include: {
            parent: {
              include: {
                profile: true
              }
            }
          }
        },
        therapist: { include: { profile: true } },
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

    if (session.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Session is not in scheduled status' },
        { status: 400 }
      )
    }

    // Generate confirmation token
    const confirmationToken = generateConfirmationToken()

    // Create confirmation record
    const confirmation = await db.sessionConfirmation.create({
      data: {
        sessionId: session.id,
        confirmationToken,
        confirmationType,
        status: 'PENDING',
        sentAt: new Date(),
        reminderHours: reminderHours,
        customMessage: customMessage
      }
    })

    // Send confirmation notifications
    const notificationResults = await sendConfirmationNotifications(
      session,
      confirmation,
      confirmationType,
      customMessage
    )

    // Schedule reminders
    await scheduleReminders(session, confirmation, reminderHours)

    return NextResponse.json({
      success: true,
      message: 'Confirmation sent successfully',
      data: {
        confirmation,
        notifications: notificationResults,
        session: {
          id: session.id,
          scheduledDate: session.scheduledDate,
          scheduledTime: session.scheduledTime,
          patient: session.patient,
          therapist: session.therapist
        }
      }
    })

  } catch (error) {
    console.error('Error sending confirmation:', error)
    return NextResponse.json(
      { error: 'Failed to send confirmation' },
      { status: 500 }
    )
  }
}

async function handleConfirmSession(body: any) {
  // Validate request body
  const validation = confirmSessionSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { confirmationToken, confirmedBy, confirmationMethod, notes } = validation.data

  try {
    // Find confirmation record
    const confirmation = await db.sessionConfirmation.findUnique({
      where: { confirmationToken },
      include: {
        session: {
          include: {
            patient: {
              include: {
                parent: {
                  include: {
                    profile: true
                  }
                }
              }
            },
            therapist: { include: { profile: true } }
          }
        }
      }
    })

    if (!confirmation) {
      return NextResponse.json(
        { error: 'Invalid confirmation token' },
        { status: 404 }
      )
    }

    if (confirmation.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Confirmation has already been processed' },
        { status: 400 }
      )
    }

    // Update confirmation record
    const updatedConfirmation = await db.sessionConfirmation.update({
      where: { id: confirmation.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy,
        confirmationMethod,
        notes
      }
    })

    // Update session status
    await db.patientSession.update({
      where: { id: confirmation.sessionId },
      data: {
        status: 'CONFIRMED',
        sessionNotes: notes ? `${confirmation.session.sessionNotes || ''}\nConfirmed by ${confirmedBy}: ${notes}`.trim() : confirmation.session.sessionNotes
      }
    })

    // Send confirmation receipt
    await sendConfirmationReceipt(confirmation.session, updatedConfirmation)

    return NextResponse.json({
      success: true,
      message: 'Session confirmed successfully',
      data: {
        confirmation: updatedConfirmation,
        session: {
          id: confirmation.session.id,
          status: 'CONFIRMED',
          confirmedAt: updatedConfirmation.confirmedAt
        }
      }
    })

  } catch (error) {
    console.error('Error confirming session:', error)
    return NextResponse.json(
      { error: 'Failed to confirm session' },
      { status: 500 }
    )
  }
}

async function handleRescheduleRequest(body: any) {
  // Validate request body
  const validation = rescheduleRequestSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Invalid request data', details: validation.error.issues },
      { status: 400 }
    )
  }

  const { sessionId, newDate, newTime, reason, preferredAlternatives } = validation.data

  try {
    // Get session details
    const session = await db.patientSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: {
          include: {
            parent: {
              include: {
                profile: true
              }
            }
          }
        },
        therapist: { include: { profile: true } },
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

    // Create reschedule request
    const rescheduleRequest = await db.scheduleRequest.create({
      data: {
        parentId: session.patient.parentId,
        type: 'RESCHEDULE',
        reason,
        description: `Reschedule request for session on ${session.scheduledDate.toLocaleDateString()} at ${session.scheduledTime}`,
        sessionId: session.id,
        newDate: new Date(newDate),
        newTime,
        newAvailability: preferredAlternatives ? JSON.stringify(preferredAlternatives) : null,
        status: 'PENDING'
      }
    })

    // Update session status
    await db.patientSession.update({
      where: { id: sessionId },
      data: {
        status: 'RESCHEDULE_REQUESTED',
        sessionNotes: `${session.sessionNotes || ''}\nReschedule requested: ${reason}`.trim()
      }
    })

    // Notify admin/therapist about reschedule request
    await notifyRescheduleRequest(session, rescheduleRequest)

    return NextResponse.json({
      success: true,
      message: 'Reschedule request submitted successfully',
      data: {
        rescheduleRequest,
        session: {
          id: session.id,
          status: 'RESCHEDULE_REQUESTED'
        }
      }
    })

  } catch (error) {
    console.error('Error handling reschedule request:', error)
    return NextResponse.json(
      { error: 'Failed to process reschedule request' },
      { status: 500 }
    )
  }
}

async function handleCancelSession(body: any) {
  const { sessionId, reason, cancelledBy } = body

  if (!sessionId || !reason) {
    return NextResponse.json(
      { error: 'Session ID and cancellation reason are required' },
      { status: 400 }
    )
  }

  try {
    // Get session details
    const session = await db.patientSession.findUnique({
      where: { id: sessionId },
      include: {
        patient: {
          include: {
            parent: {
              include: {
                profile: true
              }
            }
          }
        },
        therapist: { include: { profile: true } }
      }
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Update session status
    const updatedSession = await db.patientSession.update({
      where: { id: sessionId },
      data: {
        status: 'CANCELLED',
        sessionNotes: `${session.sessionNotes || ''}\nCancelled by ${cancelledBy || 'system'}: ${reason}`.trim()
      }
    })

    // Update any pending confirmations
    await db.sessionConfirmation.updateMany({
      where: {
        sessionId: sessionId,
        status: 'PENDING'
      },
      data: {
        status: 'CANCELLED'
      }
    })

    // Notify relevant parties
    await notifySessionCancellation(session, reason, cancelledBy)

    return NextResponse.json({
      success: true,
      message: 'Session cancelled successfully',
      data: {
        session: updatedSession
      }
    })

  } catch (error) {
    console.error('Error cancelling session:', error)
    return NextResponse.json(
      { error: 'Failed to cancel session' },
      { status: 500 }
    )
  }
}

// Helper functions
function generateConfirmationToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

async function sendConfirmationNotifications(
  session: any,
  confirmation: any,
  confirmationType: string,
  customMessage?: string
): Promise<any> {
  const results = {
    email: { sent: false, error: null },
    sms: { sent: false, error: null }
  }

  try {
    // Send email notification
    if (confirmationType === 'EMAIL' || confirmationType === 'BOTH') {
      try {
        // In a real implementation, you would use an email service like Resend
        // await sendEmail({
        //   to: session.patient.parent.email,
        //   subject: 'Session Confirmation Required',
        //   template: 'session-confirmation',
        //   data: {
        //     session,
        //     confirmation,
        //     customMessage
        //   }
        // })
        results.email.sent = true
      } catch (error) {
        results.email.error = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Send SMS notification
    if (confirmationType === 'SMS' || confirmationType === 'BOTH') {
      try {
        // In a real implementation, you would use an SMS service
        // await sendSMS({
        //   to: session.patient.parent.phone,
        //   message: `Please confirm your therapy session on ${session.scheduledDate.toLocaleDateString()} at ${session.scheduledTime}. Reply CONFIRM to confirm.`
        // })
        results.sms.sent = true
      } catch (error) {
        results.sms.error = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return results
  } catch (error) {
    console.error('Error sending confirmation notifications:', error)
    return results
  }
}

async function scheduleReminders(session: any, confirmation: any, reminderHours: number[]): Promise<void> {
  try {
    for (const hours of reminderHours) {
      const reminderTime = new Date(session.scheduledDate)
      const [sessionHour, sessionMinute] = session.scheduledTime.split(':').map(Number)
      reminderTime.setHours(sessionHour, sessionMinute, 0, 0)
      reminderTime.setHours(reminderTime.getHours() - hours)

      // In a real implementation, you would schedule these reminders
      // using a job queue system like Bull or Agenda
      console.log(`Scheduling reminder for ${hours} hours before session at ${reminderTime}`)
    }
  } catch (error) {
    console.error('Error scheduling reminders:', error)
  }
}

async function sendConfirmationReceipt(session: any, confirmation: any): Promise<void> {
  try {
    // Send confirmation receipt to relevant parties
    console.log(`Sending confirmation receipt for session ${session.id}`)
  } catch (error) {
    console.error('Error sending confirmation receipt:', error)
  }
}

async function notifyRescheduleRequest(session: any, rescheduleRequest: any): Promise<void> {
  try {
    // Notify admin and therapist about reschedule request
    console.log(`Notifying about reschedule request for session ${session.id}`)
  } catch (error) {
    console.error('Error notifying reschedule request:', error)
  }
}

async function notifySessionCancellation(session: any, reason: string, cancelledBy?: string): Promise<void> {
  try {
    // Notify relevant parties about session cancellation
    console.log(`Notifying about session cancellation for session ${session.id}`)
  } catch (error) {
    console.error('Error notifying session cancellation:', error)
  }
}
