import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Validation schemas
const patientQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).default(1),
  limit: z.string().transform(val => parseInt(val) || 20).default(20),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  therapistId: z.string().uuid().optional(),
  sortBy: z.enum(['firstName', 'lastName', 'createdAt', 'lastSession']).default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
})

const patientCreateSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  address: z.string().max(200).optional(),
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

// GET /api/patients - Get patients list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Validate query parameters
    const validation = patientQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      therapistId: searchParams.get('therapistId'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { page, limit, search, status, therapistId, sortBy, sortOrder } = validation.data
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    if (therapistId) {
      where.sessions = {
        some: {
          therapistId: therapistId
        }
      }
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sortBy === 'lastSession') {
      orderBy.sessions = {
        _count: 'desc'
      }
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Get patients with pagination
    const [patients, totalCount] = await Promise.all([
      db.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          sessions: {
            select: {
              id: true,
              scheduledDate: true,
              scheduledTime: true,
              status: true,
              therapist: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: {
              scheduledDate: 'desc'
            },
            take: 5 // Get last 5 sessions
          },
          _count: {
            select: {
              sessions: true
            }
          }
        }
      }),
      db.patient.count({ where })
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        patients: patients.map(patient => ({
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
          updatedAt: patient.updatedAt,
          lastSession: patient.sessions[0] || null,
          totalSessions: patient._count.sessions,
          recentSessions: patient.sessions
        })),
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
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const patientData = validation.data

    // Check for duplicate email
    const existingPatient = await db.patient.findUnique({
      where: { email: patientData.email }
    })

    if (existingPatient) {
      return NextResponse.json(
        { error: 'Patient with this email already exists' },
        { status: 409 }
      )
    }

    // Create patient
    const patient = await db.patient.create({
      data: {
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        email: patientData.email,
        phone: patientData.phone,
        dateOfBirth: patientData.dateOfBirth ? new Date(patientData.dateOfBirth) : null,
        gender: patientData.gender,
        address: patientData.address,
        status: 'active',
        emergencyContact: patientData.emergencyContact,
        medicalInfo: patientData.medicalInfo,
        notes: patientData.notes
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
