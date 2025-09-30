import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const patientUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  dateOfBirth: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date format').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  schoolName: z.string().max(200).optional(),
  schoolGrade: z.string().max(50).optional(),
  medicalHistory: z.any().optional(),
  specialNeeds: z.string().max(1000).optional(),
  emergencyContact: z.string().max(100).optional(),
  emergencyPhone: z.string().min(10).optional(),
  isActive: z.boolean().optional()
})

const sessionQuerySchema = z.object({
  page: z.string().optional().default('1').transform(val => parseInt(val) || 1),
  limit: z.string().optional().default('10').transform(val => parseInt(val) || 10),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
  therapistId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

// GET /api/patients/[id] - Get patient details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id

    // Validate patient ID
    if (!patientId || typeof patientId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 400 }
      )
    }

    // Get patient details
    const patient = await db.patient.findUnique({
      where: { id: patientId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Get patient sessions separately
    const sessions = await db.patientSession.findMany({
      where: { patientId },
      include: {
        therapist: {
          include: {
            profile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        serviceAssignment: {
          include: {
            proposalService: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    costPerSession: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        scheduledDate: 'desc'
      }
    })

    // Calculate patient statistics
    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length
    const upcomingSessions = sessions.filter(s =>
      s.status === 'SCHEDULED' && new Date(s.scheduledDate) > new Date()
    ).length
    const totalRevenue = sessions
      .filter(s => s.status === 'COMPLETED')
      .reduce((total, session) => {
        const sessionRevenue = session.serviceAssignment?.proposalService?.service?.costPerSession?.toNumber() || 0
        return total + sessionRevenue
      }, 0)

    // Get recent sessions (last 10)
    const recentSessions = sessions.slice(0, 10)

    // Get upcoming sessions
    const upcomingSessionsList = sessions.filter(s =>
      s.status === 'SCHEDULED' && new Date(s.scheduledDate) > new Date()
    ).slice(0, 5)

    // Get session statistics by status
    const sessionStats = {
      scheduled: sessions.filter(s => s.status === 'SCHEDULED').length,
      completed: sessions.filter(s => s.status === 'COMPLETED').length,
      cancelled: sessions.filter(s => s.status === 'CANCELLED').length,
      rescheduled: sessions.filter(s => s.status === 'RESCHEDULED').length,
      'in-progress': sessions.filter(s => s.status === 'IN_PROGRESS').length
    }

    // Get therapists who have worked with this patient
    const uniqueTherapistIds = Array.from(
      new Set(sessions.map(s => s.therapist.id))
    )
    const therapists = uniqueTherapistIds.map(therapistId => {
      const session = sessions.find(s => s.therapist.id === therapistId)
      return session?.therapist.profile
    }).filter(Boolean)

    return NextResponse.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          parentId: patient.parentId,
          firstName: patient.firstName,
          lastName: patient.lastName,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          schoolName: patient.schoolName,
          schoolGrade: patient.schoolGrade,
          medicalHistory: patient.medicalHistory,
          specialNeeds: patient.specialNeeds,
          emergencyContact: patient.emergencyContact,
          emergencyPhone: patient.emergencyPhone,
          isActive: patient.isActive,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt
        },
        statistics: {
          totalSessions,
          completedSessions,
          upcomingSessions,
          totalRevenue,
          completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
          sessionStats
        },
        recentSessions: recentSessions.map(session => ({
          id: session.id,
          scheduledDate: session.scheduledDate,
          scheduledTime: session.scheduledTime,
          duration: session.duration,
          status: session.status,
          therapistNotes: session.therapistNotes,
          observations: session.observations,
          therapist: {
            id: session.therapist.id,
            firstName: session.therapist.profile.firstName,
            lastName: session.therapist.profile.lastName,
            email: session.therapist.profile.email
          },
          service: session.serviceAssignment?.proposalService?.service,
          revenue: session.serviceAssignment?.proposalService?.service?.costPerSession?.toNumber() || 0
        })),
        upcomingSessions: upcomingSessionsList.map(session => ({
          id: session.id,
          scheduledDate: session.scheduledDate,
          scheduledTime: session.scheduledTime,
          duration: session.duration,
          status: session.status,
          therapist: {
            id: session.therapist.id,
            firstName: session.therapist.profile.firstName,
            lastName: session.therapist.profile.lastName,
            email: session.therapist.profile.email
          },
          service: session.serviceAssignment?.proposalService?.service
        })),
        therapists
      }
    })

  } catch (error) {
    console.error('Error fetching patient details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/patients/[id] - Update patient
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id

    // Validate patient ID
    if (!patientId || typeof patientId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    // Validate request body
    const validation = patientUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const updateData = validation.data

    // Check if patient exists
    const existingPatient = await db.patient.findUnique({
      where: { id: patientId }
    })

    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Update patient
    const updatePayload: any = { ...updateData }
    if (updateData.dateOfBirth) {
      updatePayload.dateOfBirth = new Date(updateData.dateOfBirth)
    }

    const patient = await db.patient.update({
      where: { id: patientId },
      data: updatePayload
    })

    return NextResponse.json({
      success: true,
      message: 'Patient updated successfully',
      data: { patient }
    })

  } catch (error) {
    console.error('Error updating patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/patients/[id] - Delete patient
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id

    // Validate patient ID
    if (!patientId || typeof patientId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid patient ID' },
        { status: 400 }
      )
    }

    // Check if patient exists
    const existingPatient = await db.patient.findUnique({
      where: { id: patientId }
    })

    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Check if patient has active sessions
    const activeSessions = await db.patientSession.count({
      where: {
        patientId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
      }
    })

    if (activeSessions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete patient with active sessions. Please cancel or complete all sessions first.' },
        { status: 409 }
      )
    }

    // Soft delete patient (set isActive to false)
    const patient = await db.patient.update({
      where: { id: patientId },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Patient archived successfully',
      data: { patient }
    })

  } catch (error) {
    console.error('Error deleting patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
