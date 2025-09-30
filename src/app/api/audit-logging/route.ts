import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const auditLogSchema = z.object({
  profileId: z.string().uuid('Invalid profile ID'),
  action: z.string(),
  resource: z.string().max(100, 'Resource cannot exceed 100 characters'),
  resourceId: z.string().uuid('Invalid resource ID').optional(),
  oldValue: z.record(z.string(), z.any()).optional(),
  newValue: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  success: z.boolean().default(true),
  errorMessage: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  category: z.string().optional()
})

const auditQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0),
  limit: z.string().transform(val => parseInt(val) || 50).refine(val => val > 0 && val <= 100),
  profileId: z.string().uuid().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const validation = auditQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      profileId: searchParams.get('profileId'),
      action: searchParams.get('action'),
      resource: searchParams.get('resource'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, profileId, action, resource, startDate, endDate, sortOrder } = validation.data

    const whereClause: any = {}
    
    if (profileId) whereClause.profileId = profileId
    if (action) whereClause.action = action
    if (resource) whereClause.resource = resource
    if (startDate) whereClause.createdAt = { gte: new Date(startDate) }
    if (endDate) whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) }

    const skip = (page - 1) * limit

    const [logs, totalCount] = await Promise.all([
      db.auditLog.findMany({
        where: whereClause,
        include: {
          profile: { select: { firstName: true, lastName: true, email: true, role: true } }
        },
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit
      }),
      db.auditLog.count({ where: whereClause })
    ])

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = auditLogSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const log = await db.auditLog.create({
      data: validation.data
    })

    return NextResponse.json({
      success: true,
      data: log
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating audit log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
