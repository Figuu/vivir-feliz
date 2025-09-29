import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const certificationSchema = z.object({
  name: z.string()
    .min(2, 'Certification name must be at least 2 characters')
    .max(100, 'Certification name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-&()]+$/, 'Certification name can only contain letters, numbers, spaces, hyphens, ampersands, and parentheses'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  issuingOrganization: z.string()
    .min(2, 'Issuing organization must be at least 2 characters')
    .max(100, 'Issuing organization must be less than 100 characters'),
  category: z.string()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must be less than 50 characters'),
  expiryRequired: z.boolean().default(false),
  validityPeriod: z.number()
    .min(1, 'Validity period must be at least 1 year')
    .max(10, 'Validity period cannot exceed 10 years')
    .optional(),
  requirements: z.string()
    .max(1000, 'Requirements must be less than 1000 characters')
    .optional(),
  website: z.string()
    .url('Website must be a valid URL')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color code')
    .optional()
})

const certificationUpdateSchema = certificationSchema.partial().extend({
  id: z.string().uuid()
})

const certificationQuerySchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  issuingOrganization: z.string().optional(),
  expiryRequired: z.string().transform(val => val === 'true').optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['name', 'category', 'issuingOrganization', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// GET /api/certifications - Get certifications with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = certificationQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      category: searchParams.get('category'),
      issuingOrganization: searchParams.get('issuingOrganization'),
      expiryRequired: searchParams.get('expiryRequired'),
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

    const { page, limit, search, category, issuingOrganization, expiryRequired, isActive, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { issuingOrganization: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      whereClause.category = { contains: category, mode: 'insensitive' }
    }

    if (issuingOrganization) {
      whereClause.issuingOrganization = { contains: issuingOrganization, mode: 'insensitive' }
    }

    if (expiryRequired !== undefined) {
      whereClause.expiryRequired = expiryRequired
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive
    }

    // Get certifications with pagination
    const [certifications, totalCount] = await Promise.all([
      db.certification.findMany({
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
      db.certification.count({ where: whereClause })
    ])

    // Get categories and organizations for filtering
    const [categories, organizations] = await Promise.all([
      db.certification.findMany({
        select: { category: true },
        distinct: ['category'],
        where: { isActive: true }
      }),
      db.certification.findMany({
        select: { issuingOrganization: true },
        distinct: ['issuingOrganization'],
        where: { isActive: true }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        certifications,
        categories: categories.map(c => c.category),
        organizations: organizations.map(o => o.issuingOrganization),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching certifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/certifications - Create new certification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = certificationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const certificationData = validation.data

    // Check if certification name already exists
    const existingCertification = await db.certification.findFirst({
      where: { 
        name: { equals: certificationData.name, mode: 'insensitive' }
      }
    })

    if (existingCertification) {
      return NextResponse.json(
        { error: 'Certification name already exists' },
        { status: 409 }
      )
    }

    // Create certification
    const certification = await db.certification.create({
      data: certificationData,
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
      message: 'Certification created successfully',
      data: { certification }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating certification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/certifications - Update certification
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = certificationUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { id, ...updateData } = validation.data

    // Check if certification exists
    const existingCertification = await db.certification.findUnique({
      where: { id }
    })

    if (!existingCertification) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      )
    }

    // Check if name is being changed and if it already exists
    if (updateData.name && updateData.name !== existingCertification.name) {
      const nameExists = await db.certification.findFirst({
        where: { 
          name: { equals: updateData.name, mode: 'insensitive' },
          id: { not: id }
        }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Certification name already exists' },
          { status: 409 }
        )
      }
    }

    // Update certification
    const certification = await db.certification.update({
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
      message: 'Certification updated successfully',
      data: { certification }
    })

  } catch (error) {
    console.error('Error updating certification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/certifications - Delete certification (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Certification ID is required' },
        { status: 400 }
      )
    }

    // Check if certification exists
    const existingCertification = await db.certification.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            therapists: true
          }
        }
      }
    })

    if (!existingCertification) {
      return NextResponse.json(
        { error: 'Certification not found' },
        { status: 404 }
      )
    }

    // Check if certification is assigned to any therapists
    if (existingCertification._count.therapists > 0) {
      return NextResponse.json(
        { error: 'Cannot delete certification that is assigned to therapists' },
        { status: 409 }
      )
    }

    // Soft delete by setting isActive to false
    await db.certification.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Certification deactivated successfully'
    })

  } catch (error) {
    console.error('Error deleting certification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
