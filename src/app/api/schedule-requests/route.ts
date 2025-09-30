import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { ScheduleRequestType, RequestStatus } from '@prisma/client'

const createScheduleRequestSchema = z.object({
  type: z.enum(['RESCHEDULE_SESSION', 'CANCEL_SESSION', 'RESCHEDULE_ALL_REMAINING', 'CHANGE_THERAPIST']),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  description: z.string().optional(),
  sessionId: z.string().uuid().optional(),
  newDate: z.string().datetime().optional(),
  newTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  newAvailability: z.any().optional(),
  frequency: z.number().min(1).max(7).optional(),
  mixServices: z.boolean().optional()
})

const updateScheduleRequestSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED']),
  adminNotes: z.string().optional()
})

// GET - List schedule requests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        parent: {
          select: { id: true }
        }
      }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as RequestStatus | null
    const type = searchParams.get('type') as ScheduleRequestType | null

    // Build where clause
    const where: any = {}
    
    // Parents can only see their own requests
    if (dbUser.role === 'PARENT') {
      where.parentId = dbUser.parent?.id
    }
    
    if (status) {
      where.status = status
    }
    
    if (type) {
      where.type = type
    }

    const scheduleRequests = await db.scheduleRequest.findMany({
      where,
      include: {
        parent: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // For each request, fetch the associated session if sessionId exists
    const requestsWithSessions = await Promise.all(
      scheduleRequests.map(async (request) => {
        if (request.sessionId) {
          const session = await db.patientSession.findUnique({
            where: { id: request.sessionId },
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
              therapist: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
              serviceAssignment: {
                select: {
                  service: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          })
          return { ...request, session }
        }
        return { ...request, session: null }
      })
    )

    return NextResponse.json({
      scheduleRequests: requestsWithSessions,
      count: scheduleRequests.length
    })
  } catch (error) {
    console.error('Error fetching schedule requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new schedule request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        parent: {
          select: { id: true }
        }
      }
    })

    if (!dbUser || dbUser.role !== 'PARENT') {
      return NextResponse.json({ error: 'Only parents can create schedule requests' }, { status: 403 })
    }

    const body = await request.json()
    
    const validation = createScheduleRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { type, reason, description, sessionId, newDate, newTime, newAvailability, frequency, mixServices } = validation.data

    const scheduleRequest = await db.scheduleRequest.create({
      data: {
        parentId: dbUser.parent!.id,
        type,
        reason,
        description,
        sessionId,
        newDate: newDate ? new Date(newDate) : null,
        newTime,
        newAvailability: newAvailability || null,
        frequency,
        mixServices: mixServices ?? true,
        status: 'PENDING'
      },
      include: {
        parent: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Schedule request created successfully',
      scheduleRequest
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update schedule request status (Admin/Coordinator only)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id }
    })

    if (!dbUser || !['ADMIN', 'SUPER_ADMIN'].includes(dbUser.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    const body = await request.json()
    
    const validation = updateScheduleRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { status, adminNotes } = validation.data

    const updatedRequest = await db.scheduleRequest.update({
      where: { id: requestId },
      data: {
        status,
        adminNotes,
        processedBy: dbUser.id,
        processedAt: new Date()
      },
      include: {
        parent: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Schedule request updated successfully',
      scheduleRequest: updatedRequest
    })
  } catch (error) {
    console.error('Error updating schedule request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
