import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const specialtySchema = z.object({
  name: z.string()
    .min(2, 'Specialty name must be at least 2 characters')
    .max(100, 'Specialty name must be less than 100 characters')
    .regex(/^[a-zA-Z\s\-&]+$/, 'Specialty name can only contain letters, spaces, hyphens, and ampersands'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  category: z.string()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must be less than 50 characters'),
  requirements: z.string()
    .max(1000, 'Requirements must be less than 1000 characters')
    .optional(),
  isActive: z.boolean().default(true),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color code')
    .optional()
})

const specialtyUpdateSchema = specialtySchema.partial().extend({
  id: z.string().uuid()
})

const specialtyQuerySchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['name', 'category', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// GET /api/specialties - Get specialties with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = specialtyQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      isActive: searchParams.get('isActive'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { page, limit, search, category, isActive, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      whereClause.category = { contains: category, mode: 'insensitive' }
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive
    }

    // Get specialties with pagination
    const [specialties, totalCount] = await Promise.all([
      db.specialty.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              therapists: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.specialty.count({ where: whereClause })
    ])

    // Get categories for filtering
    const categories = await db.specialty.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { isActive: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        specialties,
        categories: categories.map(c => c.category),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching specialties:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/specialties - Create new specialty
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = specialtySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const specialtyData = validation.data

    // Check if specialty name already exists
    const existingSpecialty = await db.specialty.findFirst({
      where: { 
        name: { equals: specialtyData.name, mode: 'insensitive' }
      }
    })

    if (existingSpecialty) {
      return NextResponse.json(
        { error: 'Specialty name already exists' },
        { status: 409 }
      )
    }

    // Create specialty
    const specialty = await db.specialty.create({
      data: specialtyData,
      include: {
        _count: {
          select: {
            therapists: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Specialty created successfully',
      data: { specialty }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating specialty:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/specialties - Update specialty
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = specialtyUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { id, ...updateData } = validation.data

    // Check if specialty exists
    const existingSpecialty = await db.specialty.findUnique({
      where: { id }
    })

    if (!existingSpecialty) {
      return NextResponse.json(
        { error: 'Specialty not found' },
        { status: 404 }
      )
    }

    // Check if name is being changed and if it already exists
    if (updateData.name && updateData.name !== existingSpecialty.name) {
      const nameExists = await db.specialty.findFirst({
        where: { 
          name: { equals: updateData.name, mode: 'insensitive' },
          id: { not: id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Specialty name already exists' },
          { status: 409 }
        )
      }
    }

    // Update specialty
    const specialty = await db.specialty.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            therapists: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Specialty updated successfully',
      data: { specialty }
    })

  } catch (error) {
    console.error('Error updating specialty:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/specialties - Delete specialty (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Specialty ID is required' },
        { status: 400 }
      )
    }

    // Check if specialty exists
    const existingSpecialty = await db.specialty.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            therapists: true
          }
        }
      }
    })

    if (!existingSpecialty) {
      return NextResponse.json(
        { error: 'Specialty not found' },
        { status: 404 }
      )
    }

    // Check if specialty is assigned to any therapists
    if (existingSpecialty._count.therapists > 0) {
      return NextResponse.json(
        { error: 'Cannot delete specialty that is assigned to therapists' },
        { status: 409 }
      )
    }

    // Soft delete by setting isActive to false
    await db.specialty.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Specialty deactivated successfully'
    })

  } catch (error) {
    console.error('Error deleting specialty:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
