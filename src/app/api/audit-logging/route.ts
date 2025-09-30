import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const auditLogSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  action: z.enum(['create', 'read', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'export']),
  entityType: z.string().max(100, 'Entity type cannot exceed 100 characters'),
  entityId: z.string().uuid('Invalid entity ID').optional(),
  changes: z.record(z.any()).optional(),
  metadata: z.object({
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    sessionId: z.string().optional()
  }).optional()
})

const auditQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0),
  limit: z.string().transform(val => parseInt(val) || 50).refine(val => val > 0 && val <= 100),
  userId: z.string().uuid().optional(),
  action: z.enum(['create', 'read', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'export']).optional(),
  entityType: z.string().optional(),
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
      userId: searchParams.get('userId'),
      action: searchParams.get('action'),
      entityType: searchParams.get('entityType'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { page, limit, userId, action, entityType, startDate, endDate, sortOrder } = validation.data

    const whereClause: any = {}
    
    if (userId) whereClause.userId = userId
    if (action) whereClause.action = action
    if (entityType) whereClause.entityType = entityType
    if (startDate) whereClause.createdAt = { gte: new Date(startDate) }
    if (endDate) whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(endDate) }

    const skip = (page - 1) * limit

    const [logs, totalCount] = await Promise.all([
      db.auditLog.findMany({
        where: whereClause,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, role: true } }
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
        { error: 'Invalid request data', details: validation.error.errors },
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
