import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const patientUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  address: z.string().max(200).optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  emergencyContact: z.object({
    name: z.string().max(100),
    phone: z.string().min(10),
    relationship: z.string().max(50)
  }).optional(),
  medicalInfo: z.object({
    allergies: z.string().max(500).optional(),
    medications: z.string().max(500).optional(),
    medicalConditions: z.string().max(500).optional(),
    insuranceProvider: z.string().max(100).optional(),
    insuranceNumber: z.string().max(50).optional()
  }).optional(),
  notes: z.string().max(1000).optional()
})

const sessionQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).default(1),
  limit: z.string().transform(val => parseInt(val) || 10).default(10),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show']).optional(),
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
      where: { id: patientId },
      include: {
        sessions: {
          include: {
            therapist: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            serviceAssignments: {
              include: {
                proposalService: {
                  include: {
                    service: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        price: true
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
        },
        _count: {
          select: {
            sessions: true
          }
        }
      }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Calculate patient statistics
    const totalSessions = patient.sessions.length
    const completedSessions = patient.sessions.filter(s => s.status === 'completed').length
    const upcomingSessions = patient.sessions.filter(s => 
      s.status === 'scheduled' && new Date(s.scheduledDate) > new Date()
    ).length
    const totalRevenue = patient.sessions
      .filter(s => s.status === 'completed')
      .reduce((total, session) => {
        const sessionRevenue = session.serviceAssignments.reduce((sessionTotal, assignment) => {
          return sessionTotal + (assignment.proposalService.service.price || 0)
        }, 0)
        return total + sessionRevenue
      }, 0)

    // Get recent sessions (last 10)
    const recentSessions = patient.sessions.slice(0, 10)

    // Get upcoming sessions
    const upcomingSessionsList = patient.sessions.filter(s => 
      s.status === 'scheduled' && new Date(s.scheduledDate) > new Date()
    ).slice(0, 5)

    // Get session statistics by status
    const sessionStats = {
      scheduled: patient.sessions.filter(s => s.status === 'scheduled').length,
      completed: patient.sessions.filter(s => s.status === 'completed').length,
      cancelled: patient.sessions.filter(s => s.status === 'cancelled').length,
      'no-show': patient.sessions.filter(s => s.status === 'no-show').length,
      'in-progress': patient.sessions.filter(s => s.status === 'in-progress').length
    }

    // Get therapists who have worked with this patient
    const therapists = Array.from(
      new Set(patient.sessions.map(s => s.therapist.id))
    ).map(therapistId => {
      const therapist = patient.sessions.find(s => s.therapist.id === therapistId)?.therapist
      return therapist
    }).filter(Boolean)

    return NextResponse.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          address: patient.address,
          status: patient.status,
          emergencyContact: patient.emergencyContact,
          medicalInfo: patient.medicalInfo,
          notes: patient.notes,
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
          sessionNotes: session.sessionNotes,
          therapistComments: session.therapistComments,
          therapist: session.therapist,
          services: session.serviceAssignments.map(sa => sa.proposalService.service),
          revenue: session.serviceAssignments.reduce((total, assignment) => {
            return total + (assignment.proposalService.service.price || 0)
          }, 0)
        })),
        upcomingSessions: upcomingSessionsList.map(session => ({
          id: session.id,
          scheduledDate: session.scheduledDate,
          scheduledTime: session.scheduledTime,
          duration: session.duration,
          status: session.status,
          therapist: session.therapist,
          services: session.serviceAssignments.map(sa => sa.proposalService.service)
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
        { error: 'Invalid request data', details: validation.error.errors },
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

    // Check for duplicate email if email is being updated
    if (updateData.email && updateData.email !== existingPatient.email) {
      const duplicatePatient = await db.patient.findUnique({
        where: { email: updateData.email }
      })

      if (duplicatePatient) {
        return NextResponse.json(
          { error: 'Patient with this email already exists' },
          { status: 409 }
        )
      }
    }

    // Update patient
    const patient = await db.patient.update({
      where: { id: patientId },
      data: {
        ...updateData,
        dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined
      }
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
        status: { in: ['scheduled', 'in-progress'] }
      }
    })

    if (activeSessions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete patient with active sessions. Please cancel or complete all sessions first.' },
        { status: 409 }
      )
    }

    // Soft delete patient (set status to archived)
    const patient = await db.patient.update({
      where: { id: patientId },
      data: { status: 'archived' }
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
