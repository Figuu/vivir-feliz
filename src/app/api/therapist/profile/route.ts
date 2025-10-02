import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const therapistQuerySchema = z.object({
  page: z.string().transform(Number).default(1),
  limit: z.string().transform(Number).default(10),
  search: z.string().optional(),
  specialty: z.string().uuid().optional(),
  isActive: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt', 'licenseExpiry']).default('firstName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

// GET /api/therapist/profile - Get therapists with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = therapistQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      specialty: searchParams.get('specialty'),
      isActive: searchParams.get('isActive'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, search, specialty, isActive, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
        { profile: { email: { contains: search, mode: 'insensitive' } } },
        { licenseNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (specialty) {
      whereClause.specialties = {
        some: {
          specialtyId: specialty
        }
      }
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive
    }

    // Get therapists with pagination
    const [therapists, totalCount] = await Promise.all([
      db.therapist.findMany({
        where: whereClause,
        include: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatar: true,
              isActive: true,
              createdAt: true,
              updatedAt: true
            }
          },
          specialties: {
            include: {
              specialty: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          },
          certifications: {
            include: {
              certification: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  expiryRequired: true
                }
              }
            }
          }
        },
        orderBy: sortBy === 'firstName' || sortBy === 'lastName' || sortBy === 'email'
          ? { profile: { [sortBy]: sortOrder } }
          : sortBy === 'licenseExpiry'
          ? { createdAt: sortOrder } // licenseExpiry doesn't exist in new schema
          : { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.therapist.count({ where: whereClause })
    ])

    // Format response
    const formattedTherapists = therapists.map(therapist => ({
      id: therapist.id,
      profileId: therapist.profileId,
      firstName: therapist.profile.firstName,
      lastName: therapist.profile.lastName,
      email: therapist.profile.email,
      phone: therapist.profile.phone,
      avatar: therapist.profile.avatar,
      licenseNumber: therapist.licenseNumber,
      specialties: therapist.specialties.map((s: any) => s.specialty),
      certifications: therapist.certifications.map((c: any) => ({
        ...c.certification,
        obtainedAt: c.obtainedAt,
        expiryDate: c.expiryDate
      })),
      bio: therapist.bio,
      isCoordinator: therapist.isCoordinator,
      isActive: therapist.isActive,
      canTakeConsultations: therapist.canTakeConsultations,
      createdAt: therapist.createdAt,
      updatedAt: therapist.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: {
        therapists: formattedTherapists,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching therapists:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/therapist/profile - Create new therapist
// Note: This creates therapist-specific data. Profile must exist first.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const therapistDataSchema = z.object({
      profileId: z.string().uuid('Invalid profile ID'),
      licenseNumber: z.string().min(5).max(50).optional(),
      bio: z.string().max(1000).optional(),
      isCoordinator: z.boolean().optional().default(false),
      specialties: z.array(z.string().uuid()).min(1, 'At least one specialty is required'),
      certifications: z.array(z.string().uuid()).optional(),
    })

    const validation = therapistDataSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const therapistData = validation.data

    // Check if profile exists
    const profile = await db.profile.findUnique({
      where: { id: therapistData.profileId }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check if therapist already exists for this profile
    const existingTherapist = await db.therapist.findUnique({
      where: { profileId: therapistData.profileId }
    })

    if (existingTherapist) {
      return NextResponse.json(
        { error: 'Therapist profile already exists for this user' },
        { status: 409 }
      )
    }

    // Check if license number already exists
    if (therapistData.licenseNumber) {
      const existingLicense = await db.therapist.findFirst({
        where: { licenseNumber: therapistData.licenseNumber }
      })

      if (existingLicense) {
        return NextResponse.json(
          { error: 'License number already exists' },
          { status: 409 }
        )
      }
    }

    // Create therapist
    const therapist = await db.therapist.create({
      data: {
        profileId: therapistData.profileId,
        licenseNumber: therapistData.licenseNumber,
        bio: therapistData.bio,
        isCoordinator: therapistData.isCoordinator,
        specialties: {
          create: therapistData.specialties.map(specialtyId => ({
            specialtyId
          }))
        },
        certifications: therapistData.certifications ? {
          create: therapistData.certifications.map(certificationId => ({
            certificationId,
            issueDate: new Date(),
            certification: {
              connect: { id: certificationId }
            }
          }))
        } : undefined
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        specialties: {
          include: {
            specialty: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        },
        certifications: {
          include: {
            certification: {
              select: {
                id: true,
                name: true,
                description: true,
                expiryRequired: true
              }
            }
          }
        }
      }
    })

    // Format response
    const formattedTherapist = {
      id: therapist.id,
      profileId: therapist.profileId,
      firstName: therapist.profile.firstName,
      lastName: therapist.profile.lastName,
      email: therapist.profile.email,
      phone: therapist.profile.phone,
      avatar: therapist.profile.avatar,
      licenseNumber: therapist.licenseNumber,
      specialties: therapist.specialties.map((s: any) => s.specialty),
      certifications: therapist.certifications.map((c: any) => ({
        ...c.certification,
        obtainedAt: c.obtainedAt,
        expiryDate: c.expiryDate
      })),
      bio: therapist.bio,
      isCoordinator: therapist.isCoordinator,
      isActive: therapist.isActive,
      canTakeConsultations: therapist.canTakeConsultations,
      createdAt: therapist.createdAt,
      updatedAt: therapist.updatedAt
    }

    return NextResponse.json({
      success: true,
      message: 'Therapist created successfully',
      data: { therapist: formattedTherapist }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating therapist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/therapist/profile - Update therapist profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const therapistUpdateSchema = z.object({
      id: z.string().uuid(),
      licenseNumber: z.string().min(5).max(50).optional(),
      bio: z.string().max(1000).optional(),
      isCoordinator: z.boolean().optional(),
      canTakeConsultations: z.boolean().optional(),
      specialties: z.array(z.string().uuid()).optional(),
      certifications: z.array(z.string().uuid()).optional(),
    })

    const validation = therapistUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { id, specialties, certifications, ...updateData } = validation.data

    // Check if therapist exists
    const existingTherapist = await db.therapist.findUnique({
      where: { id }
    })

    if (!existingTherapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Check if license number is being changed and if it already exists
    if (updateData.licenseNumber && updateData.licenseNumber !== existingTherapist.licenseNumber) {
      const licenseExists = await db.therapist.findFirst({
        where: {
          licenseNumber: updateData.licenseNumber,
          id: { not: id }
        }
      })

      if (licenseExists) {
        return NextResponse.json(
          { error: 'License number already exists' },
          { status: 409 }
        )
      }
    }

    // Update therapist
    const therapist = await db.therapist.update({
      where: { id },
      data: {
        ...updateData,
        specialties: specialties ? {
          deleteMany: {},
          create: specialties.map(specialtyId => ({
            specialtyId
          }))
        } : undefined,
        certifications: certifications ? {
          deleteMany: {},
          create: certifications.map(certificationId => ({
            certificationId,
            issueDate: new Date(),
            certification: {
              connect: { id: certificationId }
            }
          }))
        } : undefined
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        specialties: {
          include: {
            specialty: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        },
        certifications: {
          include: {
            certification: {
              select: {
                id: true,
                name: true,
                description: true,
                expiryRequired: true
              }
            }
          }
        }
      }
    })

    // Format response
    const formattedTherapist = {
      id: therapist.id,
      profileId: therapist.profileId,
      firstName: therapist.profile.firstName,
      lastName: therapist.profile.lastName,
      email: therapist.profile.email,
      phone: therapist.profile.phone,
      avatar: therapist.profile.avatar,
      licenseNumber: therapist.licenseNumber,
      specialties: therapist.specialties.map((s: any) => s.specialty),
      certifications: therapist.certifications.map((c: any) => ({
        ...c.certification,
        obtainedAt: c.obtainedAt,
        expiryDate: c.expiryDate
      })),
      bio: therapist.bio,
      isCoordinator: therapist.isCoordinator,
      isActive: therapist.isActive,
      canTakeConsultations: therapist.canTakeConsultations,
      createdAt: therapist.createdAt,
      updatedAt: therapist.updatedAt
    }

    return NextResponse.json({
      success: true,
      message: 'Therapist updated successfully',
      data: { therapist: formattedTherapist }
    })

  } catch (error) {
    console.error('Error updating therapist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/therapist/profile - Delete therapist (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Therapist ID is required' },
        { status: 400 }
      )
    }

    // Check if therapist exists
    const existingTherapist = await db.therapist.findUnique({
      where: { id }
    })

    if (!existingTherapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting isActive to false
    await db.therapist.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Therapist deactivated successfully'
    })

  } catch (error) {
    console.error('Error deleting therapist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
