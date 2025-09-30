import { NextRequest, NextResponse } from 'next/server'
// import { z } from 'zod'
// import { db } from '@/lib/db'

// TODO: This route requires a NotificationTemplate model to be added to the Prisma schema
// Temporarily disabled until the model is created

/*
const templateQuerySchema = z.object({
  type: z.enum(['email', 'sms', 'in_app']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50)
})

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  description: z.string().optional(),
  type: z.enum(['email', 'sms', 'in_app']),
  category: z.enum(['appointment', 'payment', 'report', 'system', 'user', 'general']),
  subject: z.string().optional(), // For email
  body: z.string().min(1, 'Template body is required'),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  createdBy: z.string().uuid()
})

const updateTemplateSchema = z.object({
  templateId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  updatedBy: z.string().uuid()
})
*/

// GET - List notification templates
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'NotificationTemplate feature not yet implemented - requires Prisma model' },
    { status: 501 }
  )
}

/*
export async function GET_DISABLED(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const validation = templateQuerySchema.safeParse({
      type: searchParams.get('type'),
      category: searchParams.get('category'),
      search: searchParams.get('search'),
      limit: searchParams.get('limit')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { type, category, search, limit } = validation.data

    // Build where clause
    const where: any = {}
    
    if (type) where.type = type
    if (category) where.category = category
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [templates, totalCount, byType, byCategory] = await Promise.all([
      db.notificationTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      db.notificationTemplate.count({ where }),
      db.notificationTemplate.groupBy({
        by: ['type'],
        _count: true
      }),
      db.notificationTemplate.groupBy({
        by: ['category'],
        _count: true
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        templates,
        statistics: {
          totalCount,
          activeCount: templates.filter(t => t.isActive).length,
          byType: byType.map(t => ({ type: t.type, count: t._count })),
          byCategory: byCategory.map(c => ({ category: c.category, count: c._count }))
        }
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

// POST - Create notification template
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'NotificationTemplate feature not yet implemented - requires Prisma model' },
    { status: 501 }
  )
}

/*
export async function POST_DISABLED(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = createTemplateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const data = validation.data

    // Check for duplicate name
    const existing = await db.notificationTemplate.findFirst({
      where: {
        name: data.name,
        type: data.type
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A template with this name and type already exists' },
        { status: 409 }
      )
    }

    // Create template
    const template = await db.notificationTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        subject: data.subject,
        body: data.body,
        variables: data.variables || [],
        isActive: data.isActive,
        createdBy: data.createdBy
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Notification template created successfully',
      data: template
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update notification template
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'NotificationTemplate feature not yet implemented - requires Prisma model' },
    { status: 501 }
  )
}

/*
export async function PUT_DISABLED(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = updateTemplateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { templateId, updatedBy, ...updateData } = validation.data

    // Check if template exists
    const existing = await db.notificationTemplate.findUnique({
      where: { id: templateId }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Update template
    const template = await db.notificationTemplate.update({
      where: { id: templateId },
      data: {
        ...updateData,
        updatedBy,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      data: template
    })

  } catch (error) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete notification template
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'NotificationTemplate feature not yet implemented - requires Prisma model' },
    { status: 501 }
  )
}

/*
export async function DELETE_DISABLED(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Check if template exists
    const template = await db.notificationTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Soft delete
    await db.notificationTemplate.update({
      where: { id: templateId },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
*/
