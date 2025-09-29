import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { hash, compare } from 'bcryptjs'

// Validation schemas
const therapistUpdateSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces')
    .transform(val => val.trim().replace(/\s+/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' '))
    .optional(),
  
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces')
    .transform(val => val.trim().replace(/\s+/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' '))
    .optional(),
  
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email cannot exceed 100 characters')
    .toLowerCase()
    .transform(val => val.trim())
    .optional(),
  
  phone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number cannot exceed 20 characters')
    .transform(val => val.replace(/\D/g, ''))
    .optional(),
  
  licenseNumber: z.string()
    .min(5, 'License number must be at least 5 characters')
    .max(50, 'License number cannot exceed 50 characters')
    .regex(/^[A-Z0-9\-]+$/, 'License number can only contain uppercase letters, numbers, and hyphens')
    .transform(val => val.toUpperCase().trim())
    .optional(),
  
  licenseExpiry: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'License expiry must be in YYYY-MM-DD format')
    .transform(val => new Date(val))
    .refine(date => date > new Date(), 'License expiry must be in the future')
    .optional(),
  
  bio: z.string()
    .max(1000, 'Bio cannot exceed 1000 characters')
    .optional()
    .transform(val => val?.trim()),
  
  languages: z.array(z.string().max(50, 'Language name cannot exceed 50 characters')).optional(),
  
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  isVerified: z.boolean().optional(),
})

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: z.string().min(1, 'Password confirmation is required'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const specialtyUpdateSchema = z.object({
  specialtyIds: z.array(z.string().uuid('Invalid specialty ID')),
})

const certificationUpdateSchema = z.object({
  certificationIds: z.array(z.string().uuid('Invalid certification ID')),
})

// GET /api/therapist/[id] - Get specific therapist
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const therapistId = params.id

    // Validate therapist ID
    if (!therapistId || typeof therapistId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid therapist ID' },
        { status: 400 }
      )
    }

    // Check if therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: therapistId },
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
        schedules: {
          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            isWorkingDay: true,
            effectiveDate: true,
            endDate: true
          }
        },
        _count: {
          select: {
            sessions: true,
            patients: true
          }
        }
      }
    })

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Return therapist data (without password)
    return NextResponse.json({
      success: true,
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
        specialties: therapist.specialties.map(s => s.specialty),
        certifications: therapist.certifications.map(c => c.certification),
        schedules: therapist.schedules,
        stats: {
          totalSessions: therapist._count.sessions,
          totalPatients: therapist._count.patients,
        },
        createdAt: therapist.createdAt,
        updatedAt: therapist.updatedAt,
        lastLogin: therapist.lastLogin,
      }
    })

  } catch (error) {
    console.error('Error fetching therapist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/therapist/[id] - Update specific therapist
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const therapistId = params.id

    // Validate therapist ID
    if (!therapistId || typeof therapistId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid therapist ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validation = therapistUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if therapist exists
    const existingTherapist = await db.therapist.findUnique({
      where: { id: therapistId }
    })

    if (!existingTherapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Check for duplicate email if email is being updated
    if (validatedData.email && validatedData.email !== existingTherapist.email) {
      const duplicateEmail = await db.therapist.findFirst({
        where: {
          email: validatedData.email,
          id: { not: therapistId }
        }
      })

      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'Email already exists for another therapist' },
          { status: 409 }
        )
      }
    }

    // Check for duplicate license number if license is being updated
    if (validatedData.licenseNumber && validatedData.licenseNumber !== existingTherapist.licenseNumber) {
      const duplicateLicense = await db.therapist.findFirst({
        where: {
          licenseNumber: validatedData.licenseNumber,
          id: { not: therapistId }
        }
      })

      if (duplicateLicense) {
        return NextResponse.json(
          { error: 'License number already exists for another therapist' },
          { status: 409 }
        )
      }
    }

    // Update therapist
    const updatedTherapist = await db.therapist.update({
      where: { id: therapistId },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
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
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Therapist updated successfully',
      data: {
        id: updatedTherapist.id,
        firstName: updatedTherapist.firstName,
        lastName: updatedTherapist.lastName,
        email: updatedTherapist.email,
        phone: updatedTherapist.phone,
        licenseNumber: updatedTherapist.licenseNumber,
        licenseExpiry: updatedTherapist.licenseExpiry,
        bio: updatedTherapist.bio,
        languages: updatedTherapist.languages,
        status: updatedTherapist.status,
        isVerified: updatedTherapist.isVerified,
        specialties: updatedTherapist.specialties.map(s => s.specialty),
        certifications: updatedTherapist.certifications.map(c => c.certification),
        updatedAt: updatedTherapist.updatedAt,
      }
    })

  } catch (error) {
    console.error('Error updating therapist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/therapist/[id] - Delete specific therapist
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const therapistId = params.id

    // Validate therapist ID
    if (!therapistId || typeof therapistId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid therapist ID' },
        { status: 400 }
      )
    }

    // Check if therapist exists
    const existingTherapist = await db.therapist.findUnique({
      where: { id: therapistId }
    })

    if (!existingTherapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Check for active sessions
    const activeSessions = await db.patientSession.findMany({
      where: {
        therapistId: therapistId,
        status: { in: ['scheduled', 'in-progress'] }
      }
    })

    if (activeSessions.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete therapist with active sessions',
          activeSessions: activeSessions.map(s => ({
            id: s.id,
            scheduledDate: s.scheduledDate,
            status: s.status
          }))
        },
        { status: 409 }
      )
    }

    // Perform soft delete (update status to inactive)
    const deletedTherapist = await db.therapist.update({
      where: { id: therapistId },
      data: {
        status: 'inactive',
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Therapist deactivated successfully',
      data: {
        id: deletedTherapist.id,
        status: deletedTherapist.status,
        updatedAt: deletedTherapist.updatedAt,
      }
    })

  } catch (error) {
    console.error('Error deleting therapist:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
