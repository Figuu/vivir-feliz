import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// File validation constants
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Comprehensive validation schemas
const documentUploadSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  documentType: z.enum(['medical_record', 'insurance_card', 'id_document', 'consent_form', 'assessment', 'report', 'prescription', 'lab_result', 'other']),
  
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name cannot exceed 255 characters')
    .regex(/^[a-zA-Z0-9_\-. ]+$/, 'File name can only contain letters, numbers, spaces, hyphens, underscores, and periods')
    .transform(val => val.trim()),
  
  fileUrl: z.string().url('Invalid file URL'),
  
  fileType: z.string()
    .refine(type => ALLOWED_FILE_TYPES.includes(type), 'File type not allowed'),
  
  fileSize: z.number()
    .min(1, 'File size must be positive')
    .max(MAX_FILE_SIZE, `File size cannot exceed ${MAX_FILE_SIZE / 1024 / 1024}MB`),
  
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters')).optional().default([]),
  
  isConfidential: z.boolean().default(false),
  
  uploadedBy: z.string().uuid('Invalid uploader ID')
})

const documentQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  documentType: z.enum(['medical_record', 'insurance_card', 'id_document', 'consent_form', 'assessment', 'report', 'prescription', 'lab_result', 'other']).optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  isConfidential: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'fileName']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// GET /api/patient-documents - Get patient documents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const validation = documentQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      patientId: searchParams.get('patientId'),
      documentType: searchParams.get('documentType'),
      search: searchParams.get('search'),
      isConfidential: searchParams.get('isConfidential'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, patientId, documentType, search, isConfidential, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (patientId) {
      whereClause.patientId = patientId
    }
    
    if (documentType) {
      whereClause.documentType = documentType
    }
    
    if (isConfidential !== undefined) {
      whereClause.isConfidential = isConfidential
    }
    
    if (search) {
      whereClause.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get documents
    const [documents, totalCount] = await Promise.all([
      db.patientDocument.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.patientDocument.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        documents,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    })

  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/patient-documents - Upload patient document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validation = documentUploadSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if patient exists
    const patient = await db.patient.findUnique({
      where: { id: validatedData.patientId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Create document record
    const document = await db.patientDocument.create({
      data: {
        patientId: validatedData.patientId,
        name: validatedData.fileName,
        type: validatedData.documentType,
        url: validatedData.fileUrl,
        description: validatedData.description,
        uploadedBy: validatedData.uploadedBy
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    }, { status: 201 })

  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/patient-documents - Delete document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    await db.patientDocument.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
