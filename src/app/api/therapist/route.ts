import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const therapistQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  status: z.string().optional(),
  specialty: z.string().uuid('Invalid specialty ID').optional(),
  sortBy: z.enum(['firstName', 'lastName', 'email', 'createdAt', 'lastLogin']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  includeInactive: z.string().transform(val => val === 'true').optional().default(false),
})

// GET /api/therapist - Get therapists with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = therapistQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      specialty: searchParams.get('specialty'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
      includeInactive: searchParams.get('includeInactive'),
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, search, status, specialty, sortBy, sortOrder, includeInactive } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (!includeInactive) {
      whereClause.status = { not: 'inactive' }
    }
    
    if (status) {
      whereClause.status = status
    }
    
    if (search) {
      whereClause.OR = [
        { profile: { firstName: { contains: search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search, mode: 'insensitive' } } },
        { profile: { email: { contains: search, mode: 'insensitive' } } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (specialty) {
      whereClause.specialties = {
        some: {
          specialtyId: specialty
        }
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get therapists with related data
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
                  expiryDate: true
                }
              }
            }
          },
          _count: {
            select: {
              patientSessions: true
            }
          }
        },
        orderBy: sortBy === 'firstName' || sortBy === 'lastName' || sortBy === 'email' || sortBy === 'lastLogin'
          ? { profile: { [sortBy === 'lastLogin' ? 'updatedAt' : sortBy]: sortOrder } }
          : { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.therapist.count({ where: whereClause })
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        therapists: therapists.map(therapist => ({
          id: therapist.id,
          firstName: therapist.profile?.firstName || '',
          lastName: therapist.profile?.lastName || '',
          email: therapist.profile?.email || '',
          phone: therapist.profile?.phone || '',
          avatar: therapist.profile?.avatar || '',
          licenseNumber: therapist.licenseNumber,
          bio: therapist.bio,
          isCoordinator: therapist.isCoordinator,
          isActive: therapist.isActive,
          canTakeConsultations: therapist.canTakeConsultations,
          specialties: therapist.specialties.map((s: any) => s.specialty),
          certifications: therapist.certifications.map((c: any) => c.certification),
          stats: {
            totalSessions: therapist._count?.patientSessions || 0,
          },
          createdAt: therapist.createdAt,
          updatedAt: therapist.updatedAt,
          lastLogin: therapist.profile?.updatedAt,
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          search,
          status,
          specialty,
          sortBy,
          sortOrder,
          includeInactive,
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

// POST /api/therapist - Create a new therapist
// Note: This endpoint is simplified. In production, therapist creation should be handled
// through proper user registration flow with Supabase Auth, which creates the Profile first.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Simplified schema for therapist-specific data only
    const therapistDataSchema = z.object({
      profileId: z.string().uuid('Invalid profile ID'),
      licenseNumber: z.string().min(5).max(50).optional(),
      bio: z.string().max(1000).optional(),
      isCoordinator: z.boolean().optional().default(false),
      specialties: z.array(z.string().uuid()).optional().default([]),
      certifications: z.array(z.string().uuid()).optional().default([]),
    })

    const validation = therapistDataSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if profile exists
    const profile = await db.profile.findUnique({
      where: { id: validatedData.profileId }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check if therapist already exists for this profile
    const existingTherapist = await db.therapist.findUnique({
      where: { profileId: validatedData.profileId }
    })

    if (existingTherapist) {
      return NextResponse.json(
        { error: 'Therapist profile already exists for this user' },
        { status: 409 }
      )
    }

    // Check for duplicate license number if provided
    if (validatedData.licenseNumber) {
      const existingLicense = await db.therapist.findFirst({
        where: { licenseNumber: validatedData.licenseNumber }
      })

      if (existingLicense) {
        return NextResponse.json(
          { error: 'Therapist with this license number already exists' },
          { status: 409 }
        )
      }
    }

    // Create therapist
    const therapist = await db.therapist.create({
      data: {
        profileId: validatedData.profileId,
        licenseNumber: validatedData.licenseNumber,
        bio: validatedData.bio,
        isCoordinator: validatedData.isCoordinator,
      },
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Therapist created successfully',
      data: {
        id: therapist.id,
        profileId: therapist.profileId,
        firstName: therapist.profile.firstName,
        lastName: therapist.profile.lastName,
        email: therapist.profile.email,
        phone: therapist.profile.phone,
        licenseNumber: therapist.licenseNumber,
        bio: therapist.bio,
        isCoordinator: therapist.isCoordinator,
        isActive: therapist.isActive,
        createdAt: therapist.createdAt,
        updatedAt: therapist.updatedAt,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating therapist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}