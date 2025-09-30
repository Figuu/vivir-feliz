import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schema for specialty updates
const specialtyUpdateSchema = z.object({
  specialtyIds: z.array(z.string().uuid('Invalid specialty ID')).min(1, 'At least one specialty is required'),
})

// GET /api/therapist/[id]/specialties - Get therapist specialties
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
      select: { id: true }
    })

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Get therapist specialties
    const specialties = await db.therapistSpecialty.findMany({
      where: { therapistId },
      include: {
        specialty: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
            requirements: true,
            isActive: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        therapistId,
        specialties: specialties.map(s => s.specialty)
      }
    })

  } catch (error) {
    console.error('Error fetching therapist specialties:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/therapist/[id]/specialties - Update therapist specialties
export async function PUT(
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
    const validation = specialtyUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { specialtyIds } = validation.data

    // Check if therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: therapistId },
      select: { id: true }
    })

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Validate that all specialties exist
    const existingSpecialties = await db.specialty.findMany({
      where: { id: { in: specialtyIds } }
    })

    if (existingSpecialties.length !== specialtyIds.length) {
      return NextResponse.json(
        { error: 'One or more specialties do not exist' },
        { status: 400 }
      )
    }

    // Update specialties using transaction
    const result = await db.$transaction(async (tx) => {
      // Remove existing specialties
      await tx.therapistSpecialty.deleteMany({
        where: { therapistId }
      })

      // Add new specialties
      if (specialtyIds.length > 0) {
        await tx.therapistSpecialty.createMany({
          data: specialtyIds.map(specialtyId => ({
            therapistId,
            specialtyId,
          }))
        })
      }

      // Return updated specialties
      return await tx.therapistSpecialty.findMany({
        where: { therapistId },
        include: {
          specialty: {
            select: {
              id: true,
              name: true,
              category: true,
              description: true,
              requirements: true,
              isActive: true
            }
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Therapist specialties updated successfully',
      data: {
        therapistId,
        specialties: result.map(s => s.specialty)
      }
    })

  } catch (error) {
    console.error('Error updating therapist specialties:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
