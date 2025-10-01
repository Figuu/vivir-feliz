import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { z } from 'zod'

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

// Mock schedule requests data since there's no scheduleRequest table in the schema
let mockScheduleRequests: any[] = []

// GET - List schedule requests
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await db.profile.findUnique({
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
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Filter mock requests based on user role and parameters
    let filteredRequests = mockScheduleRequests

    // Parents can only see their own requests
    if (dbUser.role === 'PARENT') {
      filteredRequests = filteredRequests.filter(request => request.parentId === dbUser.parent?.id)
    }

    if (status) {
      filteredRequests = filteredRequests.filter(request => request.status === status)
    }

    if (type) {
      filteredRequests = filteredRequests.filter(request => request.type === type)
    }

    // Sort by creation date
    filteredRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      success: true,
      data: {
        requests: filteredRequests,
        totalCount: filteredRequests.length
      }
    })

  } catch (error) {
    console.error('Error fetching schedule requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create schedule request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await db.profile.findUnique({
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

    const body = await request.json()
    
    const validation = createScheduleRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const requestData = validation.data

    // Create new schedule request
    const newRequest = {
      id: `schedule-request-${Date.now()}`,
      type: requestData.type,
      reason: requestData.reason,
      description: requestData.description,
      sessionId: requestData.sessionId,
      newDate: requestData.newDate,
      newTime: requestData.newTime,
      newAvailability: requestData.newAvailability,
      frequency: requestData.frequency,
      mixServices: requestData.mixServices,
      status: 'PENDING',
      parentId: dbUser.parent?.id,
      createdBy: user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Add to mock requests
    mockScheduleRequests.push(newRequest)

    return NextResponse.json({
      success: true,
      message: 'Schedule request created successfully',
      data: newRequest
    })

  } catch (error) {
    console.error('Error creating schedule request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update schedule request
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await db.profile.findUnique({
      where: { id: user.id }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    
    const validation = updateScheduleRequestSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { requestId, ...updateData } = body

    // Find and update the request in mock data
    const requestIndex = mockScheduleRequests.findIndex(req => req.id === requestId)
    if (requestIndex === -1) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    mockScheduleRequests[requestIndex] = {
      ...mockScheduleRequests[requestIndex],
      ...updateData,
      updatedAt: new Date(),
      updatedBy: user.id
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule request updated successfully',
      data: mockScheduleRequests[requestIndex]
    })

  } catch (error) {
    console.error('Error updating schedule request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}