import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schema for certification updates
const certificationUpdateSchema = z.object({
  certificationIds: z.array(z.string().uuid('Invalid certification ID')).min(1, 'At least one certification is required'),
})

// GET /api/therapist/[id]/certifications - Get therapist certifications
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

    // Get therapist certifications
    const certifications = await db.therapistCertification.findMany({
      where: { therapistId },
      include: {
        certification: {
          select: {
            id: true,
            name: true,
            organization: true,
            description: true,
            expiryDate: true,
            isActive: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        therapistId,
        certifications: certifications.map(c => c.certification)
      }
    })

  } catch (error) {
    console.error('Error fetching therapist certifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/therapist/[id]/certifications - Update therapist certifications
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
    const validation = certificationUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { certificationIds } = validation.data

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

    // Validate that all certifications exist
    const existingCertifications = await db.certification.findMany({
      where: { id: { in: certificationIds } }
    })

    if (existingCertifications.length !== certificationIds.length) {
      return NextResponse.json(
        { error: 'One or more certifications do not exist' },
        { status: 400 }
      )
    }

    // Update certifications using transaction
    const result = await db.$transaction(async (tx) => {
      // Remove existing certifications
      await tx.therapistCertification.deleteMany({
        where: { therapistId }
      })

      // Add new certifications
      if (certificationIds.length > 0) {
        await tx.therapistCertification.createMany({
          data: certificationIds.map(certificationId => ({
            therapistId,
            certificationId,
          }))
        })
      }

      // Return updated certifications
      return await tx.therapistCertification.findMany({
        where: { therapistId },
        include: {
          certification: {
            select: {
              id: true,
              name: true,
              organization: true,
              description: true,
              expiryDate: true,
              isActive: true
            }
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Therapist certifications updated successfully',
      data: {
        therapistId,
        certifications: result.map(c => c.certification)
      }
    })

  } catch (error) {
    console.error('Error updating therapist certifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
