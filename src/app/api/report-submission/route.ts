import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

// Comprehensive validation schemas
const reportSubmissionCreateSchema = z.object({
  // Report Information
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'session_notes', 'assessment', 'evaluation']),
  
  reportId: z.string().uuid('Invalid report ID'),
  
  therapistId: z.string().uuid('Invalid therapist ID'),
  
  patientId: z.string().uuid('Invalid patient ID'),
  
  // Submission Details
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .transform(val => val.trim()),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters')
    .transform(val => val.trim()),
  
  submissionType: z.enum(['draft', 'final']).default('draft'),
  
  // Report Content
  content: z.object({
    summary: z.string().max(5000, 'Summary cannot exceed 5000 characters').optional(),
    findings: z.string().max(5000, 'Findings cannot exceed 5000 characters').optional(),
    recommendations: z.string().max(5000, 'Recommendations cannot exceed 5000 characters').optional(),
    attachments: z.array(z.object({
      name: z.string().max(255, 'Attachment name cannot exceed 255 characters'),
      url: z.string().url('Invalid attachment URL'),
      type: z.string().max(50, 'Attachment type cannot exceed 50 characters'),
      size: z.number().min(0, 'Attachment size must be positive')
    })).optional().default([]),
    customFields: z.record(z.any()).optional().default({})
  }),
  
  // Validation Requirements
  requiresCoordinatorReview: z.boolean().default(true),
  
  requiresAdminApproval: z.boolean().default(false),
  
  // Metadata
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters')).optional().default([]),
  
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional().transform(val => val?.trim()),
  
  // Submission tracking
  submittedBy: z.string().uuid('Invalid submitter ID')
})

const reportSubmissionUpdateSchema = reportSubmissionCreateSchema.partial().extend({
  id: z.string().uuid('Invalid submission ID'),
  status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_requested']).optional()
})

const reportSubmissionQuerySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).refine(val => val > 0, 'Page must be greater than 0'),
  limit: z.string().transform(val => parseInt(val) || 10).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  therapistId: z.string().uuid('Invalid therapist ID').optional(),
  patientId: z.string().uuid('Invalid patient ID').optional(),
  reportType: z.enum(['therapeutic_plan', 'progress_report', 'final_report', 'session_notes', 'assessment', 'evaluation']).optional(),
  status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_requested']).optional(),
  submissionType: z.enum(['draft', 'final']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format').optional(),
  search: z.string().max(100, 'Search term cannot exceed 100 characters').optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'submittedAt', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
})

// GET /api/report-submission - Get report submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const validation = reportSubmissionQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      therapistId: searchParams.get('therapistId'),
      patientId: searchParams.get('patientId'),
      reportType: searchParams.get('reportType'),
      status: searchParams.get('status'),
      submissionType: searchParams.get('submissionType'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { page, limit, therapistId, patientId, reportType, status, submissionType, startDate, endDate, search, sortBy, sortOrder } = validation.data

    // Build where clause
    const whereClause: any = {}
    
    if (therapistId) {
      whereClause.therapistId = therapistId
    }
    
    if (patientId) {
      whereClause.patientId = patientId
    }
    
    if (reportType) {
      whereClause.reportType = reportType
    }
    
    if (status) {
      whereClause.status = status
    }
    
    if (submissionType) {
      whereClause.submissionType = submissionType
    }
    
    if (startDate) {
      whereClause.createdAt = { gte: new Date(startDate) }
    }
    
    if (endDate) {
      whereClause.createdAt = { 
        ...whereClause.createdAt,
        lte: new Date(endDate) 
      }
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get submissions with related data
    const [submissions, totalCount] = await Promise.all([
      db.reportSubmission.findMany({
        where: whereClause,
        include: {
          therapist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          submittedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      db.reportSubmission.count({ where: whereClause })
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return NextResponse.json({
      success: true,
      data: {
        submissions,
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
    console.error('Error fetching report submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/report-submission - Create a new report submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = reportSubmissionCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if therapist exists
    const therapist = await db.therapist.findUnique({
      where: { id: validatedData.therapistId }
    })

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

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

    // Check if submitter exists
    const submitter = await db.user.findUnique({
      where: { id: validatedData.submittedBy }
    })

    if (!submitter) {
      return NextResponse.json(
        { error: 'Submitter not found' },
        { status: 404 }
      )
    }

    // Validate report exists
    let reportExists = false
    switch (validatedData.reportType) {
      case 'therapeutic_plan':
        reportExists = !!(await db.therapeuticPlan.findUnique({ where: { id: validatedData.reportId } }))
        break
      case 'progress_report':
        reportExists = !!(await db.progressReport.findUnique({ where: { id: validatedData.reportId } }))
        break
      case 'final_report':
        reportExists = !!(await db.finalReport.findUnique({ where: { id: validatedData.reportId } }))
        break
      default:
        reportExists = true // For other report types, assume exists
    }

    if (!reportExists) {
      return NextResponse.json(
        { error: `${validatedData.reportType} not found` },
        { status: 404 }
      )
    }

    // Check for duplicate submissions
    const existingSubmission = await db.reportSubmission.findFirst({
      where: {
        reportId: validatedData.reportId,
        reportType: validatedData.reportType,
        status: { in: ['draft', 'submitted', 'under_review'] }
      }
    })

    if (existingSubmission && validatedData.submissionType === 'final') {
      return NextResponse.json(
        { error: 'A submission already exists for this report' },
        { status: 400 }
      )
    }

    // Determine initial status
    const initialStatus = validatedData.submissionType === 'draft' ? 'draft' : 'submitted'

    // Create submission
    const submission = await db.reportSubmission.create({
      data: {
        reportType: validatedData.reportType,
        reportId: validatedData.reportId,
        therapistId: validatedData.therapistId,
        patientId: validatedData.patientId,
        title: validatedData.title,
        description: validatedData.description,
        submissionType: validatedData.submissionType,
        content: validatedData.content,
        requiresCoordinatorReview: validatedData.requiresCoordinatorReview,
        requiresAdminApproval: validatedData.requiresAdminApproval,
        tags: validatedData.tags,
        notes: validatedData.notes,
        submittedBy: validatedData.submittedBy,
        status: initialStatus,
        submittedAt: validatedData.submissionType === 'final' ? new Date() : null
      },
      include: {
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        submittedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Send notification if final submission
    if (validatedData.submissionType === 'final' && validatedData.requiresCoordinatorReview) {
      // TODO: Send notification to coordinators
      console.log('Notification: New report submission requires coordinator review')
    }

    return NextResponse.json({
      success: true,
      message: `Report ${initialStatus === 'draft' ? 'saved as draft' : 'submitted'} successfully`,
      data: submission
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating report submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/report-submission - Update a report submission
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = reportSubmissionUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // Check if submission exists
    const existingSubmission = await db.reportSubmission.findUnique({
      where: { id: validatedData.id }
    })

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check if submission can be edited
    if (existingSubmission.status === 'approved') {
      return NextResponse.json(
        { error: 'Cannot edit approved submission' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.description) updateData.description = validatedData.description
    if (validatedData.content) updateData.content = validatedData.content
    if (validatedData.tags) updateData.tags = validatedData.tags
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.status) updateData.status = validatedData.status
    
    // Handle submission type change from draft to final
    if (validatedData.submissionType === 'final' && existingSubmission.submissionType === 'draft') {
      updateData.submissionType = 'final'
      updateData.status = 'submitted'
      updateData.submittedAt = new Date()
    }

    // Update submission
    const updatedSubmission = await db.reportSubmission.update({
      where: { id: validatedData.id },
      data: updateData,
      include: {
        therapist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        submittedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Send notification if submission type changed to final
    if (validatedData.submissionType === 'final' && existingSubmission.submissionType === 'draft') {
      // TODO: Send notification to coordinators
      console.log('Notification: Report submission updated and requires coordinator review')
    }

    return NextResponse.json({
      success: true,
      message: 'Submission updated successfully',
      data: updatedSubmission
    })

  } catch (error) {
    console.error('Error updating report submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/report-submission - Delete a report submission (draft only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    // Check if submission exists
    const submission = await db.reportSubmission.findUnique({
      where: { id }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Only allow deletion of drafts
    if (submission.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft submissions can be deleted' },
        { status: 400 }
      )
    }

    // Delete submission
    await db.reportSubmission.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Draft submission deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting report submission:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
