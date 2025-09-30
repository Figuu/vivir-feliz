import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const autoRescheduleSchema = z.object({
  sessionIds: z.array(z.string().uuid('Invalid session ID')).min(1, 'At least one session required'),
  preferences: z.object({
    preferredDays: z.array(z.number().min(0).max(6)).optional(),
    preferredTimeSlots: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)).optional(),
    keepSameTherapist: z.boolean().default(true),
    minimizeGaps: z.boolean().default(true),
    respectParentAvailability: z.boolean().default(true)
  }).optional(),
  triggeredBy: z.string().uuid('Invalid user ID')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = autoRescheduleSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { sessionIds, preferences, triggeredBy } = validation.data

    // Get sessions to reschedule
    const sessions = await db.patientSession.findMany({
      where: { id: { in: sessionIds } },
      include: {
        patient: true,
        therapist: true,
        serviceAssignment: { include: { proposalService: true } }
      }
    })

    if (sessions.length === 0) {
      return NextResponse.json({ error: 'No sessions found' }, { status: 404 })
    }

    // Get therapist schedules
    const therapistIds = [...new Set(sessions.map(s => s.therapistId))]
    const schedules = await db.therapistSchedule.findMany({
      where: { therapistId: { in: therapistIds }, isAvailable: true }
    })

    // Find available slots
    const results = []
    for (const session of sessions) {
      const availableSlots = findAvailableSlots(session, schedules, preferences || {})
      
      if (availableSlots.length > 0) {
        const bestSlot = availableSlots[0]
        
        // Update session
        const updated = await db.patientSession.update({
          where: { id: session.id },
          data: {
            scheduledDate: bestSlot.date,
            scheduledTime: bestSlot.time,
            therapistId: bestSlot.therapistId,
            status: 'rescheduled',
            rescheduledReason: 'Automatic rescheduling',
            rescheduledBy: triggeredBy,
            rescheduledAt: new Date()
          }
        })

        results.push({ success: true, sessionId: session.id, newSlot: bestSlot })
      } else {
        results.push({ success: false, sessionId: session.id, error: 'No available slots found' })
      }
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      message: `Rescheduled ${successCount} of ${sessions.length} sessions`,
      data: { results, successCount, totalCount: sessions.length }
    })

  } catch (error) {
    console.error('Error in automatic rescheduling:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function findAvailableSlots(session: any, schedules: any[], preferences: any) {
  const slots = []
  const today = new Date()
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    
    if (preferences.preferredDays && !preferences.preferredDays.includes(date.getDay())) {
      continue
    }

    for (const schedule of schedules) {
      if (schedule.therapistId !== session.therapistId && preferences.keepSameTherapist) {
        continue
      }

      slots.push({
        date,
        time: schedule.startTime,
        therapistId: schedule.therapistId,
        score: calculateSlotScore(date, schedule.startTime, preferences)
      })
    }
  }

  return slots.sort((a, b) => b.score - a.score).slice(0, 10)
}

function calculateSlotScore(date: Date, time: string, preferences: any): number {
  let score = 100
  
  // Prefer sooner dates
  const daysFromNow = Math.floor((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  score -= daysFromNow * 2
  
  // Prefer preferred time slots
  if (preferences.preferredTimeSlots && preferences.preferredTimeSlots.includes(time)) {
    score += 20
  }
  
  return score
}
