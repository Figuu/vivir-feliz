import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const patientQuerySchema = z.object({
  page: z.string().optional().default('1').transform(val => parseInt(val) || 1),
  limit: z.string().optional().default('20').transform(val => parseInt(val) || 20),
  search: z.string().optional(),
  isActive: z.string().optional().transform(val => val === 'true'),
  therapistId: z.string().uuid().optional(),
  sortBy: z.enum(['firstName', 'lastName', 'createdAt', 'lastSession']).optional().default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
})

const patientCreateSchema = z.object({
  parentId: z.string().uuid('Invalid parent ID'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  dateOfBirth: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date format'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  schoolName: z.string().max(200).optional(),
  schoolGrade: z.string().max(50).optional(),
  medicalHistory: z.any().optional(), // JSON field
  specialNeeds: z.string().max(1000).optional(),
  emergencyContact: z.string().max(100).optional(),
  emergencyPhone: z.string().min(10).optional()
})

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

// GET /api/patients - Get patients list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = patientQuerySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search'),
      isActive: searchParams.get('isActive'),
      therapistId: searchParams.get('therapistId'),
      sortBy: searchParams.get('sortBy') || 'lastName',
      sortOrder: searchParams.get('sortOrder') || 'asc'
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, search, isActive, therapistId, sortBy, sortOrder } = validation.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== undefined) {
      where.isActive = isActive
    }
    
    // Note: therapistId filter requires joining with patientSessions
    // For simplicity, we'll filter after the query if therapistId is provided

    // Build orderBy clause
    const orderBy: any = sortBy === 'lastSession' ? { createdAt: 'desc' } : { [sortBy]: sortOrder }

    // Get patients with pagination
    const [patients, totalCount] = await Promise.all([
      db.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy
      }),
      db.patient.count({ where })
    ])

    // Get sessions for all patients
    const patientIds = patients.map(p => p.id)
    const allSessions = await db.patientSession.findMany({
      where: {
        patientId: { in: patientIds }
      },
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
        }
      },
      orderBy: {
        scheduledDate: 'desc'
      }
    })

    // Group sessions by patient
    const sessionsByPatient = allSessions.reduce((acc, session) => {
      if (!acc[session.patientId]) {
        acc[session.patientId] = []
      }
      acc[session.patientId].push(session)
      return acc
    }, {} as Record<string, typeof allSessions>)

    // Filter by therapistId if provided
    let filteredPatients = patients
    if (therapistId) {
      filteredPatients = patients.filter(patient => {
        const patientSessions = sessionsByPatient[patient.id] || []
        return patientSessions.some(session => session.therapistId === therapistId)
      })
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        patients: filteredPatients.map(patient => {
          const patientSessions = sessionsByPatient[patient.id] || []
          const recentSessions = patientSessions.slice(0, 5)
          return {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            schoolName: patient.schoolName,
            schoolGrade: patient.schoolGrade,
            emergencyContact: patient.emergencyContact,
            emergencyPhone: patient.emergencyPhone,
            medicalHistory: patient.medicalHistory,
            specialNeeds: patient.specialNeeds,
            isActive: patient.isActive,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt,
            lastSession: patientSessions[0] ? {
              id: patientSessions[0].id,
              scheduledDate: patientSessions[0].scheduledDate,
              scheduledTime: patientSessions[0].scheduledTime,
              status: patientSessions[0].status,
              therapist: {
                id: patientSessions[0].therapist.id,
                firstName: patientSessions[0].therapist.profile.firstName,
                lastName: patientSessions[0].therapist.profile.lastName
              }
            } : null,
            totalSessions: patientSessions.length,
            recentSessions: recentSessions.map(session => ({
              id: session.id,
              scheduledDate: session.scheduledDate,
              scheduledTime: session.scheduledTime,
              status: session.status,
              therapist: {
                id: session.therapist.id,
                firstName: session.therapist.profile.firstName,
                lastName: session.therapist.profile.lastName
              }
            }))
          }
        }),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    })

  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/patients - Create new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = patientCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const patientData = validation.data

    // Verify parent exists
    const parent = await db.parent.findUnique({
      where: { id: patientData.parentId }
    })

    if (!parent) {
      return NextResponse.json(
        { error: 'Parent not found' },
        { status: 404 }
      )
    }

    // Create patient
    const patient = await db.patient.create({
      data: {
        parentId: patientData.parentId,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        dateOfBirth: new Date(patientData.dateOfBirth),
        gender: patientData.gender,
        schoolName: patientData.schoolName,
        schoolGrade: patientData.schoolGrade,
        medicalHistory: patientData.medicalHistory,
        specialNeeds: patientData.specialNeeds,
        emergencyContact: patientData.emergencyContact,
        emergencyPhone: patientData.emergencyPhone,
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Patient created successfully',
      data: { patient }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/patients - Update patient
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
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

// DELETE /api/patients - Delete patient
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
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
