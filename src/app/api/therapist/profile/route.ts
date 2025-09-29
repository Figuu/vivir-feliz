import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Validation schemas
const therapistRegistrationSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters'),
  licenseNumber: z.string()
    .min(5, 'License number must be at least 5 characters')
    .max(50, 'License number must be less than 50 characters')
    .regex(/^[A-Z0-9\-]+$/, 'License number can only contain uppercase letters, numbers, and hyphens'),
  licenseExpiry: z.string()
    .datetime('Invalid license expiry date'),
  specialties: z.array(z.string().uuid()).min(1, 'At least one specialty is required'),
  certifications: z.array(z.string().uuid()).optional(),
  bio: z.string()
    .max(1000, 'Bio must be less than 1000 characters')
    .optional(),
  experience: z.number()
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience cannot exceed 50 years')
    .optional(),
  education: z.string()
    .max(500, 'Education must be less than 500 characters')
    .optional(),
  languages: z.array(z.string()).optional(),
  timezone: z.string().default('UTC'),
  isActive: z.boolean().default(true)
})

const therapistUpdateSchema = therapistRegistrationSchema.partial().extend({
  id: z.string().uuid(),
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
    .optional()
})

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
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { page, limit, search, specialty, isActive, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
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
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.therapist.count({ where: whereClause })
    ])

    // Format response
    const formattedTherapists = therapists.map(therapist => ({
      id: therapist.id,
      firstName: therapist.firstName,
      lastName: therapist.lastName,
      email: therapist.email,
      phone: therapist.phone,
      licenseNumber: therapist.licenseNumber,
      licenseExpiry: therapist.licenseExpiry,
      specialties: therapist.specialties.map(s => s.specialty),
      certifications: therapist.certifications.map(c => ({
        ...c.certification,
        obtainedAt: c.obtainedAt,
        expiryDate: c.expiryDate
      })),
      bio: therapist.bio,
      experience: therapist.experience,
      education: therapist.education,
      languages: therapist.languages,
      timezone: therapist.timezone,
      isActive: therapist.isActive,
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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = therapistRegistrationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const therapistData = validation.data

    // Check if email already exists
    const existingTherapist = await db.therapist.findUnique({
      where: { email: therapistData.email }
    })

    if (existingTherapist) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    // Check if license number already exists
    const existingLicense = await db.therapist.findFirst({
      where: { licenseNumber: therapistData.licenseNumber }
    })

    if (existingLicense) {
      return NextResponse.json(
        { error: 'License number already exists' },
        { status: 409 }
      )
    }

    // Capitalize names
    const capitalizedData = {
      ...therapistData,
      firstName: capitalizeName(therapistData.firstName),
      lastName: capitalizeName(therapistData.lastName)
    }

    // Create therapist
    const therapist = await db.therapist.create({
      data: {
        ...capitalizedData,
        specialties: {
          create: therapistData.specialties.map(specialtyId => ({
            specialtyId
          }))
        },
        certifications: therapistData.certifications ? {
          create: therapistData.certifications.map(certificationId => ({
            certificationId
          }))
        } : undefined
      },
      include: {
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
      firstName: therapist.firstName,
      lastName: therapist.lastName,
      email: therapist.email,
      phone: therapist.phone,
      licenseNumber: therapist.licenseNumber,
      licenseExpiry: therapist.licenseExpiry,
      specialties: therapist.specialties.map(s => s.specialty),
      certifications: therapist.certifications.map(c => ({
        ...c.certification,
        obtainedAt: c.obtainedAt,
        expiryDate: c.expiryDate
      })),
      bio: therapist.bio,
      experience: therapist.experience,
      education: therapist.education,
      languages: therapist.languages,
      timezone: therapist.timezone,
      isActive: therapist.isActive,
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
    
    // Validate request body
    const validation = therapistUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { id, currentPassword, newPassword, ...updateData } = validation.data

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

    // Check if email is being changed and if it already exists
    if (updateData.email && updateData.email !== existingTherapist.email) {
      const emailExists = await db.therapist.findFirst({
        where: { 
          email: updateData.email,
          id: { not: id }
        }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        )
      }
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

    // Validate current password if changing password
    if (newPassword && currentPassword) {
      const passwordMatch = await bcrypt.compare(currentPassword, existingTherapist.password)
      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        )
      }
    }

    // Capitalize names if provided
    const capitalizedData = {
      ...updateData,
      firstName: updateData.firstName ? capitalizeName(updateData.firstName) : undefined,
      lastName: updateData.lastName ? capitalizeName(updateData.lastName) : undefined
    }

    // Hash new password if provided
    const hashedPassword = newPassword ? await bcrypt.hash(newPassword, 12) : undefined

    // Update therapist
    const therapist = await db.therapist.update({
      where: { id },
      data: {
        ...capitalizedData,
        password: hashedPassword,
        specialties: updateData.specialties ? {
          deleteMany: {},
          create: updateData.specialties.map(specialtyId => ({
            specialtyId
          }))
        } : undefined,
        certifications: updateData.certifications ? {
          deleteMany: {},
          create: updateData.certifications.map(certificationId => ({
            certificationId
          }))
        } : undefined
      },
      include: {
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
      firstName: therapist.firstName,
      lastName: therapist.lastName,
      email: therapist.email,
      phone: therapist.phone,
      licenseNumber: therapist.licenseNumber,
      licenseExpiry: therapist.licenseExpiry,
      specialties: therapist.specialties.map(s => s.specialty),
      certifications: therapist.certifications.map(c => ({
        ...c.certification,
        obtainedAt: c.obtainedAt,
        expiryDate: c.expiryDate
      })),
      bio: therapist.bio,
      experience: therapist.experience,
      education: therapist.education,
      languages: therapist.languages,
      timezone: therapist.timezone,
      isActive: therapist.isActive,
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

// Helper function to capitalize names
function capitalizeName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Helper function to validate phone number
function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Check if it's a valid length (10-15 digits)
  return digits.length >= 10 && digits.length <= 15
}

// Helper function to validate license number
function validateLicenseNumber(licenseNumber: string): boolean {
  // Check if it contains only uppercase letters, numbers, and hyphens
  return /^[A-Z0-9\-]+$/.test(licenseNumber)
}
