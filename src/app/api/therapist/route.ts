import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

// Comprehensive validation schemas
const therapistCreateSchema = z.object({
  // Basic Information
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces')
    .transform(val => val.trim().replace(/\s+/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')),
  
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces')
    .transform(val => val.trim().replace(/\s+/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')),
  
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email cannot exceed 100 characters')
    .toLowerCase()
    .transform(val => val.trim()),
  
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number cannot exceed 20 characters')
    .transform(val => val.replace(/\D/g, '')),
  
  // Professional Information
  licenseNumber: z.string()
    .min(5, 'License number must be at least 5 characters')
    .max(50, 'License number cannot exceed 50 characters')
    .regex(/^[A-Z0-9\-]+$/, 'License number can only contain uppercase letters, numbers, and hyphens')
    .transform(val => val.toUpperCase().trim()),
  
  licenseExpiry: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'License expiry must be in YYYY-MM-DD format')
    .transform(val => new Date(val))
    .refine(date => date > new Date(), 'License expiry must be in the future'),
  
  specialties: z.array(z.string().uuid('Invalid specialty ID')).optional().default([]),
  certifications: z.array(z.string().uuid('Invalid certification ID')).optional().default([]),
  
  // Account Information
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  // Optional Information
  bio: z.string()
    .max(1000, 'Bio cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  languages: z.array(z.string().max(50, 'Language name cannot exceed 50 characters')).optional().default([]),
  
  // Status
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional().default('pending'),
  isVerified: z.boolean().optional().default(false),
})

const therapistUpdateSchema = therapistCreateSchema.partial().omit({ password: true })

const therapistQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
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
        { error: 'Invalid query parameters', details: validation.error.errors },
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
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
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
          specialties: {
            include: {
              specialty: {
                select: {
                  id: true,
                  name: true,
                  category: true,
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
                  organization: true,
                  expiryDate: true
                }
              }
            }
          },
          _count: {
            select: {
              sessions: true,
              patients: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
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
          firstName: therapist.firstName,
          lastName: therapist.lastName,
          email: therapist.email,
          phone: therapist.phone,
          licenseNumber: therapist.licenseNumber,
          licenseExpiry: therapist.licenseExpiry,
          bio: therapist.bio,
          languages: therapist.languages,
          status: therapist.status,
          isVerified: therapist.isVerified,
          specialties: therapist.specialties.map(s => s.specialty),
          certifications: therapist.certifications.map(c => c.certification),
          stats: {
            totalSessions: therapist._count.sessions,
            totalPatients: therapist._count.patients,
          },
          createdAt: therapist.createdAt,
          updatedAt: therapist.updatedAt,
          lastLogin: therapist.lastLogin,
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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = therapistCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check for duplicate email
    const existingTherapist = await db.therapist.findUnique({
      where: { email: validatedData.email }
    })

    if (existingTherapist) {
      return NextResponse.json(
        { error: 'Therapist with this email already exists' },
        { status: 409 }
      )
    }

    // Check for duplicate license number
    const existingLicense = await db.therapist.findFirst({
      where: { licenseNumber: validatedData.licenseNumber }
    })

    if (existingLicense) {
      return NextResponse.json(
        { error: 'Therapist with this license number already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12)

    // Create therapist
    const therapist = await db.therapist.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        licenseNumber: validatedData.licenseNumber,
        licenseExpiry: validatedData.licenseExpiry,
        bio: validatedData.bio,
        languages: validatedData.languages,
        status: validatedData.status,
        isVerified: validatedData.isVerified,
        password: hashedPassword,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Therapist created successfully',
      data: {
        id: therapist.id,
        firstName: therapist.firstName,
        lastName: therapist.lastName,
        email: therapist.email,
        phone: therapist.phone,
        licenseNumber: therapist.licenseNumber,
        licenseExpiry: therapist.licenseExpiry,
        bio: therapist.bio,
        languages: therapist.languages,
        status: therapist.status,
        isVerified: therapist.isVerified,
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