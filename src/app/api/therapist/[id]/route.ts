import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const therapistUpdateSchema = z.object({
  licenseNumber: z.string()
    .min(5, 'License number must be at least 5 characters')
    .max(50, 'License number cannot exceed 50 characters')
    .optional(),

  bio: z.string()
    .max(1000, 'Bio cannot exceed 1000 characters')
    .optional(),

  isCoordinator: z.boolean().optional(),
  canTakeConsultations: z.boolean().optional(),
  isActive: z.boolean().optional(),
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
            patientSessions: true
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

    // Return therapist data
    return NextResponse.json({
      success: true,
      data: {
        id: therapist.id,
        profileId: therapist.profileId,
        firstName: therapist.profile.firstName,
        lastName: therapist.profile.lastName,
        email: therapist.profile.email,
        phone: therapist.profile.phone,
        avatar: therapist.profile.avatar,
        licenseNumber: therapist.licenseNumber,
        bio: therapist.bio,
        isCoordinator: therapist.isCoordinator,
        isActive: therapist.isActive,
        canTakeConsultations: therapist.canTakeConsultations,
        specialties: therapist.specialties.map(s => s.specialty),
        certifications: therapist.certifications.map(c => c.certification),
        schedules: therapist.schedules,
        stats: {
          totalSessions: therapist._count.patientSessions,
        },
        createdAt: therapist.createdAt,
        updatedAt: therapist.updatedAt,
        lastLogin: therapist.profile.updatedAt,
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
        { error: 'Invalid request data', details: validation.error.issues },
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
        profileId: updatedTherapist.profileId,
        firstName: updatedTherapist.profile.firstName,
        lastName: updatedTherapist.profile.lastName,
        email: updatedTherapist.profile.email,
        phone: updatedTherapist.profile.phone,
        avatar: updatedTherapist.profile.avatar,
        licenseNumber: updatedTherapist.licenseNumber,
        bio: updatedTherapist.bio,
        isCoordinator: updatedTherapist.isCoordinator,
        isActive: updatedTherapist.isActive,
        canTakeConsultations: updatedTherapist.canTakeConsultations,
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
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
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

    // Perform soft delete (update isActive to false)
    const deletedTherapist = await db.therapist.update({
      where: { id: therapistId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Therapist deactivated successfully',
      data: {
        id: deletedTherapist.id,
        isActive: deletedTherapist.isActive,
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
